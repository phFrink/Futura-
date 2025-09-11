'use client';

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, MapPin, Bed, Bath, Maximize, Grid, List, X, Home, Loader2, Edit, Trash2, AlertTriangle, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { createClient } from '@supabase/supabase-js';
import { isNewItem, getRelativeTime } from '@/lib/utils';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function Properties() {
  const [properties, setProperties] = useState([]);
  const [filteredProperties, setFilteredProperties] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [viewMode, setViewMode] = useState("grid");
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [editingProperty, setEditingProperty] = useState(null);
  const [deletingProperty, setDeletingProperty] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    unit_number: '',
    address: '',
    property_type: 'house',
    status: 'vacant',
    bedrooms: '',
    bathrooms: '',
    floor_area: '',
    lot_area: '',
    amenities: ''
  });

  useEffect(() => {
    loadProperties();
  }, []);

  useEffect(() => {
    filterProperties();
  }, [properties, searchTerm, statusFilter, typeFilter]);

  // Load all properties from Supabase
  const loadProperties = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('property_tbl')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading properties:', error);
        return;
      }


      console.log(data,'property data');  

      setProperties(data || []);
    } catch (error) {
      console.error('Error loading properties:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter properties based on search and filters
  const filterProperties = async () => {
    let filtered = properties;

    // Apply local filters first for better performance
    if (searchTerm) {
      filtered = filtered.filter(property => 
        property.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        property.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
        property.unit_number.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(property => property.status === statusFilter);
    }

    if (typeFilter !== "all") {
      filtered = filtered.filter(property => property.property_type === typeFilter);
    }

    setFilteredProperties(filtered);

    // For complex filters, you could also use Supabase query:
    /*
    try {
      let query = supabase
        .from('property_tbl')
        .select('*');

      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,address.ilike.%${searchTerm}%,unit_number.ilike.%${searchTerm}%`);
      }

      if (statusFilter !== "all") {
        query = query.eq('status', statusFilter);
      }

      if (typeFilter !== "all") {
        query = query.eq('property_type', typeFilter);
      }

      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;
      
      if (error) throw error;
      
      setFilteredProperties(data || []);
    } catch (error) {
      console.error('Error filtering properties:', error);
    }
    */
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

  const resetForm = () => {
    setFormData({
      name: '',
      unit_number: '',
      address: '',
      property_type: 'house',
      status: 'vacant',
      bedrooms: '',
      bathrooms: '',
      floor_area: '',
      lot_area: '',
      amenities: ''
    });
  };

  // Handle opening edit modal
  const handleEditProperty = (property) => {
    setEditingProperty(property);
    setFormData({
      name: property.name,
      unit_number: property.unit_number,
      address: property.address,
      property_type: property.property_type,
      status: property.status,
      bedrooms: property.bedrooms?.toString() || '',
      bathrooms: property.bathrooms?.toString() || '',
      floor_area: property.floor_area?.toString() || '',
      lot_area: property.lot_area?.toString() || '',
      amenities: Array.isArray(property.amenities) ? property.amenities.join(', ') : ''
    });
    setShowEditModal(true);
  };

  // Handle opening delete modal
  const handleDeleteProperty = (property) => {
    setDeletingProperty(property);
    setShowDeleteModal(true);
  };

  // Handle confirming delete
  const handleConfirmDelete = async () => {
    if (!deletingProperty) return;

    setFormSubmitting(true);
    try {
      await deleteProperty(deletingProperty.id, deletingProperty.name);
      alert('Property deleted successfully!');
      setShowDeleteModal(false);
      setDeletingProperty(null);
    } catch (error) {
      console.error('Error deleting property:', error);
      alert('Error deleting property: ' + error.message);
    } finally {
      setFormSubmitting(false);
    }
  };

  // Update property function
  const updateProperty = async (propertyId, updateData) => {
    try {
      const { data, error } = await supabase
        .from('property_tbl')
        .update({ 
          ...updateData, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', propertyId)
        .select()
        .single();

      if (error) throw error;

      // Update local state
      setProperties(prev => 
        prev.map(prop => 
          prop.id === propertyId 
            ? { ...prop, ...data }
            : prop
        )
      );

      await logPropertyActivity('updated', propertyId, data.name, 'Property details updated');
      return data;
    } catch (error) {
      console.error('Error updating property:', error);
      throw error;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormSubmitting(true);

    try {
      // Validate required fields
      if (!formData.name.trim() || !formData.unit_number.trim() || !formData.address.trim()) {
        throw new Error('Please fill in all required fields');
      }

      // Check for duplicate unit number only if creating new or changing unit number
      if (!editingProperty || (editingProperty && editingProperty.unit_number !== formData.unit_number.trim())) {
        const { data: existingProperty, error: checkError } = await supabase
          .from('property_tbl')
          .select('unit_number')
          .eq('unit_number', formData.unit_number.trim())
          .single();

        if (checkError && checkError.code !== 'PGRST116') {
          throw checkError;
        }

        if (existingProperty) {
          throw new Error(`Unit number "${formData.unit_number}" already exists`);
        }
      }

      // Process amenities string to array
      const amenitiesArray = formData.amenities 
        ? formData.amenities.split(',').map(item => item.trim()).filter(item => item)
        : [];

      // Prepare data for insert/update
      const propertyData = {
        name: formData.name.trim(),
        unit_number: formData.unit_number.trim(),
        address: formData.address.trim(),
        property_type: formData.property_type,
        status: formData.status,
        bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : null,
        bathrooms: formData.bathrooms ? parseInt(formData.bathrooms) : null,
        floor_area: formData.floor_area ? parseFloat(formData.floor_area) : null,
        lot_area: formData.lot_area ? parseFloat(formData.lot_area) : null,
        amenities: amenitiesArray,
        updated_at: new Date().toISOString()
      };

      if (editingProperty) {
        // Update existing property
        const data = await updateProperty(editingProperty.id, propertyData);
        alert('Property updated successfully!');
        setShowEditModal(false);
        setEditingProperty(null);
      } else {
        // Create new property
        propertyData.created_at = new Date().toISOString();
        
        const { data, error } = await supabase
          .from('property_tbl')
          .insert([propertyData])
          .select();

        if (error) {
          throw error;
        }

        // Success - add to local state and close modal
        if (data && data[0]) {
          setProperties(prev => [data[0], ...prev]); // Add to top of list
          await logPropertyActivity('created', data[0].id, data[0].name);
        }

        alert('Property added successfully!');
        setShowModal(false);
      }
      
      resetForm();

    } catch (error) {
      console.error('Error adding property:', error);
      alert('Error adding property: ' + error.message);
    } finally {
      setFormSubmitting(false);
    }
  };

  // Database manipulation functions
  const updatePropertyStatus = async (propertyId, newStatus) => {
    try {
      const { data, error } = await supabase
        .from('property_tbl')
        .update({ 
          status: newStatus, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', propertyId)
        .select()
        .single();

      if (error) throw error;

      // Update local state
      setProperties(prev => 
        prev.map(prop => 
          prop.id === propertyId 
            ? { ...prop, status: newStatus, updated_at: data.updated_at }
            : prop
        )
      );

      await logPropertyActivity('status_updated', propertyId, data.name, `Status changed to ${newStatus}`);
      return data;
    } catch (error) {
      console.error('Error updating property status:', error);
      throw error;
    }
  };

  const deleteProperty = async (propertyId, propertyName) => {
    try {
      const { error } = await supabase
        .from('property_tbl')
        .delete()
        .eq('id', propertyId);

      if (error) throw error;

      // Remove from local state
      setProperties(prev => prev.filter(prop => prop.id !== propertyId));
      
      await logPropertyActivity('deleted', propertyId, propertyName);
      return true;
    } catch (error) {
      console.error('Error deleting property:', error);
      throw error;
    }
  };

  const searchProperties = async (searchParams) => {
    try {
      let query = supabase.from('property_tbl').select('*');

      // Apply filters
      if (searchParams.name) {
        query = query.ilike('name', `%${searchParams.name}%`);
      }
      
      if (searchParams.status && searchParams.status !== 'all') {
        query = query.eq('status', searchParams.status);
      }
      
      if (searchParams.property_type && searchParams.property_type !== 'all') {
        query = query.eq('property_type', searchParams.property_type);
      }

      if (searchParams.min_bedrooms) {
        query = query.gte('bedrooms', parseInt(searchParams.min_bedrooms));
      }

      if (searchParams.max_bedrooms) {
        query = query.lte('bedrooms', parseInt(searchParams.max_bedrooms));
      }

      if (searchParams.min_floor_area) {
        query = query.gte('floor_area', parseFloat(searchParams.min_floor_area));
      }

      if (searchParams.max_floor_area) {
        query = query.lte('floor_area', parseFloat(searchParams.max_floor_area));
      }

      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;
      
      if (error) throw error;
      
      return data || [];
    } catch (error) {
      console.error('Error searching properties:', error);
      throw error;
    }
  };

  const getPropertyStats = async () => {
    try {
      const { data, error } = await supabase
        .from('property_tbl')
        .select('status, property_type');

      if (error) throw error;

      const stats = {
        total: data.length,
        by_status: {},
        by_type: {}
      };

      data.forEach(property => {
        // Count by status
        stats.by_status[property.status] = (stats.by_status[property.status] || 0) + 1;
        
        // Count by type
        stats.by_type[property.property_type] = (stats.by_type[property.property_type] || 0) + 1;
      });

      return stats;
    } catch (error) {
      console.error('Error getting property stats:', error);
      throw error;
    }
  };

  const logPropertyActivity = async (action, propertyId, propertyName, details = null) => {
    try {
      const logData = {
        property_id: propertyId,
        property_name: propertyName,
        action: action,
        details: details,
        timestamp: new Date().toISOString()
      };

      // Optional: Create activity log table and insert
      // const { error } = await supabase
      //   .from('property_activity_log')
      //   .insert([logData]);

      // For now, just console log
      console.log('Property Activity:', logData);
      
    } catch (error) {
      console.error('Error logging activity:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'occupied': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'vacant': return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'for_sale': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'under_construction': return 'bg-amber-50 text-amber-700 border-amber-200';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'house': return '🏠';
      case 'townhouse': return '🏘️';
      case 'condominium': return '🏢';
      case 'lot': return '🟫';
      default: return '🏠';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
        >
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent mb-2">
              Properties
            </h1>
            <p className="text-lg text-slate-600">Manage Futura Homes Koronadal properties</p>
            <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
              <span>{filteredProperties.length} of {properties.length} properties</span>
            </div>
          </div>
          <Button 
            onClick={() => setShowModal(true)}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Property
          </Button>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/70 backdrop-blur-sm border border-slate-200 rounded-2xl p-6 shadow-lg"
        >
          <div className="flex flex-col md:flex-row gap-4 items-center">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                placeholder="Search properties..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-slate-200 focus:border-blue-400 bg-white/80"
              />
            </div>

            {/* Filters */}
            <div className="flex gap-3 items-center">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40 bg-white/80">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="occupied">Occupied</SelectItem>
                  <SelectItem value="vacant">Vacant</SelectItem>
                  <SelectItem value="for_sale">For Sale</SelectItem>
                  <SelectItem value="under_construction">Under Construction</SelectItem>
                </SelectContent>
              </Select>

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-40 bg-white/80">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="house">House</SelectItem>
                  <SelectItem value="townhouse">Townhouse</SelectItem>
                  <SelectItem value="condominium">Condominium</SelectItem>
                  <SelectItem value="lot">Lot</SelectItem>
                </SelectContent>
              </Select>

              {/* View Mode Toggle */}
              <div className="flex border border-slate-200 rounded-lg bg-white/80">
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className="rounded-r-none"
                >
                  <Grid className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className="rounded-l-none"
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Properties Grid/List */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array(6).fill(0).map((_, i) => (
                <div key={i} className="h-96 bg-slate-200/60 animate-pulse rounded-2xl" />
              ))}
            </div>
          ) : filteredProperties.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center mx-auto mb-6">
                <Home className="w-12 h-12 text-slate-400" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">No properties found</h3>
              <p className="text-slate-600">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className={`grid gap-6 ${
              viewMode === "grid" 
                ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" 
                : "grid-cols-1"
            }`}>
              {filteredProperties.map((property, index) => (
                <motion.div
                  key={property.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="group overflow-hidden bg-white/80 backdrop-blur-sm border-slate-200 hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-500 hover:-translate-y-1">
                    {/* Property Header */}
                    <CardHeader className="pb-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center">
                            <span className="text-2xl">{getTypeIcon(property.property_type)}</span>
                          </div>
                          <div>
                            <CardTitle className="text-lg text-slate-900 line-clamp-1">
                              {property.name}
                            </CardTitle>
                            <p className="text-sm text-slate-600">Unit {property.unit_number}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={`${getStatusColor(property.status)} border font-medium capitalize`}>
                            {property.status.replace('_', ' ')}
                          </Badge>
                          {isNewItem(property.created_at) && (
                            <Badge className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white border-0 shadow-md animate-pulse">
                              <Sparkles className="w-3 h-3 mr-1" />
                              New
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      {/* Address */}
                      <div className="flex items-center gap-2 text-slate-600">
                        <MapPin className="w-4 h-4 flex-shrink-0" />
                        <span className="text-sm truncate">{property.address}</span>
                      </div>

                      {/* Property Details */}
                      <div className="grid grid-cols-3 gap-3">
                        {property.bedrooms && (
                          <div className="flex items-center text-slate-600">
                            <Bed className="w-4 h-4 mr-1" />
                            <span className="text-sm font-medium">{property.bedrooms}</span>
                          </div>
                        )}
                        {property.bathrooms && (
                          <div className="flex items-center text-slate-600">
                            <Bath className="w-4 h-4 mr-1" />
                            <span className="text-sm font-medium">{property.bathrooms}</span>
                          </div>
                        )}
                        {property.floor_area && (
                          <div className="flex items-center text-slate-600">
                            <Maximize className="w-4 h-4 mr-1" />
                            <span className="text-sm font-medium">{property.floor_area}m²</span>
                          </div>
                        )}
                      </div>

                      {/* Property Type */}
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="text-xs capitalize border-slate-300">
                          {property.property_type.replace('_', ' ')}
                        </Badge>
                        {property.lot_area && (
                          <span className="text-xs text-slate-500">
                            Lot: {property.lot_area}m²
                          </span>
                        )}
                      </div>

                      {/* Amenities */}
                      {property.amenities && property.amenities.length > 0 && (
                        <div className="pt-3 border-t border-slate-200">
                          <p className="text-xs font-medium text-slate-500 mb-2">Amenities</p>
                          <div className="flex flex-wrap gap-1">
                            {property.amenities.slice(0, 3).map((amenity, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs border-slate-300">
                                {amenity}
                              </Badge>
                            ))}
                            {property.amenities.length > 3 && (
                              <Badge variant="outline" className="text-xs border-slate-300">
                                +{property.amenities.length - 3} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex gap-2 pt-3 border-t border-slate-200">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 text-blue-600 border-blue-200 hover:bg-blue-50"
                          onClick={() => handleEditProperty(property)}
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
                          onClick={() => handleDeleteProperty(property)}
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

        {/* Modern Professional Modal */}
        {showModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={(e) => e.target === e.currentTarget && setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
            >
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 text-white">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-bold">Add New Property</h3>
                    <p className="text-blue-100 text-sm mt-1">Create a new property record</p>
                  </div>
                  <button 
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    onClick={() => setShowModal(false)}
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-6 max-h-[calc(90vh-100px)] overflow-y-auto">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Property Basic Info Section */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-slate-800 border-b border-slate-200 pb-2">
                      Basic Information
                    </h4>
                    
                    {/* Property Name */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">
                        Property Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        placeholder="Enter property name"
                        required
                      />
                    </div>

                    {/* Unit Number and Address */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">
                          Unit Number <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="unit_number"
                          value={formData.unit_number}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          placeholder="e.g., A-101"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">
                          Property Type <span className="text-red-500">*</span>
                        </label>
                        <select
                          name="property_type"
                          value={formData.property_type}
                          onChange={(e) => handleSelectChange('property_type', e.target.value)}
                          className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
                        >
                          <option value="house">🏠 House</option>
                          <option value="townhouse">🏘️ Townhouse</option>
                          <option value="condominium">🏢 Condominium</option>
                          <option value="lot">🟫 Lot</option>
                        </select>
                      </div>
                    </div>

                    {/* Address */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">
                        Address <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        placeholder="Enter full address"
                        required
                      />
                    </div>

                    {/* Status */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">
                        Status <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="status"
                        value={formData.status}
                        onChange={(e) => handleSelectChange('status', e.target.value)}
                        className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
                      >
                        <option value="vacant">🟡 Vacant</option>
                        <option value="occupied">🟢 Occupied</option>
                        <option value="for_sale">🔵 For Sale</option>
                        <option value="under_construction">🟠 Under Construction</option>
                      </select>
                    </div>
                  </div>

                  {/* Property Details Section */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-slate-800 border-b border-slate-200 pb-2">
                      Property Details
                    </h4>

                    {/* Bedrooms and Bathrooms */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Bedrooms</label>
                        <input
                          type="number"
                          name="bedrooms"
                          value={formData.bedrooms}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          placeholder="Number of bedrooms"
                          min="0"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Bathrooms</label>
                        <input
                          type="number"
                          name="bathrooms"
                          value={formData.bathrooms}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          placeholder="Number of bathrooms"
                          min="0"
                        />
                      </div>
                    </div>

                    {/* Floor Area and Lot Area */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Floor Area (m²)</label>
                        <input
                          type="number"
                          name="floor_area"
                          value={formData.floor_area}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          placeholder="Floor area in square meters"
                          step="0.01"
                          min="0"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Lot Area (m²)</label>
                        <input
                          type="number"
                          name="lot_area"
                          value={formData.lot_area}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          placeholder="Lot area in square meters"
                          step="0.01"
                          min="0"
                        />
                      </div>
                    </div>

                    {/* Amenities */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Amenities</label>
                      <textarea
                        name="amenities"
                        value={formData.amenities}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                        placeholder="Enter amenities separated by commas (e.g., Swimming Pool, Gym, Parking)"
                        rows="3"
                      />
                      <p className="text-xs text-slate-500">Separate multiple amenities with commas</p>
                    </div>
                  </div>

                  {/* Modal Actions */}
                  <div className="flex justify-end gap-3 pt-6 border-t border-slate-200">
                    <button
                      type="button"
                      className="px-6 py-3 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg font-medium transition-colors"
                      onClick={() => setShowModal(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className={`px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${
                        formSubmitting ? 'opacity-80 cursor-not-allowed' : ''
                      }`}
                      disabled={formSubmitting}
                    >
                      {formSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Adding Property...
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4" />
                          Add Property
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Edit Property Modal */}
        {showEditModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={(e) => e.target === e.currentTarget && setShowEditModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
            >
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 text-white">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-bold">Edit Property</h3>
                    <p className="text-blue-100 text-sm mt-1">Update property information</p>
                  </div>
                  <button 
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingProperty(null);
                      resetForm();
                    }}
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Modal Body - Same form as Add Property */}
              <div className="p-6 max-h-[calc(90vh-100px)] overflow-y-auto">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Property Basic Info Section */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-slate-800 border-b border-slate-200 pb-2">
                      Basic Information
                    </h4>
                    
                    {/* Property Name */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">
                        Property Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        placeholder="Enter property name"
                        required
                      />
                    </div>

                    {/* Unit Number and Address */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">
                          Unit Number <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="unit_number"
                          value={formData.unit_number}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          placeholder="e.g., A-101"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">
                          Property Type <span className="text-red-500">*</span>
                        </label>
                        <select
                          name="property_type"
                          value={formData.property_type}
                          onChange={(e) => handleSelectChange('property_type', e.target.value)}
                          className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
                        >
                          <option value="house">🏠 House</option>
                          <option value="townhouse">🏘️ Townhouse</option>
                          <option value="condominium">🏢 Condominium</option>
                          <option value="lot">🟫 Lot</option>
                        </select>
                      </div>
                    </div>

                    {/* Address */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">
                        Address <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        placeholder="Enter full address"
                        required
                      />
                    </div>

                    {/* Status */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">
                        Status <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="status"
                        value={formData.status}
                        onChange={(e) => handleSelectChange('status', e.target.value)}
                        className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
                      >
                        <option value="vacant">🟡 Vacant</option>
                        <option value="occupied">🟢 Occupied</option>
                        <option value="for_sale">🔵 For Sale</option>
                        <option value="under_construction">🟠 Under Construction</option>
                      </select>
                    </div>
                  </div>

                  {/* Property Details Section */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-slate-800 border-b border-slate-200 pb-2">
                      Property Details
                    </h4>

                    {/* Bedrooms and Bathrooms */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Bedrooms</label>
                        <input
                          type="number"
                          name="bedrooms"
                          value={formData.bedrooms}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          placeholder="Number of bedrooms"
                          min="0"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Bathrooms</label>
                        <input
                          type="number"
                          name="bathrooms"
                          value={formData.bathrooms}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          placeholder="Number of bathrooms"
                          min="0"
                        />
                      </div>
                    </div>

                    {/* Floor Area and Lot Area */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Floor Area (m²)</label>
                        <input
                          type="number"
                          name="floor_area"
                          value={formData.floor_area}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          placeholder="Floor area in square meters"
                          step="0.01"
                          min="0"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Lot Area (m²)</label>
                        <input
                          type="number"
                          name="lot_area"
                          value={formData.lot_area}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          placeholder="Lot area in square meters"
                          step="0.01"
                          min="0"
                        />
                      </div>
                    </div>

                    {/* Amenities */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Amenities</label>
                      <textarea
                        name="amenities"
                        value={formData.amenities}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                        placeholder="Enter amenities separated by commas (e.g., Swimming Pool, Gym, Parking)"
                        rows="3"
                      />
                      <p className="text-xs text-slate-500">Separate multiple amenities with commas</p>
                    </div>
                  </div>

                  {/* Modal Actions */}
                  <div className="flex justify-end gap-3 pt-6 border-t border-slate-200">
                    <button
                      type="button"
                      className="px-6 py-3 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg font-medium transition-colors"
                      onClick={() => {
                        setShowEditModal(false);
                        setEditingProperty(null);
                        resetForm();
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className={`px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${
                        formSubmitting ? 'opacity-80 cursor-not-allowed' : ''
                      }`}
                      disabled={formSubmitting}
                    >
                      {formSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Updating Property...
                        </>
                      ) : (
                        <>
                          <Edit className="w-4 h-4" />
                          Update Property
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={(e) => e.target === e.currentTarget && setShowDeleteModal(false)}
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
                      <h3 className="text-xl font-bold">Delete Property</h3>
                      <p className="text-red-100 text-sm mt-1">This action cannot be undone</p>
                    </div>
                  </div>
                  <button 
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    onClick={() => {
                      setShowDeleteModal(false);
                      setDeletingProperty(null);
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
                    Are you sure you want to delete this property?
                  </h4>
                  {deletingProperty && (
                    <div className="bg-slate-50 rounded-lg p-4 mb-4">
                      <p className="font-medium text-slate-900">{deletingProperty.name}</p>
                      <p className="text-sm text-slate-600">Unit {deletingProperty.unit_number}</p>
                      <p className="text-sm text-slate-600">{deletingProperty.address}</p>
                    </div>
                  )}
                  <p className="text-slate-600">
                    This will permanently delete the property and all associated data. This action cannot be reversed.
                  </p>
                </div>

                {/* Modal Actions */}
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    className="px-6 py-3 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg font-medium transition-colors"
                    onClick={() => {
                      setShowDeleteModal(false);
                      setDeletingProperty(null);
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className={`px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${
                      formSubmitting ? 'opacity-80 cursor-not-allowed' : ''
                    }`}
                    onClick={handleConfirmDelete}
                    disabled={formSubmitting}
                  >
                    {formSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4" />
                        Delete Property
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
}