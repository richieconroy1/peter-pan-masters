export async function GET() {
  try {
    const apiKey = process.env.SPORTSDATA_API_KEY;
    if (!apiKey) return Response.json({ error: "Missing API key" }, { status: 500 });
    const res = await fetch(`https://api.sportsdata.io/golf/v2/json/Leaderboard/688?key=${apiKey}`);
    if (!res.ok) throw new Error("SportsData fetch failed");
    const data = await res.json();
    return Response.json({ data });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
