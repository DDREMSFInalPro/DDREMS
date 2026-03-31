const express = require('express');
const router = express.Router();
const supabase = require('../config/db');

// Get system logs
router.get('/logs', async (req, res) => {
  try {
    const { data, error } = await supabase.from('audit_log').select('*').order('created_at', { ascending: false }).limit(50);
    if (error) throw error;
    res.json((data || []).map(log => ({ timestamp: log.created_at, level: 'info', message: `${log.action} on ${log.table_name} (ID: ${log.record_id})` })));
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get user activity
router.get('/user-activity', async (req, res) => {
  try {
    const { data, error } = await supabase.from('audit_log').select('*, users(name)').order('created_at', { ascending: false }).limit(20);
    if (error) throw error;
    res.json((data || []).map(a => ({ ...a, user_name: a.users?.name })));
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get system configuration
router.get('/config', async (req, res) => {
  try {
    const { data, error } = await supabase.from('system_config').select('*').order('config_key');
    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update system configuration
router.put('/config/:key', async (req, res) => {
  try {
    const { value } = req.body;
    const { error } = await supabase.from('system_config').update({ config_value: value }).eq('config_key', req.params.key);
    if (error) throw error;
    res.json({ message: 'Configuration updated' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
