Setup Steps
1. Railway (Backend + Database)
ไปที่ railway.app → New Project → Deploy from GitHub repo
เลือก service → Settings → Root Directory = server
เพิ่ม MySQL plugin ใน Railway project เดียวกัน
ใน Variables ของ backend service ใส่ reference vars:

DB_HOST     = ${{MySQL.MYSQLHOST}}
                    ↑
                    ชื่อนี้ต้องตรงกับชื่อ plugin ที่สร้างใน Railway
                    (ถ้า Railway ตั้งชื่อว่า "MySQL-db" ก็ต้องเปลี่ยนเป็น ${{MySQL-db.MYSQLHOST}})
DB_PORT     = ${{MySQL.MYSQLPORT}}
DB_USER     = ${{MySQL.MYSQLUSER}}
DB_PASSWORD = ${{MySQL.MYSQLPASSWORD}}
DB_NAME     = ${{MySQL.MYSQLDATABASE}}
DB_SSL      = false
JWT_SECRET  = (ใส่ค่าจริง)
CLOUDINARY_CLOUD_NAME = (ใส่ค่าจริง)
CLOUDINARY_API_KEY    = (ใส่ค่าจริง)
CLOUDINARY_API_SECRET = (ใส่ค่าจริง)
CLIENT_URL  = https://your-app.vercel.app
Copy Railway URL มาใช้ใน Vercel ขั้นต่อไป
2. Vercel (Frontend)
ไปที่ vercel.com → New Project → Import GitHub repo
Settings → Root Directory = client
ใส่ Environment Variables:

VITE_API_URL            = https://your-backend.up.railway.app
VITE_GOOGLE_MAPS_API_KEY = (ใส่ค่าจริง ถ้าใช้)
3. GitHub Actions Secrets
Settings → Secrets → Actions → เพิ่ม:

VITE_API_URL — Railway URL (สำหรับ CI build check)
VITE_GOOGLE_MAPS_API_KEY — optional
Flow:


push to main
  ├─ GitHub Actions CI → build check ทั้ง client + server
  ├─ Railway → auto-deploy backend (watch main branch)
  └─ Vercel → auto-deploy frontend (watch main branch)
PR จะ trigger แค่ CI โดยไม่ deploy ครับ