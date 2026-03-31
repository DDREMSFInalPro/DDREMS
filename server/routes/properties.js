const express = require('express');
const router = express.Router();
const supabase = require('../config/db');

// Get all properties
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('properties')
      .select(`*, broker:users!broker_id(name), owner:users!owner_id(name), property_images(image_url, image_type)`)
      .order('created_at', { ascending: false });
    if (error) throw error;

    const properties = data.map(p => ({
      ...p,
      broker_name: p.broker?.name || null,
      owner_name: p.owner?.name || null,
      image_count: p.property_images?.length || 0,
      main_image: p.property_images?.find(i => i.image_type === 'main')?.image_url || null,
    }));

    res.json(properties);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get only ACTIVE properties (for customers)
router.get('/active', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('properties')
      .select(`*, broker:users!broker_id(name), owner:users!owner_id(name), property_images(image_url, image_type)`)
      .eq('status', 'active')
      .order('views', { ascending: false });
    if (error) throw error;

    const properties = data.map(p => ({
      ...p,
      broker_name: p.broker?.name || null,
      owner_name: p.owner?.name || null,
      image_count: p.property_images?.length || 0,
      main_image: p.property_images?.find(i => i.image_type === 'main')?.image_url || null,
      views: p.views || 0,
    }));

    res.json(properties);
  } catch (error) {
    console.error('Get active properties error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get property stats for admin dashboard
router.get('/stats', async (req, res) => {
  try {
    const counts = await Promise.all([
      supabase.from('properties').select('*', { count: 'exact', head: true }),
      supabase.from('properties').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('properties').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('properties').select('*', { count: 'exact', head: true }).eq('status', 'sold'),
      supabase.from('properties').select('*', { count: 'exact', head: true }).eq('status', 'rented'),
      supabase.from('properties').select('*', { count: 'exact', head: true }).eq('status', 'inactive'),
      supabase.from('properties').select('*', { count: 'exact', head: true }).eq('status', 'suspended'),
      supabase.from('properties').select('*', { count: 'exact', head: true }).eq('verified', true),
      supabase.from('properties').select('*', { count: 'exact', head: true }).eq('verified', false),
    ]);

    const [total, active, pending, sold, rented, inactive, suspended, verified, unverified] = counts.map(r => r.count || 0);

    const { data: types } = await supabase.from('properties').select('type');
    const { data: listings } = await supabase.from('properties').select('listing_type');
    const { data: agreements } = await supabase.from('agreements').select('amount, created_at').in('status', ['active', 'completed']);
    const { data: brokers } = await supabase.from('users').select('id, name').eq('role', 'broker');
    const { data: brokerProps } = await supabase.from('properties').select('broker_id');

    // Type distribution
    const typeMap = {};
    types?.forEach(p => { typeMap[p.type] = (typeMap[p.type] || 0) + 1; });
    const typeDistribution = Object.entries(typeMap).map(([type, count]) => ({ type, count }));

    // Listing distribution
    const listingMap = {};
    listings?.forEach(p => { listingMap[p.listing_type] = (listingMap[p.listing_type] || 0) + 1; });
    const listingDistribution = Object.entries(listingMap).map(([listing_type, count]) => ({ listing_type, count }));

    // Total revenue
    const totalRevenue = agreements?.reduce((sum, a) => sum + (a.amount || 0), 0) || 0;

    // Broker performance
    const brokerPerformance = brokers?.map(b => ({
      name: b.name,
      count: brokerProps?.filter(p => p.broker_id === b.id).length || 0,
    }));

    res.json({
      total, active, pending, sold, rented, inactive, suspended, verified, unverified,
      totalRevenue,
      typeDistribution,
      listingDistribution,
      monthlyRevenue: [],
      brokerPerformance,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get owner properties
router.get('/owner/:userId', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('properties')
      .select(`*, broker:users!broker_id(name), property_images(image_url, image_type)`)
      .eq('owner_id', req.params.userId)
      .order('created_at', { ascending: false });
    if (error) throw error;

    const properties = data.map(p => ({
      ...p,
      broker_name: p.broker?.name || null,
      image_count: p.property_images?.length || 0,
      main_image: p.property_images?.find(i => i.image_type === 'main')?.image_url || null,
    }));

    res.json(properties);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get pending verification properties
router.get('/pending-verification', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('properties')
      .select(`*, owner:users!owner_id(name, email), broker:users!broker_id(name, email), property_images(image_url, image_type)`)
      .eq('status', 'pending')
      .order('created_at');
    if (error) throw error;

    const properties = data.map(p => ({
      ...p,
      owner_name: p.owner?.name || null,
      owner_email: p.owner?.email || null,
      broker_name: p.broker?.name || null,
      broker_email: p.broker?.email || null,
      image_count: p.property_images?.length || 0,
      main_image: p.property_images?.find(i => i.image_type === 'main')?.image_url || null,
    }));

    res.json(properties);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all properties with verification status (admin)
router.get('/all-with-status', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('properties')
      .select(`*, owner:users!owner_id(name), broker:users!broker_id(name), property_images(image_url, image_type), property_verification(verification_status, verification_notes, verified_at, verified_by)`)
      .order('created_at', { ascending: false });
    if (error) throw error;

    const properties = data.map(p => ({
      ...p,
      owner_name: p.owner?.name || null,
      broker_name: p.broker?.name || null,
      image_count: p.property_images?.length || 0,
      main_image: p.property_images?.find(i => i.image_type === 'main')?.image_url || null,
      verification_status: p.property_verification?.[0]?.verification_status || null,
      verification_notes: p.property_verification?.[0]?.verification_notes || null,
      verified_at: p.property_verification?.[0]?.verified_at || null,
    }));

    res.json(properties);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get recommendations
router.get('/recommendations/:userId', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('properties')
      .select(`*, property_images(image_url, image_type)`)
      .eq('status', 'active')
      .eq('verified', true)
      .order('views', { ascending: false })
      .limit(10);
    if (error) throw error;

    const properties = data.map(p => ({
      ...p,
      main_image: p.property_images?.find(i => i.image_type === 'main')?.image_url || null,
    }));

    res.json(properties);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Verify property
router.put('/:id/verify', async (req, res) => {
  try {
    const { status, verified_by, notes } = req.body;
    const propertyId = req.params.id;

    let propertyStatus = 'active';
    let verified = true;
    if (status === 'rejected') { propertyStatus = 'inactive'; verified = false; }
    else if (status === 'suspended') { propertyStatus = 'suspended'; verified = false; }

    await supabase.from('properties').update({ verified, status: propertyStatus, verification_date: new Date().toISOString() }).eq('id', propertyId);

    const { data: existing } = await supabase.from('property_verification').select('id').eq('property_id', propertyId).single();

    if (existing) {
      await supabase.from('property_verification').update({ verification_status: status, verification_notes: notes, verified_by, verified_at: new Date().toISOString() }).eq('property_id', propertyId);
    } else {
      await supabase.from('property_verification').insert({ property_id: propertyId, verification_status: status, verification_notes: notes, verified_by, verified_at: new Date().toISOString() });
    }

    res.json({ message: `Property ${status} successfully`, status: propertyStatus });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get property by ID
router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('properties')
      .select(`*, broker:users!broker_id(name), owner:users!owner_id(name), property_images(*), property_verification(*)`)
      .eq('id', req.params.id)
      .single();

    if (error || !data) return res.status(404).json({ message: 'Property not found' });

    res.json({
      ...data,
      broker_name: data.broker?.name || null,
      owner_name: data.owner?.name || null,
      image_count: data.property_images?.length || 0,
      images: data.property_images || [],
      verification: data.property_verification?.[0] || null,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create property
router.post('/', async (req, res) => {
  try {
    const {
      title, description, price, location, type, status, broker_id, owner_id,
      bedrooms, bathrooms, area, listing_type, address, city, state, zip_code, features
    } = req.body;

    const { data: newProp, error } = await supabase
      .from('properties')
      .insert({
        title, description, price, location, type,
        status: status || 'pending',
        broker_id: broker_id || null,
        owner_id: owner_id || null,
        bedrooms: bedrooms || null,
        bathrooms: bathrooms || null,
        area: area || null,
        listing_type: listing_type || 'sale',
        address: address || null,
        city: city || null,
        state: state || null,
        zip_code: zip_code || null,
        features: features ? JSON.stringify(features) : null,
      })
      .select('id')
      .single();

    if (error) throw error;

    await supabase.from('property_verification').insert({ property_id: newProp.id, verification_status: 'pending' });

    res.status(201).json({ id: newProp.id, message: 'Property created successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update property
router.put('/:id', async (req, res) => {
  try {
    const { title, description, price, location, type, status, broker_id, bedrooms, bathrooms, area, listing_type } = req.body;
    const { error } = await supabase
      .from('properties')
      .update({ title, description, price, location, type, status, broker_id, bedrooms, bathrooms, area, listing_type: listing_type || 'sale' })
      .eq('id', req.params.id);
    if (error) throw error;
    res.json({ message: 'Property updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete property
router.delete('/:id', async (req, res) => {
  try {
    const { error } = await supabase.from('properties').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ message: 'Property deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
