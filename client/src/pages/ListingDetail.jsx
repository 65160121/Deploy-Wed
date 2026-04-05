import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from '../api/axios'
import { useAuth } from '../context/AuthContext'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
import './ListingDetail.css'

// Fix default marker icon broken by Vite bundler
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
})

const ListingDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [listing, setListing] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isFavorited, setIsFavorited] = useState(false)
  const [showContact, setShowContact] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [togglingFavorite, setTogglingFavorite] = useState(false)

  const nextImage = () => {
    if (listing && listing.images && listing.images.length > 0) {
      setCurrentImageIndex((prev) => 
        prev === listing.images.length - 1 ? 0 : prev + 1
      )
    }
  }

  const prevImage = () => {
    if (listing && listing.images && listing.images.length > 0) {
      setCurrentImageIndex((prev) => 
        prev === 0 ? listing.images.length - 1 : prev - 1
      )
    }
  }

  useEffect(() => {
    fetchListing()
    if (user && user.role === 'tenant') {
      checkFavorite()
    }
  }, [id, user])

  const fetchListing = async () => {
    try {
      const response = await axios.get(`/api/listings/${id}`)
      setListing(response.data.listing)
    } catch (error) {
      console.error('Error fetching listing:', error)
    } finally {
      setLoading(false)
    }
  }

  const checkFavorite = async () => {
    try {
      const response = await axios.get(`/api/favorites/check/${id}`)
      setIsFavorited(response.data.isFavorited)
    } catch (error) {
      console.error('Error checking favorite:', error)
    }
  }

  const toggleFavorite = async () => {
    if (!user || user.role !== 'tenant') {
      navigate('/login')
      return
    }

    if (togglingFavorite) return
    setTogglingFavorite(true)

    try {
      if (isFavorited) {
        await axios.delete(`/api/favorites/${id}`)
        setIsFavorited(false)
      } else {
        await axios.post(`/api/favorites/${id}`)
        setIsFavorited(true)
      }
    } catch (error) {
      console.error('Error toggling favorite:', error)
    } finally {
      setTogglingFavorite(false)
    }
  }

  const handleContact = () => {
    setShowContact(true)
  }

  if (loading) {
    return <div className="container" style={{ padding: '40px', textAlign: 'center' }}>กำลังโหลด...</div>
  }

  if (!listing) {
    return <div className="container" style={{ padding: '40px', textAlign: 'center' }}>ไม่พบรายการ</div>
  }

  const images = listing.images && listing.images.length > 0 
    ? listing.images.map(img => img.image_url)
    : ['https://via.placeholder.com/800x400?text=No+Image']

  return (
    <div className="listing-detail-container">
      <div className="container">
        <button onClick={() => window.history.back()} className="back-link"> ย้อนกลับ</button>

        <div className="listing-detail">
          <div className="listing-images">
            <div className="main-image">
              {images.length > 1 && (
                <button className="image-nav-btn prev-btn" onClick={prevImage}>
                  ‹
                </button>
              )}
              <img
                src={images[currentImageIndex].startsWith('http') ? images[currentImageIndex] : `${import.meta.env.VITE_API_URL || ''}${images[currentImageIndex]}`}
                alt={listing.title}
                onError={(e) => {
                  e.target.src = 'https://via.placeholder.com/800x400?text=No+Image'
                }}
              />
              {images.length > 1 && (
                <button className="image-nav-btn next-btn" onClick={nextImage}>
                  ›
                </button>
              )}
              {images.length > 1 && (
                <div className="image-counter">
                  {currentImageIndex + 1} / {images.length}
                </div>
              )}
            </div>
            {images.length > 1 && (
              <div className="image-thumbnails">
                {images.map((img, index) => (
                  <img
                    key={index}
                    src={img.startsWith('http') ? img : `${import.meta.env.VITE_API_URL || ''}${img}`}
                    alt={`${listing.title} ${index + 1}`}
                    className={index === currentImageIndex ? 'active' : ''}
                    onClick={() => setCurrentImageIndex(index)}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="listing-detail-info">
            <div className="listing-header">
              <h1>{listing.title}</h1>
              {user && user.role === 'tenant' && (
                <button
                  onClick={toggleFavorite}
                  disabled={togglingFavorite}
                  className={`favorite-btn ${isFavorited ? 'favorited' : ''}`}
                >
                  {isFavorited ? '❤️' : '🤍'}
                </button>
              )}
            </div>

            <div className="price-section">
              <div className="main-price">
                {parseFloat(listing.price).toLocaleString()} บาท/เดือน
              </div>
              {listing.deposit && (
                <div className="deposit">ค่ามัดจำ: {parseFloat(listing.deposit).toLocaleString()} บาท</div>
              )}
            </div>

            <div className="detail-section">
              <h3>รายละเอียด</h3>
              <p>{listing.description || 'ไม่มีรายละเอียด'}</p>
            </div>

            <div className="detail-section">
              <h3>ข้อมูลห้องพัก</h3>
              <div className="info-grid">
                <div>
                  <strong>ที่อยู่:</strong>
                  <p>{listing.address}</p>
                </div>
                <div>
                  <strong>ประเภทห้อง:</strong>
                  <p>{{ studio: 'Studio', one_bedroom: '1 Bedroom', two_bedroom: '2 Bedroom', air_conditioned: 'Studio', fan: 'Studio' }[listing.room_type] || listing.room_type}</p>
                </div>
                {listing.water_price && (
                  <div>
                    <strong>ค่าน้ำ:</strong>
                    <p>{parseFloat(listing.water_price).toLocaleString()} บาท/หน่วย</p>
                  </div>
                )}
                {listing.electricity_price && (
                  <div>
                    <strong>ค่าไฟ:</strong>
                    <p>{listing.electricity_price}</p>
                  </div>
                )}
              </div>
            </div>

            {listing.amenities && listing.amenities.length > 0 && (
              <div className="detail-section">
                <h3>สิ่งอำนวยความสะดวก</h3>
                <div className="amenities-list">
                  {listing.amenities.map((amenity) => (
                    <span key={amenity.id} className="amenity-tag">
                      {amenity.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {listing.latitude && listing.longitude && (
              <div className="detail-section">
                <h3>แผนที่</h3>
                <MapContainer
                  center={[listing.latitude, listing.longitude]}
                  zoom={15}
                  style={{ height: '300px', width: '100%', borderRadius: '8px' }}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  />
                  <Marker position={[listing.latitude, listing.longitude]}>
                    <Popup>{listing.title}</Popup>
                  </Marker>
                </MapContainer>
              </div>
            )}

            {user && user.role === 'tenant' && (
              <div className="contact-section">
                <button onClick={handleContact} className="btn btn-primary btn-large">
                  สนใจเช่า / ติดต่อสอบถาม
                </button>
                {showContact && (
                  <div className="contact-info">
                    {(listing.first_name || listing.last_name) && (
                      <div>
                        <strong>ผู้ประกาศ:</strong> {listing.first_name || ''} {listing.last_name || ''}
                      </div>
                    )}
                    {listing.phone && (
                      <div>
                        <strong>เบอร์โทร:</strong>
                        <a href={`tel:${listing.phone}`}>{listing.phone}</a>
                      </div>
                    )}
                    {listing.line_id && (
                      <div>
                        <strong>Line ID:</strong> 
                        <a href={`https://line.me/R/ti/p/~${listing.line_id}`} target="_blank" rel="noopener noreferrer">
                          {listing.line_id}
                        </a>
                      </div>
                    )}
                    {!listing.phone && !listing.line_id && (
                      <p>ไม่มีข้อมูลการติดต่อ</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ListingDetail
