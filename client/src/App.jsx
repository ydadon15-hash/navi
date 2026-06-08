import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ToastProvider } from './lib/ToastContext'
import Home          from './pages/Home.jsx'
import Register      from './pages/Register.jsx'
import Login         from './pages/Login.jsx'
import ForgotPassword from './pages/ForgotPassword.jsx'
import ResetPassword from './pages/ResetPassword.jsx'
import Onboarding    from './pages/Onboarding.jsx'
import Dashboard     from './pages/Dashboard.jsx'
import Syllabi       from './pages/Syllabi.jsx'
import Design        from './pages/Design.jsx'
import Pricing       from './pages/Pricing.jsx'
import Settings      from './pages/Settings.jsx'
import ParentView    from './pages/ParentView.jsx'
import Privacy       from './pages/Privacy.jsx'

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <Routes>
          <Route path="/"                element={<Home />} />
          <Route path="/register"        element={<Register />} />
          <Route path="/login"           element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password"  element={<ResetPassword />} />
          <Route path="/onboarding"      element={<Onboarding />} />
          <Route path="/dashboard"       element={<Dashboard />} />
          <Route path="/syllabi"         element={<Syllabi />} />
          <Route path="/design"          element={<Design />} />
          <Route path="/pricing"         element={<Pricing />} />
          <Route path="/settings"        element={<Settings />} />
          <Route path="/view/:token"     element={<ParentView />} />
          <Route path="/privacy"         element={<Privacy />} />
        </Routes>
      </ToastProvider>
    </BrowserRouter>
  )
}
