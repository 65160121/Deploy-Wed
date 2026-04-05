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

// Get pending listings for approval
router.get('/listings/pending', auth, requireRole('admin'), async (req, res) => {
  try {
    const listings = await pool.query(
      `SELECT 
        l.*,
        u.first_name,
        u.last_name,
        u.email as landlord_email,
        (SELECT COUNT(*) FROM listing_images WHERE listing_id = l.id) as image_count,
        (SELECT image_url FROM listing_images WHERE listing_id = l.id AND is_primary = 1 LIMIT 1) as primary_image
       FROM listings l
       INNER JOIN users u ON l.landlord_id = u.id
       WHERE l.status = 'pending'
       ORDER BY l.created_at ASC`
    );
    
    res.json({ listings: serializeBigInt(listings) });
  } catch (error) {
    console.error('Get pending listings error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Approve listing
router.post('/listings/:id/approve', auth, requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    
    await pool.query(
      "UPDATE listings SET status = 'approved' WHERE id = ?",
      [id]
    );
    
    res.json({ message: 'Listing approved' });
  } catch (error) {
    console.error('Approve listing error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Reject listing
router.post('/listings/:id/reject', auth, requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    await pool.query(
      "UPDATE listings SET status = 'rejected', rejection_reason = ? WHERE id = ?",
      [reason || null, id]
    );

    res.json({ message: 'Listing rejected' });
  } catch (error) {
    console.error('Reject listing error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all users
router.get('/users', auth, requireRole('admin'), async (req, res) => {
  try {
    const users = await pool.query(
      `SELECT 
        id,
        email,
        first_name,
        last_name,
        role,
        phone,
        line_id,
        is_banned,
        created_at,
        (SELECT COUNT(*) FROM listings WHERE landlord_id = users.id) as listing_count
       FROM users
       ORDER BY id ASC`
    );
    
    res.json({ users: serializeBigInt(users) });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Ban/Unban user
router.post('/users/:id/ban', auth, requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { isBanned } = req.body;
    
    // Prevent admin from banning themselves
    if (parseInt(id) === req.user.userId) {
      return res.status(400).json({ message: 'ไม่สามารถระงับบัญชีของตัวเองได้' });
    }
    
    await pool.query(
      'UPDATE users SET is_banned = ? WHERE id = ?',
      [isBanned ? 1 : 0, id]
    );
    
    res.json({ message: isBanned ? 'User banned' : 'User unbanned' });
  } catch (error) {
    console.error('Ban user error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get dashboard statistics
router.get('/stats', auth, requireRole('admin'), async (req, res) => {
  try {
    // Total users by role
    const userStats = await pool.query(`
      SELECT 
        role,
        COUNT(*) as count
      FROM users
      GROUP BY role
    `);

    // Total listings by status
    const listingStats = await pool.query(`
      SELECT 
        status,
        COUNT(*) as count
      FROM listings
      GROUP BY status
    `);

    // Pending listings count
    const pendingListings = await pool.query(`
      SELECT COUNT(*) as count FROM listings WHERE status = 'pending'
    `);

    // Banned users count
    const bannedUsers = await pool.query(`
      SELECT COUNT(*) as count FROM users WHERE is_banned = 1
    `);

    // Recent listings (last 7 days)
    const recentListings = await pool.query(`
      SELECT COUNT(*) as count FROM listings 
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
    `);

    // Recent users (last 7 days)
    const recentUsers = await pool.query(`
      SELECT COUNT(*) as count FROM users 
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
    `);

    // Total counts
    const totalUsers = await pool.query('SELECT COUNT(*) as count FROM users');
    const totalListings = await pool.query('SELECT COUNT(*) as count FROM listings');

    res.json({
      stats: {
        totalUsers: Number(totalUsers[0].count),
        totalListings: Number(totalListings[0].count),
        pendingListings: Number(pendingListings[0].count),
        bannedUsers: Number(bannedUsers[0].count),
        recentListings: Number(recentListings[0].count),
        recentUsers: Number(recentUsers[0].count),
        usersByRole: userStats.reduce((acc, item) => {
          acc[item.role] = Number(item.count);
          return acc;
        }, {}),
        listingsByStatus: listingStats.reduce((acc, item) => {
          acc[item.status] = Number(item.count);
          return acc;
        }, {})
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
