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
  active = true,
  ...props
}: Omit<VideoHTMLAttributes<HTMLVideoElement>, "src"> & { src: string; active?: boolean }) {
  const ref = useRef<HTMLVideoElement>(null);
  const restoring = useRef<Playback | null>(null);
  const activeRef = useRef(active);
  activeRef.current = active;

  useEffect(() => {
    if (active) return;
    ref.current?.pause();
    if (restoring.current) restoring.current.paused = true;
  }, [active]);

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
    let cancelled = false;
    const resume = () => {
      video.removeEventListener("seeked", resume);
      if (cancelled) return;
      restoring.current = null;
      if (!activeRef.current || playback.paused || playback.ended) video.pause();
      else void video.play().catch(() => {
        // Browser autoplay restrictions can require another user gesture.
      });
    };
    const restore = () => {
      video.playbackRate = playback.rate;
      video.volume = playback.volume;
      video.muted = playback.muted;
      const end = Number.isFinite(video.duration) ? video.duration : playback.time;
      // WebKit must finish restoring the position before resuming playback.
      // Retain the snapshot while seeking in case another URL arrives first.
      video.addEventListener("seeked", resume, { once: true });
      video.currentTime = Math.max(0, Math.min(playback.time, end));
      if (!video.seeking) resume();
    };
    video.addEventListener("loadedmetadata", restore, { once: true });
    if (sourceChanged) {
      video.src = src;
      video.load();
    } else if (video.readyState >= 1) {
      // React Strict Mode replays effects while retaining the DOM player.
      restore();
    }
    return () => {
      cancelled = true;
      video.removeEventListener("loadedmetadata", restore);
      video.removeEventListener("seeked", resume);
    };
  }, [src]);

  // React must not replace src before the effect can snapshot the old player.
  return <video {...props} ref={ref} />;
}
