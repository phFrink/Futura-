'use client';
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, AlertTriangle, Building2, User, X } from "lucide-react";
import { motion } from "framer-motion";
import { createClient } from '@supabase/supabase-js';
import { formattedDate } from "@/lib/utils";

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function Complaints() {
  const [complaints, setComplaints] = useState([]);
  const [properties, setProperties] = useState([]);
  const [homeowners, setHomeowners] = useState([]);
  const [filteredComplaints, setFilteredComplaints] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    subject: '',
    description: '',
    complaint_type: '',
    severity: 'medium',
    status: 'pending',
    homeowner_id: '',
    property_id: '',
    created_date: new Date().toISOString()
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterComplaints();
  }, [complaints, searchTerm, statusFilter, severityFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Fetch complaints with related data
      const { data: complaintsData, error: complaintsError } = await supabase
        .from('complaint_tbl')
        .select(`
          *,
          homeowner_tbl:homeowner_id(*),
          properties:property_id(*)
        `)
        .order('created_date', { ascending: false });

      if (complaintsError) throw complaintsError;

      // Fetch properties for dropdown
      const { data: propertiesData, error: propertiesError } = await supabase
        .from('properties')
        .select('*')
        .order('name');

      if (propertiesError) throw propertiesError;

      // Fetch homeowners for dropdown
      const { data: homeownersData, error: homeownersError } = await supabase
        .from('homeowner_tbl')
        .select('*')
        .order('full_name');

      if (homeownersError) throw homeownersError;

      setComplaints(complaintsData || []);
      setProperties(propertiesData || []);
      setHomeowners(homeownersData || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterComplaints = async () => {
    try {
      let query = supabase
        .from('complaint_tbl')
        .select(`
          *,
          homeowner:homeowner_id(*),
          property:property_id(*)
        `)
        .order('created_date', { ascending: false });

      // Apply filters
      if (searchTerm) {
        query = query.ilike('subject', `%${searchTerm}%`);
      }
      if (statusFilter !== "all") {
        query = query.eq('status', statusFilter);
      }
      if (severityFilter !== "all") {
        query = query.eq('severity', severityFilter);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      
      setFilteredComplaints(data || []);
    } catch (error) {
      console.error('Error filtering complaints:', error);
      // Fallback to client-side filtering if needed
      let filtered = complaints;
      if (searchTerm) {
        filtered = filtered.filter(c => c.subject.toLowerCase().includes(searchTerm.toLowerCase()));
      }
      if (statusFilter !== "all") {
        filtered = filtered.filter(c => c.status === statusFilter);
      }
      if (severityFilter !== "all") {
        filtered = filtered.filter(c => c.severity === severityFilter);
      }
      setFilteredComplaints(filtered);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
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
      // Insert complaint into Supabase
      const { data, error } = await supabase
        .from('complaint_tbl')
        .insert([{
          subject: formData.subject,
          description: formData.description,
          complaint_type: formData.complaint_type,
          severity: formData.severity,
          status: formData.status,
          homeowner_id: parseInt(formData.homeowner_id),
          property_id: parseInt(formData.property_id),
          created_date: new Date().toISOString()
        }])
        .select();

      if (error) throw error;

      // Reset form and close modal
      setFormData({
        subject: '',
        description: '',
        complaint_type: '',
        severity: 'medium',
        status: 'pending',
        homeowner_id: '',
        property_id: '',
        created_date: new Date().toISOString()
      });
      
      setIsModalOpen(false);
      
      // Reload data to show new complaint
      await loadData();
      
      alert('Complaint filed successfully!');
    } catch (error) {
      console.error('Error submitting complaint:', error);
      alert('Error filing complaint. Please try again.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const getPropertyName = (complaint) => {
    return complaint.property?.name || 'N/A';
  };
  
  const getHomeownerName = (complaint) => {
    return complaint.homeowner?.full_name || 'N/A';
  };
  
  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      investigating: 'bg-blue-100 text-blue-800',
      resolved: 'bg-green-100 text-green-800',
      closed: 'bg-gray-100 text-gray-800',
      escalated: 'bg-red-100 text-red-800',
      in_progress: 'bg-indigo-100 text-indigo-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };
  
  const getSeverityColor = (severity) => {
    const colors = {
      critical: 'bg-red-500 text-white',
      high: 'bg-orange-400 text-white',
      medium: 'bg-yellow-400 text-yellow-900',
      low: 'bg-green-400 text-green-900',
    };
    return colors[severity] || 'bg-gray-400 text-white';
  };

  return (
    <div className="min-h-screen p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 mb-2">Complaints</h1>
            <p className="text-lg text-slate-600">Address and resolve homeowner complaints</p>
          </div>
          <Button 
            onClick={() => setIsModalOpen(true)}
            className="bg-gradient-to-r from-slate-800 to-slate-900 text-white shadow-lg"
          >
            <Plus className="w-5 h-5 mr-2" /> File Complaint
          </Button>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white/80 backdrop-blur-sm border border-slate-200 rounded-2xl p-6 shadow-lg">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input placeholder="Search complaints..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10"/>
            </div>
            <div className="flex gap-3">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40"><SelectValue placeholder="All Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="investigating">Investigating</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                  <SelectItem value="escalated">Escalated</SelectItem>
                </SelectContent>
              </Select>
              <Select value={severityFilter} onValueChange={setSeverityFilter}>
                <SelectTrigger className="w-40"><SelectValue placeholder="All Severity" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Severity</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
          {loading ? ( 
            <div className="text-center py-12">Loading complaints...</div> 
          ) : filteredComplaints.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertTriangle className="w-12 h-12 text-slate-400" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">No Complaints Found</h3>
              <p className="text-slate-600">No complaints match the current filters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredComplaints.map((complaint, index) => (
                <motion.div key={complaint.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
                  <Card className="bg-white/80 backdrop-blur-sm border-slate-200 hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-500 hover:-translate-y-1">
                    <CardHeader className="pb-4">
                      <div className="flex items-start justify-between gap-4">
                        <CardTitle className="text-lg text-slate-900 line-clamp-1">{complaint.subject}</CardTitle>
                        <Badge className={`${getStatusColor(complaint.status)} border capitalize`}>{complaint.status}</Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className={`${getSeverityColor(complaint.severity)} capitalize`}>{complaint.severity}</Badge>
                        <Badge variant="outline" className="capitalize">{complaint.complaint_type}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-slate-700 text-sm line-clamp-3">{complaint.description}</p>
                      <div className="bg-slate-50 rounded-xl p-4 space-y-3 text-sm">
                        <div className="flex items-center gap-2 text-slate-600">
                          <User className="w-4 h-4" />
                          <span>Filed by: {getHomeownerName(complaint)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-600">
                          <Building2 className="w-4 h-4" />
                          <span>Property: {getPropertyName(complaint)}</span>
                        </div>
                      </div>
                      <div className="text-xs text-slate-500 pt-3 border-t border-slate-200">
                        Filed on {formattedDate(new Date(complaint.created_date), "MMM d, yyyy, p")}
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
        <div className="modal-box max-w-2xl bg-white border border-gray-200 shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-gray-900">File New Complaint</h3>
            <button 
              onClick={() => setIsModalOpen(false)}
              className="btn btn-sm btn-circle btn-ghost"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Subject*</span>
                </label>
                <input
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  className="input input-bordered text-black bg-white w-full focus:input-primary"
                  placeholder="Enter complaint subject"
                  required
                />
              </div>
              
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Complaint Type*</span>
                </label>
                <select
                  name="complaint_type"
                  value={formData.complaint_type}
                  onChange={handleInputChange}
                  className="text-black bg-white select select-bordered w-full focus:select-primary"
                  required
                >
                  <option value="">Select type</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="noise">Noise</option>
                  <option value="parking">Parking</option>
                  <option value="security">Security</option>
                  <option value="billing">Billing</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Description*</span>
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className="text-black bg-white textarea textarea-bordered h-24 focus:textarea-primary resize-none"
                placeholder="Describe the complaint in detail..."
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Homeowner*</span>
                </label>
                <select
                  name="homeowner_id"
                  value={formData.homeowner_id}
                  onChange={handleInputChange}
                  className="text-black bg-white select select-bordered w-full focus:select-primary"
                  required
                >
                  <option value="">Select homeowner</option>
                  {homeowners.map(homeowner => (
                    <option key={homeowner.id} value={homeowner.id}>
                      {homeowner.full_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Property*</span>
                </label>
                <select
                  name="property_id"
                  value={formData.property_id}
                  onChange={handleInputChange}
                  className="text-black bg-white select select-bordered w-full focus:select-primary"
                  required
                >
                  <option value="">Select property</option>
                  {properties.map(property => (
                    <option key={property.id} value={property.id}>
                      {property.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Severity</span>
                </label>
                <select
                  name="severity"
                  value={formData.severity}
                  onChange={handleInputChange}
                  className="text-black bg-white select select-bordered w-full focus:select-primary"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
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
                  <option value="pending">Pending</option>
                  <option value="investigating">Investigating</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                  <option value="escalated">Escalated</option>
                </select>
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
                className="btn btn-primary bg-gradient-to-r from-slate-800 to-slate-900 text-white border-none"
              >
                {formSubmitting ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    Submitting...
                  </>
                ) : (
                  'File Complaint'
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