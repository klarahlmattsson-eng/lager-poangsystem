"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

type Team = {
  id: number;
  name: string;
  color?: string;
  points: number;
};

const ADMIN_PASSWORD = "1234";

function getTeamColors(team: Team) {
  const name = team.name.toLowerCase();
  const color = (team.color || "").toLowerCase();

  if (name.includes("röd") || color.includes("red")) {
    return { background: "#e5093b", text: "#ffffff" };
  }
  if (name.includes("blå") || color.includes("blue")) {
    return { background: "#1577ff", text: "#ffffff" };
  }
  if (name.includes("gul") || color.includes("yellow")) {
    return { background: "#ffd500", text: "#1a1a1a" };
  }
  if (name.includes("grön") || color.includes("green")) {
    return { background: "#7bd67b", text: "#ffffff" };
  }

  return { background: "#333333", text: "#ffffff" };
}

export default function AdminPage() {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [adminName, setAdminName] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  const [teams, setTeams] = useState<Team[]>([]);
  const [reasons, setReasons] = useState<Record<number, string>>({});
  const [savingId, setSavingId] = useState<number | null>(null);

  useEffect(() => {
    const savedUnlocked = localStorage.getItem("admin_unlocked");
    const savedName = localStorage.getItem("admin_name");

    if (savedUnlocked === "yes") {
      setIsUnlocked(true);
    }

    if (savedName) {
      setAdminName(savedName);
    }
  }, []);

  useEffect(() => {
    if (isUnlocked) {
      loadData();
    }
  }, [isUnlocked]);

  async function loadData() {
    const { data, error } = await supabase
      .from("teams")
      .select("*")
      .order("points", { ascending: false });

    if (error) {
      console.error(error);
      return;
    }

    setTeams((data || []) as Team[]);
  }

  function handleLogin() {
    if (!adminName.trim()) {
      setLoginError("Skriv ditt namn");
      return;
    }

    if (password === ADMIN_PASSWORD) {
      localStorage.setItem("admin_unlocked", "yes");
      localStorage.setItem("admin_name", adminName.trim());
      setIsUnlocked(true);
      setLoginError("");
    } else {
      setLoginError("Fel lösenord");
    }
  }

  function handleLogout() {
    localStorage.removeItem("admin_unlocked");
    localStorage.removeItem("admin_name");
    setIsUnlocked(false);
    setPassword("");
    setAdminName("");
    setLoginError("");
  }

  async function changePoints(team: Team, amount: number) {
    const reason = reasons[team.id]?.trim();

    if (!reason) {
      alert("Skriv en motivering först.");
      return;
    }

    setSavingId(team.id);

    const adminNameSaved = localStorage.getItem("admin_name") || "";
    const newPoints = team.points + amount;

    const { error: updateError } = await supabase
      .from("teams")
      .update({ points: newPoints })
      .eq("id", team.id);

    if (updateError) {
      console.error(updateError);
      alert("Kunde inte uppdatera poängen.");
      setSavingId(null);
      return;
    }

    const { error: insertError } = await supabase.from("score_events").insert({
      team_id: team.id,
      points_change: amount,
      reason: reason,
      created_by: adminNameSaved,
    });

    if (insertError) {
      console.error(insertError);
      alert("Poängen uppdaterades, men motiveringen kunde inte sparas.");
      setSavingId(null);
      return;
    }

    setReasons((prev) => ({
      ...prev,
      [team.id]: "",
    }));

    await loadData();
    setSavingId(null);
  }

  if (!isUnlocked) {
    return (
      <main
        style={{
          minHeight: "100vh",
          background: "#111111",
          color: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 420,
            background: "#1c1c1c",
            borderRadius: 20,
            padding: 24,
            boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
          }}
        >
          <h1 style={{ fontSize: 32, marginBottom: 20 }}>Admin – Poäng</h1>

          <input
            type="text"
            value={adminName}
            onChange={(e) => setAdminName(e.target.value)}
            placeholder="Skriv ditt namn"
            style={{
              width: "100%",
              padding: "14px 16px",
              borderRadius: 12,
              border: "1px solid #555",
              background: "#2a2a2a",
              color: "white",
              fontSize: 16,
              marginBottom: 12,
              boxSizing: "border-box",
            }}
          />

          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Skriv lösenord"
            style={{
              width: "100%",
              padding: "14px 16px",
              borderRadius: 12,
              border: "1px solid #555",
              background: "#2a2a2a",
              color: "white",
              fontSize: 16,
              marginBottom: 12,
              boxSizing: "border-box",
            }}
          />

          {loginError ? (
            <p style={{ color: "#ff8a8a", marginBottom: 12 }}>{loginError}</p>
          ) : null}

          <button
            onClick={handleLogin}
            style={{
              width: "100%",
              padding: "14px 16px",
              borderRadius: 12,
              border: "none",
              background: "white",
              color: "#111",
              fontSize: 16,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Logga in
          </button>
        </div>
      </main>
    );
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#111111",
        padding: 24,
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          marginBottom: 24,
          flexWrap: "wrap",
        }}
      >
        <h1 style={{ color: "white", fontSize: 32, margin: 0 }}>Admin – Poäng</h1>

        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ color: "white", opacity: 0.85 }}>
            Inloggad som: <strong>{adminName}</strong>
          </span>

          <button
            onClick={handleLogout}
            style={{
              padding: "10px 16px",
              borderRadius: 999,
              border: "1px solid rgba(255,255,255,0.3)",
              background: "transparent",
              color: "white",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Logga ut
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gap: 18 }}>
        {teams.map((team) => {
          const colors = getTeamColors(team);

          return (
            <section
              key={team.id}
              style={{
                background: colors.background,
                color: colors.text,
                borderRadius: 18,
                padding: 24,
                boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
              }}
            >
              <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>
                {team.name.toUpperCase()}
              </div>

              <div style={{ fontSize: 28, fontWeight: 700, marginBottom: 16 }}>
                {team.points} poäng
              </div>

              <input
                type="text"
                value={reasons[team.id] || ""}
                onChange={(e) =>
                  setReasons((prev) => ({
                    ...prev,
                    [team.id]: e.target.value,
                  }))
                }
                placeholder="Skriv motivering här"
                style={{
                  width: "100%",
                  padding: "14px 16px",
                  borderRadius: 12,
                  border: "2px solid rgba(255,255,255,0.4)",
                  background: "rgba(255,255,255,0.15)",
                  color: "white",
                  fontSize: 16,
                  outline: "none",
                  marginBottom: 16,
                  boxSizing: "border-box",
                }}
              />

              <div
                style={{
                  display: "flex",
                  gap: 10,
                  flexWrap: "wrap",
                  marginBottom: 16,
                }}
              >
                {[1, 5, 10, -1, -5].map((amount) => (
                  <button
                    key={amount}
                    onClick={() => changePoints(team, amount)}
                    disabled={savingId === team.id}
                    style={{
                      padding: "10px 16px",
                      borderRadius: 999,
                      border: "none",
                      background: "rgba(255,255,255,0.95)",
                      color: "#111",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    {amount > 0 ? `+${amount}` : amount}
                  </button>
                ))}
              </div>

              {savingId === team.id ? (
                <p style={{ marginTop: 12, fontWeight: 700 }}>Sparar...</p>
              ) : null}
            </section>
          );
        })}
      </div>
    </main>
  );
}
