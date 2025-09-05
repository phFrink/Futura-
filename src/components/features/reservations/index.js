'use client';

import  { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Calendar, Clock, CheckCircle, XCircle, Users, Home, Building } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { Homeowner, Reservation } from "@/lib/data";

export default function Reservations() {
  const [reservations, setReservations] = useState([]);
  const [homeowners, setHomeowners] = useState([]);
  const [filteredReservations, setFilteredReservations] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [facilityFilter, setFacilityFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterReservations();
  }, [reservations, statusFilter, facilityFilter]);

  const loadData = async () => {
    try {
      const [reservationData, homeownerData] = await Promise.all([
        Reservation,
        Homeowner
      ]);
      setReservations(reservationData);
      setHomeowners(homeownerData);
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
  
  const getHomeownerName = (id) => homeowners.find(h => h.id === id)?.full_name || 'N/A';
  
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
  }

  return (
    <div className="min-h-screen p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 mb-2">Reservations</h1>
            <p className="text-lg text-slate-600">Manage facility bookings and events</p>
          </div>
          <Button className="bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg">
            <Plus className="w-5 h-5 mr-2" /> New Reservation
          </Button>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white/80 backdrop-blur-sm border border-slate-200 rounded-2xl p-6 shadow-lg">
          <div className="flex flex-col md:flex-row gap-4 items-center">
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
          {loading ? ( <div className="text-center py-12">Loading reservations...</div> ) 
          : filteredReservations.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6"><Calendar className="w-12 h-12 text-slate-400" /></div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">No Reservations Found</h3>
              <p className="text-slate-600">No reservations match your filters.</p>
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
                               <div className="p-3 bg-slate-100 rounded-lg">{getFacilityIcon(reservation.facility_name)}</div>
                               <div>
                                  <CardTitle className="text-lg text-slate-900 capitalize">{reservation.facility_name.replace('_', ' ')}</CardTitle>
                                  <p className="text-sm text-slate-600">{reservation.purpose}</p>
                               </div>
                            </div>
                           <Badge className={`${color} border capitalize`}>{reservation.status}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="text-sm space-y-2 bg-slate-50 rounded-lg p-3">
                          <div className="flex items-center gap-2"><Users className="w-4 h-4"/><span>Booked by: {getHomeownerName(reservation.homeowner_id)}</span></div>
                          <div className="flex items-center gap-2"><Calendar className="w-4 h-4"/><span>{format(new Date(reservation.reservation_date), 'EEE, MMM d, yyyy')}</span></div>
                          <div className="flex items-center gap-2"><Clock className="w-4 h-4"/><span>{reservation.start_time} - {reservation.end_time}</span></div>
                        </div>
                        {reservation.fee > 0 && 
                          <div className="flex justify-between items-center pt-2 border-t">
                            <span className="text-sm font-medium">Reservation Fee</span>
                            <span className="text-md font-bold">₱{reservation.fee.toLocaleString()}</span>
                          </div>
                        }
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
