const MASTERS_ID = "ebf84425-7ae8-491e-a128-831d175e287a";
const SR_BASE = `https://api.sportradar.com/golf/trial/pga/v3/en/2026/tournaments/${MASTERS_ID}`;

export async function GET() {
  try {
    const apiKey = process.env.SPORTRADAR_API_KEY;
    if (!apiKey) {
      return Response.json({ error: "Missing API key" }, { status: 500 });
    }

    // Fetch leaderboard, scorecards, and tee times in parallel
    const [lbRes, scRes, ttRes] = await Promise.all([
      fetch(`${SR_BASE}/leaderboard.json?api_key=${apiKey}`),
      fetch(`${SR_BASE}/scorecards.json?api_key=${apiKey}`),
      fetch(`${SR_BASE}/rounds/1/tee_times.json?api_key=${apiKey}`),
    ]);

    const leaderboard = await lbRes.json();
    const scorecards = scRes.ok ? await scRes.json() : null;
    const teeTimes = ttRes.ok ? await ttRes.json() : null;

    // If leaderboard is empty, attach tee times to leaderboard object
    // so the client can use them for the pre-tournament ticker
    if (leaderboard?.leaderboard?.length === 0 && teeTimes?.groups) {
      const flatTeeTimes = teeTimes.groups.flatMap((g) =>
        (g.players || []).map((p) => ({
          tee_time: g.tee_time,
          player: p,
        }))
      );
      leaderboard.tee_times = flatTeeTimes;
    }

    return Response.json({ leaderboard, scorecards });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
