import { GoogleAnalytics } from "@next/third-parties/google";
import { publicEnv } from "@/env.client";

/** GA4. 측정 ID 가 없으면 아무것도 넣지 않음 */
export function Analytics() {
  if (!publicEnv.gaId) return null;
  return <GoogleAnalytics gaId={publicEnv.gaId} />;
}
