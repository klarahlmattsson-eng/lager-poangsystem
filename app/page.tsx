import { supabase } from "../lib/supabase";

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
export default async function Home() {
  const { data: teams, error: teamsError } = await supabase
    .from("teams")
    .select("*")
    .order("points", { ascending: false });

  const { data: events, error: eventsError } = await supabase
    .from("score_events")
    .select("team_id, points_change, reason, created_at")
    .order("created_at", { ascending: false });

  if (teamsError || eventsError) {
    return (
      <main style={{ padding: 24, color: "white", background: "#111", minHeight: "100vh" }}>
        <h1>Poängtavla</h1>
        <p>Något gick fel när datan skulle hämtas.</p>
      </main>
    );
  }

  const latestReasonByTeam = new Map<number, ScoreEvent>();

  for (const event of events || []) {
    if (!latestReasonByTeam.has(event.team_id)) {
      latestReasonByTeam.set(event.team_id, event);
    }
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
      <h1
        style={{
          color: "white",
          fontSize: 32,
          marginBottom: 24,
        }}
      >
        Poängtavla
      </h1>

      <div style={{ display: "grid", gap: 18 }}>
     {(teams || []).map((team: Team, index: number) => {
      const colors = getTeamColors(team);
      let medal = "";
if (index === 0) medal = "👑";
else if (index === 1) medal = "🥈";
else if (index === 2) medal = "🥉";
          const latest = latestReasonByTeam.get(team.id);
      
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
              <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 10 }}>
              {medal} {team.name.toUpperCase()}
              </div>

              <div style={{ fontSize: 28, fontWeight: 700, marginBottom: 16 }}>
                {team.points} poäng
              </div>

              <div
                style={{
                  background: "rgba(255,255,255,0.18)",
                  borderRadius: 12,
                  padding: 12,
                  fontSize: 15,
                  lineHeight: 1.4,
                }}
              >
                <strong>Senaste motivering:</strong>
                <div style={{ marginTop: 6 }}>
                  {latest
                    ? `${latest.points_change > 0 ? "+" : ""}${latest.points_change} — ${latest.reason}`
                    : "Ingen motivering ännu"}
                </div>
              </div>
            </section>
          );
        })}
      </div>
    </main>
  );
}
