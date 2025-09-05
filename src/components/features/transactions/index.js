'use client'
import React, { useState, useEffect } from "react";
import { Transaction, Property, Homeowner } from "@/lib/data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, TrendingDown, DollarSign, Receipt, CreditCard, Building2, Plus, Calendar, User } from "lucide-react";
import { motion } from "framer-motion";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [properties, setProperties] = useState([]);
  const [homeowners, setHomeowners] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState("current_month");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterTransactions();
  }, [transactions, selectedPeriod]);

  const loadData = async () => {
    try {
      const [transactionsData, propertiesData, homeownersData] = await Promise.all([
        Transaction,
        Property,
        Homeowner
      ]);
      setTransactions(transactionsData);
      setProperties(propertiesData);
      setHomeowners(homeownersData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterTransactions = () => {
    let filtered = transactions;
    const now = new Date();
    let startDate, endDate;

    switch (selectedPeriod) {
      case 'current_month': startDate = startOfMonth(now); endDate = endOfMonth(now); break;
      case 'last_month': const lastMonth = subMonths(now, 1); startDate = startOfMonth(lastMonth); endDate = endOfMonth(lastMonth); break;
      case 'last_3_months': startDate = subMonths(now, 3); endDate = now; break;
      case 'all_time': startDate = null; endDate = null; break; // Add all_time case
      default: startDate = null; endDate = null;
    }

    if (startDate && endDate) {
      filtered = filtered.filter(t => {
        const transactionDate = new Date(t.transaction_date);
        return transactionDate >= startDate && transactionDate <= endDate;
      });
    }
    setFilteredTransactions(filtered);
  };

  const getPropertyName = (id) => properties.find(p => p.id === id)?.name || 'N/A';
  const getHomeownerName = (id) => homeowners.find(h => h.id === id)?.full_name || 'N/A';
  
  const getTypeColor = (type) => {
    switch (type) {
      case 'payment': return 'bg-green-100 text-green-800';
      case 'billing': return 'bg-blue-100 text-blue-800';
      case 'fee': return 'bg-purple-100 text-purple-800';
      case 'penalty': return 'bg-orange-100 text-orange-800';
      case 'refund':
      case 'deposit': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const incomeTypes = ['payment', 'deposit'];
  const expenseTypes = ['penalty', 'refund', 'fee']; // Re-evaluated 'refund' as expense type if it implies money paid out, otherwise it might be income or specific type. For this context, assuming it's money going out.

  const totalIncome = filteredTransactions.filter(t => incomeTypes.includes(t.transaction_type)).reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = filteredTransactions.filter(t => expenseTypes.includes(t.transaction_type)).reduce((sum, t) => sum + t.amount, 0);
  const netIncome = totalIncome - totalExpenses;

  return (
    <div className="min-h-screen p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 mb-2">Transactions</h1>
            <p className="text-lg text-slate-600">Track all financial movements</p>
          </div>
          <Button className="bg-gradient-to-r from-slate-800 to-slate-900 text-white shadow-lg">
            <Plus className="w-5 h-5 mr-2" /> Add Transaction
          </Button>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200"><CardContent className="p-6"><div className="flex justify-between items-start"><div><p className="text-sm font-medium text-green-600">Total Income</p><p className="text-3xl font-bold text-green-900 mt-1">₱{totalIncome.toLocaleString()}</p></div><div className="p-3 rounded-xl bg-green-100"><TrendingUp className="w-6 h-6 text-green-600" /></div></div></CardContent></Card>
            <Card className="bg-gradient-to-r from-red-50 to-rose-50 border-red-200"><CardContent className="p-6"><div className="flex justify-between items-start"><div><p className="text-sm font-medium text-red-600">Total Expenses</p><p className="text-3xl font-bold text-red-900 mt-1">₱{totalExpenses.toLocaleString()}</p></div><div className="p-3 rounded-xl bg-red-100"><TrendingDown className="w-6 h-6 text-red-600" /></div></div></CardContent></Card>
            <Card className={`${netIncome >= 0 ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200' : 'bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200'}`}><CardContent className="p-6"><div className="flex justify-between items-start"><div><p className={`text-sm font-medium ${netIncome >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>Net Income</p><p className={`text-3xl font-bold mt-1 ${netIncome >= 0 ? 'text-blue-900' : 'text-orange-900'}`}>₱{netIncome.toLocaleString()}</p></div><div className={`p-3 rounded-xl ${netIncome >= 0 ? 'bg-blue-100' : 'bg-orange-100'}`}><DollarSign className={`w-6 h-6 ${netIncome >= 0 ? 'text-blue-600' : 'text-orange-600'}`} /></div></div></CardContent></Card>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
          <Card className="bg-white/80 backdrop-blur-sm border-slate-200">
            <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-xl font-bold text-slate-900 flex items-center gap-2"><CreditCard className="w-5 h-5" />Recent Transactions</CardTitle>
                   <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                      <SelectTrigger className="w-48"><SelectValue placeholder="Select Period" /></SelectTrigger>
                      <SelectContent><SelectItem value="current_month">Current Month</SelectItem><SelectItem value="last_month">Last Month</SelectItem><SelectItem value="last_3_months">Last 3 Months</SelectItem><SelectItem value="all_time">All Time</SelectItem></SelectContent>
                    </Select>
                </div>
            </CardHeader>
            <CardContent>
              {loading ? (<div className="text-center py-12 text-slate-500">Loading...</div>) 
              : filteredTransactions.length === 0 ? (
                <div className="text-center py-12">
                  <Receipt className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">No Transactions Found</h3>
                  <p className="text-slate-600">No transactions in the selected period.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredTransactions.map((t, index) => (
                    <motion.div key={t.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }} className="flex items-center justify-between p-4 rounded-xl bg-slate-50/50 hover:bg-slate-100/50">
                      <div className="flex items-center gap-4">
                        <div>
                          <h4 className="font-semibold text-slate-900">{t.description}</h4>
                          <div className="flex items-center gap-3 text-sm text-slate-600 mt-1">
                            <div className="flex items-center gap-1"><User className="w-3 h-3" />{getHomeownerName(t.homeowner_id)}</div>
                            <div className="flex items-center gap-1"><Calendar className="w-3 h-3" />{format(new Date(t.transaction_date), 'MMM d, yyyy')}</div>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-xl font-bold ${incomeTypes.includes(t.transaction_type) ? 'text-green-600' : 'text-red-600'}`}>
                          {incomeTypes.includes(t.transaction_type) ? '+' : '-'}₱{t.amount.toLocaleString()}
                        </div>
                        <Badge className={`${getTypeColor(t.transaction_type)} border font-medium mt-1 capitalize`}>{t.transaction_type}</Badge>
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
