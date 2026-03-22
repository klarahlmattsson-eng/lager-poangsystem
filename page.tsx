"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

type Team = {
  id: number;
  name: string;
  color: string;
  points: number;
};

type ScoreEvent = {
  id: number;
  team_id: number;
  points_change: number;
  reason: string;
  created_by: string;
  created_at: string;
};

export default function AdminPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [eventsByTeam, setEventsByTeam] = useState<Record<number, ScoreEvent[]>>({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [reasons, setReasons] = useState<Record<number, string>>({});

  async function loadTeams() {
    const { data, error } = await supabase
      .from("teams")
      .select("*")
      .order("points", { ascending: false })
      .order("id", { ascending: true });

    if (error) {
      console.error(error);
    } else {
      setTeams(data || []);
    }
  }

  async function loadEvents() {
    const { data, error } = await supabase
      .from("score_events")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      return;
    }

    const grouped: Record<number, ScoreEvent[]> = {};

    (data || []).forEach((event) => {
      if (!grouped[event.team_id]) {
        grouped[event.team_id] = [];
      }
      grouped[event.team_id].push(event);
    });

    setEventsByTeam(grouped);
  }

  async function loadAll() {
    setLoading(true);
    await Promise.all([loadTeams(), loadEvents()]);
    setLoading(false);
  }

  useEffect(() => {
    loadAll();
  }, []);

  function updateReason(teamId: number, value: string) {
    setReasons((prev) => ({
      ...prev,
      [teamId]: value,
    }));
  }

  async function changePoints(team: Team, amount: number) {
    const reason = reasons[team.id]?.trim() || "";

    if (!reason) {
      alert("Skriv en motivering först.");
      return;
    }

    setSavingId(team.id);

    const newPoints = team.points + amount;

    const updateTeam = await supabase
      .from("teams")
      .update({ points: newPoints })
      .eq("id", team.id);

    if (updateTeam.error) {
      console.error(updateTeam.error);
      alert("Det gick inte att uppdatera poängen.");
      setSavingId(null);
      return;
    }

    const saveEvent = await supabase.from("score_events").insert({
      team_id: team.id,
      points_change: amount,
      reason,
      created_by: "Ledare",
    });

    if (saveEvent.error) {
      console.error(saveEvent.error);
      alert("Poängen sparades, men inte motiveringen i historiken.");
    }

    setReasons((prev) => ({
      ...prev,
      [team.id]: "",
    }));

    await loadAll();
    setSavingId(null);
  }

  return (
    <main
      style={{
        padding: 20,
        minHeight: "100vh",
        background: "#111",
        color: "white",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <h1 style={{ marginBottom: 8 }}>Admin – Poäng</h1>
      <p style={{ marginTop: 0, marginBottom: 20, color: "#ccc" }}>
        Skriv motivering och ge eller ta poäng.
      </p>

      {loading ? (
        <p>Laddar lag...</p>
      ) : (
        <div style={{ display: "grid", gap: 18 }}>
          {teams.map((team) => {
            const darkText = team.name.toLowerCase().includes("gul");
            const teamEvents = eventsByTeam[team.id] || [];

            return (
              <div
                key={team.id}
                style={{
                  background: team.color,
                  color: darkText ? "#111" : "white",
                  padding: 20,
                  borderRadius: 16,
                  boxShadow: "0 8px 20px rgba(0,0,0,0.18)",
                }}
              >
                <div style={{ fontSize: 28, fontWeight: 800, marginBottom: 6 }}>
                  {team.name}
                </div>

                <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 14 }}>
                  {team.points} poäng
                </div>

                <label
                  style={{
                    display: "block",
                    fontSize: 14,
                    fontWeight: 700,
                    marginBottom: 6,
                  }}
                >
                  Motivering
                </label>

                <textarea
                  value={reasons[team.id] || ""}
                  onChange={(e) => updateReason(team.id, e.target.value)}
                  placeholder="Skriv varför laget får eller förlorar poäng..."
                  rows={3}
                  style={{
                    width: "100%",
                    borderRadius: 12,
                    border: "none",
                    padding: 12,
                    resize: "vertical",
                    fontSize: 15,
                    marginBottom: 14,
                    boxSizing: "border-box",
                    background: "rgba(255,255,255,0.92)",
                    color: "#111",
                  }}
                />

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
                    gap: 10,
                    marginBottom: 18,
                  }}
                >
                  <button onClick={() => changePoints(team, 1)} style={buttonStyle("#1f8b4c")}>
                    +1
                  </button>
                  <button onClick={() => changePoints(team, 5)} style={buttonStyle("#17803d")}>
                    +5
                  </button>
                  <button onClick={() => changePoints(team, 10)} style={buttonStyle("#0f6d31")}>
                    +10
                  </button>
                  <button onClick={() => changePoints(team, -1)} style={buttonStyle("#b7791f")}>
                    -1
                  </button>
                  <button onClick={() => changePoints(team, -5)} style={buttonStyle("#b83232")}>
                    -5
                  </button>
                </div>

                {savingId === team.id && (
                  <p style={{ marginTop: 0, marginBottom: 12, fontWeight: 700 }}>Sparar...</p>
                )}

                <div
                  style={{
                    background: darkText ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.18)",
                    borderRadius: 12,
                    padding: 12,
                  }}
                >
                  <div style={{ fontWeight: 800, marginBottom: 8 }}>Senaste motiveringar</div>

                  {teamEvents.length === 0 ? (
                    <p style={{ margin: 0 }}>Inga motiveringar än.</p>
                  ) : (
                    <div style={{ display: "grid", gap: 8 }}>
                      {teamEvents.slice(0, 5).map((event) => (
                        <div
                          key={event.id}
                          style={{
                            background: darkText ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.08)",
                            borderRadius: 10,
                            padding: 10,
                          }}
                        >
                          <div style={{ fontWeight: 700 }}>
                            {event.points_change > 0 ? `+${event.points_change}` : event.points_change} poäng
                          </div>
                          <div>{event.reason}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}

function buttonStyle(background: string): React.CSSProperties {
  return {
    background,
    color: "white",
    border: "none",
    borderRadius: 12,
    padding: "12px 0",
    fontSize: 16,
    fontWeight: 800,
    cursor: "pointer",
    boxShadow: "0 4px 10px rgba(0,0,0,0.18)",
  };
}