'use client';

import React, { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Search, MapPin, Bed, Bath, Maximize, X, Calendar, Phone, Mail,
  User, Home, ChevronLeft, ChevronRight, Filter, Menu, Building2, LogOut, LogIn, Settings
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from '@supabase/supabase-js';
import { toast } from 'react-toastify';
import { useClientAuth } from '@/contexts/ClientAuthContext';
import Link from 'next/link';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function ClientLandingPage() {
  const router = useRouter();
  const { user, profile, isAuthenticated, logout } = useClientAuth();
  const [properties, setProperties] = useState([]);
  const [filteredProperties, setFilteredProperties] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showInquiryModal, setShowInquiryModal] = useState(false);

  // Filter states
  const [filters, setFilters] = useState({
    propertyType: 'all',
    bedrooms: 'all'
  });

  // Appointment form state
  const [appointmentForm, setAppointmentForm] = useState({
    date: '',
    time: '',
    message: ''
  });

  // Inquiry form state
  const [inquiryForm, setInquiryForm] = useState({
    firstname: '',
    lastname: '',
    email: '',
    phone: '',
    message: ''
  });

  // OTP verification state
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);
  const [sendingOtp, setSendingOtp] = useState(false);

  useEffect(() => {
    fetchProperties();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchTerm, filters, properties]);

  // OTP Timer countdown
  useEffect(() => {
    if (otpTimer > 0) {
      const timer = setTimeout(() => setOtpTimer(otpTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [otpTimer]);

  // Close profile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showProfileMenu && !event.target.closest('.relative')) {
        setShowProfileMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showProfileMenu]);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      const { data: propertiesData, error } = await supabase
        .from('property_info_tbl')
        .select(`
          *,
          property_detail_tbl!property_details_id(
            detail_id,
            property_name,
            property_area
          ),
          lot_tbl!property_lot_id(
            lot_id,
            lot_number
          )
        `)
        .eq('property_availability', 'for_sale')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProperties(propertiesData || []);
      setFilteredProperties(propertiesData || []);
    } catch (error) {
      console.error('Error fetching properties:', error);
      toast.error('Failed to load properties');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get spec value from property_area array
  const getSpecValue = (property, specName) => {
    if (!property?.property_detail_tbl?.property_area) return null;
    const spec = property.property_detail_tbl.property_area.find(s =>
      s.name?.toLowerCase().includes(specName.toLowerCase())
    );
    return spec ? spec.value : null;
  };

  const applyFilters = () => {
    let filtered = [...properties];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(property =>
        property.property_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        property.lot_tbl?.lot_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        property.property_detail_tbl?.property_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Property type filter
    if (filters.propertyType !== 'all') {
      filtered = filtered.filter(property =>
        property.property_detail_tbl?.property_name === filters.propertyType
      );
    }

    // Bedrooms filter
    if (filters.bedrooms !== 'all') {
      filtered = filtered.filter(property => {
        const bedrooms = getSpecValue(property, 'bedroom');
        return bedrooms && parseInt(bedrooms) >= parseInt(filters.bedrooms);
      });
    }

    setFilteredProperties(filtered);
  };

  const handleSendOTP = async () => {
    // Validate email first
    const email = isAuthenticated ? user.email : inquiryForm.email;

    if (!email) {
      toast.error('Please enter your email address');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    try {
      setSendingOtp(true);
      const response = await fetch('/api/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          purpose: 'inquiry verification',
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('OTP sent to your email! Please check your inbox.');
        setOtpSent(true);
        setOtpTimer(300); // 5 minutes = 300 seconds
        setOtpCode('');
        setOtpVerified(false);
      } else {
        toast.error(result.message || 'Failed to send OTP');
      }
    } catch (error) {
      console.error('Error sending OTP:', error);
      toast.error('Failed to send OTP. Please try again.');
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otpCode || otpCode.length !== 6) {
      toast.error('Please enter a valid 6-digit OTP code');
      return;
    }

    const email = isAuthenticated ? user.email : inquiryForm.email;

    try {
      const response = await fetch('/api/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          otp_code: otpCode,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Email verified successfully!');
        setOtpVerified(true);
        setOtpTimer(0);
      } else {
        toast.error(result.message || 'Invalid OTP code');
        setOtpCode('');
      }
    } catch (error) {
      console.error('Error verifying OTP:', error);
      toast.error('Failed to verify OTP. Please try again.');
    }
  };

  const handleInquirySubmit = async (e) => {
    e.preventDefault();

    // For non-authenticated users, require OTP verification
    if (!isAuthenticated && !otpVerified) {
      toast.error('Please verify your email with OTP first');
      return;
    }

    try {
      // Split full name for authenticated users
      let firstname = '';
      let lastname = '';

      if (isAuthenticated) {
        const fullName = profile?.full_name || profile?.first_name || user?.email?.split('@')[0] || '';
        const nameParts = fullName.trim().split(' ');
        firstname = nameParts[0] || '';
        lastname = nameParts.slice(1).join(' ') || '';
      } else {
        firstname = inquiryForm.firstname;
        lastname = inquiryForm.lastname;
      }

      const response = await fetch('/api/send-inquiry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          property_id: selectedProperty?.property_id,
          property_title: selectedProperty?.property_title,
          user_id: user?.id || null,
          role_id: profile?.role_id || null,
          client_firstname: firstname,
          client_lastname: lastname,
          client_email: isAuthenticated ? user.email : inquiryForm.email,
          client_phone: isAuthenticated ? (profile?.phone || '') : inquiryForm.phone,
          message: inquiryForm.message,
          is_authenticated: isAuthenticated,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Failed to send inquiry');
      }

      toast.success(result.message || 'Inquiry sent successfully! We will contact you soon.');
      setShowInquiryModal(false);
      setInquiryForm({
        firstname: '',
        lastname: '',
        email: '',
        phone: '',
        message: ''
      });
      // Reset OTP states
      setOtpSent(false);
      setOtpCode('');
      setOtpVerified(false);
      setOtpTimer(0);
    } catch (error) {
      console.error('Error submitting inquiry:', error);
      toast.error(error.message || 'Failed to submit inquiry');
    }
  };

  const handleAppointmentSubmit = async (e) => {
    e.preventDefault();

    if (!isAuthenticated || !user) {
      toast.error('Please login to book an appointment');
      router.push('/client-login');
      return;
    }

    try {
      const response = await fetch('/api/book-tour', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          property_id: selectedProperty?.property_id,
          property_title: selectedProperty?.property_title,
          user_id: user.id,
          client_name: profile?.full_name || user.email,
          client_email: user.email,
          client_phone: profile?.phone || '',
          appointment_date: appointmentForm.date,
          appointment_time: appointmentForm.time,
          message: appointmentForm.message,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Failed to book tour');
      }

      toast.success(result.message || 'Tour booking submitted successfully!');
      setShowAppointmentModal(false);
      setAppointmentForm({
        date: '',
        time: '',
        message: ''
      });
    } catch (error) {
      console.error('Error submitting appointment:', error);
      toast.error(error.message || 'Failed to submit appointment request');
    }
  };

  const formatPrice = (price) => {
    if (!price) return null;
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0
    }).format(price);
  };

  // Helper to get property type options
  const getPropertyTypes = () => {
    const types = new Set(properties.map(p => p.property_detail_tbl?.property_name).filter(Boolean));
    return Array.from(types);
  };

  // Get user initials for avatar
  const getUserInitials = () => {
    if (profile?.first_name) {
      return profile.first_name.charAt(0).toUpperCase();
    }
    if (user?.email) {
      return user.email.charAt(0).toUpperCase();
    }
    return 'U';
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header/Navigation */}
      <nav className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Building2 className="h-8 w-8 text-red-600" />
              <span className="text-2xl font-bold text-slate-800">Futura Homes</span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#properties" className="text-slate-600 hover:text-red-600 transition-colors">Properties</a>
              <a href="#about" className="text-slate-600 hover:text-red-600 transition-colors">About</a>
              <a href="#contact" className="text-slate-600 hover:text-red-600 transition-colors">Contact</a>
              {isAuthenticated ? (
                <div className="relative">
                  <button
                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                    className="flex items-center space-x-2 focus:outline-none"
                  >
                    <span className="text-slate-600">Hi, {profile?.full_name || user?.email?.split('@')[0]}</span>
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-r from-red-500 to-red-600 flex items-center justify-center text-white font-semibold shadow-md hover:shadow-lg transition-shadow cursor-pointer">
                      {profile?.profile_photo ? (
                        <img
                          src={profile.profile_photo}
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span>{getUserInitials()}</span>
                      )}
                    </div>
                  </button>

                  {/* Dropdown Menu */}
                  {showProfileMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-2 z-50">
                      <Link
                        href="/client-account"
                        className="flex items-center px-4 py-2 text-slate-700 hover:bg-slate-50 transition-colors"
                        onClick={() => setShowProfileMenu(false)}
                      >
                        <Settings className="mr-3 h-4 w-4" />
                        <span>Account Settings</span>
                      </Link>
                      <Link
                        href="/client-bookings"
                        className="flex items-center px-4 py-2 text-slate-700 hover:bg-slate-50 transition-colors"
                        onClick={() => setShowProfileMenu(false)}
                      >
                        <Calendar className="mr-3 h-4 w-4" />
                        <span>My Bookings</span>
                      </Link>
                      <button
                        onClick={() => {
                          setShowProfileMenu(false);
                          logout();
                        }}
                        className="w-full flex items-center px-4 py-2 text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="mr-3 h-4 w-4" />
                        <span>Logout</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link href="/client-login">
                  <Button className="bg-red-600 hover:bg-red-700">
                    <LogIn className="mr-2 h-4 w-4" />
                    Login
                  </Button>
                </Link>
              )}
            </div>
            <button className="md:hidden">
              <Menu className="h-6 w-6 text-slate-600" />
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-red-600 to-red-700 text-white py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-4xl mx-auto"
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Find Your Dream Home Today
            </h1>
            <p className="text-xl md:text-2xl mb-12 text-red-50">
              Discover the perfect property that matches your lifestyle and budget
            </p>

            {/* Search Bar */}
            <div className="bg-white rounded-2xl shadow-2xl p-4 md:p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
                  <Input
                    type="text"
                    placeholder="Search by title or location..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-12 h-14 text-slate-900 text-lg border-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <Button
                  onClick={() => setShowFilterPanel(!showFilterPanel)}
                  className="h-14 px-8 bg-slate-100 text-slate-900 hover:bg-slate-200 font-semibold"
                >
                  <Filter className="mr-2 h-5 w-5" />
                  Filters
                </Button>
                <Button
                  onClick={applyFilters}
                  className="h-14 px-8 bg-red-600 hover:bg-red-700 font-semibold text-lg"
                >
                  Search
                </Button>
              </div>

              {/* Filter Panel */}
              <AnimatePresence>
                {showFilterPanel && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="mt-6 pt-6 border-t border-slate-200"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Property Type</label>
                        <select
                          value={filters.propertyType}
                          onChange={(e) => setFilters({...filters, propertyType: e.target.value})}
                          className="w-full h-10 px-3 rounded-md border border-slate-300 text-slate-900"
                        >
                          <option value="all">All Types</option>
                          {getPropertyTypes().map(type => (
                            <option key={type} value={type}>{type}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Min Bedrooms</label>
                        <select
                          value={filters.bedrooms}
                          onChange={(e) => setFilters({...filters, bedrooms: e.target.value})}
                          className="w-full h-10 px-3 rounded-md border border-slate-300 text-slate-900"
                        >
                          <option value="all">Any</option>
                          <option value="1">1+</option>
                          <option value="2">2+</option>
                          <option value="3">3+</option>
                          <option value="4">4+</option>
                        </select>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Properties Section */}
      <section id="properties" className="py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4">
              Available Properties
            </h2>
            <p className="text-lg text-slate-600">
              {filteredProperties.length} properties found
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-red-600"></div>
            </div>
          ) : filteredProperties.length === 0 ? (
            <div className="text-center py-20">
              <Home className="h-20 w-20 text-slate-300 mx-auto mb-4" />
              <h3 className="text-2xl font-semibold text-slate-600 mb-2">No properties found</h3>
              <p className="text-slate-500">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredProperties.map((property, index) => (
                <motion.div
                  key={property.property_id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className="flex"
                >
                  <Card className="overflow-hidden hover:shadow-2xl transition-all duration-300 cursor-pointer group flex flex-col w-full">
                    <div className="relative h-64 bg-slate-200 overflow-hidden flex-shrink-0">
                      {property.property_photo ? (
                        <img
                          src={property.property_photo}
                          alt={property.property_title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
                          <Home className="h-20 w-20 text-slate-300" />
                        </div>
                      )}
                      <Badge className="absolute top-4 right-4 bg-red-600 text-white">
                        For Sale
                      </Badge>
                    </div>

                    <CardContent className="p-6 flex flex-col flex-grow">
                      <h3 className="text-xl font-bold text-slate-800 mb-2 line-clamp-1">
                        {property.property_title}
                      </h3>

                      <div className="flex items-center text-slate-600 mb-4">
                        <MapPin className="h-4 w-4 mr-1 flex-shrink-0" />
                        <span className="text-sm line-clamp-1">
                          {property.lot_tbl?.lot_number ? `Lot ${property.lot_tbl.lot_number}` : 'Lot not specified'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between mb-4 min-h-[24px]">
                        {getSpecValue(property, 'bedroom') && (
                          <div className="flex items-center text-slate-600">
                            <Bed className="h-4 w-4 mr-1" />
                            <span className="text-sm">{getSpecValue(property, 'bedroom')}</span>
                          </div>
                        )}
                        {getSpecValue(property, 'bath') && (
                          <div className="flex items-center text-slate-600">
                            <Bath className="h-4 w-4 mr-1" />
                            <span className="text-sm">{getSpecValue(property, 'bath')}</span>
                          </div>
                        )}
                        {getSpecValue(property, 'floor') && (
                          <div className="flex items-center text-slate-600">
                            <Maximize className="h-4 w-4 mr-1" />
                            <span className="text-sm">{getSpecValue(property, 'floor')} sqm</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-slate-200 mb-4">
                        <div>
                          <p className="text-sm text-slate-500">Property Type</p>
                          <p className="text-lg font-bold text-red-600 line-clamp-1">
                            {property.property_detail_tbl?.property_name || 'Contact for details'}
                          </p>
                        </div>
                      </div>

                      <div className="mt-auto space-y-2">
                        <div className="flex gap-2">
                          <Button
                            onClick={() => setSelectedProperty(property)}
                            className="flex-1 bg-slate-100 text-slate-900 hover:bg-slate-200"
                          >
                            View Details
                          </Button>
                          <Button
                            onClick={() => {
                              if (!isAuthenticated) {
                                sessionStorage.setItem('redirect_after_login', '/client-home');
                                sessionStorage.setItem('selected_property', JSON.stringify(property));
                                toast.info('Please login to book now');
                                router.push('/client-login');
                              } else {
                                setSelectedProperty(property);
                                setShowAppointmentModal(true);
                              }
                            }}
                            className="flex-1 bg-red-600 hover:bg-red-700"
                          >
                            Book Now
                          </Button>
                        </div>
                        <Button
                          onClick={() => {
                            setSelectedProperty(property);
                            setShowInquiryModal(true);
                            // Reset OTP states
                            setOtpSent(false);
                            setOtpCode('');
                            setOtpVerified(false);
                            setOtpTimer(0);
                            if (isAuthenticated) {
                              const fullName = profile?.full_name || profile?.first_name || user?.email?.split('@')[0] || '';
                              const nameParts = fullName.trim().split(' ');
                              setInquiryForm({
                                firstname: nameParts[0] || '',
                                lastname: nameParts.slice(1).join(' ') || '',
                                email: user?.email || '',
                                phone: profile?.phone || '',
                                message: ''
                              });
                            }
                          }}
                          className="w-full bg-slate-600 hover:bg-slate-700 text-white"
                        >
                          Send Inquiry
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Property Detail Modal */}
      <AnimatePresence>
        {selectedProperty && !showAppointmentModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedProperty(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="relative">
                <button
                  onClick={() => setSelectedProperty(null)}
                  className="absolute top-4 right-4 z-10 bg-white rounded-full p-2 hover:bg-slate-100 transition-colors"
                >
                  <X className="h-6 w-6 text-slate-600" />
                </button>

                {/* Property Image */}
                <div className="relative h-96 bg-slate-200">
                  {selectedProperty.property_photo ? (
                    <img
                      src={selectedProperty.property_photo}
                      alt={selectedProperty.property_title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
                      <Home className="h-32 w-32 text-slate-300" />
                    </div>
                  )}
                </div>

                <div className="p-8">
                  <div className="mb-6">
                    <h2 className="text-3xl font-bold text-slate-800 mb-2">
                      {selectedProperty.property_title}
                    </h2>
                    <div className="flex items-center text-slate-600">
                      <MapPin className="h-5 w-5 mr-2" />
                      <span>{selectedProperty.lot_tbl?.lot_number ? `Lot ${selectedProperty.lot_tbl.lot_number}` : 'Lot not specified'}</span>
                    </div>
                  </div>

                  {/* Display all specifications from property_area */}
                  {selectedProperty.property_detail_tbl?.property_area && selectedProperty.property_detail_tbl.property_area.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                      {selectedProperty.property_detail_tbl.property_area.slice(0, 4).map((spec, index) => (
                        <div key={`spec-top-${spec.name}-${index}`} className="bg-slate-50 p-4 rounded-lg text-center">
                          <p className="text-2xl font-bold text-slate-800">
                            {spec.value}
                          </p>
                          <p className="text-sm text-slate-600">{spec.name}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Property Details */}
                  <div className="mb-8">
                    <h3 className="text-xl font-bold text-slate-800 mb-4">Property Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedProperty.property_detail_tbl?.property_name && (
                        <div className="flex justify-between py-2 border-b border-slate-200">
                          <span className="text-slate-600">Property Type:</span>
                          <span className="font-semibold text-slate-800">
                            {selectedProperty.property_detail_tbl.property_name}
                          </span>
                        </div>
                      )}
                      {selectedProperty.lot_tbl?.lot_number && (
                        <div className="flex justify-between py-2 border-b border-slate-200">
                          <span className="text-slate-600">Lot Number:</span>
                          <span className="font-semibold text-slate-800">
                            {selectedProperty.lot_tbl.lot_number}
                          </span>
                        </div>
                      )}
                      {selectedProperty.property_detail_tbl?.property_area && selectedProperty.property_detail_tbl.property_area.length > 4 && (
                        <div className="col-span-full">
                          <h4 className="font-semibold text-slate-700 mb-3">All Specifications:</h4>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {selectedProperty.property_detail_tbl.property_area.map((spec, idx) => (
                              <div key={`spec-all-${spec.name}-${idx}`} className="flex justify-between py-2 px-3 bg-slate-50 rounded">
                                <span className="text-slate-600 text-sm">{spec.name}:</span>
                                <span className="font-semibold text-slate-800 text-sm">{spec.value}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Amenities */}
                  {selectedProperty.amenities && selectedProperty.amenities.length > 0 && (
                    <div className="mb-8">
                      <h3 className="text-xl font-bold text-slate-800 mb-4">Amenities</h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedProperty.amenities.map((amenity, index) => (
                          <Badge key={`amenity-${amenity}-${index}`} variant="secondary" className="px-3 py-1">
                            {amenity}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Call to Action */}
                  <div className="flex items-center justify-center pt-6 border-t border-slate-200">
                    <Button
                      onClick={() => {
                        if (!isAuthenticated) {
                          sessionStorage.setItem('redirect_after_login', '/client-home');
                          sessionStorage.setItem('selected_property', JSON.stringify(selectedProperty));
                          toast.info('Please login to book a tour');
                          router.push('/client-login');
                        } else {
                          setShowAppointmentModal(true);
                        }
                      }}
                      className="bg-red-600 hover:bg-red-700 px-12 py-6 text-lg w-full md:w-auto"
                    >
                      <Calendar className="mr-2 h-5 w-5" />
                      Schedule a Tour to View This Property
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Appointment Modal */}
      <AnimatePresence>
        {showAppointmentModal && selectedProperty && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowAppointmentModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-3xl font-bold text-slate-800">Schedule a Tour</h2>
                  <button
                    onClick={() => setShowAppointmentModal(false)}
                    className="bg-slate-100 rounded-full p-2 hover:bg-slate-200 transition-colors"
                  >
                    <X className="h-6 w-6 text-slate-600" />
                  </button>
                </div>

                <div className="mb-6 p-4 bg-slate-50 rounded-lg">
                  <p className="text-sm text-slate-600 mb-1">Property:</p>
                  <p className="font-semibold text-slate-800">{selectedProperty.property_title}</p>
                </div>

                <form onSubmit={handleAppointmentSubmit} className="space-y-6">
                  {/* Display user information */}
                  <div className="bg-slate-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-slate-700 mb-3">Your Information</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center">
                        <User className="h-4 w-4 text-slate-500 mr-2" />
                        <span className="text-slate-600">Name:</span>
                        <span className="ml-2 font-medium">{profile?.full_name || user?.email}</span>
                      </div>
                      <div className="flex items-center">
                        <Mail className="h-4 w-4 text-slate-500 mr-2" />
                        <span className="text-slate-600">Email:</span>
                        <span className="ml-2 font-medium">{user?.email}</span>
                      </div>
                      {profile?.phone && (
                        <div className="flex items-center">
                          <Phone className="h-4 w-4 text-slate-500 mr-2" />
                          <span className="text-slate-600">Phone:</span>
                          <span className="ml-2 font-medium">{profile.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Preferred Date *
                      </label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
                        <Input
                          type="date"
                          required
                          value={appointmentForm.date}
                          onChange={(e) => setAppointmentForm({...appointmentForm, date: e.target.value})}
                          className="pl-10"
                          min={new Date().toISOString().split('T')[0]}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Preferred Time *
                      </label>
                      <Input
                        type="time"
                        required
                        value={appointmentForm.time}
                        onChange={(e) => setAppointmentForm({...appointmentForm, time: e.target.value})}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Additional Message
                    </label>
                    <textarea
                      rows={4}
                      value={appointmentForm.message}
                      onChange={(e) => setAppointmentForm({...appointmentForm, message: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      placeholder="Any specific requirements or questions?"
                    />
                  </div>

                  <div className="flex gap-4">
                    <Button
                      type="button"
                      onClick={() => setShowAppointmentModal(false)}
                      className="flex-1 bg-slate-100 text-slate-900 hover:bg-slate-200"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1 bg-red-600 hover:bg-red-700"
                    >
                      Submit Request
                    </Button>
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Inquiry Modal */}
      <AnimatePresence>
        {showInquiryModal && selectedProperty && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => {
              setShowInquiryModal(false);
              setOtpSent(false);
              setOtpCode('');
              setOtpVerified(false);
              setOtpTimer(0);
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-3xl font-bold text-slate-800">Send Inquiry</h2>
                  <button
                    onClick={() => {
                      setShowInquiryModal(false);
                      // Reset OTP states
                      setOtpSent(false);
                      setOtpCode('');
                      setOtpVerified(false);
                      setOtpTimer(0);
                    }}
                    className="bg-slate-100 rounded-full p-2 hover:bg-slate-200 transition-colors"
                  >
                    <X className="h-6 w-6 text-slate-600" />
                  </button>
                </div>

                <div className="mb-6 p-4 bg-slate-50 rounded-lg">
                  <p className="text-sm text-slate-600 mb-1">Property:</p>
                  <p className="font-semibold text-slate-800">{selectedProperty.property_title}</p>
                </div>

                <form onSubmit={handleInquirySubmit} className="space-y-6">
                  {/* Show user information if authenticated */}
                  {isAuthenticated ? (
                    <div className="bg-slate-50 p-4 rounded-lg">
                      <h3 className="font-semibold text-slate-700 mb-3">Your Information</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center">
                          <User className="h-4 w-4 text-slate-500 mr-2" />
                          <span className="text-slate-600">Name:</span>
                          <span className="ml-2 font-medium">{profile?.full_name || user?.email}</span>
                        </div>
                        <div className="flex items-center">
                          <Mail className="h-4 w-4 text-slate-500 mr-2" />
                          <span className="text-slate-600">Email:</span>
                          <span className="ml-2 font-medium">{user?.email}</span>
                        </div>
                        {profile?.phone && (
                          <div className="flex items-center">
                            <Phone className="h-4 w-4 text-slate-500 mr-2" />
                            <span className="text-slate-600">Phone:</span>
                            <span className="ml-2 font-medium">{profile.phone}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    /* Show input fields for non-authenticated users */
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            First Name *
                          </label>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
                            <Input
                              type="text"
                              required
                              value={inquiryForm.firstname}
                              onChange={(e) => setInquiryForm({...inquiryForm, firstname: e.target.value})}
                              className="pl-10"
                              placeholder="John"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Last Name *
                          </label>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
                            <Input
                              type="text"
                              required
                              value={inquiryForm.lastname}
                              onChange={(e) => setInquiryForm({...inquiryForm, lastname: e.target.value})}
                              className="pl-10"
                              placeholder="Doe"
                            />
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Email Address *
                        </label>
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
                            <Input
                              type="email"
                              required
                              value={inquiryForm.email}
                              onChange={(e) => {
                                setInquiryForm({...inquiryForm, email: e.target.value});
                                // Reset OTP states when email changes
                                setOtpSent(false);
                                setOtpVerified(false);
                                setOtpCode('');
                                setOtpTimer(0);
                              }}
                              className="pl-10"
                              placeholder="your.email@example.com"
                              disabled={otpVerified}
                            />
                          </div>
                          <Button
                            type="button"
                            onClick={handleSendOTP}
                            disabled={sendingOtp || otpTimer > 0 || !inquiryForm.email || otpVerified}
                            className={`whitespace-nowrap ${otpVerified ? 'bg-green-600 hover:bg-green-700' : 'bg-slate-600 hover:bg-slate-700'}`}
                          >
                            {sendingOtp ? 'Sending...' : otpVerified ? '✓ Verified' : otpTimer > 0 ? `Resend (${Math.floor(otpTimer / 60)}:${(otpTimer % 60).toString().padStart(2, '0')})` : 'Send OTP'}
                          </Button>
                        </div>
                      </div>

                      {/* OTP Input Field */}
                      {otpSent && !otpVerified && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                          <div className="mb-3">
                            <p className="text-sm font-medium text-slate-700 mb-1">
                              Enter OTP Code
                            </p>
                            <p className="text-xs text-slate-600">
                              We've sent a 6-digit code to your email. Please enter it below.
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Input
                              type="text"
                              maxLength={6}
                              value={otpCode}
                              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                              placeholder="123456"
                              className="flex-1 text-center text-lg font-bold tracking-widest"
                            />
                            <Button
                              type="button"
                              onClick={handleVerifyOTP}
                              disabled={otpCode.length !== 6}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              Verify
                            </Button>
                          </div>
                          {otpTimer > 0 && (
                            <p className="text-xs text-slate-600 mt-2">
                              Code expires in: {Math.floor(otpTimer / 60)}:{(otpTimer % 60).toString().padStart(2, '0')}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Verification Success Message */}
                      {otpVerified && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">
                          <div className="flex-shrink-0 w-6 h-6 bg-green-600 rounded-full flex items-center justify-center">
                            <span className="text-white text-sm">✓</span>
                          </div>
                          <p className="text-sm font-medium text-green-800">
                            Email verified successfully! You can now submit your inquiry.
                          </p>
                        </div>
                      )}

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Phone Number *
                        </label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
                          <Input
                            type="tel"
                            required
                            value={inquiryForm.phone}
                            onChange={(e) => setInquiryForm({...inquiryForm, phone: e.target.value})}
                            className="pl-10"
                            placeholder="+63 XXX XXX XXXX"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Your Message *
                    </label>
                    <textarea
                      rows={5}
                      required
                      value={inquiryForm.message}
                      onChange={(e) => setInquiryForm({...inquiryForm, message: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                      placeholder="Please tell us about your inquiry, questions, or specific requirements..."
                    />
                  </div>

                  <div className="flex gap-4">
                    <Button
                      type="button"
                      onClick={() => {
                        setShowInquiryModal(false);
                        // Reset OTP states on cancel
                        setOtpSent(false);
                        setOtpCode('');
                        setOtpVerified(false);
                        setOtpTimer(0);
                      }}
                      className="flex-1 bg-slate-100 text-slate-900 hover:bg-slate-200"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={!isAuthenticated && !otpVerified}
                      className="flex-1 bg-slate-600 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Send Inquiry
                    </Button>
                  </div>

                  {/* Warning for non-authenticated users */}
                  {!isAuthenticated && !otpVerified && (
                    <p className="text-xs text-amber-600 text-center -mt-2">
                      Please verify your email with OTP to submit inquiry
                    </p>
                  )}
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Building2 className="h-8 w-8 text-red-600" />
                <span className="text-2xl font-bold">Futura Homes</span>
              </div>
              <p className="text-slate-400">
                Your trusted partner in finding the perfect home
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-slate-400 hover:text-white transition-colors">About Us</a></li>
                <li><a href="#properties" className="text-slate-400 hover:text-white transition-colors">Properties</a></li>
                <li><a href="#" className="text-slate-400 hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Contact Us</h3>
              <ul className="space-y-2 text-slate-400">
                <li className="flex items-center">
                  <Phone className="h-4 w-4 mr-2" />
                  +63 XXX XXX XXXX
                </li>
                <li className="flex items-center">
                  <Mail className="h-4 w-4 mr-2" />
                  info@futurahomes.com
                </li>
                <li className="flex items-center">
                  <MapPin className="h-4 w-4 mr-2" />
                  Philippines
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-slate-800 text-center text-slate-400">
            <p>&copy; 2025 Futura Homes. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
