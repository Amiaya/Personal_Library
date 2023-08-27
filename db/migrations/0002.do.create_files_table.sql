begin;

create table if not exists files (
  id uuid not null primary key default public.gen_random_uuid(),
  created_at timestamptz not null default current_timestamp,
  updated_at timestamptz not null default current_timestamp,
  owner_id uuid not null,
  file_name text not null,
  description text,
  file text,
  size integer,

  foreign key (owner_id) references users (id) on delete cascade
);

create trigger files_updated_at before update
on files for each row execute procedure 
on_update_timestamp();

commit;