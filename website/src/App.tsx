import { Routes, Route, Navigate } from 'react-router-dom'
import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import AdminLayout from './layouts/AdminLayout'
// import Dashboard from './pages/admin/Dashboard'
// import Users from './pages/admin/Users'
// import Appointments from './pages/admin/Appointments'
import WebsiteBuilder from './pages/admin/WebsiteBuilder'
// import Home from './pages/public/Home'
// import PublicPage from './pages/public/PublicPage'
// import Login from './pages/Login'

function App() {
  return (
    <>

      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<WebsiteBuilder />} />

        {/* Admin Routes */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          {/* <Route path="website-builder" element={<WebsiteBuilder />} /> */}
        </Route>
      </Routes>
    </>
  )
}

export default App
