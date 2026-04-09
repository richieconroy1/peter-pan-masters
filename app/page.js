"use client";
import React, { useState, useEffect } from "react";
import { db } from "../lib/firebase";
import { collection, addDoc, onSnapshot, query, where } from "firebase/firestore";
import "./masters.css";

const salaryCap = 50000;

// 12:00 AM Pacific Time, Thursday April 9, 2026 (midnight going into Thursday)
// 00:00 PT = 07:00 UTC
const LOCK_TIME = new Date("2026-04-09T07:00:00Z");

export default function App() {
  const [players, setPlayers] = useState([]);
  const [lineup, setLineup] = useState([]);
  const [entries, setEntries] = useState([]);
  const [name, setName] = useState("");
  const [liveData, setLiveData] = useState({});
  const [tickerPlayers, setTickerPlayers] = useState([]);
  const [copied, setCopied] = useState(false);
  const [now, setNow] = useState(new Date());
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState(null);
  const [expandedEntry, setExpandedEntry] = useState(null);

  const poolId = "peter-pan-masters-2026";
  const isLocked = now >= LOCK_TIME;

  const showToast = (msg, type = "info") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Clock tick — checks lock every second
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Load draft from localStorage on mount
  useEffect(() => {
    try {
      const savedDraft = localStorage.getItem(`draft-${poolId}`);
      const savedName = localStorage.getItem(`draft-name-${poolId}`);
      if (savedDraft) {
        const parsed = JSON.parse(savedDraft);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setLineup(parsed);
          setHasDraft(true);
        }
      }
      if (savedName) setName(savedName);
    } catch (e) {
      // ignore localStorage errors
    }
  }, []);

  // Auto-save draft to localStorage whenever lineup or name changes
  useEffect(() => {
    try {
      if (lineup.length > 0) {
        localStorage.setItem(`draft-${poolId}`, JSON.stringify(lineup));
        localStorage.setItem(`draft-name-${poolId}`, name);
        setHasDraft(true);
      }
    } catch (e) {}
  }, [lineup, name]);

  const saveDraft = () => {
    try {
      localStorage.setItem(`draft-${poolId}`, JSON.stringify(lineup));
      localStorage.setItem(`draft-name-${poolId}`, name);
      setHasDraft(true);
      setDraftSaved(true);
      setTimeout(() => setDraftSaved(false), 2500);
    } catch (e) {}
  };

  const clearDraft = () => {
    try {
      localStorage.removeItem(`draft-${poolId}`);
      localStorage.removeItem(`draft-name-${poolId}`);
      setHasDraft(false);
      setLineup([]);
      setName("");
    } catch (e) {}
  };

  useEffect(() => {
    const defaultPlayers = [
      { name: "Scottie Scheffler", salary: 14000 },
      { name: "Rory McIlroy", salary: 11600 },
      { name: "Bryson DeChambeau", salary: 10200 },
      { name: "Jon Rahm", salary: 10000 },
      { name: "Ludvig Aberg", salary: 9800 },
      { name: "Xander Schauffele", salary: 9600 },
      { name: "Collin Morikawa", salary: 9500 },
      { name: "Tommy Fleetwood", salary: 9300 },
      { name: "Cameron Young", salary: 9200 },
      { name: "Justin Rose", salary: 9100 },
      { name: "Patrick Reed", salary: 9000 },
      { name: "Hideki Matsuyama", salary: 8900 },
      { name: "Viktor Hovland", salary: 8800 },
      { name: "Matt Fitzpatrick", salary: 8700 },
      { name: "Robert MacIntyre", salary: 8600 },
      { name: "Brooks Koepka", salary: 8500 },
      { name: "Jordan Spieth", salary: 8400 },
      { name: "Justin Thomas", salary: 8300 },
      { name: "Shane Lowry", salary: 8200 },
      { name: "Tyrrell Hatton", salary: 8100 },
      { name: "Chris Gotterup", salary: 8000 },
      { name: "Sepp Straka", salary: 8000 },
      { name: "Patrick Cantlay", salary: 7900 },
      { name: "Russell Henley", salary: 7900 },
      { name: "Akshay Bhatia", salary: 7800 },
      { name: "Si Woo Kim", salary: 7800 },
      { name: "Min Woo Lee", salary: 7700 },
      { name: "Corey Conners", salary: 7700 },
      { name: "Ben Griffin", salary: 7600 },
      { name: "Jason Day", salary: 7600 },
      { name: "Cameron Smith", salary: 7500 },
      { name: "Sungjae Im", salary: 7500 },
      { name: "Nicolai Hojgaard", salary: 7500 },
      { name: "Jacob Bridgeman", salary: 7400 },
      { name: "Jake Knapp", salary: 7400 },
      { name: "Sam Burns", salary: 7400 },
      { name: "Harris English", salary: 7300 },
      { name: "Max Homa", salary: 7300 },
      { name: "Marco Penge", salary: 7300 },
      { name: "Gary Woodland", salary: 7300 },
      { name: "Adam Scott", salary: 7200 },
      { name: "J.J. Spaun", salary: 7200 },
      { name: "Maverick McNealy", salary: 7200 },
      { name: "Wyndham Clark", salary: 7100 },
      { name: "Ryan Fox", salary: 7100 },
      { name: "Sergio Garcia", salary: 7100 },
      { name: "Alex Noren", salary: 7000 },
      { name: "Dustin Johnson", salary: 7000 },
      { name: "Keegan Bradley", salary: 7000 },
      { name: "Daniel Berger", salary: 7000 },
      { name: "Tom McKibbin", salary: 6900 },
      { name: "Rasmus Hojgaard", salary: 6900 },
      { name: "Harry Hall", salary: 6900 },
      { name: "Kurt Kitayama", salary: 6800 },
      { name: "Ryan Gerard", salary: 6800 },
      { name: "Aaron Rai", salary: 6800 },
      { name: "Rasmus Neergaard-Petersen", salary: 6700 },
      { name: "John Keefer", salary: 6700 },
      { name: "Nicolas Echavarria", salary: 6700 },
      { name: "Michael Kim", salary: 6700 },
      { name: "Michael Brennan", salary: 6600 },
      { name: "Casey Jarvis", salary: 6600 },
      { name: "Carlos Ortiz", salary: 6600 },
      { name: "Max Greyserman", salary: 6600 },
      { name: "Sami Valimaki", salary: 6500 },
      { name: "Brian Harman", salary: 6500 },
      { name: "Nick Taylor", salary: 6500 },
      { name: "Andrew Novak", salary: 6400 },
      { name: "Sam Stevens", salary: 6400 },
      { name: "Davis Riley", salary: 6400 },
      { name: "Kristoffer Reitan", salary: 6300 },
      { name: "Hao-Tong Li", salary: 6300 },
      { name: "Charl Schwartzel", salary: 6300 },
      { name: "Bubba Watson", salary: 6300 },
      { name: "Zach Johnson", salary: 6300 },
      { name: "Aldrich Potgieter", salary: 6200 },
      { name: "Naoyuki Kataoka", salary: 6200 },
      { name: "Brian Campbell", salary: 6200 },
      { name: "Danny Willett", salary: 6200 },
      { name: "Jackson Herrington", salary: 6200 },
      { name: "Angel Cabrera", salary: 6100 },
      { name: "Ethan Fang", salary: 6100 },
      { name: "Brandon Holtz", salary: 6100 },
      { name: "Fifa Laopakdee", salary: 6100 },
      { name: "Vijay Singh", salary: 6100 },
      { name: "Mason Howell", salary: 6000 },
      { name: "Fred Couples", salary: 6000 },
      { name: "Mike Weir", salary: 6000 },
      { name: "Mateo Pulcini", salary: 6000 },
      { name: "Jose Maria Olazabal", salary: 6000 },
    ];
    setPlayers(defaultPlayers);
  }, []);

  const normalizeName = (n) =>
    n.toLowerCase().replace(/å/g, "a").replace(/[^a-z\s]/g, "").trim();

  const formatScore = (score) => {
    if (score === undefined || score === null) return "E";
    if (score === 0) return "E";
    return score > 0 ? `+${score}` : `${score}`;
  };

  const fetchLiveScores = async () => {
    try {
      showToast("Updating scores...", "info");
      const res = await fetch("/api/leaderboard");

      // If SportRadar quota exceeded, go straight to ESPN
      if (res.status === 429) throw new Error("quota_exceeded");
      if (!res.ok) throw new Error("Proxy fetch failed");

      const { leaderboard: lbData, scorecards: scData, teeTimes, hasLiveData } = await res.json();

      // Build scorecard lookup keyed by player id
      const scorecardMap = {};
      if (scData?.players) {
        scData.players.forEach((p) => {
          let birdies = 0, pars = 0, bogeys = 0, doubles = 0, eagles = 0,
              tripleOrWorse = 0, holeInOne = 0;
          (p.rounds || []).forEach((round) => {
            (round.holes || []).forEach((h) => {
              const diff = (h.strokes || 0) - (h.par || 0);
              if (h.strokes === 1 && h.par === 1) holeInOne++;
              else if (diff <= -2) eagles++;
              else if (diff === -1) birdies++;
              else if (diff === 0) pars++;
              else if (diff === 1) bogeys++;
              else if (diff === 2) doubles++;
              else if (diff >= 3) tripleOrWorse++;
            });
          });
          scorecardMap[p.id] = {
            birdies, pars, bogeys,
            double_bogeys: doubles,
            triple_bogeys: tripleOrWorse,
            eagles, hole_in_one: holeInOne,
          };
        });
      }

      const leaderboard = lbData?.leaderboard || [];

      // Before tournament starts — show tee times in ticker
      if (!hasLiveData && teeTimes && teeTimes.length > 0) {
        const ticker = teeTimes.map((t) => ({
          pos: t.tee_time
            ? new Date(t.tee_time).toLocaleTimeString("en-US", {
                hour: "numeric", minute: "2-digit",
                hour12: true, timeZone: "America/New_York",
              })
            : "–",
          name: t.name,
          score: null,
          isTeeTime: true,
        }));
        setTickerPlayers(ticker);
        setLiveData({});
        return;
      }

      // Live play — build ticker from leaderboard
      const ticker = leaderboard
        .filter((p) => p.status !== "withdrawn")
        .slice(0, 30)
        .map((p) => {
          const rawScore = p.score;
          const score = (rawScore !== null && rawScore !== undefined && !isNaN(Number(rawScore)))
            ? Number(rawScore) : null;
          return {
            pos: p.tied ? `T${p.position}` : `${p.position || "–"}`,
            name: `${p.first_name || ""} ${p.last_name || ""}`.trim(),
            score,
          };
        });
      setTickerPlayers(ticker);

      // Build liveData for pool scoring
      const scores = {};
      leaderboard.forEach((p) => {
        const fullName = `${p.first_name} ${p.last_name}`;
        const position = p.position || 99;
        const sc = scorecardMap[p.id] || {};
        scores[fullName] = {
          position,
          birdies:       sc.birdies       || 0,
          eagles:        sc.eagles        || 0,
          pars:          sc.pars          || 0,
          bogeys:        sc.bogeys        || 0,
          double_bogeys: sc.double_bogeys || 0,
          triple_bogeys: sc.triple_bogeys || 0,
          hole_in_one:   sc.hole_in_one   || 0,
        };
      });
      setLiveData(scores);

    } catch (err) {
      console.error("❌ SportRadar proxy failed, trying ESPN fallback", err);
      try {
        const res = await fetch("https://site.api.espn.com/apis/site/v2/sports/golf/pga/leaderboard");
        const data = await res.json();
        const playersData = data?.events?.[0]?.competitions?.[0]?.competitors || [];

        const ticker = playersData
          .filter((p) => p.status?.type?.name !== "STATUS_WITHDRAWN")
          .sort((a, b) => (parseInt(a.rank) || 99) - (parseInt(b.rank) || 99))
          .slice(0, 50)
          .map((p) => {
            const rawScore = p.score?.value;
            const score = (rawScore !== null && rawScore !== undefined && !isNaN(Number(rawScore)))
              ? Number(rawScore) : null;
            return {
              pos: p.rank || "–",
              name: p.athlete?.displayName || "Unknown",
              score,
            };
          });
        setTickerPlayers(ticker);

        // Also build liveData from ESPN for pool scoring
        const scores = {};
        playersData.forEach((p) => {
          const pName = p.athlete?.displayName;
          if (!pName) return;
          const position = parseInt(p.rank?.replace("T", "")) || 99;
          let birdies = 0, pars = 0, bogeys = 0, doubles = 0, eagles = 0;
          (p.linescores || []).forEach((round) => {
            (round.holes || []).forEach((h) => {
              if (h.score == null || h.par == null) return;
              const diff = h.score - h.par;
              if (diff <= -2) eagles++;
              else if (diff === -1) birdies++;
              else if (diff === 0) pars++;
              else if (diff === 1) bogeys++;
              else if (diff === 2) doubles++;
            });
          });
          scores[pName] = {
            position, birdies, eagles, pars, bogeys,
            double_bogeys: doubles, triple_bogeys: 0, hole_in_one: 0,
          };
        });
        setLiveData(scores);
      } catch (e) {
        console.error("❌ ESPN fallback also failed", e);
      }
    }
  };

  useEffect(() => {
    const q = query(collection(db, "entries"), where("poolId", "==", poolId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setEntries(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [poolId]);

  useEffect(() => {
    if (!players || players.length === 0) return;
    fetchLiveScores();
    const interval = setInterval(fetchLiveScores, 300000); // 5 minutes
    return () => clearInterval(interval);
  }, [players.length]);

  const togglePlayer = (player) => {
    if (isLocked) return;
    const alreadySelected = lineup.find((p) => p.name === player.name);
    if (alreadySelected) {
      setLineup(lineup.filter((p) => p.name !== player.name));
      return;
    }
    if (lineup.length >= 6) return;
    setLineup([...lineup, player]);
  };

  const submitEntry = async () => {
    if (isLocked || lineup.length !== 6 || !name || !poolId) return;
    if (lineup.reduce((s, p) => s + p.salary, 0) > salaryCap) return;
    setSubmitError("");

    // Check for duplicate name in this pool
    const duplicate = entries.find(
      (e) => e.name.trim().toLowerCase() === name.trim().toLowerCase()
    );
    if (duplicate) {
      setSubmitError(`An entry for "${name}" already exists. Each person can only submit one lineup.`);
      return;
    }

    await addDoc(collection(db, "entries"), { poolId, name, players: lineup });
    setSubmitSuccess(true);
    clearDraft();
  };

  const handleCopyLink = () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const calculateScore = (stats) => {
    if (!stats) return 0;
    const pos = stats.position;
    const positionPoints =
      pos === 1 ? 30 : pos === 2 ? 20 : pos === 3 ? 18 : pos === 4 ? 16 :
      pos === 5 ? 14 : pos === 6 ? 12 : pos === 7 ? 10 : pos === 8 ? 9 :
      pos === 9 ? 8 : pos === 10 ? 7 : pos <= 15 ? 6 : pos <= 20 ? 5 :
      pos <= 25 ? 4 : pos <= 30 ? 3 : pos <= 40 ? 2 : pos <= 50 ? 1 : 0;
    return (
      (stats.eagles || 0) * 13 +      // double eagle or better = +13
      (stats.birdies || 0) * 3 +
      (stats.pars || 0) * 0.5 +
      (stats.bogeys || 0) * -0.5 +
      (stats.double_bogeys || 0) * -1 +
      (stats.triple_bogeys || 0) * -1 +  // worse than double bogey = -1
      (stats.hole_in_one || 0) * 5 +
      positionPoints
    );
  };

  const totalSalary = lineup.reduce((sum, p) => sum + p.salary, 0);
  const remaining = salaryCap - totalSalary;
  const canSubmit = !isLocked && lineup.length === 6 && totalSalary <= salaryCap && !!name;

  const scored = entries
    .map((e) => {
      const playerStats = e.players.map((p) => {
        const key = Object.keys(liveData).find(
          (n) => normalizeName(n) === normalizeName(p.name)
        );
        const stats = key ? liveData[key] : null;
        return {
          name: p.name,
          stats,
          points: stats ? calculateScore(stats) : 0,
        };
      });
      return {
        ...e,
        playerStats,
        score: playerStats.reduce((sum, p) => sum + p.points, 0),
      };
    })
    .sort((a, b) => b.score - a.score);

  // Time until lock countdown
  const msUntilLock = LOCK_TIME - now;
  const formatCountdown = () => {
    if (msUntilLock <= 0) return null;
    const totalSec = Math.floor(msUntilLock / 1000);
    const d = Math.floor(totalSec / 86400);
    const h = Math.floor((totalSec % 86400) / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    if (d > 0) return `${d}d ${h}h ${m}m`;
    if (h > 0) return `${h}h ${m}m ${s}s`;
    return `${m}m ${s}s`;
  };
  const countdown = formatCountdown();

  const tickerContent = tickerPlayers.length > 0
    ? tickerPlayers
    : [{ pos: "–", name: "Awaiting live data...", score: null }];

  const sectionStyle = {
    background: "linear-gradient(145deg, #163d2c, #0c2318)",
    border: "1px solid rgba(212,175,55,0.15)",
    borderRadius: "8px",
    padding: "16px",
    marginBottom: "16px",
    boxShadow: "0 4px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04)",
    fontFamily: "'Cormorant SC', 'Cormorant', serif",
  };
  const sectionHeading = {
    fontFamily: "'Cormorant SC', 'Cormorant', serif",
    fontSize: "22px",
    fontWeight: 700,
    fontStyle: "italic",
    color: "#f7e7a1",
    letterSpacing: "0.06em",
    marginTop: 0,
    marginBottom: "12px",
  };
  const sectionSubheading = {
    fontFamily: "'Cormorant SC', 'Cormorant', serif",
    fontSize: "22px",
    fontWeight: 700,
    fontStyle: "italic",
    color: "#f7e7a1",
    letterSpacing: "0.05em",
    marginTop: 0,
    marginBottom: "10px",
  };
  const tableStyle = { width: "100%", borderCollapse: "collapse", fontSize: "15px", fontFamily: "'Cormorant SC', 'Cormorant', serif" };
  const thStyle = {
    textAlign: "left", color: "#d4af37", fontWeight: 700,
    padding: "6px 8px", borderBottom: "1px solid rgba(212,175,55,0.3)",
    fontSize: "12px", letterSpacing: "1px", textTransform: "uppercase",
    fontFamily: "'Cormorant SC', 'Cormorant', serif",
  };
  const tdStyle = { padding: "6px 8px", borderBottom: "1px solid rgba(255,255,255,0.06)", color: "white" };
  const tdPtsStyle = { ...tdStyle, textAlign: "right", color: "#d4af37", fontWeight: "bold" };

  return (
    <>

      <div style={{
        minHeight: "100vh",
        background: [
          "radial-gradient(ellipse at 20% 0%, rgba(212,175,55,0.07) 0%, transparent 50%)",
          "radial-gradient(ellipse at 80% 0%, rgba(212,175,55,0.05) 0%, transparent 45%)",
          "radial-gradient(ellipse at 50% 100%, rgba(0,0,0,0.35) 0%, transparent 60%)",
          "linear-gradient(170deg, #0a3828 0%, #0f4a35 30%, #123d2c 60%, #0a2d20 100%)",
        ].join(", "),
        backgroundAttachment: "fixed",
        position: "relative",
      }} className="augusta-bg">

        {/* ── DECORATIVE BACKGROUND PATTERN ── */}
        <div style={{
          position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
          backgroundImage: `
            radial-gradient(ellipse at 15% 85%, rgba(212,175,55,0.06) 0%, transparent 45%),
            radial-gradient(ellipse at 85% 15%, rgba(212,175,55,0.05) 0%, transparent 40%),
            radial-gradient(ellipse at 85% 85%, rgba(10,56,40,0.8) 0%, transparent 50%),
            radial-gradient(ellipse at 15% 15%, rgba(10,56,40,0.6) 0%, transparent 50%)
          `,
        }} />
        {/* Green jacket diamond weave pattern */}
        <svg style={{
          position: "fixed", inset: 0, width: "100%", height: "100%",
          pointerEvents: "none", zIndex: 0, opacity: 0.025,
        }} xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="jacket-weave" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
              <path d="M12 0 L24 12 L12 24 L0 12 Z" fill="none" stroke="#d4af37" strokeWidth="0.5"/>
              <path d="M12 6 L18 12 L12 18 L6 12 Z" fill="none" stroke="#d4af37" strokeWidth="0.3"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#jacket-weave)"/>
        </svg>

        {/* ── LIVE TICKER ── */}
        <div className="ticker-wrap anim-ticker">
          <div className="ticker-label">
            <span className="ticker-live-dot" />
            {tickerPlayers.length > 0 && tickerPlayers[0]?.isTeeTime ? "Tee Times" : "Live"}
          </div>
          <div className="ticker-track">
            {[...tickerContent, ...tickerContent].map((p, i) => (
              <React.Fragment key={i}>
                <span className="ticker-item">
                  <span className="ticker-pos">{p.pos}</span>
                  <span className="ticker-name">{p.name}</span>
                  {!p.isTeeTime && p.score !== null && p.score !== undefined && (
                    <span className={p.score < 0 ? "ticker-score-under" : p.score === 0 ? "ticker-score-even" : "ticker-score-over"}>
                      {formatScore(p.score)}
                    </span>
                  )}
                </span>
                <span className="ticker-divider">◆</span>
              </React.Fragment>
            ))}
          </div>
        </div>

        <div style={{
          maxWidth: "1200px", margin: "0 auto", padding: "20px",
          color: "white", fontFamily: "'Libre Baskerville', 'Times New Roman', serif",
          letterSpacing: "0.3px",
        }}>

          {/* ── HEADER ── */}
          <header className="anim-header" style={{ textAlign: "center", padding: "36px 20px 32px", marginBottom: "32px" }}>
            <div style={{
              position: "relative", display: "inline-block",
              width: "100%", maxWidth: "780px",
              padding: "32px 40px 28px", boxSizing: "border-box",
            }}>
              {[
                { top: 0, left: 0, transform: "none" },
                { top: 0, right: 0, transform: "scaleX(-1)" },
                { bottom: 0, left: 0, transform: "scaleY(-1)" },
                { bottom: 0, right: 0, transform: "scale(-1,-1)" },
              ].map((pos, i) => (
                <svg key={i} width="32" height="32" viewBox="0 0 32 32"
                  style={{ position: "absolute", opacity: 0.65, ...pos }}>
                  <path d="M2 30 L2 6 Q2 2 6 2 L30 2" fill="none" stroke="#d4af37" strokeWidth="1.2" strokeLinecap="round" />
                  <path d="M2 20 Q2 10 10 6" fill="none" stroke="#d4af37" strokeWidth="0.7" strokeLinecap="round" opacity="0.6" />
                  <circle cx="2" cy="2" r="1.5" fill="#d4af37" opacity="0.8" />
                  <circle cx="30" cy="2" r="1" fill="#d4af37" opacity="0.5" />
                  <circle cx="2" cy="30" r="1" fill="#d4af37" opacity="0.5" />
                </svg>
              ))}
              <hr className="masters-rule" style={{ marginBottom: "22px" }} />

              {/* PETER PAN — small caps, wide spaced eyebrow */}
              <p style={{
                fontFamily: "'Cormorant SC', 'Cormorant', serif",
                fontSize: "clamp(11px, 1.3vw, 14px)",
                fontWeight: 600,
                fontStyle: "normal",
                color: "#8aab93",
                letterSpacing: "0.55em",
                textTransform: "uppercase",
                margin: "0 0 10px 0",
              }}>
                Peter&nbsp;&nbsp;Pan
              </p>

              {/* MASTERS — the dominant word, stacked and large */}
              <div style={{ position: "relative", margin: "0 0 2px 0" }}>
                <h1 style={{
                  fontFamily: "'Cormorant SC', 'Cormorant', serif",
                  fontSize: "clamp(64px, 10vw, 108px)",
                  fontWeight: 700,
                  fontStyle: "italic",
                  color: "#d4af37",
                  letterSpacing: "0.06em",
                  lineHeight: 0.9,
                  margin: 0,
                  textShadow: `
                    0 2px 0 rgba(0,0,0,0.4),
                    0 0 60px rgba(212,175,55,0.3),
                    0 0 120px rgba(212,175,55,0.1)
                  `,
                }}>
                  Masters
                </h1>
              </div>

              {/* 2026 — large numerals, below Masters, slightly inset */}
              <div style={{
                fontFamily: "'Cormorant SC', 'Cormorant', serif",
                fontSize: "clamp(22px, 3.2vw, 38px)",
                fontWeight: 400,
                fontStyle: "normal",
                color: "#c8b97a",
                letterSpacing: "0.45em",
                marginBottom: "16px",
                opacity: 0.85,
              }}>
                2026
              </div>

              <hr className="masters-rule-thin" style={{ margin: "0 auto 16px", maxWidth: "300px" }} />

              {/* Tagline */}
              <p style={{
                fontFamily: "'Cormorant SC', 'Cormorant', serif",
                fontSize: "clamp(13px, 1.6vw, 17px)",
                fontWeight: 400,
                fontStyle: "italic",
                color: "#c8b97a",
                letterSpacing: "0.18em",
                margin: "0 0 20px 0",
              }}>
                Degeneracy Unlike Any Other
              </p>

              <hr className="masters-rule" style={{ marginBottom: "0px" }} />
            </div>
          </header>

          {/* ── TWO-COLUMN ── */}
          <div className="two-col" style={{ display: "flex", gap: "40px", alignItems: "flex-start", position: "relative" }}>
            <div className="two-col-divider" style={{ position: "absolute", left: "50%", top: 0, bottom: 0, width: "1px", background: "rgba(212,175,55,0.3)" }} />

            {/* LEFT — Styled Player Picker */}
            <div className="two-col-left anim-left" style={{ width: "50%" }}>

              {/* Lock / countdown banner */}
              {isLocked ? (
                <div className="lock-banner">
                  🔒 Lineup submissions are closed — entries locked at midnight PT, April 10th
                </div>
              ) : countdown && (
                <div className="countdown-banner">
                  Entries lock in&nbsp;&nbsp;<span className="countdown-time">{countdown}</span>
                </div>
              )}

              {/* Picker card */}
              <div className="picker-section">
                <div className="picker-header">
                  <h2 className="picker-title">Select Your Six</h2>
                  <span className="picker-salary-cap">Salary cap $50,000</span>
                </div>

                {/* Live budget badge */}
                <div className="picker-badge">
                  <span>
                    <span className="picker-badge-count">{lineup.length}/6</span> selected
                  </span>
                  <span style={{ opacity: 0.3 }}>·</span>
                  <span className={totalSalary > salaryCap ? "picker-badge-over" : ""}>
                    <span className="picker-badge-count">${(salaryCap - totalSalary).toLocaleString()}</span> remaining
                  </span>
                  {totalSalary > salaryCap && <span className="picker-badge-over">⚠️ Over budget</span>}
                </div>

                {/* Search */}
                <input
                  className="player-search"
                  placeholder="Search players..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />

                <hr className="picker-rule" />

                {(() => {
                  const filtered = players.filter((p) =>
                    p.name.toLowerCase().includes(search.toLowerCase())
                  );
                  // Determine cut line — position 50 in liveData after round 2
                  const cutPosition = 50;
                  let cutInserted = false;

                  return filtered.map((p, idx) => {
                    const selected = !!lineup.find((lp) => lp.name === p.name);
                    const fullAndNotSelected = lineup.length >= 6 && !selected;
                    const liveStats = Object.keys(liveData).find(
                      (n) => normalizeName(n) === normalizeName(p.name)
                    );
                    const playerPos = liveStats ? liveData[liveStats].position : null;
                    const isMissedCut = isLocked && playerPos && playerPos > cutPosition;

                    // Insert cut line before first player over position 50
                    let cutLine = null;
                    if (isLocked && !cutInserted && isMissedCut) {
                      cutInserted = true;
                      cutLine = (
                        <div key="cut-line" className="cut-line-row">
                          <span className="cut-line-label">✂ Cut Line</span>
                          <div className="cut-line-rule" />
                        </div>
                      );
                    }

                    return (
                      <React.Fragment key={p.name}>
                        {cutLine}
                        <div
                          onClick={() => togglePlayer(p)}
                          className={[
                            "player-row",
                            selected ? "player-row--selected" : "",
                            fullAndNotSelected ? "player-row--full" : "",
                            isLocked ? "player-row--locked" : "",
                            isMissedCut ? "player-row--cut" : "",
                          ].filter(Boolean).join(" ")}
                        >
                          <span style={{ display: "flex", alignItems: "center" }}>
                            {selected && (
                              <span className="player-check">
                                <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                                  <polyline points="1.5,4.5 3.5,6.5 7.5,2.5" stroke="#0b3d2e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                              </span>
                            )}
                            <span className="player-name">{p.name}</span>
                            {isMissedCut && (
                              <span style={{ marginLeft: "8px", fontSize: "10px", color: "#e07070", fontStyle: "italic", opacity: 0.8 }}>CUT</span>
                            )}
                          </span>
                          <span className="player-salary">${p.salary.toLocaleString()}</span>
                        </div>
                      </React.Fragment>
                    );
                  });
                })()}
              </div>
            </div>

            {/* RIGHT */}
            <div className="two-col-right anim-right" style={{ width: "50%" }}>

              {/* 1. POOL LEADERBOARD */}
              <div style={sectionStyle}>
                <h2 style={sectionHeading}>🏆 Pool Leaderboard</h2>
                {!isLocked ? (
                  // Hidden before lock — show entry count but not names
                  <div style={{ textAlign: "center", padding: "20px 0" }}>
                    <div style={{
                      fontSize: "36px", fontWeight: "bold", color: "#d4af37",
                      fontFamily: "'Cormorant SC', 'Cormorant', serif",
                    }}>
                      {entries.length}
                    </div>
                    <div style={{
                      fontSize: "13px", color: "#8aab93", marginTop: "6px",
                      fontFamily: "'Cormorant SC', 'Cormorant', serif", fontStyle: "italic",
                    }}>
                      {entries.length === 1 ? "entry submitted" : "entries submitted"}
                    </div>
                    <div style={{
                      marginTop: "14px", padding: "10px 16px",
                      background: "rgba(212,175,55,0.07)",
                      border: "1px solid rgba(212,175,55,0.2)",
                      borderRadius: "6px",
                      fontSize: "14px", fontStyle: "italic",
                      color: "#c8b97a", lineHeight: "1.8",
                      fontFamily: "'Cormorant SC', 'Cormorant', serif",
                    }}>
                      Entries and lineups are sealed until the field is locked.<br />
                      The leaderboard reveals at midnight PT, April 9th.
                    </div>
                  </div>
                ) : (
                  // Revealed after lock
                  <>
                    {scored.length === 0 && (
                      <p style={{ opacity: 0.5, fontSize: "13px", margin: 0 }}>No entries yet.</p>
                    )}
                    <table className="scorecard-table">
                      <thead>
                        <tr>
                          <th style={{ width: "28px" }}>#</th>
                          <th>Entrant / Roster</th>
                          <th style={{ textAlign: "right" }}>Pts</th>
                        </tr>
                      </thead>
                      <tbody>
                        {scored.map((e, i) => (
                          <React.Fragment key={e.id}>
                            <tr
                              className={i === 0 ? "row-first" : ""}
                              style={{ cursor: "pointer" }}
                              onClick={() => setExpandedEntry(expandedEntry === e.id ? null : e.id)}
                            >
                              <td className="scorecard-pos">{i + 1}</td>
                              <td className="scorecard-name-col">
                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                  <div className="scorecard-entry-name">{e.name}</div>
                                  <span style={{ fontSize: "10px", opacity: 0.5 }}>
                                    {expandedEntry === e.id ? "▲" : "▼"}
                                  </span>
                                </div>
                                <div className="scorecard-players">
                                  {(e.playerStats || []).map((p, j) => {
                                    const s = p.stats;
                                    const chips = [];
                                    if (s) {
                                      if (s.eagles > 0) chips.push(<span key="e" className="chip-eagle">🦅×{s.eagles}</span>);
                                      if (s.birdies > 0) chips.push(<span key="b" className="chip-birdie">🐦×{s.birdies}</span>);
                                      if (s.bogeys > 0) chips.push(<span key="bo" className="chip-bogey">↑{s.bogeys}</span>);
                                      if (s.position && s.position <= 50) chips.push(<span key="pos" className="chip-pos">T{s.position}</span>);
                                    }
                                    return (
                                      <span key={j} className="scorecard-player-chip">
                                        {p.name.split(" ").slice(-1)[0]}
                                        {chips.length > 0 && <span style={{ marginLeft: "3px" }}>{chips}</span>}
                                        {j < (e.playerStats?.length || 0) - 1 && <span style={{ opacity: 0.3, marginLeft: "2px" }}>·</span>}
                                      </span>
                                    );
                                  })}
                                </div>
                              </td>
                              <td className="scorecard-pts">
                                {e.score.toFixed(1)}
                                <span className="scorecard-pts-label">pts</span>
                              </td>
                            </tr>

                            {/* Expanded lineup breakdown */}
                            {expandedEntry === e.id && (
                              <tr>
                                <td colSpan={3} style={{ padding: 0 }}>
                                  <div style={{
                                    background: "rgba(0,0,0,0.2)",
                                    borderTop: "1px solid rgba(212,175,55,0.1)",
                                    borderBottom: "1px solid rgba(212,175,55,0.1)",
                                    padding: "10px 12px",
                                  }}>
                                    {(e.playerStats || []).map((p, j) => {
                                      const s = p.stats;
                                      const pts = p.points;
                                      const hasData = !!s;
                                      return (
                                        <div key={j} style={{
                                          display: "flex",
                                          justifyContent: "space-between",
                                          alignItems: "center",
                                          padding: "6px 4px",
                                          borderBottom: j < (e.playerStats?.length || 0) - 1
                                            ? "1px solid rgba(255,255,255,0.05)" : "none",
                                        }}>
                                          <div>
                                            <span style={{
                                              fontFamily: "'Cormorant SC', serif",
                                              fontSize: "16px",
                                              fontStyle: "italic",
                                              color: "#f0e8cc",
                                            }}>
                                              {p.name}
                                            </span>
                                            {hasData && (
                                              <span style={{
                                                marginLeft: "10px",
                                                fontSize: "14px",
                                                color: "#8aab93",
                                                fontFamily: "'Cormorant SC', serif",
                                                fontStyle: "italic",
                                              }}>
                                                {s.eagles > 0 && `🦅${s.eagles} `}
                                                {s.birdies > 0 && `🐦${s.birdies} `}
                                                {s.bogeys > 0 && `+${s.bogeys}bog `}
                                                {s.double_bogeys > 0 && `+${s.double_bogeys}dbl `}
                                                {s.position && s.position <= 50 ? `Pos ${s.position}` : s.position > 50 ? "CUT" : ""}
                                              </span>
                                            )}
                                            {!hasData && (
                                              <span style={{
                                                marginLeft: "10px",
                                                fontSize: "11px",
                                                color: "#8aab93",
                                                fontStyle: "italic",
                                                opacity: 0.6,
                                              }}>
                                                awaiting data
                                              </span>
                                            )}
                                          </div>
                                          <div style={{
                                            fontFamily: "'Cormorant SC', serif",
                                            fontSize: "17px",
                                            fontWeight: 700,
                                            color: pts > 0 ? "#d4af37" : pts < 0 ? "#e07070" : "#8aab93",
                                          }}>
                                            {hasData ? `${pts > 0 ? "+" : ""}${pts.toFixed(1)}` : "–"}
                                          </div>
                                        </div>
                                      );
                                    })}
                                    <div style={{
                                      display: "flex",
                                      justifyContent: "space-between",
                                      marginTop: "8px",
                                      paddingTop: "8px",
                                      borderTop: "1px solid rgba(212,175,55,0.2)",
                                      fontFamily: "'Cormorant SC', serif",
                                      fontSize: "14px",
                                      fontStyle: "italic",
                                    }}>
                                      <span style={{ color: "#c8b97a" }}>Total</span>
                                      <span style={{ color: "#d4af37", fontWeight: 700 }}>
                                        {e.score.toFixed(1)} pts
                                      </span>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        ))}
                      </tbody>
                    </table>
                  </>
                )}
              </div>

              {/* 2. YOUR LINEUP */}
              <div style={sectionStyle}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                  <h3 style={sectionSubheading}>
                    Your Lineup ({lineup.length}/6)
                    {lineup.length === 6 && (
                      <span style={{ marginLeft: "10px", color: "#d4af37", fontSize: "13px" }}>✅ Full</span>
                    )}
                  </h3>
                  {/* Draft buttons */}
                  {!isLocked && (
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button
                        onClick={saveDraft}
                        disabled={lineup.length === 0}
                        className={`draft-btn${draftSaved ? " saved" : ""}`}
                        style={{ opacity: lineup.length === 0 ? 0.4 : 1 }}
                      >
                        {draftSaved ? "✓ Saved" : "Save draft"}
                      </button>
                      {hasDraft && (
                        <button onClick={clearDraft} className="draft-btn clear">
                          Clear
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {hasDraft && lineup.length > 0 && (
                  <div style={{
                    fontSize: "11px", fontStyle: "italic", color: "#8aab93",
                    marginBottom: "10px", letterSpacing: "0.04em",
                    fontFamily: "'Cormorant SC', 'Cormorant', serif",
                  }}>
                    Draft saved — your picks will be here when you return.
                  </div>
                )}

                {lineup.length === 0 ? (
                  <p style={{ opacity: 0.5, fontSize: "13px", margin: 0 }}>No players selected yet.</p>
                ) : (
                  lineup.map((p) => (
                    <div key={p.name} style={{
                      display: "flex", justifyContent: "space-between",
                      padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,0.08)",
                    }}>
                      <span>{p.name}</span>
                      <span style={{ color: "#d4af37" }}>${p.salary.toLocaleString()}</span>
                    </div>
                  ))
                )}
              </div>

              {/* 3 & 4. SALARY + REMAINING */}
              <div style={{ ...sectionStyle, display: "flex", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontSize: "13px", opacity: 0.7, letterSpacing: "1px", textTransform: "uppercase", marginBottom: "4px", fontFamily: "'Cormorant SC', serif", fontStyle: "italic" }}>Salary Used</div>
                  <div style={{ fontSize: "22px", fontWeight: "bold", color: totalSalary > salaryCap ? "#ff4d4f" : "#ffffff" }}>
                    ${totalSalary.toLocaleString()}
                    <span style={{ fontSize: "13px", opacity: 0.55 }}> / $50,000</span>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "13px", opacity: 0.7, letterSpacing: "1px", textTransform: "uppercase", marginBottom: "4px", fontFamily: "'Cormorant SC', serif", fontStyle: "italic" }}>Remaining</div>
                  <div style={{ fontSize: "22px", fontWeight: "bold", color: remaining < 0 ? "#ff4d4f" : "#d4af37" }}>
                    ${remaining.toLocaleString()}
                    {remaining < 0 && <span style={{ fontSize: "13px", marginLeft: "6px" }}>⚠️ Over</span>}
                  </div>
                </div>
              </div>

              {/* 5. SUBMIT ENTRY */}
              <div style={sectionStyle}>
                <h3 style={sectionSubheading}>✍️ Submit Entry</h3>
                {isLocked ? (
                  <p style={{ color: "#e07070", fontStyle: "italic", fontSize: "13px", margin: 0 }}>
                    Submissions are closed. The field is set — good luck.
                  </p>
                ) : submitSuccess ? (
                  <div style={{
                    textAlign: "center", padding: "16px 0",
                    fontFamily: "'Cormorant SC', 'Cormorant', serif",
                  }}>
                    <div style={{ fontSize: "28px", marginBottom: "8px" }}>⛳</div>
                    <div style={{ color: "#5ec47a", fontWeight: "bold", fontSize: "15px", marginBottom: "6px" }}>
                      Entry submitted!
                    </div>
                    <div style={{ color: "#8aab93", fontSize: "12px", fontStyle: "italic" }}>
                      Your lineup is locked in. Good luck out there.
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Venmo buy-in note */}
                    <div style={{
                      background: "rgba(212,175,55,0.07)",
                      border: "1px solid rgba(212,175,55,0.2)",
                      borderRadius: "6px",
                      padding: "10px 14px",
                      marginBottom: "12px",
                      fontFamily: "'Cormorant SC', 'Cormorant', serif",
                      fontStyle: "italic",
                    }}>
                      <div style={{ fontSize: "14px", color: "#f7e7a1", fontWeight: 700, marginBottom: "4px", letterSpacing: "0.04em" }}>
                        Buy-in: $40
                      </div>
                      <div style={{ fontSize: "13px", color: "#c8b97a", lineHeight: "1.6", marginBottom: "8px" }}>
                        Send payment via Venmo to{" "}
                        <span style={{ color: "#d4af37", fontWeight: 700 }}>@richie-conroy</span>
                        {" "}prior to submitting your entry.
                      </div>
                      <div style={{
                        borderTop: "1px solid rgba(212,175,55,0.15)",
                        paddingTop: "8px",
                        display: "flex",
                        gap: "20px",
                      }}>
                        <div style={{ fontSize: "13px", color: "#c8b97a", lineHeight: "1.6" }}>
                          <span style={{ color: "#d4af37", fontWeight: 700 }}>1st Place</span>{" "}80%
                        </div>
                        <div style={{ fontSize: "13px", color: "#c8b97a", lineHeight: "1.6" }}>
                          <span style={{ color: "#d4af37", fontWeight: 700 }}>2nd Place</span>{" "}20%
                        </div>
                      </div>
                    </div>

                    <input
                      placeholder="Your Name"
                      value={name}
                      onChange={(e) => { setName(e.target.value); setSubmitError(""); }}
                      style={{
                        width: "100%", padding: "10px", marginBottom: "10px",
                        boxSizing: "border-box", borderRadius: "4px",
                        border: submitError ? "1px solid rgba(220,80,80,0.6)" : "1px solid rgba(255,255,255,0.3)",
                        background: "rgba(0,0,0,0.3)", color: "white", fontSize: "15px",
                        fontFamily: "'Cormorant SC', 'Cormorant', serif",
                        fontStyle: "italic", letterSpacing: "0.04em",
                      }}
                    />
                    {submitError && (
                      <div style={{
                        background: "rgba(180,60,60,0.15)",
                        border: "1px solid rgba(220,80,80,0.3)",
                        borderRadius: "4px",
                        padding: "8px 12px",
                        marginBottom: "10px",
                        fontSize: "12px",
                        fontStyle: "italic",
                        color: "#e07070",
                        fontFamily: "'Cormorant SC', 'Cormorant', serif",
                        lineHeight: "1.5",
                      }}>
                        {submitError}
                      </div>
                    )}
                    <button
                      onClick={submitEntry}
                      disabled={!canSubmit}
                      style={{
                        width: "100%", padding: "12px",
                        background: canSubmit ? "#f7e7a1" : "#555",
                        color: canSubmit ? "#0b3d2e" : "#999",
                        border: "none", fontWeight: 700, borderRadius: "4px",
                        fontSize: "16px", cursor: canSubmit ? "pointer" : "not-allowed",
                        transition: "background 0.2s",
                        fontFamily: "'Cormorant SC', 'Cormorant', serif",
                        fontStyle: "italic", letterSpacing: "0.08em",
                      }}
                    >
                      Submit Entry
                    </button>
                  </>
                )}
              </div>

              {/* 6. SCORING RULES */}
              <div style={sectionStyle}>
                <h3 style={sectionSubheading}>📋 Scoring Rules</h3>

                <p style={{ color: "#d4af37", fontWeight: 700, fontSize: "13px", letterSpacing: "1px", textTransform: "uppercase", marginBottom: "6px", fontFamily: "'Cormorant SC', serif", fontStyle: "italic" }}>Per Hole Scoring</p>
                <table style={tableStyle}>
                  <thead><tr><th style={thStyle}>Result</th><th style={{ ...thStyle, textAlign: "right" }}>Pts</th></tr></thead>
                  <tbody>
                    {[
                      ["Double Eagle or Better", "+13"], ["Eagle", "+8"], ["Birdie", "+3"],
                      ["Par", "+0.5"], ["Bogey", "−0.5"], ["Double Bogey", "−1"],
                      ["Worse than Double Bogey", "−1"],
                    ].map(([label, pts]) => (
                      <tr key={label}><td style={tdStyle}>{label}</td><td style={tdPtsStyle}>{pts}</td></tr>
                    ))}
                  </tbody>
                </table>

                <p style={{ color: "#d4af37", fontWeight: 700, fontSize: "13px", letterSpacing: "1px", textTransform: "uppercase", margin: "14px 0 6px", fontFamily: "'Cormorant SC', serif", fontStyle: "italic" }}>Tournament Finish</p>
                <table style={tableStyle}>
                  <thead><tr><th style={thStyle}>Position</th><th style={{ ...thStyle, textAlign: "right" }}>Pts</th></tr></thead>
                  <tbody>
                    {[
                      ["1st", "+30"], ["2nd", "+20"], ["3rd", "+18"], ["4th", "+16"],
                      ["5th", "+14"], ["6th", "+12"], ["7th", "+10"], ["8th", "+9"],
                      ["9th", "+8"], ["10th", "+7"], ["11th – 15th", "+6"], ["16th – 20th", "+5"],
                      ["21st – 25th", "+4"], ["26th – 30th", "+3"], ["31st – 40th", "+2"], ["41st – 50th", "+1"],
                    ].map(([label, pts]) => (
                      <tr key={label}><td style={tdStyle}>{label}</td><td style={tdPtsStyle}>{pts}</td></tr>
                    ))}
                  </tbody>
                </table>

                <p style={{ color: "#d4af37", fontWeight: 700, fontSize: "13px", letterSpacing: "1px", textTransform: "uppercase", margin: "14px 0 6px", fontFamily: "'Cormorant SC', serif", fontStyle: "italic" }}>Streaks &amp; Bonuses</p>
                <table style={tableStyle}>
                  <thead><tr><th style={thStyle}>Bonus</th><th style={{ ...thStyle, textAlign: "right" }}>Pts</th></tr></thead>
                  <tbody>
                    {[
                      ["Streak of 3 Birdies or Better (Max 1/Round)", "+3"],
                      ["Bogey Free Round", "+3"],
                      ["All Predetermined Rounds Under 70 Strokes", "+5"],
                      ["Hole In One", "+5"],
                    ].map(([label, pts]) => (
                      <tr key={label}><td style={tdStyle}>{label}</td><td style={tdPtsStyle}>{pts}</td></tr>
                    ))}
                  </tbody>
                </table>

                <p style={{ color: "#d4af37", fontWeight: 700, fontSize: "13px", letterSpacing: "1px", textTransform: "uppercase", margin: "14px 0 6px", fontFamily: "'Cormorant SC', serif", fontStyle: "italic" }}>Scoring Notes</p>
                <p style={{ fontSize: "14px", lineHeight: "1.8", opacity: 0.8, margin: "0 0 8px", fontFamily: "'Cormorant SC', serif", fontStyle: "italic" }}>
                  Ties for a finishing position will not reduce or average down points. For example, if 2 golfers tie for 3rd place, each will receive the 18 fantasy points for the 3rd place finish result.
                </p>
                <p style={{ fontSize: "14px", lineHeight: "1.8", opacity: 0.8, margin: 0, fontFamily: "'Cormorant SC', serif", fontStyle: "italic" }}>
                  Playoff holes will not count towards final scoring, with the exception of the finishing position scoring. The golfer who wins the tournament will receive the sole award of 1st place points, but will not accrue points for their scoring result in the individual playoff holes.
                </p>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* ── TOAST ── */}
      {toast && (
        <div className={`toast toast-${toast.type}`}>
          {toast.type === "info" && "↻ "}
          {toast.type === "success" && "✓ "}
          {toast.msg}
        </div>
      )}
    </>
  );
}
