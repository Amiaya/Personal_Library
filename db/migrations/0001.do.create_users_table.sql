create or replace function on_update_timestamp()
  returns trigger as $$
  BEGIN
    NEW.updated_at = now();
    RETURN NEW;
  END;
$$ language 'plpgsql';

create table if not exists users  (
  id uuid not null primary key default public.gen_random_uuid(),
  created_at timestamptz not null default current_timestamp,
  updated_at timestamptz not null default current_timestamp,
  first_name text not null,
  last_name text not null,
  email text unique not null,
  password_hash bytea not null,
  account_type text default 'user'
);

create trigger users_updated_at before update
on users for each row execute procedure 
on_update_timestamp();