import { Routes, Route, Navigate } from 'react-router-dom'
import './App.css'
import AdminLayout from './layouts/AdminLayout'
import ManageAccount from './pages/admin/manageAccount'
import WebsiteBuilder from './pages/admin/WebsiteBuilder'
import ArticleCategories from './pages/admin/ArticleCategories'
import DoctorSpecialization from './pages/admin/DoctorSpecialization'
import RecipeCategories from './pages/admin/RecipeCategories'
import Feedback from './pages/admin/Feedback'
import PublicPage from "./pages/public/PublicPage";
import Home from './pages/public/Home'

function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<PublicPage />} />
      <Route path="/home" element={<Home />} />

      {/* Admin Routes */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Navigate to="/admin/website-builder" replace />} />
        <Route path="manage-account" element={<ManageAccount />} />
        <Route path="website-builder" element={<WebsiteBuilder />} />
        <Route path="recipe-categories" element={<RecipeCategories />} />
        <Route path="article-categories" element={<ArticleCategories />} />
        <Route path="doctor-specialization" element={<DoctorSpecialization />} />
        <Route path="feedback" element={<Feedback />} />
      </Route>

      {/* Dynamic Page Route - LAST */}
      <Route path="/:slug" element={<PublicPage />} />
    </Routes>
  )
}

export default App
