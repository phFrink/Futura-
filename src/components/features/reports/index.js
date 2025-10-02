'use client';

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Download,
  Printer,
  Calendar,
  Filter,
  Users,
  Home,
  Wrench,
  AlertTriangle,
  Bell,
  CreditCard,
  FileBarChart,
  Search,
  Loader2
} from "lucide-react";
import { motion } from "framer-motion";
import { createClient } from '@supabase/supabase-js';
import { format } from "date-fns";

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function Reports() {
  const [activeReport, setActiveReport] = useState('homeowners');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [reportData, setReportData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredData, setFilteredData] = useState([]);

  const reportTypes = [
    {
      id: 'homeowners',
      title: 'Homeowners Report',
      icon: Users,
      description: 'Complete list of homeowners with their details',
      color: 'blue'
    },
    {
      id: 'properties',
      title: 'Properties Report',
      icon: Home,
      description: 'All properties with their current status',
      color: 'green'
    },
    {
      id: 'service_requests',
      title: 'Service Requests Report',
      icon: Wrench,
      description: 'Service requests with status and dates',
      color: 'amber'
    },
    {
      id: 'complaints',
      title: 'Complaints Report',
      icon: AlertTriangle,
      description: 'All complaints and their resolution status',
      color: 'red'
    },
    {
      id: 'billings',
      title: 'Billing Report',
      icon: CreditCard,
      description: 'Billing records with payment status',
      color: 'purple'
    },
    {
      id: 'announcements',
      title: 'Announcements Report',
      icon: Bell,
      description: 'All announcements and their publication dates',
      color: 'indigo'
    }
  ];

  useEffect(() => {
    if (activeReport) {
      generateReport();
    }
  }, [activeReport]);

  useEffect(() => {
    // Filter data based on search term
    if (searchTerm === '') {
      setFilteredData(reportData);
    } else {
      const filtered = reportData.filter(item => {
        return Object.values(item).some(value =>
          value && value.toString().toLowerCase().includes(searchTerm.toLowerCase())
        );
      });
      setFilteredData(filtered);
    }
  }, [searchTerm, reportData]);

  const generateReport = async () => {
    setLoading(true);
    try {
      let query = supabase.from(`${activeReport === 'service_requests' ? 'request_tbl' :
        activeReport === 'homeowners' ? 'homeowner_tbl' :
        activeReport === 'properties' ? 'property_tbl' :
        activeReport === 'complaints' ? 'complaint_tbl' :
        activeReport === 'billings' ? 'billing_tbl' :
        'announcement_tbl'}`).select('*');

      // Apply date filters if provided
      if (startDate && endDate) {
        const dateField = activeReport === 'homeowners' ? 'move_in_date' :
          activeReport === 'service_requests' ? 'created_at' :
          activeReport === 'complaints' ? 'created_at' :
          activeReport === 'billings' ? 'due_date' :
          activeReport === 'announcements' ? 'publish_date' :
          'created_at';

        if (dateField !== 'created_at' || activeReport === 'service_requests' || activeReport === 'complaints') {
          query = query.gte(dateField, startDate).lte(dateField, endDate);
        }
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error('Error generating report:', error);
        return;
      }

      setReportData(data || []);
      setFilteredData(data || []);
    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = async () => {
    try {
      setPdfLoading(true);
      console.log('Starting PDF generation...');
      console.log('Filtered data:', filteredData.length, 'records');
      console.log('Active report:', activeReport);

      if (!activeReport) {
        toast.info('Please select a report type first.');
        return;
      }

      if (filteredData.length === 0) {
        // Provide sample data for testing if no real data is available
        const sampleData = [{
          full_name: 'Sample User',
          email: 'sample@example.com',
          phone: '09123456789',
          status: 'active',
          move_in_date: new Date().toISOString(),
          monthly_dues: 5000
        }];

        console.log('No filtered data found, using sample data for PDF testing');

        // Use sample data temporarily for PDF generation
        const tempFilteredData = sampleData;

        // Generate PDF with sample data
        generatePDFWithData(tempFilteredData);
        return;
      }

      // Generate PDF with actual data
      generatePDFWithData(filteredData);
    } catch (error) {
      console.error('Detailed PDF generation error:', error);
      toast.info(`Error generating PDF: ${error.message || 'Unknown error'}. Please check the console for details.`);
    } finally {
      setPdfLoading(false);
    }
  };

  const generatePDFWithData = async (data) => {
    try {

      // Import jsPDF and autotable dynamically
      const { jsPDF } = await import('jspdf');
      const autoTable = (await import('jspdf-autotable')).default;

      const doc = new jsPDF();
      const reportType = reportTypes.find(r => r.id === activeReport);

      // Add title
      doc.setFontSize(18);
      doc.setTextColor(40, 40, 40);
      doc.text(reportType?.title || 'Report', 20, 30);

      // Add date range if applied
      let yPos = 45;
      if (startDate && endDate) {
        doc.setFontSize(12);
        doc.text(`Date Range: ${startDate} to ${endDate}`, 20, yPos);
        yPos += 15;
      }

      // Add generation date
      doc.setFontSize(10);
      doc.text(`Generated: ${format(new Date(), 'PPP')}`, 20, yPos);
      yPos += 10;

      // Add record count
      doc.text(`Total Records: ${data.length}`, 20, yPos);
      yPos += 15;

      // Prepare table data
      let columns = [];
      let rows = [];

      if (data.length > 0) {
        // Get column headers from first item
        columns = Object.keys(data[0]).filter(key =>
          !key.includes('id') &&
          !key.includes('password') &&
          key !== 'created_at' &&
          key !== 'updated_at'
        );

        console.log('PDF Columns:', columns);

        // Prepare rows with better data formatting
        rows = data.map((item, index) => {
          return columns.map(col => {
            let value = item[col];

            if (value === null || value === undefined) return '-';

            if (typeof value === 'boolean') return value ? 'Yes' : 'No';

            if (typeof value === 'object') {
              return Array.isArray(value) ? value.join(', ') : 'Object';
            }

            if (col.includes('date') && value) {
              try {
                return format(new Date(value), 'MMM dd, yyyy');
              } catch (error) {
                return value.toString();
              }
            }

            // Truncate long strings for PDF
            const str = value.toString();
            return str.length > 50 ? str.substring(0, 47) + '...' : str;
          });
        });

        console.log('PDF Rows prepared:', rows.length);

        // Add table to PDF using autoTable
        autoTable(doc, {
          head: [columns.map(col => col.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()))],
          body: rows,
          startY: yPos + 5,
          theme: 'striped',
          headStyles: {
            fillColor: [239, 68, 68], // Red color to match theme
            textColor: 255,
            fontSize: 9,
            fontStyle: 'bold'
          },
          bodyStyles: {
            fontSize: 8,
            textColor: [40, 40, 40]
          },
          alternateRowStyles: {
            fillColor: [249, 250, 251]
          },
          margin: { top: 20, left: 10, right: 10, bottom: 20 },
          tableWidth: 'auto',
          columnStyles: {},
          didDrawPage: function (data) {
            // Add page numbers
            const pageCount = doc.internal.getNumberOfPages();
            const pageSize = doc.internal.pageSize;
            const pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight();
            doc.text(`Page ${data.pageNumber} of ${pageCount}`, data.settings.margin.left, pageHeight - 10);
          }
        });
      } else {
        doc.text('No data available for the selected criteria.', 20, yPos + 10);
      }

      // Generate filename
      const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm-ss');
      const filename = `${(reportType?.title || 'report').toLowerCase().replace(/ /g, '_')}_${timestamp}.pdf`;

      console.log('Saving PDF as:', filename);

      // Save the PDF
      doc.save(filename);

      console.log('PDF generated successfully!');
    } catch (error) {
      console.error('Error in generatePDFWithData:', error);
      throw error;
    }
  };

  const printReport = () => {
    const printContent = document.getElementById('report-table');
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    const reportType = reportTypes.find(r => r.id === activeReport);

    printWindow.document.write(`
      <html>
        <head>
          <title>${reportType.title}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 20px;
            }
            h1 {
              color: #374151;
              border-bottom: 2px solid #ef4444;
              padding-bottom: 10px;
            }
            .report-info {
              margin: 20px 0;
              padding: 15px;
              background-color: #f9fafb;
              border-left: 4px solid #ef4444;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
            }
            th, td {
              border: 1px solid #d1d5db;
              padding: 8px;
              text-align: left;
            }
            th {
              background-color: #ef4444;
              color: white;
              font-weight: bold;
            }
            tr:nth-child(even) {
              background-color: #f9fafb;
            }
            .no-data {
              text-align: center;
              padding: 40px;
              color: #6b7280;
            }
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <h1>${reportType.title}</h1>
          <div class="report-info">
            ${startDate && endDate ? `<p><strong>Date Range:</strong> ${startDate} to ${endDate}</p>` : ''}
            <p><strong>Generated:</strong> ${format(new Date(), 'PPP')}</p>
            <p><strong>Total Records:</strong> ${filteredData.length}</p>
          </div>
          ${printContent.innerHTML}
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.onload = function() {
      printWindow.print();
      printWindow.close();
    };
  };

  const getColorClass = (color) => {
    const colors = {
      blue: 'bg-blue-500 hover:bg-blue-600',
      green: 'bg-green-500 hover:bg-green-600',
      amber: 'bg-amber-500 hover:bg-amber-600',
      red: 'bg-red-500 hover:bg-red-600',
      purple: 'bg-purple-500 hover:bg-purple-600',
      indigo: 'bg-indigo-500 hover:bg-indigo-600'
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="min-h-full w-full">
      <div className="h-full max-w-none mx-0 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-6 lg:space-y-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center md:text-left"
          >
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 mb-2">
              Reports & Analytics
            </h1>
            <p className="text-sm sm:text-base lg:text-lg text-slate-600">Generate and export detailed reports</p>
          </motion.div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 lg:gap-8">

            {/* Report Types Sidebar - Desktop */}
            <div className="hidden xl:block xl:col-span-4 2xl:col-span-3">
              <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-xl h-fit sticky top-4">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <FileBarChart className="w-5 h-5 text-red-600" />
                    Report Types
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {reportTypes.map((report, index) => (
                      <motion.div
                        key={report.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        onClick={() => setActiveReport(report.id)}
                        className={`flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200 ${
                          activeReport === report.id
                            ? 'bg-gradient-to-r from-red-50 to-red-100 border-2 border-red-200 shadow-md'
                            : 'bg-slate-50/50 hover:bg-slate-100/50 hover:shadow-sm'
                        }`}
                      >
                        <div className={`p-2 rounded-lg flex-shrink-0 ${
                          activeReport === report.id
                            ? 'bg-red-600 text-white'
                            : 'bg-slate-200 text-slate-600'
                        }`}>
                          <report.icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className={`font-semibold text-sm mb-1 ${
                            activeReport === report.id ? 'text-red-900' : 'text-slate-900'
                          }`}>
                            {report.title}
                          </h4>
                          <p className={`text-xs leading-relaxed ${
                            activeReport === report.id ? 'text-red-700' : 'text-slate-600'
                          }`}>
                            {report.description}
                          </p>
                          {activeReport === report.id && (
                            <Badge className="bg-red-600 text-white text-xs mt-2">
                              Active
                            </Badge>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main Content Area */}
            <div className="xl:col-span-8 2xl:col-span-9 space-y-6">

              {/* Report Types - Mobile/Tablet */}
              <div className="block xl:hidden">
                <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-xl">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      <FileBarChart className="w-5 h-5 text-red-600" />
                      Select Report Type
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {reportTypes.map((report, index) => (
                        <motion.div
                          key={report.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          onClick={() => setActiveReport(report.id)}
                          className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                            activeReport === report.id
                              ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg'
                              : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
                          }`}
                        >
                          <div className={`p-2 rounded-md ${
                            activeReport === report.id
                              ? 'bg-white/20'
                              : 'bg-slate-200'
                          }`}>
                            <report.icon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">
                              {report.title}
                            </p>
                          </div>
                          {activeReport === report.id && (
                            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                          )}
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Filters & Actions */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-xl">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      <Filter className="w-5 h-5 text-red-600" />
                      Filters & Actions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                      {/* Date Filters */}
                      <div className="space-y-2">
                        <label className="block text-xs font-medium text-slate-700">Start Date</label>
                        <Input
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          className="w-full text-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-xs font-medium text-slate-700">End Date</label>
                        <Input
                          type="date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          className="w-full text-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-xs font-medium text-slate-700">Search</label>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                          <Input
                            type="text"
                            placeholder="Search records..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 text-sm"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-slate-200">
                      <Button
                        onClick={generateReport}
                        disabled={loading || !activeReport}
                        className="bg-red-600 hover:bg-red-700 h-10"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Loading...
                          </>
                        ) : (
                          <>
                            <FileBarChart className="w-4 h-4 mr-2" />
                            Generate
                          </>
                        )}
                      </Button>
                      <Button
                        onClick={downloadPDF}
                        disabled={filteredData.length === 0 || pdfLoading}
                        variant="outline"
                        className="border-red-200 text-red-600 hover:bg-red-50 h-10"
                      >
                        {pdfLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Download className="w-4 h-4 mr-2" />
                            Download PDF
                          </>
                        )}
                      </Button>
                      <Button
                        onClick={printReport}
                        disabled={filteredData.length === 0}
                        variant="outline"
                        className="border-red-200 text-red-600 hover:bg-red-50 h-10"
                      >
                        <Printer className="w-4 h-4 mr-2" />
                        Print Report
                      </Button>
                    </div>

                    {filteredData.length > 0 && (
                      <div className="flex justify-center pt-4">
                        <Badge className="bg-red-100 text-red-800 border-red-200">
                          {filteredData.length} records found
                        </Badge>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              {/* Report Results Table */}
              {activeReport && (
                <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-xl">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-red-600" />
                  {reportTypes.find(r => r.id === activeReport)?.title || 'Report Results'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div id="report-table" className="overflow-x-auto">
                  {loading ? (
                    <div className="space-y-4">
                      {Array(5).fill(0).map((_, i) => (
                        <div key={i} className="h-16 bg-slate-200 animate-pulse rounded-xl" />
                      ))}
                    </div>
                  ) : filteredData.length === 0 ? (
                    <div className="text-center py-8 md:py-12 text-slate-500">
                      <FileText className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-3 md:mb-4 opacity-50" />
                      <p className="text-base md:text-lg font-medium mb-1 md:mb-2">No Data Available</p>
                      <p className="text-xs md:text-sm px-4">Try adjusting your filters or generate a new report</p>
                    </div>
                  ) : (
                    <>
                      {/* Desktop Table View */}
                      <div className="hidden md:block">
                        <style jsx>{`
                          .custom-scrollbar::-webkit-scrollbar {
                            height: 6px;
                          }
                          .custom-scrollbar::-webkit-scrollbar-track {
                            background: #f1f5f9;
                            border-radius: 3px;
                          }
                          .custom-scrollbar::-webkit-scrollbar-thumb {
                            background: #cbd5e1;
                            border-radius: 3px;
                          }
                          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                            background: #94a3b8;
                          }
                        `}</style>
                        <div className="w-full overflow-x-auto custom-scrollbar rounded-xl border border-slate-200 shadow-sm bg-white">
                          <div className="inline-block min-w-full align-middle">
                            <table className="min-w-full divide-y divide-slate-200">
                              <thead>
                                <tr className="bg-gradient-to-r from-red-500 to-red-600">
                                  {Object.keys(filteredData[0])
                                    .filter(key =>
                                      !key.includes('id') &&
                                      !key.includes('password') &&
                                      key !== 'created_at' &&
                                      key !== 'updated_at'
                                    )
                                    .map((key, index) => {
                                      // Define responsive column width classes based on content type
                                      let widthClass = 'min-w-[100px] md:min-w-[120px]'; // default
                                      if (key === 'email') widthClass = 'min-w-[150px] md:min-w-[200px] lg:min-w-[220px]';
                                      if (key === 'phone') widthClass = 'min-w-[120px] md:min-w-[140px]';
                                      if (key === 'address' || key === 'description' || key === 'message') widthClass = 'min-w-[180px] md:min-w-[250px] lg:min-w-[280px]';
                                      if (key === 'status' || key === 'priority') widthClass = 'min-w-[80px] md:min-w-[100px]';
                                      if (key.includes('date')) widthClass = 'min-w-[120px] md:min-w-[140px] lg:min-w-[160px]';
                                      if (key === 'amount' || key.includes('cost') || key.includes('fee')) widthClass = 'min-w-[100px] md:min-w-[120px]';
                                      if (key === 'full_name' || key === 'name') widthClass = 'min-w-[120px] md:min-w-[160px] lg:min-w-[180px]';
                                      if (key === 'title' || key === 'subject') widthClass = 'min-w-[140px] md:min-w-[200px] lg:min-w-[240px]';

                                      return (
                                        <th
                                          key={key}
                                          className={`${widthClass} px-3 md:px-4 lg:px-6 py-3 md:py-4 text-left font-semibold text-white text-xs md:text-sm uppercase tracking-wider whitespace-nowrap sticky-header`}
                                        >
                                          <div className="flex items-center space-x-1">
                                            <span className="truncate">{key.replace(/_/g, ' ')}</span>
                                          </div>
                                        </th>
                                      );
                                    })}
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-slate-200">
                                {filteredData.map((item, index) => (
                                  <tr
                                    key={index}
                                    className={`transition-colors duration-200 hover:bg-red-50 ${
                                      index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'
                                    }`}
                                  >
                                    {Object.keys(item)
                                      .filter(key =>
                                        !key.includes('id') &&
                                        !key.includes('password') &&
                                        key !== 'created_at' &&
                                        key !== 'updated_at'
                                      )
                                      .map((key, cellIndex) => {
                                        // Match the same responsive width classes as headers
                                        let widthClass = 'min-w-[100px] md:min-w-[120px]'; // default
                                        if (key === 'email') widthClass = 'min-w-[150px] md:min-w-[200px] lg:min-w-[220px]';
                                        if (key === 'phone') widthClass = 'min-w-[120px] md:min-w-[140px]';
                                        if (key === 'address' || key === 'description' || key === 'message') widthClass = 'min-w-[180px] md:min-w-[250px] lg:min-w-[280px]';
                                        if (key === 'status' || key === 'priority') widthClass = 'min-w-[80px] md:min-w-[100px]';
                                        if (key.includes('date')) widthClass = 'min-w-[120px] md:min-w-[140px] lg:min-w-[160px]';
                                        if (key === 'amount' || key.includes('cost') || key.includes('fee')) widthClass = 'min-w-[100px] md:min-w-[120px]';
                                        if (key === 'full_name' || key === 'name') widthClass = 'min-w-[120px] md:min-w-[160px] lg:min-w-[180px]';
                                        if (key === 'title' || key === 'subject') widthClass = 'min-w-[140px] md:min-w-[200px] lg:min-w-[240px]';

                                        return (
                                          <td
                                            key={key}
                                            className={`${widthClass} px-3 md:px-4 lg:px-6 py-3 md:py-4 text-slate-700 text-xs md:text-sm border-b border-slate-100 whitespace-nowrap`}
                                          >
                                            <div className="flex items-center">
                                              {(() => {
                                                let value = item[key];
                                                if (value === null || value === undefined) return <span className="text-slate-400">-</span>;

                                                if (typeof value === 'boolean') {
                                                  return (
                                                    <Badge className={`text-xs ${value ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                                      {value ? 'Yes' : 'No'}
                                                    </Badge>
                                                  );
                                                }

                                                if (typeof value === 'object') {
                                                  return <span className="text-slate-500 text-xs">Object</span>;
                                                }

                                                if (key.includes('date') && value) {
                                                  try {
                                                    return (
                                                      <span className="text-slate-600">
                                                        {format(new Date(value), 'MMM dd, yyyy')}
                                                      </span>
                                                    );
                                                  } catch {
                                                    return <span className="text-slate-600">{value}</span>;
                                                  }
                                                }

                                                if (key === 'status') {
                                                  return (
                                                    <Badge className={`text-xs font-medium ${
                                                      value === 'active' || value === 'completed' || value === 'paid' ?
                                                      'bg-green-100 text-green-800 border-green-200' :
                                                      value === 'pending' || value === 'unpaid' ?
                                                      'bg-yellow-100 text-yellow-800 border-yellow-200' :
                                                      'bg-red-100 text-red-800 border-red-200'
                                                    } border`}>
                                                      {value.toString().charAt(0).toUpperCase() + value.toString().slice(1)}
                                                    </Badge>
                                                  );
                                                }

                                                if (key === 'priority') {
                                                  return (
                                                    <Badge className={`text-xs font-medium border ${
                                                      value === 'urgent' || value === 'high' ?
                                                      'bg-red-100 text-red-800 border-red-200' :
                                                      value === 'medium' ?
                                                      'bg-yellow-100 text-yellow-800 border-yellow-200' :
                                                      'bg-green-100 text-green-800 border-green-200'
                                                    }`}>
                                                      {value.toString().charAt(0).toUpperCase() + value.toString().slice(1)}
                                                    </Badge>
                                                  );
                                                }

                                                if (key === 'amount' || key.includes('cost') || key.includes('fee')) {
                                                  return (
                                                    <span className="font-medium text-slate-900">
                                                      {typeof value === 'number' ? `₱${value.toLocaleString()}` : value}
                                                    </span>
                                                  );
                                                }

                                                if (key === 'email') {
                                                  return (
                                                    <span className="text-blue-600 hover:text-blue-800 cursor-pointer truncate max-w-[180px]" title={value.toString()}>
                                                      {value.toString()}
                                                    </span>
                                                  );
                                                }

                                                if (key === 'phone') {
                                                  return (
                                                    <span className="text-slate-600 font-mono text-sm">
                                                      {value.toString()}
                                                    </span>
                                                  );
                                                }

                                                // Long text fields with truncation
                                                if (key === 'address' || key === 'description' || key === 'message') {
                                                  return (
                                                    <span className="text-slate-600 truncate max-w-[200px]" title={value.toString()}>
                                                      {value.toString()}
                                                    </span>
                                                  );
                                                }

                                                return (
                                                  <span className="text-slate-600 truncate max-w-[150px]" title={value.toString()}>
                                                    {value.toString()}
                                                  </span>
                                                );
                                              })()}
                                            </div>
                                          </td>
                                        );
                                      })}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* Table Info Banner */}
                        <div className="bg-slate-50 border-t border-slate-200 px-4 py-3 flex items-center justify-between text-sm">
                          <div className="flex items-center space-x-4">
                            <span className="text-slate-600 font-medium">
                              {filteredData.length} {filteredData.length === 1 ? 'record' : 'records'} found
                            </span>
                            {searchTerm && (
                              <span className="text-slate-500 text-xs">
                                Filtered by: "{searchTerm}"
                              </span>
                            )}
                          </div>
                          <div className="hidden md:flex items-center space-x-2 text-xs text-slate-500">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>Scroll horizontally to view all columns</span>
                          </div>
                        </div>
                      </div>

                      {/* Mobile Card View */}
                      <div className="block md:hidden space-y-4">
                        {filteredData.map((item, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition-shadow"
                          >
                            <div className="space-y-3">
                              {Object.keys(item)
                                .filter(key =>
                                  !key.includes('id') &&
                                  !key.includes('password') &&
                                  key !== 'created_at' &&
                                  key !== 'updated_at'
                                )
                                .map((key, keyIndex) => {
                                  let value = item[key];
                                  if (value === null || value === undefined) value = '-';

                                  return (
                                    <div key={key} className={`flex justify-between items-center ${keyIndex === 0 ? 'pb-2 border-b border-slate-100' : ''}`}>
                                      <span className="text-xs font-medium text-slate-600 uppercase tracking-wider">
                                        {key.replace(/_/g, ' ')}
                                      </span>
                                      <span className="text-sm font-medium text-slate-900 text-right max-w-[60%]">
                                        {(() => {
                                          if (typeof value === 'boolean') {
                                            return (
                                              <Badge className={`text-xs ${value ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                                {value ? 'Yes' : 'No'}
                                              </Badge>
                                            );
                                          }
                                          if (typeof value === 'object') return JSON.stringify(value);
                                          if (key.includes('date') && value !== '-') {
                                            try {
                                              return format(new Date(value), 'PP');
                                            } catch {
                                              return value;
                                            }
                                          }
                                          if (key === 'status') {
                                            return (
                                              <Badge className={`text-xs ${
                                                value === 'active' || value === 'completed' || value === 'paid' ?
                                                'bg-green-100 text-green-800' :
                                                value === 'pending' || value === 'unpaid' ?
                                                'bg-yellow-100 text-yellow-800' :
                                                'bg-red-100 text-red-800'
                                              }`}>
                                                {value.toString()}
                                              </Badge>
                                            );
                                          }
                                          return (
                                            <span className="break-words">
                                              {value.toString()}
                                            </span>
                                          );
                                        })()}
                                      </span>
                                    </div>
                                  );
                                })}
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}