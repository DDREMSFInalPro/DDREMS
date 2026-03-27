import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box, Typography, Card, CardContent, CardHeader, Grid, Button,
  RadioGroup, FormControlLabel, Radio, FormControl, FormLabel,
  Select, MenuItem, InputLabel, Alert, Divider, Chip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  CircularProgress,
} from '@mui/material';
import {
  LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { FileDownload, PictureAsPdf, Assessment, Print } from '@mui/icons-material';
import { generateSalesReport, generateRentalReport } from '../store/slices/reportSlice.js';
import { exportToExcel, exportToPDF } from '../utils/reportExport.js';

const PIE_COLORS = ['#1565c0', '#2e7d32', '#f57c00', '#6a1b9a', '#c62828'];
const PROPERTY_TYPES = ['', 'residential', 'commercial', 'land', 'industrial'];
const fmt = (n) => (n != null ? `ETB ${Number(n).toLocaleString()}` : '—');
const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const monthLabel = (m) =>
  m?._id ? `${MONTHS[(m._id.month ?? 1) - 1]} ${m._id.year}` : null;

const SummaryCard = ({ label, value, color = 'primary.main' }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Typography variant="caption" color="text.secondary" textTransform="uppercase" letterSpacing={1}>
        {label}
      </Typography>
      <Typography variant="h5" fontWeight={700} color={color} mt={0.5}>
        {value ?? '—'}
      </Typography>
    </CardContent>
  </Card>
);

const ChartCard = ({ title, children }) => (
  <Card sx={{ height: '100%' }}>
    <CardHeader title={<Typography variant="subtitle1">{title}</Typography>} />
    <Divider />
    <CardContent>{children}</CardContent>
  </Card>
);

export default function Reports() {
  const dispatch = useDispatch();
  const { currentReport, isLoading, error } = useSelector((s) => s.reports);

  const [reportType, setReportType] = useState('sales');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [propertyType, setPropertyType] = useState('');
  const [validationError, setValidationError] = useState('');

  const handleGenerate = () => {
    if (!startDate || !endDate) {
      setValidationError('Please select both a start date and an end date.');
      return;
    }
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      setValidationError('Invalid date format.');
      return;
    }
    if (start > end) {
      setValidationError('Start date must be before end date.');
      return;
    }
    setValidationError('');
    const filters = { startDate, endDate, ...(propertyType && { propertyType }) };
    dispatch(reportType === 'sales' ? generateSalesReport(filters) : generateRentalReport(filters));
  };

  const isSales = currentReport?.type === 'sales';
  const summary = currentReport?.summary;

  // Safe chart data — filter out entries with null _id
  const byMonth = (currentReport?.byMonth || [])
    .filter((m) => m?._id)
    .map((m) => ({
      name: monthLabel(m),
      count: m.count ?? 0,
      revenue: m.totalRevenue ?? m.totalIncome ?? 0,
    }));

  const byType = (currentReport?.byType || [])
    .filter((t) => t?._id)
    .map((t) => ({ name: t._id, value: t.count ?? 0 }));

  const dateInputStyle = {
    padding: '8px 12px', borderRadius: 4, border: '1px solid #ccc',
    fontSize: '0.875rem', fontFamily: 'inherit', width: '100%',
  };

  return (
    <Box>
      <Typography variant="h5" mb={0.5}>Reports</Typography>
      <Typography color="text.secondary" mb={3}>
        Generate sales and rental performance reports.
      </Typography>

      {/* Config panel */}
      <Card className="no-print" sx={{ mb: 3 }}>
        <CardHeader
          title={<Typography variant="subtitle1">Report Configuration</Typography>}
          avatar={<Assessment color="primary" />}
        />
        <Divider />
        <CardContent>
          <Grid container spacing={3} alignItems="flex-end">
            <Grid item xs={12} sm={6} md={3}>
              <FormControl>
                <FormLabel sx={{ fontSize: '0.8rem', mb: 0.5 }}>Report Type</FormLabel>
                <RadioGroup row value={reportType} onChange={(e) => setReportType(e.target.value)}>
                  <FormControlLabel value="sales" control={<Radio size="small" />} label="Sales" />
                  <FormControlLabel value="rentals" control={<Radio size="small" />} label="Rentals" />
                </RadioGroup>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={2}>
              <FormLabel sx={{ fontSize: '0.8rem', display: 'block', mb: 0.5 }}>Start Date</FormLabel>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={dateInputStyle} />
            </Grid>

            <Grid item xs={12} sm={6} md={2}>
              <FormLabel sx={{ fontSize: '0.8rem', display: 'block', mb: 0.5 }}>End Date</FormLabel>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={dateInputStyle} />
            </Grid>

            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Property Type</InputLabel>
                <Select value={propertyType} label="Property Type" onChange={(e) => setPropertyType(e.target.value)}>
                  {PROPERTY_TYPES.map((t) => (
                    <MenuItem key={t || 'all'} value={t} sx={{ textTransform: 'capitalize' }}>
                      {t === '' ? 'All Types' : t}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={3}>
              <Button fullWidth variant="contained" size="large" onClick={handleGenerate} disabled={isLoading}>
                {isLoading ? <CircularProgress size={22} color="inherit" /> : 'Generate Report'}
              </Button>
            </Grid>
          </Grid>

          {validationError && <Alert severity="warning" sx={{ mt: 2 }}>{validationError}</Alert>}
          {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
        </CardContent>
      </Card>

      {/* Report output */}
      {currentReport && (
        <>
          {/* Export buttons */}
          <Box className="no-print" sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mb: 2 }}>
            <Button
              variant="outlined"
              startIcon={<Print />}
              onClick={() => window.print()}
            >
              Print
            </Button>
            <Button
              variant="outlined"
              startIcon={<FileDownload />}
              onClick={() => exportToExcel(currentReport, `${currentReport.type}-report`)}
            >
              Export Excel
            </Button>
            <Button
              variant="outlined"
              color="error"
              startIcon={<PictureAsPdf />}
              onClick={() => exportToPDF(currentReport, isSales ? 'Sales Report' : 'Rentals Report', `${currentReport.type}-report`)}
            >
              Export PDF
            </Button>
          </Box>

          {/* Summary cards */}
          <Grid container spacing={2} mb={3}>
            {isSales ? (
              <>
                <Grid item xs={12} sm={4}><SummaryCard label="Total Properties" value={summary?.totalProperties} /></Grid>
                <Grid item xs={12} sm={4}><SummaryCard label="Total Revenue" value={fmt(summary?.totalRevenue)} color="success.main" /></Grid>
                <Grid item xs={12} sm={4}><SummaryCard label="Average Price" value={fmt(summary?.averagePrice)} color="info.main" /></Grid>
              </>
            ) : (
              <>
                <Grid item xs={12} sm={3}><SummaryCard label="Total Rentals" value={summary?.totalProperties} /></Grid>
                <Grid item xs={12} sm={3}><SummaryCard label="Active Rentals" value={summary?.activeRentals} color="success.main" /></Grid>
                <Grid item xs={12} sm={3}><SummaryCard label="Monthly Income" value={fmt(summary?.totalMonthlyIncome)} color="success.main" /></Grid>
                <Grid item xs={12} sm={3}><SummaryCard label="Average Rent" value={fmt(summary?.averageRent)} color="info.main" /></Grid>
              </>
            )}
          </Grid>

          {/* Charts */}
          <Grid container spacing={3} mb={3}>
            <Grid item xs={12} md={7}>
              <ChartCard title="Monthly Performance">
                {byMonth.length === 0 ? (
                  <Typography color="text.secondary" textAlign="center" py={4}>No monthly data for this period.</Typography>
                ) : (
                  <ResponsiveContainer width="100%" height={260}>
                    <LineChart data={byMonth} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                      <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(v, n) => [n === 'revenue' ? fmt(v) : v, n]} />
                      <Legend />
                      <Line yAxisId="left" type="monotone" dataKey="count" stroke="#1565c0" strokeWidth={2} dot={{ r: 4 }} name="Properties" />
                      <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="#2e7d32" strokeWidth={2} dot={{ r: 4 }} name={isSales ? 'Revenue' : 'Income'} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </ChartCard>
            </Grid>

            <Grid item xs={12} md={5}>
              <ChartCard title="Breakdown by Type">
                {byType.length === 0 ? (
                  <Typography color="text.secondary" textAlign="center" py={4}>No type data available.</Typography>
                ) : (
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie
                        data={byType}
                        cx="50%" cy="50%"
                        outerRadius={90}
                        dataKey="value"
                        nameKey="name"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                        fill="#1565c0"
                      >
                        {byType.map((entry, i) => (
                          <Cell key={entry.name} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </ChartCard>
            </Grid>
          </Grid>

          {/* Data table */}
          <Card>
            <CardHeader title={<Typography variant="subtitle1">Property List ({currentReport.properties?.length ?? 0})</Typography>} />
            <Divider />
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    {['Title', 'Type', 'Price', 'Owner', 'Status', 'Date'].map((h) => (
                      <TableCell key={h}>{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {!currentReport.properties?.length ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                        No properties found for the selected filters.
                      </TableCell>
                    </TableRow>
                  ) : (
                    currentReport.properties.map((p) => (
                      <TableRow key={p._id} hover>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600} noWrap sx={{ maxWidth: 180 }}>
                            {p.title ?? '—'}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ textTransform: 'capitalize' }}>{p.type ?? '—'}</TableCell>
                        <TableCell sx={{ whiteSpace: 'nowrap' }}>{fmt(p.price)}</TableCell>
                        <TableCell sx={{ maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {p.owner?.name ?? '—'}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={p.verificationStatus ?? 'PENDING'}
                            size="small"
                            color={
                              p.verificationStatus === 'VERIFIED' ? 'success' :
                              p.verificationStatus === 'REJECTED' ? 'error' :
                              p.verificationStatus === 'IN_REVIEW' ? 'info' : 'warning'
                            }
                          />
                        </TableCell>
                        <TableCell sx={{ whiteSpace: 'nowrap' }}>{fmtDate(p.createdAt)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </>
      )}
    </Box>
  );
}
