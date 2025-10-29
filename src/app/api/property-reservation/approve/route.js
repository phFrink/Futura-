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

// POST endpoint to approve a reservation
export async function POST(request) {
  try {
    const { reservation_id, approved_by, notes } = await request.json();
    console.log("✅ API: Approving reservation:", reservation_id);

    // Check if Supabase admin client is available
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    // Validate required fields
    if (!reservation_id) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing reservation ID",
          message: "Reservation ID is required",
        },
        { status: 400 }
      );
    }

    // Update reservation status to approved
    const { data: reservation, error: updateError } = await supabaseAdmin
      .from("property_reservations")
      .update({
        status: "approved",
        updated_at: new Date().toISOString(),
      })
      .eq("reservation_id", reservation_id)
      .select()
      .single();

    if (updateError) {
      console.error("❌ Update error:", updateError);
      return NextResponse.json(
        {
          success: false,
          error: updateError.message,
          message: "Failed to approve reservation: " + updateError.message,
        },
        { status: 400 }
      );
    }

    console.log("✅ Reservation approved successfully:", reservation_id);

    // Create a transaction record for the reservation fee
    const receiptNumber = `RCT-${new Date().getFullYear()}-${reservation_id.slice(0, 8).toUpperCase()}`;

    const { data: transaction, error: transactionError } = await supabaseAdmin
      .from("reservation_transactions")
      .insert({
        reservation_id: reservation_id,
        transaction_type: "reservation_fee",
        amount: reservation.reservation_fee,
        payment_status: "pending",
        receipt_number: receiptNumber,
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
        notes: notes || "Reservation fee payment - Awaiting payment",
        processed_by: approved_by || null,
      })
      .select()
      .single();

    if (transactionError) {
      console.error("⚠️ Transaction creation error:", transactionError);
      // Don't fail the approval if transaction creation fails
      // Just log the error
    } else {
      console.log("✅ Transaction created successfully:", transaction.transaction_id);
    }

    return NextResponse.json({
      success: true,
      data: {
        reservation,
        transaction: transaction || null,
      },
      message: "Reservation approved successfully! Payment transaction created.",
    });
  } catch (error) {
    console.error("❌ Approve reservation error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        message: "Failed to approve reservation: " + error.message,
      },
      { status: 500 }
    );
  }
}
