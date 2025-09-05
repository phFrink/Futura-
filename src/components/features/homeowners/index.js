'use client';


import  { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Plus, Search, Mail, Phone, Calendar, Home, User } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { Homeowner, Property } from "../../../lib/data";

export default function Homeowners() {
  const [homeowners, setHomeowners] = useState([]);
  const [properties, setProperties] = useState([]);
  const [filteredHomeowners, setFilteredHomeowners] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterHomeowners();
  }, [homeowners, searchTerm]);

  const loadData = async () => {
    try {
      const [homeownersData, propertiesData] = await Promise.all([
        Homeowner,
        Property
      ]);
      setHomeowners(homeownersData);
      setProperties(propertiesData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterHomeowners = () => {
    let filtered = homeowners;

    if (searchTerm) {
      filtered = filtered.filter(homeowner => 
        homeowner.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        homeowner.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        homeowner.unit_number.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredHomeowners(filtered);
  };

  const getPropertyName = (propertyId) => {
    const property = properties.find(p => p.id === propertyId);
    return property ? property.name : 'Unknown Property';
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
            <p className="text-lg text-slate-600">Manage Futura Homes residents</p>
          </div>
          <Button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg">
            <Plus className="w-5 h-5 mr-2" />
            Add Homeowner
          </Button>
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/80 backdrop-blur-sm border border-slate-200 rounded-2xl p-6 shadow-lg"
        >
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input
              placeholder="Search homeowners..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 border-slate-200 focus:border-blue-400"
            />
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
              <p className="text-slate-600">Try adjusting your search</p>
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
                            Unit {homeowner.unit_number} - {getPropertyName(homeowner.property_id)}
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
    </div>
  );
}