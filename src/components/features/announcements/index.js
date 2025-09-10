'use client';
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Megaphone, Pin, Users, Calendar, X } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function Announcements() {
  const [announcements, setAnnouncements] = useState([]);
  const [filteredAnnouncements, setFilteredAnnouncements] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'general',
    priority: 'normal',
    target_audience: 'all_residents',
    author: '',
    status: 'published',
    is_pinned: false,
    publish_date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterAnnouncements();
  }, [announcements, searchTerm, categoryFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Fetch announcements from Supabase
      const { data: announcementsData, error } = await supabase
        .from('announcement_tbl')
        .select('*')
        .eq('status', 'published')
        .order('is_pinned', { ascending: false })
        .order('publish_date', { ascending: false });

      if (error) throw error;

      setAnnouncements(announcementsData || []);
    } catch (error) {
      console.error('Error loading announcements:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterAnnouncements = async () => {
    try {
      let query = supabase
        .from('announcement_tbl')
        .select('*')
        .eq('status', 'published')
        .order('is_pinned', { ascending: false })
        .order('publish_date', { ascending: false });

      // Apply filters
      if (searchTerm) {
        query = query.ilike('title', `%${searchTerm}%`);
      }
      if (categoryFilter !== "all") {
        query = query.eq('category', categoryFilter);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      
      setFilteredAnnouncements(data || []);
    } catch (error) {
      console.error('Error filtering announcements:', error);
      // Fallback to client-side filtering if needed
      let filtered = announcements
        .sort((a, b) => b.is_pinned - a.is_pinned);

      if (searchTerm) {
        filtered = filtered.filter(a => a.title.toLowerCase().includes(searchTerm.toLowerCase()));
      }
      if (categoryFilter !== "all") {
        filtered = filtered.filter(a => a.category === categoryFilter);
      }
      setFilteredAnnouncements(filtered);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormSubmitting(true);

    try {
      // Insert announcement into Supabase
      const { data, error } = await supabase
        .from('announcement_tbl')
        .insert([{
          title: formData.title,
          content: formData.content,
          category: formData.category,
          priority: formData.priority,
          target_audience: formData.target_audience,
          author: formData.author,
          status: formData.status,
          is_pinned: formData.is_pinned,
          publish_date: new Date(formData.publish_date).toISOString(),
          created_date: new Date().toISOString(),
          updated_date: new Date().toISOString()
        }])
        .select();

      if (error) throw error;

      // Reset form and close modal
      setFormData({
        title: '',
        content: '',
        category: 'general',
        priority: 'normal',
        target_audience: 'all_residents',
        author: '',
        status: 'published',
        is_pinned: false,
        publish_date: new Date().toISOString().split('T')[0]
      });
      
      setIsModalOpen(false);
      
      // Reload data to show new announcement
      await loadData();
      
      alert('Announcement created successfully!');
    } catch (error) {
      console.error('Error creating announcement:', error);
      alert('Error creating announcement. Please try again.');
    } finally {
      setFormSubmitting(false);
    }
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
          <Button 
            onClick={() => setIsModalOpen(true)}
            className="bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg"
          >
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
          {loading ? ( 
            <div className="text-center py-12">Loading...</div> 
          ) : filteredAnnouncements.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Megaphone className="w-12 h-12 text-slate-400" />
              </div>
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
                        <div className="flex items-center gap-1 text-sm text-slate-500">
                          <Calendar className="w-4 h-4"/>
                          <span>{format(new Date(announcement.publish_date), "MMM d, yyyy")}</span>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-slate-500">
                          <Users className="w-4 h-4"/>
                          <span>{announcement.target_audience.replace('_', ' ')}</span>
                        </div>
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

      {/* DaisyUI Modal */}
      <div className={`modal ${isModalOpen ? 'modal-open' : ''}`}>
        <div className="modal-box max-w-3xl bg-white border border-gray-200 shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-gray-900">Create New Announcement</h3>
            <button 
              onClick={() => setIsModalOpen(false)}
              className="btn btn-sm btn-circle btn-ghost"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Title*</span>
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className="text-black bg-white input input-bordered w-full focus:input-primary"
                placeholder="Enter announcement title"
                required
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Content*</span>
              </label>
              <textarea
                name="content"
                value={formData.content}
                onChange={handleInputChange}
                className="text-black bg-white textarea textarea-bordered h-32 focus:textarea-primary resize-none"
                placeholder="Write your announcement content here..."
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Category*</span>
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="text-black bg-white select select-bordered w-full focus:select-primary"
                  required
                >
                  <option value="general">General</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="events">Events</option>
                  <option value="emergency">Emergency</option>
                </select>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Priority</span>
                </label>
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleInputChange}
                  className="text-black bg-white select select-bordered w-full focus:select-primary"
                >
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Target Audience</span>
                </label>
                <select
                  name="target_audience"
                  value={formData.target_audience}
                  onChange={handleInputChange}
                  className="text-black bg-white select select-bordered w-full focus:select-primary"
                >
                  <option value="all_residents">All Residents</option>
                  <option value="homeowners">Homeowners Only</option>
                  <option value="tenants">Tenants Only</option>
                  <option value="board_members">Board Members</option>
                </select>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Author*</span>
                </label>
                <input
                  type="text"
                  name="author"
                  value={formData.author}
                  onChange={handleInputChange}
                  className="text-black bg-white input input-bordered w-full focus:input-primary"
                  placeholder="Enter author name"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Publish Date</span>
                </label>
                <input
                  type="date"
                  name="publish_date"
                  value={formData.publish_date}
                  onChange={handleInputChange}
                  className="text-black bg-white input input-bordered w-full focus:input-primary"
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Status</span>
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="text-black bg-white select select-bordered w-full focus:select-primary"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>

            <div className="form-control">
              <label className="label cursor-pointer">
                <span className="label-text font-medium">Pin to top</span>
                <input
                  type="checkbox"
                  name="is_pinned"
                  checked={formData.is_pinned}
                  onChange={handleInputChange}
                  className="toggle toggle-primary"
                />
              </label>
              <div className="label">
                <span className="label-text-alt text-gray-500">Pinned announcements appear at the top of the list</span>
              </div>
            </div>

            <div className="modal-action pt-6">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="btn btn-ghost"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={formSubmitting}
                className="btn btn-primary bg-gradient-to-r from-blue-600 to-blue-700 text-white border-none"
              >
                {formSubmitting ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    Creating...
                  </>
                ) : (
                  'Create Announcement'
                )}
              </button>
            </div>
          </form>
        </div>
        <div className="modal-backdrop" onClick={() => setIsModalOpen(false)}></div>
      </div>
    </div>
  );
}