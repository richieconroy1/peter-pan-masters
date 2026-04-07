const MASTERS_ID = "ebf84425-7ae8-491e-a128-831d175e287a";
const SR_BASE = `https://api.sportradar.com/golf/trial/pga/v3/en/2026/tournaments/${MASTERS_ID}`;

export async function GET() {
  try {
    const apiKey = process.env.SPORTRADAR_API_KEY;

    const [lbRes, scRes] = await Promise.all([
      fetch(`${SR_BASE}/leaderboard.json?api_key=${apiKey}`, {
        next: { revalidate: 20 },
      }),
      fetch(`${SR_BASE}/scorecards.json?api_key=${apiKey}`, {
        next: { revalidate: 20 },
      }),
    ]);

    if (!lbRes.ok) {
      return Response.json({ error: "SportRadar leaderboard fetch failed" }, { status: 502 });
    }

    const leaderboard = await lbRes.json();
    const scorecards = scRes.ok ? await scRes.json() : null;

    return Response.json({ leaderboard, scorecards });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
