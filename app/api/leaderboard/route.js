export async function GET() {
  try {
    const srKey = process.env.SPORTRADAR_API_KEY;
    const res = await fetch(`https://api.sportradar.com/golf/trial/pga/v3/en/2026/tournaments/ebf84425-7ae8-491e-a128-831d175e287a/leaderboard.json?api_key=${srKey}`);
    if (!res.ok) throw new Error("SR fetch failed");
    const data = await res.json();
    return Response.json({ data, source: "sportradar" });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
