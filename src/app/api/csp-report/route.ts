/**
 * [쉬운 설명] 브라우저가 '보안 규칙(CSP)에 어긋나는 스크립트가 있었다'고 보고하는 주소. 서버 기록에 남깁니다.
 * 리뷰 순서: 8단계 (docs/REVIEW_GUIDE.md 참고)
 */
import { NextResponse } from "next/server";

/** CSP 위반 보고 수신 (Report-Only 기간에 무엇이 막힐지 서버 로그로 확인) */
export async function POST(request: Request) {
  try {
    const body = await request.text();
    console.warn("[csp-report]", body.slice(0, 2000));
  } catch {
    // 무시
  }
  return new NextResponse(null, { status: 204 });
}
