import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box, Grid, Typography, Button, Chip, Card, CardContent,
  CardHeader, Divider, Skeleton, Alert, Stack, List, ListItem,
  ListItemText,
} from '@mui/material';
import {
  ArrowBack, LocationOn, AttachMoney, Bed, Bathtub,
  SquareFoot, Person, OpenInNew, CheckCircle, Cancel,
  History,
} from '@mui/icons-material';
import api from '../store/api.js';
import {
  fetchPropertyDetails,
  approveProperty,
  rejectProperty,
  clearActionError,
} from '../store/slices/verificationSlice.js';
import ApproveDialog from '../components/ApproveDialog.jsx';
import RejectDialog from '../components/RejectDialog.jsx';

// ── helpers ──────────────────────────────────────────────────────────────────
const STATUS_CHIP = {
  PENDING:   { color: 'warning', label: 'Pending' },
  IN_REVIEW: { color: 'info',    label: 'In Review' },
  VERIFIED:  { color: 'success', label: 'Verified' },
  REJECTED:  { color: 'error',   label: 'Rejected' },
};

const DOC_STATUS_CHIP = {
  PENDING:  { color: 'warning', label: 'Pending' },
  VERIFIED: { color: 'success', label: 'Verified' },
  REJECTED: { color: 'error',   label: 'Rejected' },
};

const fmt = (n) => n != null ? `ETB ${Number(n).toLocaleString()}` : '—';
const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '—';
const capitalize = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : '—';

const SpecItem = ({ icon, label, value }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
    <Box sx={{ color: 'primary.main', display: 'flex' }}>{icon}</Box>
    <Box>
      <Typography variant="caption" color="text.secondary" display="block">{label}</Typography>
      <Typography variant="body2" fontWeight={600}>{value ?? '—'}</Typography>
    </Box>
  </Box>
);

const InfoRow = ({ label, value }) => (
  <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.75 }}>
    <Typography variant="body2" color="text.secondary">{label}</Typography>
    <Typography variant="body2" fontWeight={500} textAlign="right" sx={{ maxWidth: '60%' }}>
      {value ?? '—'}
    </Typography>
  </Box>
);

const SectionCard = ({ title, children }) => (
  <Card>
    <CardHeader title={<Typography variant="subtitle1">{title}</Typography>} />
    <Divider />
    {children}
  </Card>
);

// ── component ─────────────────────────────────────────────────────────────────
export default function PropertyReview() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const {
    selectedProperty: property,
    isLoading,
    actionLoading,
    actionError,
    error,
  } = useSelector((s) => s.verification);

  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    dispatch(fetchPropertyDetails(id));
    // Mock audit history
    setHistoryLoading(true);
    setTimeout(() => {
      setHistory([
        { _id: 'h1', actionType: 'SUBMITTED', performedBy: { name: 'Property Owner' }, notes: 'Initial submission via mobile app', timestamp: '2026-03-10T08:00:00Z' },
        { _id: 'h2', actionType: 'IN_REVIEW', performedBy: { name: 'Admin User' }, notes: 'Assigned for review', timestamp: '2026-03-11T10:30:00Z' },
      ]);
      setHistoryLoading(false);
    }, 400);
    return () => dispatch(clearActionError());
  }, [dispatch, id]);

  const handleApprove = async (notes) => {
    const result = await dispatch(approveProperty({ propertyId: id, notes }));
    if (approveProperty.fulfilled.match(result)) {
      setApproveOpen(false);
      setSuccessMsg('Property approved successfully.');
    }
  };

  const handleReject = async (notes) => {
    const result = await dispatch(rejectProperty({ propertyId: id, notes }));
    if (rejectProperty.fulfilled.match(result)) {
      setRejectOpen(false);
      setSuccessMsg('Property rejected.');
    }
  };

  const status = STATUS_CHIP[property?.verificationStatus] || STATUS_CHIP.PENDING;
  const isFinalized = ['VERIFIED', 'REJECTED'].includes(property?.verificationStatus);

  // ── loading ────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <Box>
        <Skeleton width={120} height={36} sx={{ mb: 2 }} />
        <Grid container spacing={3}>
          {[0, 1].map((i) => (
            <Grid item xs={12} md={6} key={i}>
              <Card>
                <CardContent>
                  {Array.from({ length: 6 }).map((_, j) => (
                    <Skeleton key={j} variant="text" height={28} sx={{ mb: 1 }} />
                  ))}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/verification')} sx={{ mb: 2 }}>
          Back
        </Button>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!property) return null;

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/verification')}>
          Back
        </Button>
        <Typography variant="h5" sx={{ flexGrow: 1 }}>{property.title}</Typography>
        <Chip label={status.label} color={status.color} sx={{ fontWeight: 700 }} />
      </Box>

      {successMsg && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccessMsg(null)}>
          {successMsg}
        </Alert>
      )}
      {actionError && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => dispatch(clearActionError())}>
          {actionError}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* ── LEFT ── */}
        <Grid item xs={12} md={6}>
          <Stack spacing={3}>

            <SectionCard title="Property Details">
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 2 }}>
                  <LocationOn color="primary" sx={{ mt: 0.3 }} />
                  <Box>
                    <Typography variant="body2" fontWeight={600}>
                      {[property.address?.street, property.address?.city].filter(Boolean).join(', ') || '—'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {[property.address?.state, property.address?.country].filter(Boolean).join(', ')}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <AttachMoney color="primary" />
                  <Typography variant="h6" fontWeight={700} color="primary.main">
                    {fmt(property.price)}
                  </Typography>
                </Box>

                <Divider sx={{ my: 1.5 }} />
                <InfoRow label="Type" value={capitalize(property.type)} />
                <InfoRow label="Listing" value={capitalize(property.listingType)} />
                <InfoRow label="Submitted" value={fmtDate(property.createdAt)} />
                {property.verificationDate && (
                  <InfoRow label="Reviewed on" value={fmtDate(property.verificationDate)} />
                )}
                {property.verificationNotes && (
                  <InfoRow label="Review Notes" value={property.verificationNotes} />
                )}
              </CardContent>
            </SectionCard>

            <SectionCard title="Specifications">
              <CardContent>
                <Grid container spacing={2}>
                  <Grid item xs={6}><SpecItem icon={<Bed />} label="Bedrooms" value={property.bedrooms} /></Grid>
                  <Grid item xs={6}><SpecItem icon={<Bathtub />} label="Bathrooms" value={property.bathrooms} /></Grid>
                  <Grid item xs={6}><SpecItem icon={<SquareFoot />} label="Area (sq ft)" value={property.size} /></Grid>
                </Grid>
              </CardContent>
            </SectionCard>

            <SectionCard title="Owner Information">
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                  <Person color="primary" fontSize="small" />
                  <Typography variant="subtitle2">Owner</Typography>
                </Box>
                <InfoRow label="Name" value={property.owner?.name} />
                <InfoRow label="Email" value={property.owner?.email} />
                <InfoRow label="Phone" value={property.owner?.phone} />
                {property.broker && (
                  <>
                    <Divider sx={{ my: 1.5 }} />
                    <Typography variant="caption" color="text.secondary" fontWeight={700} display="block" mb={1}>
                      BROKER
                    </Typography>
                    <InfoRow label="Name" value={property.broker?.name} />
                    <InfoRow label="Email" value={property.broker?.email} />
                    <InfoRow label="Agency" value={property.broker?.agency} />
                    <InfoRow label="License" value={property.broker?.licenseNumber} />
                  </>
                )}
              </CardContent>
            </SectionCard>

          </Stack>
        </Grid>

        {/* ── RIGHT ── */}
        <Grid item xs={12} md={6}>
          <Stack spacing={3}>

            <SectionCard title="Documents">
              {!property.documents?.length ? (
                <CardContent>
                  <Typography variant="body2" color="text.secondary">No documents uploaded.</Typography>
                </CardContent>
              ) : (
                <List disablePadding>
                  {property.documents.map((doc, i) => {
                    const ds = DOC_STATUS_CHIP[doc.verificationStatus] || DOC_STATUS_CHIP.PENDING;
                    return (
                      <Box key={doc._id || i}>
                        <ListItem
                          sx={{ py: 1.5 }}
                          secondaryAction={
                            <Button
                              size="small"
                              endIcon={<OpenInNew fontSize="small" />}
                              href={doc.url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              View
                            </Button>
                          }
                        >
                          <ListItemText
                            primary={
                              <Typography variant="body2" fontWeight={600} sx={{ textTransform: 'capitalize' }}>
                                {doc.documentType?.replace(/_/g, ' ')}
                              </Typography>
                            }
                            secondary={
                              <Chip label={ds.label} color={ds.color} size="small" sx={{ mt: 0.5 }} />
                            }
                          />
                        </ListItem>
                        {i < property.documents.length - 1 && <Divider />}
                      </Box>
                    );
                  })}
                </List>
              )}
            </SectionCard>

            <SectionCard title="Verification Actions">
              <CardContent>
                {isFinalized ? (
                  <Alert severity={property.verificationStatus === 'VERIFIED' ? 'success' : 'error'}>
                    This property has been <strong>{property.verificationStatus.toLowerCase()}</strong>.
                    No further actions are available.
                  </Alert>
                ) : (
                  <Stack spacing={2}>
                    <Typography variant="body2" color="text.secondary">
                      Review all details and documents before making a decision.
                      Every action is logged in the audit trail.
                    </Typography>
                    <Button
                      fullWidth
                      variant="contained"
                      color="success"
                      size="large"
                      startIcon={<CheckCircle />}
                      onClick={() => setApproveOpen(true)}
                      disabled={actionLoading}
                    >
                      Approve Property
                    </Button>
                    <Button
                      fullWidth
                      variant="outlined"
                      color="error"
                      size="large"
                      startIcon={<Cancel />}
                      onClick={() => setRejectOpen(true)}
                      disabled={actionLoading}
                    >
                      Reject Property
                    </Button>
                  </Stack>
                )}
              </CardContent>
            </SectionCard>

          </Stack>
        </Grid>
      </Grid>

      {/* Activity Timeline */}
      <Card sx={{ mt: 3 }}>
        <CardHeader
          avatar={<History color="primary" />}
          title={<Typography variant="subtitle1">Activity Timeline</Typography>}
        />
        <Divider />
        <CardContent>
          {historyLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} variant="text" height={32} sx={{ mb: 1 }} />
            ))
          ) : history.length === 0 ? (
            <Typography variant="body2" color="text.secondary">No audit history yet.</Typography>
          ) : (
            <List disablePadding>
              {history.map((entry, i) => {
                const actionColor =
                  entry.actionType === 'VERIFIED' ? 'success' :
                  entry.actionType === 'REJECTED' ? 'error' :
                  entry.actionType?.includes('DOCUMENT') ? 'info' : 'default';
                return (
                  <Box key={entry._id || i}>
                    <ListItem alignItems="flex-start" sx={{ px: 0, py: 1.5 }}>
                      <Box
                        sx={{
                          width: 10, height: 10, borderRadius: '50%', mt: 0.8, mr: 2, flexShrink: 0,
                          bgcolor: actionColor === 'success' ? 'success.main' :
                                   actionColor === 'error' ? 'error.main' :
                                   actionColor === 'info' ? 'info.main' : 'grey.400',
                        }}
                      />
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                            <Chip
                              label={entry.actionType?.replace(/_/g, ' ')}
                              color={actionColor}
                              size="small"
                              sx={{ fontWeight: 600, fontSize: '0.7rem' }}
                            />
                            <Typography variant="body2" color="text.secondary">
                              by {entry.performedBy?.name ?? 'Unknown'}
                            </Typography>
                          </Box>
                        }
                        secondary={
                          <Box mt={0.5}>
                            {entry.notes && (
                              <Typography variant="body2" sx={{ mb: 0.5 }}>
                                "{entry.notes}"
                              </Typography>
                            )}
                            <Typography variant="caption" color="text.secondary">
                              {new Date(entry.timestamp).toLocaleString('en-US', {
                                year: 'numeric', month: 'short', day: 'numeric',
                                hour: '2-digit', minute: '2-digit',
                              })}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                    {i < history.length - 1 && (
                      <Box sx={{ ml: 2.5, borderLeft: '2px dashed', borderColor: 'grey.200', height: 8 }} />
                    )}
                  </Box>
                );
              })}
            </List>
          )}
        </CardContent>
      </Card>

      <ApproveDialog
        open={approveOpen}
        onClose={() => setApproveOpen(false)}
        onConfirm={handleApprove}
        loading={actionLoading}
      />
      <RejectDialog
        open={rejectOpen}
        onClose={() => setRejectOpen(false)}
        onConfirm={handleReject}
        loading={actionLoading}
      />
    </Box>
  );
}
