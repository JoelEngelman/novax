import { Router, type IRouter } from "express";
import { asc } from "drizzle-orm";
import { db, leaderboardTable } from "@workspace/db";
import { SubmitScoreBody, GetLeaderboardResponseItem } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/leaderboard", async (req, res): Promise<void> => {
  const entries = await db
    .select()
    .from(leaderboardTable)
    .orderBy(asc(leaderboardTable.raceTimeMs))
    .limit(20);

  res.json(entries.map((e) => GetLeaderboardResponseItem.parse({
    id: e.id,
    playerName: e.playerName,
    raceTimeMs: e.raceTimeMs,
    laps: e.laps,
    track: e.track,
    createdAt: e.createdAt.toISOString(),
  })));
});

router.post("/leaderboard", async (req, res): Promise<void> => {
  const parsed = SubmitScoreBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [entry] = await db
    .insert(leaderboardTable)
    .values(parsed.data)
    .returning();

  res.status(201).json(GetLeaderboardResponseItem.parse({
    id: entry.id,
    playerName: entry.playerName,
    raceTimeMs: entry.raceTimeMs,
    laps: entry.laps,
    track: entry.track,
    createdAt: entry.createdAt.toISOString(),
  }));
});

export default router;
