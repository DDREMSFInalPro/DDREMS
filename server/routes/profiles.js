const express = require('express');
const router = express.Router();
const supabase = require('../config/db');

const profileTableMap = {
  customer: 'customer_profiles',
  owner: 'owner_profiles',
  broker: 'broker_profiles',
};

// ============================================================================
// CUSTOMER PROFILE ROUTES
// ============================================================================

router.get('/customer', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('customer_profiles')
      .select('*, users(name, email)')
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data.map(p => ({ ...p, user_name: p.users?.name, user_email: p.users?.email })));
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/customer/:userId', async (req, res) => {
  try {
    const { data: profile } = await supabase
      .from('customer_profiles')
      .select('*, users(name, email, phone)')
      .eq('user_id', req.params.userId)
      .single();

    if (!profile) {
      const { data: user } = await supabase.from('users').select('id, name, email, phone').eq('id', req.params.userId).single();
      if (!user) return res.status(404).json({ message: 'User not found' });
      return res.json(user);
    }
    res.json({ ...profile, name: profile.users?.name, email: profile.users?.email, phone: profile.users?.phone });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post('/customer', async (req, res) => {
  try {
    const { user_id, full_name, phone_number, address, profile_photo, id_document } = req.body;
    const { data: existing } = await supabase.from('customer_profiles').select('id').eq('user_id', user_id).single();
    if (existing) return res.status(400).json({ message: 'Profile already exists' });

    const { data, error } = await supabase.from('customer_profiles')
      .insert({ user_id, full_name, phone_number, address, profile_photo, id_document, profile_status: 'pending' })
      .select('id').single();
    if (error) throw error;

    await supabase.from('users').update({ profile_completed: true }).eq('id', user_id);
    res.status(201).json({ message: 'Profile created successfully. Waiting for admin approval.', profileId: data.id });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.put('/customer/:id', async (req, res) => {
  try {
    const { full_name, phone_number, address, profile_photo, id_document } = req.body;
    const { error } = await supabase.from('customer_profiles')
      .update({ full_name, phone_number, address, profile_photo, id_document })
      .eq('id', req.params.id);
    if (error) throw error;
    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post('/customer/request-edit', async (req, res) => {
  try {
    const { user_id, profile_id } = req.body;
    const { data: existing } = await supabase.from('profile_edit_requests').select('id').eq('user_id', user_id).eq('status', 'pending').single();
    if (existing) return res.status(400).json({ message: 'You already have a pending edit request' });

    await supabase.from('profile_edit_requests').insert({ user_id, profile_id, request_type: 'customer', status: 'pending' });

    const { data: user } = await supabase.from('users').select('name').eq('id', user_id).single();
    const { data: admins } = await supabase.from('users').select('id').eq('role', 'admin');
    if (admins?.length) {
      await supabase.from('notifications').insert(admins.map(a => ({ user_id: a.id, title: 'Profile Edit Request', message: `Customer ${user?.name} has requested permission to edit their profile`, type: 'info' })));
    }
    res.json({ message: 'Edit request submitted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ============================================================================
// OWNER PROFILE ROUTES
// ============================================================================

router.get('/owner', async (req, res) => {
  try {
    const { data, error } = await supabase.from('owner_profiles').select('*, users(name, email)').order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data.map(p => ({ ...p, user_name: p.users?.name, user_email: p.users?.email })));
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/owner/:userId', async (req, res) => {
  try {
    const { data: profile } = await supabase.from('owner_profiles').select('*, users(name, email, phone)').eq('user_id', req.params.userId).single();
    if (!profile) {
      const { data: user } = await supabase.from('users').select('id, name, email, phone').eq('id', req.params.userId).single();
      if (!user) return res.status(404).json({ message: 'User not found' });
      return res.json(user);
    }
    res.json({ ...profile, name: profile.users?.name, email: profile.users?.email, phone: profile.users?.phone });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post('/owner', async (req, res) => {
  try {
    const { user_id, full_name, phone_number, address, profile_photo, id_document, business_license } = req.body;
    const { data: existing } = await supabase.from('owner_profiles').select('id').eq('user_id', user_id).single();
    if (existing) return res.status(400).json({ message: 'Profile already exists' });

    const { data, error } = await supabase.from('owner_profiles')
      .insert({ user_id, full_name, phone_number, address, profile_photo, id_document, business_license, profile_status: 'pending' })
      .select('id').single();
    if (error) throw error;

    await supabase.from('users').update({ profile_completed: true }).eq('id', user_id);
    res.status(201).json({ message: 'Profile created successfully. Waiting for admin approval.', profileId: data.id });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.put('/owner/:id', async (req, res) => {
  try {
    const { full_name, phone_number, address, profile_photo, id_document, business_license } = req.body;
    const { error } = await supabase.from('owner_profiles').update({ full_name, phone_number, address, profile_photo, id_document, business_license }).eq('id', req.params.id);
    if (error) throw error;
    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ============================================================================
// BROKER PROFILE ROUTES
// ============================================================================

router.get('/broker', async (req, res) => {
  try {
    const { data, error } = await supabase.from('broker_profiles').select('*, users(name, email)').order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data.map(p => ({ ...p, user_name: p.users?.name, user_email: p.users?.email })));
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/broker/:userId', async (req, res) => {
  try {
    const { data, error } = await supabase.from('broker_profiles').select('*').eq('user_id', req.params.userId).single();
    if (error || !data) return res.status(404).json({ message: 'Profile not found' });
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post('/broker', async (req, res) => {
  try {
    const { user_id, full_name, phone_number, address, profile_photo, id_document, broker_license, license_number } = req.body;
    const { data: existing } = await supabase.from('broker_profiles').select('id').eq('user_id', user_id).single();
    if (existing) return res.status(400).json({ message: 'Profile already exists' });

    const { data, error } = await supabase.from('broker_profiles')
      .insert({ user_id, full_name, phone_number, address, profile_photo, id_document, broker_license, license_number, profile_status: 'pending' })
      .select('id').single();
    if (error) throw error;

    await supabase.from('users').update({ profile_completed: true }).eq('id', user_id);
    res.status(201).json({ message: 'Profile created successfully. Waiting for admin approval.', profileId: data.id });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.put('/broker/:id', async (req, res) => {
  try {
    const { full_name, phone_number, address, profile_photo, id_document, broker_license, license_number } = req.body;
    const { error } = await supabase.from('broker_profiles').update({ full_name, phone_number, address, profile_photo, id_document, broker_license, license_number }).eq('id', req.params.id);
    if (error) throw error;
    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ============================================================================
// ADMIN PROFILE APPROVAL ROUTES
// ============================================================================

router.get('/pending', async (req, res) => {
  try {
    const [{ data: customers }, { data: owners }, { data: brokers }] = await Promise.all([
      supabase.from('customer_profiles').select('*, users(name, email)').eq('profile_status', 'pending'),
      supabase.from('owner_profiles').select('*, users(name, email)').eq('profile_status', 'pending'),
      supabase.from('broker_profiles').select('*, users(name, email)').eq('profile_status', 'pending'),
    ]);

    const fmt = (arr, type) => (arr || []).map(p => ({ ...p, user_name: p.users?.name, user_email: p.users?.email, profile_type: type }));
    const c = fmt(customers, 'customer'), o = fmt(owners, 'owner'), b = fmt(brokers, 'broker');
    res.json({ customers: c, owners: o, brokers: b, total: c.length + o.length + b.length });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Shared helper for approve/reject/suspend/change-status
async function changeProfileStatus(profileType, profileId, newStatus, adminId, reason) {
  const tableName = profileTableMap[profileType];
  if (!tableName) throw new Error('Invalid profile type');

  const { data: profile } = await supabase.from(tableName).select('user_id, profile_status').eq('id', profileId).single();
  if (!profile) throw new Error('Profile not found');

  const previousStatus = profile.profile_status;
  const userId = profile.user_id;

  await supabase.from(tableName).update({
    profile_status: newStatus,
    approved_by: adminId,
    approved_at: new Date().toISOString(),
    rejection_reason: newStatus === 'rejected' || newStatus === 'suspended' ? (reason || null) : null,
  }).eq('id', profileId);

  await supabase.from('users').update({ profile_approved: newStatus === 'approved' }).eq('id', userId);

  await supabase.from('profile_status_history').insert({
    profile_id: profileId, profile_type: profileType,
    old_status: previousStatus, new_status: newStatus,
    changed_by: adminId, reason: reason || `Changed to ${newStatus}`,
  });

  const notifMessages = {
    approved: 'Your profile has been approved. You now have full access to all features.',
    rejected: `Your profile has been rejected. Reason: ${reason || 'See admin for details'}`,
    suspended: `Your profile has been suspended. Reason: ${reason || 'Contact support for details'}`,
    pending: 'Your profile status has been changed to pending review.',
  };
  const notifTypes = { approved: 'success', rejected: 'error', suspended: 'warning', pending: 'info' };

  await supabase.from('notifications').insert({
    user_id: userId, title: `Profile ${newStatus}`,
    message: notifMessages[newStatus], type: notifTypes[newStatus],
  });

  return { previousStatus, newStatus, userId };
}

router.post('/approve/:profileType/:profileId', async (req, res) => {
  try {
    const result = await changeProfileStatus(req.params.profileType, req.params.profileId, 'approved', req.body.adminId, null);
    res.json({ message: 'Profile approved successfully', ...result });
  } catch (error) {
    res.status(error.message === 'Profile not found' ? 404 : 500).json({ message: error.message });
  }
});

router.post('/suspend/:profileType/:profileId', async (req, res) => {
  try {
    const result = await changeProfileStatus(req.params.profileType, req.params.profileId, 'suspended', req.body.adminId, req.body.reason);
    res.json({ message: 'Profile suspended', ...result });
  } catch (error) {
    res.status(error.message === 'Profile not found' ? 404 : 500).json({ message: error.message });
  }
});

router.post('/reject/:profileType/:profileId', async (req, res) => {
  try {
    const result = await changeProfileStatus(req.params.profileType, req.params.profileId, 'rejected', req.body.adminId, req.body.rejectionReason);
    res.json({ message: 'Profile rejected', ...result });
  } catch (error) {
    res.status(error.message === 'Profile not found' ? 404 : 500).json({ message: error.message });
  }
});

router.post('/change-status/:profileType/:profileId', async (req, res) => {
  try {
    const { newStatus, adminId, reason } = req.body;
    const validStatuses = ['pending', 'approved', 'rejected', 'suspended'];
    if (!validStatuses.includes(newStatus)) return res.status(400).json({ message: 'Invalid status' });
    const result = await changeProfileStatus(req.params.profileType, req.params.profileId, newStatus, adminId, reason);
    res.json({ message: 'Profile status changed successfully', ...result });
  } catch (error) {
    res.status(error.message === 'Profile not found' ? 404 : 500).json({ message: error.message });
  }
});

router.get('/history/:profileType/:profileId', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('profile_status_history')
      .select('*, users(name)')
      .eq('profile_id', req.params.profileId)
      .eq('profile_type', req.params.profileType)
      .order('changed_at', { ascending: false });
    if (error) throw error;
    res.json(data.map(h => ({ ...h, changed_by_name: h.users?.name })));
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
