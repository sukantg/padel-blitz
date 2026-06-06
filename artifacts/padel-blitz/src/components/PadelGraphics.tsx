import { cn } from "@/lib/utils";

type IconProps = {
  className?: string;
  style?: React.CSSProperties;
};

/** A padel racket: rounded perforated head + handle. */
export function PadelRacket({ className, style }: IconProps) {
  return (
    <svg
      viewBox="0 0 100 140"
      fill="none"
      className={className}
      style={style}
      aria-hidden="true"
    >
      <path
        d="M50 6c24 0 40 18 40 42 0 26-18 44-40 44S10 74 10 48C10 24 26 6 50 6Z"
        stroke="currentColor"
        strokeWidth="6"
      />
      <path
        d="M38 92l-6 30a8 8 0 0 0 8 10h20a8 8 0 0 0 8-10l-6-30"
        stroke="currentColor"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {[
        [38, 38],
        [50, 34],
        [62, 38],
        [32, 50],
        [44, 50],
        [56, 50],
        [68, 50],
        [38, 62],
        [50, 62],
        [62, 62],
        [44, 74],
        [56, 74],
      ].map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r="3.4" fill="currentColor" />
      ))}
    </svg>
  );
}

/** A padel ball with a curved seam. */
export function PadelBall({ className, style }: IconProps) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      className={className}
      style={style}
      aria-hidden="true"
    >
      <circle cx="50" cy="50" r="42" stroke="currentColor" strokeWidth="6" />
      <path
        d="M18 34c18 8 46 8 64 0M18 66c18-8 46-8 64 0"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Two crossed rackets — a crest motif. */
export function CrossedRackets({ className, style }: IconProps) {
  return (
    <svg
      viewBox="0 0 140 140"
      fill="none"
      className={className}
      style={style}
      aria-hidden="true"
    >
      <g transform="rotate(-30 70 70)">
        <PadelRacketPath />
      </g>
      <g transform="rotate(30 70 70)">
        <PadelRacketPath />
      </g>
    </svg>
  );
}

function PadelRacketPath() {
  return (
    <>
      <path
        d="M70 14c20 0 33 15 33 35 0 22-15 37-33 37S37 71 37 49c0-20 13-35 33-35Z"
        stroke="currentColor"
        strokeWidth="6"
      />
      <path
        d="M60 86l-5 32a8 8 0 0 0 8 10h14a8 8 0 0 0 8-10l-5-32"
        stroke="currentColor"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </>
  );
}

/** A padel court diagram seen from above. */
export function PadelCourt({ className, style }: IconProps) {
  return (
    <svg
      viewBox="0 0 200 120"
      fill="none"
      className={className}
      style={style}
      aria-hidden="true"
    >
      <rect x="6" y="6" width="188" height="108" rx="6" stroke="currentColor" strokeWidth="5" />
      <line x1="100" y1="6" x2="100" y2="114" stroke="currentColor" strokeWidth="4" strokeDasharray="8 8" />
      <line x1="48" y1="30" x2="152" y2="30" stroke="currentColor" strokeWidth="4" />
      <line x1="48" y1="90" x2="152" y2="90" stroke="currentColor" strokeWidth="4" />
      <line x1="100" y1="30" x2="100" y2="90" stroke="currentColor" strokeWidth="4" />
    </svg>
  );
}

/** A motion-streaked ball, conveying a fast shot. */
export function BallStreak({ className, style }: IconProps) {
  return (
    <svg
      viewBox="0 0 160 100"
      fill="none"
      className={className}
      style={style}
      aria-hidden="true"
    >
      <path d="M8 50h60M24 34h44M24 66h44" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
      <circle cx="118" cy="50" r="30" stroke="currentColor" strokeWidth="6" />
      <path d="M96 38c14 6 30 6 44 0M96 62c14-6 30-6 44 0" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

/**
 * A fixed, full-page decorative layer scattering padel graphics behind the app.
 * Pointer-events disabled so it never blocks interaction; very low opacity.
 */
export function PadelBackdrop({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "pointer-events-none fixed inset-0 z-0 overflow-hidden text-primary",
        className
      )}
      aria-hidden="true"
    >
      <PadelRacket className="absolute -left-10 top-24 w-44 rotate-[18deg] opacity-[0.11]" />
      <PadelBall className="absolute left-[18%] top-[8%] w-16 opacity-[0.12]" />
      <CrossedRackets className="absolute right-[6%] top-[16%] w-56 rotate-[8deg] opacity-[0.10]" />
      <PadelCourt className="absolute -right-12 bottom-[22%] w-72 -rotate-6 opacity-[0.10]" />
      <BallStreak className="absolute left-[5%] bottom-[10%] w-52 opacity-[0.11]" />
      <PadelBall className="absolute right-[24%] bottom-[8%] w-12 opacity-[0.13]" />
      <PadelRacket className="absolute right-[42%] top-[3%] w-20 -rotate-[22deg] opacity-[0.09]" />
    </div>
  );
}
