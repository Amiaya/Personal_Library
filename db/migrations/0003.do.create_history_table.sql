begin;

create table if not exists histories (
  id uuid not null primary key default public.gen_random_uuid(),
  created_at timestamptz not null default current_timestamp,
  updated_at timestamptz not null default current_timestamp,
  user_id uuid not null,
  file_id uuid not null,
  file_status text not null,

  foreign key (user_id) references users (id) on delete cascade,
  foreign key (file_id) references files (id) on delete cascade
);

create trigger histories_updated_at before update
on histories for each row execute procedure 
on_update_timestamp();

commit;