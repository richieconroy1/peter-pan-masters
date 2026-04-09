"use client";
import React, { useState, useEffect } from "react";
import { db } from "../lib/firebase";
import { collection, addDoc, onSnapshot, query, where } from "firebase/firestore";

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
  const [selectedEntrant, setSelectedEntrant] = useState(null);
  const [toast, setToast] = useState(null);

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
      if (!res.ok) throw new Error("SR failed");
      const json = await res.json();
      if (json.error) throw new Error(json.error);

      const leaderboard = json.leaderboard?.leaderboard || [];
      if (leaderboard.length === 0) throw new Error("no data");

      const ticker2 = leaderboard
        .filter((p) => p.status !== "withdrawn")
        .slice(0, 50)
        .map((p) => ({
          pos: p.tied ? `T${p.position}` : `${p.position || "–"}`,
          name: `${p.first_name || ""} ${p.last_name || ""}`.trim(),
          score: (p.score !== null && p.score !== undefined && !isNaN(Number(p.score))) ? Number(p.score) : null,
        }));
      setTickerPlayers(ticker2);

      const scores = {};
      leaderboard.forEach((p) => {
        const fullName = `${p.first_name} ${p.last_name}`;
        const position = p.position || 99;
        let birdies=0,pars=0,bogeys=0,doubles=0,eagles=0,double_eagles=0,tripleOrWorse=0,holeInOne=0;
        let bogeyFreeBonus=0,allRoundsUnder70=0;
        const completedRoundScores = [];
        (p.rounds || []).forEach((round) => {
          if (!round.thru || round.thru === 0) return;
          // SR: eagles field = regular eagles (-2), other_scores covers double eagles (-3+)
          eagles += round.eagles || 0;
          double_eagles += round.double_eagles || 0;
          birdies += round.birdies || 0;
          pars += round.pars || 0;
          bogeys += round.bogeys || 0;
          doubles += round.double_bogeys || 0;
          tripleOrWorse += round.other_scores || 0;
          holeInOne += round.holes_in_one || 0;
          if (round.thru === 18 && round.strokes > 0) {
            completedRoundScores.push(round.strokes);
            if ((round.bogeys||0)===0 && (round.double_bogeys||0)===0 && (round.other_scores||0)===0) bogeyFreeBonus++;
          }
        });
        if (completedRoundScores.length === 4 && completedRoundScores.every(s => s < 70)) allRoundsUnder70 = 1;
        scores[fullName] = { position, birdies, eagles, double_eagles, pars, bogeys, double_bogeys: doubles, triple_bogeys: tripleOrWorse, hole_in_one: holeInOne, birdie_streak_bonus: 0, bogey_free_bonus: bogeyFreeBonus, all_rounds_under_70_bonus: allRoundsUnder70 };
      });
      setLiveData(scores);

    } catch(err) {
      console.error("SR failed, ESPN fallback", err);
      try {
        const res = await fetch("https://site.api.espn.com/apis/site/v2/sports/golf/leaderboard?tournamentId=401811941");
        if (!res.ok) throw new Error("ESPN failed");
        const data = await res.json();
        const playersData = data?.events?.[0]?.competitions?.[0]?.competitors || [];
        const hasStarted = playersData.some((p) => (p.status?.thru||0) > 0);
        if (!hasStarted) {
          const ticker = playersData
            .filter((p) => p.status?.type?.name !== "STATUS_WITHDRAWN")
            .sort((a,b) => (a.status?.teeTime||"").localeCompare(b.status?.teeTime||""))
            .map((p) => ({ pos: p.status?.teeTime ? new Date(p.status.teeTime).toLocaleTimeString("en-US",{hour:"numeric",minute:"2-digit",hour12:true,timeZone:"America/New_York"}) : "–", name: p.athlete?.displayName||"Unknown", score: null, isTeeTime: true }));
          setTickerPlayers(ticker);
          return;
        }
        const ticker2 = playersData
          .filter((p) => p.status?.type?.name !== "STATUS_WITHDRAWN")
          .sort((a,b) => (parseInt(a.rank)||99)-(parseInt(b.rank)||99))
          .slice(0,50)
          .map((p) => {
            const stp = p.statistics?.find(s => s.name==="scoreToPar");
            const score = (stp&&stp.displayValue!=="-"&&stp.displayValue!=="--") ? Number(stp.value) : null;
            const thru = p.status?.thru===18?"F":p.status?.thru>0?"Thru "+p.status?.thru:null;
            return { pos: p.rank||"–", name: p.athlete?.displayName||"Unknown", score, thru };
          });
        setTickerPlayers(ticker2);
        const espnScores = {};
        playersData.forEach((p) => {
          const pName = p.athlete?.displayName;
          if (!pName) return;
          const liveRank = p.status?.position?.displayName;
          const position = liveRank&&liveRank!=="-"&&liveRank!=="0" ? parseInt(liveRank.replace("T",""))||99 : parseInt((p.rank||"99").replace("T",""))||99;
          let birdies=0,pars=0,bogeys=0,doubles=0,eagles=0,double_eagles=0,holeInOne=0;
          (p.linescores||[]).forEach((round) => {
            (round.holes||[]).forEach((h) => {
              const hScore=h.score??h.value??null;
              const hPar=h.par??null;
              if(hScore==null||hPar==null)return;
              const diff=hScore-hPar;
              if(diff<=-2)eagles++;
              else if(diff===-1)birdies++;
              else if(diff===0)pars++;
              else if(diff===1)bogeys++;
              else if(diff===2)doubles++;
              if(hScore===1&&hPar>=3)holeInOne++;
            });
          });
          espnScores[pName] = { position, birdies, eagles, double_eagles, pars, bogeys, double_bogeys: doubles, triple_bogeys: 0, hole_in_one: holeInOne, birdie_streak_bonus: 0, bogey_free_bonus: 0, all_rounds_under_70_bonus: 0 };
        });
        setLiveData(espnScores);
      } catch(e) { console.error("ESPN also failed", e); }
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
    const interval = setInterval(fetchLiveScores, 180000);
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
      (stats.eagles || 0) * 13 +
      (stats.birdies || 0) * 3 +
      (stats.pars || 0) * 0.5 +
      (stats.bogeys || 0) * -0.5 +
      (stats.double_bogeys || 0) * -1 +
      (stats.triple_bogeys || 0) * -1 +
      (stats.hole_in_one || 0) * 5 +
      (stats.birdie_streak_bonus || 0) * 3 +
      (stats.bogey_free_bonus || 0) * 3 +
      (stats.all_rounds_under_70_bonus || 0) * 5 +
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
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+SC:ital,wght@0,400;0,600;0,700;1,400;1,600;1,700&family=Cormorant:ital,wght@0,400;0,600;0,700;1,400;1,600;1,700&display=swap');

        /* ── PAGE LOAD ANIMATIONS ── */
        @keyframes fadeSlideDown {
          from { opacity: 0; transform: translateY(-16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes countUp {
          from { opacity: 0.4; transform: scale(0.95); }
          to   { opacity: 1;   transform: scale(1); }
        }
        .anim-header {
          opacity: 0;
          animation: fadeSlideDown 0.7s ease forwards;
          animation-delay: 0.1s;
        }
        .anim-ticker {
          opacity: 0;
          animation: fadeSlideDown 0.5s ease forwards;
          animation-delay: 0s;
        }
        .anim-left {
          opacity: 0;
          animation: fadeSlideUp 0.7s ease forwards;
          animation-delay: 0.3s;
        }
        .anim-right {
          opacity: 0;
          animation: fadeSlideUp 0.7s ease forwards;
          animation-delay: 0.5s;
        }
        .score-update {
          animation: countUp 0.4s ease;
        }

        /* ── TOAST ── */
        .toast {
          position: fixed;
          bottom: 24px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 999;
          padding: 10px 20px;
          border-radius: 20px;
          font-family: 'Cormorant SC', serif;
          font-size: 13px;
          font-style: italic;
          letter-spacing: 0.06em;
          pointer-events: none;
          animation: fadeIn 0.3s ease;
          white-space: nowrap;
        }
        .toast-info {
          background: rgba(10,40,28,0.92);
          border: 1px solid rgba(212,175,55,0.35);
          color: #c8b97a;
        }
        .toast-success {
          background: rgba(10,40,28,0.92);
          border: 1px solid rgba(94,196,122,0.5);
          color: #5ec47a;
        }
        .toast-error {
          background: rgba(40,10,10,0.92);
          border: 1px solid rgba(220,80,80,0.5);
          color: #e07070;
        }

        /* ── SEARCH INPUT ── */
        .player-search {
          width: 100%;
          padding: 9px 14px;
          margin-bottom: 10px;
          box-sizing: border-box;
          border-radius: 5px;
          border: 1px solid rgba(212,175,55,0.25);
          background: rgba(0,0,0,0.25);
          color: #f5f0e0;
          font-family: 'Cormorant SC', serif;
          font-size: 15px;
          font-style: italic;
          letter-spacing: 0.04em;
          outline: none;
          transition: border-color 0.2s;
        }
        .player-search::placeholder { color: rgba(200,185,122,0.45); }
        .player-search:focus { border-color: rgba(212,175,55,0.55); }

        /* ── PICKER BADGE ── */
        .picker-badge {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 10px;
          font-family: 'Cormorant SC', serif;
          font-size: 13px;
          font-style: italic;
          color: #8aab93;
          letter-spacing: 0.05em;
        }
        .picker-badge-count {
          color: #d4af37;
          font-weight: 700;
          font-size: 15px;
        }
        .picker-badge-over { color: #e07070; }

        /* ── CUT LINE ── */
        .cut-line-row {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 6px 0;
          margin: 4px 0;
        }
        .cut-line-label {
          font-family: 'Cormorant SC', serif;
          font-size: 11px;
          font-style: italic;
          color: #e07070;
          letter-spacing: 0.1em;
          white-space: nowrap;
          opacity: 0.8;
        }
        .cut-line-rule {
          flex: 1;
          height: 1px;
          background: linear-gradient(to right, rgba(224,112,112,0.5), transparent);
        }

        /* ── MOBILE RESPONSIVE ── */
        @media (max-width: 768px) {
          .two-col {
            flex-direction: column-reverse !important;
            gap: 0 !important;
          }
          .two-col-left,
          .two-col-right {
            width: 100% !important;
          }
          .two-col-divider { display: none !important; }
          .masters-title-word {
            font-size: clamp(52px, 15vw, 80px) !important;
          }
          .masters-title-year {
            font-size: clamp(18px, 5vw, 28px) !important;
          }
        }

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
          font-family: 'Cormorant SC', 'Cormorant', serif;
          font-size: 13px; font-style: italic;
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
          padding: 10px 20px 10px 0;
          font-family: 'Cormorant SC', 'Cormorant', serif;
          font-size: 15px; white-space: nowrap; color: #e8dfc0;
        }
        .ticker-pos  { font-size: 13px; color: #8aab93; font-style: italic; min-width: 26px; }
        .ticker-name { font-weight: 600; color: #f0e8cc; }
        .ticker-score-under { color: #5ec47a; font-weight: 700; }
        .ticker-score-even  { color: #c8b97a; }
        .ticker-score-over  { color: #e07070; font-weight: 700; }
        .ticker-divider { color: rgba(212,175,55,0.35); padding: 0 6px 0 20px; font-size: 13px; }

        /* ── HEADER ── */
        .masters-title {
          font-family: 'Cormorant SC', 'Cormorant', 'Times New Roman', serif;
          font-size: clamp(42px, 5.5vw, 70px);
          font-weight: 700; font-style: italic;
          color: #d4af37; letter-spacing: 0.05em; line-height: 1.05; margin: 0;
          text-shadow: 0 1px 0 rgba(0,0,0,0.5), 0 0 40px rgba(212,175,55,0.25);
        }
        .masters-subtitle {
          font-family: 'Cormorant SC', 'Cormorant', 'Times New Roman', serif;
          font-size: clamp(15px, 1.8vw, 19px);
          font-weight: 400; font-style: italic;
          color: #c8b97a; letter-spacing: 0.15em; margin: 0;
        }
        .masters-year {
          font-family: 'Cormorant SC', 'Cormorant', 'Times New Roman', serif;
          font-size: clamp(13px, 1.4vw, 16px);
          font-weight: 600; color: #8aab93;
          letter-spacing: 0.5em; text-transform: uppercase; margin: 0;
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

        /* ── AUGUSTA TEXTURE OVERLAY ── */
        .augusta-bg::before {
          content: '';
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 0;
          background-image:
            repeating-linear-gradient(
              0deg,
              transparent,
              transparent 3px,
              rgba(0,0,0,0.04) 3px,
              rgba(0,0,0,0.04) 4px
            ),
            repeating-linear-gradient(
              90deg,
              transparent,
              transparent 8px,
              rgba(255,255,255,0.012) 8px,
              rgba(255,255,255,0.012) 9px
            );
        }
        .augusta-bg > * { position: relative; z-index: 1; }

        /* ── SCORECARD LEADERBOARD ── */
        .scorecard-table {
          width: 100%; border-collapse: collapse;
          font-family: 'Cormorant SC', 'Cormorant', serif; font-size: 13px;
        }
        .scorecard-table thead tr {
          background: rgba(0,0,0,0.3);
          border-bottom: 1px solid rgba(212,175,55,0.4);
        }
        .scorecard-table th {
          padding: 7px 8px; color: #d4af37;
          font-size: 10px; font-weight: 700;
          letter-spacing: 1.2px; text-transform: uppercase;
          text-align: center; font-style: normal;
        }
        .scorecard-table th:first-child,
        .scorecard-table th:nth-child(2) { text-align: left; }
        .scorecard-table tbody tr {
          border-bottom: 1px solid rgba(255,255,255,0.05);
          transition: background 0.15s;
        }
        .scorecard-table tbody tr:hover { background: rgba(255,255,255,0.03); }
        .scorecard-table tbody tr.row-first {
          background: transparent;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        .scorecard-table td { padding: 0; vertical-align: top; }
        .scorecard-pos {
          padding: 10px 6px 10px 8px; color: #8aab93;
          font-size: 12px; font-style: italic;
          white-space: nowrap; width: 24px;
        }
        .row-first .scorecard-pos { color: #8aab93; }
        .scorecard-name-col { padding: 6px 8px; }
        .scorecard-entry-name {
          font-size: 20px; font-weight: 700;
          font-style: italic;
          color: #d4af37; letter-spacing: 0.02em;
          font-family: 'Cormorant SC', 'Cormorant', serif;
        }
        .row-first .scorecard-entry-name { color: #d4af37; }
        .scorecard-players {
          display: flex; flex-wrap: wrap; gap: 2px 8px; margin-top: 3px;
        }
        .scorecard-player-chip {
          font-size: 15px; font-style: normal; color: white; white-space: nowrap;
          font-family: 'Cormorant SC', 'Cormorant', serif;
          letter-spacing: 0.01em;
          display: inline-block;
          padding: 2px 0;
        }
        .row-first .scorecard-player-chip { color: white; }
        .chip-eagle { color: #d4af37 !important; font-weight: 700; }
        .chip-birdie { color: #5ec47a !important; }
        .chip-bogey { color: #e07070 !important; }
        .chip-pos { color: #a8c4ae !important; font-size: 10px; }
        .scorecard-pts {
          padding: 10px 10px 10px 4px; text-align: right;
          font-size: 22px; font-weight: 700; color: #d4af37; white-space: nowrap;
          font-family: 'Cormorant SC', serif;
        }
        .row-first .scorecard-pts { color: #d4af37; }
        .scorecard-pts-label {
          font-size: 12px; font-weight: 400; opacity: 0.7;
          letter-spacing: 0.5px; text-transform: uppercase; display: block;
        }

        .share-btn {
          display: inline-flex; align-items: center; gap: 8px;
          background: rgba(0,0,0,0.3);
          border: 1px solid rgba(212,175,55,0.35); border-radius: 20px;
          padding: 6px 16px;
          font-family: 'Cormorant SC', 'Cormorant', serif;
          font-size: 12px; font-style: italic; color: #c8b97a;
          letter-spacing: 0.05em; cursor: pointer; transition: all 0.2s ease;
        }
        .share-btn:hover { background: rgba(212,175,55,0.12); border-color: rgba(212,175,55,0.6); color: #f0e8cc; }
        .share-btn.copied { background: rgba(94,196,122,0.15); border-color: rgba(94,196,122,0.5); color: #5ec47a; }
        .share-icon { width: 12px; height: 12px; flex-shrink: 0; }

        /* ── PLAYER PICKER ── */
        .picker-section {
          background: linear-gradient(145deg, #163d2c, #0c2318);
          border: 1px solid rgba(212,175,55,0.15);
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 16px;
          box-shadow: 0 4px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04);
        }
        .picker-header {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          margin-bottom: 4px;
        }
        .picker-title {
          font-family: 'Cormorant SC', 'Cormorant', 'Times New Roman', serif;
          font-size: clamp(18px, 2vw, 22px);
          font-weight: 700;
          font-style: italic;
          color: #f7e7a1;
          letter-spacing: 0.04em;
          margin: 0;
        }
        .picker-salary-cap {
          font-family: 'Cormorant SC', 'Cormorant', serif;
          font-size: 14px;
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
          font-family: 'Cormorant SC', 'Cormorant', serif;
          font-size: 17px;
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
        .player-row--cut { opacity: 0.45; }
        .player-row--cut .player-name { text-decoration: line-through; text-decoration-color: rgba(224,112,112,0.5); }
        .player-name { color: #f5f0e0; font-style: italic; letter-spacing: 0.02em; font-size: 17px; }
        .player-salary { color: #a8c4ae; font-size: 15px; font-style: normal; letter-spacing: 0.05em; }
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
          font-family: 'Cormorant SC', 'Cormorant', serif;
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
          font-family: 'Cormorant SC', 'Cormorant', serif;
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
          font-family: 'Cormorant SC', 'Cormorant', serif;
          font-size: 12px; font-style: italic;
          color: #c8b97a; cursor: pointer;
          transition: all 0.2s; letter-spacing: 0.04em;
        }
        .draft-btn:hover { background: rgba(212,175,55,0.1); color: #f0e8cc; border-color: rgba(212,175,55,0.5); }
        .draft-btn.saved { background: rgba(94,196,122,0.12); border-color: rgba(94,196,122,0.4); color: #5ec47a; }
        .draft-btn.clear { border-color: rgba(220,80,80,0.3); color: #c47070; }
        .draft-btn.clear:hover { background: rgba(220,80,80,0.1); border-color: rgba(220,80,80,0.5); color: #e07070; }
      `}</style>

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

            {/* LEFT — Scoring Rules */}
            <div className="two-col-left anim-left" style={{ width: "50%" }}>
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
                          <th style={{ ...thStyle, width: "28px" }}>#</th>
                          <th style={thStyle}>Entrant / Roster</th>
                          <th style={{ ...thStyle, textAlign: "right" }}>Pts</th>
                        </tr>
                      </thead>
                      <tbody>
                        {scored.map((e, i) => (
                          <tr key={e.id}>
                            <td className="scorecard-pos">{i + 1}</td>
                            <td className="scorecard-name-col">
                              <div className="scorecard-entry-name">{e.name}</div>
                              <div className="scorecard-players">
                                {(e.playerStats || []).map((p, j) => {
                                  const s = p.stats;
                                  const chips = [];
                                  if (s) {
                                    if (s.eagles > 0) chips.push(<span key="e" className="chip-eagle">🦅×{s.eagles}</span>);
                                    if (s.birdies > 0) chips.push(<span key="b" className="chip-birdie">🐦×{s.birdies}</span>);
                                    if (s.bogeys > 0) chips.push(<span key="bo" className="chip-bogey">bog×{s.bogeys}</span>);
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