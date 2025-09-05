'use client';
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, AlertTriangle, Building2, User } from "lucide-react";
import { motion } from "framer-motion";
import { Complaint, Homeowner, Property } from "../../../lib/data";
import { formattedDate } from "@/lib/utils";


export default function Complaints() {
  const [complaints, setComplaints] = useState([]);
  const [properties, setProperties] = useState([]);
  const [homeowners, setHomeowners] = useState([]);
  const [filteredComplaints, setFilteredComplaints] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterComplaints();
  }, [complaints, searchTerm, statusFilter, severityFilter]);

  const loadData = async () => {
    try {
      const [complaintsData, propertiesData, homeownersData] = await Promise.all([
        Complaint,
        Property,
        Homeowner
      ]);
      setComplaints(complaintsData);
      setProperties(propertiesData);
      setHomeowners(homeownersData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterComplaints = () => {
    let filtered = complaints;

    if (searchTerm) {
      filtered = filtered.filter(c => c.subject.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    if (statusFilter !== "all") {
      filtered = filtered.filter(c => c.status === statusFilter);
    }
    if (severityFilter !== "all") {
      filtered = filtered.filter(c => c.severity === severityFilter);
    }
    setFilteredComplaints(filtered);
  };

  const getPropertyName = (id) => properties.find(p => p.id === id)?.name || 'N/A';
  const getHomeownerName = (id) => homeowners.find(h => h.id === id)?.full_name || 'N/A';
  
  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800', investigating: 'bg-blue-100 text-blue-800',
      resolved: 'bg-green-100 text-green-800', closed: 'bg-gray-100 text-gray-800',
      escalated: 'bg-red-100 text-red-800', in_progress: 'bg-indigo-100 text-indigo-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };
  
  const getSeverityColor = (severity) => {
    const colors = {
      critical: 'bg-red-500 text-white', high: 'bg-orange-400 text-white',
      medium: 'bg-yellow-400 text-yellow-900', low: 'bg-green-400 text-green-900',
    };
    return colors[severity] || 'bg-gray-400 text-white';
  };

  return (
    <div className="min-h-screen p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 mb-2">Complaints</h1>
            <p className="text-lg text-slate-600">Address and resolve homeowner complaints</p>
          </div>
          <Button className="bg-gradient-to-r from-slate-800 to-slate-900 text-white shadow-lg">
            <Plus className="w-5 h-5 mr-2" /> File Complaint
          </Button>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white/80 backdrop-blur-sm border border-slate-200 rounded-2xl p-6 shadow-lg">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input placeholder="Search complaints..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10"/>
            </div>
            <div className="flex gap-3">
              <Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger className="w-40"><SelectValue placeholder="All Status" /></SelectTrigger>
                <SelectContent><SelectItem value="all">All Status</SelectItem><SelectItem value="pending">Pending</SelectItem><SelectItem value="investigating">Investigating</SelectItem><SelectItem value="in_progress">In Progress</SelectItem><SelectItem value="resolved">Resolved</SelectItem><SelectItem value="closed">Closed</SelectItem><SelectItem value="escalated">Escalated</SelectItem></SelectContent>
              </Select>
              <Select value={severityFilter} onValueChange={setSeverityFilter}><SelectTrigger className="w-40"><SelectValue placeholder="All Severity" /></SelectTrigger>
                <SelectContent><SelectItem value="all">All Severity</SelectItem><SelectItem value="critical">Critical</SelectItem><SelectItem value="high">High</SelectItem><SelectItem value="medium">Medium</SelectItem><SelectItem value="low">Low</SelectItem></SelectContent>
              </Select>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
          {loading ? ( <div className="text-center py-12">Loading complaints...</div> ) 
          : filteredComplaints.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6"><AlertTriangle className="w-12 h-12 text-slate-400" /></div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">No Complaints Found</h3>
              <p className="text-slate-600">No complaints match the current filters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredComplaints.map((complaint, index) => (
                <motion.div key={complaint.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
                  <Card className="bg-white/80 backdrop-blur-sm border-slate-200 hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-500 hover:-translate-y-1">
                    <CardHeader className="pb-4">
                      <div className="flex items-start justify-between gap-4">
                        <CardTitle className="text-lg text-slate-900 line-clamp-1">{complaint.subject}</CardTitle>
                        <Badge className={`${getStatusColor(complaint.status)} border capitalize`}>{complaint.status}</Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className={`${getSeverityColor(complaint.severity)} capitalize`}>{complaint.severity}</Badge>
                        <Badge variant="outline" className="capitalize">{complaint.complaint_type}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-slate-700 text-sm line-clamp-3">{complaint.description}</p>
                      <div className="bg-slate-50 rounded-xl p-4 space-y-3 text-sm">
                        <div className="flex items-center gap-2 text-slate-600"><User className="w-4 h-4" /><span>Filed by: {getHomeownerName(complaint.homeowner_id)}</span></div>
                        <div className="flex items-center gap-2 text-slate-600"><Building2 className="w-4 h-4" /><span>Property: {getPropertyName(complaint.property_id)}</span></div>
                      </div>
                       <div className="text-xs text-slate-500 pt-3 border-t border-slate-200">
                          Filed on {formattedDate(new Date(complaint.created_date), "MMM d, yyyy, p")}
                        </div>
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
