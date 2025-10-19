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

// POST endpoint to create inquiry
export async function POST(request) {
  try {
    const inquiryData = await request.json();
    console.log("💬 API: Creating inquiry:", inquiryData);

    // Check if Supabase admin client is available
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    // Validate required fields
    if (
      !inquiryData.property_id ||
      !inquiryData.client_firstname ||
      !inquiryData.client_lastname ||
      !inquiryData.client_email ||
      !inquiryData.message
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields",
          message: "Property, client details, and message are required",
        },
        { status: 400 }
      );
    }

    // Insert inquiry into database
    const { data: inquiry, error: insertError } = await supabaseAdmin
      .from("client_inquiries")
      .insert({
        property_id: inquiryData.property_id,
        property_title: inquiryData.property_title || null,
        user_id: inquiryData.user_id || null,
        role_id: "49d60eb8-184b-48b3-9f4f-d002d3008ea7" || null,
        client_firstname: inquiryData.client_firstname.trim(),
        client_lastname: inquiryData.client_lastname.trim(),
        client_email: inquiryData.client_email.trim().toLowerCase(),
        client_phone: inquiryData.client_phone?.trim() || null,
        message: inquiryData.message.trim(),
        is_authenticated: inquiryData.is_authenticated || false,
        status: "pending", // Default status
      })
      .select()
      .single();

    if (insertError) {
      console.error("❌ Insert error:", insertError);
      return NextResponse.json(
        {
          success: false,
          error: insertError.message,
          message: "Failed to create inquiry: " + insertError.message,
        },
        { status: 400 }
      );
    }

    console.log("✅ Inquiry created successfully:", inquiry.inquiry_id);

    return NextResponse.json({
      success: true,
      data: inquiry,
      message: "Inquiry sent successfully! Our team will contact you soon.",
    });
  } catch (error) {
    console.error("❌ Send inquiry error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        message: "Failed to send inquiry: " + error.message,
      },
      { status: 500 }
    );
  }
}

// GET endpoint to fetch inquiries
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const clientEmail = searchParams.get("clientEmail");

    console.log("🔍 API: Fetching inquiries for user:", userId || clientEmail);

    // Check if Supabase admin client is available
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    let query = supabaseAdmin
      .from("client_inquiries")
      .select("*")
      .order("created_at", { ascending: false });

    // Filter by user_id or client_email
    if (userId) {
      query = query.eq("user_id", userId);
    } else if (clientEmail) {
      query = query.eq("client_email", clientEmail);
    } else {
      query = query;
    }

    const { data: inquiries, error } = await query;

    if (error) {
      console.error("❌ Fetch error:", error);
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          message: "Failed to fetch inquiries: " + error.message,
        },
        { status: 400 }
      );
    }

    console.log(`✅ Found ${inquiries.length} inquiries`);

    return NextResponse.json({
      success: true,
      data: inquiries,
      total: inquiries.length,
      message: `Found ${inquiries.length} inquiries`,
    });
  } catch (error) {
    console.error("❌ Fetch inquiries error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        message: "Failed to fetch inquiries: " + error.message,
      },
      { status: 500 }
    );
  }
}
