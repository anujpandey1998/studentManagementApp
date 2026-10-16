begin;

create or replace function public.submit_assignment(
  target_assignment uuid,
  submitted_file_path text
) returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  target_institute uuid;
  target_section uuid;
  target_student uuid;
  submission_id uuid;
begin
  if current_user_id is null then
    raise exception 'Authentication is required';
  end if;
  if submitted_file_path is null or length(submitted_file_path) > 512 then
    raise exception 'A valid submission file path is required';
  end if;

  select a.institute_id, a.section_id
  into target_institute, target_section
  from public.assignments a
  where a.id = target_assignment;

  if target_institute is null
    or not private.in_section(target_institute, target_section) then
    raise exception 'Assignment is not available to this student';
  end if;
  if submitted_file_path !~ (
    '^' || target_institute::text || '/' ||
    (select s.id::text from public.students s
      where s.institute_id = target_institute and s.user_id = current_user_id) ||
    '/' || target_assignment::text || '/[^/]+$'
  ) then
    raise exception 'Submission file path is outside the student assignment folder';
  end if;

  select s.id into target_student
  from public.students s
  where s.institute_id = target_institute and s.user_id = current_user_id;

  insert into public.submissions(
    institute_id, section_id, assignment_id, student_id, file_path,
    submitted_at, feedback, graded_at
  )
  values (
    target_institute, target_section, target_assignment, target_student,
    submitted_file_path, now(), null, null
  )
  on conflict (assignment_id, student_id) do update
  set file_path = excluded.file_path,
      submitted_at = excluded.submitted_at
  returning id into submission_id;

  return submission_id;
end;
$$;

revoke all on function public.submit_assignment(uuid, text) from public, anon;
grant execute on function public.submit_assignment(uuid, text) to authenticated;

create or replace function public.grade_submission(
  target_submission uuid,
  feedback_text text
) returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  graded_submission uuid;
begin
  if feedback_text is null or length(trim(feedback_text)) = 0
    or length(feedback_text) > 4000 then
    raise exception 'Feedback must contain 1 to 4000 characters';
  end if;
  update public.submissions s
  set feedback = trim(feedback_text), graded_at = now()
  from public.assignments a
  where s.id = target_submission
    and a.id = s.assignment_id
    and private.teaches(a.institute_id, a.section_id, a.subject_id)
  returning s.id into graded_submission;
  if graded_submission is null then
    raise exception 'Submission not found or teacher is not assigned';
  end if;
  return graded_submission;
end;
$$;

revoke all on function public.grade_submission(uuid, text) from public, anon;
grant execute on function public.grade_submission(uuid, text) to authenticated;

create policy student_upload_assignment_file
on storage.objects for insert to authenticated
with check (
  bucket_id = 'assignment-files'
  and (storage.foldername(name))[1] =
    (select u.institute_id::text from public.users u where u.id = (select auth.uid()))
  and (storage.foldername(name))[2] =
    (select s.id::text from public.students s where s.user_id = (select auth.uid()))
  and exists (
    select 1 from public.assignments a
    where a.id::text = (storage.foldername(name))[3]
      and a.institute_id::text = (storage.foldername(name))[1]
      and a.section_id = (
        select s.section_id from public.students s
        where s.user_id = (select auth.uid())
      )
  )
);

create policy assignment_file_read
on storage.objects for select to authenticated
using (
  bucket_id = 'assignment-files'
  and (
    (
      (storage.foldername(name))[2] =
        (select s.id::text from public.students s where s.user_id = (select auth.uid()))
      and exists (
        select 1 from public.assignments a
        where a.id::text = (storage.foldername(name))[3]
          and a.institute_id::text = (storage.foldername(name))[1]
      )
    )
    or exists (
      select 1 from public.assignments a
      where a.id::text = (storage.foldername(name))[3]
        and a.institute_id::text = (storage.foldername(name))[1]
        and private.teaches(a.institute_id, a.section_id, a.subject_id)
    )
    or private.is_admin(
      ((storage.foldername(name))[1])::uuid
    )
  )
);

create policy admin_manage_student_photos
on storage.objects for all to authenticated
using (
  bucket_id = 'student-photos'
  and private.is_admin(((storage.foldername(name))[1])::uuid)
)
with check (
  bucket_id = 'student-photos'
  and private.is_admin(((storage.foldername(name))[1])::uuid)
);

create policy member_read_student_photos
on storage.objects for select to authenticated
using (
  bucket_id = 'student-photos'
  and exists (
    select 1 from public.students s
    where s.id::text = (storage.foldername(name))[2]
      and s.institute_id::text = (storage.foldername(name))[1]
      and (
        private.owns_student(s.institute_id, s.id)
        or private.teaches(s.institute_id, s.section_id)
        or private.is_admin(s.institute_id)
      )
  )
);

commit;
