export default async function handler(req, res) {
  try {
    console.log("Fetching leaderboard...");

    const response = await fetch("https://api.balldontlie.io/pga/v1/leaderboards", {
      headers: {
        Authorization: process.env.PGA_API_KEY,
      },
    });

    const text = await response.text();

    console.log("Status:", response.status);
    console.log("Response preview:", text.slice(0, 200));

    // 🚨 SAFE PARSE
    let json;
    try {
      json = JSON.parse(text);
    } catch (e) {
      console.log("JSON parse failed");
      return res.status(200).json({}); // 👈 prevents crash
    }

    const players = {};

    if (!json.data) {
      console.log("No data field in response");
      return res.status(200).json({});
    }

    json.data.forEach((p) => {
      const name = `${p.player?.first_name || ""} ${p.player?.last_name || ""}`.trim();

      players[name] = {
        birdies: p.stats?.birdies || 0,
        eagles: p.stats?.eagles || 0,
        pars: p.stats?.pars || 0,
        bogeys: p.stats?.bogeys || 0,
        double_bogeys: p.stats?.double_bogeys || 0,
        position: p.position || 0,
      };
    });

    res.status(200).json(players);
  } catch (err) {
    console.error("API ERROR:", err);
    res.status(200).json({}); // 👈 never crash frontend
  }
}