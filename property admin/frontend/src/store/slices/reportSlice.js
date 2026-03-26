import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

const delay = (ms = 700) => new Promise((r) => setTimeout(r, ms));

const MOCK_SALES_REPORT = {
  type: 'sales',
  summary: { totalProperties: 18, totalRevenue: 87400000, averagePrice: 4855556 },
  byMonth: [
    { _id: { year: 2026, month: 1 }, count: 3, totalRevenue: 12500000 },
    { _id: { year: 2026, month: 2 }, count: 5, totalRevenue: 24800000 },
    { _id: { year: 2026, month: 3 }, count: 10, totalRevenue: 50100000 },
  ],
  byType: [
    { _id: 'residential', count: 10 },
    { _id: 'commercial', count: 4 },
    { _id: 'land', count: 3 },
    { _id: 'industrial', count: 1 },
  ],
  properties: [
    { _id: 'p1', title: 'Modern Villa in Kezira', type: 'residential', price: 4500000, owner: { name: 'Abebe Girma' }, verificationStatus: 'VERIFIED', createdAt: '2026-03-10T08:00:00Z' },
    { _id: 'p5', title: 'Industrial Warehouse - Melka Jebdu', type: 'industrial', price: 9800000, owner: { name: 'Yonas Bekele' }, verificationStatus: 'VERIFIED', createdAt: '2026-03-14T10:15:00Z' },
    { _id: 'p7', title: 'Office Building - City Center', type: 'commercial', price: 15000000, owner: { name: 'Solomon Haile' }, verificationStatus: 'IN_REVIEW', createdAt: '2026-03-16T09:00:00Z' },
    { _id: 'p8', title: 'Family Home - Ashewa', type: 'residential', price: 3200000, owner: { name: 'Tigist Worku' }, verificationStatus: 'PENDING', createdAt: '2026-03-17T14:00:00Z' },
    { _id: 'p3', title: 'Land Plot - Legehare', type: 'land', price: 1200000, owner: { name: 'Dawit Tesfaye' }, verificationStatus: 'VERIFIED', createdAt: '2026-03-12T11:00:00Z' },
  ],
};

const MOCK_RENTAL_REPORT = {
  type: 'rentals',
  summary: { totalProperties: 12, activeRentals: 9, totalMonthlyIncome: 312000, averageRent: 26000 },
  byMonth: [
    { _id: { year: 2026, month: 1 }, count: 2, totalIncome: 52000 },
    { _id: { year: 2026, month: 2 }, count: 4, totalIncome: 104000 },
    { _id: { year: 2026, month: 3 }, count: 6, totalIncome: 156000 },
  ],
  byType: [
    { _id: 'residential', count: 8 },
    { _id: 'commercial', count: 4 },
  ],
  properties: [
    { _id: 'p2', title: 'Commercial Space - Sabian Market', type: 'commercial', price: 85000, owner: { name: 'Fatuma Hassan' }, verificationStatus: 'VERIFIED', createdAt: '2026-03-11T09:30:00Z' },
    { _id: 'p4', title: 'Apartment - Gendekore', type: 'residential', price: 22000, owner: { name: 'Meron Alemu' }, verificationStatus: 'PENDING', createdAt: '2026-03-13T07:45:00Z' },
    { _id: 'p6', title: 'Studio Apartment - Addis Ketema', type: 'residential', price: 12000, owner: { name: 'Hana Tadesse' }, verificationStatus: 'VERIFIED', createdAt: '2026-03-15T08:30:00Z' },
  ],
};

export const generateSalesReport = createAsyncThunk(
  'reports/sales',
  async () => { await delay(); return MOCK_SALES_REPORT; }
);

export const generateRentalReport = createAsyncThunk(
  'reports/rentals',
  async () => { await delay(); return MOCK_RENTAL_REPORT; }
);

export const fetchVerificationStats = createAsyncThunk(
  'reports/verificationStats',
  async () => { await delay(); return { type: 'verification-stats', summary: MOCK_SALES_REPORT.summary }; }
);

const reportSlice = createSlice({
  name: 'reports',
  initialState: { currentReport: null, isLoading: false, error: null },
  reducers: {
    clearReport(state) { state.currentReport = null; state.error = null; },
  },
  extraReducers: (builder) => {
    const pending = (state) => { state.isLoading = true; state.error = null; };
    const rejected = (state, action) => { state.isLoading = false; state.error = action.payload; };
    const fulfilled = (state, action) => { state.isLoading = false; state.currentReport = action.payload; };
    builder
      .addCase(generateSalesReport.pending, pending).addCase(generateSalesReport.fulfilled, fulfilled).addCase(generateSalesReport.rejected, rejected)
      .addCase(generateRentalReport.pending, pending).addCase(generateRentalReport.fulfilled, fulfilled).addCase(generateRentalReport.rejected, rejected)
      .addCase(fetchVerificationStats.pending, pending).addCase(fetchVerificationStats.fulfilled, fulfilled).addCase(fetchVerificationStats.rejected, rejected);
  },
});

export const { clearReport } = reportSlice.actions;
export default reportSlice.reducer;
