import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import PrivateRoute from './components/PrivateRoute'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import ListingDetail from './pages/ListingDetail'
import Favorites from './pages/Favorites'
import LandlordDashboard from './pages/LandlordDashboard'
import CreateListing from './pages/CreateListing'
import EditListing from './pages/EditListing'
import AdminDashboard from './pages/AdminDashboard'
import AdminListings from './pages/AdminListings'
import AdminUsers from './pages/AdminUsers'
import Profile from './pages/Profile'
import './App.css'

function App() {
  return (
    <AuthProvider>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <div className="App">
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/listing/:id" element={<ListingDetail />} />
            <Route 
              path="/favorites" 
              element={
                <PrivateRoute roles={['tenant']}>
                  <Favorites />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/landlord/dashboard" 
              element={
                <PrivateRoute roles={['landlord', 'admin']}>
                  <LandlordDashboard />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/landlord/create" 
              element={
                <PrivateRoute roles={['landlord', 'admin']}>
                  <CreateListing />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/landlord/edit/:id" 
              element={
                <PrivateRoute roles={['landlord', 'admin']}>
                  <EditListing />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/admin/dashboard" 
              element={
                <PrivateRoute roles={['admin']}>
                  <AdminDashboard />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/admin/listings" 
              element={
                <PrivateRoute roles={['admin']}>
                  <AdminListings />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/admin/users" 
              element={
                <PrivateRoute roles={['admin']}>
                  <AdminUsers />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/profile" 
              element={
                <PrivateRoute roles={['tenant', 'landlord', 'admin']}>
                  <Profile />
                </PrivateRoute>
              } 
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  )
}

export default App
