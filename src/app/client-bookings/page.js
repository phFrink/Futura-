'use client';

import React, { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Calendar, Clock, MapPin, Home, ArrowLeft, Building2, CheckCircle,
  XCircle, AlertCircle, Loader2, MessageSquare, User, Mail, Phone
} from "lucide-react";
import { motion } from "framer-motion";
import { useClientAuth } from '@/contexts/ClientAuthContext';
import { toast } from 'react-toastify';

export default function ClientBookingsPage() {
  const router = useRouter();
  const { user, profile, isAuthenticated } = useClientAuth();
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    if (!isAuthenticated) {
      toast.error('Please login to view your bookings');
      router.push('/client-login');
      return;
    }
    loadBookings();
  }, [isAuthenticated, user]);

  const loadBookings = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/book-tour?userId=${user.id}`);
      const result = await response.json();

      if (result.success) {
        setBookings(result.data);
      } else {
        toast.error(result.message || 'Failed to load bookings');
      }
    } catch (error) {
      console.error('Error loading bookings:', error);
      toast.error('Error loading bookings');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: {
        icon: <AlertCircle className="w-4 h-4" />,
        text: 'Pending',
        bgColor: 'bg-yellow-50',
        textColor: 'text-yellow-700',
        borderColor: 'border-yellow-200',
      },
      cs_approved: {
        icon: <CheckCircle className="w-4 h-4" />,
        text: 'CS Approved',
        bgColor: 'bg-blue-50',
        textColor: 'text-blue-700',
        borderColor: 'border-blue-200',
      },
      sales_approved: {
        icon: <CheckCircle className="w-4 h-4" />,
        text: 'Fully Approved',
        bgColor: 'bg-green-50',
        textColor: 'text-green-700',
        borderColor: 'border-green-200',
      },
      confirmed: {
        icon: <CheckCircle className="w-4 h-4" />,
        text: 'Confirmed',
        bgColor: 'bg-green-50',
        textColor: 'text-green-700',
        borderColor: 'border-green-200',
      },
      rejected: {
        icon: <XCircle className="w-4 h-4" />,
        text: 'Rejected',
        bgColor: 'bg-red-50',
        textColor: 'text-red-700',
        borderColor: 'border-red-200',
      },
      cancelled: {
        icon: <XCircle className="w-4 h-4" />,
        text: 'Cancelled',
        bgColor: 'bg-gray-50',
        textColor: 'text-gray-700',
        borderColor: 'border-gray-200',
      },
      completed: {
        icon: <CheckCircle className="w-4 h-4" />,
        text: 'Completed',
        bgColor: 'bg-slate-50',
        textColor: 'text-slate-700',
        borderColor: 'border-slate-200',
      },
      no_show: {
        icon: <XCircle className="w-4 h-4" />,
        text: 'No Show',
        bgColor: 'bg-orange-50',
        textColor: 'text-orange-700',
        borderColor: 'border-orange-200',
      },
    };

    const config = statusConfig[status] || statusConfig.pending;

    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border ${config.bgColor} ${config.textColor} ${config.borderColor}`}>
        {config.icon}
        <span className="text-sm font-medium">{config.text}</span>
      </div>
    );
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (timeString) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading your bookings...</p>
        </div>
      </div>
    );
  }

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
            <Button
              onClick={() => router.push('/client-home')}
              variant="outline"
              className="border-slate-300 text-slate-600 hover:bg-slate-50"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2 flex items-center gap-3">
            <Calendar className="w-8 h-8 md:w-10 md:h-10 text-red-600" />
            My Tour Bookings
          </h1>
          <p className="text-base md:text-lg text-slate-600">
            View and manage your property tour appointments
          </p>
        </motion.div>

        {/* Bookings List */}
        {bookings.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <Calendar className="w-24 h-24 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-700 mb-2">
              No bookings yet
            </h3>
            <p className="text-slate-500 mb-6">
              You haven't made any property tour bookings
            </p>
            <Button
              onClick={() => router.push('/client-home')}
              className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white"
            >
              <Home className="mr-2 h-4 w-4" />
              Browse Properties
            </Button>
          </motion.div>
        ) : (
          <div className="grid gap-6">
            {bookings.map((booking, index) => (
              <motion.div
                key={booking.appointment_id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="bg-white border border-slate-200 shadow-lg hover:shadow-xl transition-shadow overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row gap-6">
                      {/* Property Info */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="text-xl font-bold text-slate-900 mb-2 flex items-center gap-2">
                              <Home className="w-5 h-5 text-red-600" />
                              {booking.property_title || 'Property Tour'}
                            </h3>
                            {getStatusBadge(booking.status)}
                          </div>
                        </div>

                        {/* Appointment Details */}
                        <div className="space-y-3">
                          <div className="flex items-center gap-3 text-slate-700">
                            <Calendar className="w-5 h-5 text-red-600 flex-shrink-0" />
                            <span className="font-medium">{formatDate(booking.appointment_date)}</span>
                          </div>
                          <div className="flex items-center gap-3 text-slate-700">
                            <Clock className="w-5 h-5 text-red-600 flex-shrink-0" />
                            <span className="font-medium">{formatTime(booking.appointment_time)}</span>
                          </div>
                          {booking.message && (
                            <div className="flex items-start gap-3 text-slate-700">
                              <MessageSquare className="w-5 h-5 text-red-600 flex-shrink-0 mt-1" />
                              <p className="text-sm">{booking.message}</p>
                            </div>
                          )}
                        </div>

                        {/* Approval Status Details */}
                        {(booking.status === 'cs_approved' || booking.status === 'sales_approved') && (
                          <div className="mt-4 pt-4 border-t border-slate-200">
                            <h4 className="text-sm font-semibold text-slate-700 mb-2">Approval Progress:</h4>
                            <div className="space-y-2">
                              {booking.cs_approved_at && (
                                <div className="flex items-center gap-2 text-sm text-slate-600">
                                  <CheckCircle className="w-4 h-4 text-green-600" />
                                  <span>Customer Service approved on {new Date(booking.cs_approved_at).toLocaleDateString()}</span>
                                </div>
                              )}
                              {booking.sales_approved_at && (
                                <div className="flex items-center gap-2 text-sm text-slate-600">
                                  <CheckCircle className="w-4 h-4 text-green-600" />
                                  <span>Sales Representative approved on {new Date(booking.sales_approved_at).toLocaleDateString()}</span>
                                </div>
                              )}
                              {booking.status === 'cs_approved' && !booking.sales_approved_at && (
                                <div className="flex items-center gap-2 text-sm text-blue-600">
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                  <span>Awaiting Sales Representative approval...</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Rejection Details */}
                        {booking.status === 'rejected' && booking.rejection_reason && (
                          <div className="mt-4 pt-4 border-t border-slate-200">
                            <h4 className="text-sm font-semibold text-red-700 mb-1">Rejection Reason:</h4>
                            <p className="text-sm text-slate-600">{booking.rejection_reason}</p>
                          </div>
                        )}
                      </div>

                      {/* Client Info & Actions */}
                      <div className="lg:w-64 space-y-4">
                        <div className="bg-slate-50 rounded-lg p-4 space-y-2">
                          <h4 className="text-sm font-semibold text-slate-700 mb-3">Contact Information</h4>
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <User className="w-4 h-4 text-slate-400" />
                            <span>{booking.client_name}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <Mail className="w-4 h-4 text-slate-400" />
                            <span className="truncate">{booking.client_email}</span>
                          </div>
                          {booking.client_phone && (
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                              <Phone className="w-4 h-4 text-slate-400" />
                              <span>{booking.client_phone}</span>
                            </div>
                          )}
                        </div>

                        <div className="text-xs text-slate-500">
                          Booked on {new Date(booking.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
