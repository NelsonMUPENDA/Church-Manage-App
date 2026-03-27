import React, { useCallback, useEffect, useState } from 'react';
import { NavLink, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { 
  HomeIcon, 
  UserGroupIcon, 
  CalendarIcon, 
  CurrencyDollarIcon, 
  BellIcon, 
  DocumentTextIcon, 
  ChartBarIcon,
  ClipboardDocumentCheckIcon,
  HeartIcon,
  MegaphoneIcon,
  InformationCircleIcon,
  Cog6ToothIcon,
  MoonIcon,
  SunIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { AnimatePresence, motion } from 'framer-motion';
import '../App.css';

import Logo from './Logo';
import ProtectedRoute from './ProtectedRoute';
import { useAuth } from '../contexts/AuthProvider';
import { useTheme } from '../contexts/ThemeProvider';
import { useToast } from './ToastProvider';

// Lazy loaded page components
import Dashboard from '../pages/Dashboard';
import Members from '../pages/Members';
import Users from '../pages/Users';
import Events from '../pages/Events';
import Pointage from '../pages/Pointage';
import Diaconat from '../pages/Diaconat';
import Evangelisation from '../pages/Evangelisation';
import Finances from '../pages/Finances';
import Mariage from '../pages/Mariage';
import Documents from '../pages/Documents';
import Reports from '../pages/Reports';
import Announcements from '../pages/Announcements';
import Logistics from '../pages/Logistics';
import About from '../pages/About';
import Account from '../pages/Account';
import AuditLogs from '../pages/AuditLogs';

const NAV_ITEMS = [
  { to: '/dashboard', icon: HomeIcon, label: 'Tableau de bord', color: 'indigo', sticker: 'LIVE', stickerVariant: 'cpd-sticker-gospel' },
  { to: '/members', icon: UserGroupIcon, label: 'Membres', color: 'blue', sticker: 'PROFILS', stickerVariant: 'cpd-sticker-gospel' },
  { to: '/events', icon: CalendarIcon, label: 'Programmes & Activités', color: 'green', sticker: 'PLAN', stickerVariant: 'cpd-sticker-gold' },
  { to: '/diaconat', icon: ClipboardDocumentCheckIcon, label: 'Diaconat', color: 'indigo', sticker: 'SERVICE', stickerVariant: 'cpd-sticker' },
  { to: '/evangelisation', icon: MegaphoneIcon, label: 'Évangélisation', color: 'green', sticker: 'GOSPEL', stickerVariant: 'cpd-sticker-gospel' },
  { to: '/mariage', icon: HeartIcon, label: 'Mariage', color: 'purple', sticker: 'AMOUR', stickerVariant: 'cpd-sticker-gold' },
  { to: '/announcements', icon: MegaphoneIcon, label: 'Annonces', color: 'purple', sticker: 'ACTU', stickerVariant: 'cpd-sticker' },
  { to: '/finances', icon: CurrencyDollarIcon, label: 'Finances', color: 'yellow', sticker: 'DONS', stickerVariant: 'cpd-sticker-gold' },
  { to: '/documents', icon: DocumentTextIcon, label: 'Documents', color: 'purple', sticker: 'DOCS', stickerVariant: 'cpd-sticker' },
  { to: '/reports', icon: ChartBarIcon, label: 'Rapports', color: 'red', sticker: 'PDF', stickerVariant: 'cpd-sticker-gospel' },
  { to: '/about', icon: InformationCircleIcon, label: 'Infos Église', color: 'indigo', sticker: 'ÉGLISE', stickerVariant: 'cpd-sticker' },
];

function Shell() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const { theme, toggle } = useTheme();
  const toast = useToast();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    setProfileOpen(false);
    setSidebarOpen(false);
  }, [location.pathname]);

  const pageWrap = (node) => (
    <motion.div
      key={location.pathname}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.25 }}
      className="w-full"
    >
      {node}
    </motion.div>
  );

  // Filter nav items by user role
  const navItems = useMemo(() => {
    const role = user?.role;
    if (!role) return NAV_ITEMS;
    
    // Admin/super_admin sees everything
    if (['admin', 'super_admin'].includes(role)) return NAV_ITEMS;
    
    // Filter based on role
    return NAV_ITEMS.filter(item => {
      if (item.to === '/finances' && !['treasurer', 'financial_head'].includes(role)) return false;
      if (item.to === '/members' && !['secretary', 'protocol_head'].includes(role)) return false;
      if (item.to === '/diaconat' && !['secretary', 'protocol_head', 'department_head', 'logistics_head'].includes(role)) return false;
      if (item.to === '/evangelisation' && !['department_head', 'evangelism_head'].includes(role)) return false;
      if (item.to === '/reports' && role !== 'admin') return false;
      return true;
    });
  }, [user]);

  const isActive = useCallback((path) => location.pathname === path, [location.pathname]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100">
      {/* Mobile Header */}
      <header className="lg:hidden bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 py-3 flex items-center justify-between sticky top-0 z-40">
        <button 
          onClick={() => setSidebarOpen(true)}
          className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
        >
          <Bars3Icon className="w-6 h-6" />
        </button>
        <Logo className="h-8 w-auto" />
        <div className="w-10" /> {/* Spacer for alignment */}
      </header>

      <div className="flex min-h-screen">
        {/* Sidebar - Desktop */}
        <aside className="hidden lg:block w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 fixed h-screen overflow-y-auto">
          <div className="p-6">
            <Logo className="h-10 w-auto mb-8" />
            <nav className="space-y-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) => `
                    flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                    ${isActive 
                      ? `bg-${item.color}-50 dark:bg-${item.color}-900/20 text-${item.color}-600 dark:text-${item.color}-400` 
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
                    }
                  `}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  <span className="truncate">{item.label}</span>
                  {item.sticker && (
                    <span className={`ml-auto text-[10px] px-1.5 py-0.5 rounded ${item.stickerVariant || 'cpd-sticker'}`}>
                      {item.sticker}
                    </span>
                  )}
                </NavLink>
              ))}
            </nav>
          </div>

          {/* User menu at bottom */}
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 text-sm font-medium">
                {user?.first_name?.[0]}{user?.last_name?.[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {user?.first_name} {user?.last_name}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate capitalize">
                  {user?.role}
                </p>
              </div>
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                <Cog6ToothIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        </aside>

        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div 
            className="lg:hidden fixed inset-0 bg-black/50 z-40"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Mobile Sidebar */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.3 }}
              className="lg:hidden fixed left-0 top-0 bottom-0 w-72 bg-white dark:bg-slate-800 z-50 overflow-y-auto"
            >
              <div className="p-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-700">
                <Logo className="h-8 w-auto" />
                <button 
                  onClick={() => setSidebarOpen(false)}
                  className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>
              <nav className="p-4 space-y-1">
                {navItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setSidebarOpen(false)}
                    className={({ isActive }) => `
                      flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors
                      ${isActive 
                        ? `bg-${item.color}-50 dark:bg-${item.color}-900/20 text-${item.color}-600 dark:text-${item.color}-400` 
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
                      }
                    `}
                  >
                    <item.icon className="w-5 h-5 flex-shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </NavLink>
                ))}
              </nav>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <main className="flex-1 lg:ml-64 min-h-screen">
          {/* Top Bar */}
          <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-4 flex items-center justify-between sticky top-0 z-30">
            <h1 className="text-xl font-semibold">
              {navItems.find(item => isActive(item.to))?.label || 'Dashboard'}
            </h1>
            <div className="flex items-center gap-3">
              <button
                onClick={toggle}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                {theme === 'dark' ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
              </button>
              <button
                onClick={() => navigate('/account')}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-sm"
              >
                <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 text-xs font-medium">
                  {user?.first_name?.[0]}{user?.last_name?.[0]}
                </div>
                <span className="hidden sm:inline">{user?.first_name}</span>
              </button>
              <button
                onClick={logout}
                className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400"
              >
                <ArrowRightOnRectangleIcon className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Page Content */}
          <div className="p-6">
            <AnimatePresence mode="wait">
              <Routes location={location} key={location.pathname}>
                <Route path="/dashboard" element={pageWrap(<Dashboard />)} />
                <Route path="/events" element={pageWrap(<Events />)} />
                <Route path="/diaconat" element={pageWrap(<ProtectedRoute allowedRoles={['admin', 'super_admin', 'secretary', 'protocol_head', 'department_head', 'logistics_head']}><Diaconat /></ProtectedRoute>)} />
                <Route path="/evangelisation" element={pageWrap(<ProtectedRoute allowedRoles={['admin', 'super_admin', 'department_head', 'evangelism_head']}><Evangelisation /></ProtectedRoute>)} />
                <Route path="/mariage" element={pageWrap(<Mariage />)} />
                <Route path="/pointage" element={pageWrap(<ProtectedRoute allowedRoles={['admin', 'super_admin', 'secretary', 'protocol_head']}><Pointage /></ProtectedRoute>)} />
                <Route path="/announcements" element={pageWrap(<Announcements />)} />
                <Route path="/about" element={pageWrap(<About />)} />
                <Route path="/users" element={pageWrap(<ProtectedRoute allowedRoles={['admin', 'super_admin']}><Users /></ProtectedRoute>)} />
                <Route path="/members" element={pageWrap(<ProtectedRoute allowedRoles={['admin', 'super_admin']}><Members /></ProtectedRoute>)} />
                <Route path="/logistics" element={pageWrap(<ProtectedRoute allowedRoles={['admin', 'super_admin']}><Logistics /></ProtectedRoute>)} />
                <Route path="/finances" element={pageWrap(<ProtectedRoute allowedRoles={['admin', 'super_admin', 'treasurer', 'financial_head']}><Finances /></ProtectedRoute>)} />
                <Route path="/documents" element={pageWrap(<Documents />)} />
                <Route path="/account" element={pageWrap(<Account />)} />
                <Route path="/reports" element={pageWrap(<ProtectedRoute allowedRoles={['admin', 'super_admin']}><Reports /></ProtectedRoute>)} />
                <Route path="/audit-logs" element={pageWrap(<ProtectedRoute allowedRoles={['admin', 'super_admin']}><AuditLogs /></ProtectedRoute>)} />
                <Route path="*" element={pageWrap(<Navigate to="/dashboard" replace />)} />
              </Routes>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
}

export default Shell;
