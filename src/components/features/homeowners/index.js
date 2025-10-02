'use client';

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Plus, Search, Mail, Phone, Calendar, Home, User, X, Edit, Trash2, AlertTriangle, Loader2, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { createClient } from '@supabase/supabase-js';
import { isNewItem, getRelativeTime } from '@/lib/utils';
import { toast } from 'react-toastify';

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
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingHomeowner, setEditingHomeowner] = useState(null);
  const [deletingHomeowner, setDeletingHomeowner] = useState(null);
  
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
    status: 'active',
    total_property_price: '',
    down_payment: '',
    interest_rate: '0.05',
    remaining_balance: '',
    monthly_interest: ''
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

  // Calculate interest based on month and remaining balance
  const calculateMonthlyInterest = (totalPrice, downPayment, interestRate, currentMonth = new Date().getMonth() + 1) => {
    const total = parseFloat(totalPrice) || 0;
    const down = parseFloat(downPayment) || 0;
    const rate = parseFloat(interestRate) || 0.05;

    if (total <= 0 || down < 0) return { remainingBalance: 0, monthlyInterest: 0 };

    const remainingBalance = total - down;
    // Interest calculation varies by month (example: higher rates during holiday months)
    const monthlyRateMultiplier = getMonthlyRateMultiplier(currentMonth);
    const monthlyInterest = (remainingBalance * rate * monthlyRateMultiplier) / 12;

    return {
      remainingBalance: remainingBalance,
      monthlyInterest: monthlyInterest
    };
  };

  // Get rate multiplier based on month (Philippine context)
  const getMonthlyRateMultiplier = (month) => {
    // Higher rates during holiday season (November-January) and school opening (June)
    const seasonalRates = {
      1: 1.2,   // January - New Year
      2: 1.0,   // February
      3: 1.0,   // March
      4: 1.0,   // April
      5: 1.0,   // May
      6: 1.1,   // June - School opening
      7: 1.0,   // July
      8: 1.0,   // August
      9: 1.0,   // September
      10: 1.0,  // October
      11: 1.2,  // November - Holiday season
      12: 1.3   // December - Christmas
    };
    return seasonalRates[month] || 1.0;
  };

  // Auto-compute when property details change
  const autoComputeInterest = (unitNumber, propertyId, totalPrice, downPayment, interestRate) => {
    if (unitNumber && propertyId) {
      const currentMonth = new Date().getMonth() + 1;
      const { remainingBalance, monthlyInterest } = calculateMonthlyInterest(
        totalPrice,
        downPayment,
        interestRate,
        currentMonth
      );

      setFormData(prev => ({
        ...prev,
        remaining_balance: remainingBalance.toFixed(2),
        monthly_interest: monthlyInterest.toFixed(2)
      }));
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const newFormData = {
      ...formData,
      [name]: value
    };

    setFormData(newFormData);

    // Auto-compute when Unit Number is changed or financial fields are updated
    if (name === 'unit_number' || name === 'total_property_price' || name === 'down_payment' || name === 'interest_rate') {
      setTimeout(() => {
        autoComputeInterest(
          name === 'unit_number' ? value : newFormData.unit_number,
          newFormData.property_id,
          name === 'total_property_price' ? value : newFormData.total_property_price,
          name === 'down_payment' ? value : newFormData.down_payment,
          name === 'interest_rate' ? value : newFormData.interest_rate
        );
      }, 100);
    }
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
      status: 'active',
      total_property_price: '',
      down_payment: '',
      interest_rate: '0.05',
      remaining_balance: '',
      monthly_interest: ''
    });
  };

  // Handle opening edit modal
  const handleEditHomeowner = (homeowner) => {
    setEditingHomeowner(homeowner);
    setFormData({
      full_name: homeowner.full_name,
      email: homeowner.email,
      phone: homeowner.phone || '',
      unit_number: homeowner.unit_number,
      property_id: homeowner.property_id?.toString() || '',
      monthly_dues: homeowner.monthly_dues?.toString() || '',
      move_in_date: homeowner.move_in_date ? homeowner.move_in_date.split('T')[0] : '',
      emergency_contact_name: homeowner.emergency_contact_name || '',
      emergency_contact_phone: homeowner.emergency_contact_phone || '',
      status: homeowner.status,
      total_property_price: homeowner.total_property_price?.toString() || '',
      down_payment: homeowner.down_payment?.toString() || '',
      interest_rate: homeowner.interest_rate?.toString() || '0.05',
      remaining_balance: homeowner.remaining_balance?.toString() || '',
      monthly_interest: homeowner.monthly_interest?.toString() || ''
    });
    setIsEditModalOpen(true);
  };

  // Handle opening delete modal
  const handleDeleteHomeowner = (homeowner) => {
    setDeletingHomeowner(homeowner);
    setIsDeleteModalOpen(true);
  };

  // Handle confirming delete
  const handleConfirmDelete = async () => {
    if (!deletingHomeowner) return;

    setIsSubmitting(true);
    try {
      await deleteHomeowner(deletingHomeowner.id, deletingHomeowner.full_name);
      toast.success('Homeowner deleted successfully!');
      setIsDeleteModalOpen(false);
      setDeletingHomeowner(null);
    } catch (error) {
      console.error('Error deleting homeowner:', error);
      toast.error('Error deleting homeowner: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update homeowner function
  const updateHomeowner = async (homeownerId, updateData) => {
    try {
      const { data, error } = await supabase
        .from('homeowner_tbl')
        .update({ 
          ...updateData, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', homeownerId)
        .select(`
          *,
          properties (
            id,
            name,
            address
          )
        `)
        .single();

      if (error) throw error;

      // Update local state
      setHomeowners(prev => 
        prev.map(homeowner => 
          homeowner.id === homeownerId 
            ? { ...homeowner, ...data }
            : homeowner
        )
      );

      return data;
    } catch (error) {
      console.error('Error updating homeowner:', error);
      throw error;
    }
  };

  // Delete homeowner function
  const deleteHomeowner = async (homeownerId, homeownerName) => {
    try {
      const { error } = await supabase
        .from('homeowner_tbl')
        .delete()
        .eq('id', homeownerId);

      if (error) throw error;

      // Remove from local state
      setHomeowners(prev => prev.filter(homeowner => homeowner.id !== homeownerId));
      
      return true;
    } catch (error) {
      console.error('Error deleting homeowner:', error);
      throw error;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Prepare data for insertion or update
      const homeownerData = {
        full_name: formData.full_name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim() || null,
        unit_number: formData.unit_number.trim(),
        property_id: parseInt(formData.property_id),
        monthly_dues: formData.monthly_dues ? parseFloat(formData.monthly_dues) : null,
        move_in_date: formData.move_in_date || null,
        emergency_contact_name: formData.emergency_contact_name.trim() || null,
        emergency_contact_phone: formData.emergency_contact_phone.trim() || null,
        status: formData.status,
        total_property_price: formData.total_property_price ? parseFloat(formData.total_property_price) : null,
        down_payment: formData.down_payment ? parseFloat(formData.down_payment) : null,
        interest_rate: formData.interest_rate ? parseFloat(formData.interest_rate) : 0.05,
        remaining_balance: formData.remaining_balance ? parseFloat(formData.remaining_balance) : null,
        monthly_interest: formData.monthly_interest ? parseFloat(formData.monthly_interest) : null,
        updated_at: new Date().toISOString()
      };

      if (editingHomeowner) {
        // Update existing homeowner
        const data = await updateHomeowner(editingHomeowner.id, homeownerData);
        toast.success('Homeowner updated successfully!');
        setIsEditModalOpen(false);
        setEditingHomeowner(null);
      } else {
        // Create new homeowner
        homeownerData.created_at = new Date().toISOString();
        
        const { data, error } = await supabase
          .from('homeowner_tbl')
          .insert([homeownerData])
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
            total_property_price,
            down_payment,
            interest_rate,
            remaining_balance,
            monthly_interest,
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
        
        // Add the new homeowner to the current list
        if (data && data[0]) {
          setHomeowners(prev => [...prev, data[0]]);
        }
        
        toast.success('Homeowner added successfully!');
      }
      
      resetForm();
      
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
      
      toast.error(errorMessage);
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
            className="bg-gradient-to-r from-red-400 to-red-500 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg"
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
                            <div className="flex items-center gap-2 mt-1">
                              <Badge className={`${getStatusColor(homeowner.status)} border font-medium`}>
                                {homeowner.status}
                              </Badge>
                              {isNewItem(homeowner.created_at) && (
                                <Badge className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white border-0 shadow-md animate-pulse">
                                  <Sparkles className="w-3 h-3 mr-1" />
                                  New
                                </Badge>
                              )}
                            </div>
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

                        {/* Financial Information */}
                        {homeowner.total_property_price && (
                          <div className="flex items-center justify-between border-t border-slate-200 pt-3 mt-3">
                            <span className="text-sm font-medium text-blue-700">Property Price</span>
                            <span className="font-bold text-blue-900">₱{homeowner.total_property_price?.toLocaleString()}</span>
                          </div>
                        )}

                        {homeowner.down_payment && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-green-700">Down Payment</span>
                            <span className="font-bold text-green-900">₱{homeowner.down_payment?.toLocaleString()}</span>
                          </div>
                        )}

                        {homeowner.remaining_balance && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-orange-700">Remaining Balance</span>
                            <span className="font-bold text-orange-900">₱{homeowner.remaining_balance?.toLocaleString()}</span>
                          </div>
                        )}

                        {homeowner.monthly_interest && (
                          <div className="flex items-center justify-between bg-red-50 p-2 rounded-lg">
                            <div className="flex items-center gap-2">
                              <DollarSign className="w-4 h-4 text-red-600" />
                              <span className="text-sm font-medium text-red-700">Monthly Interest</span>
                            </div>
                            <span className="font-bold text-red-900">₱{homeowner.monthly_interest?.toLocaleString()}</span>
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

                      {/* Action Buttons */}
                      <div className="flex gap-2 pt-3 border-t border-slate-200">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 text-blue-600 border-blue-200 hover:bg-blue-50"
                          onClick={() => handleEditHomeowner(homeowner)}
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
                          onClick={() => handleDeleteHomeowner(homeowner)}
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Delete
                        </Button>
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

              {/* Financial Information */}
              <div className="card bg-blue-50 p-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-blue-600" />
                  Financial Information & Interest Calculation
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">Total Property Price (₱)</span>
                    </label>
                    <input
                      type="number"
                      name="total_property_price"
                      value={formData.total_property_price}
                      onChange={handleInputChange}
                      className="input input-bordered bg-white focus:input-primary"
                      placeholder="Enter total property price"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">Down Payment (₱)</span>
                    </label>
                    <input
                      type="number"
                      name="down_payment"
                      value={formData.down_payment}
                      onChange={handleInputChange}
                      className="input input-bordered bg-white focus:input-primary"
                      placeholder="Enter down payment amount"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">Interest Rate (as decimal)</span>
                    </label>
                    <input
                      type="number"
                      name="interest_rate"
                      value={formData.interest_rate}
                      onChange={handleInputChange}
                      className="input input-bordered bg-white focus:input-primary"
                      placeholder="0.05 (for 5%)"
                      min="0"
                      max="1"
                      step="0.01"
                    />
                  </div>
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium text-green-600">Current Month Rate</span>
                    </label>
                    <div className="text-sm p-3 bg-green-100 rounded-lg border">
                      <span className="font-semibold text-green-800">
                        {(getMonthlyRateMultiplier(new Date().getMonth() + 1) * 100)}% of base rate
                      </span>
                      <div className="text-xs text-green-600 mt-1">
                        {new Date().toLocaleString('en-US', { month: 'long' })} seasonal rate
                      </div>
                    </div>
                  </div>
                </div>

                {/* Auto-calculated fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium text-orange-600">Remaining Balance (₱)</span>
                    </label>
                    <input
                      type="text"
                      name="remaining_balance"
                      value={formData.remaining_balance ? `₱${parseFloat(formData.remaining_balance).toLocaleString()}` : ''}
                      className="input input-bordered bg-orange-50 text-orange-800 font-semibold"
                      readOnly
                      placeholder="Auto-calculated"
                    />
                  </div>
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium text-red-600">Monthly Interest (₱)</span>
                    </label>
                    <input
                      type="text"
                      name="monthly_interest"
                      value={formData.monthly_interest ? `₱${parseFloat(formData.monthly_interest).toLocaleString()}` : ''}
                      className="input input-bordered bg-red-50 text-red-800 font-semibold"
                      readOnly
                      placeholder="Auto-calculated"
                    />
                  </div>
                </div>

                {/* Calculation Info */}
                <div className="mt-4 p-3 bg-blue-100 rounded-lg border border-blue-200">
                  <div className="text-sm text-blue-800">
                    <strong>How it works:</strong> When you enter a Unit Number, the system automatically calculates:
                    <ul className="mt-2 ml-4 list-disc text-xs">
                      <li>Remaining Balance = Total Property Price - Down Payment</li>
                      <li>Monthly Interest = (Remaining Balance × Interest Rate × Monthly Rate) ÷ 12</li>
                      <li>Monthly rates vary by season (higher during holidays and school opening)</li>
                    </ul>
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
                  className="btn btn-primary bg-gradient-to-r from-red-400 to-red-500 hover:from-blue-700 hover:to-blue-800 border-none"
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

      {/* Edit Homeowner Modal */}
      {isEditModalOpen && (
        <div className="modal modal-open">
          <div className="modal-box max-w-2xl bg-white">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-900">Edit Homeowner</h2>
              <button 
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditingHomeowner(null);
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

              {/* Financial Information */}
              <div className="card bg-blue-50 p-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-blue-600" />
                  Financial Information & Interest Calculation
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">Total Property Price (₱)</span>
                    </label>
                    <input
                      type="number"
                      name="total_property_price"
                      value={formData.total_property_price}
                      onChange={handleInputChange}
                      className="input input-bordered bg-white focus:input-primary"
                      placeholder="Enter total property price"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">Down Payment (₱)</span>
                    </label>
                    <input
                      type="number"
                      name="down_payment"
                      value={formData.down_payment}
                      onChange={handleInputChange}
                      className="input input-bordered bg-white focus:input-primary"
                      placeholder="Enter down payment amount"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">Interest Rate (as decimal)</span>
                    </label>
                    <input
                      type="number"
                      name="interest_rate"
                      value={formData.interest_rate}
                      onChange={handleInputChange}
                      className="input input-bordered bg-white focus:input-primary"
                      placeholder="0.05 (for 5%)"
                      min="0"
                      max="1"
                      step="0.01"
                    />
                  </div>
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium text-green-600">Current Month Rate</span>
                    </label>
                    <div className="text-sm p-3 bg-green-100 rounded-lg border">
                      <span className="font-semibold text-green-800">
                        {(getMonthlyRateMultiplier(new Date().getMonth() + 1) * 100)}% of base rate
                      </span>
                      <div className="text-xs text-green-600 mt-1">
                        {new Date().toLocaleString('en-US', { month: 'long' })} seasonal rate
                      </div>
                    </div>
                  </div>
                </div>

                {/* Auto-calculated fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium text-orange-600">Remaining Balance (₱)</span>
                    </label>
                    <input
                      type="text"
                      name="remaining_balance"
                      value={formData.remaining_balance ? `₱${parseFloat(formData.remaining_balance).toLocaleString()}` : ''}
                      className="input input-bordered bg-orange-50 text-orange-800 font-semibold"
                      readOnly
                      placeholder="Auto-calculated"
                    />
                  </div>
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium text-red-600">Monthly Interest (₱)</span>
                    </label>
                    <input
                      type="text"
                      name="monthly_interest"
                      value={formData.monthly_interest ? `₱${parseFloat(formData.monthly_interest).toLocaleString()}` : ''}
                      className="input input-bordered bg-red-50 text-red-800 font-semibold"
                      readOnly
                      placeholder="Auto-calculated"
                    />
                  </div>
                </div>

                {/* Calculation Info */}
                <div className="mt-4 p-3 bg-blue-100 rounded-lg border border-blue-200">
                  <div className="text-sm text-blue-800">
                    <strong>How it works:</strong> When you enter a Unit Number, the system automatically calculates:
                    <ul className="mt-2 ml-4 list-disc text-xs">
                      <li>Remaining Balance = Total Property Price - Down Payment</li>
                      <li>Monthly Interest = (Remaining Balance × Interest Rate × Monthly Rate) ÷ 12</li>
                      <li>Monthly rates vary by season (higher during holidays and school opening)</li>
                    </ul>
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
                    setIsEditModalOpen(false);
                    setEditingHomeowner(null);
                    resetForm();
                  }}
                  className="btn btn-outline"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="btn btn-primary bg-gradient-to-r from-red-400 to-red-500 hover:from-blue-700 hover:to-blue-800 border-none"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      Updating...
                    </>
                  ) : (
                    <>
                      <Edit className="w-4 h-4 mr-2" />
                      Update Homeowner
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={(e) => e.target === e.currentTarget && setIsDeleteModalOpen(false)}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md"
          >
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-4 text-white">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Delete Homeowner</h3>
                    <p className="text-red-100 text-sm mt-1">This action cannot be undone</p>
                  </div>
                </div>
                <button 
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  onClick={() => {
                    setIsDeleteModalOpen(false);
                    setDeletingHomeowner(null);
                  }}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trash2 className="w-8 h-8 text-red-500" />
                </div>
                <h4 className="text-lg font-semibold text-slate-900 mb-2">
                  Are you sure you want to delete this homeowner?
                </h4>
                {deletingHomeowner && (
                  <div className="bg-slate-50 rounded-lg p-4 mb-4">
                    <div className="flex items-center gap-3 mb-2">
                      <Avatar className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-200">
                        <AvatarFallback className="text-blue-700 font-semibold">
                          {getInitials(deletingHomeowner.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="text-left">
                        <p className="font-medium text-slate-900">{deletingHomeowner.full_name}</p>
                        <p className="text-sm text-slate-600">{deletingHomeowner.email}</p>
                      </div>
                    </div>
                    <p className="text-sm text-slate-600">Unit {deletingHomeowner.unit_number}</p>
                  </div>
                )}
                <p className="text-slate-600">
                  This will permanently delete the homeowner record and all associated data. This action cannot be reversed.
                </p>
              </div>

              {/* Modal Actions */}
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  className="px-6 py-3 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg font-medium transition-colors"
                  onClick={() => {
                    setIsDeleteModalOpen(false);
                    setDeletingHomeowner(null);
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className={`px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${
                    isSubmitting ? 'opacity-80 cursor-not-allowed' : ''
                  }`}
                  onClick={handleConfirmDelete}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Delete Homeowner
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}