import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// ── Mock data ─────────────────────────────────────────────────────────────────
const MOCK_PROPERTIES = [
  { _id: 'p1', title: 'Modern Villa in Kezira', type: 'residential', listingType: 'sale', price: 4500000, verificationStatus: 'PENDING', createdAt: '2026-03-10T08:00:00Z', owner: { name: 'Abebe Girma', email: 'abebe@example.com', phone: '+251911234567' }, address: { street: 'Kezira Road 12', city: 'Dire Dawa', state: 'Dire Dawa', country: 'Ethiopia' }, bedrooms: 4, bathrooms: 3, size: 320, documents: [{ _id: 'd1', documentType: 'title_deed', verificationStatus: 'PENDING', url: '#' }, { _id: 'd2', documentType: 'id_card', verificationStatus: 'PENDING', url: '#' }] },
  { _id: 'p2', title: 'Commercial Space - Sabian Market', type: 'commercial', listingType: 'rent', price: 85000, verificationStatus: 'PENDING', createdAt: '2026-03-11T09:30:00Z', owner: { name: 'Fatuma Hassan', email: 'fatuma@example.com', phone: '+251922345678' }, address: { street: 'Sabian Main St', city: 'Dire Dawa', state: 'Dire Dawa', country: 'Ethiopia' }, bedrooms: 0, bathrooms: 2, size: 180, documents: [{ _id: 'd3', documentType: 'business_license', verificationStatus: 'PENDING', url: '#' }] },
  { _id: 'p3', title: 'Land Plot - Legehare', type: 'land', listingType: 'sale', price: 1200000, verificationStatus: 'IN_REVIEW', createdAt: '2026-03-12T11:00:00Z', owner: { name: 'Dawit Tesfaye', email: 'dawit@example.com', phone: '+251933456789' }, address: { street: 'Legehare Zone 3', city: 'Dire Dawa', state: 'Dire Dawa', country: 'Ethiopia' }, bedrooms: 0, bathrooms: 0, size: 600, documents: [] },
  { _id: 'p4', title: 'Apartment - Gendekore', type: 'residential', listingType: 'rent', price: 22000, verificationStatus: 'PENDING', createdAt: '2026-03-13T07:45:00Z', owner: { name: 'Meron Alemu', email: 'meron@example.com', phone: '+251944567890' }, address: { street: 'Gendekore Block B', city: 'Dire Dawa', state: 'Dire Dawa', country: 'Ethiopia' }, bedrooms: 2, bathrooms: 1, size: 95, documents: [{ _id: 'd4', documentType: 'rental_agreement', verificationStatus: 'PENDING', url: '#' }] },
  { _id: 'p5', title: 'Industrial Warehouse - Melka Jebdu', type: 'industrial', listingType: 'sale', price: 9800000, verificationStatus: 'PENDING', createdAt: '2026-03-14T10:15:00Z', owner: { name: 'Yonas Bekele', email: 'yonas@example.com', phone: '+251955678901' }, address: { street: 'Industrial Zone 7', city: 'Dire Dawa', state: 'Dire Dawa', country: 'Ethiopia' }, bedrooms: 0, bathrooms: 4, size: 1200, documents: [{ _id: 'd5', documentType: 'title_deed', verificationStatus: 'PENDING', url: '#' }] },
  { _id: 'p6', title: 'Studio Apartment - Addis Ketema', type: 'residential', listingType: 'rent', price: 12000, verificationStatus: 'PENDING', createdAt: '2026-03-15T08:30:00Z', owner: { name: 'Hana Tadesse', email: 'hana@example.com', phone: '+251966789012' }, address: { street: 'Addis Ketema St 5', city: 'Dire Dawa', state: 'Dire Dawa', country: 'Ethiopia' }, bedrooms: 1, bathrooms: 1, size: 55, documents: [] },
  { _id: 'p7', title: 'Office Building - Dire Dawa City Center', type: 'commercial', listingType: 'sale', price: 15000000, verificationStatus: 'IN_REVIEW', createdAt: '2026-03-16T09:00:00Z', owner: { name: 'Solomon Haile', email: 'solomon@example.com', phone: '+251977890123' }, address: { street: 'City Center Ave 1', city: 'Dire Dawa', state: 'Dire Dawa', country: 'Ethiopia' }, bedrooms: 0, bathrooms: 6, size: 850, documents: [{ _id: 'd6', documentType: 'title_deed', verificationStatus: 'VERIFIED', url: '#' }, { _id: 'd7', documentType: 'building_permit', verificationStatus: 'PENDING', url: '#' }] },
  { _id: 'p8', title: 'Family Home - Ashewa', type: 'residential', listingType: 'sale', price: 3200000, verificationStatus: 'PENDING', createdAt: '2026-03-17T14:00:00Z', owner: { name: 'Tigist Worku', email: 'tigist@example.com', phone: '+251988901234' }, address: { street: 'Ashewa Kebele 4', city: 'Dire Dawa', state: 'Dire Dawa', country: 'Ethiopia' }, bedrooms: 3, bathrooms: 2, size: 210, documents: [{ _id: 'd8', documentType: 'title_deed', verificationStatus: 'PENDING', url: '#' }] },
];

const MOCK_STATS = {
  all: { total: 42, PENDING: 8, IN_REVIEW: 2, VERIFIED: 28, REJECTED: 4, verificationRate: '73%', avgVerificationTimeHours: '18h' },
  today: { VERIFIED: 3, REJECTED: 1 },
};

const MOCK_HISTORY = [
  { _id: 'h1', actionType: 'SUBMITTED', performedBy: { name: 'Abebe Girma' }, notes: 'Initial submission', timestamp: '2026-03-10T08:00:00Z' },
  { _id: 'h2', actionType: 'IN_REVIEW', performedBy: { name: 'Admin User' }, notes: 'Started review process', timestamp: '2026-03-11T10:00:00Z' },
];

const delay = (ms = 500) => new Promise((r) => setTimeout(r, ms));

// ── Thunks ────────────────────────────────────────────────────────────────────
export const fetchDashboardStats = createAsyncThunk(
  'verification/fetchDashboardStats',
  async () => { await delay(); return MOCK_STATS; }
);

export const fetchPendingVerifications = createAsyncThunk(
  'verification/fetchPending',
  async ({ page = 1, limit = 15, type, search } = {}) => {
    await delay();
    let filtered = [...MOCK_PROPERTIES];
    if (type && type !== 'All') filtered = filtered.filter((p) => p.type === type);
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter((p) =>
        p.title.toLowerCase().includes(q) || p.owner?.name.toLowerCase().includes(q)
      );
    }
    const start = (page - 1) * limit;
    return {
      properties: filtered.slice(start, start + limit),
      pagination: { total: filtered.length, page, limit, pages: Math.ceil(filtered.length / limit) },
    };
  }
);

export const fetchPropertyDetails = createAsyncThunk(
  'verification/fetchPropertyDetails',
  async (propertyId) => {
    await delay();
    return MOCK_PROPERTIES.find((p) => p._id === propertyId) || MOCK_PROPERTIES[0];
  }
);

export const approveProperty = createAsyncThunk(
  'verification/approve',
  async ({ propertyId, notes }, { dispatch }) => {
    await delay(700);
    const prop = MOCK_PROPERTIES.find((p) => p._id === propertyId);
    const updated = { ...prop, verificationStatus: 'VERIFIED', verificationNotes: notes, verificationDate: new Date().toISOString() };
    dispatch(fetchPendingVerifications());
    dispatch(fetchDashboardStats());
    return updated;
  }
);

export const rejectProperty = createAsyncThunk(
  'verification/reject',
  async ({ propertyId, notes }, { dispatch }) => {
    await delay(700);
    const prop = MOCK_PROPERTIES.find((p) => p._id === propertyId);
    const updated = { ...prop, verificationStatus: 'REJECTED', verificationNotes: notes, verificationDate: new Date().toISOString() };
    dispatch(fetchPendingVerifications());
    dispatch(fetchDashboardStats());
    return updated;
  }
);

export const bulkVerificationAction = createAsyncThunk(
  'verification/bulkAction',
  async ({ propertyIds, action, notes }, { dispatch }) => {
    await delay(800);
    dispatch(fetchPendingVerifications());
    dispatch(fetchDashboardStats());
    return { message: `Bulk ${action} completed`, processed: propertyIds.length, failed: 0 };
  }
);

// Mock history fetch used directly in PropertyReview via api — we'll handle via slice too
export const fetchPropertyHistory = createAsyncThunk(
  'verification/fetchHistory',
  async (propertyId) => { await delay(300); return MOCK_HISTORY; }
);

// ── Slice ─────────────────────────────────────────────────────────────────────
const removePending = (state, propertyId) => {
  state.pendingProperties = state.pendingProperties.filter((p) => p._id !== propertyId);
};

const verificationSlice = createSlice({
  name: 'verification',
  initialState: {
    pendingProperties: [],
    pagination: { total: 0, page: 1, limit: 15, pages: 1 },
    selectedProperty: null,
    dashboardStats: null,
    statsLoading: false,
    isLoading: false,
    actionLoading: false,
    bulkLoading: false,
    bulkResult: null,
    error: null,
    actionError: null,
  },
  reducers: {
    clearSelectedProperty(state) { state.selectedProperty = null; },
    clearError(state) { state.error = null; },
    clearActionError(state) { state.actionError = null; },
    clearBulkResult(state) { state.bulkResult = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboardStats.pending, (state) => { state.statsLoading = true; })
      .addCase(fetchDashboardStats.fulfilled, (state, action) => { state.statsLoading = false; state.dashboardStats = action.payload; })
      .addCase(fetchDashboardStats.rejected, (state) => { state.statsLoading = false; })

      .addCase(fetchPendingVerifications.pending, (state) => { state.isLoading = true; state.error = null; })
      .addCase(fetchPendingVerifications.fulfilled, (state, action) => { state.isLoading = false; state.pendingProperties = action.payload.properties; state.pagination = action.payload.pagination; })
      .addCase(fetchPendingVerifications.rejected, (state, action) => { state.isLoading = false; state.error = action.payload; })

      .addCase(fetchPropertyDetails.pending, (state) => { state.isLoading = true; state.error = null; state.selectedProperty = null; })
      .addCase(fetchPropertyDetails.fulfilled, (state, action) => { state.isLoading = false; state.selectedProperty = action.payload; })
      .addCase(fetchPropertyDetails.rejected, (state, action) => { state.isLoading = false; state.error = action.payload; })

      .addCase(approveProperty.pending, (state) => { state.actionLoading = true; state.actionError = null; })
      .addCase(approveProperty.fulfilled, (state, action) => { state.actionLoading = false; removePending(state, action.payload._id); if (state.selectedProperty?._id === action.payload._id) state.selectedProperty = action.payload; })
      .addCase(approveProperty.rejected, (state, action) => { state.actionLoading = false; state.actionError = action.payload; })

      .addCase(rejectProperty.pending, (state) => { state.actionLoading = true; state.actionError = null; })
      .addCase(rejectProperty.fulfilled, (state, action) => { state.actionLoading = false; removePending(state, action.payload._id); if (state.selectedProperty?._id === action.payload._id) state.selectedProperty = action.payload; })
      .addCase(rejectProperty.rejected, (state, action) => { state.actionLoading = false; state.actionError = action.payload; })

      .addCase(bulkVerificationAction.pending, (state) => { state.bulkLoading = true; state.actionError = null; })
      .addCase(bulkVerificationAction.fulfilled, (state, action) => { state.bulkLoading = false; state.bulkResult = action.payload; })
      .addCase(bulkVerificationAction.rejected, (state, action) => { state.bulkLoading = false; state.actionError = action.payload; });
  },
});

export const { clearSelectedProperty, clearError, clearActionError, clearBulkResult } = verificationSlice.actions;
export default verificationSlice.reducer;
