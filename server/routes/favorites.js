const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { auth, requireRole } = require('../middleware/auth');

// Helper function to convert BigInt to Number for JSON serialization
const serializeBigInt = (obj) => {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'bigint') return Number(obj);
  if (obj instanceof Date) return obj.toISOString();
  if (Array.isArray(obj)) return obj.map(serializeBigInt);
  if (typeof obj === 'object') {
    const result = {};
    for (const key in obj) {
      result[key] = serializeBigInt(obj[key]);
    }
    return result;
  }
  return obj;
};

// Add to favorites
router.post('/:listingId', auth, requireRole('tenant'), async (req, res) => {
  try {
    const { listingId } = req.params;
    
    // Check if listing exists
    const listings = await pool.query('SELECT id FROM listings WHERE id = ?', [listingId]);
    if (listings.length === 0) {
      return res.status(404).json({ message: 'Listing not found' });
    }
    
    // Check if already favorited
    const existing = await pool.query(
      'SELECT id FROM favorites WHERE tenant_id = ? AND listing_id = ?',
      [req.user.userId, listingId]
    );
    
    if (existing.length > 0) {
      return res.status(400).json({ message: 'Already in favorites' });
    }
    
    await pool.query(
      'INSERT INTO favorites (tenant_id, listing_id) VALUES (?, ?)',
      [req.user.userId, listingId]
    );
    
    res.json({ message: 'Added to favorites' });
  } catch (error) {
    console.error('Add favorite error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Remove from favorites
router.delete('/:listingId', auth, requireRole('tenant'), async (req, res) => {
  try {
    const { listingId } = req.params;
    
    await pool.query(
      'DELETE FROM favorites WHERE tenant_id = ? AND listing_id = ?',
      [req.user.userId, listingId]
    );
    
    res.json({ message: 'Removed from favorites' });
  } catch (error) {
    console.error('Remove favorite error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get user's favorites
router.get('/', auth, requireRole('tenant'), async (req, res) => {
  try {
    const favorites = await pool.query(
      `SELECT 
        l.id,
        l.title,
        l.description,
        l.address,
        l.price,
        l.deposit,
        l.room_type,
        l.status,
        l.is_available,
        (SELECT image_url FROM listing_images WHERE listing_id = l.id AND is_primary = 1 LIMIT 1) as primary_image,
        f.created_at as favorited_at
       FROM favorites f
       INNER JOIN listings l ON f.listing_id = l.id
       WHERE f.tenant_id = ?
       ORDER BY f.created_at DESC`,
      [req.user.userId]
    );
    
    res.json({ favorites: serializeBigInt(favorites) });
  } catch (error) {
    console.error('Get favorites error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Check if listing is favorited
router.get('/check/:listingId', auth, requireRole('tenant'), async (req, res) => {
  try {
    const { listingId } = req.params;
    
    const favorites = await pool.query(
      'SELECT id FROM favorites WHERE tenant_id = ? AND listing_id = ?',
      [req.user.userId, listingId]
    );
    
    res.json({ isFavorited: favorites.length > 0 });
  } catch (error) {
    console.error('Check favorite error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
