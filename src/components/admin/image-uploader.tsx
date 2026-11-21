"use client";

import { createBrowserClient } from "@supabase/ssr";
import { useState } from "react";
import { Upload } from "tus-js-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { publicEnv } from "@/env.client";

const BUCKET = "product-images";
const MAX_BYTES = 10 * 1024 * 1024; // 10MB
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/avif"];

/**
 * 상품 이미지 추가
 *  - Supabase 모드: tus(이어 올리기) 프로토콜로 Storage 에 업로드. 끊겨도 이어서 올라감.
 *    Supabase 문서 기준 청크 크기는 6MB 고정. [미확인] 무료 플랜에서 tus 업로드가 되는지는 연결 후 확인
 *  - 메모리 모드: 업로드할 곳이 없으므로 이미지 주소(URL 또는 /products/xxx.svg) 직접 입력만 가능
 */
export function ImageUploader({ uploadEnabled, onAdd }: { uploadEnabled: boolean; onAdd: (url: string) => void }) {
  const [url, setUrl] = useState("");
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function upload(file: File) {
    setError(null);
    if (!ALLOWED.includes(file.type)) return setError("JPG·PNG·WEBP·AVIF 만 올릴 수 있습니다.");
    if (file.size > MAX_BYTES) return setError("10MB 이하 파일만 올릴 수 있습니다.");
    if (!publicEnv.supabaseUrl || !publicEnv.supabasePublishableKey) return setError("Supabase 설정이 없습니다.");

    const supabase = createBrowserClient(publicEnv.supabaseUrl, publicEnv.supabasePublishableKey);
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) return setError("로그인이 만료되었습니다. 다시 로그인해 주세요.");

    const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const objectName = `products/${crypto.randomUUID()}.${ext}`;
    setProgress(0);

    const task = new Upload(file, {
      endpoint: `${publicEnv.supabaseUrl}/storage/v1/upload/resumable`,
      retryDelays: [0, 3000, 5000, 10000, 20000],
      headers: { authorization: `Bearer ${token}`, "x-upsert": "false" },
      uploadDataDuringCreation: true,
      removeFingerprintOnSuccess: true,
      metadata: { bucketName: BUCKET, objectName, contentType: file.type, cacheControl: "31536000" },
      chunkSize: 6 * 1024 * 1024,
      onError: (e) => {
        setProgress(null);
        setError(`업로드 실패: ${e.message}`);
      },
      onProgress: (sent, total) => setProgress(Math.round((sent / total) * 100)),
      onSuccess: () => {
        setProgress(null);
        onAdd(`${publicEnv.supabaseUrl}/storage/v1/object/public/${BUCKET}/${objectName}`);
      },
    });
    // 같은 파일을 전에 올리다 끊겼으면 이어서 올림
    const previous = await task.findPreviousUploads();
    if (previous[0]) task.resumeFromPreviousUpload(previous[0]);
    task.start();
  }

  return (
    <div className="flex flex-col gap-2">
      {uploadEnabled ? (
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <Input
            type="file"
            accept={ALLOWED.join(",")}
            disabled={progress !== null}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void upload(f);
              e.target.value = "";
            }}
          />
        </label>
      ) : (
        <p className="text-xs text-muted-foreground">
          데모 모드에서는 파일 업로드 대신 이미지 주소를 입력합니다. (예: /products/stainless-tumbler.svg)
        </p>
      )}
      {progress !== null ? <p className="text-xs">업로드 중… {progress}%</p> : null}
      <div className="flex gap-2">
        <Input placeholder="이미지 주소" value={url} onChange={(e) => setUrl(e.target.value)} />
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            const v = url.trim();
            if (!v) return;
            if (!/^(https:\/\/|\/)/.test(v)) return setError("https:// 또는 / 로 시작하는 주소만 됩니다.");
            onAdd(v);
            setUrl("");
            setError(null);
          }}
        >
          추가
        </Button>
      </div>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
