'use client';

import React, { useState, useEffect } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, FileText, User, Calendar, DollarSign, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { Billing, Homeowner } from "../../../lib/data";

export default function Billings() {
  const [billings, setBillings] = useState([]);
  const [homeowners, setHomeowners] = useState([]);
  const [filteredBillings, setFilteredBillings] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterBillings();
  }, [billings, searchTerm, statusFilter, homeowners]);

  const loadData = async () => {
    try {
      const [billingData, homeownerData] = await Promise.all([
        Billing,
        Homeowner
      ]);
      setBillings(billingData);
      setHomeowners(homeownerData);
    } catch (error) {
      console.error('Error loading billing data:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const getHomeownerName = (homeownerId) => {
    const homeowner = homeowners.find(h => h.id === homeownerId);
    return homeowner ? homeowner.full_name : 'Unknown';
  };

  const filterBillings = () => {
    let filtered = billings;
    
    if (statusFilter !== "all") {
      filtered = filtered.filter(b => b.status === statusFilter);
    }

    if (searchTerm) {
      filtered = filtered.filter(b => {
        const homeownerName = getHomeownerName(b.homeowner_id).toLowerCase();
        return homeownerName.includes(searchTerm.toLowerCase());
      });
    }

    setFilteredBillings(filtered);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800 border-green-200';
      case 'unpaid': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'overdue': return 'bg-red-100 text-red-800 border-red-200';
      case 'partially_paid': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const totalOverdue = billings.filter(b => b.status === 'overdue').reduce((sum, b) => sum + b.amount, 0);

  return (
    <div className="min-h-screen p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
        >
          <div>
            <h1 className="text-4xl font-bold text-slate-900 mb-2">Billing</h1>
            <p className="text-lg text-slate-600">Manage association dues and payments</p>
          </div>
          <Button className="bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg">
            <Plus className="w-5 h-5 mr-2" />
            Generate Bills
          </Button>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6">
           <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-slate-600">Total Unpaid</CardTitle>
                    <DollarSign className="w-4 h-4 text-slate-400" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-slate-900">₱{billings.filter(b => ['unpaid', 'partially_paid'].includes(b.status)).reduce((acc, b) => acc + b.amount, 0).toLocaleString()}</div>
                    <p className="text-xs text-slate-500">{billings.filter(b => ['unpaid', 'partially_paid'].includes(b.status)).length} pending bills</p>
                </CardContent>
            </Card>
           </motion.div>
           <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
             <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-red-600">Total Overdue</CardTitle>
                    <AlertCircle className="w-4 h-4 text-red-400" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-red-800">₱{totalOverdue.toLocaleString()}</div>
                    <p className="text-xs text-slate-500">{billings.filter(b => b.status === 'overdue').length} overdue bills</p>
                </CardContent>
            </Card>
           </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-xl">
            <CardHeader>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <CardTitle className="text-xl font-bold text-slate-900">All Billings</CardTitle>
                <div className="flex gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <Input placeholder="Search homeowner..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10"/>
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="unpaid">Unpaid</SelectItem>
                      <SelectItem value="overdue">Overdue</SelectItem>
                      <SelectItem value="partially_paid">Partially Paid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
               {loading ? (
                <div className="text-center py-12 text-slate-500">Loading...</div>
              ) : filteredBillings.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">No Billings Found</h3>
                  <p className="text-slate-600">No billings match your current filters.</p>
                </div>
              ) : (
              <div className="space-y-4">
                {filteredBillings.map((bill, index) => (
                  <motion.div
                    key={bill.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 rounded-xl bg-slate-50/50 hover:bg-slate-100/50 transition-colors duration-200"
                  >
                    <div className="flex items-center gap-4 mb-3 md:mb-0">
                      <div className={`w-2 h-12 rounded-full ${getStatusColor(bill.status).split(' ')[0]}`}></div>
                      <div>
                        <h4 className="font-semibold text-slate-900">{bill.billing_period}</h4>
                        <div className="flex items-center gap-1 text-sm text-slate-600">
                          <User className="w-3 h-3" />
                          {getHomeownerName(bill.homeowner_id)}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col md:flex-row items-end md:items-center gap-6 w-full md:w-auto">
                        <div className="text-left md:text-right">
                          <p className="text-lg font-bold text-slate-800">₱{bill.amount.toLocaleString()}</p>
                           <div className="flex items-center gap-1 text-sm text-slate-600">
                              <Calendar className="w-3 h-3" />
                              Due: {format(new Date(bill.due_date), "MMM d, yyyy")}
                           </div>
                        </div>
                        <Badge className={`${getStatusColor(bill.status)} border text-sm w-28 justify-center`}>{bill.status}</Badge>
                    </div>
                  </motion.div>
                ))}
              </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
