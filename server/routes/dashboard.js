const express = require('express');
const router = express.Router();
const supabase = require('../config/db');

// Get dashboard statistics
router.get('/stats', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const [
      { count: totalProperties },
      { count: activeProperties },
      { count: totalBrokers },
      { count: totalUsers },
      { count: pendingTransactions },
      { data: todayTx },
    ] = await Promise.all([
      supabase.from('properties').select('*', { count: 'exact', head: true }),
      supabase.from('properties').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'broker').eq('status', 'active'),
      supabase.from('users').select('*', { count: 'exact', head: true }),
      supabase.from('transactions').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('transactions').select('amount').gte('created_at', `${today}T00:00:00`).lte('created_at', `${today}T23:59:59`),
    ]);

    const todayRevenue = (todayTx || []).reduce((sum, t) => sum + (t.amount || 0), 0);

    res.json({ totalProperties, activeProperties, totalBrokers, totalUsers, pendingTransactions, todayRevenue });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get recent activities
router.get('/activities', async (req, res) => {
  try {
    const [{ data: properties }, { data: transactions }] = await Promise.all([
      supabase.from('properties').select('title, created_at, status').order('created_at', { ascending: false }).limit(5),
      supabase.from('transactions').select('id, created_at, status').order('created_at', { ascending: false }).limit(5),
    ]);

    const activities = [
      ...(properties || []).map(p => ({ type: 'property', name: p.title, created_at: p.created_at, status: p.status })),
      ...(transactions || []).map(t => ({ type: 'transaction', name: `Transaction #${t.id}`, created_at: t.created_at, status: t.status })),
    ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 10);

    res.json(activities);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
