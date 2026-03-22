const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { auth, requireRole } = require('../middleware/auth');
const multer = require('multer');
const { uploadToCloudinary, deleteFromCloudinary, getPublicIdFromUrl } = require('../config/cloudinary');

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

// Configure multer for memory storage (for Cloudinary upload)
const storage = multer.memoryStorage();

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Get all listings (for tenants - only approved and available)
router.get('/', async (req, res) => {
  try {
    const { search, minPrice, maxPrice, roomType, amenities, limit = 20, offset = 0 } = req.query;
    
    let query = `
      SELECT 
        l.id,
        l.title,
        l.description,
        l.address,
        l.latitude,
        l.longitude,
        l.price,
        l.deposit,
        l.water_price,
        l.electricity_price,
        l.room_type,
        l.status,
        l.is_available,
        l.created_at,
        u.first_name,
        u.last_name,
        u.phone,
        u.line_id,
        (SELECT image_url FROM listing_images WHERE listing_id = l.id AND is_primary = 1 LIMIT 1) as primary_image
      FROM listings l
      INNER JOIN users u ON l.landlord_id = u.id
      WHERE l.status = 'approved' AND l.is_available = 1
    `;
    
    const params = [];
    
    if (search) {
      query += ` AND (l.title LIKE ? OR l.address LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }
    
    if (minPrice) {
      query += ` AND l.price >= ?`;
      params.push(minPrice);
    }
    
    if (maxPrice) {
      query += ` AND l.price <= ?`;
      params.push(maxPrice);
    }
    
    if (roomType) {
      query += ` AND l.room_type = ?`;
      params.push(roomType);
    }
    
    // Filter by amenities
    if (amenities) {
      const amenityIds = amenities.split(',').map(id => parseInt(id)).filter(id => !isNaN(id));
      if (amenityIds.length > 0) {
        query += ` AND l.id IN (
          SELECT listing_id FROM listing_amenities 
          WHERE amenity_id IN (${amenityIds.map(() => '?').join(',')})
          GROUP BY listing_id
          HAVING COUNT(DISTINCT amenity_id) = ?
        )`;
        params.push(...amenityIds, amenityIds.length);
      }
    }
    
    query += ` ORDER BY l.created_at DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));
    
    const listings = await pool.query(query, params);

    // Get amenities for all listings in a single query (fix N+1)
    if (listings.length > 0) {
      const listingIds = listings.map(l => Number(l.id));
      const allAmenities = await pool.query(
        `SELECT la.listing_id, a.id, a.name, a.icon
         FROM amenities a
         INNER JOIN listing_amenities la ON a.id = la.amenity_id
         WHERE la.listing_id IN (${listingIds.map(() => '?').join(',')})`,
        listingIds
      );
      const amenitiesMap = {};
      for (const amenity of allAmenities) {
        const lid = Number(amenity.listing_id);
        if (!amenitiesMap[lid]) amenitiesMap[lid] = [];
        amenitiesMap[lid].push({ id: Number(amenity.id), name: amenity.name, icon: amenity.icon });
      }
      for (const listing of listings) {
        listing.amenities = amenitiesMap[Number(listing.id)] || [];
      }
    }

    res.json({ listings: serializeBigInt(listings) });
  } catch (error) {
    console.error('Get listings error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all amenities with listing counts (for form/filter)
router.get('/amenities/all', async (req, res) => {
  try {
    const amenities = await pool.query(`
      SELECT a.*, COUNT(DISTINCT CASE WHEN l.status = 'approved' AND l.is_available = 1 THEN la.listing_id END) as listing_count
      FROM amenities a
      LEFT JOIN listing_amenities la ON a.id = la.amenity_id
      LEFT JOIN listings l ON la.listing_id = l.id
      GROUP BY a.id
      ORDER BY a.name
    `);
    res.json({ amenities: serializeBigInt(amenities) });
  } catch (error) {
    console.error('Get amenities error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get price distribution for histogram
router.get('/price-stats', async (req, res) => {
  try {
    const stats = await pool.query(`
      SELECT MIN(price) as min_price, MAX(price) as max_price FROM listings
      WHERE status = 'approved' AND is_available = 1
    `);
    const { min_price, max_price } = stats[0];

    // Create 10 buckets between min and max
    const buckets = await pool.query(`
      SELECT
        FLOOR((price - ?) / ?) as bucket_index,
        COUNT(*) as count
      FROM listings
      WHERE status = 'approved' AND is_available = 1 AND price >= ? AND price <= ?
      GROUP BY bucket_index
      ORDER BY bucket_index
    `, [min_price, (max_price - min_price) / 10, min_price, max_price]);

    res.json({ min_price: Number(min_price), max_price: Number(max_price), buckets: serializeBigInt(buckets) });
  } catch (error) {
    console.error('Get price stats error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get single listing details
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const listings = await pool.query(
      `SELECT 
        l.*,
        u.first_name,
        u.last_name,
        u.phone,
        u.line_id,
        u.email as landlord_email
       FROM listings l
       INNER JOIN users u ON l.landlord_id = u.id
       WHERE l.id = ?`,
      [id]
    );
    
    if (listings.length === 0) {
      return res.status(404).json({ message: 'Listing not found' });
    }
    
    const listing = listings[0];
    
    // Get images
    const images = await pool.query(
      'SELECT id, image_url, is_primary, display_order FROM listing_images WHERE listing_id = ? ORDER BY is_primary DESC, display_order ASC',
      [id]
    );
    listing.images = images;
    
    // Get amenities
    const amenities = await pool.query(
      `SELECT a.id, a.name, a.icon 
       FROM amenities a
       INNER JOIN listing_amenities la ON a.id = la.amenity_id
       WHERE la.listing_id = ?`,
      [id]
    );
    listing.amenities = amenities;
    
    res.json({ listing: serializeBigInt(listing) });
  } catch (error) {
    console.error('Get listing error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get landlord's listings (Dashboard)
router.get('/landlord/my-listings', auth, requireRole('landlord', 'admin'), async (req, res) => {
  try {
    const listings = await pool.query(
      `SELECT 
        l.*,
        (SELECT COUNT(*) FROM listing_images WHERE listing_id = l.id) as image_count,
        (SELECT image_url FROM listing_images WHERE listing_id = l.id AND is_primary = 1 LIMIT 1) as primary_image
       FROM listings l
       WHERE l.landlord_id = ?
       ORDER BY l.created_at DESC`,
      [req.user.userId]
    );
    
    res.json({ listings: serializeBigInt(listings) });
  } catch (error) {
    console.error('Get landlord listings error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create listing
router.post('/', auth, requireRole('landlord', 'admin'), upload.array('images', 10), async (req, res) => {
  const {
    title,
    description,
    address,
    latitude,
    longitude,
    price,
    deposit,
    waterPrice,
    electricityPrice,
    roomType,
    amenities
  } = req.body;

  // Backend validation for required fields
  if (!title || !title.trim()) {
    return res.status(400).json({ message: 'กรุณากรอกชื่อหอพัก' });
  }
  if (!address || !address.trim()) {
    return res.status(400).json({ message: 'กรุณากรอกที่อยู่' });
  }
  if (!price || isNaN(parseFloat(price)) || parseFloat(price) < 0) {
    return res.status(400).json({ message: 'กรุณากรอกราคาเช่าที่ถูกต้อง' });
  }
  if (!roomType || !['studio', 'one_bedroom', 'two_bedroom'].includes(roomType)) {
    return res.status(400).json({ message: 'ประเภทห้องไม่ถูกต้อง' });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Create listing
    const result = await conn.query(
      `INSERT INTO listings
       (landlord_id, title, description, address, latitude, longitude, price, deposit, water_price, electricity_price, room_type, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [
        req.user.userId,
        title.trim(),
        description || null,
        address.trim(),
        latitude || null,
        longitude || null,
        parseFloat(price),
        deposit && !isNaN(parseFloat(deposit)) ? parseFloat(deposit) : null,
        waterPrice && !isNaN(parseFloat(waterPrice)) ? parseFloat(waterPrice) : null,
        electricityPrice && !isNaN(parseFloat(electricityPrice)) ? parseFloat(electricityPrice) : null,
        roomType
      ]
    );

    // Convert BigInt to Number
    const listingId = Number(result.insertId);

    // Add amenities
    if (amenities) {
      const amenityIds = Array.isArray(amenities) ? amenities : JSON.parse(amenities);
      for (let amenityId of amenityIds) {
        await conn.query(
          'INSERT INTO listing_amenities (listing_id, amenity_id) VALUES (?, ?)',
          [listingId, amenityId]
        );
      }
    }

    await conn.commit();

    // Upload images to Cloudinary (outside transaction since it's an external service)
    const failedUploads = [];
    if (req.files && req.files.length > 0) {
      for (let i = 0; i < req.files.length; i++) {
        const file = req.files[i];
        const isPrimary = i === 0;
        try {
          const uploadResult = await uploadToCloudinary(file.buffer, 'rental-system/listings');
          await pool.query(
            `INSERT INTO listing_images (listing_id, image_url, is_primary, display_order)
             VALUES (?, ?, ?, ?)`,
            [listingId, uploadResult.secure_url, isPrimary ? 1 : 0, i]
          );
        } catch (uploadError) {
          console.error('Error uploading to Cloudinary:', uploadError);
          failedUploads.push(i + 1);
        }
      }
    }

    const response = { message: 'Listing created successfully', listingId };
    if (failedUploads.length > 0) {
      response.imageWarning = `รูปที่ ${failedUploads.join(', ')} อัปโหลดไม่สำเร็จ`;
    }
    res.status(201).json(response);
  } catch (error) {
    await conn.rollback();
    console.error('Create listing error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  } finally {
    conn.release();
  }
});

// Update listing
router.put('/:id', auth, requireRole('landlord', 'admin'), upload.array('images', 10), async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      address,
      latitude,
      longitude,
      price,
      deposit,
      waterPrice,
      electricityPrice,
      roomType,
      amenities
    } = req.body;
    
    // Check ownership
    const listings = await pool.query('SELECT landlord_id FROM listings WHERE id = ?', [id]);
    if (listings.length === 0) {
      return res.status(404).json({ message: 'Listing not found' });
    }
    if (listings[0].landlord_id !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden' });
    }
    
    // Update listing
    await pool.query(
      `UPDATE listings SET
       title = ?, description = ?, address = ?, latitude = ?, longitude = ?,
       price = ?, deposit = ?, water_price = ?, electricity_price = ?, room_type = ?
       WHERE id = ?`,
      [
        title,
        description,
        address,
        latitude || null,
        longitude || null,
        parseFloat(price),
        deposit && !isNaN(parseFloat(deposit)) ? parseFloat(deposit) : null,
        waterPrice && !isNaN(parseFloat(waterPrice)) ? parseFloat(waterPrice) : null,
        electricityPrice && !isNaN(parseFloat(electricityPrice)) ? parseFloat(electricityPrice) : null,
        roomType,
        id
      ]
    );
    
    // Update amenities
    if (amenities) {
      await pool.query('DELETE FROM listing_amenities WHERE listing_id = ?', [id]);
      const amenityIds = Array.isArray(amenities) ? amenities : JSON.parse(amenities);
      for (let amenityId of amenityIds) {
        await pool.query(
          'INSERT INTO listing_amenities (listing_id, amenity_id) VALUES (?, ?)',
          [id, amenityId]
        );
      }
    }
    
    // Add new images to Cloudinary if any
    if (req.files && req.files.length > 0) {
      const existingImages = await pool.query('SELECT COUNT(*) as count FROM listing_images WHERE listing_id = ?', [id]);
      const startOrder = Number(existingImages[0].count);
      
      for (let i = 0; i < req.files.length; i++) {
        const file = req.files[i];
        try {
          const result = await uploadToCloudinary(file.buffer, 'rental-system/listings');
          await pool.query(
            `INSERT INTO listing_images (listing_id, image_url, is_primary, display_order)
             VALUES (?, ?, 0, ?)`,
            [id, result.secure_url, startOrder + i]
          );
        } catch (uploadError) {
          console.error('Error uploading to Cloudinary:', uploadError);
        }
      }
    }
    
    res.json({ message: 'Listing updated successfully' });
  } catch (error) {
    console.error('Update listing error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Toggle availability
router.patch('/:id/toggle-availability', auth, requireRole('landlord', 'admin'), async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check ownership
    const listings = await pool.query('SELECT landlord_id, is_available FROM listings WHERE id = ?', [id]);
    if (listings.length === 0) {
      return res.status(404).json({ message: 'Listing not found' });
    }
    if (listings[0].landlord_id !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden' });
    }
    
    const newStatus = listings[0].is_available ? 0 : 1;
    await pool.query('UPDATE listings SET is_available = ? WHERE id = ?', [newStatus, id]);
    
    res.json({ message: 'Availability updated', isAvailable: newStatus === 1 });
  } catch (error) {
    console.error('Toggle availability error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete listing
router.delete('/:id', auth, requireRole('landlord', 'admin'), async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check ownership
    const listings = await pool.query('SELECT landlord_id FROM listings WHERE id = ?', [id]);
    if (listings.length === 0) {
      return res.status(404).json({ message: 'Listing not found' });
    }
    if (listings[0].landlord_id !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden' });
    }
    
    await pool.query('DELETE FROM listings WHERE id = ?', [id]);
    
    res.json({ message: 'Listing deleted successfully' });
  } catch (error) {
    console.error('Delete listing error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete listing image
router.delete('/:listingId/images/:imageId', auth, requireRole('landlord', 'admin'), async (req, res) => {
  try {
    const { listingId, imageId } = req.params;
    
    // Check ownership
    const listings = await pool.query('SELECT landlord_id FROM listings WHERE id = ?', [listingId]);
    if (listings.length === 0) {
      return res.status(404).json({ message: 'Listing not found' });
    }
    if (listings[0].landlord_id !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden' });
    }
    
    // Get image info
    const images = await pool.query('SELECT image_url, is_primary FROM listing_images WHERE id = ? AND listing_id = ?', [imageId, listingId]);
    if (images.length === 0) {
      return res.status(404).json({ message: 'Image not found' });
    }
    
    const image = images[0];
    
    // Delete from Cloudinary
    const publicId = getPublicIdFromUrl(image.image_url);
    if (publicId) {
      try {
        await deleteFromCloudinary(publicId);
      } catch (cloudinaryError) {
        console.error('Error deleting from Cloudinary:', cloudinaryError);
      }
    }
    
    // Delete from database
    await pool.query('DELETE FROM listing_images WHERE id = ?', [imageId]);
    
    // If deleted image was primary, set another image as primary
    if (image.is_primary) {
      const remainingImages = await pool.query(
        'SELECT id FROM listing_images WHERE listing_id = ? ORDER BY display_order LIMIT 1',
        [listingId]
      );
      if (remainingImages.length > 0) {
        await pool.query('UPDATE listing_images SET is_primary = 1 WHERE id = ?', [remainingImages[0].id]);
      }
    }
    
    res.json({ message: 'Image deleted successfully' });
  } catch (error) {
    console.error('Delete image error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Set primary image
router.patch('/:listingId/images/:imageId/primary', auth, requireRole('landlord', 'admin'), async (req, res) => {
  try {
    const { listingId, imageId } = req.params;
    
    // Check ownership
    const listings = await pool.query('SELECT landlord_id FROM listings WHERE id = ?', [listingId]);
    if (listings.length === 0) {
      return res.status(404).json({ message: 'Listing not found' });
    }
    if (listings[0].landlord_id !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden' });
    }
    
    // Reset all images to non-primary
    await pool.query('UPDATE listing_images SET is_primary = 0 WHERE listing_id = ?', [listingId]);
    
    // Set selected image as primary
    await pool.query('UPDATE listing_images SET is_primary = 1 WHERE id = ? AND listing_id = ?', [imageId, listingId]);
    
    res.json({ message: 'Primary image updated' });
  } catch (error) {
    console.error('Set primary image error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
