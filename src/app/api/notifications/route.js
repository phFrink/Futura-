import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

// Create Supabase Admin client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// GET - Fetch all notifications
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get("limit") || "50";
    const status = searchParams.get("status"); // unread, read, archived
    const priority = searchParams.get("priority"); // urgent, high, normal, low
    const role = searchParams.get("role"); // Filter by recipient_role
    const userId = searchParams.get("userId"); // Filter by recipient_id
    const clientOnly = searchParams.get("clientOnly") === "true"; // Client mode flag

    console.log("📥 Fetching notifications...");
    console.log("🔍 User Role:", role);
    console.log("🔍 User ID:", userId);
    console.log("🔍 Client Only Mode:", clientOnly);

    let query = supabaseAdmin
      .from("notifications_tbl")
      .select("*")
      .neq("status", "archived") // Exclude archived by default
      .order("created_at", { ascending: false })
      .limit(parseInt(limit));

    // Apply filters
    if (status) {
      query = query.eq("status", status);
    }

    if (priority) {
      query = query.eq("priority", priority);
    }

    // CLIENT ONLY MODE: Only show notifications with specific user_id in data field
    if (clientOnly && userId) {
      console.log(
        `👤 CLIENT ONLY MODE - Filtering for user_id in data: "${userId}"`
      );
      console.log(`🚫 Excluding all role-based and "all" notifications`);

      // ONLY show notifications where:
      // 1. recipient_role = 'client' AND
      // 2. data contains user_id that matches this user
      query = query
        .eq("recipient_role", "client")
        .contains("data", { user_id: userId });

      console.log(
        `🔒 Client filter applied: recipient_role=client AND data.user_id=${userId}`
      );
    }
    // ADMIN/STAFF MODE: Show role-based and "all" notifications
    else if (userId && role) {
      console.log(
        `👨‍💼 ADMIN/STAFF MODE - Filter for userId: "${userId}" and role: "${role}"`
      );

      // User sees notifications that are either:
      // 1. Specifically for them (recipient_id matches)
      // 2. For their role (recipient_role matches)
      // 3. For all users (recipient_role = 'all')
      const filterQuery = `recipient_id.eq.${userId},recipient_role.eq.${role},recipient_role.eq.all`;
      console.log(`🔒 Filter applied: ${filterQuery}`);
      query = query.or(filterQuery);
    } else if (role) {
      console.log(`🔍 Applying filter for role only: "${role}"`);

      // All roles (including admin) only see notifications for their role or "all"
      const filterQuery = `recipient_role.eq.${role},recipient_role.eq.all`;
      console.log(`🔒 Filter applied: ${filterQuery}`);
      query = query.or(filterQuery);

      // Additional safety: exclude NULL recipient_role when no userId
      query = query.not("recipient_role", "is", null);
    } else if (userId) {
      console.log(`🔍 Applying filter for userId only: "${userId}"`);

      // Only show notifications specifically for this user
      query = query.eq("recipient_id", userId);
    } else {
      console.log("⚠️ No role or userId provided - showing all notifications");
    }

    const { data, error } = await query;

    if (error) {
      console.error("❌ Error fetching notifications:", error);
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          details: error,
        },
        { status: 500 }
      );
    }

    console.log("✅ Fetched notifications:", data?.length || 0);

    // Debug: Log what notifications were returned
    if (data && data.length > 0) {
      console.log(
        "📋 Notification recipient roles:",
        data.map((n) => ({
          title: n.title,
          recipient_role: n.recipient_role,
          recipient_id: n.recipient_id,
        }))
      );
    }

    // Calculate counts
    const unreadCount = data?.filter((n) => n.status === "unread").length || 0;
    const totalCount = data?.length || 0;

    return NextResponse.json(
      {
        success: true,
        count: totalCount,
        unreadCount: unreadCount,
        notifications: data,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Exception fetching notifications:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}

// POST - Create a new notification
export async function POST(request) {
  try {
    const body = await request.json();

    console.log("🔍 RAW REQUEST BODY:", JSON.stringify(body, null, 2));

    // CRITICAL: Remove recipient_id from body if it exists and is a UUID
    if (body.recipient_id && typeof body.recipient_id === 'string' && body.recipient_id.includes('-')) {
      console.log("🚫 REMOVING UUID recipient_id from body:", body.recipient_id);
      delete body.recipient_id;
    }

    // CRITICAL: If recipient_role is 'client', NEVER include recipient_id
    if (body.recipient_role === 'client') {
      console.log("🚫 CLIENT notification - removing recipient_id entirely");
      delete body.recipient_id;
    }

    let {
      notification_type = "manual",
      source_table = "manual",
      source_table_display_name = "Manual Notification",
      source_record_id = null,
      title,
      message,
      icon = "📢",
      priority = "normal",
      status = "unread",
      recipient_role = "admin",
      recipient_id = null,
      data = {},
      action_url = null,
    } = body;

    // Validate required fields
    if (!title || !message) {
      return NextResponse.json(
        {
          success: false,
          error: "Title and message are required",
        },
        { status: 400 }
      );
    }

    console.log("📝 Creating notification:", title);
    console.log("📝 Recipient ID (from body):", recipient_id, "Type:", typeof recipient_id);
    console.log("📝 Recipient Role:", recipient_role);
    console.log("📝 Data:", JSON.stringify(data));

    // Build insert object - NEVER include recipient_id initially
    const insertData = {
      notification_type,
      source_table,
      source_table_display_name,
      source_record_id,
      title,
      message,
      icon,
      priority,
      status,
      recipient_role,
      data,
      action_url,
    };

    console.log("🔧 insertData BEFORE recipient_id check:", JSON.stringify(insertData, null, 2));

    // CRITICAL: NEVER add recipient_id for client notifications
    if (recipient_role === 'client') {
      console.log("🚫 CLIENT notification - recipient_id will NOT be added to insert");
    }
    // ONLY add recipient_id if it's a valid positive integer (not null, not undefined, not UUID) AND not a client notification
    else if (recipient_id !== null && recipient_id !== undefined) {
      console.log("🔍 Checking recipient_id:", recipient_id, "Type:", typeof recipient_id);

      // Check if it's a UUID (has hyphens)
      const isUUID = typeof recipient_id === "string" && recipient_id.includes("-");

      if (isUUID) {
        console.log("❌❌❌ BLOCKED UUID from recipient_id:", recipient_id);
        console.log("   >>> UUID will NOT be inserted into database");
      } else if (Number.isInteger(Number(recipient_id)) && Number(recipient_id) > 0) {
        // Valid integer - safe to add
        insertData.recipient_id = Number(recipient_id);
        console.log("✅ Including recipient_id (integer):", insertData.recipient_id);
      } else {
        console.log("⚠️ Skipping invalid recipient_id:", recipient_id);
      }
    } else {
      console.log("ℹ️ recipient_id is null/undefined - not including in insert");
    }

    console.log("🔧 FINAL insertData:", JSON.stringify(insertData, null, 2));
    console.log("🔧 Does insertData have recipient_id?", 'recipient_id' in insertData);
    console.log("🔧 insertData.recipient_id value:", insertData.recipient_id);

    const { data: notificationData, error: notificationError } =
      await supabaseAdmin.from("notifications_tbl").insert(insertData).select();

    if (notificationError) {
      console.error("❌ Error creating notification:", notificationError);
      return NextResponse.json(
        {
          success: false,
          error: notificationError.message,
          details: notificationError,
        },
        { status: 500 }
      );
    }

    console.log("✅ Notification created:", notificationData);

    return NextResponse.json(
      {
        success: true,
        message: "Notification created successfully",
        notification: notificationData[0],
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("❌ Exception creating notification:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}

// PUT - Update notification (mark as read, etc.)
export async function PUT(request) {
  try {
    const body = await request.json();
    const { id, status, read_at } = body;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "Notification ID is required",
        },
        { status: 400 }
      );
    }

    console.log("🔄 Updating notification:", id);

    const updateData = {
      updated_at: new Date().toISOString(),
    };

    if (status) {
      updateData.status = status;
    }

    if (read_at !== undefined) {
      updateData.read_at = read_at;
    } else if (status === "read") {
      updateData.read_at = new Date().toISOString();
    }

    const { data, error } = await supabaseAdmin
      .from("notifications_tbl")
      .update(updateData)
      .eq("id", id)
      .select();

    if (error) {
      console.error("❌ Error updating notification:", error);
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          details: error,
        },
        { status: 500 }
      );
    }

    console.log("✅ Notification updated:", data);

    return NextResponse.json(
      {
        success: true,
        message: "Notification updated successfully",
        notification: data[0],
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Exception updating notification:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}

// DELETE - Delete notification
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const clearAll = searchParams.get("clearAll"); // New parameter to clear all notifications

    // Clear all notifications (admin only)
    if (clearAll === "true") {
      console.log("🗑️ Clearing ALL notifications...");

      const { error } = await supabaseAdmin
        .from("notifications_tbl")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000"); // Delete all records

      if (error) {
        console.error("❌ Error clearing all notifications:", error);
        return NextResponse.json(
          {
            success: false,
            error: error.message,
            details: error,
          },
          { status: 500 }
        );
      }

      console.log("✅ All notifications cleared successfully");

      return NextResponse.json(
        {
          success: true,
          message: "All notifications cleared successfully",
        },
        { status: 200 }
      );
    }

    // Delete single notification
    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "Notification ID is required",
        },
        { status: 400 }
      );
    }

    console.log("🗑️ Deleting notification:", id);

    const { data, error } = await supabaseAdmin
      .from("notifications_tbl")
      .delete()
      .eq("id", id)
      .select();

    if (error) {
      console.error("❌ Error deleting notification:", error);
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          details: error,
        },
        { status: 500 }
      );
    }

    console.log("✅ Notification deleted:", data);

    return NextResponse.json(
      {
        success: true,
        message: "Notification deleted successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Exception deleting notification:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}
