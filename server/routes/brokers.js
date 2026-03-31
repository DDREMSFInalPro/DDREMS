const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const supabase = require('../config/db');

const brokerSelect = `
  user_id:id, name, email, phone,
  account_status:status, profile_approved, profile_completed, registered_at:created_at,
  broker_profiles(
    profile_id:id, full_name, profile_phone:phone_number, address, license_number,
    profile_status, profile_photo, id_document, broker_license, rejection_reason,
    profile_created_at:created_at, profile_updated_at:updated_at
  )
`;

// Create broker account (must be before /:id)
router.post('/create-account', async (req, res) => {
  try {
    console.log('[BROKER-CREATE] Received request:', req.body);
    const { name, email, phone, password } = req.body;

    if (!name || !email || !phone) {
      return res.status(400).json({ success: false, message: 'Name, email, and phone are required' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: 'Invalid email format' });
    }

    const { data: existing } = await supabase.from('users').select('id').eq('email', email).single();
    if (existing) {
      return res.status(400).json({ success: false, message: 'Email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password || 'admin123', 10);

    const { data: newUser, error } = await supabase
      .from('users')
      .insert({ name, email, password: hashedPassword, phone, role: 'broker', status: 'active', profile_approved: false, profile_completed: false })
      .select('id')
      .single();

    if (error) throw error;

    // Notify admins
    const { data: admins } = await supabase.from('users').select('id').eq('role', 'admin');
    if (admins?.length) {
      await supabase.from('notifications').insert(
        admins.map(a => ({ user_id: a.id, title: 'New Broker Registration', message: `New broker account created: ${name} (${email})`, type: 'info' }))
      );
    }

    res.json({ success: true, user_id: newUser.id, message: 'Broker account created successfully. User can now login and complete their profile.' });
  } catch (error) {
    console.error('[BROKER-CREATE] Error:', error);
    res.status(500).json({ success: false, message: 'Failed to create broker account', error: error.message });
  }
});

// Get all brokers
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, name, email, phone, status, profile_approved, profile_completed, created_at, broker_profiles(*)')
      .eq('role', 'broker')
      .order('created_at', { ascending: false });
    if (error) throw error;

    const brokers = data.map(u => ({
      user_id: u.id, name: u.name, email: u.email, phone: u.phone,
      account_status: u.status, profile_approved: u.profile_approved,
      profile_completed: u.profile_completed, registered_at: u.created_at,
      ...u.broker_profiles?.[0],
    }));

    res.json(brokers);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get broker by user ID (before /:id to avoid conflict)
router.get('/user/:userId', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, name, email, phone, status, profile_approved, profile_completed, broker_profiles(id, full_name, license_number, profile_status)')
      .eq('id', req.params.userId)
      .eq('role', 'broker')
      .single();

    if (error || !data) return res.status(404).json({ message: 'Broker not found' });

    res.json({ user_id: data.id, name: data.name, email: data.email, phone: data.phone, account_status: data.status, profile_approved: data.profile_approved, profile_completed: data.profile_completed, ...data.broker_profiles?.[0] });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get broker by ID
router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, name, email, phone, status, profile_approved, profile_completed, created_at, broker_profiles(*)')
      .eq('id', req.params.id)
      .eq('role', 'broker')
      .single();

    if (error || !data) return res.status(404).json({ message: 'Broker not found' });

    res.json({ user_id: data.id, name: data.name, email: data.email, phone: data.phone, account_status: data.status, profile_approved: data.profile_approved, profile_completed: data.profile_completed, registered_at: data.created_at, ...data.broker_profiles?.[0] });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update broker (explicit route)
router.put('/update/:id', async (req, res) => {
  try {
    const { name, email, phone, account_status, license_number } = req.body;
    const brokerId = req.params.id;

    const userUpdates = {};
    if (name !== undefined) userUpdates.name = name;
    if (email !== undefined) userUpdates.email = email;
    if (phone !== undefined) userUpdates.phone = phone;
    if (account_status !== undefined) userUpdates.status = account_status;

    if (Object.keys(userUpdates).length > 0) {
      const { error } = await supabase.from('users').update(userUpdates).eq('id', brokerId).eq('role', 'broker');
      if (error) throw error;
    }

    if (license_number !== undefined) {
      const { error } = await supabase.from('broker_profiles').update({ license_number }).eq('user_id', brokerId);
      if (error) throw error;
    }

    res.json({ message: 'Broker updated successfully' });
  } catch (error) {
    console.error('[BROKER-API] Update failed:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create broker profile
router.post('/', async (req, res) => {
  try {
    const { user_id, full_name, phone, address, license_number } = req.body;

    const { data: existing } = await supabase.from('broker_profiles').select('id').eq('user_id', user_id).single();
    if (existing) return res.status(400).json({ message: 'Broker profile already exists' });

    const { data, error } = await supabase
      .from('broker_profiles')
      .insert({ user_id, full_name, phone_number: phone || null, address: address || null, license_number, profile_status: 'pending' })
      .select('id')
      .single();

    if (error) throw error;
    res.json({ id: data.id, message: 'Broker profile created successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update broker account status (legacy)
router.put('/:id', async (req, res) => {
  try {
    const { name, email, phone, status } = req.body;

    const { data: user } = await supabase.from('users').select('id').eq('id', req.params.id).eq('role', 'broker').single();
    if (!user) return res.status(404).json({ message: 'Broker not found' });

    const { error } = await supabase.from('users').update({ name, email, phone, status: status || 'active' }).eq('id', req.params.id);
    if (error) throw error;

    res.json({ message: 'Broker account updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
