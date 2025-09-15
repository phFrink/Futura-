"use client";

import React, { useState, useEffect } from "react";

import {
  Home,
  Users,
  Wrench,
  FileText,
  AlertTriangle,
  Bell,
} from "lucide-react";
import { motion } from "framer-motion";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@supabase/supabase-js";
import StatsCard from "@/components/ui/stat-card";

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function Dashboard() {
  const [stats, setStats] = useState({
    properties: 0,
    homeowners: 0,
    pendingRequests: 0,
    unpaidBills: 0,
    openComplaints: 0,
  });
  const [recentAnnouncements, setRecentAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();

    // Set up real-time subscriptions for automatic updates
    const subscriptions = [];

    // Subscribe to homeowners changes
    const homeownersSubscription = supabase
      .channel("homeowners_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "homeowners",
        },
        (payload) => {
          console.log("Homeowners data changed:", payload);
          loadDashboardData();
        }
      )
      .subscribe();

    // Subscribe to service requests changes
    const serviceRequestsSubscription = supabase
      .channel("service_requests_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "service_requests",
        },
        (payload) => {
          console.log("Service requests data changed:", payload);
          loadDashboardData();
        }
      )
      .subscribe();

    // Subscribe to billings changes
    const billingsSubscription = supabase
      .channel("billings_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "billings",
        },
        (payload) => {
          console.log("Billings data changed:", payload);
          loadDashboardData();
        }
      )
      .subscribe();

    subscriptions.push(
      homeownersSubscription,
      serviceRequestsSubscription,
      billingsSubscription
    );

    // Cleanup subscriptions on unmount
    return () => {
      subscriptions.forEach((subscription) => {
        supabase.removeChannel(subscription);
      });
    };
  }, []);

  const loadDashboardData = async () => {
    try {
      console.log("Loading dashboard data from Supabase...");

      // Fetch data from Supabase with error checking
      const propertiesResult = await supabase.from("property_tbl").select("*");
      const homeownersResult = await supabase.from("homeowner_tbl").select("*");
      const serviceRequestsResult = await supabase
        .from("request_tbl")
        .select("*");
      const billingsResult = await supabase.from("billing_tbl").select("*");
      const complaintsResult = await supabase.from("complaint_tbl").select("*");
      const announcementsResult = await supabase
        .from("announcement_tbl")
        .select("*");

      // Check for errors in individual queries
      if (propertiesResult.error)
        console.error("Properties error:", propertiesResult.error);
      if (homeownersResult.error)
        console.error("Homeowners error:", homeownersResult.error);
      if (serviceRequestsResult.error)
        console.error("Service requests error:", serviceRequestsResult.error);
      if (billingsResult.error)
        console.error("Billings error:", billingsResult.error);
      if (complaintsResult.error)
        console.error("Complaints error:", complaintsResult.error);
      if (announcementsResult.error)
        console.error("Announcements error:", announcementsResult.error);

      // Extract data from results
      const properties = propertiesResult.data || [];
      const homeowners = homeownersResult.data || [];
      const serviceRequests = serviceRequestsResult.data || [];
      const billings = billingsResult.data || [];
      const complaints = complaintsResult.data || [];
      const announcements = announcementsResult.data || [];

      console.log("Data fetched:", {
        properties: properties.length,
        homeowners: homeowners.length,
        serviceRequests: serviceRequests.length,
        billings: billings.length,
        complaints: complaints.length,
        announcements: announcements.length,
      });

      // Calculate counts
      const pendingRequests = serviceRequests.filter(
        (r) => r.status === "pending"
      ).length;
      const unpaidBills = billings.filter((b) => b.status === "unpaid").length;
      const openComplaints = complaints.filter((c) =>
        ["pending", "investigating", "in_progress"].includes(c.status)
      ).length;

      console.log("Calculated stats:", {
        properties: properties.length,
        homeowners: homeowners.length,
        pendingRequests,
        unpaidBills,
        openComplaints,
      });

      setStats({
        properties: properties.length,
        homeowners: homeowners.length,
        pendingRequests,
        unpaidBills,
        openComplaints,
      });

      setRecentAnnouncements(
        announcements.filter((a) => a.status === "published")
      );
    } catch (error) {
      console.error("Error loading dashboard data:", error);

      // If Supabase tables don't exist, show a helpful error message
      if (
        error.message &&
        error.message.includes("relation") &&
        error.message.includes("does not exist")
      ) {
        console.warn(
          "Supabase tables may not exist yet. Please ensure your database is set up correctly."
        );
      }

      // Fallback to show zero counts if there's an error
      setStats({
        properties: 0,
        homeowners: 0,
        pendingRequests: 0,
        unpaidBills: 0,
        openComplaints: 0,
      });
      setRecentAnnouncements([]);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 text-red-800 border-red-200";
      case "high":
        return "bg-red-50 text-red-700 border-red-300";
      case "normal":
        return "bg-red-50 text-red-600 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <div className="min-h-screen p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center md:text-left"
        >
          <h1 className="text-4xl font-bold text-slate-900 mb-2">
            Futura Homes Koronadal
          </h1>
          <p className="text-lg text-slate-600">
            Property Management Dashboard
          </p>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <StatsCard
            title="Total Properties"
            value={stats.properties}
            icon={Home}
            trend="+2 new units"
            delay={0.1}
            color="blue"
          />
          <StatsCard
            title="Homeowners"
            value={stats.homeowners}
            icon={Users}
            trend="+5 this month"
            delay={0.2}
            color="green"
          />
          <StatsCard
            title="Pending Requests"
            value={stats.pendingRequests}
            icon={Wrench}
            trend={stats.pendingRequests > 10 ? "High volume" : "Normal"}
            trendDirection={stats.pendingRequests > 10 ? "down" : "up"}
            delay={0.3}
            color="amber"
          />
          <StatsCard
            title="Unpaid Bills"
            value={stats.unpaidBills}
            icon={FileText}
            trend={`${Math.round(
              (stats.unpaidBills / stats.homeowners) * 100
            )}% of total`}
            trendDirection={
              stats.unpaidBills > stats.homeowners * 0.2 ? "down" : "up"
            }
            delay={0.4}
            color="red"
          />
          <StatsCard
            title="Open Complaints"
            value={stats.openComplaints}
            icon={AlertTriangle}
            trend={
              stats.openComplaints === 0 ? "All resolved" : "Need attention"
            }
            trendDirection={stats.openComplaints === 0 ? "up" : "down"}
            delay={0.5}
            color="purple"
          />
        </div>

        {/* Recent Announcements */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="grid lg:grid-cols-2 gap-8"
        >
          <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-xl">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Bell className="w-5 h-5 text-red-600" />
                Recent Announcements
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {Array(3)
                    .fill(0)
                    .map((_, i) => (
                      <div
                        key={i}
                        className="h-20 bg-slate-200 animate-pulse rounded-xl"
                      />
                    ))}
                </div>
              ) : recentAnnouncements.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <Bell className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No recent announcements</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentAnnouncements.map((announcement, index) => (
                    <motion.div
                      key={announcement.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-start gap-4 p-4 rounded-xl bg-slate-50/50 hover:bg-slate-100/50 transition-colors duration-200"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold text-slate-900 line-clamp-1">
                            {announcement.title}
                          </h4>
                          <Badge
                            className={`${getPriorityColor(
                              announcement.priority
                            )} border text-xs`}
                          >
                            {announcement.priority}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-600 line-clamp-2">
                          {announcement.content}
                        </p>
                        <p className="text-xs text-slate-500 mt-2">
                          {new Date(
                            announcement.publish_date
                          ).toLocaleDateString()}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-xl">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-bold text-slate-900">
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="p-4 rounded-xl gradient-red-light-bg border border-red-200 cursor-pointer hover:shadow-md transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg gradient-red-bg">
                      <FileText className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-red-900">
                        Generate Bills
                      </p>
                      <p className="text-xs text-red-600">Monthly billing</p>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="p-4 rounded-xl bg-gradient-to-r from-red-50 to-red-100 border border-red-200 cursor-pointer hover:shadow-md transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg gradient-red-bg">
                      <Bell className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-red-900">
                        New Announcement
                      </p>
                      <p className="text-xs text-red-600">Notify residents</p>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="p-4 rounded-xl bg-gradient-to-r from-red-100 to-red-200 border border-red-300 cursor-pointer hover:shadow-md transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg gradient-red-dark-bg">
                      <Wrench className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-red-900">
                        Service Report
                      </p>
                      <p className="text-xs text-red-600">Weekly summary</p>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="p-4 rounded-xl bg-gradient-to-r from-red-50 to-red-150 border border-red-200 cursor-pointer hover:shadow-md transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg gradient-red-bg">
                      <Users className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-red-900">
                        Add Homeowner
                      </p>
                      <p className="text-xs text-red-600">New registration</p>
                    </div>
                  </div>
                </motion.div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
