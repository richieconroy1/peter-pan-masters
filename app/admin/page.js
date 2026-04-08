"use client";
import { useState, useEffect } from "react";
import { db } from "../../lib/firebase";
import { collection, onSnapshot, query, where, deleteDoc, doc } from "firebase/firestore";

const ADMIN_PASSWORD = "peterpan2026";
const poolId = "peter-pan-masters-2026";

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState(false);
  const [wrongPass, setWrongPass] = useState(false);
  const [entries, setEntries] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const handleLogin = () => {
    if (password === ADMIN_PASSWORD) {
      setAuthed(true);
      setWrongPass(false);
    } else {
      setWrongPass(true);
    }
  };

  useEffect(() => {
    if (!authed) return;
    const q = query(collection(db, "entries"), where("poolId", "==", poolId));
    const unsub = onSnapshot(q, (snap) => {
      const docs = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
        submittedAt: d.data().submittedAt?.toDate?.() || null,
      }));
      // Sort by submission time, newest first
      docs.sort((a, b) => (b.submittedAt || 0) - (a.submittedAt || 0));
      setEntries(docs);
    });
    return () => unsub();
  }, [authed]);

  const handleDelete = async (id) => {
    await deleteDoc(doc(db, "entries", id));
    setDeleteConfirm(null);
    setExpandedId(null);
  };

  const sectionStyle = {
    fontFamily: "'Georgia', serif",
    maxWidth: "700px",
    margin: "0 auto",
    padding: "40px 20px",
    color: "#f0e8cc",
  };

  if (!authed) {
    return (
      <div style={{
        minHeight: "100vh",
        background: "linear-gradient(170deg, #0a3828 0%, #0f4a35 30%, #0a2d20 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Georgia', serif",
      }}>
        <div style={{
          background: "linear-gradient(145deg, #163d2c, #0c2318)",
          border: "1px solid rgba(212,175,55,0.25)",
          borderRadius: "10px",
          padding: "40px",
          width: "320px",
          textAlign: "center",
          boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
        }}>
          <div style={{ fontSize: "28px", marginBottom: "8px" }}>🏆</div>
          <h1 style={{
            color: "#d4af37",
            fontSize: "22px",
            fontStyle: "italic",
            marginTop: 0,
            marginBottom: "6px",
          }}>
            Admin Panel
          </h1>
          <p style={{ color: "#8aab93", fontSize: "13px", fontStyle: "italic", marginBottom: "24px" }}>
            Peter Pan Masters 2026
          </p>
          <input
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            style={{
              width: "100%",
              padding: "10px 14px",
              boxSizing: "border-box",
              borderRadius: "5px",
              border: wrongPass
                ? "1px solid rgba(220,80,80,0.6)"
                : "1px solid rgba(212,175,55,0.3)",
              background: "rgba(0,0,0,0.3)",
              color: "white",
              fontSize: "15px",
              fontFamily: "'Georgia', serif",
              marginBottom: "10px",
              outline: "none",
            }}
          />
          {wrongPass && (
            <p style={{ color: "#e07070", fontSize: "12px", fontStyle: "italic", margin: "0 0 10px" }}>
              Incorrect password
            </p>
          )}
          <button
            onClick={handleLogin}
            style={{
              width: "100%",
              padding: "11px",
              background: "#d4af37",
              color: "#0b3d2e",
              border: "none",
              borderRadius: "5px",
              fontFamily: "'Georgia', serif",
              fontSize: "15px",
              fontWeight: "bold",
              fontStyle: "italic",
              cursor: "pointer",
            }}
          >
            Enter
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(170deg, #0a3828 0%, #0f4a35 30%, #0a2d20 100%)",
    }}>
      <div style={sectionStyle}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <h1 style={{
            color: "#d4af37",
            fontSize: "28px",
            fontStyle: "italic",
            marginBottom: "4px",
          }}>
            Admin Panel
          </h1>
          <p style={{ color: "#8aab93", fontSize: "13px", fontStyle: "italic", margin: 0 }}>
            Peter Pan Masters 2026 · {entries.length} {entries.length === 1 ? "entry" : "entries"} submitted
          </p>
        </div>

        {/* Summary bar */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          background: "rgba(212,175,55,0.08)",
          border: "1px solid rgba(212,175,55,0.2)",
          borderRadius: "8px",
          padding: "14px 20px",
          marginBottom: "20px",
        }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ color: "#d4af37", fontSize: "24px", fontWeight: "bold" }}>{entries.length}</div>
            <div style={{ color: "#8aab93", fontSize: "12px", fontStyle: "italic" }}>Entries</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ color: "#5ec47a", fontSize: "24px", fontWeight: "bold" }}>${entries.length * 40}</div>
            <div style={{ color: "#8aab93", fontSize: "12px", fontStyle: "italic" }}>Total buy-ins</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ color: "#d4af37", fontSize: "24px", fontWeight: "bold" }}>${Math.round(entries.length * 40 * 0.8)}</div>
            <div style={{ color: "#8aab93", fontSize: "12px", fontStyle: "italic" }}>1st place (80%)</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ color: "#c8b97a", fontSize: "24px", fontWeight: "bold" }}>${Math.round(entries.length * 40 * 0.2)}</div>
            <div style={{ color: "#8aab93", fontSize: "12px", fontStyle: "italic" }}>2nd place (20%)</div>
          </div>
        </div>

        {/* Entry list */}
        {entries.length === 0 && (
          <p style={{ color: "#8aab93", fontStyle: "italic", textAlign: "center" }}>No entries yet.</p>
        )}

        {entries.map((e, i) => (
          <div key={e.id} style={{
            background: "linear-gradient(145deg, #163d2c, #0c2318)",
            border: "1px solid rgba(212,175,55,0.15)",
            borderRadius: "8px",
            marginBottom: "10px",
            overflow: "hidden",
          }}>
            {/* Entry row */}
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "14px 18px",
              cursor: "pointer",
            }}
              onClick={() => setExpandedId(expandedId === e.id ? null : e.id)}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                <span style={{
                  color: "#8aab93",
                  fontSize: "13px",
                  fontStyle: "italic",
                  minWidth: "20px",
                }}>
                  {i + 1}.
                </span>
                <span style={{
                  color: "#f7e7a1",
                  fontSize: "17px",
                  fontStyle: "italic",
                  fontWeight: "bold",
                }}>
                  {e.name}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span style={{
                  fontSize: "11px",
                  color: "#8aab93",
                  fontStyle: "italic",
                }}>
                  {e.submittedAt
                    ? e.submittedAt.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })
                    : "–"
                  }
                </span>
                <span style={{ color: "#d4af37", fontSize: "12px" }}>
                  {expandedId === e.id ? "▲" : "▼"}
                </span>
              </div>
            </div>

            {/* Expanded lineup */}
            {expandedId === e.id && (
              <div style={{
                borderTop: "1px solid rgba(212,175,55,0.1)",
                padding: "14px 18px",
              }}>
                <p style={{ color: "#8aab93", fontSize: "12px", fontStyle: "italic", margin: "0 0 10px" }}>
                  Lineup · {(e.players || []).length} players · ${(e.players || []).reduce((s, p) => s + (p.salary || 0), 0).toLocaleString()} salary
                </p>
                {(e.players || []).map((p, j) => (
                  <div key={j} style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "5px 0",
                    borderBottom: "1px solid rgba(255,255,255,0.05)",
                    fontSize: "14px",
                  }}>
                    <span style={{ color: "#ddd8c4", fontStyle: "italic" }}>{p.name}</span>
                    <span style={{ color: "#8aab93" }}>${(p.salary || 0).toLocaleString()}</span>
                  </div>
                ))}

                {/* Delete button */}
                <div style={{ marginTop: "14px", textAlign: "right" }}>
                  {deleteConfirm === e.id ? (
                    <span>
                      <span style={{ color: "#e07070", fontSize: "13px", fontStyle: "italic", marginRight: "12px" }}>
                        Delete this entry?
                      </span>
                      <button
                        onClick={() => handleDelete(e.id)}
                        style={{
                          background: "rgba(220,80,80,0.2)",
                          border: "1px solid rgba(220,80,80,0.5)",
                          color: "#e07070",
                          borderRadius: "4px",
                          padding: "5px 12px",
                          fontSize: "12px",
                          cursor: "pointer",
                          marginRight: "8px",
                          fontStyle: "italic",
                        }}
                      >
                        Yes, delete
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(null)}
                        style={{
                          background: "rgba(0,0,0,0.2)",
                          border: "1px solid rgba(255,255,255,0.15)",
                          color: "#8aab93",
                          borderRadius: "4px",
                          padding: "5px 12px",
                          fontSize: "12px",
                          cursor: "pointer",
                          fontStyle: "italic",
                        }}
                      >
                        Cancel
                      </button>
                    </span>
                  ) : (
                    <button
                      onClick={() => setDeleteConfirm(e.id)}
                      style={{
                        background: "transparent",
                        border: "1px solid rgba(220,80,80,0.3)",
                        color: "#c47070",
                        borderRadius: "4px",
                        padding: "5px 12px",
                        fontSize: "12px",
                        cursor: "pointer",
                        fontStyle: "italic",
                      }}
                    >
                      Delete entry
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Back link */}
        <div style={{ textAlign: "center", marginTop: "32px" }}>
          <a href="/" style={{
            color: "#8aab93",
            fontSize: "13px",
            fontStyle: "italic",
            textDecoration: "none",
            letterSpacing: "0.05em",
          }}>
            ← Back to pool
          </a>
        </div>
      </div>
    </div>
  );
}
