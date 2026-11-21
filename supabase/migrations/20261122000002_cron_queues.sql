-- [쉬운 설명] DB 예약 작업(5분마다 만료 주문 정리)과 메일 재시도 대기열(pgmq).
-- 리뷰 순서: 8단계 (docs/REVIEW_GUIDE.md 참고)

-- 백그라운드 작업: Supabase Cron(pg_cron) + Queues(pgmq)
-- [미확인] 무료 플랜에서 두 확장을 켤 수 있는지 아직 확인하지 않았습니다.
--   이 마이그레이션이 실패하면: 대시보드 Database → Extensions 에서 pg_cron, pgmq 를 켠 뒤 다시 실행하고,
--   그래도 안 되면 Upstash QStash 로 대체합니다 (docs/SETUP_CHECKLIST.md 참고).

create extension if not exists pg_cron;
create extension if not exists pgmq;

-- 1) 결제 대기 30분 초과 주문 만료 + 재고 복구, 5분마다
select cron.schedule(
  'expire-pending-orders',
  '*/5 * * * *',
  $$ select public.expire_pending_orders(); $$
);

-- 2) 메일 재발송 큐
select pgmq.create('email_retry');

-- 서버(secret key)에서 rpc 로 부르는 얇은 래퍼
create or replace function public.enqueue_email(p_payload jsonb)
returns bigint
language sql
security definer
set search_path = ''
as $$
  select * from pgmq.send('email_retry', p_payload);
$$;

-- 메시지를 꺼내 60초 동안 숨김 (처리 실패 시 다시 보임)
create or replace function public.read_email_jobs(p_qty int default 10)
returns table (msg_id bigint, read_ct int, message jsonb)
language sql
security definer
set search_path = ''
as $$
  select msg_id, read_ct, message from pgmq.read('email_retry', 60, p_qty);
$$;

create or replace function public.archive_email_job(p_msg_id bigint)
returns boolean
language sql
security definer
set search_path = ''
as $$
  select pgmq.archive('email_retry', p_msg_id);
$$;

revoke execute on function public.enqueue_email(jsonb) from public, anon, authenticated;
revoke execute on function public.read_email_jobs(int) from public, anon, authenticated;
revoke execute on function public.archive_email_job(bigint) from public, anon, authenticated;

-- 3) 메일 재시도 실행: 10분마다 앱의 /api/jobs/email-retry 를 호출 (pg_net 필요)
--    사이트 주소와 CRON_SECRET 이 정해진 뒤 SQL Editor 에서 아래 주석을 풀어 직접 실행하세요.
--    비밀값은 마이그레이션 파일에 적지 말고 Vault 에 넣습니다.
--
-- create extension if not exists pg_net;
-- select vault.create_secret('https://<your-app>.vercel.app', 'site_url');
-- select vault.create_secret('<CRON_SECRET 값>', 'cron_secret');
-- select cron.schedule(
--   'email-retry',
--   '*/10 * * * *',
--   $$
--   select net.http_post(
--     url := (select decrypted_secret from vault.decrypted_secrets where name = 'site_url') || '/api/jobs/email-retry',
--     headers := jsonb_build_object(
--       'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret')
--     )
--   );
--   $$
-- );
