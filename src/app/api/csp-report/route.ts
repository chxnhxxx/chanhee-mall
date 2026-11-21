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
