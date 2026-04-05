import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import axios from '../api/axios'
import './ListingForm.css'

const EditListing = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [amenities, setAmenities] = useState([])
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    address: '',
    latitude: '',
    longitude: '',
    price: '',
    deposit: '',
    waterPrice: '',
    electricityPrice: '',
    roomType: 'studio',
    selectedAmenities: []
  })
  const [images, setImages] = useState([])
  const [previewUrls, setPreviewUrls] = useState([])
  const [existingImages, setExistingImages] = useState([])
  const [error, setError] = useState('')

  // Create and revoke object URLs when images change (prevent memory leak)
  useEffect(() => {
    const urls = images.map(file => URL.createObjectURL(file))
    setPreviewUrls(urls)
    return () => {
      urls.forEach(url => URL.revokeObjectURL(url))
    }
  }, [images])

  useEffect(() => {
    fetchListing()
    fetchAmenities()
  }, [id])

  const fetchListing = async () => {
    try {
      const response = await axios.get(`/api/listings/${id}`)
      const listing = response.data.listing
      setFormData({
        title: listing.title || '',
        description: listing.description || '',
        address: listing.address || '',
        latitude: listing.latitude || '',
        longitude: listing.longitude || '',
        price: listing.price || '',
        deposit: listing.deposit || '',
        waterPrice: listing.water_price || '',
        electricityPrice: listing.electricity_price || '',
        roomType: listing.room_type || 'studio',
        selectedAmenities: listing.amenities ? listing.amenities.map(a => a.id) : []
      })
      setExistingImages(listing.images || [])
    } catch (error) {
      console.error('Error fetching listing:', error)
      setError('ไม่พบรายการ')
    } finally {
      setLoading(false)
    }
  }

  const fetchAmenities = async () => {
    try {
      const response = await axios.get('/api/listings/amenities/all')
      setAmenities(response.data.amenities)
    } catch (error) {
      console.error('Error fetching amenities:', error)
    }
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleAmenityToggle = (amenityId) => {
    setFormData({
      ...formData,
      selectedAmenities: formData.selectedAmenities.includes(amenityId)
        ? formData.selectedAmenities.filter(id => id !== amenityId)
        : [...formData.selectedAmenities, amenityId]
    })
  }

  const handleImageChange = (e) => {
    const newFiles = Array.from(e.target.files)
    setImages(prev => [...prev, ...newFiles])
  }

  const removeNewImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index))
  }

  const deleteImage = async (imageId) => {
    if (!window.confirm('คุณต้องการลบรูปภาพนี้หรือไม่?')) {
      return
    }
    
    try {
      await axios.delete(`/api/listings/${id}/images/${imageId}`)
      setExistingImages(existingImages.filter(img => img.id !== imageId))
    } catch (error) {
      console.error('Error deleting image:', error)
      alert('เกิดข้อผิดพลาดในการลบรูปภาพ')
    }
  }

  const setPrimaryImage = async (imageId) => {
    try {
      await axios.patch(`/api/listings/${id}/images/${imageId}/primary`)
      setExistingImages(existingImages.map(img => ({
        ...img,
        is_primary: img.id === imageId ? 1 : 0
      })))
    } catch (error) {
      console.error('Error setting primary image:', error)
      alert('เกิดข้อผิดพลาดในการตั้งรูปหลัก')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSaving(true)

    try {
      const data = new FormData()
      data.append('title', formData.title)
      data.append('description', formData.description)
      data.append('address', formData.address)
      if (formData.latitude) data.append('latitude', formData.latitude)
      if (formData.longitude) data.append('longitude', formData.longitude)
      data.append('price', formData.price)
      if (formData.deposit) data.append('deposit', formData.deposit)
      if (formData.waterPrice) data.append('waterPrice', formData.waterPrice)
      if (formData.electricityPrice) data.append('electricityPrice', formData.electricityPrice)
      data.append('roomType', formData.roomType)
      data.append('amenities', JSON.stringify(formData.selectedAmenities))

      images.forEach((image) => {
        data.append('images', image)
      })

      await axios.put(`/api/listings/${id}`, data, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      navigate('/landlord/dashboard')
    } catch (error) {
      console.error('Error updating listing:', error)
      setError(error.response?.data?.message || 'เกิดข้อผิดพลาดในการอัปเดตประกาศ')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="container" style={{ padding: '40px', textAlign: 'center' }}>กำลังโหลด...</div>
  }

  return (
    <div className="listing-form-container">
      <div className="container">
        <h1>แก้ไขประกาศ</h1>
        <form onSubmit={handleSubmit} className="listing-form">
          <div className="form-section">
            <h2>ข้อมูลทั่วไป</h2>
            <div className="form-group">
              <label>ชื่อหอพัก *</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label>รายละเอียด</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="5"
              />
            </div>
            <div className="form-group">
              <label>ที่อยู่ *</label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                required
                rows="3"
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>ละติจูด (Latitude)</label>
                <input
                  type="number"
                  step="any"
                  name="latitude"
                  value={formData.latitude}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label>ลองจิจูด (Longitude)</label>
                <input
                  type="number"
                  step="any"
                  name="longitude"
                  value={formData.longitude}
                  onChange={handleChange}
                />
              </div>
            </div>
            <div className="form-group">
              <label>ราคาเช่า (บาท/เดือน) *</label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                required
                min="0"
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>ค่ามัดจำ (บาท)</label>
                <input
                  type="number"
                  name="deposit"
                  value={formData.deposit}
                  onChange={handleChange}
                  min="0"
                />
              </div>
              <div className="form-group">
                <label>ค่าน้ำ (บาท/หน่วย)</label>
                <input
                  type="number"
                  name="waterPrice"
                  value={formData.waterPrice}
                  onChange={handleChange}
                  min="0"
                />
              </div>
              <div className="form-group">
                <label>ค่าไฟ (บาท/หน่วย)</label>
                <input
                  type="text"
                  name="electricityPrice"
                  value={formData.electricityPrice}
                  onChange={handleChange}
                />
              </div>
            </div>
            <div className="form-group">
              <label>ประเภทห้อง *</label>
              <select
                name="roomType"
                value={formData.roomType}
                onChange={handleChange}
                required
              >
                <option value="studio">Studio</option>
                <option value="one_bedroom">1 Bedroom</option>
                <option value="two_bedroom">2 Bedroom</option>
              </select>
            </div>
          </div>

          <div className="form-section">
            <h2>สิ่งอำนวยความสะดวก</h2>
            <div className="amenities-grid">
              {amenities.map((amenity) => (
                <label key={amenity.id} className="amenity-checkbox">
                  <input
                    type="checkbox"
                    checked={formData.selectedAmenities.includes(amenity.id)}
                    onChange={() => handleAmenityToggle(amenity.id)}
                  />
                  <span>{amenity.name}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="form-section">
            <h2>รูปภาพ</h2>
            {existingImages.length > 0 && (
              <div className="existing-images">
                <p>รูปภาพปัจจุบัน:</p>
                <div className="existing-images-grid">
                  {existingImages.map((img) => (
                    <div key={img.id} className="existing-image-item">
                      <img
                        src={img.image_url}
                        alt="Existing"
                        className="existing-image"
                      />
                      {img.is_primary ? (
                        <span className="primary-badge">รูปหลัก</span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setPrimaryImage(img.id)}
                          className="btn-set-primary"
                        >
                          ตั้งเป็นรูปหลัก
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => deleteImage(img.id)}
                        className="btn-delete-image"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="form-group">
              <label>เพิ่มรูปภาพใหม่ (สูงสุด 10 รูป)</label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageChange}
              />
              {images.length > 0 && (
                <div className="image-preview-container">
                  <p className="image-count">เลือก {images.length} รูปใหม่</p>
                  <div className="image-preview-grid">
                    {images.map((image, index) => (
                      <div key={index} className="image-preview-item">
                        <img
                          src={previewUrls[index]}
                          alt={`Preview ${index + 1}`}
                        />
                        <button 
                          type="button" 
                          className="remove-image-btn"
                          onClick={() => removeNewImage(index)}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {error && <div className="error">{error}</div>}

          <div className="form-actions">
            <button
              type="button"
              onClick={() => navigate('/landlord/dashboard')}
              className="btn btn-secondary"
            >
              ยกเลิก
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'กำลังบันทึก...' : 'บันทึกการแก้ไข'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EditListing
