"use client";
import React, { useState, useEffect } from "react";
import { db } from "../lib/firebase";
import { collection, addDoc, onSnapshot, query, where } from "firebase/firestore";

const salaryCap = 50000;

// 12:00 AM Pacific Time, Thursday April 10, 2025
// Using April 10 2025 00:00 PT = 07:00 UTC
const LOCK_TIME = new Date("2026-04-10T07:00:00Z");

export default function App() {
  const [players, setPlayers] = useState([]);
  const [lineup, setLineup] = useState([]);
  const [entries, setEntries] = useState([]);
  const [name, setName] = useState("");
  const [liveData, setLiveData] = useState({});
  const [tickerPlayers, setTickerPlayers] = useState([]);
  const [copied, setCopied] = useState(false);
  const [now, setNow] = useState(new Date());
  const [draftSaved, setDraftSaved] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);

  const poolId = "peter-pan-masters-2026";
  const isLocked = now >= LOCK_TIME;

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
      { name: "Jacob Bridgeman", salary: 7400 },
      { name: "Sam Burns", salary: 7400 },
      { name: "Harris English", salary: 7300 },
      { name: "Max Homa", salary: 7300 },
      { name: "Marco Penge", salary: 7300 },
      { name: "Adam Scott", salary: 7200 },
      { name: "J.J. Spaun", salary: 7200 },
      { name: "Maverick McNealy", salary: 7200 },
      { name: "Wyndham Clark", salary: 7100 },
      { name: "Ryan Fox", salary: 7100 },
      { name: "Sergio Garcia", salary: 7100 },
      { name: "Alex Noren", salary: 7000 },
      { name: "Dustin Johnson", salary: 7000 },
      { name: "Keegan Bradley", salary: 7000 },
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
      { name: "Tiger Woods", salary: 6500 },
      { name: "Andrew Novak", salary: 6400 },
      { name: "Sam Stevens", salary: 6400 },
      { name: "Phil Mickelson", salary: 6400 },
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
      const res = await fetch(
        "https://site.api.espn.com/apis/site/v2/sports/golf/pga/leaderboard"
      );
      const data = await res.json();
      const playersData = data?.events?.[0]?.competitions?.[0]?.competitors || [];

      const ticker = playersData
        .filter((p) => p.status?.type?.name !== "STATUS_WITHDRAWN")
        .sort((a, b) => (parseInt(a.rank) || 99) - (parseInt(b.rank) || 99))
        .slice(0, 30)
        .map((p) => {
          const pos = p.rank || "–";
          const playerName = p.athlete?.displayName || "Unknown";
          const scoreVal = p.score?.value ?? p.statistics?.find(s => s.name === "scoreToPar")?.displayValue;
          const scoreNum = parseInt(scoreVal) || 0;
          return { pos, name: playerName, score: scoreNum };
        });
      setTickerPlayers(ticker);

      const scores = {};
      playersData.forEach((p) => {
        const pName = p.athlete.displayName;
        const position = parseInt(p.rank?.replace("T", "")) || 50;
        let birdies = 0, pars = 0, bogeys = 0, doubles = 0, eagles = 0;
        (p.linescores || []).forEach((round) => {
          (round.holes || []).forEach((h) => {
            if (h.score == null || h.par == null) return;
            const diff = h.score - h.par;
            if (diff === -2) eagles++;
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
    } catch (err) {
      console.error("❌ ESPN fetch failed", err);
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
    const interval = setInterval(fetchLiveScores, 20000);
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
    await addDoc(collection(db, "entries"), { poolId, name, players: lineup });
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
      (stats.eagles || 0) * 8 +
      (stats.birdies || 0) * 3 +
      (stats.pars || 0) * 0.5 +
      (stats.bogeys || 0) * -0.5 +
      (stats.double_bogeys || 0) * -1 +
      (stats.triple_bogeys || 0) * -1.5 +
      (stats.hole_in_one || 0) * 10 +
      positionPoints
    );
  };

  const totalSalary = lineup.reduce((sum, p) => sum + p.salary, 0);
  const remaining = salaryCap - totalSalary;
  const canSubmit = !isLocked && lineup.length === 6 && totalSalary <= salaryCap && !!name;

  const scored = entries
    .map((e) => ({
      ...e,
      score: e.players.reduce((sum, p) => {
        const key = Object.keys(liveData).find(
          (n) => normalizeName(n) === normalizeName(p.name)
        );
        return key ? sum + calculateScore(liveData[key]) : sum;
      }, 0),
    }))
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
    background: "linear-gradient(145deg, #174f3a, #0f2e23)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: "8px",
    padding: "16px",
    marginBottom: "16px",
  };
  const tableStyle = { width: "100%", borderCollapse: "collapse", fontSize: "13px" };
  const thStyle = {
    textAlign: "left", color: "#d4af37", fontWeight: "bold",
    padding: "6px 8px", borderBottom: "1px solid rgba(212,175,55,0.3)",
    fontSize: "11px", letterSpacing: "1px", textTransform: "uppercase",
  };
  const tdStyle = { padding: "6px 8px", borderBottom: "1px solid rgba(255,255,255,0.06)", color: "white" };
  const tdPtsStyle = { ...tdStyle, textAlign: "right", color: "#d4af37", fontWeight: "bold" };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400;1,600;1,700&display=swap');

        /* ── TICKER ── */
        .ticker-wrap {
          width: 100%;
          overflow: hidden;
          background: rgba(0,0,0,0.45);
          border-bottom: 1px solid rgba(212,175,55,0.3);
          border-top: 1px solid rgba(212,175,55,0.15);
          position: relative;
        }
        .ticker-wrap::before, .ticker-wrap::after {
          content: '';
          position: absolute;
          top: 0; bottom: 0;
          width: 60px;
          z-index: 2;
          pointer-events: none;
        }
        .ticker-wrap::before { left: 0; background: linear-gradient(to right, rgba(0,0,0,0.6), transparent); }
        .ticker-wrap::after  { right: 0; background: linear-gradient(to left,  rgba(0,0,0,0.6), transparent); }
        .ticker-label {
          position: absolute; left: 0; top: 0; bottom: 0; z-index: 3;
          display: flex; align-items: center;
          padding: 0 14px 0 12px;
          background: rgba(0,0,0,0.6);
          border-right: 1px solid rgba(212,175,55,0.3);
          font-family: 'Playfair Display', serif;
          font-size: 10px; font-style: italic;
          color: #d4af37; letter-spacing: 0.12em;
          white-space: nowrap; gap: 7px;
        }
        .ticker-live-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: #e05252;
          animation: pulse 2s ease-in-out infinite; flex-shrink: 0;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.4; transform: scale(0.75); }
        }
        .ticker-track {
          display: flex; width: max-content;
          animation: ticker-scroll 60s linear infinite;
          padding-left: 110px;
        }
        .ticker-track:hover { animation-play-state: paused; }
        @keyframes ticker-scroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .ticker-item {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 8px 20px 8px 0;
          font-family: 'Playfair Display', serif;
          font-size: 12px; white-space: nowrap; color: #e8dfc0;
        }
        .ticker-pos  { font-size: 10px; color: #8aab93; font-style: italic; min-width: 22px; }
        .ticker-name { font-weight: 600; color: #f0e8cc; }
        .ticker-score-under { color: #5ec47a; font-weight: 700; }
        .ticker-score-even  { color: #c8b97a; }
        .ticker-score-over  { color: #e07070; font-weight: 700; }
        .ticker-divider { color: rgba(212,175,55,0.35); padding: 0 6px 0 20px; font-size: 10px; }

        /* ── HEADER ── */
        .masters-title {
          font-family: 'Playfair Display', 'Times New Roman', serif;
          font-size: clamp(38px, 5vw, 64px);
          font-weight: 700; font-style: italic;
          color: #d4af37; letter-spacing: 0.03em; line-height: 1.05; margin: 0;
          text-shadow: 0 1px 0 rgba(0,0,0,0.5), 0 0 40px rgba(212,175,55,0.25);
        }
        .masters-subtitle {
          font-family: 'Playfair Display', 'Times New Roman', serif;
          font-size: clamp(13px, 1.5vw, 16px);
          font-weight: 400; font-style: italic;
          color: #c8b97a; letter-spacing: 0.12em; margin: 0;
        }
        .masters-year {
          font-family: 'Playfair Display', 'Times New Roman', serif;
          font-size: clamp(12px, 1.2vw, 14px);
          font-weight: 400; color: #8aab93;
          letter-spacing: 0.35em; text-transform: uppercase; margin: 0;
        }
        .masters-rule {
          border: none; height: 1px;
          background: linear-gradient(to right, transparent, rgba(212,175,55,0.15) 15%, rgba(212,175,55,0.55) 50%, rgba(212,175,55,0.15) 85%, transparent);
          margin: 0;
        }
        .masters-rule-thin {
          border: none; height: 1px;
          background: linear-gradient(to right, transparent, rgba(212,175,55,0.08) 15%, rgba(212,175,55,0.25) 50%, rgba(212,175,55,0.08) 85%, transparent);
          margin: 0;
        }

        /* ── SHARE BUTTON ── */
        .share-btn {
          display: inline-flex; align-items: center; gap: 8px;
          background: rgba(0,0,0,0.3);
          border: 1px solid rgba(212,175,55,0.35); border-radius: 20px;
          padding: 6px 16px;
          font-family: 'Playfair Display', serif;
          font-size: 12px; font-style: italic; color: #c8b97a;
          letter-spacing: 0.05em; cursor: pointer; transition: all 0.2s ease;
        }
        .share-btn:hover { background: rgba(212,175,55,0.12); border-color: rgba(212,175,55,0.6); color: #f0e8cc; }
        .share-btn.copied { background: rgba(94,196,122,0.15); border-color: rgba(94,196,122,0.5); color: #5ec47a; }
        .share-icon { width: 12px; height: 12px; flex-shrink: 0; }

        /* ── PLAYER PICKER ── */
        .picker-section {
          background: linear-gradient(145deg, #174f3a, #0f2e23);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 16px;
        }
        .picker-header {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          margin-bottom: 4px;
        }
        .picker-title {
          font-family: 'Playfair Display', 'Times New Roman', serif;
          font-size: clamp(18px, 2vw, 22px);
          font-weight: 700;
          font-style: italic;
          color: #f7e7a1;
          letter-spacing: 0.04em;
          margin: 0;
        }
        .picker-salary-cap {
          font-family: 'Playfair Display', serif;
          font-size: 11px;
          font-style: italic;
          color: #8aab93;
          letter-spacing: 0.08em;
        }
        .picker-rule {
          border: none; height: 1px; margin: 10px 0 14px;
          background: linear-gradient(to right, rgba(212,175,55,0.5), rgba(212,175,55,0.08) 80%, transparent);
        }
        .player-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 9px 12px;
          margin: 5px 0;
          border-radius: 5px;
          border: 1px solid rgba(255,255,255,0.1);
          background: rgba(255,255,255,0.03);
          cursor: pointer;
          transition: all 0.18s ease;
          font-family: 'Playfair Display', serif;
          font-size: 13px;
        }
        .player-row:hover:not(.player-row--locked):not(.player-row--selected) {
          background: rgba(255,255,255,0.07);
          border-color: rgba(212,175,55,0.25);
          transform: translateX(3px);
        }
        .player-row--selected {
          background: rgba(212,175,55,0.18);
          border-color: rgba(212,175,55,0.6);
          transform: translateX(3px);
        }
        .player-row--selected .player-name { color: #f7e7a1; font-weight: 700; }
        .player-row--selected .player-salary { color: #d4af37; }
        .player-row--full { opacity: 0.38; cursor: default; }
        .player-row--locked { cursor: not-allowed; opacity: 0.5; }
        .player-name { color: #ddd8c4; font-style: italic; letter-spacing: 0.02em; }
        .player-salary { color: #8aab93; font-size: 12px; font-style: normal; letter-spacing: 0.05em; }
        .player-check {
          width: 16px; height: 16px; margin-right: 8px;
          border-radius: 50%; background: #d4af37;
          display: inline-flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }

        /* ── LOCK BANNER ── */
        .lock-banner {
          background: rgba(180,60,60,0.2);
          border: 1px solid rgba(220,80,80,0.4);
          border-radius: 6px;
          padding: 12px 16px;
          text-align: center;
          font-family: 'Playfair Display', serif;
          font-size: 13px;
          font-style: italic;
          color: #e07070;
          margin-bottom: 16px;
          letter-spacing: 0.05em;
        }
        .countdown-banner {
          background: rgba(212,175,55,0.08);
          border: 1px solid rgba(212,175,55,0.25);
          border-radius: 6px;
          padding: 10px 16px;
          text-align: center;
          font-family: 'Playfair Display', serif;
          font-size: 12px;
          font-style: italic;
          color: #c8b97a;
          margin-bottom: 14px;
          letter-spacing: 0.05em;
        }
        .countdown-time {
          font-size: 15px;
          font-weight: 700;
          color: #d4af37;
          font-style: normal;
          letter-spacing: 0.08em;
        }

        /* ── DRAFT BUTTONS ── */
        .draft-btn {
          display: inline-flex; align-items: center; gap: 6px;
          background: rgba(0,0,0,0.25);
          border: 1px solid rgba(212,175,55,0.3);
          border-radius: 4px;
          padding: 7px 14px;
          font-family: 'Playfair Display', serif;
          font-size: 12px; font-style: italic;
          color: #c8b97a; cursor: pointer;
          transition: all 0.2s; letter-spacing: 0.04em;
        }
        .draft-btn:hover { background: rgba(212,175,55,0.1); color: #f0e8cc; border-color: rgba(212,175,55,0.5); }
        .draft-btn.saved { background: rgba(94,196,122,0.12); border-color: rgba(94,196,122,0.4); color: #5ec47a; }
        .draft-btn.clear { border-color: rgba(220,80,80,0.3); color: #c47070; }
        .draft-btn.clear:hover { background: rgba(220,80,80,0.1); border-color: rgba(220,80,80,0.5); color: #e07070; }
      `}</style>

      <div style={{ minHeight: "100vh", background: "linear-gradient(180deg, #0b3d2e 0%, #145a43 100%)" }}>

        {/* ── LIVE TICKER ── */}
        <div className="ticker-wrap">
          <div className="ticker-label">
            <span className="ticker-live-dot" />
            Live
          </div>
          <div className="ticker-track">
            {[...tickerContent, ...tickerContent].map((p, i) => (
              <React.Fragment key={i}>
                <span className="ticker-item">
                  <span className="ticker-pos">{p.pos}</span>
                  <span className="ticker-name">{p.name}</span>
                  {p.score !== null && p.score !== undefined && (
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
          <header style={{ textAlign: "center", padding: "36px 20px 32px", marginBottom: "32px" }}>
            <div style={{
              position: "relative", display: "inline-block",
              width: "100%", maxWidth: "680px",
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
              <hr className="masters-rule" style={{ marginBottom: "18px" }} />
              <p className="masters-year" style={{ marginBottom: "10px" }}>Peter&nbsp;&nbsp;Pan</p>
              <h1 className="masters-title">Masters 2026</h1>
              <hr className="masters-rule-thin" style={{ margin: "14px auto", maxWidth: "260px" }} />
              <p className="masters-subtitle" style={{ marginBottom: "20px" }}>Degeneracy Unlike Any Other</p>
              <hr className="masters-rule" style={{ marginBottom: "20px" }} />
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                <button onClick={handleCopyLink} className={`share-btn${copied ? " copied" : ""}`}>
                  {copied ? (
                    <>
                      <svg className="share-icon" viewBox="0 0 12 12" fill="none">
                        <polyline points="1.5,6 4.5,9 10.5,3" stroke="#5ec47a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      Link copied!
                    </>
                  ) : (
                    <>
                      <svg className="share-icon" viewBox="0 0 12 12" fill="none">
                        <circle cx="9.5" cy="2.5" r="1.5" stroke="#c8b97a" strokeWidth="1.2" />
                        <circle cx="9.5" cy="9.5" r="1.5" stroke="#c8b97a" strokeWidth="1.2" />
                        <circle cx="2.5" cy="6"   r="1.5" stroke="#c8b97a" strokeWidth="1.2" />
                        <line x1="4" y1="5.2" x2="8" y2="3.3" stroke="#c8b97a" strokeWidth="1" strokeLinecap="round" />
                        <line x1="4" y1="6.8" x2="8" y2="8.7" stroke="#c8b97a" strokeWidth="1" strokeLinecap="round" />
                      </svg>
                      Share pool link
                    </>
                  )}
                </button>
              </div>
            </div>
          </header>

          {/* ── TWO-COLUMN ── */}
          <div style={{ display: "flex", gap: "40px", alignItems: "flex-start", position: "relative" }}>
            <div style={{ position: "absolute", left: "50%", top: 0, bottom: 0, width: "1px", background: "rgba(212,175,55,0.3)" }} />

            {/* LEFT — Styled Player Picker */}
            <div style={{ width: "50%" }}>

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
                <hr className="picker-rule" />

                {players.map((p) => {
                  const selected = !!lineup.find((lp) => lp.name === p.name);
                  const fullAndNotSelected = lineup.length >= 6 && !selected;
                  return (
                    <div
                      key={p.name}
                      onClick={() => togglePlayer(p)}
                      className={[
                        "player-row",
                        selected ? "player-row--selected" : "",
                        fullAndNotSelected ? "player-row--full" : "",
                        isLocked ? "player-row--locked" : "",
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
                      </span>
                      <span className="player-salary">${p.salary.toLocaleString()}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* RIGHT */}
            <div style={{ width: "50%" }}>

              {/* 1. POOL LEADERBOARD */}
              <div style={sectionStyle}>
                <h2 style={{ color: "#f7e7a1", marginTop: 0 }}>🏆 Pool Leaderboard</h2>
                {scored.length === 0 && (
                  <p style={{ opacity: 0.5, fontSize: "13px", margin: 0 }}>No entries yet.</p>
                )}
                {scored.map((e, i) => (
                  <div key={e.id} style={{
                    display: "flex", justifyContent: "space-between",
                    padding: "12px", margin: "6px 0",
                    background: i === 0 ? "linear-gradient(90deg, #d4af37, #f7e7a1)" : "rgba(23,79,58,0.85)",
                    color: i === 0 ? "black" : "white",
                    borderRadius: "8px", fontWeight: i === 0 ? "bold" : "normal",
                    boxShadow: i === 0 ? "0 0 10px rgba(212,175,55,0.6)" : "none",
                  }}>
                    <span>{i + 1}. {e.name}</span>
                    <span>{e.score.toFixed(1)} pts</span>
                  </div>
                ))}
              </div>

              {/* 2. YOUR LINEUP */}
              <div style={sectionStyle}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                  <h3 style={{ color: "#f7e7a1", margin: 0 }}>
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
                    fontFamily: "'Playfair Display', serif",
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
                  <div style={{ fontSize: "11px", opacity: 0.65, letterSpacing: "1px", textTransform: "uppercase", marginBottom: "4px" }}>Salary Used</div>
                  <div style={{ fontSize: "22px", fontWeight: "bold", color: totalSalary > salaryCap ? "#ff4d4f" : "#ffffff" }}>
                    ${totalSalary.toLocaleString()}
                    <span style={{ fontSize: "13px", opacity: 0.55 }}> / $50,000</span>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "11px", opacity: 0.65, letterSpacing: "1px", textTransform: "uppercase", marginBottom: "4px" }}>Remaining</div>
                  <div style={{ fontSize: "22px", fontWeight: "bold", color: remaining < 0 ? "#ff4d4f" : "#d4af37" }}>
                    ${remaining.toLocaleString()}
                    {remaining < 0 && <span style={{ fontSize: "13px", marginLeft: "6px" }}>⚠️ Over</span>}
                  </div>
                </div>
              </div>

              {/* 5. SUBMIT ENTRY */}
              <div style={sectionStyle}>
                <h3 style={{ color: "#f7e7a1", marginTop: 0 }}>✍️ Submit Entry</h3>
                {isLocked ? (
                  <p style={{ color: "#e07070", fontStyle: "italic", fontSize: "13px", margin: 0 }}>
                    Submissions are closed. The field is set — good luck.
                  </p>
                ) : (
                  <>
                    <input
                      placeholder="Your Name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      style={{
                        width: "100%", padding: "10px", marginBottom: "10px",
                        boxSizing: "border-box", borderRadius: "4px",
                        border: "1px solid rgba(255,255,255,0.3)",
                        background: "rgba(0,0,0,0.3)", color: "white", fontSize: "14px",
                      }}
                    />
                    <button
                      onClick={submitEntry}
                      disabled={!canSubmit}
                      style={{
                        width: "100%", padding: "12px",
                        background: canSubmit ? "#f7e7a1" : "#555",
                        color: canSubmit ? "#0b3d2e" : "#999",
                        border: "none", fontWeight: "bold", borderRadius: "4px",
                        fontSize: "15px", cursor: canSubmit ? "pointer" : "not-allowed",
                        transition: "background 0.2s",
                      }}
                    >
                      Submit Entry
                    </button>
                  </>
                )}
              </div>

              {/* 6. SCORING RULES */}
              <div style={sectionStyle}>
                <h3 style={{ color: "#f7e7a1", marginTop: 0 }}>📋 Scoring Rules</h3>

                <p style={{ color: "#d4af37", fontWeight: "bold", fontSize: "11px", letterSpacing: "1px", textTransform: "uppercase", marginBottom: "6px" }}>Per Hole Scoring</p>
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

                <p style={{ color: "#d4af37", fontWeight: "bold", fontSize: "11px", letterSpacing: "1px", textTransform: "uppercase", margin: "14px 0 6px" }}>Tournament Finish</p>
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

                <p style={{ color: "#d4af37", fontWeight: "bold", fontSize: "11px", letterSpacing: "1px", textTransform: "uppercase", margin: "14px 0 6px" }}>Streaks &amp; Bonuses</p>
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

                <p style={{ color: "#d4af37", fontWeight: "bold", fontSize: "11px", letterSpacing: "1px", textTransform: "uppercase", margin: "14px 0 6px" }}>Scoring Notes</p>
                <p style={{ fontSize: "12px", lineHeight: "1.7", opacity: 0.8, margin: "0 0 8px" }}>
                  Ties for a finishing position will not reduce or average down points. For example, if 2 golfers tie for 3rd place, each will receive the 18 fantasy points for the 3rd place finish result.
                </p>
                <p style={{ fontSize: "12px", lineHeight: "1.7", opacity: 0.8, margin: 0 }}>
                  Playoff holes will not count towards final scoring, with the exception of the finishing position scoring. The golfer who wins the tournament will receive the sole award of 1st place points, but will not accrue points for their scoring result in the individual playoff holes.
                </p>
              </div>

            </div>
          </div>
        </div>
      </div>
    </>
  );
}
