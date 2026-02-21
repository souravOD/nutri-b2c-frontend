"use client";

import { useEffect, useRef } from "react";
import type { BarcodeResult } from "@/lib/barcode"; // <-- use the shared type

type LivePreviewProps = {
  deviceId?: string;
  onDetected: (r: BarcodeResult) => void | Promise<void>; // <-- allow async
  onError: (e: Error) => void;
};

export function LivePreview({ deviceId, onDetected, onError }: LivePreviewProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Normalize any vendor/library result to the shared shape
  function normalize(raw: unknown): BarcodeResult {
    const obj = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : null
    if (obj && typeof obj.value === "string") {
      return { value: obj.value, format: typeof obj.format === "string" ? obj.format : undefined, raw };
    }
    // common alt field is "text"
    if (obj && typeof obj.text === "string") {
      return { value: obj.text, format: typeof obj.format === "string" ? obj.format : undefined, raw };
    }
    return { value: String(raw ?? ""), raw };
  }

  useEffect(() => {
    let cancelled = false;

    async function start() {
      try {
        const constraints: MediaStreamConstraints = {
          video: deviceId
            ? { deviceId: { exact: deviceId } }
            : { facingMode: { ideal: "environment" } },
          audio: false,
        };
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        if (cancelled) return;
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        // TODO: hook your barcode library here. When it yields a result `raw`,
        // call: onDetected(normalize(raw));
      } catch (e: unknown) {
        if (!cancelled) onError(e instanceof Error ? e : new Error(String(e)));
      }
    }

    start();
    return () => {
      cancelled = true;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, [deviceId, onError]);

  return (
    <div className="relative w-full overflow-hidden rounded-xl">
      <video ref={videoRef} className="w-full h-auto" muted playsInline />
    </div>
  );
}

export default LivePreview;
