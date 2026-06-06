import { CrossedRackets } from "./PadelGraphics";
import { cn } from "@/lib/utils";
import player1 from "../assets/players/player1.png";
import player2 from "../assets/players/player2.png";
import player3 from "../assets/players/player3.png";
import player4 from "../assets/players/player4.png";

export type Team = "A" | "B";

interface PlayerSlot {
  name: string;
  imageUrl?: string;
  isYou?: boolean;
}

// Prepopulated demo roster so the court always shows four bettable players.
const TEST_PLAYERS: { teamA: PlayerSlot[]; teamB: PlayerSlot[] } = {
  teamA: [
    { name: "Diego Storm", imageUrl: player1 },
    { name: "Lucia Vega", imageUrl: player2 },
  ],
  teamB: [
    { name: "Marco Reyes", imageUrl: player3 },
    { name: "Sofia Cruz", imageUrl: player4 },
  ],
};

function PlayerAvatar({ player }: { player: PlayerSlot }) {
  return (
    <div className="flex w-16 flex-col items-center gap-1 sm:w-20">
      <div
        className={cn(
          "relative aspect-[3/4] w-full overflow-hidden rounded-lg border-2 shadow-lg",
          player.isYou ? "border-primary" : "border-white/40",
        )}
      >
        {player.imageUrl ? (
          <img
            src={player.imageUrl}
            alt={player.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-white/5">
            <CrossedRackets className="h-7 w-7 text-white/30" />
          </div>
        )}
        {player.isYou && (
          <span className="absolute left-0 top-0 bg-primary px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">
            You
          </span>
        )}
      </div>
      <span className="max-w-full truncate text-center text-[11px] font-semibold text-white/90">
        {player.name}
      </span>
    </div>
  );
}

export function WagerCourt({
  backedTeam,
  onBackTeam,
}: {
  backedTeam: Team | null;
  onBackTeam: (t: Team) => void;
}) {
  const teamA = TEST_PLAYERS.teamA;
  const teamB = TEST_PLAYERS.teamB;

  // Prepopulated next match: 2 days out at 18:30, rendered in the user's locale.
  const nextMatch = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    d.setHours(18, 30, 0, 0);
    return d;
  })();
  const matchDate = nextMatch.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const matchTime = nextMatch.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });

  const half =
    "absolute inset-y-3 w-1/2 cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary";

  return (
    <div className="rounded-2xl border bg-card p-4 sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-heading text-lg font-extrabold">Match Court</h3>
        <span className="text-xs text-muted-foreground">
          Tap a side to back a team
        </span>
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-primary">
            Next Match
          </p>
          <p className="text-sm font-semibold">
            {teamA.map((p) => p.name).join(" & ")}
            <span className="mx-1.5 text-muted-foreground">vs</span>
            {teamB.map((p) => p.name).join(" & ")}
          </p>
        </div>
        <div className="text-right">
          <p className="font-heading text-sm font-extrabold">{matchDate}</p>
          <p className="text-xs text-muted-foreground">{matchTime}</p>
        </div>
      </div>

      <div
        className="relative mx-auto aspect-[16/10] w-full max-w-2xl overflow-hidden rounded-xl"
        style={{ background: "linear-gradient(135deg,#0c1f3a,#13294d)" }}
      >
        {/* Clickable team halves */}
        <button
          type="button"
          aria-label="Back Team A"
          aria-pressed={backedTeam === "A"}
          onClick={() => onBackTeam("A")}
          className={cn(
            half,
            "left-0",
            backedTeam === "A" ? "bg-primary/25" : "hover:bg-white/5",
          )}
        />
        <button
          type="button"
          aria-label="Back Team B"
          aria-pressed={backedTeam === "B"}
          onClick={() => onBackTeam("B")}
          className={cn(
            half,
            "right-0",
            backedTeam === "B" ? "bg-primary/25" : "hover:bg-white/5",
          )}
        />

        {/* Court boundary + service lines */}
        <div className="pointer-events-none absolute inset-3 rounded-md border-2 border-white/70" />
        <div className="pointer-events-none absolute inset-y-3 left-1/2 top-0 w-1 -translate-x-1/2 bg-white/80" />
        <div className="pointer-events-none absolute left-1/4 right-1/4 top-1/2 h-px -translate-y-1/2 bg-white/50" />
        <div className="pointer-events-none absolute bottom-3 left-[35%] top-3 w-px bg-white/40" />
        <div className="pointer-events-none absolute bottom-3 right-[35%] top-3 w-px bg-white/40" />

        {/* Net badge */}
        <div className="pointer-events-none absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 rounded-full bg-black/70 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-widest text-white ring-1 ring-white/30">
          VS
        </div>

        {/* Backed labels */}
        {backedTeam && (
          <div
            className={cn(
              "pointer-events-none absolute top-4 z-10 rounded bg-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white",
              backedTeam === "A" ? "left-4" : "right-4",
            )}
          >
            Backed
          </div>
        )}

        {/* Team A players (left half) */}
        <div className="pointer-events-none absolute left-[6%] top-[14%] z-[5]">
          <PlayerAvatar player={teamA[0]} />
        </div>
        <div className="pointer-events-none absolute bottom-[14%] left-[26%] z-[5]">
          <PlayerAvatar player={teamA[1]} />
        </div>

        {/* Team B players (right half) */}
        <div className="pointer-events-none absolute right-[6%] top-[14%] z-[5]">
          <PlayerAvatar player={teamB[0]} />
        </div>
        <div className="pointer-events-none absolute bottom-[14%] right-[26%] z-[5]">
          <PlayerAvatar player={teamB[1]} />
        </div>
      </div>

      {/* Backing controls */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        {(["A", "B"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => onBackTeam(t)}
            className={cn(
              "rounded-lg border-2 px-4 py-2 text-sm font-bold transition-colors",
              backedTeam === t
                ? "border-primary bg-primary text-white"
                : "border-muted bg-transparent hover:border-primary/50",
            )}
          >
            Back Team {t}
          </button>
        ))}
      </div>
    </div>
  );
}
