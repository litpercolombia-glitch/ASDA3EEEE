-- Auditoría 8 (19-nov-2026): tope de 6 pruebas de ropa con moderación fallida por IP y día, reservado de forma atómica.
-- Antes: vto-api leía el contador (vto_get_utc) y sumaba después (vto_add_utc): N pruebas simultáneas con 5/6
-- pasaban todas. Ahora se RESERVA antes de moderar con un UPDATE condicional (... where n < p_max), que toma el
-- candado de la fila: bajo concurrencia solo pasan las que caben. Si la moderación pasa limpia, se LIBERA (p_n = -1).
-- La liberación nunca deja el contador negativo (greatest(n - 1, 0)). Usa la misma tabla vto_usage (sin filas nuevas
-- distintas de las que ya creaba vto_add_utc con la misma clave).
--   reserva: vto_mod_cupo(clave, 6, 1)  → n nuevo (1..6) o -1 si ya estaba lleno (no suma)
--   libera:  vto_mod_cupo(clave, 6, -1) → n nuevo (>= 0)
-- REVERSIBLE: ver bloque DOWN al final (vto_add_utc y vto_get_utc no se tocan).

create or replace function public.vto_mod_cupo(p_key text, p_max int, p_n int default 1)
returns int language plpgsql security definer set search_path to 'public' as $$
declare v int; d date := (now() at time zone 'UTC')::date;
begin
  if p_n >= 0 then
    insert into public.vto_usage(ip_hash, dia, n) values (p_key, d, 0) on conflict (ip_hash, dia) do nothing;
    update public.vto_usage set n = n + 1 where ip_hash = p_key and dia = d and n < p_max returning n into v;
    return coalesce(v, -1);
  end if;
  update public.vto_usage set n = greatest(n - 1, 0) where ip_hash = p_key and dia = d returning n into v;
  return coalesce(v, 0);
end $$;
revoke all on function public.vto_mod_cupo(text,int,int) from public, anon, authenticated;
grant execute on function public.vto_mod_cupo(text,int,int) to service_role;

-- DOWN (para revertir):
-- drop function if exists public.vto_mod_cupo(text,int,int);
