# ระบบหอพัก - Rental System

ระบบจัดการหอพักที่สมบูรณ์พร้อมด้วย Role-based Access Control สำหรับ Tenant, Landlord และ Admin

## โครงสร้างโปรเจ็กต์

```
Rental-System/
├── client/          # React Client
├── server/          # Express.js Server API
└── database/        # Database Schema
```

## เทคโนโลยีที่ใช้

- **Client**: React + Vite + React Router
- **Server**: Node.js + Express.js
- **Database**: MariaDB
- **Authentication**: JWT (JSON Web Token)

## การติดตั้ง

### 1. ติดตั้ง Server Dependencies

```bash
cd server
npm install
```

### 2. ติดตั้ง Client Dependencies

```bash
cd client
npm install
```

### 3. ตั้งค่า Database

1. สร้างฐานข้อมูล MariaDB
2. รันไฟล์ SQL schema:
```bash
mysql -u root -p < server/config/database.sql
```

### 4. ตั้งค่า Environment Variables

สร้างไฟล์ `.env` ในโฟลเดอร์ `server/`:

```env
PORT=5000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=rental_system
JWT_SECRET=your_jwt_secret_key_here
```

## การรันโปรเจ็กต์

### รัน Server

```bash
cd server
npm run dev
```

Server จะรันที่ `http://localhost:5000`

### รัน Client

```bash
cd client
npm run dev
```

Client จะรันที่ `http://localhost:3000`

## ฟีเจอร์หลัก

### 1. ระบบยืนยันตัวตน (Authentication)
- ✅ สมัครสมาชิก (Register) - เลือก Role: Tenant หรือ Landlord
- ✅ เข้าสู่ระบบ (Login)
- ✅ JWT Token Authentication

### 2. ส่วนของผู้เช่า (Tenant)
- ✅ หน้าหลักพร้อม Search Bar
- ✅ ค้นหาและกรองหอพัก (ราคา, ประเภทห้อง, สิ่งอำนวยความสะดวก)
- ✅ ดูรายละเอียดหอพัก (รูปภาพ, แผนที่, ข้อมูลครบถ้วน)
- ✅ บันทึกรายการโปรด (Favorites)
- ✅ ติดต่อเจ้าของหอพัก (แสดงเบอร์โทร/Line ID)

### 3. ส่วนของเจ้าของหอพัก (Landlord)
- ✅ แดชบอร์ดจัดการประกาศ
- ✅ ลงประกาศหอพัก (Multi-step form)
- ✅ แก้ไข/ลบประกาศ
- ✅ Toggle Availability (เปิด/ปิดสถานะว่าง/เต็ม)

### 4. ส่วนของผู้ดูแลระบบ (Admin)
- ✅ อนุมัติ/ไม่อนุมัติประกาศ
- ✅ จัดการผู้ใช้ (Ban/Unban)
- ✅ แดชบอร์ดพร้อมสถิติ (จำนวนผู้ใช้, ประกาศ, รออนุมัติ, ถูกระงับ)

### 5. ระบบโปรไฟล์ผู้ใช้
- ✅ แก้ไขข้อมูลส่วนตัว (ชื่อ, นามสกุล, เบอร์โทร, Line ID)
- ✅ เปลี่ยนรหัสผ่าน

### 6. ระบบจัดการรูปภาพ
- ✅ ลบรูปภาพประกาศ
- ✅ ตั้งรูปหลัก (Primary Image)

### 7. Pagination
- ✅ Load More ในหน้าค้นหาหอพัก

## API Endpoints

### Authentication
- `POST /api/auth/register` - สมัครสมาชิก
- `POST /api/auth/login` - เข้าสู่ระบบ
- `GET /api/auth/me` - ข้อมูลผู้ใช้ปัจจุบัน
- `PUT /api/auth/profile` - แก้ไขข้อมูลส่วนตัว
- `PUT /api/auth/change-password` - เปลี่ยนรหัสผ่าน

### Listings
- `GET /api/listings` - รายการหอพักทั้งหมด (Public)
- `GET /api/listings/:id` - รายละเอียดหอพัก
- `GET /api/listings/landlord/my-listings` - ประกาศของ Landlord
- `POST /api/listings` - สร้างประกาศใหม่ (Landlord)
- `PUT /api/listings/:id` - แก้ไขประกาศ (Landlord)
- `DELETE /api/listings/:id` - ลบประกาศ (Landlord)
- `PATCH /api/listings/:id/toggle-availability` - เปลี่ยนสถานะว่าง/เต็ม
- `DELETE /api/listings/:listingId/images/:imageId` - ลบรูปภาพ
- `PATCH /api/listings/:listingId/images/:imageId/primary` - ตั้งรูปหลัก

### Favorites
- `GET /api/favorites` - รายการโปรด (Tenant)
- `POST /api/favorites/:listingId` - เพิ่มรายการโปรด
- `DELETE /api/favorites/:listingId` - ลบรายการโปรด
- `GET /api/favorites/check/:listingId` - ตรวจสอบว่าอยู่ในรายการโปรดหรือไม่

### Admin
- `GET /api/admin/listings/pending` - ประกาศที่รออนุมัติ
- `POST /api/admin/listings/:id/approve` - อนุมัติประกาศ
- `POST /api/admin/listings/:id/reject` - ไม่อนุมัติประกาศ
- `GET /api/admin/users` - รายชื่อผู้ใช้ทั้งหมด
- `POST /api/admin/users/:id/ban` - Ban/Unban ผู้ใช้
- `GET /api/admin/stats` - สถิติระบบ (Dashboard)

## Database Schema

- **users** - ข้อมูลผู้ใช้
- **listings** - ข้อมูลประกาศหอพัก
- **amenities** - สิ่งอำนวยความสะดวก
- **listing_amenities** - ความสัมพันธ์ระหว่าง listings และ amenities
- **listing_images** - รูปภาพหอพัก
- **favorites** - รายการโปรด

## CI/CD

### Flow

```
push to main
  ├── GitHub Actions  →  build check (client + server)
  ├── Railway         →  auto-deploy backend
  └── Vercel          →  auto-deploy frontend

open PR
  └── GitHub Actions  →  build check เท่านั้น (ไม่ deploy)
```

### 1. Railway — Backend + Database

1. ไปที่ [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo**
2. เลือก service → **Settings** → **Root Directory** = `server`
3. เพิ่ม **MySQL plugin** ใน project เดียวกัน
4. ตั้ง Environment Variables ใน backend service:

| Variable | Value |
|----------|-------|
| `DB_HOST` | `${{MySQL.MYSQLHOST}}` 
                            ↑
                            ชื่อนี้ต้องตรงกับชื่อ plugin ที่สร้างใน Railway
                            (ถ้า Railway ตั้งชื่อว่า "MySQL-db" ก็ต้องเปลี่ยนเป็น ${{MySQL-db.MYSQLHOST}}) |
| `DB_PORT` | `${{MySQL.MYSQLPORT}}` |
| `DB_USER` | `${{MySQL.MYSQLUSER}}` |
| `DB_PASSWORD` | `${{MySQL.MYSQLPASSWORD}}` |
| `DB_NAME` | `${{MySQL.MYSQLDATABASE}}` |
| `DB_SSL` | `false` |
| `JWT_SECRET` | ใส่ค่าจริง |
| `CLOUDINARY_CLOUD_NAME` | ใส่ค่าจริง |
| `CLOUDINARY_API_KEY` | ใส่ค่าจริง |
| `CLOUDINARY_API_SECRET` | ใส่ค่าจริง |
| `CLIENT_URL` | URL ของ Vercel เช่น `https://your-app.vercel.app` |

> **หมายเหตุ:** ชื่อใน `${{MySQL.xxx}}` ต้องตรงกับชื่อ plugin ใน Railway dashboard
> เช่น ถ้าชื่อ plugin คือ `MySQL-db` ให้เปลี่ยนเป็น `${{MySQL-db.MYSQLHOST}}`

5. Copy Railway URL ไปใช้ในขั้นตอนถัดไป

### 2. Vercel — Frontend

1. ไปที่ [vercel.com](https://vercel.com) → **New Project** → **Import GitHub repo**
2. **Settings** → **Root Directory** = `client`
3. ตั้ง Environment Variables:

| Variable | Value |
|----------|-------|
| `VITE_API_URL` | Railway URL เช่น `https://your-backend.up.railway.app` |
| `VITE_GOOGLE_MAPS_API_KEY` | ใส่ค่าจริง (ถ้าใช้) |

### 3. GitHub Actions Secrets

**Settings** → **Secrets and variables** → **Actions** → เพิ่ม:

| Secret | ใช้สำหรับ |
|--------|-----------|
| `VITE_API_URL` | CI build check |
| `VITE_GOOGLE_MAPS_API_KEY` | CI build check (optional) |

---

## หมายเหตุ

- สำหรับ Google Maps ในหน้า Listing Detail ต้องใส่ API Key ใน `ListingDetail.jsx`
- ไฟล์รูปภาพจะถูกเก็บไว้ใน `server/uploads/`
- ระบบใช้ JWT Token สำหรับ Authentication (หมดอายุ 7 วัน)
