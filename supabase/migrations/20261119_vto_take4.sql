-- Auditoría 4 (CGNAT): la sesión por IP se cuenta en la PRIMERA prueba de cada ficha (tok), no en cada carga de cfg.
-- Envuelve vto_take3 sin cambiarla. Reversible: drop function public.vto_take4(text,text,int,text,int,int);
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
revoke all on function public.vto_take4(text,text,int,text,int,int) from public, anon, authenticated;
grant execute on function public.vto_take4(text,text,int,text,int,int) to service_role;
