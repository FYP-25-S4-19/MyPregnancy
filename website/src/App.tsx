import { Routes, Route, Navigate } from 'react-router-dom'
import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import AdminLayout from './layouts/AdminLayout'
import WebsiteBuilder from './pages/admin/WebsiteBuilder'
import PublicPage from "./pages/public/PublicPage";
import ManageAccount from './pages/admin/manageAccount';

function App() {
  return (
    <>
      <Routes>
        {/* Admin Routes */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="website-builder" element={<WebsiteBuilder />} />
        </Route>

        {/* Public Routes - Specific routes BEFORE wildcard */}
        <Route path="/" element={<WebsiteBuilder />} />
        <Route path="/manage-account" element={<ManageAccount />} />
        
        {/* Wildcard route LAST */}
        <Route path="/:slug" element={<PublicPage />} />
      </Routes>
    </>
  )
}

export default App
