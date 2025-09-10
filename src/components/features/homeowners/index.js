'use client';

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Plus, Search, Mail, Phone, Calendar, Home, User, X } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function Homeowners() {
  const [homeowners, setHomeowners] = useState([]);
  const [properties, setProperties] = useState([]);
  const [filteredHomeowners, setFilteredHomeowners] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    unit_number: '',
    property_id: '',
    monthly_dues: '',
    move_in_date: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    status: 'active'
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterHomeowners();
  }, [homeowners, searchTerm]);

  // Load all homeowners with property information
  const loadHomeowners = async () => {
    try {
      const { data, error } = await supabase
        .from('homeowner_tbl')
        .select(`
          *,
          properties (
            id,
            name,
            address
          )
        `)
        .order('full_name', { ascending: true });

        

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error loading homeowners:', error);
      return [];
    }
  };

  // Load all properties
  const loadProperties = async () => {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error loading properties:', error);
      return [];
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [homeownersData, propertiesData] = await Promise.all([
        loadHomeowners(),
        loadProperties()
      ]);
      setHomeowners(homeownersData);
      setProperties(propertiesData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter homeowners based on search term
  const filterHomeowners = async () => {
    if (!searchTerm.trim()) {
      setFilteredHomeowners(homeowners);
      return;
    }

    // Client-side filtering for immediate response
    const clientFiltered = homeowners.filter(homeowner => 
      homeowner.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      homeowner.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      homeowner.unit_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (homeowner.properties?.name && homeowner.properties.name.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    setFilteredHomeowners(clientFiltered);

    // Optional: Server-side filtering for more complex searches
    // Uncomment below if you want server-side filtering
    /*
    try {
      const { data, error } = await supabase
        .from('homeowner_tbl')
        .select(`
          *,
          properties (
            id,
            name,
            address
          )
        `)
        .or(`full_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,unit_number.ilike.%${searchTerm}%`)
        .order('full_name', { ascending: true });

      if (error) throw error;
      setFilteredHomeowners(data || []);
    } catch (error) {
      console.error('Error filtering homeowners:', error);
      setFilteredHomeowners([]);
    }
    */
  };

  const getPropertyName = (homeowner) => {
    return homeowner.properties?.name || 'Unknown Property';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'inactive': return 'bg-red-100 text-red-800 border-red-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getInitials = (name) => {
    return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const resetForm = () => {
    setFormData({
      full_name: '',
      email: '',
      phone: '',
      unit_number: '',
      property_id: '',
      monthly_dues: '',
      move_in_date: '',
      emergency_contact_name: '',
      emergency_contact_phone: '',
      status: 'active'
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Prepare data for insertion
      const insertData = {
        full_name: formData.full_name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim() || null,
        unit_number: formData.unit_number.trim(),
        property_id: parseInt(formData.property_id),
        monthly_dues: formData.monthly_dues ? parseFloat(formData.monthly_dues) : null,
        move_in_date: formData.move_in_date || null,
        emergency_contact_name: formData.emergency_contact_name.trim() || null,
        emergency_contact_phone: formData.emergency_contact_phone.trim() || null,
        status: formData.status
      };

      // Insert into Supabase homeowner_tbl table with actual field mapping
      const { data, error } = await supabase
        .from('homeowner_tbl')
        .insert([insertData])
        .select(`
          id,
          full_name,
          email,
          phone,
          unit_number,
          property_id,
          monthly_dues,
          move_in_date,
          emergency_contact_name,
          emergency_contact_phone,
          status,
          created_at,
          updated_at,
          properties (
            id,
            name,
            address
          )
        `);

      if (error) throw error;

      // Success - close modal and refresh data
      setIsModalOpen(false);
      resetForm();
      
      // Add the new homeowner to the current list
      if (data && data[0]) {
        setHomeowners(prev => [...prev, data[0]]);
      }
      
      // Show success message (replace with your preferred notification system)
      alert('Homeowner added successfully!');
      
    } catch (error) {
      console.error('Error adding homeowner:', error);
      let errorMessage = 'Error adding homeowner. Please try again.';
      
      // Handle specific errors
      if (error.code === '23505') {
        if (error.message.includes('email')) {
          errorMessage = 'Email address already exists.';
        } else if (error.message.includes('unit_number')) {
          errorMessage = 'Unit number already exists in this property.';
        }
      }
      
      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Search by status
  const filterByStatus = async (status) => {
    if (!status) {
      setFilteredHomeowners(homeowners);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('homeowner_tbl')
        .select(`
          *,
          properties (
            id,
            name,
            address
          )
        `)
        .eq('status', status)
        .order('full_name', { ascending: true });

      if (error) throw error;
      setFilteredHomeowners(data || []);
    } catch (error) {
      console.error('Error filtering by status:', error);
    }
  };

  return (
    <div className="min-h-screen p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
        >
          <div>
            <h1 className="text-4xl font-bold text-slate-900 mb-2">Homeowners</h1>
            <p className="text-lg text-slate-600">Manage Futura Homes residents ({filteredHomeowners.length} total)</p>
          </div>
          <Button 
            onClick={() => setIsModalOpen(true)}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Homeowner
          </Button>
        </motion.div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/80 backdrop-blur-sm border border-slate-200 rounded-2xl p-6 shadow-lg"
        >
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                placeholder="Search homeowners..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-slate-200 focus:border-blue-400"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => filterByStatus('')}
                className="text-sm"
              >
                All
              </Button>
              <Button
                variant="outline"
                onClick={() => filterByStatus('active')}
                className="text-sm text-green-700 hover:bg-green-50"
              >
                Active
              </Button>
              <Button
                variant="outline"
                onClick={() => filterByStatus('pending')}
                className="text-sm text-yellow-700 hover:bg-yellow-50"
              >
                Pending
              </Button>
              <Button
                variant="outline"
                onClick={() => filterByStatus('inactive')}
                className="text-sm text-red-700 hover:bg-red-50"
              >
                Inactive
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Homeowners Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array(6).fill(0).map((_, i) => (
                <div key={i} className="h-80 bg-slate-200 animate-pulse rounded-2xl" />
              ))}
            </div>
          ) : filteredHomeowners.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <User className="w-12 h-12 text-slate-400" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">No homeowners found</h3>
              <p className="text-slate-600">
                {searchTerm ? 'Try adjusting your search' : 'No homeowners have been added yet'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredHomeowners.map((homeowner, index) => (
                <motion.div
                  key={homeowner.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="group overflow-hidden bg-white/80 backdrop-blur-sm border-slate-200 hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-500 hover:-translate-y-1">
                    <CardHeader className="pb-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                          <Avatar className="w-14 h-14 bg-gradient-to-br from-blue-100 to-blue-200">
                            <AvatarFallback className="text-blue-700 font-semibold text-lg">
                              {getInitials(homeowner.full_name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <CardTitle className="text-xl text-slate-900">{homeowner.full_name}</CardTitle>
                            <Badge className={`${getStatusColor(homeowner.status)} border font-medium mt-1`}>
                              {homeowner.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      {/* Contact Info */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 text-slate-600">
                          <Mail className="w-4 h-4 flex-shrink-0" />
                          <span className="text-sm truncate">{homeowner.email}</span>
                        </div>
                        {homeowner.phone && (
                          <div className="flex items-center gap-3 text-slate-600">
                            <Phone className="w-4 h-4 flex-shrink-0" />
                            <span className="text-sm">{homeowner.phone}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-3 text-slate-600">
                          <Home className="w-4 h-4 flex-shrink-0" />
                          <span className="text-sm truncate">
                            Unit {homeowner.unit_number} - {getPropertyName(homeowner)}
                          </span>
                        </div>
                      </div>

                      {/* Property Details */}
                      <div className="bg-slate-50 rounded-xl p-4 space-y-3">
                        {homeowner.monthly_dues && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-slate-700">Monthly Dues</span>
                            <span className="font-bold text-slate-900">₱{homeowner.monthly_dues?.toLocaleString()}</span>
                          </div>
                        )}
                        
                        {homeowner.move_in_date && (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-blue-600" />
                              <span className="text-sm font-medium text-slate-700">Move-in Date</span>
                            </div>
                            <span className="text-sm text-slate-600">
                              {format(new Date(homeowner.move_in_date), "MMM d, yyyy")}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Emergency Contact */}
                      {homeowner.emergency_contact_name && (
                        <div className="pt-3 border-t border-slate-200">
                          <p className="text-xs font-medium text-slate-500 mb-2">Emergency Contact</p>
                          <p className="text-sm text-slate-700">{homeowner.emergency_contact_name}</p>
                          {homeowner.emergency_contact_phone && (
                            <p className="text-sm text-slate-600">{homeowner.emergency_contact_phone}</p>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* DaisyUI Modal */}
      {isModalOpen && (
        <div className="modal modal-open">
          <div className="modal-box max-w-2xl bg-white">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-900">Add New Homeowner</h2>
              <button 
                onClick={() => {
                  setIsModalOpen(false);
                  resetForm();
                }}
                className="btn btn-sm btn-circle btn-ghost hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Information */}
              <div className="card bg-slate-50 p-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-600" />
                  Personal Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">Full Name *</span>
                    </label>
                    <input
                      type="text"
                      name="full_name"
                      value={formData.full_name}
                      onChange={handleInputChange}
                      className="input input-bordered bg-white focus:input-primary"
                      placeholder="Enter full name"
                      required
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
                      className="select select-bordered bg-white focus:select-primary"
                    >
                      <option value="active">Active</option>
                      <option value="pending">Pending</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="card bg-slate-50 p-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                  <Mail className="w-5 h-5 text-blue-600" />
                  Contact Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">Email *</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="input input-bordered bg-white focus:input-primary"
                      placeholder="Enter email address"
                      required
                    />
                  </div>
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">Phone</span>
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="input input-bordered bg-white focus:input-primary"
                      placeholder="Enter phone number"
                    />
                  </div>
                </div>
              </div>

              {/* Property Information */}
              <div className="card bg-slate-50 p-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                  <Home className="w-5 h-5 text-blue-600" />
                  Property Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">Property *</span>
                    </label>
                    <select
                      name="property_id"
                      value={formData.property_id}
                      onChange={handleInputChange}
                      className="select select-bordered bg-white focus:select-primary"
                      required
                    >
                      <option value="">Select a property</option>
                      {properties.map(property => (
                        <option key={property.id} value={property.id}>
                          {property.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">Unit Number *</span>
                    </label>
                    <input
                      type="text"
                      name="unit_number"
                      value={formData.unit_number}
                      onChange={handleInputChange}
                      className="input input-bordered bg-white focus:input-primary"
                      placeholder="Enter unit number"
                      required
                    />
                  </div>
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">Monthly Dues (₱)</span>
                    </label>
                    <input
                      type="number"
                      name="monthly_dues"
                      value={formData.monthly_dues}
                      onChange={handleInputChange}
                      className="input input-bordered bg-white focus:input-primary"
                      placeholder="Enter monthly dues"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">Move-in Date</span>
                    </label>
                    <input
                      type="date"
                      name="move_in_date"
                      value={formData.move_in_date}
                      onChange={handleInputChange}
                      className="input input-bordered bg-white focus:input-primary"
                    />
                  </div>
                </div>
              </div>

              {/* Emergency Contact */}
              <div className="card bg-slate-50 p-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                  <Phone className="w-5 h-5 text-blue-600" />
                  Emergency Contact
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">Contact Name</span>
                    </label>
                    <input
                      type="text"
                      name="emergency_contact_name"
                      value={formData.emergency_contact_name}
                      onChange={handleInputChange}
                      className="input input-bordered bg-white focus:input-primary"
                      placeholder="Enter emergency contact name"
                    />
                  </div>
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">Contact Phone</span>
                    </label>
                    <input
                      type="tel"
                      name="emergency_contact_phone"
                      value={formData.emergency_contact_phone}
                      onChange={handleInputChange}
                      className="input input-bordered bg-white focus:input-primary"
                      placeholder="Enter emergency contact phone"
                    />
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="modal-action pt-4">
                <button 
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    resetForm();
                  }}
                  className="btn btn-outline"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="btn btn-primary bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 border-none"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      Adding...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Homeowner
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}