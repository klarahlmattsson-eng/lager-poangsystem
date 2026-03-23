"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

type Team = {
  id: number;
  name: string;
  color?: string;
  points: number;
};

type ScoreEvent = {
  team_id: number;
  points_change: number;
  reason: string;
  created_at: string;
};

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
  const [teams, setTeams] = useState<Team[]>([]);
  const [reasons, setReasons] = useState<Record<number, string>>({});
  const [latestReasonByTeam, setLatestReasonByTeam] = useState<Record<number, ScoreEvent>>({});
  const [savingId, setSavingId] = useState<number | null>(null);

  async function loadData() {
    const { data: teamsData } = await supabase
      .from("teams")
      .select("*")
      .order("points", { ascending: false });

    const { data: eventsData } = await supabase
      .from("score_events")
      .select("team_id, points_change, reason, created_at")
      .order("created_at", { ascending: false });

    setTeams((teamsData || []) as Team[]);

    const latest: Record<number, ScoreEvent> = {};
    for (const event of (eventsData || []) as ScoreEvent[]) {
      if (!latest[event.team_id]) {
        latest[event.team_id] = event;
      }
    }
    setLatestReasonByTeam(latest);
  }

  useEffect(() => {
    loadData();
  }, []);

  async function changePoints(team: Team, amount: number) {
    const reason = reasons[team.id]?.trim();

    if (!reason) {
      alert("Skriv en motivering först.");
      return;
    }

    setSavingId(team.id);

    const newPoints = team.points + amount;

    const { error: updateError } = await supabase
      .from("teams")
      .update({ points: newPoints })
      .eq("id", team.id);

    if (updateError) {
      alert("Kunde inte uppdatera poängen.");
      setSavingId(null);
      return;
    }

    const { error: insertError } = await supabase.from("score_events").insert({
      team_id: team.id,
      points_change: amount,
      reason,
      created_at: new Date().toISOString(),
      created_by: "admin",
    });

    if (insertError) {
      alert("Poängen ändrades, men händelsen kunde inte sparas i historiken.");
    }

    setReasons((prev) => ({ ...prev, [team.id]: "" }));
    await loadData();
    setSavingId(null);
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
      <h1 style={{ color: "white", fontSize: 32, marginBottom: 24 }}>Admin – Poäng</h1>

      <div style={{ display: "grid", gap: 18 }}>
        {teams.map((team) => {
          const colors = getTeamColors(team);
          const latest = latestReasonByTeam[team.id];

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
  marginBottom: 12,
  boxShadow: "0 4px 12px rgba(0,0,0,0.2)"
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
                {[1, 5, 10].map((amount) => (
                  <button
                    key={`plus-${amount}`}
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
                    +{amount}
                  </button>
                ))}

                {[-1, -5].map((amount) => (
                  <button
                    key={`minus-${amount}`}
                    onClick={() => changePoints(team, amount)}
                    disabled={savingId === team.id}
                    style={{
                      padding: "10px 16px",
                      borderRadius: 999,
                      border: "1px solid rgba(255,255,255,0.45)",
                      background: "rgba(0,0,0,0.12)",
                      color: colors.text,
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    {amount}
                  </button>
                ))}
              </div>

              {savingId === team.id && (
                <p style={{ marginTop: 12, fontWeight: 700 }}>Sparar...</p>
              )}
            </section>
          );
        })}
      </div>
    </main>
  );
}
