import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import axios from '../api/axios'
import './AdminListings.css'

const AdminListings = () => {
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [rejectingId, setRejectingId] = useState(null)
  const [rejectReason, setRejectReason] = useState('')

  useEffect(() => {
    fetchPendingListings()
  }, [])

  const fetchPendingListings = async () => {
    try {
      const response = await axios.get('/api/admin/listings/pending')
      setListings(response.data.listings)
    } catch (error) {
      console.error('Error fetching pending listings:', error)
    } finally {
      setLoading(false)
    }
  }

  const approveListing = async (id) => {
    try {
      await axios.post(`/api/admin/listings/${id}/approve`)
      setListings(listings.filter(listing => listing.id !== id))
    } catch (error) {
      console.error('Error approving listing:', error)
      alert('เกิดข้อผิดพลาดในการอนุมัติ')
    }
  }

  const confirmReject = async () => {
    if (!rejectingId) return
    if (!rejectReason.trim()) {
      alert('กรุณาระบุเหตุผลที่ไม่อนุมัติ')
      return
    }
    try {
      await axios.post(`/api/admin/listings/${rejectingId}/reject`, { reason: rejectReason.trim() })
      setListings(listings.filter(listing => listing.id !== rejectingId))
      setRejectingId(null)
      setRejectReason('')
    } catch (error) {
      console.error('Error rejecting listing:', error)
      alert('เกิดข้อผิดพลาดในการไม่อนุมัติ')
    }
  }

  return (
    <div className="admin-listings">
      <div className="container">
        <div className="admin-header">
          <h1>อนุมัติประกาศ</h1>
          <Link to="/admin/dashboard" className="btn btn-secondary">กลับสู่แดชบอร์ด</Link>
        </div>

        {rejectingId && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', width: '400px', maxWidth: '90vw' }}>
              <h3 style={{ marginBottom: '12px' }}>ระบุเหตุผลที่ไม่อนุมัติ</h3>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value.slice(0, 500))}
                rows={4}
                placeholder="กรุณาระบุเหตุผล..."
                style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #d1d5db', resize: 'vertical', boxSizing: 'border-box' }}
              />
              <div style={{ fontSize: '12px', color: '#6b7280', textAlign: 'right', marginBottom: '12px' }}>{rejectReason.length}/500</div>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button onClick={() => { setRejectingId(null); setRejectReason('') }} className="btn btn-secondary">ยกเลิก</button>
                <button onClick={confirmReject} className="btn btn-danger">ยืนยันไม่อนุมัติ</button>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>กำลังโหลด...</div>
        ) : listings.length === 0 ? (
          <div className="empty-state">
            <p>ไม่มีประกาศที่รอการอนุมัติ</p>
          </div>
        ) : (
          <div className="listings-list">
            {listings.map((listing) => (
              <div key={listing.id} className="listing-review-card">
                <div className="listing-review-header">
                  {listing.primary_image && (
                    <img
                      src={listing.primary_image.startsWith('http') ? listing.primary_image : `${import.meta.env.VITE_API_URL || ''}${listing.primary_image}`}
                      alt={listing.title}
                      className="review-image"
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/150x100?text=No+Image'
                      }}
                    />
                  )}
                  <div className="review-info">
                    <h3>{listing.title}</h3>
                    <p><strong>เจ้าของ:</strong> {listing.first_name} {listing.last_name} ({listing.landlord_email})</p>
                    <p><strong>ที่อยู่:</strong> {listing.address}</p>
                    <p><strong>ราคา:</strong> {parseFloat(listing.price).toLocaleString()} บาท/เดือน</p>
                    <p><strong>ประเภท:</strong> {{ studio: 'Studio', one_bedroom: '1 Bedroom', two_bedroom: '2 Bedroom' }[listing.room_type] || listing.room_type}</p>
                  </div>
                </div>
                {listing.description && (
                  <div className="review-description">
                    <strong>รายละเอียด:</strong>
                    <p>{listing.description}</p>
                  </div>
                )}
                <div className="review-actions">
                  <Link to={`/listing/${listing.id}`} className="btn btn-secondary">
                    ดูรายละเอียด
                  </Link>
                  <button
                    onClick={() => { setRejectingId(listing.id); setRejectReason('') }}
                    className="btn btn-danger"
                  >
                    ไม่อนุมัติ
                  </button>
                  <button
                    onClick={() => approveListing(listing.id)}
                    className="btn btn-success"
                  >
                    อนุมัติ
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminListings
