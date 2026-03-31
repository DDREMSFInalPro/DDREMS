const express = require('express');
const router = express.Router();
const supabase = require('../config/db');

// Get user notifications
router.get('/:userId', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', req.params.userId)
      .order('created_at', { ascending: false })
      .limit(20);
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Mark notification as read
router.put('/:id/read', async (req, res) => {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', req.params.id);
    if (error) throw error;
    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create notification
router.post('/', async (req, res) => {
  try {
    const { user_id, title, message, type, link } = req.body;
    const { data, error } = await supabase
      .from('notifications')
      .insert({ user_id, title, message, type, link })
      .select('id')
      .single();
    if (error) throw error;
    res.status(201).json({ id: data.id, message: 'Notification created' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
