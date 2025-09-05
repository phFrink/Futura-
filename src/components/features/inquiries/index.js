'use client';
import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {  Search, Mail, Phone, MessageSquare, Clock, CheckCircle, XCircle } from "lucide-react";
import { motion } from "framer-motion";
import { Inquiry } from "../../../lib/data";
import { formattedDate } from "@/lib/utils";

export default function Inquiries() {
  const [inquiries, setInquiries] = useState([]);
  const [filteredInquiries, setFilteredInquiries] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterInquiries();
  }, [inquiries, searchTerm, statusFilter, categoryFilter]);

  const loadData = async () => {
    try {
      const inquiryData = await Inquiry;
      setInquiries(inquiryData);
    } catch (error) {
      console.error('Error loading inquiries:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterInquiries = () => {
    let filtered = inquiries;

    if (searchTerm) {
      filtered = filtered.filter(i => 
        i.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        i.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        i.subject.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(i => i.status === statusFilter);
    }
    
    if (categoryFilter !== "all") {
      filtered = filtered.filter(i => i.category === categoryFilter);
    }

    setFilteredInquiries(filtered);
  };

  const getStatusProps = (status) => {
    switch (status) {
      case 'pending': return { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: Clock };
      case 'in_progress': return { color: 'bg-blue-100 text-blue-800 border-blue-200', icon: MessageSquare };
      case 'responded': return { color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle };
      case 'closed': return { color: 'bg-gray-100 text-gray-800 border-gray-200', icon: XCircle };
      default: return { color: 'bg-gray-100 text-gray-800 border-gray-200', icon: Clock };
    }
  };

  return (
    <div className="min-h-screen p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 mb-2">Inquiries</h1>
            <p className="text-lg text-slate-600">Manage homeowner and prospect inquiries</p>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white/80 backdrop-blur-sm border border-slate-200 rounded-2xl p-6 shadow-lg">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input placeholder="Search by name, email, subject..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10"/>
            </div>
            <div className="flex gap-3">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40"><SelectValue placeholder="All Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="responded">Responded</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-40"><SelectValue placeholder="All Categories" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="billing">Billing</SelectItem>
                  <SelectItem value="services">Services</SelectItem>
                  <SelectItem value="property_info">Property Info</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
          {loading ? (
            <div className="text-center py-12 text-slate-500">Loading inquiries...</div>
          ) : filteredInquiries.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6"><MessageSquare className="w-12 h-12 text-slate-400" /></div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">No Inquiries Found</h3>
              <p className="text-slate-600">The inquiry box is empty.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredInquiries.map((inquiry, index) => {
                const { color, icon: StatusIcon } = getStatusProps(inquiry.status);
                return (
                  <motion.div key={inquiry.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
                    <Card className="group overflow-hidden bg-white/80 backdrop-blur-sm border-slate-200 hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-500 hover:-translate-y-1">
                      <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-4 mb-3">
                               <Badge className={`${color} border font-medium`}><StatusIcon className="w-3 h-3 mr-1" />{inquiry.status}</Badge>
                               <Badge variant="outline" className="capitalize">{inquiry.category}</Badge>
                            </div>
                            <h3 className="font-bold text-slate-900 text-lg mb-1">{inquiry.subject}</h3>
                            <p className="text-slate-600 text-sm line-clamp-2">{inquiry.message}</p>
                          </div>
                          <div className="md:text-right md:w-64 flex-shrink-0">
                            <p className="font-semibold text-slate-800">{inquiry.name}</p>
                            <div className="flex items-center md:justify-end gap-2 text-sm text-slate-500"><Mail className="w-3 h-3"/>{inquiry.email}</div>
                            {inquiry.phone && <div className="flex items-center md:justify-end gap-2 text-sm text-slate-500"><Phone className="w-3 h-3"/>{inquiry.phone}</div>}
                          </div>
                        </div>
                        <div className="text-xs text-slate-500 pt-4 mt-4 border-t border-slate-200">
                           Received on {formattedDate(new Date(inquiry.created_date), "MMM d, yyyy, p")}
                           {inquiry.assigned_to && <span className="mx-2">|</span>}
                           {inquiry.assigned_to && <span>Assigned to: {inquiry.assigned_to}</span>}
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
