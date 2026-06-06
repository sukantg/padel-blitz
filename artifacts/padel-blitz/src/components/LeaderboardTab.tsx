import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getTier } from "../config";
import { Button } from "@/components/ui/button";

interface BoardPlayer {
  name: string;
  score: number;
}

// Prepopulated leaderboard so the board is never empty. Real local players are
// merged in by cumulative score alongside these demo entries.
const SEED_PLAYERS: BoardPlayer[] = [
  { name: "Diego Storm", score: 9.4 },
  { name: "Sofia Cruz", score: 9.1 },
  { name: "Marco Reyes", score: 8.7 },
  { name: "Lucia Vega", score: 8.3 },
  { name: "Andre Costa", score: 7.8 },
  { name: "Elena Marin", score: 7.2 },
  { name: "Tomas Bauer", score: 6.6 },
  { name: "Carla Ruiz", score: 5.9 },
  { name: "Nico Ferro", score: 5.1 },
  { name: "Mia Lindqvist", score: 4.4 },
];

export function LeaderboardTab() {
  const [topPlayers, setTopPlayers] = useState<BoardPlayer[]>([]);

  const refreshBoard = () => {
    const players: BoardPlayer[] = [...SEED_PLAYERS];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('padel_stats_')) {
        const addr = key.replace('padel_stats_', '');
        try {
          const stats = JSON.parse(localStorage.getItem(key) || '{}');
          if (stats.cumulativeScore > 0) {
            const name = addr === 'guest' ? 'Guest Player' : `${addr.slice(0, 6)}...${addr.slice(-4)}`;
            players.push({ name, score: stats.cumulativeScore });
          }
        } catch (e) {}
      }
    }
    players.sort((a, b) => b.score - a.score);
    setTopPlayers(players.slice(0, 10));
  };

  useEffect(() => {
    refreshBoard();
  }, []);

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Top Players</CardTitle>
        <Button variant="outline" size="sm" onClick={refreshBoard}>Refresh</Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {topPlayers.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center">No players ranked yet.</p>
          ) : (
            topPlayers.map((p, i) => {
              const tier = getTier(p.score);
              return (
                <div key={i} className="flex items-center justify-between p-4 border rounded-lg" style={{ borderColor: tier.color }}>
                  <div className="flex items-center gap-4">
                    <div className="text-2xl font-black w-8 text-center text-muted-foreground">#{i + 1}</div>
                    <div>
                      <div className="font-semibold">{p.name}</div>
                      <div className="text-xs px-2 py-0.5 rounded-full inline-block text-white mt-1" style={{ backgroundColor: tier.color }}>
                        {tier.name}
                      </div>
                    </div>
                  </div>
                  <div className="text-xl font-bold">{p.score.toFixed(1)}</div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
