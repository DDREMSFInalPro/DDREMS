const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const supabase = require('../config/db');

// Get all users
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, name, email, role, status, profile_approved, created_at')
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Search users by name or email
router.get('/search', async (req, res) => {
  try {
    const { q, role } = req.query;
    let query = supabase.from('users').select('id, name, email, role');

    if (q) {
      query = query.or(`name.ilike.%${q}%,email.ilike.%${q}%`);
    }
    if (role && role !== 'all') {
      query = query.eq('role', role);
    }

    const { data, error } = await query.order('name').limit(50);
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get users by role
router.get('/role/:role', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, name, email, role')
      .eq('role', req.params.role)
      .order('name');
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Build update object helper
function buildUpdateObj(body) {
  const { name, email, role, status, profile_approved } = body;
  const updates = {};
  if (name !== undefined) updates.name = name;
  if (email !== undefined) updates.email = email;
  if (role !== undefined) updates.role = role;
  if (status !== undefined) updates.status = status;
  if (profile_approved !== undefined) updates.profile_approved = !!profile_approved;
  return updates;
}

// Update user - explicit route
router.put('/update/:id', async (req, res) => {
  try {
    const updates = buildUpdateObj(req.body);
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }
    console.log(`[USER-API] Executing update on /update/${req.params.id}:`, updates);
    const { error } = await supabase.from('users').update(updates).eq('id', req.params.id);
    if (error) throw error;
    res.json({ message: 'User updated successfully' });
  } catch (error) {
    console.error('[USER-API] Update failed:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Legacy update for compatibility
router.put('/:id', async (req, res) => {
  try {
    console.log(`[USER-API] Legacy PUT received for ID: ${req.params.id}`, req.body);
    const updates = buildUpdateObj(req.body);
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }
    const { error } = await supabase.from('users').update(updates).eq('id', req.params.id);
    if (error) throw error;
    res.json({ message: 'User updated successfully' });
  } catch (error) {
    console.error('[USER-API] Legacy update failed:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new user (Admin)
router.post('/add', async (req, res) => {
  try {
    const { name, email, phone, password, role } = req.body;

    if (!name || !email || !role) {
      return res.status(400).json({ message: 'Name, email, and role are required' });
    }

    const { data: existing } = await supabase.from('users').select('id').eq('email', email).single();
    if (existing) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password || 'admin123', 10);

    const { data: newUser, error } = await supabase
      .from('users')
      .insert({ name, email, password: hashedPassword, phone: phone || null, role, status: 'active', profile_approved: false, profile_completed: false })
      .select('id')
      .single();

    if (error) throw error;

    res.json({ success: true, user_id: newUser.id, message: 'User account created successfully' });
  } catch (error) {
    console.error('[USER-API] Create failed:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete user
router.delete('/:id', async (req, res) => {
  try {
    const userId = req.params.id;

    const { data: user } = await supabase.from('users').select('role').eq('id', userId).single();
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (['admin', 'system_admin'].includes(user.role)) {
      return res.status(403).json({ message: 'Cannot delete admin accounts' });
    }

    // Delete related data
    await supabase.from('customer_profiles').delete().eq('user_id', userId);
    await supabase.from('owner_profiles').delete().eq('user_id', userId);
    await supabase.from('broker_profiles').delete().eq('user_id', userId);
    await supabase.from('notifications').delete().eq('user_id', userId);
    await supabase.from('messages').delete().or(`sender_id.eq.${userId},receiver_id.eq.${userId}`);

    const { error } = await supabase.from('users').delete().eq('id', userId);
    if (error) throw error;

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Catch-all 404
router.use((req, res) => {
  console.warn(`[USER-API] 404 on ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    message: `User API: Endpoint not found (${req.method} ${req.originalUrl})`,
    tip: 'Check if you use /api/users/update/:id for PUT requests'
  });
});

module.exports = router;
