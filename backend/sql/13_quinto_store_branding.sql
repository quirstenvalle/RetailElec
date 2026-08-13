-- Rename store branding to Quinto Store (safe to re-run)
update public.store_settings
set
  store_name = 'Quinto Store',
  contact_email = coalesce(nullif(contact_email, ''), 'admin@quinto.store'),
  updated_at = now()
where id = 1;
