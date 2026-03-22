import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import './AdminDashboard.css'

const AdminDashboard = () => {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await axios.get('/api/admin/stats')
      setStats(response.data.stats)
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="admin-dashboard">
      <div className="container">
        <h1>แดชบอร์ดผู้ดูแลระบบ</h1>
        
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>กำลังโหลด...</div>
        ) : stats && (
          <>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">👥</div>
                <div className="stat-info">
                  <h3>{stats.totalUsers}</h3>
                  <p>ผู้ใช้ทั้งหมด</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">🏠</div>
                <div className="stat-info">
                  <h3>{stats.totalListings}</h3>
                  <p>ประกาศทั้งหมด</p>
                </div>
              </div>
              <div className="stat-card highlight">
                <div className="stat-icon">⏳</div>
                <div className="stat-info">
                  <h3>{stats.pendingListings}</h3>
                  <p>รออนุมัติ</p>
                </div>
              </div>
              <div className="stat-card warning">
                <div className="stat-icon">🚫</div>
                <div className="stat-info">
                  <h3>{stats.bannedUsers}</h3>
                  <p>ถูกระงับ</p>
                </div>
              </div>
            </div>

            <div className="stats-detail">
              <div className="detail-card">
                <h3>ผู้ใช้แยกตามประเภท</h3>
                <div className="detail-list">
                  <div className="detail-item">
                    <span>ผู้เช่า (Tenant)</span>
                    <span className="detail-value">{stats.usersByRole.tenant || 0}</span>
                  </div>
                  <div className="detail-item">
                    <span>เจ้าของหอพัก (Landlord)</span>
                    <span className="detail-value">{stats.usersByRole.landlord || 0}</span>
                  </div>
                  <div className="detail-item">
                    <span>ผู้ดูแลระบบ (Admin)</span>
                    <span className="detail-value">{stats.usersByRole.admin || 0}</span>
                  </div>
                </div>
              </div>
              <div className="detail-card">
                <h3>ประกาศแยกตามสถานะ</h3>
                <div className="detail-list">
                  <div className="detail-item">
                    <span>อนุมัติแล้ว</span>
                    <span className="detail-value approved">{stats.listingsByStatus.approved || 0}</span>
                  </div>
                  <div className="detail-item">
                    <span>รออนุมัติ</span>
                    <span className="detail-value pending">{stats.listingsByStatus.pending || 0}</span>
                  </div>
                  <div className="detail-item">
                    <span>ไม่อนุมัติ</span>
                    <span className="detail-value rejected">{stats.listingsByStatus.rejected || 0}</span>
                  </div>
                </div>
              </div>
              <div className="detail-card">
                <h3>กิจกรรมล่าสุด (7 วัน)</h3>
                <div className="detail-list">
                  <div className="detail-item">
                    <span>ผู้ใช้ใหม่</span>
                    <span className="detail-value">{stats.recentUsers}</span>
                  </div>
                  <div className="detail-item">
                    <span>ประกาศใหม่</span>
                    <span className="detail-value">{stats.recentListings}</span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        <div className="admin-cards">
          <Link to="/admin/listings" className="admin-card">
            <div className="admin-card-icon">📋</div>
            <h3>อนุมัติประกาศ</h3>
            <p>ตรวจสอบและอนุมัติประกาศหอพักที่รอการอนุมัติ</p>
            {stats && stats.pendingListings > 0 && (
              <span className="badge">{stats.pendingListings}</span>
            )}
          </Link>
          <Link to="/admin/users" className="admin-card">
            <div className="admin-card-icon">👥</div>
            <h3>จัดการผู้ใช้</h3>
            <p>ดูรายชื่อผู้ใช้และจัดการบัญชี</p>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard
