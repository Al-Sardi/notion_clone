-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Drop existing table if it exists
drop table if exists public.documents;

-- Create documents table
create table public.documents (
    id uuid primary key default uuid_generate_v4(),
    title text not null,
    user_id text not null,
    is_archived boolean default false,
    is_published boolean default false,
    parent_id uuid references public.documents(id),
    content jsonb,
    cover_image text,
    icon text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.documents enable row level security;

-- Create indexes
create index if not exists documents_user_id_idx on public.documents(user_id);
create index if not exists documents_parent_id_idx on public.documents(parent_id);

-- Create RLS policies
create policy "Enable read access for users" on public.documents
    for select using (auth.uid()::text = user_id);

create policy "Enable insert access for users" on public.documents
    for insert with check (auth.uid()::text = user_id);

create policy "Enable update access for users" on public.documents
    for update using (auth.uid()::text = user_id);

create policy "Enable delete access for users" on public.documents
    for delete using (auth.uid()::text = user_id);

-- Create updated_at trigger
create or replace function public.handle_updated_at()
returns trigger as $$
begin
    new.updated_at = timezone('utc'::text, now());
    return new;
end;
$$ language plpgsql;

create trigger handle_documents_updated_at
    before update on public.documents
    for each row
    execute function public.handle_updated_at(); 