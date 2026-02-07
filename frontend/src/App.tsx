import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from '@/components/ui/sonner'
import { Navbar } from '@/components/Navbar'
import { Landing } from '@/pages/Landing'
import { AuthCallback } from '@/pages/AuthCallback'
import { Dashboard } from '@/pages/Dashboard'
import { RepoPage } from '@/pages/RepoPage'
import { BountyDetail } from '@/pages/BountyDetail'
import { Profile } from '@/pages/Profile'
import { AuthProvider } from '@/components/AuthProvider'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="min-h-screen bg-background">
          <Navbar />
          <main>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/repo/:owner/:name" element={<RepoPage />} />
              <Route path="/bounty/:id" element={<BountyDetail />} />
              <Route path="/profile" element={<Profile />} />
            </Routes>
          </main>
          <Toaster />
        </div>
      </AuthProvider>
    </BrowserRouter>
  )
}
