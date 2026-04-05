import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Navbar.css'

const Navbar = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  const isActive = (path) => location.pathname === path

  const handleLogout = () => {
    logout()
    navigate('/')
    setMenuOpen(false)
  }

  const closeMenu = () => setMenuOpen(false)

  return (
    <nav className="navbar">
      <div className="container">
        <div className="navbar-content">
          <Link to="/" className="navbar-brand" onClick={closeMenu}>
            ระบบตัวกลางการปล่อยเช่าห้องพัก
          </Link>
          <button
            className={`hamburger-btn${menuOpen ? ' open' : ''}`}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
          <div className={`navbar-links${menuOpen ? ' mobile-open' : ''}`}>
            {user ? (
              <>
                {user.role === 'tenant' && (
                  <Link to="/favorites" className={isActive('/favorites') ? 'nav-link active' : 'nav-link'} onClick={closeMenu}>รายการโปรด</Link>
                )}
                {user.role === 'landlord' && (
                  <Link to="/landlord/dashboard" className={isActive('/landlord/dashboard') ? 'nav-link active' : 'nav-link'} onClick={closeMenu}>แดชบอร์ด</Link>
                )}
                {user.role === 'admin' && (
                  <>
                    <Link to="/admin/dashboard" className={isActive('/admin/dashboard') ? 'nav-link active' : 'nav-link'} onClick={closeMenu}>แดชบอร์ดแอดมิน</Link>
                    <Link to="/admin/listings" className={isActive('/admin/listings') ? 'nav-link active' : 'nav-link'} onClick={closeMenu}>อนุมัติประกาศ</Link>
                    <Link to="/admin/users" className={isActive('/admin/users') ? 'nav-link active' : 'nav-link'} onClick={closeMenu}>จัดการผู้ใช้</Link>
                  </>
                )}
                <Link to="/profile" className="user-name" onClick={closeMenu}>{user.firstName} {user.lastName}</Link>
                <button onClick={handleLogout} className="btn btn-secondary">ออกจากระบบ</button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn btn-primary" onClick={closeMenu}>เข้าสู่ระบบ</Link>
                <Link to="/register" className="btn btn-secondary" onClick={closeMenu}>สมัครสมาชิก</Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
