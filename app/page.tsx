import { supabase } from "../lib/supabase";

export default async function Home() {
  const { data: teams } = await supabase
    .from("teams")
    .select("*")
    .order("points", { ascending: false });

  return (
    <main style={{ padding: 20 }}>
      <h1>Poängtavla</h1>

      {teams?.map((team) => (
        <div key={team.id}>
          {team.name} - {team.points} poäng
        </div>
      ))}
    </main>
  );
}
