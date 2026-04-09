const MASTERS_ID = "ebf84425-7ae8-491e-a128-831d175e287a";
const SR_BASE = `https://api.sportradar.com/golf/trial/pga/v3/en/2026/tournaments/${MASTERS_ID}`;

export async function GET() {
  try {
    const apiKey = process.env.SPORTRADAR_API_KEY;
    if (!apiKey) {
      return Response.json({ error: "Missing API key" }, { status: 500 });
    }

    const lbRes = await fetch(`${SR_BASE}/leaderboard.json?api_key=${apiKey}`);
    const leaderboard = await lbRes.json();

    if (leaderboard?.message === "Limit Exceeded") {
      return Response.json({ error: "quota_exceeded" }, { status: 429 });
    }

    const hasLiveData = (leaderboard?.leaderboard?.length || 0) > 0;

    return Response.json({ leaderboard, scorecards: null, teeTimes: null, hasLiveData });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
