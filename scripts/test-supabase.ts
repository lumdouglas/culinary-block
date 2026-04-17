import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error, count } = await supabase
    .from("permit_chat_sessions")
    .select("id, business_name, updated_at, messages", { count: "exact" })
    .order("updated_at", { ascending: false })
    .limit(3);

  if (error) {
    console.error("Query Error:", error);
    return;
  }

  console.log(`Total active sessions in Supabase: ${count}`);
  console.log("-----------------------------------------");
  data.forEach((row) => {
    console.log(`Session ID: ${row.id}`);
    console.log(`Business Name: ${row.business_name}`);
    console.log(`Last Updated: ${row.updated_at}`);
    console.log(`Number of chat messages saved: ${row.messages?.length || 0}`);
    console.log("-----------------------------------------");
  });
}

run();
