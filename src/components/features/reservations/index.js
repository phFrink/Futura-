'use client';

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Calendar, Clock, CheckCircle, XCircle, Users, Home, Building, X, Edit, Trash2, AlertTriangle, Loader2, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { createClient } from '@supabase/supabase-js';
import { isNewItem, getRelativeTime } from '@/lib/utils';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function Appointments() {
  const [reservations, setReservations] = useState([]);
  const [homeowners, setHomeowners] = useState([]);
  const [filteredReservations, setFilteredReservations] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [facilityFilter, setFacilityFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingReservation, setEditingReservation] = useState(null);
  const [deletingReservation, setDeletingReservation] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    homeowner_id: '',
    facility_name: '',
    reservation_date: '',
    start_time: '',
    end_time: '',
    purpose: '',
    fee: 0,
    status: 'pending'
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterReservations();
  }, [reservations, statusFilter, facilityFilter]);

  const loadData = async () => {
    try {
      // Fetch reservations with homeowner details
      const { data: reservationData, error: reservationError } = await supabase
        .from('reservation_tbl')
        .select(`
          *,
          homeowner:homeowner_id (
            id,
            full_name
          )
        `)
        .order('created_at', { ascending: false });

      if (reservationError) throw reservationError;

      // Fetch homeowners for dropdown
      const { data: homeownerData, error: homeownerError } = await supabase
        .from('homeowner_tbl')
        .select('id, full_name')
        .order('full_name');

      if (homeownerError) throw homeownerError;

      setReservations(reservationData || []);
      setHomeowners(homeownerData || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterReservations = () => {
    let filtered = reservations;
    if (statusFilter !== "all") {
      filtered = filtered.filter(r => r.status === statusFilter);
    }
    if (facilityFilter !== "all") {
      filtered = filtered.filter(r => r.facility_name === facilityFilter);
    }
    setFilteredReservations(filtered);
  };
  
  const getHomeownerName = (id) => {
    const homeowner = homeowners.find(h => h.id === id);
    return homeowner?.full_name || 'N/A';
  };
  
  const getStatusProps = (status) => {
    switch (status) {
      case 'pending': return { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: Clock };
      case 'confirmed': return { color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle };
      case 'cancelled': return { color: 'bg-red-100 text-red-800 border-red-200', icon: XCircle };
      case 'completed': return { color: 'bg-blue-100 text-blue-800 border-blue-200', icon: CheckCircle };
      default: return { color: 'bg-gray-100 text-gray-800 border-gray-200', icon: Clock };
    }
  };
  
  const getFacilityIcon = (facility) => {
    switch(facility) {
      case 'clubhouse': return <Home className="w-5 h-5"/>;
      case 'swimming_pool': return <Users className="w-5 h-5"/>;
      case 'basketball_court': return <Building className="w-5 h-5"/>;
      default: return <Building className="w-5 h-5"/>;
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }));
  };

  // Handle opening edit modal
  const handleEditReservation = (reservation) => {
    setEditingReservation(reservation);
    setFormData({
      homeowner_id: reservation.homeowner_id?.toString() || '',
      facility_name: reservation.facility_name,
      reservation_date: reservation.reservation_date,
      start_time: reservation.start_time,
      end_time: reservation.end_time,
      purpose: reservation.purpose,
      fee: reservation.fee || 0,
      status: reservation.status
    });
    setIsEditModalOpen(true);
  };

  // Handle opening delete modal
  const handleDeleteReservation = (reservation) => {
    setDeletingReservation(reservation);
    setIsDeleteModalOpen(true);
  };

  // Handle confirming delete
  const handleConfirmDelete = async () => {
    if (!deletingReservation) return;

    setSubmitting(true);
    try {
      await deleteReservation(deletingReservation.id, deletingReservation.facility_name);
      toast.success('Reservation deleted successfully!');
      setIsDeleteModalOpen(false);
      setDeletingReservation(null);
    } catch (error) {
      console.error('Error deleting reservation:', error);
      toast.info('Error deleting reservation: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Update reservation function
  const updateReservation = async (reservationId, updateData) => {
    try {
      const { data, error } = await supabase
        .from('reservation_tbl')
        .update({ 
          ...updateData, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', reservationId)
        .select(`
          *,
          homeowner:homeowner_id (
            id,
            full_name
          )
        `)
        .single();

      if (error) throw error;

      // Update local state
      setReservations(prev => 
        prev.map(reservation => 
          reservation.id === reservationId 
            ? { ...reservation, ...data }
            : reservation
        )
      );

      return data;
    } catch (error) {
      console.error('Error updating reservation:', error);
      throw error;
    }
  };

  // Delete reservation function
  const deleteReservation = async (reservationId, facilityName) => {
    try {
      const { error } = await supabase
        .from('reservation_tbl')
        .delete()
        .eq('id', reservationId);

      if (error) throw error;

      // Remove from local state
      setReservations(prev => prev.filter(reservation => reservation.id !== reservationId));
      
      return true;
    } catch (error) {
      console.error('Error deleting reservation:', error);
      throw error;
    }
  };

  // Reset form data
  const resetForm = () => {
    setFormData({
      homeowner_id: '',
      facility_name: '',
      reservation_date: '',
      start_time: '',
      end_time: '',
      purpose: '',
      fee: 0,
      status: 'pending'
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (editingReservation) {
        // Update existing reservation
        const updateData = {
          homeowner_id: formData.homeowner_id,
          facility_name: formData.facility_name,
          reservation_date: formData.reservation_date,
          start_time: formData.start_time,
          end_time: formData.end_time,
          purpose: formData.purpose,
          fee: formData.fee,
          status: formData.status
        };
        
        const data = await updateReservation(editingReservation.id, updateData);
        toast.success('Reservation updated successfully!');
        setIsEditModalOpen(false);
        setEditingReservation(null);
      } else {
        // Create new reservation
        const { data, error } = await supabase
          .from('reservation_tbl')
          .insert([{
            homeowner_id: formData.homeowner_id,
            facility_name: formData.facility_name,
            reservation_date: formData.reservation_date,
            start_time: formData.start_time,
            end_time: formData.end_time,
            purpose: formData.purpose,
            fee: formData.fee,
            status: formData.status,
            created_at: new Date().toISOString()
          }])
          .select();

        if (error) throw error;

        setIsModalOpen(false);
        loadData(); // Refresh the data
        
        toast.success('Reservation created successfully!');
      }

      // Reset form
      resetForm();
    } catch (error) {
      console.error('Error creating reservation:', error);
      toast.error('Error creating reservation. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  return (
    <div className="min-h-screen p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 mb-2">Appointments</h1>
            <p className="text-lg text-slate-600">Manage facility appointments and events</p>
          </div>
          <Button 
            onClick={() => setIsModalOpen(true)}
            className="bg-gradient-to-r from-red-400 to-red-500 text-white shadow-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200"
          >
            <Plus className="w-5 h-5 mr-2" /> New Appointment
          </Button>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white/80 backdrop-blur-sm border border-slate-200 rounded-2xl p-6 shadow-lg">
          <div className="flex flex-col md:flex-row gap-4 items-center tex">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48"><SelectValue placeholder="All Statuses" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={facilityFilter} onValueChange={setFacilityFilter}>
              <SelectTrigger className="w-48"><SelectValue placeholder="All Facilities" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Facilities</SelectItem>
                <SelectItem value="clubhouse">Clubhouse</SelectItem>
                <SelectItem value="swimming_pool">Swimming Pool</SelectItem>
                <SelectItem value="basketball_court">Basketball Court</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
          {loading ? ( 
            <div className="text-center py-12">
              <div className="loading loading-spinner loading-lg"></div>
              <p className="mt-4 text-slate-600">Loading appointments...</p>
            </div> 
          ) : filteredReservations.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Calendar className="w-12 h-12 text-slate-400" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">No Appointments Found</h3>
              <p className="text-slate-600">No appointments match your filters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredReservations.map((reservation, index) => {
                const { color, icon: StatusIcon } = getStatusProps(reservation.status);
                return (
                  <motion.div key={reservation.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
                    <Card className="bg-white/80 backdrop-blur-sm border-slate-200 hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-500 hover:-translate-y-1">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-3 bg-slate-100 rounded-lg">
                              {getFacilityIcon(reservation.facility_name)}
                            </div>
                            <div>
                              <CardTitle className="text-lg text-slate-900 capitalize">
                                {reservation.facility_name.replace('_', ' ')}
                              </CardTitle>
                              <p className="text-sm text-slate-600">{reservation.purpose}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={`${color} border capitalize`}>{reservation.status}</Badge>
                            {isNewItem(reservation.created_at) && (
                              <Badge className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white border-0 shadow-md animate-pulse">
                                <Sparkles className="w-3 h-3 mr-1" />
                                New
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="text-sm space-y-2 bg-slate-50 rounded-lg p-3">
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4"/>
                            <span>Booked by: {getHomeownerName(reservation.homeowner_id)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4"/>
                            <span>{format(new Date(reservation.reservation_date), 'EEE, MMM d, yyyy')}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4"/>
                            <span>{reservation.start_time} - {reservation.end_time}</span>
                          </div>
                        </div>
                        {reservation.fee > 0 && 
                          <div className="flex justify-between items-center pt-2 border-t">
                            <span className="text-sm font-medium">Appointment Fee</span>
                            <span className="text-md font-bold">₱{reservation.fee.toLocaleString()}</span>
                          </div>
                        }
                        
                        {/* Action Buttons */}
                        <div className="flex gap-2 pt-3 mt-3 border-t border-slate-200">
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 text-blue-600 border-blue-200 hover:bg-blue-50"
                            onClick={() => handleEditReservation(reservation)}
                          >
                            <Edit className="w-4 h-4 mr-1" />
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
                            onClick={() => handleDeleteReservation(reservation)}
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>

      {/* DaisyUI Modal */}
      {isModalOpen && (
        <div className="modal modal-open">
          <div className="modal-box max-w-2xl bg-white">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-800">New Appointment</h3>
              <button 
                onClick={closeModal}
                className="btn btn-sm btn-circle btn-ghost hover:bg-gray-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Homeowner Selection */}
                <div className="form-control w-full">
                  <label className="label">
                    <span className="label-text font-semibold text-gray-700">Homeowner *</span>
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

                {/* Facility Selection */}
                <div className="form-control w-full">
                  <label className="label">
                    <span className="label-text font-semibold text-gray-700">Facility *</span>
                  </label>
                  <select 
                    name="facility_name"
                    value={formData.facility_name}
                    onChange={handleInputChange}
                    className="text-black bg-white select select-bordered w-full focus:select-primary"
                    required
                  >
                    <option value="">Select facility</option>
                    <option value="clubhouse">Clubhouse</option>
                    <option value="swimming_pool">Swimming Pool</option>
                    <option value="basketball_court">Basketball Court</option>
                  </select>
                </div>

                {/* Date */}
                <div className="form-control w-full">
                  <label className="label">
                    <span className="label-text font-semibold text-gray-700">Appointment Date *</span>
                  </label>
                  <input 
                    type="date"
                    name="reservation_date"
                    value={formData.reservation_date}
                    onChange={handleInputChange}
                    className="text-black bg-white input input-bordered w-full focus:input-primary"
                    required
                  />
                </div>

                {/* Status */}
                <div className="form-control w-full">
                  <label className="label">
                    <span className="label-text font-semibold text-gray-700">Status</span>
                  </label>
                  <select 
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="text-black bg-white select select-bordered w-full focus:select-primary"
                  >
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>

                {/* Start Time */}
                <div className="form-control w-full">
                  <label className="label">
                    <span className="label-text font-semibold text-gray-700">Start Time *</span>
                  </label>
                  <input 
                    type="time"
                    name="start_time"
                    value={formData.start_time}
                    onChange={handleInputChange}
                    className="text-black bg-white input input-bordered w-full focus:input-primary"
                    required
                  />
                </div>

                {/* End Time */}
                <div className="form-control w-full">
                  <label className="label">
                    <span className="label-text font-semibold text-gray-700">End Time *</span>
                  </label>
                  <input 
                    type="time"
                    name="end_time"
                    value={formData.end_time}
                    onChange={handleInputChange}
                    className="text-black bg-white input input-bordered w-full focus:input-primary"
                    required
                  />
                </div>
              </div>

              {/* Purpose */}
              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text font-semibold text-gray-700">Purpose *</span>
                </label>
                <textarea 
                  name="purpose"
                  value={formData.purpose}
                  onChange={handleInputChange}
                  placeholder="Describe the purpose of this appointment..."
                  className="text-black bg-white textarea textarea-bordered h-20 w-full focus:textarea-primary resize-none"
                  required
                />
              </div>

              {/* Fee */}
              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text font-semibold text-gray-700">Appointment Fee (₱)</span>
                </label>
                <input 
                  type="number"
                  name="fee"
                  value={formData.fee}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  className="text-black bg-white input input-bordered w-full focus:input-primary"
                />
              </div>

              {/* Modal Actions */}
              <div className="modal-action">
                <button 
                  type="button"
                  onClick={closeModal}
                  className="btn btn-ghost"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="btn btn-primary bg-gradient-to-r from-red-400 to-red-500 border-0 text-white"
                  disabled={submitting}
                >
                  {submitting && <span className="loading loading-spinner loading-sm"></span>}
                  {submitting ? 'Creating...' : 'Create Appointment'}
                </button>
              </div>
            </form>
          </div>
          <div className="modal-backdrop bg-black/50" onClick={closeModal}></div>
        </div>
      )}

      {/* Edit Reservation Modal */}
      {isEditModalOpen && (
        <div className="modal modal-open">
          <div className="modal-box max-w-2xl bg-white">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-800">Edit Appointment</h3>
              <button 
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditingReservation(null);
                  resetForm();
                }}
                className="btn btn-sm btn-circle btn-ghost hover:bg-gray-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Homeowner Selection */}
                <div className="form-control w-full">
                  <label className="label">
                    <span className="label-text font-semibold text-gray-700">Homeowner *</span>
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

                {/* Facility Selection */}
                <div className="form-control w-full">
                  <label className="label">
                    <span className="label-text font-semibold text-gray-700">Facility *</span>
                  </label>
                  <select 
                    name="facility_name"
                    value={formData.facility_name}
                    onChange={handleInputChange}
                    className="text-black bg-white select select-bordered w-full focus:select-primary"
                    required
                  >
                    <option value="">Select facility</option>
                    <option value="clubhouse">Clubhouse</option>
                    <option value="swimming_pool">Swimming Pool</option>
                    <option value="basketball_court">Basketball Court</option>
                  </select>
                </div>

                {/* Date */}
                <div className="form-control w-full">
                  <label className="label">
                    <span className="label-text font-semibold text-gray-700">Appointment Date *</span>
                  </label>
                  <input 
                    type="date"
                    name="reservation_date"
                    value={formData.reservation_date}
                    onChange={handleInputChange}
                    className="text-black bg-white input input-bordered w-full focus:input-primary"
                    required
                  />
                </div>

                {/* Status */}
                <div className="form-control w-full">
                  <label className="label">
                    <span className="label-text font-semibold text-gray-700">Status</span>
                  </label>
                  <select 
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="text-black bg-white select select-bordered w-full focus:select-primary"
                  >
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>

                {/* Start Time */}
                <div className="form-control w-full">
                  <label className="label">
                    <span className="label-text font-semibold text-gray-700">Start Time *</span>
                  </label>
                  <input 
                    type="time"
                    name="start_time"
                    value={formData.start_time}
                    onChange={handleInputChange}
                    className="text-black bg-white input input-bordered w-full focus:input-primary"
                    required
                  />
                </div>

                {/* End Time */}
                <div className="form-control w-full">
                  <label className="label">
                    <span className="label-text font-semibold text-gray-700">End Time *</span>
                  </label>
                  <input 
                    type="time"
                    name="end_time"
                    value={formData.end_time}
                    onChange={handleInputChange}
                    className="text-black bg-white input input-bordered w-full focus:input-primary"
                    required
                  />
                </div>
              </div>

              {/* Purpose */}
              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text font-semibold text-gray-700">Purpose *</span>
                </label>
                <textarea 
                  name="purpose"
                  value={formData.purpose}
                  onChange={handleInputChange}
                  placeholder="Describe the purpose of this appointment..."
                  className="text-black bg-white textarea textarea-bordered h-20 w-full focus:textarea-primary resize-none"
                  required
                />
              </div>

              {/* Fee */}
              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text font-semibold text-gray-700">Appointment Fee (₱)</span>
                </label>
                <input 
                  type="number"
                  name="fee"
                  value={formData.fee}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  className="text-black bg-white input input-bordered w-full focus:input-primary"
                />
              </div>

              {/* Modal Actions */}
              <div className="modal-action">
                <button 
                  type="button"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setEditingReservation(null);
                    resetForm();
                  }}
                  className="btn btn-ghost"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="btn btn-primary bg-gradient-to-r from-red-400 to-red-500 border-0 text-white"
                  disabled={submitting}
                >
                  {submitting && <span className="loading loading-spinner loading-sm"></span>}
                  {submitting ? 'Updating...' : (
                    <>
                      <Edit className="w-4 h-4 mr-2" />
                      Update Appointment
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
          <div className="modal-backdrop bg-black/50" onClick={() => {
            setIsEditModalOpen(false);
            setEditingReservation(null);
            resetForm();
          }}></div>
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
            <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-4 text-white rounded-t-2xl">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Delete Appointment</h3>
                    <p className="text-red-100 text-sm mt-1">This action cannot be undone</p>
                  </div>
                </div>
                <button 
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  onClick={() => {
                    setIsDeleteModalOpen(false);
                    setDeletingReservation(null);
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
                  Are you sure you want to delete this appointment?
                </h4>
                {deletingReservation && (
                  <div className="bg-slate-50 rounded-lg p-4 mb-4 text-left">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-slate-100 rounded-lg">
                        {getFacilityIcon(deletingReservation.facility_name)}
                      </div>
                      <div>
                        <h5 className="font-medium text-slate-900 capitalize">
                          {deletingReservation.facility_name.replace('_', ' ')}
                        </h5>
                        <p className="text-sm text-slate-600">{deletingReservation.purpose}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-500">
                      <div className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        <span>{getHomeownerName(deletingReservation.homeowner_id)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>{format(new Date(deletingReservation.reservation_date), 'MMM d, yyyy')}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{deletingReservation.start_time} - {deletingReservation.end_time}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className={`px-2 py-1 rounded text-xs ${getStatusProps(deletingReservation.status).color}`}>
                          {deletingReservation.status}
                        </span>
                      </div>
                    </div>
                    {deletingReservation.fee > 0 && (
                      <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-200">
                        <span className="text-xs font-medium">Fee:</span>
                        <span className="text-sm font-bold">₱{deletingReservation.fee.toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                )}
                <p className="text-slate-600">
                  This will permanently delete the appointment and all associated data. This action cannot be reversed.
                </p>
              </div>

              {/* Modal Actions */}
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  className="px-6 py-3 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg font-medium transition-colors"
                  onClick={() => {
                    setIsDeleteModalOpen(false);
                    setDeletingReservation(null);
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className={`px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${
                    submitting ? 'opacity-80 cursor-not-allowed' : ''
                  }`}
                  onClick={handleConfirmDelete}
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Delete Appointment
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