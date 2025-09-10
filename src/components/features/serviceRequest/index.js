'use client';

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Plus, Search, AlertCircle, Clock, CheckCircle, XCircle, Wrench, Building2, User, Calendar, X } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { formattedDate } from "@/lib/utils";

export default function ServiceRequests() {
  const [requests, setRequests] = useState([]);
  const [properties, setProperties] = useState([]);
  const [homeowners, setHomeowners] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const supabase = createClientComponentClient();

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    request_type: "",
    priority: "medium",
    status: "pending",
    homeowner_id: "",
    property_id: "",
    scheduled_date: ""
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterRequests();
  }, [requests, searchTerm, statusFilter, priorityFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load service requests with related data
      const { data: requestsData, error: requestsError } = await supabase
        .from('request_tbl')
        .select(`
          *,
          homeowner:homeowner_id(id, full_name),
          property:property_id(id, name)
        `)
        .order('created_date', { ascending: false });

      if (requestsError) throw requestsError;

      // Load properties for form dropdown
      const { data: propertiesData, error: propertiesError } = await supabase
        .from('property_tbl')
        .select('id, name')
        .order('name');

      if (propertiesError) throw propertiesError;

      // Load homeowners for form dropdown
      const { data: homeownersData, error: homeownersError } = await supabase
        .from('homeowner_tbl')
        .select('id, full_name')
        .order('full_name');

      if (homeownersError) throw homeownersError;

      setRequests(requestsData || []);
      setProperties(propertiesData || []);
      setHomeowners(homeownersData || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterRequests = () => {
    let filtered = requests;

    if (searchTerm) {
      filtered = filtered.filter(request => 
        request.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (request.homeowner?.full_name && request.homeowner.full_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (request.property?.name && request.property.name.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(request => request.status === statusFilter);
    }

    if (priorityFilter !== "all") {
      filtered = filtered.filter(request => request.priority === priorityFilter);
    }

    setFilteredRequests(filtered);
  };

  const getPropertyName = (propertyId) => {
    const property = properties.find(p => p.id === propertyId);
    return property ? property.name : 'N/A';
  };

  const getHomeownerName = (homeownerId) => {
    const homeowner = homeowners.find(h => h.id === homeownerId);
    return homeowner ? homeowner.full_name : 'N/A';
  };

  const getStatusProps = (status) => {
    switch (status) {
      case 'pending': return { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: Clock };
      case 'in_progress': return { color: 'bg-blue-100 text-blue-800 border-blue-200', icon: AlertCircle };
      case 'completed': return { color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle };
      case 'cancelled': return { color: 'bg-gray-100 text-gray-800 border-gray-200', icon: XCircle };
      case 'on_hold': return { color: 'bg-orange-100 text-orange-800 border-orange-200', icon: Clock };
      default: return { color: 'bg-gray-100 text-gray-800 border-gray-200', icon: Clock };
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      request_type: "",
      priority: "medium",
      status: "pending",
      homeowner_id: "",
      property_id: "",
      scheduled_date: ""
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const submitData = {
        ...formData,
        created_date: new Date().toISOString(),
        scheduled_date: formData.scheduled_date || null
      };

      const { data, error } = await supabase
        .from('request_tbl')
        .insert([submitData])
        .select(`
          *,
          homeowner:homeowner_id(id, full_name),
          property:property_id(id, name)
        `);

      if (error) throw error;

      // Add new request to the list
      setRequests(prev => [data[0], ...prev]);
      
      // Close modal and reset form
      setIsModalOpen(false);
      resetForm();
      
      console.log('Service request created successfully');
    } catch (error) {
      console.error('Error creating service request:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const openModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 mb-2">Service Requests</h1>
            <p className="text-lg text-slate-600">Track and manage homeowner requests</p>
          </div>
          <Button 
            onClick={openModal}
            className="bg-gradient-to-r from-slate-800 to-slate-900 text-white shadow-lg hover:from-slate-900 hover:to-black transition-all duration-300"
          >
            <Plus className="w-5 h-5 mr-2" /> New Request
          </Button>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white/80 backdrop-blur-sm border border-slate-200 rounded-2xl p-6 shadow-lg">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input placeholder="Search requests..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10"/>
            </div>
            <div className="flex gap-3">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40"><SelectValue placeholder="All Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="on_hold">On Hold</SelectItem>
                </SelectContent>
              </Select>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-40"><SelectValue placeholder="All Priority" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Array(4).fill(0).map((_, i) => <div key={i} className="h-72 bg-slate-200 animate-pulse rounded-2xl" />)}
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6"><Wrench className="w-12 h-12 text-slate-400" /></div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">No Service Requests</h3>
              <p className="text-slate-600">All caught up! No requests match your filters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredRequests.map((request, index) => {
                const { color, icon: StatusIcon } = getStatusProps(request.status);
                return (
                  <motion.div key={request.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
                    <Card className="group overflow-hidden bg-white/80 backdrop-blur-sm border-slate-200 hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-500 hover:-translate-y-1">
                      <CardHeader className="pb-4">
                        <div className="flex items-start justify-between">
                          <CardTitle className="text-lg text-slate-900 line-clamp-2 pr-4">{request.title}</CardTitle>
                          <Badge className={`${color} border font-medium`}><StatusIcon className="w-3 h-3 mr-1" />{request.status}</Badge>
                        </div>
                        <div className="flex items-center gap-2">
                           <Badge variant="outline" className="capitalize">{request.request_type}</Badge>
                           <Badge className={`${getPriorityColor(request.priority)} border capitalize`}>{request.priority} priority</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <p className="text-slate-700 text-sm line-clamp-2">{request.description}</p>
                        <div className="bg-slate-50 rounded-xl p-4 space-y-3">
                          <div className="flex items-center gap-2 text-slate-600 text-sm">
                            <User className="w-4 h-4" />
                            <span>{request.homeowner?.full_name || getHomeownerName(request.homeowner_id)}</span>
                          </div>
                          <div className="flex items-center gap-2 text-slate-600 text-sm">
                            <Building2 className="w-4 h-4" />
                            <span>{request.property?.name || getPropertyName(request.property_id)}</span>
                          </div>
                          {request.scheduled_date && (
                            <div className="flex items-center gap-2 text-slate-600 text-sm">
                              <Calendar className="w-4 h-4" />
                              <span>Scheduled: {format(new Date(request.scheduled_date), "MMM d, yyyy")}</span>
                            </div>
                          )}
                        </div>
                        <div className="text-xs text-slate-500 pt-3 border-t border-slate-200">
                          Requested on {formattedDate(new Date(request.created_date), "MMM d, yyyy, p")}
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

      {/* Modern Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="sticky top-0 bg-white border-b border-slate-200 px-8 py-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">New Service Request</h2>
                  <p className="text-slate-600 mt-1">Create a new maintenance request</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-full hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <Label htmlFor="title" className="text-sm font-semibold text-slate-900">Request Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="e.g., Leaky faucet in kitchen"
                    className="mt-2"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="request_type" className="text-sm font-semibold text-slate-900">Request Type *</Label>
                  <Select value={formData.request_type} onValueChange={(value) => handleInputChange('request_type', value)}>
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Select request type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="plumbing">Plumbing</SelectItem>
                      <SelectItem value="electrical">Electrical</SelectItem>
                      <SelectItem value="hvac">HVAC</SelectItem>
                      <SelectItem value="appliance">Appliance</SelectItem>
                      <SelectItem value="general_maintenance">General Maintenance</SelectItem>
                      <SelectItem value="landscaping">Landscaping</SelectItem>
                      <SelectItem value="security">Security</SelectItem>
                      <SelectItem value="cleaning">Cleaning</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="priority" className="text-sm font-semibold text-slate-900">Priority</Label>
                  <Select value={formData.priority} onValueChange={(value) => handleInputChange('priority', value)}>
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low Priority</SelectItem>
                      <SelectItem value="medium">Medium Priority</SelectItem>
                      <SelectItem value="high">High Priority</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="homeowner" className="text-sm font-semibold text-slate-900">Homeowner *</Label>
                  <Select value={formData.homeowner_id} onValueChange={(value) => handleInputChange('homeowner_id', value)}>
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Select homeowner" />
                    </SelectTrigger>
                    <SelectContent>
                      {homeowners.map((homeowner) => (
                        <SelectItem key={homeowner.id} value={homeowner.id}>
                          {homeowner.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="property" className="text-sm font-semibold text-slate-900">Property *</Label>
                  <Select value={formData.property_id} onValueChange={(value) => handleInputChange('property_id', value)}>
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Select property" />
                    </SelectTrigger>
                    <SelectContent>
                      {properties.map((property) => (
                        <SelectItem key={property.id} value={property.id}>
                          {property.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="scheduled_date" className="text-sm font-semibold text-slate-900">Scheduled Date</Label>
                  <Input
                    id="scheduled_date"
                    type="date"
                    value={formData.scheduled_date}
                    onChange={(e) => handleInputChange('scheduled_date', e.target.value)}
                    className="mt-2"
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="description" className="text-sm font-semibold text-slate-900">Description *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Provide detailed description of the issue..."
                    rows={4}
                    className="mt-2 resize-none"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-4 pt-6 border-t border-slate-200">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitting || !formData.title || !formData.description || !formData.request_type || !formData.homeowner_id || !formData.property_id}
                  className="bg-gradient-to-r from-slate-800 to-slate-900 text-white px-8 hover:from-slate-900 hover:to-black"
                >
                  {submitting ? 'Creating...' : 'Create Request'}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}