/**
 * [쉬운 설명] GA4(방문 분석) 스크립트를 페이지에 넣는 부품. 측정 ID 가 없으면 아무것도 안 넣습니다.
 * 리뷰 순서: 8단계 (docs/REVIEW_GUIDE.md 참고)
 */
import { GoogleAnalytics } from "@next/third-parties/google";
import { publicEnv } from "@/env.client";

/** GA4. 측정 ID 가 없으면 아무것도 넣지 않음 */
export function Analytics() {
  if (!publicEnv.gaId) return null;
  return <GoogleAnalytics gaId={publicEnv.gaId} />;
}
