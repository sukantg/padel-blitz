import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConnectWallet } from "../components/ConnectWallet";
import { PlayerNftTab } from "../components/PlayerNftTab";
import { WagerTab } from "../components/WagerTab";
import { LeaderboardTab } from "../components/LeaderboardTab";
import { PadelBackdrop, CrossedRackets, PadelBall, PadelRacket } from "../components/PadelGraphics";

export default function Dashboard() {
  // Held here so the generated card persists across in-app tab switches
  // (Dashboard stays mounted) but resets on a full page reload.
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);

  return (
    <div className="relative min-h-screen bg-background">
      <PadelBackdrop />
      <header className="relative z-10 border-b bg-card overflow-hidden">
        <CrossedRackets className="pointer-events-none absolute -right-4 -top-6 h-24 w-24 text-primary opacity-[0.08]" />
        <PadelBall className="pointer-events-none absolute right-40 top-8 h-10 w-10 text-primary opacity-[0.06]" />
        <div className="container mx-auto px-4 h-16 flex items-center justify-between relative">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-[#AA0048] shadow-sm shadow-primary/30">
              <PadelRacket className="h-6 w-6 -rotate-45 text-white" />
            </div>
            <span className="font-heading font-extrabold text-xl tracking-tight text-foreground">PADEL BLITZ</span>
          </div>
          <ConnectWallet />
        </div>
      </header>
      
      <main className="relative z-10 container mx-auto px-4 py-8">
        <Tabs defaultValue="nft" className="mx-auto w-full max-w-5xl">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="nft">My Progress</TabsTrigger>
            <TabsTrigger value="wager">Wager</TabsTrigger>
            <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          </TabsList>

          <TabsContent value="nft" className="focus-visible:outline-none">
            <PlayerNftTab
              generatedImage={generatedImage}
              setGeneratedImage={setGeneratedImage}
            />
          </TabsContent>

          <TabsContent value="wager" className="focus-visible:outline-none">
            <WagerTab />
          </TabsContent>

          <TabsContent value="leaderboard" className="focus-visible:outline-none">
            <LeaderboardTab />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
