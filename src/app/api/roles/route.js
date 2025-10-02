import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

// Function to create Supabase admin client safely
function createSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    return null;
  }

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// Create Supabase admin client
const supabaseAdmin = createSupabaseAdmin();

export async function GET(request) {
  try {
    console.log("🔍 API: Fetching roles...");

    // Check if Supabase admin client is available
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    // Fetch roles from the role table
    const { data: roles, error } = await supabaseAdmin
      .from("role")
      .select("role_id, rolename")
      .order("role_id", { ascending: true });

    if (error) {
      console.error("❌ Supabase error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log(`✅ Found ${roles?.length || 0} roles`);
    console.log("Role structure:", roles?.[0]);

    return NextResponse.json({
      success: true,
      data: roles || [],
      total: roles?.length || 0,
      message: `Loaded ${roles?.length || 0} roles successfully`,
    });
  } catch (error) {
    console.error("❌ API Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch roles: " + error.message },
      { status: 500 }
    );
  }
}
