-- Auditoría 5 (19-nov-2026): tope de sesiones por IP (15) atómico y devolución de la sesión si la 1.ª prueba falla.
-- Antes: vto_take4 leía el contador de sesiones y luego sumaba (dos primeras pruebas simultáneas de fichas distintas
-- pasaban las dos con 14/15 → 16). Ahora la reserva es un upsert condicional (... do update ... where n < tope),
-- que toma el candado de la fila: bajo concurrencia solo pasan las que caben.
-- Marca de ficha 'tok:<tok>#s': n=1 sesión contada, n=0 sesión devuelta (no se borran filas).
-- vto_refund2 (misma firma): si con la devolución la ficha queda en 0 pruebas hoy, devuelve también su sesión.
-- REVERSIBLE: el bloque «DOWN» al final restaura las definiciones anteriores tal cual (copiadas de la base el 19-nov-2026).

create or replace function public.vto_take4(p_ip text, p_tenant text, p_max_ip int default 120, p_tok text default null, p_max_tok int default 8, p_max_sess int default 15)
returns jsonb language plpgsql security definer set search_path to 'public' as $$
declare r jsonb; nuevo boolean := false; hoy date := (now() at time zone 'America/Bogota')::date;
  kmark text := case when p_tok is null then null else 'tok:' || p_tok || '#s' end;
  ksess text := p_ip || '#ses:' || p_tenant; m int; ns int;
begin
  if kmark is not null then
    -- ¿1.ª prueba de esta ficha hoy? (marca nueva, o devuelta antes con n=0). El upsert bloquea la fila: una sola gana.
    insert into public.vto_usage(ip_hash, dia, n) values (kmark, hoy, 1)
    on conflict (ip_hash, dia) do update set n = 1 where public.vto_usage.n = 0
    returning public.vto_usage.n into m;
    if m is not null then
      -- reserva atómica de la sesión: solo suma si cabe en el tope
      insert into public.vto_usage(ip_hash, dia, n) values (ksess, hoy, 1)
      on conflict (ip_hash, dia) do update set n = public.vto_usage.n + 1 where public.vto_usage.n < p_max_sess
      returning public.vto_usage.n into ns;
      if ns is null or ns > p_max_sess then
        update public.vto_usage set n = 0 where ip_hash = kmark and dia = hoy;
        if ns is not null then update public.vto_usage set n = greatest(n - 1, 0) where ip_hash = ksess and dia = hoy; end if;
        return jsonb_build_object('ok', false, 'motivo', 'limite_ip');
      end if;
      nuevo := true;
    end if;
  end if;
  r := public.vto_take3(p_ip, p_tenant, p_max_ip, p_tok, p_max_tok);
  if nuevo and not coalesce((r->>'ok')::boolean, false) then
    -- la prueba no se hizo: la ficha no gastó sesión
    update public.vto_usage set n = 0 where ip_hash = kmark and dia = hoy;
    update public.vto_usage set n = greatest(n - 1, 0) where ip_hash = ksess and dia = hoy;
  end if;
  return r;
end $$;
revoke all on function public.vto_take4(text,text,int,text,int,int) from public, anon, authenticated;
grant execute on function public.vto_take4(text,text,int,text,int,int) to service_role;

create or replace function public.vto_refund2(p_ip text, p_tenant text, p_tok text default null)
returns void language plpgsql security definer set search_path to 'public' as $$
declare hoy date := (now() at time zone 'America/Bogota')::date; nt int;
begin
  update public.vto_usage set n = greatest(n - 1, 0) where dia = hoy and ip_hash in (p_ip, 't:' || p_tenant);
  if p_tok is not null then
    update public.vto_usage set n = n - 1 where dia = hoy and ip_hash = 'tok:' || p_tok and n > 0 returning n into nt;
    if nt = 0 then -- la ficha no tiene ninguna prueba hecha hoy: su sesión vuelve al cupo de la IP
      update public.vto_usage set n = 0 where dia = hoy and ip_hash = 'tok:' || p_tok || '#s' and n = 1;
      if found then
        update public.vto_usage set n = greatest(n - 1, 0) where dia = hoy and ip_hash = p_ip || '#ses:' || p_tenant;
      end if;
    end if;
  end if;
  update public.vto_tenants set usadas_mes = greatest(usadas_mes - 1, 0) where id = p_tenant;
end $$;
revoke all on function public.vto_refund2(text,text,text) from public, anon, authenticated;
grant execute on function public.vto_refund2(text,text,text) to service_role;

/* ---------- DOWN (revertir: ejecutar este bloque) ----------
create or replace function public.vto_take4(p_ip text, p_tenant text, p_max_ip int default 120, p_tok text default null, p_max_tok int default 8, p_max_sess int default 15)
returns jsonb language plpgsql security definer set search_path to 'public' as $$
declare r jsonb; nuevo boolean := false; hoy date := (now() at time zone 'America/Bogota')::date;
  kmark text := case when p_tok is null then null else 'tok:' || p_tok || '#s' end;
  ksess text := p_ip || '#ses:' || p_tenant; ns int; ins int;
begin
  if kmark is not null and not exists (select 1 from public.vto_usage where ip_hash = kmark and dia = hoy) then
    select coalesce((select n from public.vto_usage where ip_hash = ksess and dia = hoy), 0) into ns;
    if ns >= p_max_sess then return jsonb_build_object('ok', false, 'motivo', 'limite_ip'); end if;
    nuevo := true;
  end if;
  r := public.vto_take3(p_ip, p_tenant, p_max_ip, p_tok, p_max_tok);
  if coalesce((r->>'ok')::boolean, false) and nuevo then
    insert into public.vto_usage(ip_hash, dia, n) values (kmark, hoy, 1) on conflict (ip_hash, dia) do nothing;
    get diagnostics ins = row_count;
    if ins > 0 then
      insert into public.vto_usage(ip_hash, dia, n) values (ksess, hoy, 1)
      on conflict (ip_hash, dia) do update set n = public.vto_usage.n + 1;
    end if;
  end if;
  return r;
end $$;
create or replace function public.vto_refund2(p_ip text, p_tenant text, p_tok text default null)
returns void language sql security definer set search_path to 'public' as $$
  update public.vto_usage set n = greatest(n - 1, 0)
   where dia = (now() at time zone 'America/Bogota')::date and ip_hash in (p_ip, 'tok:' || coalesce(p_tok, '-'), 't:' || p_tenant);
  update public.vto_tenants set usadas_mes = greatest(usadas_mes - 1, 0) where id = p_tenant;
$$;
-- (si la versión nueva dejó marcas con n=0, la versión anterior las trata como «ya contada»: sin efecto en cupos)
---------------------------------------------------------- */
