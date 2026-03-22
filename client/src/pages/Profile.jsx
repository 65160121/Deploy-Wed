import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from '../api/axios'
import { useAuth } from '../context/AuthContext'
import './Profile.css'

const Profile = () => {
  const { user, logout, updateUser } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [activeTab, setActiveTab] = useState('profile')
  
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    lineId: ''
  })

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  useEffect(() => {
    if (user) {
      setProfileData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
        lineId: user.lineId || ''
      })
    }
  }, [user])

  const handleProfileChange = (e) => {
    setProfileData({
      ...profileData,
      [e.target.name]: e.target.value
    })
  }

  const handlePasswordChange = (e) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value
    })
  }

  const handleProfileSubmit = async (e) => {
    e.preventDefault()
    setMessage({ type: '', text: '' })
    setLoading(true)

    try {
      const response = await axios.put('/api/auth/profile', {
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        phone: profileData.phone,
        lineId: profileData.lineId
      })

      // Update AuthContext state (also updates localStorage internally)
      updateUser(response.data.user)

      setMessage({ type: 'success', text: 'อัปเดตข้อมูลสำเร็จ' })
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'เกิดข้อผิดพลาดในการอัปเดตข้อมูล' 
      })
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    setMessage({ type: '', text: '' })

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: 'error', text: 'รหัสผ่านใหม่ไม่ตรงกัน' })
      return
    }

    setLoading(true)

    try {
      await axios.put('/api/auth/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      })

      setMessage({ type: 'success', text: 'เปลี่ยนรหัสผ่านสำเร็จ' })
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน' 
      })
    } finally {
      setLoading(false)
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

  if (!user) {
    navigate('/login')
    return null
  }

  return (
    <div className="profile-container">
      <div className="container">
        <h1>โปรไฟล์ของฉัน</h1>
        
        <div className="profile-content">
          <div className="profile-sidebar">
            <div className="user-info-card">
              <div className="user-avatar">
                {user.firstName?.charAt(0).toUpperCase()}
              </div>
              <h3>{user.firstName} {user.lastName}</h3>
              <p className="user-email">{user.email}</p>
              <span className="user-role-badge">{getRoleLabel(user.role)}</span>
            </div>
            
            <nav className="profile-nav">
              <button 
                className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`}
                onClick={() => setActiveTab('profile')}
              >
                ข้อมูลส่วนตัว
              </button>
              <button 
                className={`nav-item ${activeTab === 'password' ? 'active' : ''}`}
                onClick={() => setActiveTab('password')}
              >
                เปลี่ยนรหัสผ่าน
              </button>
            </nav>
          </div>

          <div className="profile-main">
            {message.text && (
              <div className={`message ${message.type}`}>
                {message.text}
              </div>
            )}

            {activeTab === 'profile' && (
              <div className="profile-section">
                <h2>ข้อมูลส่วนตัว</h2>
                <form onSubmit={handleProfileSubmit}>
                  <div className="form-row">
                    <div className="form-group">
                      <label>ชื่อ *</label>
                      <input
                        type="text"
                        name="firstName"
                        value={profileData.firstName}
                        onChange={handleProfileChange}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>นามสกุล *</label>
                      <input
                        type="text"
                        name="lastName"
                        value={profileData.lastName}
                        onChange={handleProfileChange}
                        required
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>อีเมล</label>
                    <input
                      type="email"
                      name="email"
                      value={profileData.email}
                      disabled
                      className="disabled-input"
                    />
                    <small>ไม่สามารถเปลี่ยนอีเมลได้</small>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>เบอร์โทรศัพท์</label>
                      <input
                        type="tel"
                        name="phone"
                        value={profileData.phone}
                        onChange={handleProfileChange}
                        placeholder="0xx-xxx-xxxx"
                        maxLength={10}
                      />
                    </div>
                    <div className="form-group">
                      <label>Line ID</label>
                      <input
                        type="text"
                        name="lineId"
                        value={profileData.lineId}
                        onChange={handleProfileChange}
                        placeholder="your_line_id"
                        disabled={!!user.lineId}
                        className={user.lineId ? 'disabled-input' : ''}
                      />
                      {user.lineId && <small>ไม่สามารถเปลี่ยน Line ID ได้หลังจากตั้งค่าแล้ว</small>}
                    </div>
                  </div>
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
                  </button>
                </form>
              </div>
            )}

            {activeTab === 'password' && (
              <div className="profile-section">
                <h2>เปลี่ยนรหัสผ่าน</h2>
                <form onSubmit={handlePasswordSubmit}>
                  <div className="form-group">
                    <label>รหัสผ่านปัจจุบัน *</label>
                    <input
                      type="password"
                      name="currentPassword"
                      value={passwordData.currentPassword}
                      onChange={handlePasswordChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>รหัสผ่านใหม่ * (ขั้นต่ำ 8 ตัวอักษร)</label>
                    <input
                      type="password"
                      name="newPassword"
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange}
                      required
                      minLength={8}
                    />
                  </div>
                  <div className="form-group">
                    <label>ยืนยันรหัสผ่านใหม่ *</label>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordChange}
                      required
                      minLength={8}
                    />
                  </div>
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? 'กำลังเปลี่ยน...' : 'เปลี่ยนรหัสผ่าน'}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Profile
