import { useRef, useState } from "react";
import { usePlayerStats, scoreSession, type MatchOutcome, type MatchType } from "../hooks/usePlayerStats";
import { useGenerateNft } from "@workspace/api-client-react";
import { getTier } from "../config";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useContract } from "../hooks/useContract";
import { AiCoachTab } from "./AiCoachTab";
import { CrossedRackets, PadelRacket, PadelBall } from "./PadelGraphics";
import { motion } from "framer-motion";
import { Info } from "lucide-react";
import { ethers } from "ethers";

const SKILLS = [
  {
    key: "netDominance",
    label: "Net Dominance",
    hint: "Holding the net, crisp volleys, not getting passed.",
    means:
      "In padel, whoever controls the net wins the point. This measures how well you won the net position and kept it.",
    low: "You got stuck at the back of the court a lot, or when you were at the net, your volleys were weak and allowed opponents to easily pass you.",
    high: "You aggressively took the net, hit crisp, deep volleys, and reacted fast to block their shots.",
  },
  {
    key: "overheadAttack",
    label: "Overhead / Attack",
    hint: "Smashes, bandejas and viboras finished cleanly.",
    means:
      "This rates your aerial game when the opponents hit a high ball to you. It covers the standard flat smash, the Bandeja (a control overhead setup shot), and the Vibora (a sliced, aggressive overhead).",
    low: "Your smashes hit the back glass too hard and bounced right back to the opponents for an easy counter-attack, or you hit them into the net.",
    high: "Your overheads were placed deep into the corners, had heavy spin, or won the point cleanly by bouncing out of the court.",
  },
  {
    key: "glassDefense",
    label: "Glass Play & Defending",
    hint: "Letting the ball pass to play it off the back & side glass.",
    means:
      "Beginners panic and try to hit the ball before it hits the walls. Advanced players let the ball pass them, hit the glass, slow down, and then play it comfortably.",
    low: "You turned around and rushed shots, got jammed up against the walls, or misread the angles coming off the side glass.",
    high: "You calmly let the ball hit the back wall, trusted the bounce, and used the glass to set up a smooth, controlled return.",
  },
  {
    key: "patienceConsistency",
    label: "Patience & Consistency",
    hint: "Playing like a wall until opponents miss.",
    means:
      "This tracks your unforced errors. Padel is won by the team that makes the fewest mistakes, not the team that hits the most flashy winners.",
    low: "You lost patience during long rallies and went for risky, low-percentage killer shots that flew into the net or out of bounds.",
    high: "You were a brick wall. You kept the ball deep and safe, smoothly waiting out a 15-shot rally until the opponents finally cracked and messed up.",
  },
  {
    key: "lobQuality",
    label: "Lob Quality",
    hint: "Deep, high lobs that push opponents off the net.",
    means:
      "The lob is padel's key tool to flip a point: a deep, high ball over the net players forces them back off the net so you can take it.",
    low: "Your lobs were too short or too low, letting opponents smash them away, or you sent them long out the back.",
    high: "You floated deep, high lobs right onto the back glass, pushing opponents off the net and turning defense into attack.",
  },
] as const;

type SkillKey = (typeof SKILLS)[number]["key"];

const SKILL_ABBR: Record<SkillKey, string> = {
  netDominance: "ND",
  overheadAttack: "OA",
  glassDefense: "GD",
  patienceConsistency: "PC",
  lobQuality: "LQ",
};

interface PlayerNftTabProps {
  // Lifted to the parent so the generated card survives in-app tab switches
  // (the parent stays mounted) while still resetting on a full page reload.
  generatedImage: string | null;
  setGeneratedImage: (url: string | null) => void;
}

export function PlayerNftTab({ generatedImage, setGeneratedImage }: PlayerNftTabProps) {
  const { address, contract, isConnected, connectWallet } = useContract();
  const { stats, addSession, updateLatestImage } = usePlayerStats(address);
  const generateNft = useGenerateNft();

  const [skills, setSkills] = useState<Record<SkillKey, number>>({
    netDominance: 5,
    overheadAttack: 5,
    glassDefense: 5,
    patienceConsistency: 5,
    lobQuality: 5,
  });

  const [outcome, setOutcome] = useState<MatchOutcome>("win");
  const [scoreline, setScoreline] = useState("");
  const [matchType, setMatchType] = useState<MatchType>("friendly");
  const [partnerName, setPartnerName] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [country, setCountry] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [description, setDescription] = useState("");

  const [mintTx, setMintTx] = useState("");

  const formRef = useRef<HTMLDivElement>(null);

  const handleUpdateStats = () => {
    setMintTx("");
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPhotoUrl(typeof reader.result === "string" ? reader.result : "");
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const setSkill = (key: SkillKey, value: number) =>
    setSkills((prev) => ({ ...prev, [key]: value }));

  const handleSave = () => {
    const sessionStats = { ...skills };
    const meta = {
      outcome,
      scoreline: scoreline.trim(),
      matchType,
      partnerName: partnerName.trim(),
      playerName: playerName.trim(),
      country: country.trim(),
      description: description.trim(),
    };

    addSession(sessionStats, meta, undefined);
  };

  const handleMint = async () => {
    try {
      // Work from a saved session if there is one; otherwise build the card
      // straight from the current inputs so minting works without logging a match.
      const existing = stats.sessions[stats.sessions.length - 1];
      const sessionStats = existing ? existing.stats : { ...skills };
      const meta = existing?.meta ?? {
        outcome,
        scoreline: scoreline.trim(),
        matchType,
        partnerName: partnerName.trim(),
        playerName: playerName.trim(),
        country: country.trim(),
        description: description.trim(),
      };
      const avg =
        Object.values(sessionStats).reduce((a, b) => a + b, 0) /
        (Object.keys(sessionStats).length || 1);
      const tierName = existing ? stats.currentTier : getTier(avg).name;
      const score = existing ? stats.cumulativeScore : avg;

      // Step 1: generate the superhero card. This never touches the wallet —
      // generation must not trigger a connection prompt or any chain calls.
      // Gate on session-scoped state so a fresh load always regenerates.
      let imageUrl = generatedImage ?? undefined;
      if (!imageUrl) {
        try {
          const res = await generateNft.mutateAsync({
            data: {
              tier: tierName,
              skillScore: score,
              ...sessionStats,
              playerName: meta.playerName ?? "",
              description: meta.description ?? "",
              ...(photoUrl ? { referenceImage: photoUrl } : {}),
              matchOutcome: meta.outcome,
              matchType: meta.matchType,
            },
          });
          if (res && res.imageUrl) {
            if (existing) updateLatestImage(res.imageUrl);
            else addSession(sessionStats, meta, res.imageUrl);
            setGeneratedImage(res.imageUrl);
          }
        } catch (e) {
          console.error(e);
        }
        // Stop after generating. The on-chain mint (and any wallet connection)
        // happens only on the next click, once the card already exists.
        return;
      }

      // Step 2: mint the already-generated card on-chain.
      if (!isConnected) {
        await connectWallet();
        return;
      }
      if (!contract) return;

      const metadata = {
        name: `Padel Blitz - ${tierName}`,
        description: `Padel Blitz Player Card. Score: ${score.toFixed(1)}`,
        image: imageUrl,
        attributes: [
          { trait_type: "Tier", value: tierName },
          { trait_type: "Score", value: score.toFixed(1) },
          { trait_type: "Net Dominance", value: sessionStats.netDominance ?? 0 },
          { trait_type: "Overhead/Attack", value: sessionStats.overheadAttack ?? 0 },
          { trait_type: "Glass Defense", value: sessionStats.glassDefense ?? 0 },
          { trait_type: "Patience & Consistency", value: sessionStats.patienceConsistency ?? 0 },
          { trait_type: "Lob Quality", value: sessionStats.lobQuality ?? 0 },
        ],
      };

      const tokenURI = "data:application/json;base64," + btoa(JSON.stringify(metadata));
      const tx = await contract.storeNFT(tokenURI);
      const receipt = await tx.wait();
      setMintTx(receipt.hash);
    } catch (e) {
      console.error(e);
    }
  };

  const latestSession = stats.sessions[stats.sessions.length - 1];
  const currentTier = getTier(stats.cumulativeScore);

  return (
    <div className="mx-auto max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-8">
      <div className="flex flex-col gap-6">
        <Card ref={formRef}>
          <CardHeader>
            <CardTitle>Log a new match</CardTitle>
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="space-y-4">
              <h3 className="font-heading font-extrabold uppercase tracking-wider text-xs text-muted-foreground">
                Core Match Data
              </h3>

              <div className="space-y-2">
                <label className="font-medium text-sm">Match Outcome</label>
                <ToggleGroup
                  type="single"
                  value={outcome}
                  onValueChange={(v) => v && setOutcome(v as MatchOutcome)}
                  className="grid grid-cols-2 gap-2"
                >
                  <ToggleGroupItem value="win" className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground border">
                    Win
                  </ToggleGroupItem>
                  <ToggleGroupItem value="loss" className="data-[state=on]:bg-foreground data-[state=on]:text-background border">
                    Loss
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>

              <div className="space-y-2">
                <label className="font-medium text-sm">Scoreline</label>
                <Input
                  value={scoreline}
                  onChange={(e) => setScoreline(e.target.value)}
                  placeholder="e.g. 6-4, 3-6, 7-5"
                />
              </div>

              <div className="space-y-2">
                <label className="font-medium text-sm">Match Type</label>
                <ToggleGroup
                  type="single"
                  value={matchType}
                  onValueChange={(v) => v && setMatchType(v as MatchType)}
                  className="grid grid-cols-2 gap-2"
                >
                  <ToggleGroupItem value="friendly" className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground border">
                    Friendly / Social
                  </ToggleGroupItem>
                  <ToggleGroupItem value="competitive" className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground border">
                    Competitive
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>

              <div className="space-y-2">
                <label className="font-medium text-sm">Partner Name</label>
                <Input
                  value={partnerName}
                  onChange={(e) => setPartnerName(e.target.value)}
                  placeholder="Who did you play with?"
                />
              </div>
            </div>

            <div className="space-y-6 border-t pt-6">
              <h3 className="font-heading font-extrabold uppercase tracking-wider text-xs text-muted-foreground">
                Tactical & Skill Ratings
              </h3>
              {SKILLS.map((skill) => (
                <div key={skill.key} className="space-y-2">
                  <div className="flex justify-between items-baseline">
                    <div className="flex items-center gap-1.5">
                      <label className="font-medium">{skill.label}</label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <button
                            type="button"
                            aria-label={`How to rate ${skill.label}`}
                            className="text-muted-foreground hover:text-primary transition-colors"
                          >
                            <Info className="h-4 w-4" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent align="start" className="w-80 space-y-3 text-sm">
                          <div>
                            <p className="font-heading font-extrabold uppercase tracking-wider text-xs text-muted-foreground mb-1">
                              What it means
                            </p>
                            <p className="text-muted-foreground">{skill.means}</p>
                          </div>
                          <div>
                            <p className="font-heading font-extrabold uppercase tracking-wider text-xs text-muted-foreground mb-1">
                              Low (1–4)
                            </p>
                            <p className="text-muted-foreground">{skill.low}</p>
                          </div>
                          <div>
                            <p className="font-heading font-extrabold uppercase tracking-wider text-xs text-primary mb-1">
                              High (7–10)
                            </p>
                            <p className="text-muted-foreground">{skill.high}</p>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                    <span className="font-heading font-extrabold text-primary">
                      {skills[skill.key]}
                    </span>
                  </div>
                  <Slider
                    value={[skills[skill.key]]}
                    onValueChange={(v) => setSkill(skill.key, v[0])}
                    min={1}
                    max={10}
                    step={1}
                  />
                  <p className="text-xs text-muted-foreground">{skill.hint}</p>
                </div>
              ))}
            </div>

            <Button className="w-full" onClick={handleSave} disabled={generateNft.isPending}>
              Save Progress
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Match History</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.sessions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No matches logged yet.</p>
            ) : (
              <div className="space-y-2">
                {stats.sessions.slice(-5).reverse().map((s, i) => (
                  <div key={i} className="flex items-center justify-between text-sm p-2 border-b gap-2">
                    <span className="text-muted-foreground w-20 shrink-0">
                      {new Date(s.date).toLocaleDateString()}
                    </span>
                    <span
                      className={`text-xs font-heading font-extrabold uppercase ${!s.meta ? "text-muted-foreground/60" : s.meta.outcome === "loss" ? "text-muted-foreground" : "text-primary"}`}
                    >
                      {!s.meta ? "—" : s.meta.outcome === "loss" ? "Loss" : "Win"}
                    </span>
                    <span className="flex-1 text-center truncate text-muted-foreground">
                      {s.meta?.scoreline || "—"}
                    </span>
                    <span className="font-semibold w-8 text-right">{s.sessionScore.toFixed(1)}</span>
                    <span className="w-20 text-right truncate">{s.tier}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col items-center gap-4">
        <div className="w-full space-y-4 rounded-xl border bg-card p-4">
          <div className="flex items-center gap-4">
            <label className="group relative h-16 w-16 shrink-0 cursor-pointer overflow-hidden rounded-full border-2 border-dashed border-muted-foreground/40 bg-muted/30">
              {photoUrl ? (
                <img src={photoUrl} alt="Player" className="h-full w-full object-cover" />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-[10px] font-medium text-muted-foreground text-center leading-tight px-1">
                  Add photo
                </span>
              )}
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={handlePhotoChange}
              />
            </label>
            <div className="min-w-0 flex-1 space-y-2">
              <div className="space-y-1">
                <label className="font-medium text-sm">Your Name</label>
                <Input
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="What's your name?"
                />
              </div>
            </div>
          </div>
          <div className="space-y-1">
            <label className="font-medium text-sm">Country</label>
            <Input
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              placeholder="Where are you from?"
            />
          </div>
          <div className="space-y-1">
            <label className="font-medium text-sm">Description</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your playing style, signature shot, or padel story..."
              rows={3}
            />
          </div>
          {photoUrl && (
            <button
              type="button"
              onClick={() => setPhotoUrl("")}
              className="text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              Remove photo
            </button>
          )}
        </div>
        {generatedImage ? (
          <div
            className="w-full max-w-xs mx-auto rounded-xl overflow-hidden shadow-2xl relative border-4"
            style={{ borderColor: currentTier.color }}
          >
            <div className="bg-black/80 text-white p-3 flex justify-center items-center z-10 relative">
              <span className="font-heading font-extrabold tracking-wider text-sm">PADEL BLITZ</span>
            </div>
            <div className="relative aspect-[3/4] w-full">
              <img src={generatedImage} alt="NFT" className="w-full h-full object-cover" />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-4 pt-16 text-white">
                <div className="font-heading font-extrabold uppercase tracking-tight text-2xl leading-tight">
                  {(latestSession?.meta?.playerName?.trim() || playerName.trim()) || "Padel Player"}
                </div>
                {(latestSession?.meta?.country?.trim() || country.trim()) && (
                  <div className="text-sm uppercase tracking-wider opacity-80 mt-1">
                    {latestSession?.meta?.country?.trim() || country.trim()}
                  </div>
                )}
              </div>
            </div>
            <div className="bg-black text-white/50 text-xs p-2 text-center flex justify-between px-4">
              <span>{address ? `${address.slice(0, 6)}...${address.slice(-4)}` : '0x...'}</span>
              <span>Monad Testnet</span>
            </div>
          </div>
        ) : (
          <div className="relative w-full max-w-xs mx-auto aspect-[3/4] rounded-xl border-4 border-dashed border-muted flex items-center justify-center bg-muted/20 overflow-hidden">
            <CrossedRackets className="pointer-events-none absolute left-1/2 top-1/2 h-48 w-48 -translate-x-1/2 -translate-y-1/2 text-primary opacity-[0.08]" />
            {generateNft.isPending ? (
              <div className="relative flex flex-col items-center gap-6 px-6 text-center">
                <div className="relative h-28 w-28">
                  <motion.div
                    className="absolute left-1/2 top-full"
                    style={{ x: "-50%", color: currentTier.color }}
                    animate={{ rotate: [-38, 26, -38] }}
                    transition={{ duration: 1.1, ease: "easeInOut", repeat: Infinity }}
                  >
                    <div className="origin-bottom">
                      <PadelRacket className="h-24 w-24" />
                    </div>
                  </motion.div>
                  <motion.div
                    className="absolute left-1/2 top-0 text-primary"
                    style={{ x: "-50%" }}
                    animate={{ y: [0, 74, 0], scale: [1, 0.85, 1] }}
                    transition={{ duration: 1.1, ease: "easeInOut", repeat: Infinity }}
                  >
                    <PadelBall className="h-7 w-7" />
                  </motion.div>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground text-sm relative text-center px-6">
                Fill in your details and hit Generate Card
              </p>
            )}
          </div>
        )}

        <Button
          onClick={handleMint}
          disabled={generateNft.isPending || !!mintTx}
          className="w-full"
        >
          {mintTx
            ? "Player NFT Minted"
            : generateNft.isPending
              ? "Generating card..."
              : generatedImage
                ? "Mint NFT"
                : "Generate Card"}
        </Button>
        {mintTx && (
          <Button
            variant="outline"
            onClick={handleUpdateStats}
            className="w-full"
          >
            Update stats
          </Button>
        )}
        {generateNft.isError && !mintTx && (
          <p className="text-xs text-destructive text-center">
            Card generation failed. Please try again.
          </p>
        )}
        {!contract && <p className="text-xs text-muted-foreground text-center">Contract not configured</p>}
        {mintTx && (
          <a
            href={`https://testnet.monadexplorer.com/tx/${mintTx}`}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-blue-500 hover:underline"
          >
            View on Explorer
          </a>
        )}

        <div className="w-full border-t pt-8 mt-4">
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary to-[#AA0048] px-4 py-3 mb-5 shadow-md shadow-primary/20">
            <CrossedRackets className="pointer-events-none absolute -right-3 -top-3 h-20 w-20 text-white opacity-10" />
            <div className="relative flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/15 ring-1 ring-white/25 backdrop-blur-sm">
                <CrossedRackets className="h-5 w-5 text-white" />
              </div>
              <div className="min-w-0">
                <p className="font-heading text-[9px] font-bold uppercase tracking-[0.25em] text-white/70">
                  Your AI Padel Coach
                </p>
                <h2 className="font-heading text-xl font-extrabold uppercase leading-none tracking-tight text-white">
                  Coach Blitz
                </h2>
              </div>
            </div>
          </div>
          <AiCoachTab stacked />
        </div>
      </div>
    </div>
  );
}
