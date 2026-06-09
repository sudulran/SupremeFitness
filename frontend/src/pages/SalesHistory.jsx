import React, { useEffect, useState } from 'react';
import {
  Box,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Alert,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from 'recharts';
import StoreAdminSidebar from '../components/StoreAdminSidebar';
import axiosInstance from '../api/axiosInstance';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// =============================================================================
// SALES HISTORY COMPONENT
// =============================================================================

/**
 * Sales History Dashboard for store administrators
 * Features: Sales analytics, reporting, PDF export, and transaction history
 */
function SalesHistory() {
  // ===========================================================================
  // STATE MANAGEMENT
  // ===========================================================================
  
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [groupBy, setGroupBy] = useState('all');
  const [tabIndex, setTabIndex] = useState(0);
  const [comparisonMode, setComparisonMode] = useState('monthly');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const sidebarWidth = 10; 

  // ===========================================================================
  // DATA FETCHING EFFECT
  // ===========================================================================

  /**
   * Fetches all sales data from the API on component mount
   */
  useEffect(() => {
    const fetchSales = async () => {
      try {
        const response = await axiosInstance.get('/payment/');
        setSales(response.data);
      } catch (err) {
        setError('Failed to fetch sales data.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchSales();
  }, []);

  // ===========================================================================
  // DATA FILTERING AND PROCESSING FUNCTIONS
  // ===========================================================================

  /**
   * Filters sales by card holder name
   * @param {Array} list - Sales data to filter
   * @returns {Array} - Filtered sales data
   */
  const filterSales = (list) =>
    list.filter((sale) =>
      sale.card_holder.toLowerCase().includes(searchTerm.toLowerCase())
    );

  /**
   * Groups sales by month and year for organized display
   * @returns {Object} - Sales grouped by month-year keys
   */
  const groupedSales = sales.reduce((groups, sale) => {
    const date = new Date(sale.createdAt);
    const key = `${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(sale);
    return groups;
  }, {});

  // ===========================================================================
  // CHART DATA PREPARATION
  // ===========================================================================

  /**
   * Prepares monthly sales data for bar chart display
   * @returns {Array} - Monthly sales data for selected year
   */
  const monthlyData = Array.from({ length: 12 }, (_, i) => {
    const monthName = new Date(0, i).toLocaleString('default', { month: 'short' });
    const monthlyTotal = sales
      .filter((sale) => new Date(sale.createdAt).getFullYear() === selectedYear)
      .filter((sale) => new Date(sale.createdAt).getMonth() === i)
      .reduce((sum, s) => sum + s.payment, 0);
    return { name: monthName, total: monthlyTotal };
  });

  /**
   * Calculates yearly sales totals for comparison
   * @returns {Object} - Yearly sales totals
   */
  const yearlyTotals = sales.reduce((years, sale) => {
    const year = new Date(sale.createdAt).getFullYear();
    if (!years[year]) years[year] = 0;
    years[year] += sale.payment;
    return years;
  }, {});

  /**
   * Formats yearly data for chart display
   * @returns {Array} - Yearly sales data sorted by year
   */
  const yearlyData = Object.entries(yearlyTotals)
    .sort(([a], [b]) => b - a)
    .map(([year, total]) => ({ year, total }));

  // ===========================================================================
  // DATE AND TIME UTILITIES
  // ===========================================================================

  const availableYears = [...new Set(sales.map(s => new Date(s.createdAt).getFullYear()))].sort((a, b) => b - a);
  const currentYear = new Date().getFullYear();
  const lastYear = currentYear - 1;
  const currentMonth = new Date().getMonth();

  // ===========================================================================
  // DATA SEGMENTATION FOR ANALYSIS
  // ===========================================================================

  const currentYearSales = sales.filter(sale => new Date(sale.createdAt).getFullYear() === currentYear);
  const lastYearSales = sales.filter(sale => new Date(sale.createdAt).getFullYear() === lastYear);
  const currentMonthSales = sales.filter(
    sale =>
      new Date(sale.createdAt).getFullYear() === currentYear &&
      new Date(sale.createdAt).getMonth() === currentMonth
  );

  // ===========================================================================
  // ANALYTICS CALCULATION FUNCTIONS
  // ===========================================================================

  /**
   * Calculates summary statistics for sales data
   * @param {Array} salesList - Sales data to analyze
   * @returns {Object} - Summary statistics
   */
  const calcSummary = (salesList) => {
    const total = salesList.reduce((sum, s) => sum + s.payment, 0);
    const transactions = salesList.length;
    const highest = salesList.reduce((max, s) => (s.payment > max ? s.payment : max), 0);
    const average = transactions ? total / transactions : 0;
    return { total, transactions, highest, average };
  };

  const currentYearSummary = calcSummary(currentYearSales);
  const lastYearSummary = calcSummary(lastYearSales);
  const currentMonthSummary = calcSummary(currentMonthSales);

  // ===========================================================================
  // PDF REPORT GENERATION
  // ===========================================================================

  /**
   * Generates and downloads a PDF report for current month sales
   * Includes transaction details and summary statistics
   */
  const downloadCurrentMonthReport = () => {
    const doc = new jsPDF();
    const monthName = new Date().toLocaleString('default', { month: 'long' });
    const reportTitle = `Sales Report - ${monthName} ${currentYear}`;

    // =======================================================================
    // PDF HEADER SECTION
    // =======================================================================
    
    // Report title
    doc.setFontSize(20);
    doc.setTextColor(40);
    doc.setFont('helvetica', 'bold');
    doc.text(reportTitle, 14, 20);

    // Generation timestamp
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 28);

    // =======================================================================
    // TRANSACTION TABLE DATA PREPARATION
    // =======================================================================
    
    const tableColumn = ['Card Holder', 'Card Number', 'Date', 'Payment ($)'];
    const tableRows = [];

    currentMonthSales.forEach((sale) => {
      tableRows.push([
        sale.card_holder,
        `**** **** **** ${sale.card_number.slice(-4)}`, // Mask card number for security
        new Date(sale.createdAt).toLocaleDateString(),
        sale.payment.toFixed(2),
      ]);
    });

    // Add total row
    const totalRow = ['TOTAL', '', '', currentMonthSummary.total.toFixed(2)];
    tableRows.push(totalRow);

    // =======================================================================
    // TABLE GENERATION WITH AUTOTABLE
    // =======================================================================
    
    autoTable(doc, {
      startY: 36,
      head: [tableColumn],
      body: tableRows,
      theme: 'grid',
      styles: {
        fontSize: 10,
        cellPadding: 4,
        valign: 'middle',
      },
      headStyles: {
        fillColor: [244, 67, 54], // Red header to match theme
        textColor: 255,
        fontStyle: 'bold',
      },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      didParseCell: function (data) {
        // Style the total row differently
        if (data.row.index === tableRows.length - 1) {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.textColor = [244, 67, 54];
          data.cell.styles.fillColor = [255, 235, 238];
        }
      },
    });

    // =======================================================================
    // SUMMARY SECTION
    // =======================================================================
    
    const summaryStartY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(12);
    doc.setTextColor(40);
    doc.setFont('helvetica', 'bold');
    doc.text('Monthly Summary', 14, summaryStartY);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);

    const summaryData = [
      [`Total Sales:`, `$${currentMonthSummary.total.toFixed(2)}`],
      [`Total Transactions:`, `${currentMonthSummary.transactions}`],
      [`Highest Payment:`, `$${currentMonthSummary.highest.toFixed(2)}`],
      [`Average Payment:`, `$${currentMonthSummary.average.toFixed(2)}`],
    ];

    // Add summary data to PDF
    summaryData.forEach(([label, value], i) => {
      doc.text(label, 14, summaryStartY + 8 + i * 6);
      doc.text(value, 80, summaryStartY + 8 + i * 6);
    });

    // Download the PDF file
    doc.save(`Sales_Report_${currentYear}_${currentMonth + 1}.pdf`);
  };

  // ===========================================================================
  // RENDER COMPONENT
  // ===========================================================================

  return (
    <Box sx={{ display: 'flex', backgroundColor: '#1f2937', color: 'white' }}>
      {/* SIDEBAR NAVIGATION */}
      <StoreAdminSidebar />
      
      {/* MAIN CONTENT AREA */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          ml: { sm: `${sidebarWidth}px` },
          backgroundColor: '#1f2937',
          color: 'white',
          minHeight: '100vh',
        }}
      >
        {/* =====================================================================
        HEADER SECTION: Title and PDF Download Button
        ===================================================================== */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, color: 'white', mb: 0 }}>
            Sales History
          </Typography>
          <button
            onClick={downloadCurrentMonthReport}
            style={{
              padding: '12px 20px',
              backgroundColor: '#f44336',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '14px',
              boxShadow: '0 2px 4px rgba(244, 67, 54, 0.3)',
              transition: 'all 0.3s ease',
            }}
            onMouseOver={(e) => {
              e.target.style.backgroundColor = '#d32f2f';
              e.target.style.transform = 'translateY(-2px)';
            }}
            onMouseOut={(e) => {
              e.target.style.backgroundColor = '#f44336';
              e.target.style.transform = 'translateY(0)';
            }}
          >
            Download Current Month Report (PDF)
          </button>
        </Box>

        {/* =====================================================================
        TAB NAVIGATION: Analysis vs History Views
        ===================================================================== */}
        <Tabs
          value={tabIndex}
          onChange={(e, val) => setTabIndex(val)}
          sx={{ 
            mb: 3, 
            color: 'white', 
            borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
            '& .MuiTabs-indicator': {
              backgroundColor: '#f44336',
            }
          }}
          textColor="inherit"
        >
          <Tab label="Analysis" sx={{ color: 'white', fontWeight: 600, '&.Mui-selected': { color: '#f44336' } }} />
          <Tab label="History" sx={{ color: 'white', fontWeight: 600, '&.Mui-selected': { color: '#f44336' } }} />
        </Tabs>

        {/* =====================================================================
        LOADING STATE
        ===================================================================== */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}>
            <CircularProgress sx={{ color: '#f44336' }} />
          </Box>
        ) : 
        
        /* =====================================================================
        ERROR STATE
        ===================================================================== */
        error ? (
          <Alert severity="error" sx={{ backgroundColor: '#1f2937', color: 'white', border: '1px solid #f44336' }}>
            {error}
          </Alert>
        ) : 
        
        /* =====================================================================
        ANALYSIS TAB CONTENT
        ===================================================================== */
        tabIndex === 0 ? (
          <>
            {/* ANALYSIS CONTROLS */}
            <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', color: 'white' }}>
              {/* COMPARISON MODE SELECTOR */}
              <FormControl sx={{ minWidth: 160 }}>
                <InputLabel sx={{ color: 'white' }}>Comparison Mode</InputLabel>
                <Select
                  value={comparisonMode}
                  label="Comparison Mode"
                  onChange={(e) => setComparisonMode(e.target.value)}
                  sx={{ 
                    color: 'white', 
                    '.MuiSvgIcon-root': { color: 'white' },
                    '.MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#f44336' },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#f44336' }
                  }}
                >
                  <MenuItem value="monthly">Monthly (in Year)</MenuItem>
                  <MenuItem value="yearly">Yearly Comparison</MenuItem>
                </Select>
              </FormControl>

              {/* YEAR SELECTOR (Visible only in monthly mode) */}
              {comparisonMode === 'monthly' && (
                <FormControl sx={{ minWidth: 160 }}>
                  <InputLabel sx={{ color: 'white' }}>Year</InputLabel>
                  <Select
                    value={selectedYear}
                    label="Year"
                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                    sx={{ 
                      color: 'white', 
                      '.MuiSvgIcon-root': { color: 'white' },
                      '.MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                      '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#f44336' },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#f44336' }
                    }}
                  >
                    {availableYears.map((year) => (
                      <MenuItem key={year} value={year}>
                        {year}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            </Box>

            {/* CHARTS AND COMPARISON SECTION */}
            <Box sx={{ display: 'flex', gap: 3, mb: 3, flexWrap: 'wrap', color: 'white' }}>
              {/* SALES CHART */}
              <Paper sx={{ 
                flex: 1, 
                p: 3, 
                minWidth: 300, 
                backgroundColor: '#062043', 
                color: 'white',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '12px'
              }}>
                <Typography variant="h6" gutterBottom sx={{ color: 'white', fontWeight: 600 }}>
                  {comparisonMode === 'monthly'
                    ? `Monthly Sales in ${selectedYear}`
                    : 'Yearly Sales Comparison'}
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={comparisonMode === 'monthly' ? monthlyData : yearlyData}
                    margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                    style={{ backgroundColor: 'transparent' }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.2)" />
                    <XAxis 
                      dataKey={comparisonMode === 'monthly' ? 'name' : 'year'} 
                      stroke="#fff" 
                      fontSize={12}
                    />
                    <YAxis stroke="#fff" fontSize={12} />
                    <Tooltip
                      contentStyle={{ 
                        backgroundColor: '#111827', 
                        border: '1px solid #f44336', 
                        color: 'white',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar 
                      dataKey="total" 
                      fill="#f44336" 
                      stroke="#e57373" 
                      radius={[4, 4, 0, 0]} 
                    />
                  </BarChart>
                </ResponsiveContainer>
              </Paper>

              {/* YEARLY COMPARISON TABLE */}
              <Paper sx={{ 
                flex: 1, 
                p: 3, 
                minWidth: 300, 
                maxWidth: 400, 
                backgroundColor: '#062043', 
                color: 'white',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '12px'
              }}>
                <Typography variant="h6" gutterBottom sx={{ color: 'white', fontWeight: 600 }}>
                  Summary Comparison (Current Year vs Last Year)
                </Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead sx={{ backgroundColor: '#f44336' }}>
                      <TableRow>
                        <TableCell sx={{ color: 'white', fontWeight: 600 }}></TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 600 }}>Current Year ({currentYear})</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 600 }}>Last Year ({lastYear})</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      <TableRow>
                        <TableCell sx={{ color: 'white' }}>Total Sales</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 500 }}>${currentYearSummary.total.toFixed(2)}</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 500 }}>${lastYearSummary.total.toFixed(2)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell sx={{ color: 'white' }}>Total Transactions</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 500 }}>{currentYearSummary.transactions}</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 500 }}>{lastYearSummary.transactions}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell sx={{ color: 'white' }}>Highest Payment</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 500 }}>${currentYearSummary.highest.toFixed(2)}</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 500 }}>${lastYearSummary.highest.toFixed(2)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell sx={{ color: 'white' }}>Average Payment</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 500 }}>${currentYearSummary.average.toFixed(2)}</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 500 }}>${lastYearSummary.average.toFixed(2)}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </Box>

            {/* CURRENT MONTH SUMMARY */}
            <Paper sx={{ 
              p: 3, 
              mb: 3, 
              backgroundColor: '#062043', 
              color: 'white',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '12px'
            }}>
              <Typography variant="h6" gutterBottom sx={{ color: 'white', fontWeight: 600 }}>
                Current Month Summary ({new Date().toLocaleString('default', { month: 'long' })} {currentYear})
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableBody>
                    <TableRow>
                      <TableCell sx={{ color: 'white' }}>Total Sales</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 500 }}>${currentMonthSummary.total.toFixed(2)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ color: 'white' }}>Total Transactions</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 500 }}>{currentMonthSummary.transactions}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ color: 'white' }}>Highest Payment</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 500 }}>${currentMonthSummary.highest.toFixed(2)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ color: 'white' }}>Average Payment</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 500 }}>${currentMonthSummary.average.toFixed(2)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </>
        ) : 
        
        /* =====================================================================
        HISTORY TAB CONTENT
        ===================================================================== */
        (
          <>
            {/* HISTORY CONTROLS */}
            <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', color: 'white' }}>
              {/* SEARCH INPUT */}
              <TextField
                label="Search by Card Holder"
                value={searchTerm}
                fullWidth
                onChange={(e) => setSearchTerm(e.target.value)}
                InputLabelProps={{ style: { color: 'white' } }}
                InputProps={{ 
                  style: { color: 'white' },
                  sx: { 
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#f44336' },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#f44336' }
                  }
                }}
                sx={{ flex: 1 }}
              />
              
              {/* GROUP BY SELECTOR */}
              <FormControl sx={{ minWidth: 160 }}>
                <InputLabel sx={{ color: 'white' }}>Group By</InputLabel>
                <Select
                  value={groupBy}
                  onChange={(e) => setGroupBy(e.target.value)}
                  label="Group By"
                  sx={{ 
                    color: 'white', 
                    '.MuiSvgIcon-root': { color: 'white' },
                    '.MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#f44336' },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#f44336' }
                  }}
                >
                  <MenuItem value="all">All</MenuItem>
                  <MenuItem value="monthly">Monthly</MenuItem>
                </Select>
              </FormControl>
            </Box>

            {/* SALES HISTORY DISPLAY */}
            {groupBy === 'all' ? (
              filterSales(sales).length === 0 ? (
                <Alert severity="info" sx={{ backgroundColor: '#111827', color: 'white', border: '1px solid #2196f3' }}>
                  No matching sales found.
                </Alert>
              ) : (
                <TableContainer component={Paper} sx={{ backgroundColor: '#111827', border: '1px solid rgba(255, 255, 255, 0.12)' }}>
                  <Table>
                    <TableHead sx={{ backgroundColor: '#f44336' }}>
                      <TableRow>
                        <TableCell sx={{ color: 'white', fontWeight: 600 }}>Card Holder</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 600 }}>Card Number</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 600 }}>Date</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 600 }}>Payment</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filterSales(sales).map((sale) => (
                        <TableRow key={sale._id} sx={{ '&:hover': { backgroundColor: 'rgba(244, 67, 54, 0.1)' } }}>
                          <TableCell sx={{ color: 'white' }}>{sale.card_holder}</TableCell>
                          <TableCell sx={{ color: 'white' }}>
                            **** **** **** {sale.card_number.slice(-4)}
                          </TableCell>
                          <TableCell sx={{ color: 'white' }}>
                            {new Date(sale.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell sx={{ color: 'white', fontWeight: 500 }}>${sale.payment.toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                      <TableRow sx={{ backgroundColor: 'rgba(244, 67, 54, 0.2)' }}>
                        <TableCell colSpan={3} sx={{ fontWeight: 'bold', color: 'white' }}>
                          Total
                        </TableCell>
                        <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>
                          ${filterSales(sales).reduce((sum, s) => sum + s.payment, 0).toFixed(2)}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              )
            ) : (
              /* MONTHLY GROUPED DISPLAY */
              Object.entries(groupedSales)
                .sort((a, b) => new Date(b[1][0].createdAt) - new Date(a[1][0].createdAt))
                .map(([monthYear, salesList]) => {
                  const filtered = filterSales(salesList);
                  if (filtered.length === 0) return null;
                  const subtotal = filtered.reduce((sum, s) => sum + s.payment, 0);
                  return (
                    <Box key={monthYear} sx={{ mb: 4 }}>
                      <Typography variant="h6" sx={{ mb: 1, color: 'white', fontWeight: 600 }}>
                        {monthYear}
                      </Typography>
                      <TableContainer component={Paper} sx={{ backgroundColor: '#111827', border: '1px solid rgba(255, 255, 255, 0.12)' }}>
                        <Table>
                          <TableHead sx={{ backgroundColor: '#f44336' }}>
                            <TableRow>
                              <TableCell sx={{ color: 'white', fontWeight: 600 }}>Card Holder</TableCell>
                              <TableCell sx={{ color: 'white', fontWeight: 600 }}>Card Number</TableCell>
                              <TableCell sx={{ color: 'white', fontWeight: 600 }}>Date</TableCell>
                              <TableCell sx={{ color: 'white', fontWeight: 600 }}>Payment</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {filtered.map((sale) => (
                              <TableRow key={sale._id} sx={{ '&:hover': { backgroundColor: 'rgba(244, 67, 54, 0.1)' } }}>
                                <TableCell sx={{ color: 'white' }}>{sale.card_holder}</TableCell>
                                <TableCell sx={{ color: 'white' }}>
                                  **** **** **** {sale.card_number.slice(-4)}
                                </TableCell>
                                <TableCell sx={{ color: 'white' }}>
                                  {new Date(sale.createdAt).toLocaleDateString()}
                                </TableCell>
                                <TableCell sx={{ color: 'white', fontWeight: 500 }}>${sale.payment.toFixed(2)}</TableCell>
                              </TableRow>
                            ))}
                            <TableRow sx={{ backgroundColor: 'rgba(244, 67, 54, 0.2)' }}>
                              <TableCell colSpan={3} sx={{ fontWeight: 'bold', color: 'white' }}>
                                Total for {monthYear}
                              </TableCell>
                              <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>
                                ${subtotal.toFixed(2)}
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Box>
                  );
                })
            )}
          </>
        )}
      </Box>
    </Box>
  );
}

export default SalesHistory;