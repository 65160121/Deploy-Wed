import { useState, useEffect, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import axios from '../api/axios'
import './Home.css'

// Amenity categories mapping by name
const AMENITY_CATEGORIES = {
  popular: ['เครื่องปรับอากาศ', 'ลิฟต์', 'เลี้ยงสัตว์ได้', 'ที่จอดรถ', 'อินเทอร์เน็ต WiFi'],
  room: ['น้ำอุ่น', 'เฟอร์นิเจอร์ครบ', 'ตู้เย็น', 'โทรทัศน์', 'ไมโครเวฟ', 'เครื่องซักผ้า'],
  building: ['คีย์การ์ด', 'รปภ. 24 ชม.', 'กล้องวงจรปิด', 'ใกล้ BTS/MRT'],
}

const PriceRangeSlider = ({ min, max, value, onChange, buckets }) => {
  const rangeRef = useRef(null)
  const [minVal, maxRaw] = value
  // '' means no upper limit — slider handle stays at max position
  const maxVal = maxRaw === '' ? max : Number(maxRaw)

  const getPercent = (val) => Math.round(((val - min) / (max - min)) * 100)

  const handleMin = (e) => {
    const val = Math.min(Number(e.target.value), maxVal - 100)
    onChange([val, maxRaw])
  }
  const handleMax = (e) => {
    const val = Math.max(Number(e.target.value), minVal + 100)
    // If user drags back to full max, clear it (no upper limit)
    onChange([minVal, val >= max ? '' : val])
  }

  const maxCount = buckets.length > 0 ? Math.max(...buckets.map(b => b.count)) : 1
  const leftPct = getPercent(minVal)
  const rightPct = getPercent(maxVal)

  return (
    <div className="price-slider-wrap">
      {buckets.length > 0 && (
        <div className="price-histogram">
          {Array.from({ length: 10 }, (_, i) => {
            const bucket = buckets.find(b => b.bucket_index === i)
            const height = bucket ? (bucket.count / maxCount) * 100 : 0
            const inRange = i >= Math.floor(leftPct / 10) && i <= Math.floor(rightPct / 10)
            return (
              <div
                key={i}
                className={`histogram-bar ${inRange ? 'active' : ''}`}
                style={{ height: `${Math.max(height, 2)}%` }}
              />
            )
          })}
        </div>
      )}
      <div className="price-slider-track-wrap">
        <div className="price-slider-track" />
        <div
          className="price-slider-range"
          style={{ left: `${leftPct}%`, right: `${100 - rightPct}%` }}
        />
        <input type="range" min={min} max={max} step={100} value={minVal}
          onChange={handleMin} className="price-slider-input price-slider-min" ref={rangeRef} />
        <input type="range" min={min} max={max} step={100} value={maxVal}
          onChange={handleMax} className="price-slider-input price-slider-max" />
      </div>
      <div className="price-inputs">
        <div className="price-input-box">
          <span className="price-input-label">ราคาเริ่มต้น</span>
          <input type="number" value={minVal} min={0} step={100} placeholder="0"
            onChange={(e) => onChange([Math.max(0, Number(e.target.value) || 0), maxRaw])} />
        </div>
        <span className="price-dash">–</span>
        <div className="price-input-box">
          <span className="price-input-label">ราคาสูงสุด</span>
          <input type="number" value={maxRaw} min={minVal + 100} step={100} placeholder="ไม่จำกัด"
            onChange={(e) => onChange([minVal, e.target.value === '' ? '' : Number(e.target.value)])} />
        </div>
      </div>
    </div>
  )
}

const Home = () => {
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [amenities, setAmenities] = useState([])
  const [priceStats, setPriceStats] = useState({ min: 0, max: 50000, buckets: [] })
  const [priceRange, setPriceRange] = useState([0, ''])
  const [filters, setFilters] = useState({
    minPrice: '',
    maxPrice: '',
    roomType: '',
    selectedAmenities: []
  })
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    hasMore: true
  })

  useEffect(() => {
    fetchListings(1)
    fetchAmenities()
    fetchPriceStats()
  }, [])

  const fetchAmenities = async () => {
    try {
      const response = await axios.get('/api/listings/amenities/all')
      setAmenities(response.data.amenities)
    } catch (error) {
      console.error('Error fetching amenities:', error)
    }
  }

  const fetchPriceStats = async () => {
    try {
      const response = await axios.get('/api/listings/price-stats')
      const { buckets } = response.data
      setPriceStats(prev => ({ ...prev, buckets }))
    } catch (error) {
      console.error('Error fetching price stats:', error)
    }
  }

  const fetchListings = async (page = 1, append = false, searchOverride, filtersOverride, priceOverride) => {
    try {
      setLoading(true)
      const effectiveSearch = searchOverride !== undefined ? searchOverride : searchTerm
      const effectiveFilters = filtersOverride !== undefined ? filtersOverride : filters
      const effectivePrice = priceOverride !== undefined ? priceOverride : priceRange
      const params = new URLSearchParams()
      if (effectiveSearch) params.append('search', effectiveSearch)
      if (effectivePrice[0] > priceStats.min) params.append('minPrice', effectivePrice[0])
      if (effectivePrice[1] !== '' && effectivePrice[1] !== null) params.append('maxPrice', effectivePrice[1])
      if (effectiveFilters.roomType) params.append('roomType', effectiveFilters.roomType)
      if (effectiveFilters.selectedAmenities.length > 0) params.append('amenities', effectiveFilters.selectedAmenities.join(','))
      // Fetch one extra to determine if there are more pages
      params.append('limit', pagination.limit + 1)
      params.append('offset', (page - 1) * pagination.limit)

      const response = await axios.get(`/api/listings?${params.toString()}`)
      const rawListings = response.data.listings
      const hasMore = rawListings.length > pagination.limit
      const newListings = hasMore ? rawListings.slice(0, pagination.limit) : rawListings

      if (append) {
        setListings(prev => [...prev, ...newListings])
      } else {
        setListings(newListings)
      }

      setPagination(prev => ({
        ...prev,
        page,
        hasMore
      }))
    } catch (error) {
      console.error('Error fetching listings:', error)
    } finally {
      setLoading(false)
    }
  }

  // Debounce price range — fetch 600ms after user stops dragging
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchListings(1, false, undefined, undefined, priceRange)
    }, 600)
    return () => clearTimeout(timer)
  }, [priceRange])

  const handleSearch = (e) => {
    e.preventDefault()
    fetchListings(1)
  }

  const handleRoomTypeSelect = (val) => {
    const newFilters = { ...filters, roomType: val }
    setFilters(newFilters)
    fetchListings(1, false, undefined, newFilters)
  }

  const handleAmenityToggle = (amenityId) => {
    const newSelected = filters.selectedAmenities.includes(amenityId)
      ? filters.selectedAmenities.filter(id => id !== amenityId)
      : [...filters.selectedAmenities, amenityId]
    const newFilters = { ...filters, selectedAmenities: newSelected }
    setFilters(newFilters)
    fetchListings(1, false, undefined, newFilters)
  }

  const loadMore = () => {
    fetchListings(pagination.page + 1, true)
  }

  return (
    <div className="home-container">
      <div className="hero-section">
        <div className="container">
          <h1>ค้นหาหอพักที่ใช่สำหรับคุณ</h1>
          <form onSubmit={handleSearch} className="search-form">
            <input
              type="text"
              placeholder="ค้นหาด้วยชื่อหอพัก หรือ ย่าน/ถนน..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <button type="submit" className="btn btn-primary">ค้นหา</button>
          </form>
        </div>
      </div>

      <div className="container" style={{ marginTop: '40px' }}>
        <div className="home-content">
          <aside className="filters-sidebar">
            <div className="filter-header">
              <h3>ค้นหาแบบละเอียด</h3>
              <button
                type="button"
                className="filter-clear-all"
                onClick={() => {
                  const emptyFilters = { minPrice: '', maxPrice: '', roomType: '', selectedAmenities: [] }
                  const resetPrice = [priceStats.min, '']
                  setFilters(emptyFilters)
                  setSearchTerm('')
                  setPriceRange(resetPrice)
                  fetchListings(1, false, '', emptyFilters, resetPrice)
                }}
              >
                ล้างทั้งหมด
              </button>
            </div>

            {/* Price Range */}
            <div className="filter-section">
              <h4 className="filter-section-title">ค่าเช่า (บาท/เดือน)</h4>
              <PriceRangeSlider
                min={priceStats.min || 0}
                max={priceStats.max || 50000}
                value={priceRange}
                onChange={setPriceRange}
                buckets={priceStats.buckets}
              />
            </div>

            {/* Room Type */}
            <div className="filter-section">
              <h4 className="filter-section-title">ประเภทห้อง</h4>
              <div className="room-type-btns">
                {[['', 'ทั้งหมด'], ['studio', 'Studio'], ['one_bedroom', '1 Bedroom'], ['two_bedroom', '2 Bedroom']].map(([val, label]) => (
                  <button
                    key={val}
                    type="button"
                    className={`room-type-btn ${filters.roomType === val ? 'active' : ''}`}
                    onClick={() => handleRoomTypeSelect(val)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Amenities by category */}
            {amenities.length > 0 && (() => {
              const getCategory = (name) => {
                if (AMENITY_CATEGORIES.popular.includes(name)) return 'popular'
                if (AMENITY_CATEGORIES.room.includes(name)) return 'room'
                if (AMENITY_CATEGORIES.building.includes(name)) return 'building'
                return 'other'
              }
              const groups = [
                { key: 'popular', label: 'ที่ค้นหาบ่อย' },
                { key: 'room', label: 'สิ่งอำนวยความสะดวกภายในห้อง' },
                { key: 'building', label: 'สิ่งอำนวยความสะดวกในอาคาร' },
                { key: 'other', label: 'อื่นๆ' },
              ]
              return groups.map(({ key, label }) => {
                const group = amenities.filter(a => getCategory(a.name) === key)
                if (group.length === 0) return null
                return (
                  <div key={key} className="filter-section">
                    <h4 className="filter-section-title">{label}</h4>
                    <div className="amenity-list">
                      {group.map(amenity => (
                        <label key={amenity.id} className={`amenity-check-item ${filters.selectedAmenities.includes(amenity.id) ? 'checked' : ''}`}>
                          <input
                            type="checkbox"
                            checked={filters.selectedAmenities.includes(amenity.id)}
                            onChange={() => handleAmenityToggle(amenity.id)}
                          />
                          <span className="amenity-check-name">{amenity.name}</span>
                          <span className="amenity-check-count">({amenity.listing_count || 0})</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )
              })
            })()}

          </aside>

          <main className="listings-main">
            <h2>รายการหอพัก</h2>
            {listings.length === 0 && !loading ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>ไม่พบรายการหอพัก</div>
            ) : (
              <>
                <div className="listings-grid">
                  {listings.map((listing) => (
                    <Link
                      key={listing.id}
                      to={`/listing/${listing.id}`}
                      className="listing-card"
                    >
                      {listing.primary_image ? (
                        <div className="listing-image">
                          <img
                            src={listing.primary_image.startsWith('http') ? listing.primary_image : `${import.meta.env.VITE_API_URL || ''}${listing.primary_image}`}
                            alt={listing.title}
                            onError={(e) => {
                              e.target.src = 'https://via.placeholder.com/300x200?text=No+Image'
                            }}
                          />
                        </div>
                      ) : (
                        <div className="listing-image">
                          <img src="https://via.placeholder.com/300x200?text=No+Image" alt="No Image" />
                        </div>
                      )}
                      <div className="listing-info">
                        <h3>{listing.title}</h3>
                        <p className="listing-address">{listing.address}</p>
                        <p className="listing-price">
                          {parseFloat(listing.price).toLocaleString()} บาท/เดือน
                        </p>
                        <p className="listing-type">
                          {{ studio: 'Studio', one_bedroom: '1 Bedroom', two_bedroom: '2 Bedroom' }[listing.room_type] || listing.room_type}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
                {loading && (
                  <div style={{ textAlign: 'center', padding: '20px' }}>กำลังโหลด...</div>
                )}
                {!loading && pagination.hasMore && listings.length > 0 && (
                  <div className="load-more">
                    <button onClick={loadMore} className="btn btn-secondary">
                      โหลดเพิ่มเติม
                    </button>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}

export default Home
