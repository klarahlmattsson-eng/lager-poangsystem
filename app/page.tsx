import { supabase } from "../lib/supabase";

type Team = {
  id: number;
  name: string;
  color?: string;
  points: number;
};

type ScoreEvent = {
  id?: number;
  team_id: number;
  points_change: number;
  reason: string;
  created_at: string;
  created_by?: string | null;
};

function getTeamColors(team: Team) {
  const name = team.name.toLowerCase();
  const color = (team.color || "").toLowerCase();

  if (name.includes("röd") || color.includes("red")) {
    return {
      background: "#e5093b",
      text: "#ffffff",
      soft: "rgba(255,255,255,0.18)",
    };
  }

  if (name.includes("blå") || color.includes("blue")) {
    return {
      background: "#1577ff",
      text: "#ffffff",
      soft: "rgba(255,255,255,0.18)",
    };
  }

  if (name.includes("gul") || color.includes("yellow")) {
    return {
      background: "#ffd500",
      text: "#1a1a1a",
      soft: "rgba(255,255,255,0.35)",
    };
  }

  if (name.includes("grön") || color.includes("green")) {
    return {
      background: "#7bd67b",
      text: "#ffffff",
      soft: "rgba(255,255,255,0.18)",
    };
  }

  return {
    background: "#333333",
    text: "#ffffff",
    soft: "rgba(255,255,255,0.18)",
  };
}

function getMedal(index: number) {
  if (index === 0) return "👑";
  if (index === 1) return "🥈";
  if (index === 2) return "🥉";
  return "";
}

function formatTime(dateString: string) {
  try {
    return new Date(dateString).toLocaleTimeString("sv-SE", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

function isToday(dateString: string) {
  const d = new Date(dateString);
  const now = new Date();

  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

export default async function Home() {
  const { data: teamsData, error: teamsError } = await supabase
    .from("teams")
    .select("*")
    .order("points", { ascending: false });

  const { data: eventsData, error: eventsError } = await supabase
    .from("score_events")
    .select("id, team_id, points_change, reason, created_at, created_by")
    .order("created_at", { ascending: false })
    .limit(50);

  if (teamsError || eventsError) {
    return (
      <main
        style={{
          minHeight: "100vh",
          background: "#111111",
          color: "white",
          padding: 24,
          fontFamily: "Arial, sans-serif",
        }}
      >
        <h1>Poängtavla</h1>
        <p>Kunde inte ladda sidan just nu.</p>
      </main>
    );
  }

  const teams = ((teamsData || []) as Team[]).sort((a, b) => b.points - a.points);
  const events = (eventsData || []) as ScoreEvent[];

  const firstTeam = teams[0];
  const secondTeam = teams[1];
  const thirdTeam = teams[2];
  const fourthTeam = teams[3];

  const podiumOrder = [firstTeam, secondTeam, thirdTeam].filter(Boolean) as Team[];

  const latestEvent = events[0];

  const todaysEvents = events.filter((event) => isToday(event.created_at));

  const teamMap = new Map<number, Team>();
  for (const team of teams) {
    teamMap.set(team.id, team);
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#111111",
        padding: 20,
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <h1
          style={{
            color: "white",
            fontSize: 46,
            marginBottom: 24,
            marginTop: 0,
            letterSpacing: 1,
          }}
        >
          POÄNGTAVLA
        </h1>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 18,
            alignItems: "end",
            marginBottom: 18,
          }}
        >
          {podiumOrder.map((team, index) => {
            const colors = getTeamColors(team);

            const heights = [260, 220, 180];
            const blockHeight = heights[index] || 180;

            return (
              <div
                key={team.id}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "flex-end",
                }}
              >
                <div
                  style={{
                    color: "white",
                    fontWeight: 800,
                    fontSize: 24,
                    marginBottom: 10,
                    textAlign: "center",
                  }}
                >
                  {getMedal(index)}
                </div>

                <div
                  style={{
                    background: getTeamColors(team).background,
                    color: colors.text,
                    borderRadius: 26,
                    minHeight: blockHeight,
                    padding: 22,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "flex-end",
                    boxShadow:
                      index === 0
                        ? "0 0 0 4px white, 0 0 24px rgba(255,255,255,0.45)"
                        : "0 10px 30px rgba(0,0,0,0.28)",
                  }}
                >
                  <div
                    style={{
                      fontWeight: 800,
                      fontSize: 18,
                      marginBottom: 12,
                    }}
                  >
                    {team.name.toUpperCase()}
                  </div>

                  <div
                    style={{
                      fontSize: 42,
                      fontWeight: 800,
                      lineHeight: 1,
                      marginBottom: 8,
                    }}
                  >
                    {team.points}
                  </div>

                  <div
                    style={{
                      fontSize: 18,
                      fontWeight: 700,
                      opacity: 0.95,
                    }}
                  >
                    poäng
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {fourthTeam ? (
          <div
            style={{
              background: "#1c1c1c",
              color: "white",
              borderRadius: 20,
              padding: "18px 20px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 12,
              marginBottom: 18,
              boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
              flexWrap: "wrap",
            }}
          >
            <div style={{ fontSize: 22, fontWeight: 800 }}>
              #4 {fourthTeam.name.toUpperCase()}
            </div>

            <div style={{ fontSize: 22, fontWeight: 800 }}>
              {fourthTeam.points} poäng
            </div>
          </div>
        ) : null}

        <div
          style={{
            background: "#ff7a59",
            color: "white",
            borderRadius: 22,
            padding: 22,
            marginBottom: 22,
            boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
          }}
        >
          <div
            style={{
              fontSize: 16,
              fontWeight: 800,
              marginBottom: 10,
              textTransform: "uppercase",
              letterSpacing: 0.5,
            }}
          >
            Senaste händelse
          </div>

          {latestEvent ? (
            <>
              <div
                style={{
                  fontSize: 28,
                  fontWeight: 800,
                  marginBottom: 8,
                  lineHeight: 1.15,
                }}
              >
                {teamMap.get(latestEvent.team_id)?.name || "Okänt lag"} fick{" "}
                {latestEvent.points_change > 0 ? "+" : ""}
                {latestEvent.points_change} poäng
              </div>

              <div
                style={{
                  fontSize: 18,
                  marginBottom: 8,
                  opacity: 0.98,
                }}
              >
                {latestEvent.reason || "Ingen motivering"}
              </div>

              <div
                style={{
                  fontSize: 15,
                  opacity: 0.95,
                  fontWeight: 700,
                }}
              >
                av {latestEvent.created_by || "okänd"} · {formatTime(latestEvent.created_at)}
              </div>
            </>
          ) : (
            <div style={{ fontSize: 18, fontWeight: 700 }}>
              Ingen händelse ännu
            </div>
          )}
        </div>

        <div
          style={{
            background: "#f5f0e8",
            borderRadius: 26,
            padding: 22,
            boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
          }}
        >
          <div
            style={{
              fontSize: 18,
              fontWeight: 800,
              marginBottom: 18,
              color: "#1a1a1a",
            }}
          >
            Dagens motiveringar
          </div>

          {todaysEvents.length === 0 ? (
            <div style={{ color: "#555", fontSize: 16 }}>Inga motiveringar idag ännu.</div>
          ) : (
            <div style={{ display: "grid", gap: 14 }}>
              {todaysEvents.map((event, index) => {
                const team = teamMap.get(event.team_id);

                return (
                  <div
                    key={`${event.team_id}-${event.created_at}-${index}`}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "70px 1fr",
                      gap: 14,
                      alignItems: "start",
                      paddingBottom: 14,
                      borderBottom:
                        index === todaysEvents.length - 1 ? "none" : "1px solid #ddd5c9",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 30,
                        fontWeight: 800,
                        color: "#222",
                        lineHeight: 1,
                      }}
                    >
                      {String(index + 1).padStart(2, "0")}
                    </div>

                    <div>
                      <div
                        style={{
                          fontSize: 24,
                          fontWeight: 800,
                          color: "#1a1a1a",
                          lineHeight: 1.1,
                          marginBottom: 4,
                        }}
                      >
                        {team?.name || "Okänt lag"}
                      </div>

                      <div
                        style={{
                          fontSize: 15,
                          color: "#555",
                          marginBottom: 4,
                        }}
                      >
                        {event.points_change > 0 ? "+" : ""}
                        {event.points_change} poäng · {formatTime(event.created_at)}
                      </div>

                      <div
                        style={{
                          fontSize: 16,
                          color: "#222",
                          marginBottom: 2,
                        }}
                      >
                        {event.reason || "Ingen motivering"}
                      </div>

                      <div
                        style={{
                          fontSize: 14,
                          color: "#666",
                        }}
                      >
                        av {event.created_by || "okänd"}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
