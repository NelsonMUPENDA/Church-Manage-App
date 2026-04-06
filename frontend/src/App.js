import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { BrowserRouter as Router, NavLink, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
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
import './App.css';

import Logo from './components/Logo';
import ProtectedRoute from './components/ProtectedRoute';
import Dashboard from './pages/Dashboard';
import Members from './pages/Members';
import Users from './pages/Users';
import Events from './pages/Events';
import Pointage from './pages/Pointage';
import Diaconat from './pages/Diaconat';
import Evangelisation from './pages/Evangelisation';
import Finances from './pages/Finances';
import Mariage from './pages/Mariage';
import Documents from './pages/Documents';
import Reports from './pages/Reports';
import Announcements from './pages/Announcements';
import Logistics from './pages/Logistics';
import About from './pages/About';
import Account from './pages/Account';
import PublicHome from './pages/PublicHome';
import PublicAbout from './pages/PublicAbout';
import PublicPublications from './pages/PublicPublications';
import PublicDiffusions from './pages/PublicDiffusions';
import PublicEvenements from './pages/PublicEvenements';
import PublicContact from './pages/PublicContact';
import AuditLogs from './pages/AuditLogs';
import PublicEvent from './pages/PublicEvent';
import Login from './pages/Login';
import PublicHome from './pages/PublicHomeEnhanced';
import PublicChurch from './pages/PublicChurch';
import Publications from './pages/Publications';
import { useAuth } from './contexts/AuthProvider';
import { useApprovalQueue } from './contexts/ApprovalQueueProvider';
import { useTheme } from './contexts/ThemeProvider';
import { useToast } from './components/ToastProvider';
import { api, API_BASE_URL } from './services/apiClient';
import { UI_TEXT } from './uiText';

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

const ACTION_ITEMS = [
  { to: '/members', label: 'Ajouter un membre', icon: UserGroupIcon, color: 'indigo' },
  { to: '/events', label: 'Créer un événement', icon: CalendarIcon, color: 'green' },
  { to: '/reports', label: 'Voir les rapports', icon: ChartBarIcon, color: 'purple' },
];

function Shell() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const { theme, toggle } = useTheme();
  const toast = useToast();

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [approvalOpen, setApprovalOpen] = useState(false);
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [loadingApprovals, setLoadingApprovals] = useState(false);
  const [approvalsError, setApprovalsError] = useState('');
  const [approvalDetailsOpen, setApprovalDetailsOpen] = useState(false);
  const [approvalDetailsLoading, setApprovalDetailsLoading] = useState(false);
  const [approvalDetails, setApprovalDetails] = useState(null);
  const [myApprovalOpen, setMyApprovalOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);

  useEffect(() => {
    setProfileOpen(false);
    setSidebarOpen(false);
  }, [location.pathname]);

  const pageWrap = (node) => (
    <motion.div
      key={location.pathname}
      className="h-full min-h-0"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.22 }}
    >
      {node}
    </motion.div>
  );

  const rawRole = user?.is_superuser ? 'super_admin' : user?.is_staff ? 'admin' : user?.role;
  const role = rawRole === 'administrator' ? 'admin' : rawRole === 'pastor' ? 'super_admin' : rawRole;
  const departmentName = String(user?.department_name || '').toLowerCase();
  const isAdmin = role === 'admin' || role === 'super_admin';
  const isTreasurer = role === 'treasurer' || role === 'financial_head';
  const isProtocolDeptHead = role === 'department_head' && (departmentName.includes('protoc') || departmentName.includes('protocol'));
  const isSecretary = role === 'secretary' || role === 'protocol_head' || isProtocolDeptHead;
  const isLogisticsHead = (role === 'logistics_head' || (role === 'department_head' && (departmentName.includes('logist') || departmentName.includes('logistique')))) && !isProtocolDeptHead;
  const isEvangelismHead = role === 'evangelism_head' || (role === 'department_head' && (departmentName.includes('evang') || departmentName.includes('évang')));

  const loadPendingApprovals = useCallback(async () => {
    if (!isAdmin) {
      setPendingApprovals([]);
      setApprovalsError('');
      return;
    }

    setLoadingApprovals(true);
    setApprovalsError('');
    try {
      const res = await api.get('/api/approval-requests/', { params: { status: 'pending' } });
      const data = Array.isArray(res.data) ? res.data : res.data?.results || [];
      setPendingApprovals(Array.isArray(data) ? data : []);
    } catch (err) {
      setPendingApprovals([]);
      setApprovalsError('Impossible de charger les demandes.');
    } finally {
      setLoadingApprovals(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    loadPendingApprovals();
  }, [loadPendingApprovals]);

  useEffect(() => {
    if (!isAdmin) return undefined;
    const id = window.setInterval(() => {
      loadPendingApprovals();
    }, 25000);
    return () => window.clearInterval(id);
  }, [isAdmin, loadPendingApprovals]);

  const pendingApprovalsCount = pendingApprovals.length;

  const {
    items: myApprovalItems,
    pendingCount: myPendingApprovalCount,
    loading: loadingMyApprovals,
    error: myApprovalsError,
    dismiss: dismissMyApproval,
    refresh: refreshMyApprovals,
  } = useApprovalQueue();

  useEffect(() => {
    setMyApprovalOpen(false);
  }, [location.pathname]);

  const approveRequest = useCallback(async (id) => {
    if (!id) return;
    try {
      await api.post(`/api/approval-requests/${id}/approve/`);
      toast.push({ type: 'success', title: 'Approbation', message: 'Action approuvée.' });
      await loadPendingApprovals();
      setApprovalDetailsOpen(false);
      setApprovalDetails(null);
    } catch (err) {
      toast.push({ type: 'error', title: 'Approbation', message: "Impossible d'approuver." });
    }
  }, [loadPendingApprovals, toast]);

  const rejectRequest = useCallback(async (id) => {
    if (!id) return;
    const reason = window.prompt('Motif du refus (optionnel) :', '');
    try {
      await api.post(`/api/approval-requests/${id}/reject/`, { reason: reason || '' });
      toast.push({ type: 'success', title: 'Refus', message: 'Action refusée.' });
      await loadPendingApprovals();
      setApprovalDetailsOpen(false);
      setApprovalDetails(null);
    } catch (err) {
      toast.push({ type: 'error', title: 'Refus', message: 'Impossible de refuser.' });
    }
  }, [loadPendingApprovals, toast]);

  const openApprovalDetails = useCallback(async (row) => {
    const id = Number(row?.id);
    if (!Number.isFinite(id) || id <= 0) return;

    setApprovalDetailsOpen(true);
    setApprovalDetailsLoading(true);
    setApprovalDetails(null);
    try {
      const res = await api.get(`/api/approval-requests/${id}/`);
      setApprovalDetails(res?.data || null);
    } catch (err) {
      setApprovalDetails(null);
      toast.push({ type: 'error', title: 'Demande', message: 'Impossible de charger les détails.' });
    } finally {
      setApprovalDetailsLoading(false);
    }
  }, [toast]);

  const formatPayloadValue = (v) => {
    if (v === null || v === undefined) return '—';
    if (typeof v === 'string') return v.trim() ? v : '—';
    if (typeof v === 'number') return Number.isFinite(v) ? String(v) : '—';
    if (typeof v === 'boolean') return v ? 'Oui' : 'Non';
    if (Array.isArray(v)) {
      const parts = v.map((x) => formatPayloadValue(x)).filter((x) => String(x).trim());
      return parts.length ? parts.join(', ') : '—';
    }
    if (typeof v === 'object') {
      try {
        const entries = Object.entries(v);
        if (!entries.length) return '—';
        return entries
          .slice(0, 6)
          .map(([k, val]) => `${k}: ${formatPayloadValue(val)}`)
          .join('  •  ');
      } catch {
        return '—';
      }
    }
    try {
      return String(v);
    } catch {
      return '—';
    }
  };

  const homePath = isAdmin
    ? '/dashboard'
    : isSecretary
      ? '/diaconat?tab=pointage'
      : isLogisticsHead
        ? '/diaconat?tab=logistique'
        : isTreasurer
          ? '/finances'
          : isEvangelismHead
            ? '/evangelisation'
            : '/events';

  const navItems = useMemo(() => {
    if (isAdmin) return NAV_ITEMS;

    if (isSecretary || isLogisticsHead) {
      return NAV_ITEMS.filter((i) => ['/dashboard', '/events', '/diaconat', '/announcements', '/documents', '/about'].includes(i.to));
    }

    if (isTreasurer) {
      return NAV_ITEMS.filter((i) => ['/dashboard', '/events', '/finances', '/announcements', '/documents', '/about'].includes(i.to));
    }

    if (isEvangelismHead) {
      return NAV_ITEMS.filter((i) => ['/dashboard', '/events', '/evangelisation', '/announcements', '/documents', '/about'].includes(i.to));
    }

    return NAV_ITEMS.filter((i) => ['/dashboard', '/events', '/announcements', '/documents', '/about'].includes(i.to));
  }, [
    isAdmin,
    isSecretary,
    isLogisticsHead,
    isTreasurer,
    isEvangelismHead,
  ]);

  const userPhotoUrl = useMemo(() => {
    const p = user?.photo;
    if (!p) return '';
    if (String(p).startsWith('http')) return String(p);
    return `${API_BASE_URL}${p}`;
  }, [API_BASE_URL, user?.photo]);

  const actionItems = isAdmin ? ACTION_ITEMS : [];

  const navGroups = useMemo(() => {
    const sectionFor = (to) => {
      if (to === '/dashboard') return 'Général';
      if (['/users', '/audit-logs'].includes(to)) return 'Administration';
      if (['/members'].includes(to)) return 'Communauté';
      if (['/events', '/diaconat', '/evangelisation', '/mariage'].includes(to)) return 'Activités';
      if (['/finances', '/reports'].includes(to)) return 'Finances';
      if (['/documents'].includes(to)) return 'Ressources';
      if (['/about'].includes(to)) return 'Église';
      return 'Autre';
    };

    const groups = new Map();
    (navItems || []).forEach((item) => {
      const key = sectionFor(item.to);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(item);
    });

    const order = ['Général', 'Communauté', 'Administration', 'Activités', 'Finances', 'Ressources', 'Autre', 'Église'];
    return order
      .filter((k) => groups.has(k))
      .map((k) => ({ title: k, items: groups.get(k) }));
  }, [navItems]);

  const sidebarNav = (
    <>
      <div className="px-4 pt-6">
        <div className="p-4 cpd-surface">
          <div className="text-xs text-gray-500 dark:text-slate-300">Connecté en tant que</div>
          <div className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">{user?.role || 'Utilisateur'}</div>
        </div>
      </div>

      <nav className="mt-4 px-3 pb-6">
        {navGroups.map((group, groupIndex) => (
          <div key={group.title} className={groupIndex === 0 ? '' : 'mt-5'}>
            <div className="px-2 text-[11px] font-semibold tracking-wide text-gray-500 dark:text-slate-400">
              {group.title}
            </div>
            <div className="mt-2 space-y-1">
              {group.items.map((item, index) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: (groupIndex * 0.02) + (index * 0.02), duration: 0.18 }}
                >
                  <NavLink
                    to={item.to}
                    onClick={() => setSidebarOpen(false)}
                    className={({ isActive }) =>
                      [
                        'cpd-nav-item group',
                        isActive ? 'cpd-nav-item-active' : 'cpd-nav-item-inactive',
                      ].join(' ')
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <item.icon className={[
                          'h-5 w-5 mr-3 shrink-0',
                          isActive ? 'text-indigo-600 dark:text-indigo-300' : 'text-slate-400 group-hover:text-slate-600 dark:text-slate-500 dark:group-hover:text-slate-200',
                        ].join(' ')} />
                        <span className={['text-sm font-medium flex-1 min-w-0 truncate', isActive ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-slate-200'].join(' ')}>
                          {item.label}
                        </span>
                        {item.sticker ? (
                          <span className={[
                            'ml-3',
                            'cpd-sticker',
                            'cpd-sticker-sm',
                            (item.stickerVariant || ''),
                          ].join(' ')}>{item.sticker}</span>
                        ) : null}
                      </>
                    )}
                  </NavLink>
                </motion.div>
              ))}
            </div>
          </div>
        ))}
      </nav>
    </>
  );

  return (
    <div className="cpd-dynamic-theme min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-200 rounded-full mix-blend-multiply filter blur-xl opacity-20"
          animate={{ scale: [1, 1.2, 1], rotate: [0, 180, 360] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        />
        <motion.div
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-18"
          animate={{ scale: [1.2, 1, 1.2], rotate: [360, 180, 0] }}
          transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
        />
      </div>

      <motion.header
        className="sticky top-0 z-50"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 100 }}
      >
        <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-md shadow-sm border-b border-gray-200/70 dark:border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
            <motion.div
              className="flex items-center gap-3"
              whileHover={{ scale: 1.01 }}
              transition={{ type: 'spring', stiffness: 400 }}
            >
              <motion.button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 -ml-1 rounded-xl text-gray-600 hover:text-gray-900 dark:text-slate-300 dark:hover:text-white hover:bg-gray-100/80 dark:hover:bg-white/5"
                whileTap={{ scale: 0.95 }}
                aria-label="Ouvrir le menu"
                title="Menu"
              >
                <Bars3Icon className="h-6 w-6" />
              </motion.button>

              <div className="h-11 w-11 rounded-2xl bg-white/90 dark:bg-slate-900/40 border border-gray-200/70 dark:border-white/10 flex items-center justify-center shadow-sm">
                <Logo className="h-8 w-8" />
              </div>
              <div className="leading-tight">
                <div className="text-[15px] sm:text-base font-semibold text-gray-900 dark:text-white">
                  Consolation et Paix Divine
                </div>
                <div className="text-xs text-gray-500 dark:text-slate-300">Plateforme de gestion</div>
              </div>
            </motion.div>

            <nav className="flex items-center space-x-1 sm:space-x-2">
              <motion.button
                onClick={() => navigate(homePath)}
                className="hidden sm:inline-flex px-3 py-2 rounded-xl text-sm font-medium text-gray-700 dark:text-slate-200 hover:bg-gray-100/80 dark:hover:bg-white/5 transition-colors"
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.98 }}
              >
                {UI_TEXT.home}
              </motion.button>

              {isAdmin ? (
                <div className="relative">
                  <motion.button
                    className="relative p-2 text-gray-500 hover:text-gray-900 dark:text-slate-300 dark:hover:text-white transition-colors"
                    whileHover={{ y: -1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      const next = !approvalOpen;
                      setApprovalOpen(next);
                      if (next) loadPendingApprovals();
                    }}
                    aria-label="Demandes d'approbation"
                    title="Demandes d'approbation"
                  >
                    <BellIcon className="h-6 w-6" />
                    {pendingApprovalsCount > 0 ? (
                      <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-600 text-[11px] leading-[18px] text-center" style={{ color: 'rgb(248 250 252)' }}>
                        {pendingApprovalsCount > 99 ? '99+' : pendingApprovalsCount}
                      </span>
                    ) : null}
                  </motion.button>

                  <AnimatePresence>
                    {approvalOpen ? (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.98 }}
                        transition={{ duration: 0.16 }}
                        className="absolute right-0 mt-2 w-[92vw] max-w-[420px] rounded-2xl bg-white dark:bg-slate-900 backdrop-blur border border-gray-200/70 dark:border-white/10 shadow-xl overflow-hidden"
                      >
                        <div className="px-4 py-3 border-b border-gray-100 dark:border-white/10 flex items-center justify-between">
                          <div className="text-sm font-semibold text-gray-900 dark:text-white">Demandes à approuver</div>
                          <div className="text-xs text-gray-500">{pendingApprovalsCount} en attente</div>
                        </div>

                        <div className="max-h-[420px] overflow-y-auto">
                          {loadingApprovals ? (
                            <div className="px-4 py-4 text-sm text-gray-600 dark:text-gray-300">Chargement…</div>
                          ) : approvalsError ? (
                            <div className="px-4 py-4 text-sm text-red-600">{approvalsError}</div>
                          ) : pendingApprovalsCount === 0 ? (
                            <div className="px-4 py-4 text-sm text-gray-600 dark:text-gray-300">Aucune demande en attente.</div>
                          ) : (
                            <div className="divide-y divide-gray-100 dark:divide-white/10">
                              {pendingApprovals.map((r) => (
                                <div key={r.id} className="px-4 py-3">
                                  <button
                                    type="button"
                                    onClick={() => openApprovalDetails(r)}
                                    className="w-full text-left rounded-xl hover:bg-gray-50/80 dark:hover:bg-white/5 transition-colors"
                                  >
                                    <div className="flex items-start justify-between gap-3">
                                      <div className="min-w-0">
                                        <div className="text-sm font-semibold text-gray-900 dark:text-white break-words whitespace-normal">
                                          {(r.model || 'Action') + ' • ' + (r.action || '')}
                                        </div>
                                        <div className="text-xs text-gray-500 mt-0.5">
                                          Demandeur: {r.requested_by_username || r.requested_by || '—'}
                                        </div>
                                        {r.object_repr ? (
                                          <div className="text-xs text-gray-500 mt-0.5 break-words whitespace-normal">{r.object_repr}</div>
                                        ) : null}
                                        <div className="mt-2 text-[11px] text-indigo-600">Voir les détails</div>
                                      </div>

                                      <div className="shrink-0 text-xs text-gray-500">›</div>
                                    </div>
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="px-4 py-3 border-t border-gray-100 dark:border-white/10 flex items-center justify-between">
                          <button
                            type="button"
                            onClick={() => loadPendingApprovals()}
                            className="text-xs text-indigo-600 hover:text-indigo-700"
                          >
                            {UI_TEXT.refresh}
                          </button>
                          <button
                            type="button"
                            onClick={() => setApprovalOpen(false)}
                            className="text-xs text-gray-500 hover:text-gray-700"
                          >
                            {UI_TEXT.close}
                          </button>
                        </div>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </div>
              ) : null}

              {!isAdmin ? (
                <div className="relative">
                  <motion.button
                    className="relative p-2 text-gray-500 hover:text-gray-900 dark:text-slate-300 dark:hover:text-white transition-colors"
                    whileHover={{ y: -1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      const next = !myApprovalOpen;
                      setMyApprovalOpen(next);
                      if (next) refreshMyApprovals();
                    }}
                    aria-label="Mes demandes d'approbation"
                    title="Mes demandes d'approbation"
                  >
                    <BellIcon className="h-6 w-6" />
                    {myPendingApprovalCount > 0 ? (
                      <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-amber-500 text-[11px] leading-[18px] text-center" style={{ color: 'rgb(15 23 42)' }}>
                        {myPendingApprovalCount > 99 ? '99+' : myPendingApprovalCount}
                      </span>
                    ) : null}
                  </motion.button>

                  <AnimatePresence>
                    {myApprovalOpen ? (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.98 }}
                        transition={{ duration: 0.16 }}
                        className="absolute right-0 mt-2 w-[92vw] max-w-[420px] rounded-2xl bg-white dark:bg-slate-900 backdrop-blur border border-gray-200/70 dark:border-white/10 shadow-xl overflow-hidden"
                      >
                        <div className="px-4 py-3 border-b border-gray-100 dark:border-white/10 flex items-center justify-between">
                          <div className="text-sm font-semibold text-gray-900 dark:text-white">Mes demandes</div>
                          <div className="text-xs text-gray-500">{myPendingApprovalCount} en attente</div>
                        </div>

                        <div className="max-h-[420px] overflow-y-auto">
                          {loadingMyApprovals ? (
                            <div className="px-4 py-4 text-sm text-gray-600 dark:text-gray-300">Chargement…</div>
                          ) : myApprovalsError ? (
                            <div className="px-4 py-4 text-sm text-red-600">{myApprovalsError}</div>
                          ) : (myApprovalItems || []).length === 0 ? (
                            <div className="px-4 py-4 text-sm text-gray-600 dark:text-gray-300">Aucune demande.</div>
                          ) : (
                            <div className="divide-y divide-gray-100 dark:divide-white/10">
                              {(myApprovalItems || []).map((r) => (
                                <div key={r.id} className="px-4 py-3">
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                      <div className="text-sm font-semibold text-gray-900 dark:text-white break-words whitespace-normal">
                                        {(r.model || 'Action') + ' • ' + (r.action || '')}
                                      </div>
                                      {r.object_repr ? (
                                        <div className="text-xs text-gray-500 mt-0.5 break-words whitespace-normal">{r.object_repr}</div>
                                      ) : null}
                                      <div className="text-xs mt-1">
                                        {r.status === 'pending' ? (
                                          <span className="text-amber-600">En attente</span>
                                        ) : r.status === 'approved' ? (
                                          <span className="text-emerald-600">Approuvée</span>
                                        ) : r.status === 'rejected' ? (
                                          <span className="text-rose-600">Refusée</span>
                                        ) : (
                                          <span className="text-gray-500">{r.status || '—'}</span>
                                        )}
                                      </div>
                                      {r.status === 'rejected' && r.rejection_reason ? (
                                        <div className="text-xs text-rose-600 mt-1">Motif: {r.rejection_reason}</div>
                                      ) : null}
                                    </div>

                                    {r.status !== 'pending' ? (
                                      <div className="shrink-0">
                                        <button
                                          type="button"
                                          onClick={() => dismissMyApproval(r.id)}
                                          className="cpd-btn cpd-btn-outline px-3 py-1.5 text-xs"
                                        >
                                          Masquer
                                        </button>
                                      </div>
                                    ) : null}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="px-4 py-3 border-t border-gray-100 dark:border-white/10 flex items-center justify-between">
                          <button
                            type="button"
                            onClick={() => refreshMyApprovals()}
                            className="text-xs text-indigo-600 hover:text-indigo-700"
                          >
                            {UI_TEXT.refresh}
                          </button>
                          <button
                            type="button"
                            onClick={() => setMyApprovalOpen(false)}
                            className="text-xs text-gray-500 hover:text-gray-700"
                          >
                            {UI_TEXT.close}
                          </button>
                        </div>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </div>
              ) : null}

              <motion.button
                onClick={toggle}
                className="p-2 text-gray-500 hover:text-gray-900 dark:text-slate-300 dark:hover:text-white transition-colors"
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.95 }}
                aria-label="Basculer le thème"
                title="Thème"
              >
                {theme === 'dark' ? <SunIcon className="h-6 w-6" /> : <MoonIcon className="h-6 w-6" />}
              </motion.button>

              <div className="relative">
                <motion.button
                  type="button"
                  onClick={() => setProfileOpen((v) => !v)}
                  className="h-10 w-10 rounded-full bg-white dark:bg-slate-900 border border-gray-200/70 dark:border-white/10 flex items-center justify-center shadow-sm overflow-hidden"
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                  aria-label="Menu profil"
                  title="Profil"
                >
                  {userPhotoUrl ? (
                    <img
                      alt="Avatar"
                      src={userPhotoUrl}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">{(user?.username || 'A').slice(0, 1).toUpperCase()}</span>
                  )}
                </motion.button>

                <AnimatePresence>
                  {profileOpen ? (
                    <>
                      <button
                        type="button"
                        aria-label="Fermer le menu profil"
                        className="fixed inset-0 z-40 cursor-default"
                        onClick={() => setProfileOpen(false)}
                      />
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.98 }}
                        transition={{ duration: 0.16 }}
                        className="absolute right-0 mt-2 z-50 w-[320px] max-w-[90vw] rounded-2xl bg-white dark:bg-slate-900 backdrop-blur border border-gray-200/70 dark:border-white/10 shadow-xl overflow-hidden"
                      >
                      <div className="px-4 py-3 border-b border-gray-100 dark:border-white/10">
                        <div className="text-sm font-semibold text-gray-900 dark:text-white truncate">{user?.username || 'Utilisateur'}</div>
                        <div className="mt-0.5 text-xs text-gray-500 dark:text-slate-400 truncate">{user?.role || 'Utilisateur'}</div>
                      </div>

                      <div className="p-2">
                        <button
                          type="button"
                          className="w-full text-left px-3 py-2 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                          onClick={() => {
                            setProfileOpen(false);
                            navigate('/account', { state: { section: 'personal' } });
                          }}
                        >
                          <span className="inline-flex items-center gap-2 text-sm text-gray-900 dark:text-white">
                            <Cog6ToothIcon className="h-5 w-5 text-slate-400" />
                            {UI_TEXT.profile}
                          </span>
                        </button>

                        <button
                          type="button"
                          className="w-full text-left px-3 py-2 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                          onClick={() => {
                            setProfileOpen(false);
                            navigate('/account', { state: { section: 'security' } });
                          }}
                        >
                          <span className="inline-flex items-center gap-2 text-sm text-gray-900 dark:text-white">
                            <Cog6ToothIcon className="h-5 w-5 text-slate-400" />
                            {UI_TEXT.security}
                          </span>
                        </button>

                        <div className="my-2 h-px bg-gray-100 dark:bg-white/10" />

                        <button
                          type="button"
                          className="w-full text-left px-3 py-2 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
                          onClick={() => {
                            setProfileOpen(false);
                            setLogoutOpen(true);
                          }}
                        >
                          <span className="inline-flex items-center gap-2 text-sm text-rose-700 dark:text-rose-200">
                            <ArrowRightOnRectangleIcon className="h-5 w-5" />
                            {UI_TEXT.logout}
                          </span>
                        </button>
                      </div>
                      </motion.div>
                    </>
                  ) : null}
                </AnimatePresence>
              </div>
            </nav>
            </div>
          </div>
        </div>
      </motion.header>

      <AnimatePresence>
        {logoutOpen ? (
          <motion.div
            className="fixed inset-0 z-[60] flex items-center justify-center px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="absolute inset-0 bg-black/40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setLogoutOpen(false)}
            />

            <motion.div
              className="relative w-full max-w-md cpd-surface p-5"
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              transition={{ duration: 0.16 }}
              role="dialog"
              aria-modal="true"
            >
              <div className="text-sm font-semibold text-gray-900 dark:text-white">Confirmer la déconnexion</div>
              <div className="mt-1 text-sm text-gray-600 dark:text-slate-300">Veux-tu vraiment te déconnecter ?</div>
              <div className="mt-4 flex items-center justify-end gap-2">
                <button
                  type="button"
                  className="cpd-btn cpd-btn-outline px-3 py-2"
                  onClick={() => setLogoutOpen(false)}
                >
                  Annuler
                </button>
                <button
                  type="button"
                  className="cpd-btn px-3 py-2 border border-rose-200/70 dark:border-rose-500/20 bg-rose-50/70 dark:bg-rose-500/10 text-rose-700 dark:text-rose-200 hover:bg-rose-100/70 dark:hover:bg-rose-500/15"
                  onClick={() => {
                    setLogoutOpen(false);
                    logout();
                    toast.push({ type: 'success', title: 'Déconnexion', message: 'À bientôt !' });
                    navigate('/login', { replace: true });
                  }}
                >
                  Déconnexion
                </button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {approvalDetailsOpen ? (
          <motion.div
            className="fixed inset-0 z-[65] flex items-center justify-center px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="absolute inset-0 bg-black/40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setApprovalDetailsOpen(false);
                setApprovalDetails(null);
              }}
            />

            <motion.div
              className="relative w-full max-w-xl cpd-surface p-4 sm:p-5 max-h-[86vh] overflow-y-auto cpd-scroll"
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              transition={{ duration: 0.16 }}
              role="dialog"
              aria-modal="true"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-gray-900 dark:text-white">{UI_TEXT.approvalDetailsTitle}</div>
                  <div className="mt-1 text-xs text-gray-600 dark:text-slate-300">{UI_TEXT.approvalDetailsHint}</div>
                </div>
                <button
                  type="button"
                  className="cpd-btn cpd-btn-ghost px-3 py-2"
                  onClick={() => {
                    setApprovalDetailsOpen(false);
                    setApprovalDetails(null);
                  }}
                >
                  {UI_TEXT.close}
                </button>
              </div>

              <div className="mt-4">
                {approvalDetailsLoading ? (
                  <div className="text-sm text-gray-600 dark:text-slate-300">Chargement…</div>
                ) : !approvalDetails ? (
                  <div className="text-sm text-gray-600 dark:text-slate-300">Aucun détail.</div>
                ) : (
                  <div className="rounded-2xl border border-gray-200/70 dark:border-white/10 bg-white/70 dark:bg-white/5 p-4">
                    <div className="text-sm font-semibold text-gray-900 dark:text-white">
                      {(approvalDetails.model || 'Action') + ' • ' + (approvalDetails.action || '')}
                    </div>
                    <div className="mt-1 text-xs text-gray-600 dark:text-slate-300">
                      Demandeur: {approvalDetails.requested_by_username || approvalDetails.requested_by || '—'}
                    </div>
                    {approvalDetails.object_repr ? (
                      <div className="mt-1 text-xs text-gray-600 dark:text-slate-300">{approvalDetails.object_repr}</div>
                    ) : null}

                    {approvalDetails.payload && typeof approvalDetails.payload === 'object' ? (
                      <div className="mt-3 rounded-xl bg-black/5 dark:bg-white/10 p-3 max-h-[46vh] overflow-auto">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {Object.entries(approvalDetails.payload || {}).map(([k, v]) => (
                            <div key={k} className="rounded-xl bg-white/70 dark:bg-white/5 border border-white/60 dark:border-white/10 p-3 min-w-0">
                              <div className="text-[11px] font-semibold text-gray-600 dark:text-slate-300 break-words">{k}</div>
                              <div className="mt-1 text-xs text-gray-900 dark:text-white break-words">{formatPayloadValue(v)}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : approvalDetails.payload ? (
                      <div className="mt-3 text-sm text-gray-700 dark:text-slate-200 break-words">{formatPayloadValue(approvalDetails.payload)}</div>
                    ) : (
                      <div className="mt-3 text-xs text-gray-500">Aucun payload.</div>
                    )}
                  </div>
                )}
              </div>

              <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-end gap-2">
                <button
                  type="button"
                  className="cpd-btn cpd-btn-outline px-4 py-2"
                  onClick={() => {
                    setApprovalDetailsOpen(false);
                    setApprovalDetails(null);
                  }}
                >
                  {UI_TEXT.cancel}
                </button>
                <button
                  type="button"
                  className="cpd-btn cpd-btn-outline px-4 py-2"
                  disabled={approvalDetailsLoading || !approvalDetails?.id}
                  onClick={() => rejectRequest(approvalDetails?.id)}
                >
                  {UI_TEXT.reject}
                </button>
                <button
                  type="button"
                  className="cpd-btn cpd-btn-solid px-4 py-2"
                  disabled={approvalDetailsLoading || !approvalDetails?.id}
                  onClick={() => approveRequest(approvalDetails?.id)}
                >
                  {UI_TEXT.approve}
                </button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <div className="flex relative z-10 cpd-shell overflow-x-hidden">
        <motion.aside
          className="hidden lg:block w-72 cpd-surface-soft h-full overflow-y-auto"
          initial={{ x: -300 }}
          animate={{ x: 0 }}
          transition={{ type: 'spring', stiffness: 100 }}
        >
          {sidebarNav}
        </motion.aside>

        <AnimatePresence>
          {sidebarOpen ? (
            <motion.div
              className="fixed inset-0 z-[70] lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.button
                type="button"
                aria-label="Fermer le menu"
                className="absolute inset-0 bg-black/40"
                onClick={() => setSidebarOpen(false)}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              />

              <motion.aside
                className="absolute left-0 top-0 h-full w-72 max-w-[86vw] cpd-surface-soft overflow-y-auto"
                initial={{ x: -320 }}
                animate={{ x: 0 }}
                exit={{ x: -320 }}
                transition={{ type: 'spring', stiffness: 120, damping: 18 }}
              >
                <div className="px-4 pt-4 flex items-center justify-between">
                  <div className="text-sm font-semibold text-gray-900 dark:text-white">Menu</div>
                  <motion.button
                    type="button"
                    onClick={() => setSidebarOpen(false)}
                    className="p-2 rounded-xl text-gray-600 hover:text-gray-900 dark:text-slate-300 dark:hover:text-white hover:bg-gray-100/80 dark:hover:bg-white/5"
                    whileTap={{ scale: 0.95 }}
                    aria-label="Fermer"
                    title="Fermer"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </motion.button>
                </div>

                {sidebarNav}
              </motion.aside>
            </motion.div>
          ) : null}
        </AnimatePresence>

        <main className="flex-1 min-h-0 h-full">
          <div className="h-full overflow-y-auto p-3 sm:p-6 lg:p-8 cpd-scroll">
            <AnimatePresence mode="wait">
              <Routes location={location}>
                <Route
                  path="/dashboard"
                  element={
                    pageWrap(
                      <Dashboard actionItems={actionItems} onNavigate={(to) => navigate(to)} />
                    )
                  }
                />
                <Route
                  path="/audit-logs"
                  element={
                    pageWrap(
                      <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                        <AuditLogs />
                      </ProtectedRoute>
                    )
                  }
                />
                <Route path="/events" element={pageWrap(<Events />)} />
                <Route path="/diaconat" element={pageWrap(<ProtectedRoute allowedRoles={['admin', 'super_admin', 'secretary', 'protocol_head', 'department_head', 'logistics_head']}><Diaconat /></ProtectedRoute>)} />
                <Route path="/evangelisation" element={pageWrap(<ProtectedRoute allowedRoles={['admin', 'super_admin', 'department_head', 'evangelism_head']}><Evangelisation /></ProtectedRoute>)} />
                <Route path="/mariage" element={pageWrap(<Mariage />)} />
                <Route path="/pointage" element={pageWrap(<ProtectedRoute allowedRoles={['admin', 'super_admin', 'secretary', 'protocol_head']}><Pointage /></ProtectedRoute>)} />
                <Route path="/announcements" element={pageWrap(<Announcements />)} />
                <Route path="/about" element={pageWrap(<About />)} />
                <Route
                  path="/users"
                  element={pageWrap(
                    <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                      <Users />
                    </ProtectedRoute>
                  )}
                />
                <Route path="/members" element={pageWrap(<ProtectedRoute allowedRoles={['admin', 'super_admin']}><Members /></ProtectedRoute>)} />
                <Route path="/logistics" element={pageWrap(<ProtectedRoute allowedRoles={['admin', 'super_admin']}><Logistics /></ProtectedRoute>)} />
                <Route path="/finances" element={pageWrap(<ProtectedRoute allowedRoles={['admin', 'super_admin', 'treasurer', 'financial_head']}><Finances /></ProtectedRoute>)} />
                <Route path="/documents" element={pageWrap(<Documents />)} />
                <Route path="/account" element={pageWrap(<Account />)} />
                <Route path="/reports" element={pageWrap(<ProtectedRoute allowedRoles={['admin', 'super_admin']}><Reports /></ProtectedRoute>)} />
                <Route path="*" element={pageWrap(<Navigate to="/dashboard" replace />)} />
              </Routes>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/p/:slug" element={<PublicEvent />} />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <Shell />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
