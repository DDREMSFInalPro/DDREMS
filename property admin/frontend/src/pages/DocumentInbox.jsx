import { useEffect, useState, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Card, CardContent, TextField, MenuItem, Select, FormControl, InputLabel,
  InputAdornment, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Chip, Button, Skeleton, Alert, TablePagination, IconButton, Tooltip, Grid, Dialog,
  DialogTitle, DialogContent, DialogActions, List, ListItem, ListItemText, Divider,
  Tab, Tabs, Badge, Checkbox, Toolbar,
} from '@mui/material';
import {
  Search, Folder, Download, Visibility, CheckCircle, Cancel, PendingActions, Description,
  FilterList, Warning, Send, Report, ErrorOutline, FileDownload, PictureAsPdf,
} from '@mui/icons-material';
import { useDebounce } from '../utils/useDebounce.js';
import {
  DocumentActionMenu, VerifyDocumentDialog, RejectDocumentDialog,
  AddNoteDialog, DocumentPreviewDialog,
} from '../components/DocumentActions.jsx';
import * as XLSX from 'xlsx';

const REQUIRED_DOCS = {
  residential: ['title_deed', 'id_card'],
  commercial: ['title_deed', 'business_license', 'tax_clearance'],
  land: ['title_deed', 'survey_map'],
  industrial: ['title_deed', 'building_permit', 'environmental_clearance'],
};

const MOCK_DOCUMENTS = [
  { _id: 'd1', propertyId: 'p1', propertyTitle: 'Modern Villa in Kezira', documentType: 'title_deed', fileName: 'title_deed_villa_kezira.pdf', uploadDate: '2026-03-10T08:15:00Z', verificationStatus: 'PENDING', owner: { name: 'Abebe Girma', email: 'abebe@example.com' }, fileSize: '2.4 MB', url: '#' },
  { _id: 'd2', propertyId: 'p1', propertyTitle: 'Modern Villa in Kezira', documentType: 'id_card', fileName: 'owner_id_abebe.pdf', uploadDate: '2026-03-10T08:16:00Z', verificationStatus: 'VERIFIED', owner: { name: 'Abebe Girma', email: 'abebe@example.com' }, fileSize: '1.2 MB', url: '#' },
  { _id: 'd3', propertyId: 'p2', propertyTitle: 'Commercial Space - Sabian Market', documentType: 'business_license', fileName: 'business_license_sabian.pdf', uploadDate: '2026-03-11T09:45:00Z', verificationStatus: 'PENDING', owner: { name: 'Fatuma Hassan', email: 'fatuma@example.com' }, fileSize: '1.8 MB', url: '#' },
  { _id: 'd4', propertyId: 'p4', propertyTitle: 'Apartment - Gendekore', documentType: 'rental_agreement', fileName: 'rental_agreement_gendekore.pdf', uploadDate: '2026-03-13T08:00:00Z', verificationStatus: 'PENDING', owner: { name: 'Meron Alemu', email: 'meron@example.com' }, fileSize: '980 KB', url: '#' },
  { _id: 'd5', propertyId: 'p5', propertyTitle: 'Industrial Warehouse - Melka Jebdu', documentType: 'title_deed', fileName: 'warehouse_title_deed.pdf', uploadDate: '2026-03-14T10:30:00Z', verificationStatus: 'VERIFIED', owner: { name: 'Yonas Bekele', email: 'yonas@example.com' }, fileSize: '3.1 MB', url: '#' },
  { _id: 'd6', propertyId: 'p7', propertyTitle: 'Office Building - City Center', documentType: 'title_deed', fileName: 'office_title_deed.pdf', uploadDate: '2026-03-16T09:15:00Z', verificationStatus: 'VERIFIED', owner: { name: 'Solomon Haile', email: 'solomon@example.com' }, fileSize: '2.7 MB', url: '#' },
  { _id: 'd7', propertyId: 'p7', propertyTitle: 'Office Building - City Center', documentType: 'building_permit', fileName: 'building_permit_office.pdf', uploadDate: '2026-03-16T09:16:00Z', verificationStatus: 'PENDING', owner: { name: 'Solomon Haile', email: 'solomon@example.com' }, fileSize: '1.5 MB', url: '#' },
  { _id: 'd8', propertyId: 'p8', propertyTitle: 'Family Home - Ashewa', documentType: 'title_deed', fileName: 'home_title_ashewa.pdf', uploadDate: '2026-03-17T14:15:00Z', verificationStatus: 'REJECTED', owner: { name: 'Tigist Worku', email: 'tigist@example.com' }, fileSize: '2.2 MB', url: '#' },
  { _id: 'd9', propertyId: 'p3', propertyTitle: 'Land Plot - Legehare', documentType: 'survey_map', fileName: 'land_survey_legehare.pdf', uploadDate: '2026-03-12T11:30:00Z', verificationStatus: 'PENDING', owner: { name: 'Dawit Tesfaye', email: 'dawit@example.com' }, fileSize: '4.5 MB', url: '#' },
  { _id: 'd10', propertyId: 'p2', propertyTitle: 'Commercial Space - Sabian Market', documentType: 'tax_clearance', fileName: 'tax_clearance_sabian.pdf', uploadDate: '2026-03-11T09:50:00Z', verificationStatus: 'VERIFIED', owner: { name: 'Fatuma Hassan', email: 'fatuma@example.com' }, fileSize: '850 KB', url: '#' },
];

const MOCK_PROPERTIES = [
  { _id: 'p1', title: 'Modern Villa in Kezira', type: 'residential', owner: { name: 'Abebe Girma', email: 'abebe@example.com' } },
  { _id: 'p2', title: 'Commercial Space - Sabian Market', type: 'commercial', owner: { name: 'Fatuma Hassan', email: 'fatuma@example.com' } },
  { _id: 'p3', title: 'Land Plot - Legehare', type: 'land', owner: { name: 'Dawit Tesfaye', email: 'dawit@example.com' } },
  { _id: 'p4', title: 'Apartment - Gendekore', type: 'residential', owner: { name: 'Meron Alemu', email: 'meron@example.com' } },
  { _id: 'p5', title: 'Industrial Warehouse - Melka Jebdu', type: 'industrial', owner: { name: 'Yonas Bekele', email: 'yonas@example.com' } },
  { _id: 'p7', title: 'Office Building - City Center', type: 'commercial', owner: { name: 'Solomon Haile', email: 'solomon@example.com' } },
  { _id: 'p8', title: 'Family Home - Ashewa', type: 'residential', owner: { name: 'Tigist Worku', email: 'tigist@example.com' } },
];

const DOC_TYPES = ['All', 'title_deed', 'id_card', 'business_license', 'rental_agreement', 'building_permit', 'survey_map', 'tax_clearance', 'environmental_clearance'];
const DOC_STATUS = ['All', 'PENDING', 'VERIFIED', 'REJECTED'];

const STATUS_CONFIG = {
  PENDING: { color: 'warning', label: 'Pending', icon: <PendingActions fontSize="small" /> },
  VERIFIED: { color: 'success', label: 'Verified', icon: <CheckCircle fontSize="small" /> },
  REJECTED: { color: 'error', label: 'Rejected', icon: <Cancel fontSize="small" /> },
};

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
const formatDocType = (type) => type?.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) || '—';
const getMissingDocs = (propertyId, propertyType) => {
  const required = REQUIRED_DOCS[propertyType] || [];
  const uploaded = MOCK_DOCUMENTS.filter((d) => d.propertyId === propertyId).map((d) => d.documentType);
  return required.filter((r) => !uploaded.includes(r));
};

const SummaryCard = memo(function SummaryCard({ icon, label, value, color = 'primary.main', onClick }) {
  return (
    <Card sx={{ height: '100%', cursor: onClick ? 'pointer' : 'default', '&:hover': onClick ? { boxShadow: 4 } : {} }} onClick={onClick}>
      <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: `${color.split('.')[0]}.50`, color, display: 'flex' }}>
          {icon}
        </Box>
        <Box>
          <Typography variant="h5" fontWeight={700} color={color}>{value}</Typography>
          <Typography variant="body2" color="text.secondary">{label}</Typography>
        </Box>
      </CardContent>
    </Card>
  );
});

const DocumentRow = memo(function DocumentRow({ doc, isChecked, onToggle, onView, onDownload, onNavigate, onVerify, onReject, onAddNote }) {
  const status = STATUS_CONFIG[doc.verificationStatus] || STATUS_CONFIG.PENDING;
  return (
    <TableRow hover selected={isChecked}>
      <TableCell padding="checkbox">
        <Checkbox checked={isChecked} onChange={() => onToggle(doc._id)} />
      </TableCell>
      <TableCell>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Description color="action" fontSize="small" />
          <Box>
            <Typography variant="body2" fontWeight={600} noWrap sx={{ maxWidth: 200 }}>{doc.fileName}</Typography>
            <Typography variant="caption" color="text.secondary">{doc.fileSize}</Typography>
          </Box>
        </Box>
      </TableCell>
      <TableCell sx={{ textTransform: 'capitalize' }}>{formatDocType(doc.documentType)}</TableCell>
      <TableCell>
        <Button size="small" variant="text" onClick={() => onNavigate(doc.propertyId)} sx={{ textTransform: 'none', justifyContent: 'flex-start', p: 0 }}>
          <Typography variant="body2" noWrap sx={{ maxWidth: 180 }}>{doc.propertyTitle}</Typography>
        </Button>
      </TableCell>
      <TableCell>
        <Typography variant="body2">{doc.owner?.name}</Typography>
        <Typography variant="caption" color="text.secondary">{doc.owner?.email}</Typography>
      </TableCell>
      <TableCell sx={{ whiteSpace: 'nowrap' }}>{fmtDate(doc.uploadDate)}</TableCell>
      <TableCell>
        <Chip label={status.label} color={status.color} size="small" icon={status.icon} sx={{ fontWeight: 600 }} />
      </TableCell>
      <TableCell>
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Tooltip title="View"><IconButton size="small" color="primary" onClick={() => onView(doc)}><Visibility fontSize="small" /></IconButton></Tooltip>
          <Tooltip title="Download"><IconButton size="small" color="primary" onClick={() => onDownload(doc)}><Download fontSize="small" /></IconButton></Tooltip>
          <DocumentActionMenu doc={doc} onVerify={onVerify} onReject={onReject} onAddNote={onAddNote} onView={onView} onDownload={onDownload} />
        </Box>
      </TableCell>
    </TableRow>
  );
});

export default function DocumentInbox() {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [docTypeFilter, setDocTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [tabValue, setTabValue] = useState(0);
  const [selected, setSelected] = useState([]);
  
  // Dialog states
  const [requestDialogOpen, setRequestDialogOpen] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [verifyDialogOpen, setVerifyDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [reportReason, setReportReason] = useState('');
  const [reportDetails, setReportDetails] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const debouncedSearch = useDebounce(search, 350);

  const propertiesWithMissingDocs = MOCK_PROPERTIES.map((p) => ({
    ...p,
    missingDocs: getMissingDocs(p._id, p.type),
  })).filter((p) => p.missingDocs.length > 0);

  useEffect(() => {
    setIsLoading(true);
    setTimeout(() => {
      let filtered = [...MOCK_DOCUMENTS];
      if (docTypeFilter !== 'All') filtered = filtered.filter((d) => d.documentType === docTypeFilter);
      if (statusFilter !== 'All') filtered = filtered.filter((d) => d.verificationStatus === statusFilter);
      if (debouncedSearch) {
        const q = debouncedSearch.toLowerCase();
        filtered = filtered.filter((d) =>
          d.fileName.toLowerCase().includes(q) || d.propertyTitle.toLowerCase().includes(q) || d.owner?.name.toLowerCase().includes(q)
        );
      }
      setDocuments(filtered);
      setIsLoading(false);
    }, 500);
  }, [docTypeFilter, statusFilter, debouncedSearch]);

  useEffect(() => { setPage(0); }, [docTypeFilter, statusFilter, debouncedSearch]);

  const handleView = (doc) => { setSelectedDocument(doc); setPreviewDialogOpen(true); };
  const handleDownload = (doc) => { alert(`Downloading: ${doc.fileName}`); };
  const handleNavigate = (propertyId) => { navigate(`/verification/${propertyId}`); };
  const handleRequestDocs = (property) => { setSelectedProperty(property); setRequestDialogOpen(true); };
  const handleSendRequest = () => {
    alert(`Document request sent to ${selectedProperty.owner.email}\nMissing: ${selectedProperty.missingDocs.map(formatDocType).join(', ')}`);
    setRequestDialogOpen(false);
    setSelectedProperty(null);
  };
  const handleReportIssue = () => {
    if (!reportReason.trim() || !reportDetails.trim()) return;
    alert(`Issue reported to System Admin:\nReason: ${reportReason}\nDetails: ${reportDetails}`);
    setReportDialogOpen(false);
    setReportReason('');
    setReportDetails('');
  };

  const handleVerifyDoc = (doc) => { setSelectedDocument(doc); setVerifyDialogOpen(true); };
  const handleRejectDoc = (doc) => { setSelectedDocument(doc); setRejectDialogOpen(true); };
  const handleAddNote = (doc) => { setSelectedDocument(doc); setNoteDialogOpen(true); };

  const handleConfirmVerify = async (doc, notes) => {
    setActionLoading(true);
    await new Promise((r) => setTimeout(r, 700));
    setSuccessMsg(`Document "${doc.fileName}" verified successfully.`);
    setVerifyDialogOpen(false);
    setActionLoading(false);
  };

  const handleConfirmReject = async (doc, reason) => {
    setActionLoading(true);
    await new Promise((r) => setTimeout(r, 700));
    setSuccessMsg(`Document "${doc.fileName}" rejected.`);
    setRejectDialogOpen(false);
    setActionLoading(false);
  };

  const handleConfirmNote = async (doc, note) => {
    setActionLoading(true);
    await new Promise((r) => setTimeout(r, 500));
    setSuccessMsg(`Note added to "${doc.fileName}".`);
    setNoteDialogOpen(false);
    setActionLoading(false);
  };

  const toggleSelection = (id) => {
    setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const toggleAll = () => {
    setSelected((prev) => prev.length === paginatedDocs.length ? [] : paginatedDocs.map((d) => d._id));
  };

  const handleBulkVerify = async () => {
    setActionLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    setSuccessMsg(`${selected.length} documents verified.`);
    setSelected([]);
    setActionLoading(false);
  };

  const handleBulkReject = async () => {
    setActionLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    setSuccessMsg(`${selected.length} documents rejected.`);
    setSelected([]);
    setActionLoading(false);
  };

  const handleExportExcel = () => {
    const data = documents.map((d) => ({
      'File Name': d.fileName,
      'Type': formatDocType(d.documentType),
      'Property': d.propertyTitle,
      'Owner': d.owner.name,
      'Email': d.owner.email,
      'Upload Date': fmtDate(d.uploadDate),
      'Status': d.verificationStatus,
      'Size': d.fileSize,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Documents');
    XLSX.writeFile(wb, 'document-list.xlsx');
  };

  const totalDocs = MOCK_DOCUMENTS.length;
  const pendingDocs = MOCK_DOCUMENTS.filter((d) => d.verificationStatus === 'PENDING').length;
  const verifiedDocs = MOCK_DOCUMENTS.filter((d) => d.verificationStatus === 'VERIFIED').length;
  const rejectedDocs = MOCK_DOCUMENTS.filter((d) => d.verificationStatus === 'REJECTED').length;
  const paginatedDocs = documents.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  const allSelected = paginatedDocs.length > 0 && paginatedDocs.every((d) => selected.includes(d._id));
  const someSelected = selected.length > 0;
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" fontWeight={700} mb={0.5}>Document Inbox</Typography>
          <Typography color="text.secondary">View and manage all property documents submitted by owners.</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" startIcon={<FileDownload />} onClick={handleExportExcel}>Export Excel</Button>
          <Button variant="outlined" color="error" startIcon={<Report />} onClick={() => setReportDialogOpen(true)}>Report Issue</Button>
        </Box>
      </Box>

      {successMsg && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccessMsg('')}>{successMsg}</Alert>}

      <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}>
        <Tab label="All Documents" />
        <Tab label={<Badge badgeContent={propertiesWithMissingDocs.length} color="error"><Box sx={{ pr: propertiesWithMissingDocs.length > 0 ? 2 : 0 }}>Missing Documents</Box></Badge>} />
      </Tabs>

      {tabValue === 0 && (
        <>
          <Grid container spacing={2} mb={3}>
            <Grid item xs={12} sm={6} md={3}><SummaryCard icon={<Folder sx={{ fontSize: 28 }} />} label="Total Documents" value={totalDocs} color="primary.main" /></Grid>
            <Grid item xs={12} sm={6} md={3}><SummaryCard icon={<PendingActions sx={{ fontSize: 28 }} />} label="Pending Review" value={pendingDocs} color="warning.main" /></Grid>
            <Grid item xs={12} sm={6} md={3}><SummaryCard icon={<CheckCircle sx={{ fontSize: 28 }} />} label="Verified" value={verifiedDocs} color="success.main" /></Grid>
            <Grid item xs={12} sm={6} md={3}><SummaryCard icon={<Cancel sx={{ fontSize: 28 }} />} label="Rejected" value={rejectedDocs} color="error.main" /></Grid>
          </Grid>

          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                <FilterList color="action" />
                <TextField placeholder="Search by filename, property, or owner…" value={search} onChange={(e) => setSearch(e.target.value)} size="small" sx={{ minWidth: 280, flexGrow: 1 }} slotProps={{ input: { startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> } }} />
                <FormControl size="small" sx={{ minWidth: 180 }}>
                  <InputLabel>Document Type</InputLabel>
                  <Select value={docTypeFilter} label="Document Type" onChange={(e) => setDocTypeFilter(e.target.value)}>
                    {DOC_TYPES.map((t) => <MenuItem key={t} value={t} sx={{ textTransform: 'capitalize' }}>{t === 'All' ? 'All Types' : formatDocType(t)}</MenuItem>)}
                  </Select>
                </FormControl>
                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <InputLabel>Status</InputLabel>
                  <Select value={statusFilter} label="Status" onChange={(e) => setStatusFilter(e.target.value)}>
                    {DOC_STATUS.map((s) => <MenuItem key={s} value={s}>{s === 'All' ? 'All Status' : s}</MenuItem>)}
                  </Select>
                </FormControl>
              </Box>
            </CardContent>
          </Card>

          {someSelected && (
            <Toolbar sx={{ mb: 1, px: 2, bgcolor: 'primary.50', borderRadius: 2, border: '1px solid', borderColor: 'primary.200', gap: 1 }}>
              <Typography variant="body2" fontWeight={600} sx={{ flexGrow: 1 }}>{selected.length} selected</Typography>
              <Button size="small" variant="contained" color="success" startIcon={<CheckCircle />} onClick={handleBulkVerify} disabled={actionLoading}>Bulk Verify</Button>
              <Button size="small" variant="outlined" color="error" startIcon={<Cancel />} onClick={handleBulkReject} disabled={actionLoading}>Bulk Reject</Button>
              <Button size="small" onClick={() => setSelected([])}>Clear</Button>
            </Toolbar>
          )}

          <Paper elevation={2} sx={{ borderRadius: 2 }}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: 'grey.50' }}>
                    <TableCell padding="checkbox"><Checkbox checked={allSelected} indeterminate={someSelected && !allSelected} onChange={toggleAll} disabled={isLoading || paginatedDocs.length === 0} /></TableCell>
                    {['Document', 'Type', 'Property', 'Owner', 'Upload Date', 'Status', 'Actions'].map((h) => <TableCell key={h} sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>{h}</TableCell>)}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {isLoading && Array.from({ length: rowsPerPage > 5 ? 5 : rowsPerPage }).map((_, i) => (
                    <TableRow key={i}>{Array.from({ length: 8 }).map((__, j) => <TableCell key={j}><Skeleton variant="text" /></TableCell>)}</TableRow>
                  ))}
                  {!isLoading && documents.length === 0 && (
                    <TableRow><TableCell colSpan={8}><Box sx={{ py: 6, textAlign: 'center', color: 'text.secondary' }}><Folder sx={{ fontSize: 48, mb: 1, opacity: 0.4 }} /><Typography variant="body1" fontWeight={500}>No documents found</Typography><Typography variant="body2" mt={0.5}>Try adjusting your filters.</Typography></Box></TableCell></TableRow>
                  )}
                  {!isLoading && paginatedDocs.map((doc) => (
                    <DocumentRow key={doc._id} doc={doc} isChecked={selected.includes(doc._id)} onToggle={toggleSelection} onView={handleView} onDownload={handleDownload} onNavigate={handleNavigate} onVerify={handleVerifyDoc} onReject={handleRejectDoc} onAddNote={handleAddNote} />
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination component="div" count={documents.length} page={page} onPageChange={(_, newPage) => setPage(newPage)} rowsPerPage={rowsPerPage} onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }} rowsPerPageOptions={[5, 10, 25, 50]} />
          </Paper>
        </>
      )}

      {tabValue === 1 && (
        <Box>
          {propertiesWithMissingDocs.length === 0 ? (
            <Card><CardContent sx={{ py: 6, textAlign: 'center' }}><CheckCircle sx={{ fontSize: 64, color: 'success.main', mb: 2 }} /><Typography variant="h6" fontWeight={600} mb={1}>All Documents Complete</Typography><Typography color="text.secondary">All properties have submitted their required documents.</Typography></CardContent></Card>
          ) : (
            <Grid container spacing={2}>
              {propertiesWithMissingDocs.map((property) => (
                <Grid item xs={12} md={6} key={property._id}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 2 }}>
                        <Warning color="error" />
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography variant="subtitle1" fontWeight={600}>{property.title}</Typography>
                          <Typography variant="body2" color="text.secondary">{property.owner.name} • {property.owner.email}</Typography>
                        </Box>
                      </Box>
                      <Divider sx={{ my: 1.5 }} />
                      <Typography variant="caption" color="error" fontWeight={700} display="block" mb={1}>MISSING DOCUMENTS ({property.missingDocs.length})</Typography>
                      <List dense disablePadding>
                        {property.missingDocs.map((doc) => (
                          <ListItem key={doc} sx={{ px: 0, py: 0.5 }}>
                            <ErrorOutline fontSize="small" color="error" sx={{ mr: 1 }} />
                            <ListItemText primary={formatDocType(doc)} primaryTypographyProps={{ variant: 'body2' }} />
                          </ListItem>
                        ))}
                      </List>
                      <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                        <Button fullWidth variant="contained" size="small" startIcon={<Send />} onClick={() => handleRequestDocs(property)}>Request Documents</Button>
                        <Button fullWidth variant="outlined" size="small" onClick={() => handleNavigate(property._id)}>View Property</Button>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      )}

      <Dialog open={requestDialogOpen} onClose={() => setRequestDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Request Missing Documents</DialogTitle>
        <DialogContent>
          {selectedProperty && (
            <>
              <Alert severity="info" sx={{ mb: 2 }}>A notification will be sent to <strong>{selectedProperty.owner.email}</strong> requesting the following documents.</Alert>
              <Typography variant="subtitle2" mb={1}>Property: {selectedProperty.title}</Typography>
              <Typography variant="body2" color="text.secondary" mb={2}>Owner: {selectedProperty.owner.name}</Typography>
              <Typography variant="caption" fontWeight={700} display="block" mb={1}>MISSING DOCUMENTS:</Typography>
              <List dense>{selectedProperty.missingDocs.map((doc) => <ListItem key={doc}><ListItemText primary={formatDocType(doc)} /></ListItem>)}</List>
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setRequestDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" startIcon={<Send />} onClick={handleSendRequest}>Send Request</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={reportDialogOpen} onClose={() => setReportDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'error.main' }}><Report /> Report Issue to System Admin</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>Use this form to escalate critical issues that require system administrator attention.</Alert>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Issue Type</InputLabel>
            <Select value={reportReason} label="Issue Type" onChange={(e) => setReportReason(e.target.value)}>
              <MenuItem value="fraudulent_document">Fraudulent Document Detected</MenuItem>
              <MenuItem value="system_error">System Error / Bug</MenuItem>
              <MenuItem value="suspicious_activity">Suspicious Activity</MenuItem>
              <MenuItem value="data_integrity">Data Integrity Issue</MenuItem>
              <MenuItem value="security_concern">Security Concern</MenuItem>
              <MenuItem value="other">Other</MenuItem>
            </Select>
          </FormControl>
          <TextField fullWidth multiline rows={4} label="Details" placeholder="Describe the issue in detail…" value={reportDetails} onChange={(e) => setReportDetails(e.target.value)} required />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setReportDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" color="error" startIcon={<Report />} onClick={handleReportIssue} disabled={!reportReason || !reportDetails.trim()}>Submit Report</Button>
        </DialogActions>
      </Dialog>

      <VerifyDocumentDialog open={verifyDialogOpen} onClose={() => setVerifyDialogOpen(false)} onConfirm={handleConfirmVerify} document={selectedDocument} loading={actionLoading} />
      <RejectDocumentDialog open={rejectDialogOpen} onClose={() => setRejectDialogOpen(false)} onConfirm={handleConfirmReject} document={selectedDocument} loading={actionLoading} />
      <AddNoteDialog open={noteDialogOpen} onClose={() => setNoteDialogOpen(false)} onConfirm={handleConfirmNote} document={selectedDocument} loading={actionLoading} />
      <DocumentPreviewDialog open={previewDialogOpen} onClose={() => setPreviewDialogOpen(false)} document={selectedDocument} />
    </Box>
  );
}
