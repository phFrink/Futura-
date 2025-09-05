'use client';

import React, { useState, useEffect } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, MapPin, Bed, Bath, Maximize, Grid, List } from "lucide-react";
import { motion } from "framer-motion";
import { Property } from "@/lib/data";

export default function Properties() {
  const [properties, setProperties] = useState([]);
  const [filteredProperties, setFilteredProperties] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [viewMode, setViewMode] = useState("grid");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProperties();
  }, []);

  useEffect(() => {
    filterProperties();
  }, [properties, searchTerm, statusFilter, typeFilter]);

  const loadProperties = async () => {
    try {
      const data = await Property;
      setProperties(data);
    } catch (error) {
      console.error('Error loading properties:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterProperties = () => {
    let filtered = properties;

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
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'occupied': return 'bg-green-100 text-green-800 border-green-200';
      case 'vacant': return 'bg-red-100 text-red-800 border-red-200';
      case 'for_sale': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'under_construction': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
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
    <div className="min-h-screen p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
        >
          <div>
            <h1 className="text-4xl font-bold text-slate-900 mb-2">Properties</h1>
            <p className="text-lg text-slate-600">Manage Camella Homes Koronadal properties</p>
          </div>
          <Button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg">
            <Plus className="w-5 h-5 mr-2" />
            Add Property
          </Button>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/80 backdrop-blur-sm border border-slate-200 rounded-2xl p-6 shadow-lg"
        >
          <div className="flex flex-col md:flex-row gap-4 items-center">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                placeholder="Search properties..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-slate-200 focus:border-blue-400"
              />
            </div>

            {/* Filters */}
            <div className="flex gap-3 items-center">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
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
                <SelectTrigger className="w-40">
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
              <div className="flex border border-slate-200 rounded-lg">
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
                <div key={i} className="h-96 bg-slate-200 animate-pulse rounded-2xl" />
              ))}
            </div>
          ) : filteredProperties.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Search className="w-12 h-12 text-slate-400" />
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
                        <Badge className={`${getStatusColor(property.status)} border font-medium`}>
                          {property.status}
                        </Badge>
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
                        <Badge variant="outline" className="text-xs capitalize">
                          {property.property_type}
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
                              <Badge key={idx} variant="outline" className="text-xs">
                                {amenity}
                              </Badge>
                            ))}
                            {property.amenities.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{property.amenities.length - 3} more
                              </Badge>
                            )}
                          </div>
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