-- vto_take3 (auditoría 3, 19-nov-2026): igual que vto_take2, pero cuando la prueba se rechaza por algo que no es culpa
-- de la IP (sesión, tienda inactiva, tope diario de la tienda, cuota del mes) devuelve los contadores en la MISMA
-- transacción y con UNA sola sentencia (antes el servidor leía y restaba aparte: no atómico y no devolvía la sesión).
--   limite_ip            → no devuelve nada (la IP pasó su tope)
--   limite_sesion        → devuelve la IP
--   tienda_no_registrada / tienda_inactiva → devuelve IP y sesión
--   limite_tienda_dia / cuota_agotada      → devuelve IP, sesión y el contador diario de la tienda
create or replace function public.vto_take3(p_ip text, p_tenant text, p_max_ip integer default 60, p_tok text default null, p_max_tok integer default 8)
 returns jsonb language plpgsql security definer set search_path to 'public'
as $function$
declare n int; ns int := null; t public.vto_tenants%rowtype; tope int; motivo text := null; dev text[] := '{}';
  m text := to_char(now() at time zone 'America/Bogota','YYYY-MM'); hoy date := (now() at time zone 'America/Bogota')::date;
  ktok text := case when p_tok is null then null else 'tok:' || p_tok end;
begin
  insert into public.vto_usage(ip_hash, dia, n) values (p_ip, hoy, 1)
  on conflict (ip_hash, dia) do update set n = public.vto_usage.n + 1 returning public.vto_usage.n into n;
  if n > p_max_ip then return jsonb_build_object('ok', false, 'motivo', 'limite_ip'); end if;
  if ktok is not null then
    insert into public.vto_usage(ip_hash, dia, n) values (ktok, hoy, 1)
    on conflict (ip_hash, dia) do update set n = public.vto_usage.n + 1 returning public.vto_usage.n into ns;
    if ns > p_max_tok then motivo := 'limite_sesion'; dev := array[p_ip]; end if;
  end if;
  if motivo is null then
    select * into t from public.vto_tenants where id = p_tenant for update;
    if not found then motivo := 'tienda_no_registrada';
    elsif t.estado <> 'activo' then motivo := 'tienda_inactiva';
    elsif t.vence is not null and t.vence < hoy and t.plan <> 'prueba' then motivo := 'tienda_inactiva';
    end if;
    if motivo is not null then dev := array_remove(array[p_ip, ktok], null); end if;
  end if;
  if motivo is null then
    if t.vence is not null and t.vence < hoy and t.plan = 'prueba' then
      update public.vto_tenants set plan = 'gratis', cuota_mes = 30, vence = null where id = p_tenant;
      t.plan := 'gratis'; t.cuota_mes := 30; t.vence := null;
    end if;
    tope := case when coalesce(t.config->>'tope_dia', '') ~ '^\d{1,6}$' then (t.config->>'tope_dia')::int
                 else case t.plan when 'prueba' then 40 when 'gratis' then 15 when 'demo' then 150 else null end end;
    if tope is not null then
      insert into public.vto_usage(ip_hash, dia, n) values ('t:' || p_tenant, hoy, 1)
      on conflict (ip_hash, dia) do update set n = public.vto_usage.n + 1 returning public.vto_usage.n into n;
      if n > tope then motivo := 'limite_tienda_dia'; end if;
    end if;
    if motivo is null then
      if t.mes <> m then t.usadas_mes := 0; end if;
      if t.usadas_mes >= t.cuota_mes then motivo := 'cuota_agotada'; end if;
    end if;
    if motivo is not null then dev := array_remove(array[p_ip, ktok, case when tope is not null then 't:' || p_tenant end], null); end if;
  end if;
  if motivo is not null then
    if cardinality(dev) > 0 then
      update public.vto_usage u set n = greatest(u.n - 1, 0) where u.dia = hoy and u.ip_hash = any(dev); -- devolución atómica, una sola sentencia
    end if;
    return jsonb_build_object('ok', false, 'motivo', motivo);
  end if;
  update public.vto_tenants set mes = m, usadas_mes = t.usadas_mes + 1 where id = p_tenant;
  return jsonb_build_object('ok', true, 'restan', t.cuota_mes - t.usadas_mes - 1, 'plan', t.plan,
    'restan_sesion', case when ns is null then null else greatest(p_max_tok - ns, 0) end);
end $function$;
revoke all on function public.vto_take3(text, text, integer, text, integer) from public, anon, authenticated;
grant execute on function public.vto_take3(text, text, integer, text, integer) to service_role;
