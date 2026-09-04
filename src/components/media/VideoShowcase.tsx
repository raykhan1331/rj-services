import { IllustrationWorkspace } from "./illustrations";

export interface VideoSource {
  src: string;
  type: string;
}

/**
 * Premium video/motion section. Fully wired for a real video (muted, loop,
 * playsInline, lazy via preload="none", poster) — pass `sources` once a
 * licensed clip is available and it renders immediately, no other changes
 * needed. With no sources (the current state — no licensed footage exists
 * yet), it never renders a `<video>` tag at all, so there is no risk of a
 * broken/404 video; instead it shows a subtle animated placeholder scene
 * so the section still feels premium and alive.
 */
export default function VideoShowcase({
  sources = [],
  poster,
  title = "A modern way to run business, banking, and growth",
  caption = "UK company formation, banking, KYC, and e-commerce — handled with a premium, hands-on service.",
}: {
  sources?: VideoSource[];
  poster?: string;
  title?: string;
  caption?: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-black">
      <div className="relative aspect-video w-full">
        {sources.length > 0 ? (
          <video
            className="h-full w-full object-cover"
            autoPlay
            muted
            loop
            playsInline
            preload="none"
            poster={poster}
          >
            {sources.map((s) => (
              <source key={s.src} src={s.src} type={s.type} />
            ))}
          </video>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-zinc-800/70 via-black to-black">
            <div className="h-40 w-40 sm:h-56 sm:w-56 opacity-90 [&>svg]:h-full [&>svg]:w-full">
              <IllustrationWorkspace />
            </div>
          </div>
        )}
      </div>
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/70 to-transparent p-6 sm:p-8">
        <h3 className="text-xl sm:text-2xl font-semibold text-white max-w-lg">{title}</h3>
        <p className="mt-2 text-sm text-zinc-300 max-w-lg">{caption}</p>
      </div>
    </div>
  );
}
