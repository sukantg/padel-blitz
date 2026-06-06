import { useState, useEffect } from 'react';
import { getTier } from '../config';

export interface SessionStat {
  netDominance: number;
  overheadAttack: number;
  glassDefense: number;
  patienceConsistency: number;
  lobQuality: number;
}

export type MatchOutcome = 'win' | 'loss';
export type MatchType = 'friendly' | 'competitive';

export interface MatchMeta {
  outcome: MatchOutcome;
  scoreline: string;
  matchType: MatchType;
  partnerName: string;
  playerName: string;
  country: string;
  description: string;
}

export interface SessionRecord {
  date: string;
  stats: SessionStat;
  meta?: MatchMeta; // optional: sessions saved before match-data was added have none
  sessionScore: number;
  tier: string;
  imageUrl?: string; // cached image
}

export interface PlayerStats {
  sessions: SessionRecord[];
  cumulativeScore: number;
  currentTier: string;
}

const STORAGE_KEY_PREFIX = 'padel_stats_';

/** Session score = average of the five 1-10 skill ratings. */
export function scoreSession(s: SessionStat): number {
  return (
    s.netDominance +
    s.overheadAttack +
    s.glassDefense +
    s.patienceConsistency +
    s.lobQuality
  ) / 5;
}

const EMPTY_STATS: PlayerStats = {
  sessions: [],
  cumulativeScore: 0,
  currentTier: getTier(0).name,
};

/** Clamp any stored value to a valid 0-10 rating, defaulting bad data to 0. */
function clampRating(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? Math.max(0, Math.min(10, n)) : 0;
}

/**
 * Normalize a possibly-legacy stored session into the current shape. Sessions
 * saved before the tactical-ratings change use different stat keys and have no
 * `meta`; those skill values become 0 and `meta` stays undefined (rendered as
 * "Unknown") rather than being silently mislabeled.
 */
function normalizeSession(raw: unknown): SessionRecord {
  const s = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const rawStats = (s.stats && typeof s.stats === 'object' ? s.stats : {}) as Record<string, unknown>;
  const stats: SessionStat = {
    netDominance: clampRating(rawStats.netDominance),
    overheadAttack: clampRating(rawStats.overheadAttack),
    glassDefense: clampRating(rawStats.glassDefense),
    patienceConsistency: clampRating(rawStats.patienceConsistency),
    lobQuality: clampRating(rawStats.lobQuality),
  };
  const rawMeta = s.meta && typeof s.meta === 'object' ? (s.meta as Record<string, unknown>) : null;
  const meta: MatchMeta | undefined = rawMeta
    ? {
        outcome: rawMeta.outcome === 'loss' ? 'loss' : 'win',
        scoreline: typeof rawMeta.scoreline === 'string' ? rawMeta.scoreline : '',
        matchType: rawMeta.matchType === 'competitive' ? 'competitive' : 'friendly',
        partnerName: typeof rawMeta.partnerName === 'string' ? rawMeta.partnerName : '',
        playerName: typeof rawMeta.playerName === 'string' ? rawMeta.playerName : '',
        country: typeof rawMeta.country === 'string' ? rawMeta.country : '',
        description: typeof rawMeta.description === 'string' ? rawMeta.description : '',
      }
    : undefined;
  const score = clampRating(s.sessionScore);
  return {
    date: typeof s.date === 'string' ? s.date : new Date().toISOString(),
    stats,
    meta,
    sessionScore: score,
    tier: typeof s.tier === 'string' ? s.tier : getTier(score).name,
    imageUrl: typeof s.imageUrl === 'string' ? s.imageUrl : undefined,
  };
}

function loadStats(key: string): PlayerStats {
  const stored = localStorage.getItem(key);
  if (stored) {
    try {
      const parsed = (JSON.parse(stored) ?? {}) as Record<string, unknown>;
      const sessions = Array.isArray(parsed.sessions)
        ? parsed.sessions.map(normalizeSession)
        : [];
      const cumulativeScore = clampRating(parsed.cumulativeScore);
      return {
        sessions,
        cumulativeScore,
        currentTier: getTier(cumulativeScore).name,
      };
    } catch {
      // invalid json — fall through to empty
    }
  }
  return EMPTY_STATS;
}

export function usePlayerStats(walletAddress: string) {
  const key = `${STORAGE_KEY_PREFIX}${walletAddress || 'guest'}`;

  const [stats, setStats] = useState<PlayerStats>(() => loadStats(key));

  // When the wallet (and therefore the storage key) changes, load that
  // wallet's saved history instead of overwriting it with the previous state.
  useEffect(() => {
    setStats(loadStats(key));
  }, [key]);

  // Persist stats, but only keep the most recent session's image. NFT images are
  // large base64 data URLs (~1-2MB each); storing one per session quickly blows
  // past the ~5MB localStorage quota and throws QuotaExceededError. The UI only
  // ever renders the latest session's card, so older images are dropped on save.
  useEffect(() => {
    const lastIndex = stats.sessions.length - 1;
    const trimmed: PlayerStats = {
      ...stats,
      sessions: stats.sessions.map((s, i) =>
        i === lastIndex ? s : { ...s, imageUrl: undefined },
      ),
    };
    try {
      localStorage.setItem(key, JSON.stringify(trimmed));
    } catch {
      // Quota still exceeded (e.g. a single very large image) — persist without
      // any images so match history is never lost to a storage error.
      try {
        const noImages: PlayerStats = {
          ...stats,
          sessions: stats.sessions.map((s) => ({ ...s, imageUrl: undefined })),
        };
        localStorage.setItem(key, JSON.stringify(noImages));
      } catch {
        // Give up silently; in-memory state remains intact for this session.
      }
    }
  }, [stats, key]);

  const addSession = (sessionStats: SessionStat, meta: MatchMeta, imageUrl?: string) => {
    const score = scoreSession(sessionStats);

    const newSession: SessionRecord = {
      date: new Date().toISOString(),
      stats: sessionStats,
      meta,
      sessionScore: score,
      tier: getTier(score).name,
      imageUrl
    };

    setStats(prev => {
      const newSessions = [...prev.sessions, newSession];
      const totalScore = newSessions.reduce((sum, s) => sum + s.sessionScore, 0);
      const cumulativeScore = newSessions.length > 0 ? totalScore / newSessions.length : 0;
      
      return {
        sessions: newSessions,
        cumulativeScore,
        currentTier: getTier(cumulativeScore).name
      };
    });
  };

  const updateLatestImage = (imageUrl: string) => {
    setStats(prev => {
      if (prev.sessions.length === 0) return prev;
      const newSessions = [...prev.sessions];
      newSessions[newSessions.length - 1].imageUrl = imageUrl;
      return { ...prev, sessions: newSessions };
    });
  };

  return { stats, addSession, updateLatestImage };
}
