import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Navbar.css'

const Navbar = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const isActive = (path) => location.pathname === path

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <nav className="navbar">
      <div className="container">
        <div className="navbar-content">
          <Link to="/" className="navbar-brand">
            ระบบหอพัก
          </Link>
          <div className="navbar-links">
            {user ? (
              <>
                {user.role === 'tenant' && (
                  <Link to="/favorites" className={isActive('/favorites') ? 'nav-link active' : 'nav-link'}>รายการโปรด</Link>
                )}
                {user.role === 'landlord' && (
                  <Link to="/landlord/dashboard" className={isActive('/landlord/dashboard') ? 'nav-link active' : 'nav-link'}>แดชบอร์ด</Link>
                )}
                {user.role === 'admin' && (
                  <>
                    <Link to="/admin/dashboard" className={isActive('/admin/dashboard') ? 'nav-link active' : 'nav-link'}>แดชบอร์ดแอดมิน</Link>
                    <Link to="/admin/listings" className={isActive('/admin/listings') ? 'nav-link active' : 'nav-link'}>อนุมัติประกาศ</Link>
                    <Link to="/admin/users" className={isActive('/admin/users') ? 'nav-link active' : 'nav-link'}>จัดการผู้ใช้</Link>
                  </>
                )}
                <Link to="/profile" className="user-name">{user.firstName} {user.lastName}</Link>
                <button onClick={handleLogout} className="btn btn-secondary">ออกจากระบบ</button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn btn-primary">เข้าสู่ระบบ</Link>
                <Link to="/register" className="btn btn-secondary">สมัครสมาชิก</Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
