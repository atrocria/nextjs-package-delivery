import { createClient } from "@/utils/supabase/server";
import { hasSupabaseConfig } from "@/utils/supabase/config";

export default async function DatabaseTest() {
  if (!hasSupabaseConfig()) {
    return (
      <main>
        <h1>Supabase configuration required</h1>
        <p>
          Set NEXT_PUBLIC_SUPABASE_URL and
          NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in a local .env file.
        </p>
      </main>
    );
  }

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
