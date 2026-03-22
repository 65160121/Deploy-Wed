import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from '../api/axios'
import './LandlordDashboard.css'

const LandlordDashboard = () => {
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    fetchListings()
  }, [])

  const fetchListings = async () => {
    try {
      const response = await axios.get('/api/listings/landlord/my-listings')
      setListings(response.data.listings)
    } catch (error) {
      console.error('Error fetching listings:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleAvailability = async (id, currentStatus) => {
    // Optimistic update
    setListings(prev => prev.map(listing =>
      listing.id === id ? { ...listing, is_available: !currentStatus } : listing
    ))
    try {
      await axios.patch(`/api/listings/${id}/toggle-availability`)
    } catch (error) {
      // Revert on failure
      setListings(prev => prev.map(listing =>
        listing.id === id ? { ...listing, is_available: currentStatus } : listing
      ))
      console.error('Error toggling availability:', error)
      alert('เกิดข้อผิดพลาดในการอัปเดตสถานะ')
    }
  }

  const deleteListing = async (id) => {
    if (!window.confirm('คุณต้องการลบประกาศนี้หรือไม่?')) {
      return
    }

    try {
      await axios.delete(`/api/listings/${id}`)
      setListings(listings.filter(listing => listing.id !== id))
    } catch (error) {
      console.error('Error deleting listing:', error)
      alert('เกิดข้อผิดพลาดในการลบประกาศ')
    }
  }

  const getStatusBadge = (status, isAvailable) => {
    if (!isAvailable) return <span className="status-badge sold-out">เต็ม</span>
    if (status === 'pending') return <span className="status-badge pending">รออนุมัติ</span>
    if (status === 'approved') return <span className="status-badge approved">อนุมัติแล้ว</span>
    if (status === 'rejected') return <span className="status-badge rejected">ไม่อนุมัติ</span>
    return <span className="status-badge">{status}</span>
  }

  return (
    <div className="landlord-dashboard">
      <div className="container">
        <div className="dashboard-header">
          <h1>แดชบอร์ดของฉัน</h1>
          <Link to="/landlord/create" className="btn btn-primary">
            + ลงประกาศใหม่
          </Link>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>กำลังโหลด...</div>
        ) : listings.length === 0 ? (
          <div className="empty-state">
            <p>คุณยังไม่มีประกาศ</p>
            <Link to="/landlord/create" className="btn btn-primary">ลงประกาศใหม่</Link>
          </div>
        ) : (
          <div className="listings-table">
            <table>
              <thead>
                <tr>
                  <th>รูปภาพ</th>
                  <th>ชื่อหอพัก</th>
                  <th>ราคา</th>
                  <th>สถานะ</th>
                  <th>ว่าง/เต็ม</th>
                  <th>การจัดการ</th>
                </tr>
              </thead>
              <tbody>
                {listings.map((listing) => (
                  <tr key={listing.id}>
                    <td>
                      {listing.primary_image ? (
                        <img
                          src={listing.primary_image.startsWith('http') ? listing.primary_image : `http://localhost:5000${listing.primary_image}`}
                          alt={listing.title}
                          className="listing-thumb"
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/80x60?text=No+Image'
                          }}
                        />
                      ) : (
                        <div className="no-image">ไม่มีรูป</div>
                      )}
                    </td>
                    <td>
                      <Link to={`/listing/${listing.id}`} className="listing-title-link">
                        {listing.title}
                      </Link>
                    </td>
                    <td>{parseFloat(listing.price).toLocaleString()} บาท/เดือน</td>
                    <td>
                      {getStatusBadge(listing.status, listing.is_available)}
                      {listing.status === 'rejected' && listing.rejection_reason && (
                        <div style={{ fontSize: '12px', color: '#dc2626', marginTop: '4px' }}>
                          เหตุผล: {listing.rejection_reason}
                        </div>
                      )}
                    </td>
                    <td>
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={listing.is_available}
                          onChange={() => toggleAvailability(listing.id, listing.is_available)}
                        />
                        <span className="toggle-slider"></span>
                      </label>
                    </td>
                    <td>
                      <div className="action-buttons">
                        {listing.status !== 'rejected' && (
                          <button
                            onClick={() => navigate(`/landlord/edit/${listing.id}`)}
                            className="btn btn-secondary btn-sm"
                          >
                            แก้ไข
                          </button>
                        )}
                        <button
                          onClick={() => deleteListing(listing.id)}
                          className="btn btn-danger btn-sm"
                        >
                          ลบ
                        </button>
                      </div>
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

export default LandlordDashboard
