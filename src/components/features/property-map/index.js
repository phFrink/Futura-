'use client'
import React, { useState, useEffect } from 'react';

import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Home, Bed, Bath, Maximize, User, Phone, Mail, Search, MapPin } from 'lucide-react';
import { Homeowner, Property } from '@/lib/data';

export default function PropertyMap() {
  const [properties, setProperties] = useState([]);
  const [homeowners, setHomeowners] = useState([]);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [propertiesData, homeownersData] = await Promise.all([
        Property,
        Homeowner
      ]);
      setProperties(propertiesData);
      setHomeowners(homeownersData);
    } catch (error) {
      console.error("Failed to load data", error);
    } finally {
      setLoading(false);
    }
  };

  const getHomeownerForProperty = (propertyId) => {
    return homeowners.find(h => h.property_id === propertyId);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'occupied': return 'bg-green-500';
      case 'vacant': return 'bg-red-500';
      case 'for_sale': return 'bg-blue-500';
      case 'under_construction': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'occupied': return 'bg-green-100 text-green-800 border-green-200';
      case 'vacant': return 'bg-red-100 text-red-800 border-red-200';
      case 'for_sale': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'under_construction': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Create a grid layout for Camella Koronadal blocks
  const createPropertyBlocks = () => {
    const filteredProperties = properties.filter(property => 
      property.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.unit_number.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Group properties by blocks (assuming unit numbers have block prefixes)
    const blocks = {};
    filteredProperties.forEach(property => {
      const blockLetter = property.unit_number ? property.unit_number.charAt(0).toUpperCase() : 'A';
      if (!blocks[blockLetter]) {
        blocks[blockLetter] = [];
      }
      blocks[blockLetter].push(property);
    });

    return Object.entries(blocks).map(([blockLetter, blockProperties]) => (
      <motion.div
        key={blockLetter}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="mb-8"
      >
        <h3 className="text-2xl font-bold text-slate-800 mb-4 flex items-center gap-2">
          <MapPin className="w-6 h-6 text-blue-600" />
          Block {blockLetter}
        </h3>
        <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-2">
          {blockProperties.map((property) => {
            const homeowner = getHomeownerForProperty(property.id);
            return (
              <motion.div
                key={property.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`relative cursor-pointer rounded-lg p-3 border-2 transition-all duration-300 hover:shadow-lg ${
                  selectedProperty?.id === property.id 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-slate-200 bg-white hover:border-blue-300'
                }`}
                onClick={() => setSelectedProperty(property)}
              >
                {/* Status indicator dot */}
                <div className={`absolute top-1 right-1 w-3 h-3 rounded-full ${getStatusColor(property.status)}`}></div>
                
                {/* House icon */}
                <div className="flex flex-col items-center">
                  <Home className={`w-8 h-8 mb-1 ${property.status === 'occupied' ? 'text-green-600' : 'text-slate-400'}`} />
                  <span className="text-xs font-semibold text-slate-700">{property.unit_number || 'N/A'}</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    ));
  };

  return (
    <div className="min-h-screen p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Camella Homes Koronadal Map</h1>
          <p className="text-lg text-slate-600">Interactive property layout with detailed house information</p>
        </motion.div>

        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/80 backdrop-blur-sm border border-slate-200 rounded-2xl p-6 shadow-lg"
        >
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input
              placeholder="Search by unit number or property name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 border-slate-200 focus:border-blue-400"
            />
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Map Area */}
          <div className="lg:col-span-2">
            <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Home className="w-5 h-5 text-blue-600" />
                  Property Layout
                </CardTitle>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span>Occupied</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <span>Vacant</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <span>For Sale</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                    <span>Under Construction</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="max-h-[600px] overflow-y-auto">
                {loading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-slate-500 mt-4">Loading properties...</p>
                  </div>
                ) : properties.length === 0 ? (
                  <div className="text-center py-12">
                    <Home className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-slate-700 mb-2">No Properties Found</h3>
                    <p className="text-slate-500">No properties available to display on the map</p>
                  </div>
                ) : (
                  createPropertyBlocks()
                )}
              </CardContent>
            </Card>
          </div>

          {/* Property Details Panel */}
          <div className="lg:col-span-1">
            <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg sticky top-6">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-slate-900">Property Details</CardTitle>
              </CardHeader>
              <CardContent>
                {selectedProperty ? (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                  >
                    {/* Property Header */}
                    <div className="text-center">
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Home className="w-8 h-8 text-blue-700" />
                      </div>
                      <h3 className="text-2xl font-bold text-slate-900 mb-2">{selectedProperty.name}</h3>
                      <Badge className={`${getStatusBadgeColor(selectedProperty.status)} border font-medium`}>
                        {selectedProperty.status}
                      </Badge>
                    </div>

                    {/* Property Info */}
                    <div className="bg-slate-50 rounded-xl p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-600">Unit Number</span>
                        <span className="font-bold text-slate-900">{selectedProperty.unit_number || 'N/A'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-600">Property Type</span>
                        <span className="capitalize text-slate-900">{selectedProperty.property_type}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-600">Address</span>
                        <span className="text-sm text-slate-900 text-right">{selectedProperty.address}</span>
                      </div>
                    </div>

                    {/* Property Specifications */}
                    {(selectedProperty.bedrooms || selectedProperty.bathrooms || selectedProperty.floor_area) && (
                      <div className="bg-slate-50 rounded-xl p-4">
                        <h4 className="font-semibold text-slate-900 mb-3">Specifications</h4>
                        <div className="grid grid-cols-3 gap-3">
                          {selectedProperty.bedrooms && (
                            <div className="text-center">
                              <Bed className="w-5 h-5 text-slate-600 mx-auto mb-1" />
                              <p className="text-sm text-slate-600">Bedrooms</p>
                              <p className="font-bold text-slate-900">{selectedProperty.bedrooms}</p>
                            </div>
                          )}
                          {selectedProperty.bathrooms && (
                            <div className="text-center">
                              <Bath className="w-5 h-5 text-slate-600 mx-auto mb-1" />
                              <p className="text-sm text-slate-600">Bathrooms</p>
                              <p className="font-bold text-slate-900">{selectedProperty.bathrooms}</p>
                            </div>
                          )}
                          {selectedProperty.floor_area && (
                            <div className="text-center">
                              <Maximize className="w-5 h-5 text-slate-600 mx-auto mb-1" />
                              <p className="text-sm text-slate-600">Floor Area</p>
                              <p className="font-bold text-slate-900">{selectedProperty.floor_area}m²</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Homeowner Information */}
                    {(() => {
                      const homeowner = getHomeownerForProperty(selectedProperty.id);
                      return homeowner ? (
                        <div className="bg-blue-50 rounded-xl p-4">
                          <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                            <User className="w-4 h-4" />
                            Homeowner Information
                          </h4>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-blue-600" />
                              <span className="text-sm font-medium text-blue-900">{homeowner.full_name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Mail className="w-4 h-4 text-blue-600" />
                              <span className="text-sm text-blue-800">{homeowner.email}</span>
                            </div>
                            {homeowner.phone && (
                              <div className="flex items-center gap-2">
                                <Phone className="w-4 h-4 text-blue-600" />
                                <span className="text-sm text-blue-800">{homeowner.phone}</span>
                              </div>
                            )}
                            {homeowner.monthly_dues && (
                              <div className="pt-2 border-t border-blue-200">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-medium text-blue-700">Monthly Dues</span>
                                  <span className="font-bold text-blue-900">₱{homeowner.monthly_dues.toLocaleString()}</span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        selectedProperty.status === 'vacant' && (
                          <div className="bg-red-50 rounded-xl p-4 text-center">
                            <h4 className="font-semibold text-red-900 mb-2">Property Available</h4>
                            <p className="text-sm text-red-700">This unit is currently vacant and available for occupancy.</p>
                          </div>
                        )
                      );
                    })()}

                    {/* Amenities */}
                    {selectedProperty.amenities && selectedProperty.amenities.length > 0 && (
                      <div className="bg-slate-50 rounded-xl p-4">
                        <h4 className="font-semibold text-slate-900 mb-3">Amenities</h4>
                        <div className="flex flex-wrap gap-1">
                          {selectedProperty.amenities.map((amenity, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {amenity}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                ) : (
                  <div className="text-center py-12">
                    <Home className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-slate-700 mb-2">Select a Property</h3>
                    <p className="text-slate-500">Click on any house in the map to view detailed information</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}