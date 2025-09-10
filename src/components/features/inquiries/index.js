'use client';
import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Mail, Phone, MessageSquare, Clock, CheckCircle, XCircle, Plus, Send, X } from "lucide-react";
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);
// Mock Supabase functions for demonstration
const mockSupabase = {
  from: (table) => ({
    select: (columns) => ({
      order: (column, options) => Promise.resolve({
        data: [
          {
            id: 1,
            name: "John Doe",
            email: "john@example.com",
            phone: "+1234567890",
            subject: "Property Information Request",
            message: "I would like to know more about the available properties in your portfolio.",
            category: "property_info",
            status: "pending",
            created_date: "2024-01-15T10:30:00Z",
            assigned_to: null
          },
          {
            id: 2,
            name: "Jane Smith",
            email: "jane@example.com",
            phone: null,
            subject: "Billing Question",
            message: "I have a question about my monthly bill and would like clarification on some charges.",
            category: "billing",
            status: "in_progress",
            created_date: "2024-01-14T14:20:00Z",
            assigned_to: "Support Team"
          }
        ],
        error: null
      })
    }),
    insert: (data) => ({
      select: () => Promise.resolve({
        data: [{ ...data, id: Date.now(), created_date: new Date().toISOString() }],
        error: null
      })
    })
  })
};

export default function Inquiries() {
  const [inquiries, setInquiries] = useState([]);
  const [filteredInquiries, setFilteredInquiries] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
    category: 'general'
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterInquiries();
  }, [inquiries, searchTerm, statusFilter, categoryFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('inquiry_tbl')
        .select('*')
        .order('created_date', { ascending: false });

        

      if (error) throw error;
      
      setInquiries(data || []);
    } catch (error) {
      console.error('Error loading inquiries:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterInquiries = () => {
    let filtered = inquiries;

    if (searchTerm) {
      filtered = filtered.filter(i => 
        i.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        i.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        i.subject?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(i => i.status === statusFilter);
    }
    
    if (categoryFilter !== "all") {
      filtered = filtered.filter(i => i.category === categoryFilter);
    }

    setFilteredInquiries(filtered);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async () => {
    setSubmitting(true);

    try {
      const { data, error } = await supabase
        .from('inquiry_tbl')
        .insert({
          name: formData.name,
          email: formData.email,
          phone: formData.phone || null,
          subject: formData.subject,
          message: formData.message,
          category: formData.category,
          status: 'pending',
          created_date: new Date().toISOString(),
          assigned_to: null
        })
        .select();

      if (error) throw error;

      // Add new inquiry to the list immediately
      setInquiries(prev => [data[0], ...prev]);

      // Reset form
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: '',
        category: 'general'
      });

      // Close modal
      const modal = document.getElementById('inquiry_modal');
      if (modal) modal.close();
      
      alert('Inquiry submitted successfully!');

    } catch (error) {
      console.error('Error submitting inquiry:', error);
      alert('Error submitting inquiry. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const openModal = () => {
    const modal = document.getElementById('inquiry_modal');
    if (modal) modal.showModal();
  };

  const closeModal = () => {
    const modal = document.getElementById('inquiry_modal');
    if (modal) modal.close();
  };

  const getStatusProps = (status) => {
    switch (status) {
      case 'pending': return { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: Clock };
      case 'in_progress': return { color: 'bg-blue-100 text-blue-800 border-blue-200', icon: MessageSquare };
      case 'responded': return { color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle };
      case 'closed': return { color: 'bg-gray-100 text-gray-800 border-gray-200', icon: XCircle };
      default: return { color: 'bg-gray-100 text-gray-800 border-gray-200', icon: Clock };
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <>
      <div className="min-h-screen p-6 md:p-8 bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-4xl font-bold text-slate-900 mb-2">Inquiries</h1>
              <p className="text-lg text-slate-600">Manage homeowner and prospect inquiries</p>
            </div>
            
            {/* New Inquiry Button */}
            <button 
              className="btn btn-primary btn-lg gap-2 shadow-lg hover:shadow-xl transition-all duration-300 bg-blue-600 hover:bg-blue-700 border-blue-600 hover:border-blue-700"
              onClick={openModal}
            >
              <Plus className="w-5 h-5" />
              New Inquiry
            </button>
          </div>

          {/* Search and Filters */}
          <div className="bg-white/80 backdrop-blur-sm border border-slate-200 rounded-2xl p-6 shadow-lg">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input 
                  placeholder="Search by name, email, subject..." 
                  value={searchTerm} 
                  onChange={(e) => setSearchTerm(e.target.value)} 
                  className="pl-10 bg-white"
                />
              </div>
              <div className="flex gap-3">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40 bg-white">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="responded">Responded</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-40 bg-white">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="billing">Billing</SelectItem>
                    <SelectItem value="services">Services</SelectItem>
                    <SelectItem value="property_info">Property Info</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Inquiries List */}
          <div>
            {loading ? (
              <div className="text-center py-12 text-slate-500">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-4">Loading inquiries...</p>
              </div>
            ) : filteredInquiries.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <MessageSquare className="w-12 h-12 text-slate-400" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">No Inquiries Found</h3>
                <p className="text-slate-600">The inquiry box is empty.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredInquiries.map((inquiry) => {
                  const { color, icon: StatusIcon } = getStatusProps(inquiry.status);
                  return (
                    <Card key={inquiry.id} className="group overflow-hidden bg-white/80 backdrop-blur-sm border-slate-200 hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-500 hover:-translate-y-1">
                      <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-4 mb-3">
                               <Badge className={`${color} border font-medium`}>
                                 <StatusIcon className="w-3 h-3 mr-1" />
                                 {inquiry.status.replace('_', ' ')}
                               </Badge>
                               <Badge variant="outline" className="capitalize">
                                 {inquiry.category.replace('_', ' ')}
                               </Badge>
                            </div>
                            <h3 className="font-bold text-slate-900 text-lg mb-1">{inquiry.subject}</h3>
                            <p className="text-slate-600 text-sm line-clamp-2">{inquiry.message}</p>
                          </div>
                          <div className="md:text-right md:w-64 flex-shrink-0">
                            <p className="font-semibold text-slate-800">{inquiry.name}</p>
                            <div className="flex items-center md:justify-end gap-2 text-sm text-slate-500">
                              <Mail className="w-3 h-3"/>
                              {inquiry.email}
                            </div>
                            {inquiry.phone && (
                              <div className="flex items-center md:justify-end gap-2 text-sm text-slate-500">
                                <Phone className="w-3 h-3"/>
                                {inquiry.phone}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-xs text-slate-500 pt-4 mt-4 border-t border-slate-200">
                           Received on {formatDate(inquiry.created_date)}
                           {inquiry.assigned_to && <span className="mx-2">|</span>}
                           {inquiry.assigned_to && <span>Assigned to: {inquiry.assigned_to}</span>}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* DaisyUI Modal */}
      <dialog id="inquiry_modal" className="modal modal-bottom sm:modal-middle">
        <div className="modal-box max-w-2xl bg-gradient-to-br from-white to-slate-50 border border-slate-200">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-2xl text-slate-900 mb-1">Submit New Inquiry</h3>
              <p className="text-slate-600">We'll get back to you as soon as possible</p>
            </div>
            <button 
              className="btn btn-sm btn-circle btn-ghost hover:bg-slate-100 transition-colors"
              onClick={closeModal}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-6">
            {/* Personal Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium text-slate-700">Full Name *</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter your full name"
                  className="input input-bordered w-full focus:input-primary transition-colors bg-white/80"
                />
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium text-slate-700">Email Address *</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Enter your email"
                  className="input input-bordered w-full focus:input-primary transition-colors bg-white/80"
                />
              </div>
            </div>

            {/* Contact Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium text-slate-700">Phone Number</span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="Enter your phone number"
                  className="input input-bordered w-full focus:input-primary transition-colors bg-white/80"
                />
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium text-slate-700">Category *</span>
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="select select-bordered w-full focus:select-primary transition-colors bg-white/80"
                >
                  <option value="general">General</option>
                  <option value="billing">Billing</option>
                  <option value="services">Services</option>
                  <option value="property_info">Property Info</option>
                </select>
              </div>
            </div>

            {/* Subject */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium text-slate-700">Subject *</span>
              </label>
              <input
                type="text"
                name="subject"
                value={formData.subject}
                onChange={handleInputChange}
                placeholder="Brief description of your inquiry"
                className="input input-bordered w-full focus:input-primary transition-colors bg-white/80"
              />
            </div>

            {/* Message */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium text-slate-700">Message *</span>
              </label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleInputChange}
                placeholder="Please provide details about your inquiry..."
                className="textarea textarea-bordered h-32 w-full focus:textarea-primary transition-colors bg-white/80 resize-none"
              ></textarea>
              <label className="label">
                <span className="label-text-alt text-slate-500">
                  {formData.message.length}/500 characters
                </span>
              </label>
            </div>

            {/* Action Buttons */}
            <div className="modal-action pt-4">
              <button
                type="button"
                className="btn btn-outline btn-lg gap-2 hover:bg-slate-100 transition-colors"
                onClick={closeModal}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary btn-lg gap-2 shadow-lg hover:shadow-xl transition-all bg-blue-600 hover:bg-blue-700 border-blue-600 hover:border-blue-700"
                disabled={submitting || !formData.name || !formData.email || !formData.subject || !formData.message}
                onClick={handleSubmit}
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Submit Inquiry
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
        <div className="modal-backdrop" onClick={closeModal}>
          <button type="button">close</button>
        </div>
      </dialog>
    </>
  );
}