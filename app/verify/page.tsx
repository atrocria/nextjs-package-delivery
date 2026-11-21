import { createClient } from "@/utils/supabase/server";

export default async function DatabaseTest() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("user_id")
    .limit(1);

  if (error) {
    return (
      <main>
        <h1>Database Connection Failed</h1>
        <p>{error.message}</p>
      </main>
    );
  }

  return (
    <main>
      <h1>Supabase Connected</h1>

      <p>PostgreSQL database is responding.</p>

      <p>Records retrieved: {data.length}</p>
    </main>
  );
}
