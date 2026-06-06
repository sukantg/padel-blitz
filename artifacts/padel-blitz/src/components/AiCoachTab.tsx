import { useState } from "react";
import { usePlayerStats } from "../hooks/usePlayerStats";
import { useGetCoachAnalysis } from "@workspace/api-client-react";
import { getTier } from "../config";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useContract } from "../hooks/useContract";

export function AiCoachTab({ stacked = false }: { stacked?: boolean }) {
  const { address } = useContract();
  const { stats } = usePlayerStats(address);
  const getCoachAnalysis = useGetCoachAnalysis();

  const [description, setDescription] = useState("");

  const latestSession = stats.sessions[stats.sessions.length - 1];

  const handleAnalyze = () => {
    const skills = latestSession?.stats;
    const meta = latestSession?.meta;
    getCoachAnalysis.mutate({
      data: {
        description,
        skillScore: stats.cumulativeScore,
        tier: stats.currentTier,
        ...(skills && {
          netDominance: skills.netDominance,
          overheadAttack: skills.overheadAttack,
          glassDefense: skills.glassDefense,
          patienceConsistency: skills.patienceConsistency,
          lobQuality: skills.lobQuality,
        }),
        ...(meta && {
          matchOutcome: meta.outcome,
          matchType: meta.matchType,
          scoreline: meta.scoreline || undefined,
          partnerName: meta.partnerName || undefined,
        }),
      },
    });
  };

  const currentTier = getTier(stats.cumulativeScore);

  return (
    <div className={stacked ? "flex flex-col gap-6" : "grid grid-cols-1 md:grid-cols-2 gap-8"}>
      <div className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">Describe your game</h2>
        <Textarea 
          placeholder="How did you play today? E.g., 'My volleys were strong but I struggled with lobs...'"
          value={description}
          onChange={e => setDescription(e.target.value)}
          className="min-h-[220px]"
        />
        <Button onClick={handleAnalyze} disabled={!description || getCoachAnalysis.isPending}>
          {getCoachAnalysis.isPending ? "Analyzing..." : "Analyze my game"}
        </Button>
      </div>

      <div>
        {getCoachAnalysis.data ? (
          <Card className="border-2" style={{ borderColor: currentTier.color }}>
            <CardHeader className="pb-2">
              <CardTitle className="font-heading uppercase tracking-wide text-lg">
                Work on these next game
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-4">
              {getCoachAnalysis.data.focusAreas.map((tip, i) => (
                <div key={i} className="rounded-xl border bg-muted/20 p-4">
                  <div className="flex items-start gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                      {i + 1}
                    </span>
                    <p className="min-w-0 text-sm leading-relaxed">{tip}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed rounded-xl p-8 bg-muted/10 text-center">
            <p>Tell the coach how you played to get your 3 things to work on next game.</p>
          </div>
        )}
      </div>
    </div>
  );
}
