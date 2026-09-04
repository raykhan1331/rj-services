"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import type { MediaAsset } from "@/lib/media";

/**
 * Hero visual: shows the existing hero image by default. On desktop hover
 * (mouseenter, no click) it crossfades to a short muted preview video; on
 * touch devices the same visual toggles on tap, since there is no hover.
 * If the video ever fails to load, `videoFailed` keeps it hidden and the
 * hero image remains the only thing shown — never a broken video area.
 */
export default function HeroHoverVideo({
  image,
  videoSrc,
}: {
  image: MediaAsset;
  videoSrc: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isActive, setIsActive] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);

  const activate = () => {
    if (videoFailed) return;
    setIsActive(true);
    videoRef.current?.play().catch(() => {});
  };

  const deactivate = () => {
    setIsActive(false);
    const v = videoRef.current;
    if (v) {
      v.pause();
      v.currentTime = 0;
    }
  };

  return (
    <div
      className="relative mt-4 w-full max-w-4xl aspect-[16/8] sm:aspect-[16/6] rounded-3xl overflow-hidden border border-white/10"
      onMouseEnter={activate}
      onMouseLeave={deactivate}
      onTouchStart={() => (isActive ? deactivate() : activate())}
    >
      <Image
        src={image.src}
        alt={image.alt}
        fill
        priority
        sizes="(min-width: 1024px) 896px, 100vw"
        className="object-cover"
      />
      {!videoFailed && (
        <video
          ref={videoRef}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ease-in-out ${
            isActive ? "opacity-100" : "opacity-0"
          }`}
          muted
          loop
          playsInline
          preload="auto"
          poster={image.src}
          onError={() => setVideoFailed(true)}
        >
          <source src={videoSrc} type="video/mp4" />
        </video>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
    </div>
  );
}
