-- Supabase SQL Editor에서 실행하세요. 재실행해도 정책 중복 오류가 나지 않도록 구성했습니다.
create table if not exists public.submissions (
  id bigint generated always as identity primary key,
  student_name text not null,
  image_path text not null,
  reply text not null,
  created_at timestamptz not null default now()
);
alter table public.submissions enable row level security;
grant select on public.submissions to authenticated;
revoke all on public.submissions from anon;
drop policy if exists "teachers can read" on public.submissions;
create policy "teachers can read" on public.submissions for select to authenticated using (true);

insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('worksheets','worksheets',false,10485760,array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public=false,file_size_limit=10485760,allowed_mime_types=array['image/jpeg','image/png','image/webp'];
drop policy if exists "students can upload worksheets" on storage.objects;
create policy "students can upload worksheets" on storage.objects for insert to anon
with check (bucket_id='worksheets' and lower(storage.extension(name)) in ('jpg','jpeg','png','webp'));
drop policy if exists "teachers can view worksheets" on storage.objects;
create policy "teachers can view worksheets" on storage.objects for select to authenticated using (bucket_id='worksheets');
