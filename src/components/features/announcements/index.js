'use client';
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Megaphone, Pin, Users, Calendar } from "lucide-react";
import { motion } from "framer-motion";
import { format, } from "date-fns";
import { Announcement } from "@/lib/data";

export default function Announcements() {
  const [announcements, setAnnouncements] = useState([]);
  const [filteredAnnouncements, setFilteredAnnouncements] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterAnnouncements();
  }, [announcements, searchTerm, categoryFilter]);

  const loadData = async () => {
    try {
      const data = await Announcement;
      setAnnouncements(data.filter(a => a.status === 'published'));
    } catch (error) {
      console.error('Error loading announcements:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterAnnouncements = () => {
    let filtered = announcements
      .sort((a, b) => b.is_pinned - a.is_pinned);

    if (searchTerm) {
      filtered = filtered.filter(a => a.title.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    if (categoryFilter !== "all") {
      filtered = filtered.filter(a => a.category === categoryFilter);
    }
    setFilteredAnnouncements(filtered);
  };
  
  const getPriorityColor = (priority) => {
    switch(priority) {
        case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
        case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
        default: return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  return (
    <div className="min-h-screen p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 mb-2">Announcements</h1>
            <p className="text-lg text-slate-600">Keep residents informed with important updates</p>
          </div>
          <Button className="bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg">
            <Plus className="w-5 h-5 mr-2" /> New Announcement
          </Button>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white/80 backdrop-blur-sm border border-slate-200 rounded-2xl p-6 shadow-lg">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input placeholder="Search announcements..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10"/>
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-48"><SelectValue placeholder="All Categories" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="general">General</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
                <SelectItem value="events">Events</SelectItem>
                <SelectItem value="emergency">Emergency</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
          {loading ? ( <div className="text-center py-12">Loading...</div> ) 
          : filteredAnnouncements.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6"><Megaphone className="w-12 h-12 text-slate-400" /></div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">No Announcements</h3>
              <p className="text-slate-600">There are no announcements to display.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredAnnouncements.map((announcement, index) => (
                <motion.div key={announcement.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
                  <Card className={`bg-white/80 backdrop-blur-sm border-slate-200 hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-500 hover:-translate-y-1 ${announcement.is_pinned ? 'border-blue-300' : ''}`}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <h2 className="text-2xl font-bold text-slate-900">{announcement.title}</h2>
                        {announcement.is_pinned && <Pin className="w-5 h-5 text-blue-600" />}
                      </div>
                      <div className="flex flex-wrap items-center gap-3 mb-4">
                        <Badge className={`${getPriorityColor(announcement.priority)} border capitalize`}>{announcement.priority}</Badge>
                        <Badge variant="outline" className="capitalize">{announcement.category}</Badge>
                        <div className="flex items-center gap-1 text-sm text-slate-500"><Calendar className="w-4 h-4"/><span>{format(new Date(announcement.publish_date), "MMM d, yyyy")}</span></div>
                        <div className="flex items-center gap-1 text-sm text-slate-500"><Users className="w-4 h-4"/><span>{announcement.target_audience.replace('_', ' ')}</span></div>
                      </div>
                      <div className="prose prose-slate max-w-none text-slate-700">
                        {announcement.content}
                      </div>
                      <div className="text-xs text-slate-500 pt-4 mt-4 border-t border-slate-200">
                        Authored by: {announcement.author}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
