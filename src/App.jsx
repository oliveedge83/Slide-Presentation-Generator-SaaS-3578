import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { TokenProvider } from './contexts/TokenContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import CreatePresentation from './pages/CreatePresentation';
import PresentationHistory from './pages/PresentationHistory';
import TokenSettings from './pages/TokenSettings';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <TokenProvider>
        <Router>
          <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route element={<ProtectedRoute />}>
                <Route element={<Layout />}>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/create" element={<CreatePresentation />} />
                  <Route path="/history" element={<PresentationHistory />} />
                  <Route path="/settings" element={<TokenSettings />} />
                </Route>
              </Route>
            </Routes>
            <Toaster 
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#363636',
                  color: '#fff',
                  borderRadius: '8px',
                },
              }}
            />
          </div>
        </Router>
      </TokenProvider>
    </AuthProvider>
  );
}

export default App;