import { Routes, Route, Navigate } from 'react-router-dom'
import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import AdminLayout from './layouts/AdminLayout'
import WebsiteBuilder from './pages/admin/WebsiteBuilder'
import PublicPage from "./pages/public/PublicPage";

function App() {
  return (
    <>
      <Routes>
        {/* Admin Routes - Must come BEFORE dynamic routes */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="website-builder" element={<WebsiteBuilder />} />
        </Route>

        {/* Public Routes */}
        <Route path="/" element={<WebsiteBuilder />} />
        <Route path="/:slug" element={<PublicPage />} />
      </Routes>
    </>
  )
}

export default App
