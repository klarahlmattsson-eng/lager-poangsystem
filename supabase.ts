import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://mieekqibjzgiqvddiyrl.supabase.co";
const supabaseAnonKey = "sb_publishable_Ti7uaDcfR7oatEO73bbjkA_6YQr5ef0";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);