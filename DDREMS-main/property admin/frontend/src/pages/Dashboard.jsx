import { useEffect, memo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Skeleton,
  Divider,
} from '@mui/material';
import {
  PendingActions,
  RateReview,
  VerifiedUser,
  TrendingUp,
} from '@mui/icons-material';
import { fetchDashboardStats } from '../store/slices/verificationSlice.js';

const CARDS = [
  {
    key: 'pending',
    label: 'Pending Verifications',
    sublabel: 'Awaiting review',
    icon: <PendingActions sx={{ fontSize: 32 }} />,
    color: '#f57c00',
    bg: '#fff3e0',
    getValue: (stats) => stats?.all?.PENDING ?? 0,
  },
  {
    key: 'inReview',
    label: 'In Review',
    sublabel: 'Currently being reviewed',
    icon: <RateReview sx={{ fontSize: 32 }} />,
    color: '#1565c0',
    bg: '#e3f2fd',
    getValue: (stats) => stats?.all?.IN_REVIEW ?? 0,
  },
  {
    key: 'verifiedToday',
    label: "Verified Today",
    sublabel: "Approved since midnight",
    icon: <VerifiedUser sx={{ fontSize: 32 }} />,
    color: '#2e7d32',
    bg: '#e8f5e9',
    getValue: (stats) => stats?.today?.VERIFIED ?? 0,
  },
  {
    key: 'verificationRate',
    label: 'Verification Rate',
    sublabel: 'All-time approval rate',
    icon: <TrendingUp sx={{ fontSize: 32 }} />,
    color: '#6a1b9a',
    bg: '#f3e5f5',
    getValue: (stats) => stats?.all?.verificationRate ?? '—',
  },
];

const StatCard = memo(function StatCard({ card, value, loading }) {
  return (
  <Card
    elevation={2}
    sx={{
      borderRadius: 3,
      height: '100%',
      transition: 'transform 0.15s, box-shadow 0.15s',
      '&:hover': { transform: 'translateY(-2px)', boxShadow: 6 },
    }}
  >
    <CardContent sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
        <Box
          sx={{
            p: 1.5,
            borderRadius: 2,
            bgcolor: card.bg,
            color: card.color,
            display: 'flex',
          }}
        >
          {card.icon}
        </Box>
      </Box>

      {loading ? (
        <>
          <Skeleton variant="text" width="50%" height={44} />
          <Skeleton variant="text" width="70%" />
        </>
      ) : (
        <>
          <Typography variant="h4" fontWeight={700} color={card.color} lineHeight={1.2}>
            {value}
          </Typography>
          <Typography variant="body1" fontWeight={600} mt={0.5}>
            {card.label}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {card.sublabel}
          </Typography>
        </>
      )}
    </CardContent>
  </Card>
  );
});

export default function Dashboard() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { dashboardStats, statsLoading } = useSelector((state) => state.verification);

  useEffect(() => {
    dispatch(fetchDashboardStats());
  }, [dispatch]);

  const now = new Date();
  const timeGreeting =
    now.getHours() < 12 ? 'Good morning' :
    now.getHours() < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <Box>
      {/* Welcome header */}
      <Box mb={4}>
        <Typography variant="h5" fontWeight={700}>
          {timeGreeting}, {user?.name}
        </Typography>
        <Typography color="text.secondary" mt={0.5}>
          {now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </Typography>
      </Box>

      <Divider sx={{ mb: 4 }} />

      {/* Metric cards */}
      <Typography variant="subtitle1" fontWeight={600} color="text.secondary" mb={2} textTransform="uppercase" letterSpacing={1} fontSize="0.75rem">
        Verification Overview
      </Typography>

      <Grid container spacing={3}>
        {CARDS.map((card) => (
          <Grid item xs={12} sm={6} lg={3} key={card.key}>
            <StatCard
              card={card}
              value={card.getValue(dashboardStats)}
              loading={statsLoading}
            />
          </Grid>
        ))}
      </Grid>

      {/* Total summary bar */}
      {!statsLoading && dashboardStats && (
        <Card elevation={1} sx={{ mt: 4, borderRadius: 3, bgcolor: 'primary.main', color: 'white' }}>
          <CardContent sx={{ display: 'flex', flexWrap: 'wrap', gap: 4, py: '16px !important', px: 3 }}>
            {[
              { label: 'Total Properties', value: dashboardStats.all?.total ?? 0 },
              { label: 'Verified', value: dashboardStats.all?.VERIFIED ?? 0 },
              { label: 'Rejected', value: dashboardStats.all?.REJECTED ?? 0 },
              { label: 'Avg. Verification Time', value: dashboardStats.all?.avgVerificationTimeHours ?? '—' },
            ].map(({ label, value }) => (
              <Box key={label}>
                <Typography variant="h6" fontWeight={700}>{value}</Typography>
                <Typography variant="caption" sx={{ opacity: 0.8 }}>{label}</Typography>
              </Box>
            ))}
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
