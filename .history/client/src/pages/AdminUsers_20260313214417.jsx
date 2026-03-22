import { useState, useEffect, useContext } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { AuthContext } from '../context/AuthContext'
import './AdminUsers.css'

const AdminUsers = () => {
  const { user: currentUser } = useContext(AuthContext)
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await axios.get('/api/admin/users')
      setUsers(response.data.users)
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleBan = async (id, isBanned) => {
    try {
      await axios.post(`/api/admin/users/${id}/ban`, { isBanned: !isBanned })
      setUsers(users.map(user => 
        user.id === id 
          ? { ...user, is_banned: !isBanned }
          : user
      ))
    } catch (error) {
      console.error('Error toggling ban:', error)
      alert('เกิดข้อผิดพลาดในการอัปเดตสถานะ')
    }
  }

  const getRoleLabel = (role) => {
    const labels = {
      'tenant': 'ผู้เช่า',
      'landlord': 'เจ้าของหอพัก',
      'admin': 'ผู้ดูแลระบบ'
    }
    return labels[role] || role
  }

  return (
    <div className="admin-users">
      <div className="container">
        <div className="admin-header">
          <h1>จัดการผู้ใช้</h1>
          <Link to="/admin/dashboard" className="btn btn-secondary">กลับสู่แดชบอร์ด</Link>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>กำลังโหลด...</div>
        ) : (
          <div className="users-table-container">
            <table className="users-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>อีเมล</th>
                  <th>ชื่อ-นามสกุล</th>
                  <th>ประเภท</th>
                  <th>จำนวนประกาศ</th>
                  <th>สถานะ</th>
                  <th>วันที่สมัคร</th>
                  <th>การจัดการ</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className={user.is_banned ? 'banned' : ''}>
                    <td>{user.id}</td>
                    <td>{user.email}</td>
                    <td>{user.first_name} {user.last_name}</td>
                    <td>{getRoleLabel(user.role)}</td>
                    <td>{user.listing_count || 0}</td>  
                    <td>
                      {user.is_banned ? (
                        <span className="status-badge banned-badge">ถูกระงับ</span>
                      ) : (
                        <span className="status-badge active-badge">ปกติ</span>
                      )}
                    </td>
                    <td>{new Date(user.created_at).toLocaleDateString('th-TH')}</td>
                    <td>
                      {currentUser && currentUser.id === user.id ? (
                        <span className="text-muted">-</span>
                      ) : (
                        <button
                          onClick={() => toggleBan(user.id, user.is_banned)}
                          className={`btn btn-sm ${user.is_banned ? 'btn-success' : 'btn-danger'}`}
                        >
                          {user.is_banned ? 'ยกเลิกการระงับ' : 'ระงับบัญชี'}
                        </button>
                      )}
                    </td>
                    <td>
  {user.created_at && !isNaN(new Date(user.created_at))
    ? new Date(user.created_at).toLocaleDateString('th-TH')
    : '-'}
</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminUsers
