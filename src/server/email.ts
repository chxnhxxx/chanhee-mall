/**
 * [쉬운 설명] 주문 확인·발송·취소 메일 보내기(Resend). 키가 없으면 메일 내용을 서버 화면(콘솔)에 출력만 합니다.
 * 보내기 실패한 메일은 대기열에 넣어 나중에 다시 보냅니다.
 * 리뷰 순서: 8단계 (docs/REVIEW_GUIDE.md 참고)
 */
import "server-only";
import { Resend } from "resend";
import OrderEmail, { type OrderEmailKind, subjectFor } from "@/emails/order-email";
import { env, features, siteUrl } from "@/env";
import type { Order } from "@/lib/domain";
import { repo } from "@/server/repo";
import { serviceClient } from "@/server/supabase/clients";

/**
 * 주문 알림 메일.
 * - Resend 키가 없으면 서버 콘솔에 내용만 출력
 * - 발송 실패 시 재시도 큐에 넣음 (Supabase: pgmq 'email_retry' / 메모리: 프로세스 배열)
 * - 도메인 인증 전에는 EMAIL_DEV_REDIRECT_TO(본인 메일)로 모두 보냄 [미확인: Resend 정책]
 */
export type EmailJob = { kind: OrderEmailKind; orderNumber: string };

let _resend: Resend | undefined;
const resend = () => (_resend ??= new Resend(env.RESEND_API_KEY));

const g = globalThis as unknown as { __chmEmailQueue?: EmailJob[] };
const memQueue = () => (g.__chmEmailQueue ??= []);

async function deliver(kind: OrderEmailKind, order: Order) {
  const profile = await repo().getProfile(order.userId);
  if (!profile) throw new Error("수신자 없음");
  const to = env.EMAIL_DEV_REDIRECT_TO ?? profile.email;
  const subject = subjectFor(kind, order);

  if (!features.resend) {
    console.info(`[email:console] to=${to} subject="${subject}" total=${order.totalAmount}`);
    return;
  }
  const { error } = await resend().emails.send({
    from: env.EMAIL_FROM!,
    to,
    subject,
    react: OrderEmail({ kind, order, siteUrl: siteUrl() }),
  });
  if (error) throw new Error(`Resend: ${error.message}`);
}

async function enqueue(job: EmailJob) {
  if (features.supabase) {
    const { error } = await serviceClient().rpc("enqueue_email", { p_payload: job });
    if (error) console.error("[email] 큐 등록 실패", error.message);
  } else {
    memQueue().push(job);
  }
}

export async function sendOrderEmail(kind: OrderEmailKind, order: Order) {
  try {
    await deliver(kind, order);
  } catch (e) {
    console.error("[email] 발송 실패 → 재시도 큐", e);
    await enqueue({ kind, orderNumber: order.orderNumber });
  }
}

/** 재시도 큐 처리 (/api/jobs/email-retry 에서 호출). 5번 넘게 실패하면 버림 */
export async function processEmailRetries(): Promise<{ sent: number; failed: number }> {
  let sent = 0;
  let failed = 0;
  if (features.supabase) {
    const { data, error } = await serviceClient().rpc("read_email_jobs", { p_qty: 10 });
    if (error) throw new Error(error.message);
    for (const msg of data) {
      const job = msg.message as unknown as EmailJob;
      try {
        const order = await repo().getOrderByNumber(job.orderNumber);
        if (order) await deliver(job.kind, order);
        await serviceClient().rpc("archive_email_job", { p_msg_id: msg.msg_id });
        sent++;
      } catch {
        failed++;
        if (msg.read_ct >= 5) await serviceClient().rpc("archive_email_job", { p_msg_id: msg.msg_id });
      }
    }
  } else {
    const jobs = memQueue().splice(0);
    for (const job of jobs) {
      try {
        const order = await repo().getOrderByNumber(job.orderNumber);
        if (order) await deliver(job.kind, order);
        sent++;
      } catch {
        failed++;
      }
    }
  }
  return { sent, failed };
}
