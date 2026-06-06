import { Router, type IRouter } from "express";
import OpenAI, { toFile } from "openai";
import {
  GenerateNftBody,
  GenerateNftResponse,
  GetCoachAnalysisBody,
  GetCoachAnalysisResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

function getClient(): OpenAI | null {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  return new OpenAI({ apiKey });
}

const TIER_STYLE: Record<string, string> = {
  Rookie: "rookie underdog energy, subtle cool-toned particle aura",
  "Club Player": "rising-star confidence, sleek blue energy accents",
  Contender: "fierce competitor intensity, vivid purple energy aura",
  Elite: "champion presence, radiant golden glow",
  Legend: "mythic god-tier power, divine crimson aura",
};

type Gender = "male" | "female" | "neutral";

async function inferGender(
  client: OpenAI,
  name: string,
): Promise<Gender> {
  const trimmed = name.trim().slice(0, 40);
  if (!trimmed) return "neutral";
  try {
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0,
      messages: [
        {
          role: "system",
          content:
            'Classify the likely gender of a person given their first name. Reply with ONLY one lowercase word: "male", "female", or "neutral" (use neutral if unisex or unknown).',
        },
        { role: "user", content: trimmed },
      ],
    });
    const raw = (completion.choices[0]?.message?.content ?? "")
      .toLowerCase()
      .replace(/[^a-z]/g, "");
    if (raw === "female") return "female";
    if (raw === "male") return "male";
    return "neutral";
  } catch {
    return "neutral";
  }
}

function buildPrompt(input: {
  tier: string;
  skillScore: number;
  netDominance: number;
  overheadAttack: number;
  glassDefense: number;
  patienceConsistency: number;
  lobQuality: number;
  matchOutcome?: string;
  matchType?: string;
  gender: Gender;
  description?: string;
  hasReference?: boolean;
}): string {
  const persona = TIER_STYLE[input.tier] ?? TIER_STYLE.Rookie;
  const traits: string[] = [];
  if (input.overheadAttack >= 7) traits.push("explosive overhead smash and bandeja power");
  if (input.netDominance >= 7) traits.push("commanding net dominance and crisp volleys");
  if (input.glassDefense >= 7) traits.push("masterful glass-and-wall defending");
  if (input.patienceConsistency >= 7) traits.push("ice-cold patience like an unbreakable wall");
  if (input.lobQuality >= 7) traits.push("pinpoint deep defensive lobs");
  const traitText =
    traits.length > 0
      ? `Emphasise ${traits.join(", ")}.`
      : "Show raw athletic potential.";

  const genderWord =
    input.gender === "female" ? "female " : input.gender === "male" ? "male " : "";

  const outcome = (input.matchOutcome ?? "").toLowerCase();
  const moodText =
    outcome === "win"
      ? "Triumphant, victorious expression."
      : outcome === "loss"
        ? "Determined, resilient expression."
        : "Focused, competitive expression.";

  const intensityText = (input.matchType ?? "").toLowerCase().includes("compet")
    ? "Intense, high-energy competitive aura."
    : "Energetic, spirited aura.";

  const desc = (input.description ?? "").trim().slice(0, 600);
  const descText = desc
    ? `Reflect this player's own description of themselves in the character's vibe, styling, and signature details: "${desc}".`
    : "";

  const referenceText = input.hasReference
    ? `Base the superhero on the provided reference photo of the player: preserve their facial likeness, perceived ${
        input.gender === "neutral" ? "gender" : input.gender + " gender"
      }, skin tone, and hairstyle, then stylise them as the superhero. The face must clearly resemble the person in the photo.`
    : "";

  return [
    `3D character render of an athletic ${genderWord}padel superhero, neutral hero pose, hands holding glowing padel racket upright, clean iridescent suit with holographic sheen, subtle particle aura, plain dark gradient background, centered composition, trading card portrait format, smooth studio lighting, Fortnite skin meets Nike campaign aesthetic, no text no background objects.`,
    referenceText,
    `${persona}.`,
    traitText,
    moodText,
    intensityText,
    descText,
    "Subtle bold magenta (#CE0058) accents in the suit and particle aura.",
  ]
    .filter(Boolean)
    .join(" ");
}

function dataUrlToBuffer(dataUrl: string): { buffer: Buffer; mime: string } | null {
  const match = /^data:(image\/[a-zA-Z+]+);base64,(.+)$/s.exec(dataUrl.trim());
  if (!match) return null;
  try {
    return { mime: match[1], buffer: Buffer.from(match[2], "base64") };
  } catch {
    return null;
  }
}

async function generateImageFromReference(
  client: OpenAI,
  prompt: string,
  referenceImage: string,
): Promise<string | null> {
  const parsed = dataUrlToBuffer(referenceImage);
  if (!parsed) return null;
  try {
    const ext = parsed.mime.split("/")[1]?.replace("jpeg", "jpg") ?? "png";
    const image = await toFile(parsed.buffer, `player.${ext}`, {
      type: parsed.mime,
    });
    const result = await client.images.edit({
      model: "gpt-image-1",
      image,
      prompt,
      size: "1024x1536",
    });
    const b64 = result.data?.[0]?.b64_json;
    if (b64) return `data:image/png;base64,${b64}`;
    return null;
  } catch {
    // Fall back to text-only generation when the edit endpoint is unavailable.
    return null;
  }
}

async function generateImage(client: OpenAI, prompt: string): Promise<string> {
  try {
    const result = await client.images.generate({
      model: "gpt-image-1",
      prompt,
      size: "1024x1536",
    });
    const b64 = result.data?.[0]?.b64_json;
    if (b64) return `data:image/png;base64,${b64}`;
    throw new Error("No image data returned from gpt-image-1");
  } catch {
    const result = await client.images.generate({
      model: "dall-e-3",
      prompt,
      size: "1024x1792",
      quality: "hd",
      response_format: "b64_json",
    });
    const b64 = result.data?.[0]?.b64_json;
    if (b64) return `data:image/png;base64,${b64}`;
    const url = result.data?.[0]?.url;
    if (url) {
      const imgRes = await fetch(url);
      if (!imgRes.ok) throw new Error("Failed to fetch generated image");
      const buf = Buffer.from(await imgRes.arrayBuffer());
      return `data:image/png;base64,${buf.toString("base64")}`;
    }
    throw new Error("No image data returned");
  }
}

router.post("/generate-nft", async (req, res) => {
  const parsed = GenerateNftBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }
  const client = getClient();
  if (!client) {
    res.status(500).json({ error: "OPENAI_API_KEY is not configured" });
    return;
  }
  try {
    const gender = await inferGender(client, parsed.data.playerName ?? "");
    const referenceImage = parsed.data.referenceImage?.trim();
    const hasReference = !!referenceImage;
    const prompt = buildPrompt({ ...parsed.data, gender, hasReference });

    let imageUrl: string | null = null;
    if (referenceImage) {
      imageUrl = await generateImageFromReference(client, prompt, referenceImage);
    }
    // No reference photo, or the edit endpoint failed — fall back to a
    // text-only generation built from the same prompt (minus the photo).
    if (!imageUrl) {
      const fallbackPrompt = hasReference
        ? buildPrompt({ ...parsed.data, gender, hasReference: false })
        : prompt;
      imageUrl = await generateImage(client, fallbackPrompt);
    }

    const data = GenerateNftResponse.parse({ imageUrl });
    res.json(data);
  } catch (err) {
    req.log.error({ err }, "NFT image generation failed");
    res.status(500).json({ error: "Failed to generate superhero card" });
  }
});

const COACH_SYSTEM = `You are Coach Blitz, an elite AI padel coach with 20 years of professional experience.
You analyse player performance data and deliver sharp, personalised coaching — equal parts
tactical genius and motivational fire. You speak directly, confidently, and with authority.
No fluff. Every word earns its place.
Weigh the player's core match data, their five skill ratings, and their own recap
together — let the lowest ratings and what they describe drive your priorities.
Return ONLY a JSON object with this exact shape:
{ "focusAreas": [string, string, string] }
Rules:
- EXACTLY 3 short coaching points — the three most important things to work on next game.
- Each is ONE punchy sentence spoken straight to the player, like advice on the court.
- Base them on the data, but DO NOT name skill metrics or ratings (no "Net Dominance", "Lob Quality", "/10", etc.) — just say what to do and why in plain words.
- Be specific to padel (walls, bandeja, vibora, net play, lobs). Keep each under 24 words.`;

// Tips that name a skill metric or quote a numeric rating are rejected so the
// coach speaks in plain language only (the player explicitly asked for this).
const BANNED_TIP =
  /net dominance|lob quality|glass play|glass\s*(?:&|and)\s*defend|overhead\s*(?:&|and|\/)\s*attack|patience\s*(?:&|and)\s*consistency|\b\d+\s*\/\s*10\b|\brating\b/i;

// Deterministic fallbacks ranked by the player's lowest skill ratings, used to
// pad the coach response up to exactly 3 plain-text tips when the model returns
// fewer. Each is a natural coaching sentence that never names a skill metric.
function padToThree(items: string[], d: { [k: string]: unknown }): string[] {
  const out = items.slice(0, 3);
  if (out.length === 3) return out;

  const pool: { v: number | undefined; tip: string }[] = [
    { v: d.lobQuality as number | undefined, tip: "Get more height and depth on your lobs so you can buy time and reset the point under pressure." },
    { v: d.overheadAttack as number | undefined, tip: "Play your smashes with control first — pick a target off the side wall instead of swinging for an outright winner." },
    { v: d.glassDefense as number | undefined, tip: "Be patient off the back glass: let the ball come off, stay low, and lift it deep to neutralise the rally." },
    { v: d.patienceConsistency as number | undefined, tip: "Build the point one shot at a time and only go big when the ball sits up — cut out the rushed errors." },
    { v: d.netDominance as number | undefined, tip: "Take the net more aggressively and finish high balls down hard so opponents can't push you back." },
  ]
    .filter((x) => typeof x.v === "number")
    .sort((a, b) => (a.v as number) - (b.v as number));

  const generic: string[] = [
    "Sharpen your court positioning — mirror your partner and keep the middle covered to win more points without bigger shots.",
    "Improve your shot selection: attack only the balls above net height and calmly reset everything below it.",
    "Own the first two shots of the point with a reliable serve and a deep, controlled return.",
  ];

  const candidates = [...pool.map((p) => p.tip), ...generic];
  for (const c of candidates) {
    if (out.length === 3) break;
    if (out.includes(c)) continue;
    out.push(c);
  }
  return out.slice(0, 3);
}

router.post("/coach", async (req, res) => {
  const parsed = GetCoachAnalysisBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }
  const client = getClient();
  if (!client) {
    res.status(500).json({ error: "OPENAI_API_KEY is not configured" });
    return;
  }
  try {
    const d = parsed.data;
    const rating = (label: string, v: number | undefined) =>
      typeof v === "number" ? `  - ${label}: ${v}/10\n` : "";
    const core: string[] = [];
    if (d.matchOutcome) core.push(`result ${d.matchOutcome}`);
    if (d.scoreline) core.push(`scoreline ${d.scoreline}`);
    if (d.matchType) core.push(`${d.matchType} match`);
    if (d.partnerName) core.push(`partner ${d.partnerName}`);

    const userMsg = `Overall skill score: ${d.skillScore}/10 (tier: ${d.tier}).
Core match data: ${core.length ? core.join(", ") : "not provided"}.
Skill ratings:
${rating("Net dominance", d.netDominance)}${rating("Overhead/attack", d.overheadAttack)}${rating("Glass play & defending", d.glassDefense)}${rating("Patience & consistency", d.patienceConsistency)}${rating("Lob quality", d.lobQuality)}Player's own recap: ${d.description || "(none provided)"}

Give me the 3 most important things to work on next game.`;
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: COACH_SYSTEM },
        { role: "user", content: userMsg },
      ],
    });
    const raw = completion.choices[0]?.message?.content;
    if (!raw) throw new Error("Empty completion");
    const json: unknown = JSON.parse(raw);
    const obj = (json && typeof json === "object" ? json : {}) as Record<
      string,
      unknown
    >;
    const focusAreas = (Array.isArray(obj.focusAreas) ? obj.focusAreas : [])
      .map((item) =>
        typeof item === "string"
          ? item.trim()
          : item && typeof item === "object"
            ? // tolerate a model that ignores the schema and returns objects
              String(
                (item as Record<string, unknown>).tip ??
                  (item as Record<string, unknown>).title ??
                  "",
              ).trim()
            : "",
      )
      .filter((s) => s.length > 0)
      // Drop any tip that leaks a skill-metric label or numeric rating — the
      // player asked for plain advice, not "Net Dominance"-style metric talk.
      .filter((s) => !BANNED_TIP.test(s));

    // Guarantee exactly 3 tips. If the model returned fewer (or some were
    // dropped above), pad with data-driven plain-text priorities derived from
    // the player's lowest skill ratings.
    const padded = padToThree(focusAreas, d);
    const data = GetCoachAnalysisResponse.parse({ focusAreas: padded });
    res.json(data);
  } catch (err) {
    req.log.error({ err }, "Coach analysis failed");
    res.status(500).json({ error: "Failed to analyse your game" });
  }
});

export default router;
