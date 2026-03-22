import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import axios from '../api/axios'
import './Favorites.css'

const Favorites = () => {
  const [favorites, setFavorites] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchFavorites()
  }, [])

  const fetchFavorites = async () => {
    try {
      const response = await axios.get('/api/favorites')
      setFavorites(response.data.favorites)
    } catch (error) {
      console.error('Error fetching favorites:', error)
    } finally {
      setLoading(false)
    }
  }

  const removeFavorite = async (listingId) => {
    try {
      await axios.delete(`/api/favorites/${listingId}`)
      setFavorites(favorites.filter(fav => fav.id !== listingId))
    } catch (error) {
      console.error('Error removing favorite:', error)
    }
  }

  return (
    <div className="favorites-container">
      <div className="container">
        <h1>รายการโปรดของฉัน</h1>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>กำลังโหลด...</div>
        ) : favorites.length === 0 ? (
          <div className="empty-state">
            <p>คุณยังไม่มีรายการโปรด</p>
            <Link to="/" className="btn btn-primary">ค้นหาหอพัก</Link>
          </div>
        ) : (
          <div className="favorites-grid">
            {favorites.map((listing) => (
              <div key={listing.id} className="favorite-card">
                <Link to={`/listing/${listing.id}`} className="favorite-link">
                  {listing.primary_image && (
                    <div className="favorite-image">
                      <img
                        src={listing.primary_image.startsWith('http') ? listing.primary_image : `http://localhost:5000${listing.primary_image}`}
                        alt={listing.title}
                        onError={(e) => {
                          e.target.src = 'https://via.placeholder.com/300x200?text=No+Image'
                        }}
                      />
                    </div>
                  )}
                  <div className="favorite-info">
                    <h3>{listing.title}</h3>
                    <p className="favorite-address">{listing.address}</p>
                    <p className="favorite-price">
                      {parseFloat(listing.price).toLocaleString()} บาท/เดือน
                    </p>
                  </div>
                </Link>
                <button
                  onClick={() => removeFavorite(listing.id)}
                  className="remove-favorite-btn"
                  title="ลบออกจากรายการโปรด"
                >
                  ❌
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Favorites
