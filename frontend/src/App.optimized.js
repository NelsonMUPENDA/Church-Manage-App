import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import './App.css';

import { queryClient } from './lib/queryClient';
import ProtectedRoute from './components/ProtectedRoute';
import Logo from './components/Logo';

// Eagerly loaded pages (critical for first paint)
import Login from './pages/Login';
import PublicHome from './pages/PublicHome';
import PublicEvent from './pages/PublicEvent';

// Lazy loaded pages (code split by route)
const PublicChurch = lazy(() => import('./pages/PublicChurch'));
const Publications = lazy(() => import('./pages/Publications'));

// Admin pages - lazy loaded
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Members = lazy(() => import('./pages/Members'));
const Users = lazy(() => import('./pages/Users'));
const Events = lazy(() => import('./pages/Events'));
const Pointage = lazy(() => import('./pages/Pointage'));
const Diaconat = lazy(() => import('./pages/Diaconat'));
const Evangelisation = lazy(() => import('./pages/Evangelisation'));
const Finances = lazy(() => import('./pages/Finances'));
const Mariage = lazy(() => import('./pages/Mariage'));
const Documents = lazy(() => import('./pages/Documents'));
const Reports = lazy(() => import('./pages/Reports'));
const Announcements = lazy(() => import('./pages/Announcements'));
const Logistics = lazy(() => import('./pages/Logistics'));
const About = lazy(() => import('./pages/About'));
const Account = lazy(() => import('./pages/Account'));
const AuditLogs = lazy(() => import('./pages/AuditLogs'));

// Shell component - lazy loaded
const Shell = lazy(() => import('./components/Shell'));

// Loading fallback component
function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 relative">
          <Logo className="w-full h-full animate-pulse" />
        </div>
        <div className="text-slate-500 dark:text-slate-400 text-sm animate-pulse">
          Chargement...
        </div>
      </div>
    </div>
  );
}

// Lazy route wrapper with Suspense
function LazyRoute({ children }) {
  return (
    <Suspense fallback={<PageLoader />}>
      {children}
    </Suspense>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<PublicHome />} />
          <Route 
            path="/eglise" 
            element={
              <LazyRoute>
                <PublicChurch />
              </LazyRoute>
            } 
          />
          <Route 
            path="/publications" 
            element={
              <LazyRoute>
                <Publications />
              </LazyRoute>
            } 
          />
          <Route path="/login" element={<Login />} />
          <Route path="/p/:slug" element={<PublicEvent />} />
          
          {/* Protected admin routes with Shell layout */}
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <LazyRoute>
                  <Shell />
                </LazyRoute>
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
      
      {/* React Query DevTools - only in development */}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
}

export default App;
