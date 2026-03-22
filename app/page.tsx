
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
  created_at: string;
};

export default async function Home() {
  const { data: teams, error: teamsError } = await supabase
    .from("teams")
    .select("*")
    .order("points", { ascending: false })
    .order("id", { ascending: true });

  const { data: events, error: eventsError } = await supabase
    .from("score_events")
    .select("*")
    .order("created_at", { ascending: false });

  if (teamsError || eventsError) {
    return (
      <main style={{ padding: 20 }}>
        <h1>Poängtavla</h1>
        <pre>{JSON.stringify({ teamsError, eventsError }, null, 2)}</pre>
      </main>
    );
  }

  const latestEventByTeam: Record<number, ScoreEvent> = {};

  (events || []).forEach((event) => {
    if (!latestEventByTeam[event.team_id]) {
      latestEventByTeam[event.team_id] = event;
    }
  });

  return (
    <main
      style={{
        padding: 20,
        minHeight: "100vh",
        background: "#111",
        color: "white",
      }}
    >
      <h1 style={{ marginBottom: 20 }}>Poängtavla</h1>

      <div style={{ display: "grid", gap: 14 }}>
        {(teams as Team[] | null)?.map((team, index) => {
          const latestEvent = latestEventByTeam[team.id];
          const darkText = team.name.toLowerCase().includes("gul");

          return (
            <div
              key={team.id}
              style={{
                background: team.color,
                padding: 20,
                borderRadius: 14,
                color: darkText ? "#111" : "white",
                boxShadow: index === 0 ? "0 0 0 4px gold" : "none",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 8,
                }}
              >
                <div style={{ fontSize: 28, fontWeight: "bold" }}>{team.name}</div>

                <div style={{ fontSize: 28 }}>
                  {index === 0 ? "👑" : index === 1 ? "🥈" : index === 2 ? "🥉" : ""}
                </div>
              </div>

              <div style={{ fontSize: 18, fontWeight: "bold" }}>{index + 1}. plats</div>
              <div style={{ fontSize: 18, marginBottom: 10 }}>{team.points} poäng</div>

              <div
                style={{
                  background: darkText ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.18)",
                  borderRadius: 10,
                  padding: 10,
                  fontSize: 15,
                }}
              >
                {latestEvent ? (
                  <>
                    <strong>Senast:</strong>{" "}
                    {latestEvent.points_change > 0
                      ? `+${latestEvent.points_change}`
                      : latestEvent.points_change}{" "}
                    poäng – {latestEvent.reason}
                  </>
                ) : (
                  <>Ingen motivering än.</>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
