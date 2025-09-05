'use client';

import  { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, AlertCircle, Clock, CheckCircle, XCircle, Wrench, Building2, User, Calendar } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { Homeowner, Property, ServiceRequest } from "../../../lib/data";
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

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterRequests();
  }, [requests, searchTerm, statusFilter, priorityFilter]);

  const loadData = async () => {
    try {
      const [requestsData, propertiesData, homeownersData] = await Promise.all([
        ServiceRequest,
        Property,
        Homeowner
      ]);
      setRequests(requestsData);
      setProperties(propertiesData);
      setHomeowners(homeownersData);
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
        request.description.toLowerCase().includes(searchTerm.toLowerCase())
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

 

  return (
    <div className="min-h-screen p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 mb-2">Service Requests</h1>
            <p className="text-lg text-slate-600">Track and manage homeowner requests</p>
          </div>
          <Button className="bg-gradient-to-r from-slate-800 to-slate-900 text-white shadow-lg">
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
                          <div className="flex items-center gap-2 text-slate-600 text-sm"><User className="w-4 h-4" /><span>{getHomeownerName(request.homeowner_id)}</span></div>
                          <div className="flex items-center gap-2 text-slate-600 text-sm"><Building2 className="w-4 h-4" /><span>{getPropertyName(request.property_id)}</span></div>
                          {request.scheduled_date && <div className="flex items-center gap-2 text-slate-600 text-sm"><Calendar className="w-4 h-4" /><span>Scheduled: {format(new Date(request.scheduled_date), "MMM d, yyyy")}</span></div>}
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
    </div>
  );
}
