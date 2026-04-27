create table public.profiles (
  id uuid primary key references auth.users (id),
  email text not null,
  full_name text,
  role text not null,
  client_id uuid references public.clients (id) on delete set null,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint profiles_role_check
    check (role in ('platform_admin', 'client_owner', 'client_staff'))
);

create trigger set_profiles_updated_at
before update on public.profiles
for each row
execute function app_private.set_updated_at();
