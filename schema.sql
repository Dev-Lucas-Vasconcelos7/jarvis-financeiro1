create table if not exists users(id serial primary key, email text unique not null, hash text not null, created_at timestamptz default now());
create table if not exists services(id serial primary key, user_id int not null references users(id) on delete cascade, name text not null, date date not null, value numeric(12,2) not null, pay text, note text);
create table if not exists expenses(id serial primary key, user_id int not null references users(id) on delete cascade, descr text not null, date date not null, value numeric(12,2) not null);
create table if not exists goals(user_id int primary key references users(id) on delete cascade, goal numeric(12,2) not null default 0);
create index if not exists s_u on services(user_id, date);
create index if not exists e_u on expenses(user_id, date);
