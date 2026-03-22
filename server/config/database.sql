-- =====================================================
-- Rental System Database Schema
-- Version: 2.0
-- Last Updated: 2026-01-16
-- =====================================================

-- สร้างฐานข้อมูล
CREATE DATABASE IF NOT EXISTS rental_system 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE rental_system;

-- =====================================================
-- ตาราง: users (ผู้ใช้งาน)
-- =====================================================
DROP TABLE IF EXISTS favorites;
DROP TABLE IF EXISTS listing_amenities;
DROP TABLE IF EXISTS listing_images;
DROP TABLE IF EXISTS listings;
DROP TABLE IF EXISTS amenities;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(255) UNIQUE NOT NULL COMMENT 'อีเมลสำหรับเข้าสู่ระบบ',
  password VARCHAR(255) NOT NULL COMMENT 'รหัสผ่าน (bcrypt hash)',
  first_name VARCHAR(100) NOT NULL COMMENT 'ชื่อ',
  last_name VARCHAR(100) NOT NULL COMMENT 'นามสกุล',
  role ENUM('tenant', 'landlord', 'admin') NOT NULL DEFAULT 'tenant' COMMENT 'บทบาท: ผู้เช่า/เจ้าของหอ/ผู้ดูแล',
  phone VARCHAR(20) DEFAULT NULL COMMENT 'เบอร์โทรศัพท์',
  line_id VARCHAR(100) DEFAULT NULL COMMENT 'LINE ID',
  is_banned BOOLEAN DEFAULT FALSE COMMENT 'สถานะถูกระงับ',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'วันที่สร้าง',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'วันที่อัปเดต',
  INDEX idx_email (email),
  INDEX idx_role (role),
  INDEX idx_is_banned (is_banned)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='ตารางผู้ใช้งาน';

-- =====================================================
-- ตาราง: amenities (สิ่งอำนวยความสะดวก)
-- =====================================================
CREATE TABLE amenities (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL UNIQUE COMMENT 'ชื่อสิ่งอำนวยความสะดวก',
  name_th VARCHAR(100) DEFAULT NULL COMMENT 'ชื่อภาษาไทย',
  icon VARCHAR(50) DEFAULT NULL COMMENT 'ไอคอน'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='ตารางสิ่งอำนวยความสะดวก';

-- =====================================================
-- ตาราง: listings (ประกาศหอพัก)
-- =====================================================
CREATE TABLE listings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  landlord_id INT NOT NULL COMMENT 'รหัสเจ้าของหอ',
  title VARCHAR(255) NOT NULL COMMENT 'ชื่อประกาศ',
  description TEXT COMMENT 'รายละเอียด',
  address TEXT NOT NULL COMMENT 'ที่อยู่',
  latitude DECIMAL(10, 8) DEFAULT NULL COMMENT 'ละติจูด',
  longitude DECIMAL(11, 8) DEFAULT NULL COMMENT 'ลองจิจูด',
  price DECIMAL(10, 2) NOT NULL COMMENT 'ราคาเช่า/เดือน',
  deposit DECIMAL(10, 2) DEFAULT NULL COMMENT 'ค่ามัดจำ',
  water_price DECIMAL(10, 2) DEFAULT NULL COMMENT 'ค่าน้ำ/หน่วย',
  electricity_price DECIMAL(10, 2) DEFAULT NULL COMMENT 'ค่าไฟ/หน่วย',
  room_type ENUM('studio', 'one_bedroom', 'two_bedroom') NOT NULL DEFAULT 'studio' COMMENT 'ประเภทห้อง: Studio/1 Bedroom/2 Bedroom',
  status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending' COMMENT 'สถานะการอนุมัติ',
  rejection_reason VARCHAR(500) DEFAULT NULL COMMENT 'เหตุผลการปฏิเสธ',
  is_available BOOLEAN DEFAULT TRUE COMMENT 'สถานะว่าง/เต็ม',
  view_count INT DEFAULT 0 COMMENT 'จำนวนการเข้าชม',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'วันที่สร้าง',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'วันที่อัปเดต',
  FOREIGN KEY (landlord_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_landlord (landlord_id),
  INDEX idx_status (status),
  INDEX idx_is_available (is_available),
  INDEX idx_price (price),
  INDEX idx_room_type (room_type),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='ตารางประกาศหอพัก';

-- =====================================================
-- ตาราง: listing_amenities (ความสัมพันธ์ประกาศ-สิ่งอำนวยความสะดวก)
-- =====================================================
CREATE TABLE listing_amenities (
  listing_id INT NOT NULL COMMENT 'รหัสประกาศ',
  amenity_id INT NOT NULL COMMENT 'รหัสสิ่งอำนวยความสะดวก',
  PRIMARY KEY (listing_id, amenity_id),
  FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE,
  FOREIGN KEY (amenity_id) REFERENCES amenities(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='ตารางความสัมพันธ์ประกาศและสิ่งอำนวยความสะดวก';

-- =====================================================
-- ตาราง: listing_images (รูปภาพประกาศ)
-- =====================================================
CREATE TABLE listing_images (
  id INT PRIMARY KEY AUTO_INCREMENT,
  listing_id INT NOT NULL COMMENT 'รหัสประกาศ',
  image_url VARCHAR(500) NOT NULL COMMENT 'URL รูปภาพ (Cloudinary)',
  public_id VARCHAR(255) DEFAULT NULL COMMENT 'Cloudinary Public ID',
  is_primary BOOLEAN DEFAULT FALSE COMMENT 'รูปหลัก',
  display_order INT DEFAULT 0 COMMENT 'ลำดับการแสดง',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'วันที่อัปโหลด',
  FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE,
  INDEX idx_listing (listing_id),
  INDEX idx_is_primary (is_primary)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='ตารางรูปภาพประกาศ';

-- =====================================================
-- ตาราง: favorites (รายการโปรด)
-- =====================================================
CREATE TABLE favorites (
  id INT PRIMARY KEY AUTO_INCREMENT,
  tenant_id INT NOT NULL COMMENT 'รหัสผู้เช่า',
  listing_id INT NOT NULL COMMENT 'รหัสประกาศ',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'วันที่เพิ่ม',
  UNIQUE KEY unique_favorite (tenant_id, listing_id),
  FOREIGN KEY (tenant_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE,
  INDEX idx_tenant (tenant_id),
  INDEX idx_listing (listing_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='ตารางรายการโปรด';

-- =====================================================
-- ข้อมูลเริ่มต้น: สิ่งอำนวยความสะดวก
-- =====================================================
INSERT INTO amenities (name, name_th, icon) VALUES
('อินเทอร์เน็ต WiFi', 'อินเทอร์เน็ต WiFi', 'wifi'),
('เครื่องปรับอากาศ', 'เครื่องปรับอากาศ', 'ac'),
('น้ำอุ่น', 'น้ำอุ่น', 'hot-water'),
('คีย์การ์ด', 'คีย์การ์ด', 'key-card'),
('เลี้ยงสัตว์ได้', 'เลี้ยงสัตว์ได้', 'pet'),
('ที่จอดรถ', 'ที่จอดรถ', 'parking'),
('ใกล้ BTS/MRT', 'ใกล้ BTS/MRT', 'transit'),
('รปภ. 24 ชม.', 'รปภ. 24 ชม.', 'security'),
('ลิฟต์', 'ลิฟต์', 'elevator'),
('เฟอร์นิเจอร์ครบ', 'เฟอร์นิเจอร์ครบ', 'furnished'),
('กล้องวงจรปิด', 'กล้องวงจรปิด', 'cctv'),
('เครื่องซักผ้า', 'เครื่องซักผ้า', 'washing'),
('ตู้เย็น', 'ตู้เย็น', 'fridge'),
('โทรทัศน์', 'โทรทัศน์', 'tv'),
('ไมโครเวฟ', 'ไมโครเวฟ', 'microwave');

