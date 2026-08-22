import React from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import AuthPage from './pages/AuthPage'
import { GuestLayout, AuthLayout } from './pages/Layout'
import HomePage from './pages/HomePage'
import BuilderPage from './pages/BuilderPage'
import PreviewPage from './pages/PreviewPage'
import PublishPage from './pages/PublishPage'

const App = () => {
  return (
    <>
      <Toaster position="top-right" />
      <Routes>
      {/* login Routes */}
      <Route element={<GuestLayout/>}>       
        <Route path="/login" element={<AuthPage mode="login" />} />
        <Route path="/register" element={<AuthPage mode="register" />} />
      </Route>
      {/* Protected Routes */}
      <Route element={<AuthLayout/>}>       
        <Route path="/" element={<HomePage/>} />
        <Route path="/builder/:id" element={<BuilderPage/>} />
        <Route path="/preview/:id" element={<PreviewPage/>} />
      </Route>
      {/*Public Routes */}
      <Route path='/publish/:id' element={<PublishPage/>}/>
      {/* catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </>
  )
}

export default App