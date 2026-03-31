const express = require('express');
const router = express.Router();
const supabase = require('../config/db');

// Get all announcements
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('announcements')
      .select('*, users(name)')
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json((data || []).map(a => ({ ...a, created_by: a.users?.name })));
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get announcement by ID
router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase.from('announcements').select('*').eq('id', req.params.id).single();
    if (error || !data) return res.status(404).json({ message: 'Announcement not found' });
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create announcement
router.post('/', async (req, res) => {
  try {
    const { title, content, priority } = req.body;
    const { data, error } = await supabase.from('announcements').insert({ title, content, priority, created_by: 1 }).select('id').single();
    if (error) throw error;
    res.status(201).json({ id: data.id, message: 'Announcement created successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update announcement
router.put('/:id', async (req, res) => {
  try {
    const { title, content, priority } = req.body;
    const { error } = await supabase.from('announcements').update({ title, content, priority }).eq('id', req.params.id);
    if (error) throw error;
    res.json({ message: 'Announcement updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete announcement
router.delete('/:id', async (req, res) => {
  try {
    const { error } = await supabase.from('announcements').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ message: 'Announcement deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
