const MASTERS_ID = "ebf84425-7ae8-491e-a128-831d175e287a";
const SR_BASE = `https://api.sportradar.com/golf/trial/pga/v3/en/2026/tournaments/${MASTERS_ID}`;

export async function GET() {
  try {
    const apiKey = process.env.SPORTRADAR_API_KEY;
    if (!apiKey) {
      return Response.json({ error: "Missing API key" }, { status: 500 });
    }

    // Always fetch leaderboard and scorecards
    const [lbRes, scRes] = await Promise.all([
      fetch(`${SR_BASE}/leaderboard.json?api_key=${apiKey}`),
      fetch(`${SR_BASE}/scorecards.json?api_key=${apiKey}`),
    ]);

    const leaderboard = await lbRes.json();
    const scorecards = scRes.ok ? await scRes.json() : null;

    // If tournament hasn't started yet (empty leaderboard), fetch tee times
    const hasLiveData = (leaderboard?.leaderboard?.length || 0) > 0;
    let teeTimes = null;

    if (!hasLiveData) {
      // Try round 1 tee times
      const ttRes = await fetch(`${SR_BASE}/rounds/1/tee_times.json?api_key=${apiKey}`);
      if (ttRes.ok) {
        const ttData = await ttRes.json();
        // Flatten groups into a simple array of { tee_time, name }
        if (ttData?.groups) {
          teeTimes = ttData.groups.flatMap((g) =>
            (g.players || []).map((p) => ({
              tee_time: g.tee_time,
              name: `${p.first_name || ""} ${p.last_name || ""}`.trim(),
            }))
          );
        }
      }
    }

    return Response.json({ leaderboard, scorecards, teeTimes, hasLiveData });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
