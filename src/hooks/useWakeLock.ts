"use client";

import { useEffect } from "react";

type WakeLockSentinelLike = {
  release: () => Promise<void>;
  addEventListener: (type: "release", cb: () => void) => void;
};

type WakeLockApi = {
  request: (type: "screen") => Promise<WakeLockSentinelLike>;
};

export function useWakeLock(active: boolean) {
  useEffect(() => {
    if (!active) return;
    if (typeof navigator === "undefined") return;
    const wakeLock = (navigator as Navigator & { wakeLock?: WakeLockApi })
      .wakeLock;
    if (!wakeLock) return;

    let released = false;
    let lock: WakeLockSentinelLike | null = null;

    const acquire = async () => {
      try {
        lock = await wakeLock.request("screen");
      } catch {
        // unavailable or denied; silently degrade
      }
    };

    const onVisibility = () => {
      if (document.visibilityState === "visible" && !released) acquire();
    };

    acquire();
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      released = true;
      document.removeEventListener("visibilitychange", onVisibility);
      lock?.release().catch(() => {});
    };
  }, [active]);
}
