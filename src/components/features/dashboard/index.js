'use client';

import React, { useState, useEffect } from "react";

import { Home, Users, Wrench, FileText, AlertTriangle, Bell } from "lucide-react";
import { motion } from "framer-motion";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Announcement, Billing, Complaint, Homeowner, Property, ServiceRequest } from "../../../lib/data";
import StatsCard from "@/components/ui/stat-card";

export default function Dashboard() {
  const [stats, setStats] = useState({
    properties: 0,
    homeowners: 0,
    pendingRequests: 0,
    unpaidBills: 0,
    openComplaints: 0
  });
  const [recentAnnouncements, setRecentAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [
        properties, 
        homeowners, 
        serviceRequests, 
        billings, 
        complaints,
        announcements
      ] = await Promise.all([
        Property,
        Homeowner,
        ServiceRequest,
        Billing,
        Complaint,
        Announcement
      ]);

      const pendingRequests = serviceRequests.filter(r => r.status === 'pending').length;
      const unpaidBills = billings.filter(b => b.status === 'unpaid').length;
      const openComplaints = complaints.filter(c => ['pending', 'investigating', 'in_progress'].includes(c.status)).length;

      setStats({
        properties: properties.length,
        homeowners: homeowners.length,
        pendingRequests,
        unpaidBills,
        openComplaints
      });

      setRecentAnnouncements(announcements.filter(a => a.status === 'published'));
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'normal': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
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
          <p className="text-lg text-slate-600">Property Management Dashboard</p>
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
            trend={`${Math.round((stats.unpaidBills / stats.homeowners) * 100)}% of total`}
            trendDirection={stats.unpaidBills > stats.homeowners * 0.2 ? "down" : "up"}
            delay={0.4}
            color="red"
          />
          <StatsCard
            title="Open Complaints"
            value={stats.openComplaints}
            icon={AlertTriangle}
            trend={stats.openComplaints === 0 ? "All resolved" : "Need attention"}
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
                <Bell className="w-5 h-5 text-blue-600" />
                Recent Announcements
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {Array(3).fill(0).map((_, i) => (
                    <div key={i} className="h-20 bg-slate-200 animate-pulse rounded-xl" />
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
                          <Badge className={`${getPriorityColor(announcement.priority)} border text-xs`}>
                            {announcement.priority}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-600 line-clamp-2">
                          {announcement.content}
                        </p>
                        <p className="text-xs text-slate-500 mt-2">
                          {new Date(announcement.publish_date).toLocaleDateString()}
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
                  className="p-4 rounded-xl bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 cursor-pointer hover:shadow-md transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-600">
                      <FileText className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-blue-900">Generate Bills</p>
                      <p className="text-xs text-blue-600">Monthly billing</p>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="p-4 rounded-xl bg-gradient-to-r from-green-50 to-green-100 border border-green-200 cursor-pointer hover:shadow-md transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-green-600">
                      <Bell className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-green-900">New Announcement</p>
                      <p className="text-xs text-green-600">Notify residents</p>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="p-4 rounded-xl bg-gradient-to-r from-amber-50 to-amber-100 border border-amber-200 cursor-pointer hover:shadow-md transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-amber-600">
                      <Wrench className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-amber-900">Service Report</p>
                      <p className="text-xs text-amber-600">Weekly summary</p>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="p-4 rounded-xl bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200 cursor-pointer hover:shadow-md transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-purple-600">
                      <Users className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-purple-900">Add Homeowner</p>
                      <p className="text-xs text-purple-600">New registration</p>
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