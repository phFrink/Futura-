'use client'
import React, { useState, useEffect } from "react";
import { createClient } from '@supabase/supabase-js'
import { isNewItem, getRelativeTime } from '@/lib/utils'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, TrendingDown, DollarSign, Receipt, CreditCard, Building2, Plus, Calendar, User, X, Edit, Trash2, AlertTriangle, Loader2, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [properties, setProperties] = useState([]);
  const [homeowners, setHomeowners] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState("current_month");
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [deletingTransaction, setDeletingTransaction] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    homeowner_id: '',
    property_id: '',
    transaction_type: '',
    amount: '',
    description: '',
    transaction_date: new Date().toISOString().split('T')[0]
  });

  // Handle opening edit modal
  const handleEditTransaction = (transaction) => {
    setEditingTransaction(transaction);
    setFormData({
      homeowner_id: transaction.homeowner_id?.toString() || '',
      property_id: transaction.property_id?.toString() || '',
      transaction_type: transaction.transaction_type,
      amount: transaction.amount?.toString() || '',
      description: transaction.description,
      transaction_date: transaction.transaction_date
    });
    setIsEditModalOpen(true);
  };

  // Handle opening delete modal
  const handleDeleteTransaction = (transaction) => {
    setDeletingTransaction(transaction);
    setIsDeleteModalOpen(true);
  };

  // Handle confirming delete
  const handleConfirmDelete = async () => {
    if (!deletingTransaction) return;

    setFormSubmitting(true);
    try {
      await deleteTransaction(deletingTransaction.id);
      toast.success('Transaction deleted successfully!');
      setIsDeleteModalOpen(false);
      setDeletingTransaction(null);
    } catch (error) {
      console.error('Error deleting transaction:', error);
      toast.info('Error deleting transaction: ' + error.message);
    } finally {
      setFormSubmitting(false);
    }
  };

  // Update transaction function
  const updateTransaction = async (transactionId, updateData) => {
    try {
      const { data, error } = await supabase
        .from('transaction_tbl')
        .update(updateData)
        .eq('id', transactionId)
        .select()
        .single();

      if (error) throw error;

      // Update local state
      setTransactions(prev => 
        prev.map(transaction => 
          transaction.id === transactionId 
            ? { ...transaction, ...data }
            : transaction
        )
      );

      return data;
    } catch (error) {
      console.error('Error updating transaction:', error);
      throw error;
    }
  };

  // Delete transaction function
  const deleteTransaction = async (transactionId) => {
    try {
      const { error } = await supabase
        .from('transaction_tbl')
        .delete()
        .eq('id', transactionId);

      if (error) throw error;

      // Remove from local state
      setTransactions(prev => prev.filter(transaction => transaction.id !== transactionId));
      
      return true;
    } catch (error) {
      console.error('Error deleting transaction:', error);
      throw error;
    }
  };

  // Reset form data
  const resetForm = () => {
    setFormData({
      homeowner_id: '',
      property_id: '',
      transaction_type: '',
      amount: '',
      description: '',
      transaction_date: new Date().toISOString().split('T')[0]
    });
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterTransactions();
  }, [transactions, selectedPeriod]);

  const loadData = async () => {
    try {
      // Fetch transactions from Supabase
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('transaction_tbl')
        .select('*')
        .order('transaction_date', { ascending: false });

      if (transactionsError) throw transactionsError;

      // Fetch properties from Supabase
      const { data: propertiesData, error: propertiesError } = await supabase
        .from('properties')
        .select('*')
        .order('name');

      if (propertiesError) throw propertiesError;

      // Fetch homeowners from Supabase
      const { data: homeownersData, error: homeownersError } = await supabase
        .from('homeowner_tbl')
        .select('*')
        .order('full_name');

      if (homeownersError) throw homeownersError;

      setTransactions(transactionsData || []);
      setProperties(propertiesData || []);
      setHomeowners(homeownersData || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.info('Error loading data: ' + error.message);
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
      case 'all_time': startDate = null; endDate = null; break;
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormSubmitting(true);

    try {
      // Validate form data
      if (!formData.homeowner_id || !formData.transaction_type || !formData.amount || !formData.description) {
        toast.info('Please fill in all required fields');
        return;
      }

      if (editingTransaction) {
        // Update existing transaction
        const updateData = {
          homeowner_id: parseInt(formData.homeowner_id),
          property_id: formData.property_id ? parseInt(formData.property_id) : null,
          transaction_type: formData.transaction_type,
          amount: parseFloat(formData.amount),
          description: formData.description,
          transaction_date: formData.transaction_date
        };
        
        await updateTransaction(editingTransaction.id, updateData);
        toast.success('Transaction updated successfully!');
        setIsEditModalOpen(false);
        setEditingTransaction(null);
      } else {
        // Insert into Supabase
        const { data, error } = await supabase
          .from('transaction_tbl')
          .insert([
            {
              homeowner_id: parseInt(formData.homeowner_id),
              property_id: formData.property_id ? parseInt(formData.property_id) : null,
              transaction_type: formData.transaction_type,
              amount: parseFloat(formData.amount),
              description: formData.description,
              transaction_date: formData.transaction_date,
              created_at: new Date().toISOString()
            }
          ])
          .select();

        if (error) throw error;

        // Success
        toast.success('Transaction added successfully!');
        
        // Close modal and refresh data
        setIsModalOpen(false);
        loadData();
      }

      // Reset form
      resetForm();

    } catch (error) {
      console.error('Error saving transaction:', error);
      toast.info('Error saving transaction: ' + error.message);
    } finally {
      setFormSubmitting(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    resetForm();
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
  const expenseTypes = ['penalty', 'refund', 'fee'];

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
          <Button 
            onClick={() => setIsModalOpen(true)}
            className="bg-gradient-to-r from-red-400 to-red-500 text-white shadow-lg"
          >
            <Plus className="w-5 h-5 mr-2" /> Add Transaction
          </Button>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-green-600">Total Income</p>
                    <p className="text-3xl font-bold text-green-900 mt-1">₱{totalIncome.toLocaleString()}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-green-100">
                    <TrendingUp className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-r from-red-50 to-rose-50 border-red-200">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-red-600">Total Expenses</p>
                    <p className="text-3xl font-bold text-red-900 mt-1">₱{totalExpenses.toLocaleString()}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-red-100">
                    <TrendingDown className="w-6 h-6 text-red-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className={`${netIncome >= 0 ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200' : 'bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200'}`}>
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className={`text-sm font-medium ${netIncome >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>Net Income</p>
                    <p className={`text-3xl font-bold mt-1 ${netIncome >= 0 ? 'text-blue-900' : 'text-orange-900'}`}>₱{netIncome.toLocaleString()}</p>
                  </div>
                  <div className={`p-3 rounded-xl ${netIncome >= 0 ? 'bg-blue-100' : 'bg-orange-100'}`}>
                    <DollarSign className={`w-6 h-6 ${netIncome >= 0 ? 'text-blue-600' : 'text-orange-600'}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
          <Card className="bg-white/80 backdrop-blur-sm border-slate-200">
            <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />Recent Transactions
                  </CardTitle>
                   <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Select Period" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="current_month">Current Month</SelectItem>
                        <SelectItem value="last_month">Last Month</SelectItem>
                        <SelectItem value="last_3_months">Last 3 Months</SelectItem>
                        <SelectItem value="all_time">All Time</SelectItem>
                      </SelectContent>
                    </Select>
                </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-12 text-slate-500">Loading...</div>
              ) : filteredTransactions.length === 0 ? (
                <div className="text-center py-12">
                  <Receipt className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">No Transactions Found</h3>
                  <p className="text-slate-600">No transactions in the selected period.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredTransactions.map((t, index) => (
                    <motion.div 
                      key={t.id} 
                      initial={{ opacity: 0, x: -20 }} 
                      animate={{ opacity: 1, x: 0 }} 
                      transition={{ delay: index * 0.05 }} 
                      className="flex items-center justify-between p-4 rounded-xl bg-slate-50/50 hover:bg-slate-100/50"
                    >
                      <div className="flex items-center gap-4">
                        <div>
                          <h4 className="font-semibold text-slate-900">{t.description}</h4>
                          <div className="flex items-center gap-3 text-sm text-slate-600 mt-1">
                            <div className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {getHomeownerName(t.homeowner_id)}
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {format(new Date(t.transaction_date), 'MMM d, yyyy')}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-xl font-bold ${incomeTypes.includes(t.transaction_type) ? 'text-green-600' : 'text-red-600'}`}>
                          {incomeTypes.includes(t.transaction_type) ? '+' : '-'}₱{t.amount.toLocaleString()}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={`${getTypeColor(t.transaction_type)} border font-medium capitalize`}>
                            {t.transaction_type}
                          </Badge>
                          {isNewItem(t.created_at) && (
                            <Badge className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white border-0 shadow-md animate-pulse">
                              <Sparkles className="w-3 h-3 mr-1" />
                              New
                            </Badge>
                          )}
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex gap-2 mt-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-blue-600 border-blue-200 hover:bg-blue-50 h-8 px-2"
                            onClick={() => handleEditTransaction(t)}
                          >
                            <Edit className="w-3 h-3 mr-1" />
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 border-red-200 hover:bg-red-50 h-8 px-2"
                            onClick={() => handleDeleteTransaction(t)}
                          >
                            <Trash2 className="w-3 h-3 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* DaisyUI Modal */}
        {isModalOpen && (
          <div className="modal modal-open">
            <div className="modal-box max-w-2xl bg-white">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-2xl text-slate-900">Add New Transaction</h3>
                <button 
                  className="btn btn-sm btn-circle btn-ghost"
                  onClick={closeModal}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Homeowner Selection */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium text-slate-700">Homeowner *</span>
                    </label>
                    <select 
                      name="homeowner_id"
                      value={formData.homeowner_id}
                      onChange={handleInputChange}
                      className="select select-bordered w-full bg-white"
                      required
                    >
                      <option value="">Select Homeowner</option>
                      {homeowners.map(homeowner => (
                        <option key={homeowner.id} value={homeowner.id}>
                          {homeowner.full_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Property Selection */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium text-slate-700">Property</span>
                    </label>
                    <select 
                      name="property_id"
                      value={formData.property_id}
                      onChange={handleInputChange}
                      className="select select-bordered w-full bg-white"
                    >
                      <option value="">Select Property (Optional)</option>
                      {properties.map(property => (
                        <option key={property.id} value={property.id}>
                          {property.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Transaction Type */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium text-slate-700">Transaction Type *</span>
                    </label>
                    <select 
                      name="transaction_type"
                      value={formData.transaction_type}
                      onChange={handleInputChange}
                      className="select select-bordered w-full bg-white"
                      required
                    >
                      <option value="">Select Type</option>
                      <option value="payment">Payment</option>
                      <option value="billing">Billing</option>
                      <option value="fee">Fee</option>
                      <option value="penalty">Penalty</option>
                      <option value="refund">Refund</option>
                      <option value="deposit">Deposit</option>
                    </select>
                  </div>

                  {/* Amount */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium text-slate-700">Amount *</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500">₱</span>
                      <input 
                        type="number"
                        name="amount"
                        value={formData.amount}
                        onChange={handleInputChange}
                        step="0.01"
                        min="0"
                        className="input input-bordered w-full pl-8 bg-white"
                        placeholder="0.00"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Transaction Date */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium text-slate-700">Transaction Date *</span>
                  </label>
                  <input 
                    type="date"
                    name="transaction_date"
                    value={formData.transaction_date}
                    onChange={handleInputChange}
                    className="input input-bordered w-full bg-white"
                    required
                  />
                </div>

                {/* Description */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium text-slate-700">Description *</span>
                  </label>
                  <textarea 
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    className="textarea textarea-bordered w-full h-24 bg-white resize-none"
                    placeholder="Enter transaction description..."
                    required
                  />
                </div>

                {/* Form Actions */}
                <div className="modal-action">
                  <button 
                    type="button"
                    className="btn btn-ghost"
                    onClick={closeModal}
                    disabled={formSubmitting}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="btn bg-gradient-to-r from-red-400 to-red-500 text-white border-none"
                    disabled={formSubmitting}
                  >
                    {formSubmitting ? (
                      <>
                        <span className="loading loading-spinner loading-sm"></span>
                        Adding...
                      </>
                    ) : (
                      'Add Transaction'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Transaction Modal */}
        {isEditModalOpen && (
          <div className="modal modal-open">
            <div className="modal-box max-w-2xl bg-white">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-2xl text-slate-900">Edit Transaction</h3>
                <button 
                  className="btn btn-sm btn-circle btn-ghost"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setEditingTransaction(null);
                    resetForm();
                  }}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Homeowner Selection */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium text-slate-700">Homeowner *</span>
                    </label>
                    <select 
                      name="homeowner_id"
                      value={formData.homeowner_id}
                      onChange={handleInputChange}
                      className="select select-bordered w-full bg-white"
                      required
                    >
                      <option value="">Select Homeowner</option>
                      {homeowners.map(homeowner => (
                        <option key={homeowner.id} value={homeowner.id}>
                          {homeowner.full_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Property Selection */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium text-slate-700">Property</span>
                    </label>
                    <select 
                      name="property_id"
                      value={formData.property_id}
                      onChange={handleInputChange}
                      className="select select-bordered w-full bg-white"
                    >
                      <option value="">Select Property (Optional)</option>
                      {properties.map(property => (
                        <option key={property.id} value={property.id}>
                          {property.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Transaction Type */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium text-slate-700">Transaction Type *</span>
                    </label>
                    <select 
                      name="transaction_type"
                      value={formData.transaction_type}
                      onChange={handleInputChange}
                      className="select select-bordered w-full bg-white"
                      required
                    >
                      <option value="">Select Type</option>
                      <option value="payment">Payment</option>
                      <option value="billing">Billing</option>
                      <option value="fee">Fee</option>
                      <option value="penalty">Penalty</option>
                      <option value="refund">Refund</option>
                      <option value="deposit">Deposit</option>
                    </select>
                  </div>

                  {/* Amount */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium text-slate-700">Amount *</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500">₱</span>
                      <input 
                        type="number"
                        name="amount"
                        value={formData.amount}
                        onChange={handleInputChange}
                        step="0.01"
                        min="0"
                        className="input input-bordered w-full pl-8 bg-white"
                        placeholder="0.00"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Transaction Date */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium text-slate-700">Transaction Date *</span>
                  </label>
                  <input 
                    type="date"
                    name="transaction_date"
                    value={formData.transaction_date}
                    onChange={handleInputChange}
                    className="input input-bordered w-full bg-white"
                    required
                  />
                </div>

                {/* Description */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium text-slate-700">Description *</span>
                  </label>
                  <textarea 
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    className="textarea textarea-bordered w-full h-24 bg-white resize-none"
                    placeholder="Enter transaction description..."
                    required
                  />
                </div>

                {/* Form Actions */}
                <div className="modal-action">
                  <button 
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => {
                      setIsEditModalOpen(false);
                      setEditingTransaction(null);
                      resetForm();
                    }}
                    disabled={formSubmitting}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="btn bg-gradient-to-r from-red-400 to-red-500 text-white border-none"
                    disabled={formSubmitting}
                  >
                    {formSubmitting ? (
                      <>
                        <span className="loading loading-spinner loading-sm"></span>
                        Updating...
                      </>
                    ) : (
                      <>
                        <Edit className="w-4 h-4 mr-2" />
                        Update Transaction
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
            <div className="modal-backdrop bg-black/50" onClick={() => {
              setIsEditModalOpen(false);
              setEditingTransaction(null);
              resetForm();
            }}></div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {isDeleteModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={(e) => e.target === e.currentTarget && setIsDeleteModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md"
            >
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-4 text-white rounded-t-2xl">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">Delete Transaction</h3>
                      <p className="text-red-100 text-sm mt-1">This action cannot be undone</p>
                    </div>
                  </div>
                  <button 
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    onClick={() => {
                      setIsDeleteModalOpen(false);
                      setDeletingTransaction(null);
                    }}
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-6">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Trash2 className="w-8 h-8 text-red-500" />
                  </div>
                  <h4 className="text-lg font-semibold text-slate-900 mb-2">
                    Are you sure you want to delete this transaction?
                  </h4>
                  {deletingTransaction && (
                    <div className="bg-slate-50 rounded-lg p-4 mb-4 text-left">
                      <div className="flex items-center justify-between mb-3">
                        <h5 className="font-medium text-slate-900">
                          {deletingTransaction.description}
                        </h5>
                        <Badge className={`${getTypeColor(deletingTransaction.transaction_type)} border capitalize`}>
                          {deletingTransaction.transaction_type}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs text-slate-500 mb-2">
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          <span>{getHomeownerName(deletingTransaction.homeowner_id)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>{format(new Date(deletingTransaction.transaction_date), 'MMM d, yyyy')}</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                        <span className="text-sm font-medium">Amount:</span>
                        <span className={`text-lg font-bold ${incomeTypes.includes(deletingTransaction.transaction_type) ? 'text-green-600' : 'text-red-600'}`}>
                          {incomeTypes.includes(deletingTransaction.transaction_type) ? '+' : '-'}₱{deletingTransaction.amount.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  )}
                  <p className="text-slate-600">
                    This will permanently delete the transaction and all associated data. This action cannot be reversed.
                  </p>
                </div>

                {/* Modal Actions */}
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    className="px-6 py-3 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg font-medium transition-colors"
                    onClick={() => {
                      setIsDeleteModalOpen(false);
                      setDeletingTransaction(null);
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className={`px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${
                      formSubmitting ? 'opacity-80 cursor-not-allowed' : ''
                    }`}
                    onClick={handleConfirmDelete}
                    disabled={formSubmitting}
                  >
                    {formSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4" />
                        Delete Transaction
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
}