"use client";

import { useEffect, useRef, type VideoHTMLAttributes } from "react";

type Playback = {
  time: number;
  paused: boolean;
  ended: boolean;
  rate: number;
  volume: number;
  muted: boolean;
};

/** Renew an expiring URL without losing the viewer's playback position. */
export function BusinessVideo({
  src,
  ...props
}: Omit<VideoHTMLAttributes<HTMLVideoElement>, "src"> & { src: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const restoring = useRef<Playback | null>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    const sourceChanged = video.getAttribute("src") !== src;
    if (!sourceChanged && !restoring.current) return;
    // If another URL arrives before metadata, retain the original snapshot.
    const playback = restoring.current || {
      time: video.currentTime,
      paused: video.paused,
      ended: video.ended,
      rate: video.playbackRate,
      volume: video.volume,
      muted: video.muted,
    };
    restoring.current = playback;
    const restore = () => {
      video.playbackRate = playback.rate;
      video.volume = playback.volume;
      video.muted = playback.muted;
      const end = Number.isFinite(video.duration) ? video.duration : playback.time;
      video.currentTime = Math.max(0, Math.min(playback.time, end));
      restoring.current = null;
      if (playback.paused || playback.ended) video.pause();
      else void video.play().catch(() => {
        // Browser autoplay restrictions can require another user gesture.
      });
    };
    video.addEventListener("loadedmetadata", restore, { once: true });
    if (sourceChanged) {
      video.src = src;
      video.load();
    } else if (video.readyState >= 1) {
      // React Strict Mode replays effects while retaining the DOM player.
      restore();
    }
    return () => video.removeEventListener("loadedmetadata", restore);
  }, [src]);

  // React must not replace src before the effect can snapshot the old player.
  return <video {...props} ref={ref} />;
}
