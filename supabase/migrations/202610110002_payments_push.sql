begin;

create table public.device_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  institute_id uuid not null references public.institutes(id) on delete cascade,
  token text not null unique,
  platform text not null check (platform in ('android', 'ios')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (institute_id, user_id)
    references public.users(institute_id, id) on delete cascade
);

alter table public.device_tokens enable row level security;
revoke all on public.device_tokens from anon, authenticated;
grant select, insert, update, delete on public.device_tokens to authenticated;
create policy own_device_tokens on public.device_tokens
for all to authenticated
using (user_id = (select auth.uid()))
with check (
  user_id = (select auth.uid())
  and private.is_member(institute_id)
);

alter table public.notices
  add column push_claimed_at timestamptz,
  add column push_sent_at timestamptz;

create function public.claim_notice_push(target_notice uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  claimed boolean;
begin
  update public.notices n
  set push_claimed_at = now()
  where n.id = target_notice
    and n.created_by = (select auth.uid())
    and n.push_sent_at is null
    and (
      n.push_claimed_at is null
      or n.push_claimed_at < now() - interval '2 minutes'
    )
    and (
      private.is_admin(n.institute_id)
      or (
        n.section_id is not null
        and private.teaches(n.institute_id, n.section_id)
      )
    );
  claimed := found;
  return claimed;
end;
$$;
revoke all on function public.claim_notice_push(uuid) from public, anon;
grant execute on function public.claim_notice_push(uuid) to authenticated;

create or replace function public.mock_fee_payment(
  target_fee uuid,
  target_user uuid,
  idempotency_key uuid
) returns public.payments
language plpgsql
security definer
set search_path = ''
as $$
declare
  fee_row public.fees;
  invoice_amount bigint;
  amount_paid bigint;
  payment_row public.payments;
  payment_reference text;
begin
  if target_user is null or idempotency_key is null then
    raise exception 'User and idempotency key are required';
  end if;
  payment_reference :=
    'MOCK:' || target_user::text || ':' || target_fee::text || ':' ||
    idempotency_key::text;

  select p.* into payment_row
  from public.payments p
  where p.provider_reference = payment_reference;
  if found then
    return payment_row;
  end if;

  select f.* into fee_row
  from public.fees f
  where f.id = target_fee
    and exists (
      select 1 from public.students s
      where s.id = f.student_id
        and s.institute_id = f.institute_id
        and s.user_id = target_user
    )
  for update;
  if not found then
    raise exception 'Invoice not found for this student';
  end if;

  select fs.amount_paise into invoice_amount
  from public.fee_structures fs
  where fs.id = fee_row.structure_id
    and fs.institute_id = fee_row.institute_id;
  if invoice_amount is null or invoice_amount <= 0 then
    raise exception 'Invoice amount is invalid';
  end if;

  select coalesce(sum(p.amount_paise), 0)::bigint into amount_paid
  from public.payments p
  where p.fee_id = target_fee and p.status = 'succeeded';

  if amount_paid >= invoice_amount then
    raise exception 'Invoice has already been paid';
  end if;

  insert into public.payments(
    institute_id, student_id, fee_id, amount_paise, status,
    provider_reference, paid_at
  )
  values (
    fee_row.institute_id, fee_row.student_id, fee_row.id,
    invoice_amount - amount_paid, 'succeeded', payment_reference, now()
  )
  returning * into payment_row;

  return payment_row;
end;
$$;

revoke all on function public.mock_fee_payment(uuid, uuid, uuid)
  from public, anon, authenticated;
grant execute on function public.mock_fee_payment(uuid, uuid, uuid)
  to service_role;

commit;
