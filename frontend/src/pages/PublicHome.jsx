import React, { useMemo } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRightIcon,
  ArrowDownIcon,
  MegaphoneIcon,
  InformationCircleIcon,
  BookOpenIcon,
  SparklesIcon,
  ShieldCheckIcon,
  ChartBarIcon,
  CalendarDaysIcon,
  HeartIcon,
  MapPinIcon,
  PhoneIcon,
} from '@heroicons/react/24/outline';

import Logo from '../components/Logo';
import { useAuth } from '../contexts/AuthProvider';

export default function PublicHome() {
  const { user, isAuthenticated } = useAuth();

  const adminPath = useMemo(() => {
    const rawRole = user?.is_superuser ? 'super_admin' : user?.is_staff ? 'admin' : user?.role;
    const role = rawRole === 'administrator' ? 'admin' : rawRole === 'pastor' ? 'super_admin' : rawRole;

    const departmentName = String(user?.department_name || '').toLowerCase();
    const isAdmin = role === 'admin' || role === 'super_admin';
    const isTreasurer = role === 'treasurer' || role === 'financial_head';
    const isProtocolDeptHead = role === 'department_head' && (departmentName.includes('protoc') || departmentName.includes('protocol'));
    const isSecretary = role === 'secretary' || role === 'protocol_head' || isProtocolDeptHead;
    const isLogisticsHead = (role === 'logistics_head' || (role === 'department_head' && (departmentName.includes('logist') || departmentName.includes('logistique')))) && !isProtocolDeptHead;
    const isEvangelismHead = role === 'evangelism_head' || (role === 'department_head' && (departmentName.includes('evang') || departmentName.includes('évang')));

    if (isAdmin) return '/dashboard';
    if (isSecretary) return '/diaconat?tab=pointage';
    if (isLogisticsHead) return '/diaconat?tab=logistique';
    if (isTreasurer) return '/finances';
    if (isEvangelismHead) return '/evangelisation';
    return '/events';
  }, [user]);

  const fadeUp = {
    hidden: { opacity: 0, y: 14 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <div className="min-h-screen cpd-dynamic-theme bg-gradient-to-br from-slate-50 via-white to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -top-36 -right-40 h-80 w-80 rounded-full bg-indigo-200/35 blur-3xl dark:bg-indigo-600/12"
          animate={{ scale: [1, 1.12, 1], rotate: [0, 12, 0] }}
          transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute -bottom-44 -left-40 h-96 w-96 rounded-full bg-purple-200/35 blur-3xl dark:bg-purple-600/12"
          animate={{ scale: [1.08, 1, 1.08], rotate: [0, -10, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
        />
        <div
          className="absolute inset-0 opacity-25"
          style={{
            backgroundImage:
              'linear-gradient(to right, rgba(99,102,241,0.12) 1px, transparent 1px), linear-gradient(to bottom, rgba(99,102,241,0.10) 1px, transparent 1px)',
            backgroundSize: '72px 72px',
            maskImage: 'radial-gradient(circle at 50% 18%, black 28%, transparent 70%)',
            WebkitMaskImage: 'radial-gradient(circle at 50% 18%, black 28%, transparent 70%)',
          }}
        />
      </div>

      <header className="sticky top-0 z-40 bg-white/70 dark:bg-slate-900/55 backdrop-blur border-b border-gray-200/70 dark:border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-white/90 dark:bg-slate-900/40 border border-gray-200/70 dark:border-white/10 flex items-center justify-center shadow-sm">
              <Logo className="h-7 w-7" />
            </div>
            <div className="leading-tight">
              <div className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white">
                Consolation et Paix Divine
              </div>
              <div className="text-xs text-gray-500 dark:text-slate-300">Église • Accueil</div>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            <NavLink
              to="/eglise"
              className={({ isActive }) =>
                [
                  'px-3 py-2 rounded-xl text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-indigo-50 dark:bg-white/10 text-indigo-700 dark:text-white'
                    : 'text-gray-700 dark:text-slate-200 hover:bg-gray-100/80 dark:hover:bg-white/5',
                ].join(' ')
              }
            >
              Présentation
            </NavLink>
            <NavLink
              to="/publications"
              className={({ isActive }) =>
                [
                  'px-3 py-2 rounded-xl text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-indigo-50 dark:bg-white/10 text-indigo-700 dark:text-white'
                    : 'text-gray-700 dark:text-slate-200 hover:bg-gray-100/80 dark:hover:bg-white/5',
                ].join(' ')
              }
            >
              Publications
            </NavLink>
          </nav>

          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <Link to={adminPath} className="hidden sm:inline-flex items-center gap-2 cpd-btn cpd-btn-outline px-4 py-2">
                Aller à l’administration
                <ArrowRightIcon className="h-4 w-4" />
              </Link>
            ) : null}
            <Link to="/login" className="inline-flex items-center gap-2 cpd-btn cpd-btn-solid px-4 py-2">
              Se connecter
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      <main className="relative z-10">
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
            <motion.div initial="hidden" animate="show" variants={fadeUp} transition={{ duration: 0.35 }}>
              <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 dark:bg-white/10 border border-indigo-100/70 dark:border-white/10 px-3 py-1.5">
                <SparklesIcon className="h-4 w-4 text-indigo-700 dark:text-indigo-200" />
                <span className="text-xs font-semibold text-indigo-800 dark:text-indigo-100">Bienvenue</span>
              </div>

              <h1 className="mt-4 text-3xl sm:text-5xl font-black tracking-tight text-gray-900 dark:text-white">
                Consolation et Paix Divine
              </h1>
              <p className="mt-3 text-gray-700 dark:text-slate-200 max-w-xl text-base leading-relaxed">
                Une communauté chrétienne dédiée à l’édification spirituelle, à l’amour fraternel et au service.
                Suivez nos publications, découvrez l’église et accédez à l’administration après connexion.
              </p>

              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <Link to="/eglise" className="cpd-btn cpd-btn-outline px-4 py-2 inline-flex items-center gap-2">
                  <InformationCircleIcon className="h-5 w-5" />
                  En savoir plus
                </Link>
                <Link to="/publications" className="cpd-btn cpd-btn-solid px-4 py-2 inline-flex items-center gap-2">
                  <BookOpenIcon className="h-5 w-5" />
                  Voir les publications
                </Link>
              </div>

              {isAuthenticated ? (
                <div className="mt-4 rounded-2xl border border-emerald-200/70 dark:border-emerald-500/20 bg-emerald-50/60 dark:bg-emerald-500/10 px-4 py-3">
                  <div className="text-sm font-semibold text-emerald-800 dark:text-emerald-100">Vous êtes déjà connecté</div>
                  <div className="mt-0.5 text-sm text-emerald-800/80 dark:text-emerald-100/80">
                    Accédez à l’administration quand vous le souhaitez.
                  </div>
                  <div className="mt-3">
                    <Link to={adminPath} className="cpd-btn cpd-btn-solid px-4 py-2 inline-flex items-center gap-2">
                      Aller à l’administration
                      <ArrowRightIcon className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              ) : null}

              <div className="mt-6 inline-flex items-center gap-2 text-xs text-gray-500 dark:text-slate-300">
                <MegaphoneIcon className="h-4 w-4" />
                Accès administration: réservé aux utilisateurs autorisés.
              </div>

              <div className="mt-6 hidden lg:flex items-center gap-2 text-sm text-gray-600 dark:text-slate-300">
                <ArrowDownIcon className="h-4 w-4" />
                <span>Découvrir plus bas</span>
              </div>
            </motion.div>

            <motion.div
              className="cpd-surface p-6 sm:p-8 overflow-hidden relative"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.05 }}
            >
              <div className="absolute -top-24 -right-24 h-56 w-56 rounded-full bg-indigo-200/35 blur-3xl dark:bg-indigo-600/12" />
              <div className="absolute -bottom-24 -left-24 h-56 w-56 rounded-full bg-purple-200/35 blur-3xl dark:bg-purple-600/12" />

              <div className="relative">
                <div className="text-sm font-semibold text-gray-900 dark:text-white">Aperçu</div>
                <div className="mt-2 text-sm text-gray-700 dark:text-slate-200">
                  Publications, programmes, et communication — une expérience simple, moderne et sécurisée.
                </div>

                <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-gray-200/70 dark:border-white/10 bg-white/70 dark:bg-white/5 p-4">
                    <div className="flex items-center gap-2 text-xs font-semibold text-gray-600 dark:text-slate-300">
                      <CalendarDaysIcon className="h-4 w-4 text-indigo-700 dark:text-indigo-200" />
                      Programmes
                    </div>
                    <div className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">Activités & événements</div>
                    <div className="mt-1 text-xs text-gray-500 dark:text-slate-300">Liens publics (ex: /p/&lt;slug&gt;) pour partager.</div>
                  </div>

                  <div className="rounded-2xl border border-gray-200/70 dark:border-white/10 bg-white/70 dark:bg-white/5 p-4">
                    <div className="flex items-center gap-2 text-xs font-semibold text-gray-600 dark:text-slate-300">
                      <BookOpenIcon className="h-4 w-4 text-indigo-700 dark:text-indigo-200" />
                      Publications
                    </div>
                    <div className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">Annonces officielles</div>
                    <div className="mt-1 text-xs text-gray-500 dark:text-slate-300">Actualités, communiqués, infos.</div>
                  </div>

                  <div className="rounded-2xl border border-gray-200/70 dark:border-white/10 bg-white/70 dark:bg-white/5 p-4">
                    <div className="flex items-center gap-2 text-xs font-semibold text-gray-600 dark:text-slate-300">
                      <ShieldCheckIcon className="h-4 w-4 text-indigo-700 dark:text-indigo-200" />
                      Sécurité
                    </div>
                    <div className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">Accès contrôlé</div>
                    <div className="mt-1 text-xs text-gray-500 dark:text-slate-300">Connexion et droits selon les rôles.</div>
                  </div>

                  <div className="rounded-2xl border border-gray-200/70 dark:border-white/10 bg-white/70 dark:bg-white/5 p-4">
                    <div className="flex items-center gap-2 text-xs font-semibold text-gray-600 dark:text-slate-300">
                      <ChartBarIcon className="h-4 w-4 text-indigo-700 dark:text-indigo-200" />
                      Suivi
                    </div>
                    <div className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">Organisation</div>
                    <div className="mt-1 text-xs text-gray-500 dark:text-slate-300">Gestion interne fluide et claire.</div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <motion.div className="cpd-surface p-5" initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.25 }}>
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
                <HeartIcon className="h-5 w-5 text-indigo-700 dark:text-indigo-200" />
                Amour fraternel
              </div>
              <div className="mt-2 text-sm text-gray-700 dark:text-slate-200">Unité, soutien, et croissance dans la foi.</div>
            </motion.div>

            <motion.div className="cpd-surface p-5" initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.25, delay: 0.02 }}>
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
                <SparklesIcon className="h-5 w-5 text-indigo-700 dark:text-indigo-200" />
                Excellence
              </div>
              <div className="mt-2 text-sm text-gray-700 dark:text-slate-200">Une organisation claire, des informations accessibles.</div>
            </motion.div>

            <motion.div className="cpd-surface p-5" initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.25, delay: 0.04 }}>
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
                <MegaphoneIcon className="h-5 w-5 text-indigo-700 dark:text-indigo-200" />
                Communication
              </div>
              <div className="mt-2 text-sm text-gray-700 dark:text-slate-200">Publications, annonces et informations officielles.</div>
            </motion.div>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="rounded-3xl border border-gray-200/70 dark:border-white/10 bg-white/70 dark:bg-white/5 p-6 sm:p-8 overflow-hidden relative">
            <div className="absolute inset-0 opacity-60" style={{ backgroundImage: 'radial-gradient(circle at 20% 20%, rgba(99,102,241,0.18), transparent 45%), radial-gradient(circle at 80% 30%, rgba(168,85,247,0.16), transparent 42%)' }} />
            <div className="relative grid grid-cols-1 lg:grid-cols-3 gap-5 items-center">
              <div className="lg:col-span-2">
                <div className="text-sm font-semibold text-gray-900 dark:text-white">Prêt à nous rejoindre ?</div>
                <div className="mt-1 text-sm text-gray-700 dark:text-slate-200">
                  Accède aux publications et découvre la présentation. Si tu as un accès, connecte-toi pour gérer l’administration.
                </div>
              </div>
              <div className="flex flex-col sm:flex-row lg:flex-col gap-2 justify-end">
                <Link to="/publications" className="cpd-btn cpd-btn-outline px-4 py-2">
                  Voir les publications
                </Link>
                {isAuthenticated ? (
                  <Link to={adminPath} className="cpd-btn cpd-btn-solid px-4 py-2">
                    Aller à l’administration
                  </Link>
                ) : (
                  <Link to="/login" className="cpd-btn cpd-btn-solid px-4 py-2">
                    Se connecter
                  </Link>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-gray-200/70 dark:border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-xs text-gray-500 dark:text-slate-300">
              © {new Date().getFullYear()} Consolation et Paix Divine — Tous droits réservés.
            </div>
            <div className="text-xs text-gray-500 dark:text-slate-300 md:text-center inline-flex items-center gap-2 justify-start md:justify-center">
              <MapPinIcon className="h-4 w-4" />
              Adresse (à compléter)
            </div>
            <div className="text-xs text-gray-500 dark:text-slate-300 md:text-right inline-flex items-center gap-2 justify-start md:justify-end">
              <PhoneIcon className="h-4 w-4" />
              Contact (à compléter)
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
