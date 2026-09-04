"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import type { MediaAsset } from "@/lib/media";

export default function BusinessImageCard({
  image,
  video,
  caption,
  description,
}: {
  image: MediaAsset;
  /** Optional short hover-preview clip. Loaded on demand (preload="none") — never fetched until the first hover/tap. */
  video?: string;
  caption: string;
  description?: string;
}) {
  const [failed, setFailed] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const activate = () => {
    if (!video || videoFailed) return;
    setIsActive(true);
    videoRef.current?.play().catch(() => {});
  };

  const deactivate = () => {
    if (!video) return;
    setIsActive(false);
    const v = videoRef.current;
    if (v) {
      v.pause();
      v.currentTime = 0;
    }
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">
      <div
        className="relative h-44 w-full overflow-hidden bg-black"
        onMouseEnter={activate}
        onMouseLeave={deactivate}
        onTouchStart={() => (isActive ? deactivate() : activate())}
      >
        {failed ? (
          <div className="absolute inset-0 flex items-center justify-center bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-zinc-800 via-black to-black">
            <span className="text-sm font-medium text-zinc-500">{caption}</span>
          </div>
        ) : (
          <>
            <Image
              src={image.src}
              alt={image.alt}
              fill
              priority
              sizes="(min-width: 1024px) 25vw, 50vw"
              className={`object-cover transition-transform duration-500 ease-out ${
                video ? "" : "hover:scale-105"
              }`}
              onError={() => setFailed(true)}
            />
            {video && !videoFailed && (
              <video
                ref={videoRef}
                className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ease-in-out ${
                  isActive ? "opacity-100" : "opacity-0"
                }`}
                muted
                loop
                playsInline
                preload="none"
                poster={image.src}
                onError={() => setVideoFailed(true)}
              >
                <source src={video} type="video/mp4" />
              </video>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent pointer-events-none" />
          </>
        )}
      </div>
      <div className="p-5">
        <p className="font-medium text-white">{caption}</p>
        {description && <p className="mt-1.5 text-sm text-zinc-400 leading-relaxed">{description}</p>}
      </div>
    </div>
  );
}
