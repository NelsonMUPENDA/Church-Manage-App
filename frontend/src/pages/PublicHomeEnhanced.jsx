import React, { useMemo, useState, useEffect } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
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
  ClockIcon,
  UsersIcon,
  PlayIcon,
  XMarkIcon,
  Bars3Icon,
  HomeIcon,
  NewspaperIcon,
  CalendarIcon,
  UserGroupIcon,
  EnvelopeIcon,
  VideoCameraIcon,
  MusicalNoteIcon,
  HandRaisedIcon,
  GlobeAltIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';

import Logo from '../components/Logo';
import { useAuth } from '../contexts/AuthProvider';

// Données de l'église (à personnaliser)
const CHURCH_INFO = {
  name: 'Consolation et Paix Divine',
  tagline: 'Une église vivante, une famille unie',
  address: '123 Avenue de la Foi, Kinshasa, RDC',
  phone: '+243 99 999 9999',
  email: 'contact@consolationetpaix.org',
  serviceTimes: [
    { day: 'Dimanche', time: '9h00 - 12h00', name: 'Culte Dominical' },
    { day: 'Mardi', time: '17h00 - 19h00', name: 'Étude Biblique' },
    { day: 'Jeudi', time: '17h00 - 19h00', name: 'Prière et Intercession' },
    { day: 'Samedi', time: '14h00 - 16h00', name: 'Réunion Jeunes' },
  ],
  socials: {
    facebook: '#',
    youtube: '#',
    instagram: '#',
  }
};

// Données des ministères
const MINISTRIES = [
  {
    icon: UsersIcon,
    title: 'Accueil & Intégration',
    description: 'Intégration des nouveaux membres et visiteurs dans la communauté.',
  },
  {
    icon: HandRaisedIcon,
    title: 'Prière & Intercession',
    description: 'Groupe de prière pour les besoins de l\'église et de la communauté.',
  },
  {
    icon: MusicalNoteIcon,
    title: 'Louange & Adoration',
    description: 'Ministère de musique et adoration pour glorifier Dieu.',
  },
  {
    icon: UserGroupIcon,
    title: 'Jeunesse',
    description: 'Programmes pour les jeunes et adolescents (12-25 ans).',
  },
];

// Données des événements à venir
const UPCOMING_EVENTS = [
  {
    title: 'Conférence Annuelle',
    date: '15-17 Août 2025',
    description: '3 jours de louange, enseignement et renouvellement spirituel.',
    type: 'conference',
  },
  {
    title: 'Baptême Collectif',
    date: 'Dernier Dimanche du mois',
    description: 'Cérémonie de baptême pour les nouveaux croyants.',
    type: 'ceremony',
  },
  {
    title: 'Soirée de Louange',
    date: 'Vendredi 28 Juin',
    description: 'Une soirée spéciale dédiée à l\'adoration et la louange.',
    type: 'worship',
  },
];

// Navigation items
const NAV_ITEMS = [
  { to: '/', icon: HomeIcon, label: 'Accueil' },
  { to: '/eglise', icon: InformationCircleIcon, label: 'À Propos' },
  { to: '/publications', icon: NewspaperIcon, label: 'Publications' },
  { to: '/p/culte', icon: VideoCameraIcon, label: 'Diffusions' },
  { to: '/p/events', icon: CalendarIcon, label: 'Événements' },
  { to: '/login', icon: UserGroupIcon, label: 'Connexion', mobileOnly: true },
];

export default function PublicHome() {
  const { user, isAuthenticated } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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

  const fadeUp = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      {/* Navigation Header */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrollY > 50 
          ? 'bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-lg' 
          : 'bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 group">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
                <Logo className="h-8 w-8 text-white" />
              </div>
              <div className="hidden sm:block">
                <div className="text-sm font-bold text-gray-900 dark:text-white leading-tight">
                  Consolation et
                </div>
                <div className="text-sm font-bold text-indigo-600 dark:text-indigo-400 leading-tight">
                  Paix Divine
                </div>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1">
              {NAV_ITEMS.filter(item => !item.mobileOnly).map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
                      isActive
                        ? 'bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300'
                        : 'text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-indigo-600 dark:hover:text-indigo-300'
                    }`
                  }
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </NavLink>
              ))}
            </nav>

            {/* CTA Buttons */}
            <div className="flex items-center gap-2">
              {isAuthenticated && (
                <Link to={adminPath} className="hidden sm:flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-300 transition-colors">
                  Administration
                </Link>
              )}
              <Link 
                to={isAuthenticated ? adminPath : '/login'} 
                className="hidden sm:flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-all shadow-lg hover:shadow-xl"
              >
                {isAuthenticated ? 'Mon Espace' : 'Se Connecter'}
                <ArrowRightIcon className="h-4 w-4" />
              </Link>
              
              {/* Mobile Menu Button */}
              <button 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-xl text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-white/5"
              >
                {mobileMenuOpen ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-white/10"
            >
              <div className="px-4 py-4 space-y-1">
                {NAV_ITEMS.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300'
                          : 'text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-white/5'
                      }`
                    }
                  >
                    <item.icon className="h-5 w-5" />
                    {item.label}
                  </NavLink>
                ))}
                {isAuthenticated && (
                  <Link
                    to={adminPath}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10"
                  >
                    <ShieldCheckIcon className="h-5 w-5" />
                    Administration
                  </Link>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center pt-20 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950" />
          <motion.div
            className="absolute top-20 -right-40 h-[500px] w-[500px] rounded-full bg-indigo-200/40 blur-3xl dark:bg-indigo-600/15"
            animate={{ scale: [1, 1.1, 1], rotate: [0, 10, 0] }}
            transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute bottom-0 -left-40 h-[600px] w-[600px] rounded-full bg-purple-200/40 blur-3xl dark:bg-purple-600/15"
            animate={{ scale: [1.1, 1, 1.1], rotate: [0, -10, 0] }}
            transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }}
          />
          {/* Decorative Cross Pattern */}
          <div className="absolute top-40 right-20 text-indigo-100/50 dark:text-indigo-900/20">
            <svg width="120" height="160" viewBox="0 0 120 160" fill="currentColor">
              <rect x="45" y="0" width="30" height="160" rx="15" />
              <rect x="0" y="45" width="120" height="30" rx="15" />
            </svg>
          </div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left Content */}
            <motion.div
              initial="hidden"
              animate="show"
              variants={fadeUp}
              transition={{ duration: 0.6 }}
              className="text-center lg:text-left"
            >
              {/* Badge */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 border border-indigo-200 dark:border-indigo-700/30 mb-6"
              >
                <SparklesIcon className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                <span className="text-sm font-semibold text-indigo-800 dark:text-indigo-200">
                  Bienvenue dans notre famille
                </span>
              </motion.div>

              {/* Title */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-gray-900 dark:text-white leading-tight mb-6">
                <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Consolation
                </span>
                <br />
                et Paix Divine
              </h1>

              {/* Tagline */}
              <p className="text-xl text-gray-600 dark:text-slate-400 mb-8 max-w-lg mx-auto lg:mx-0">
                {CHURCH_INFO.tagline}. Rejoignez-nous pour vivre une expérience authentique de foi, d'amour et de communauté.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-8">
                <Link 
                  to="/p/events" 
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-2xl transition-all shadow-xl hover:shadow-2xl hover:-translate-y-0.5"
                >
                  <CalendarDaysIcon className="h-5 w-5" />
                  Nos Programmes
                  <ArrowRightIcon className="h-5 w-5" />
                </Link>
                <Link 
                  to="/eglise" 
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white dark:bg-slate-800 text-gray-900 dark:text-white font-semibold rounded-2xl border-2 border-gray-200 dark:border-white/10 hover:border-indigo-300 dark:hover:border-indigo-500/50 transition-all shadow-lg hover:shadow-xl"
                >
                  <InformationCircleIcon className="h-5 w-5" />
                  Découvrir l'Église
                </Link>
              </div>

              {/* Quick Info */}
              <div className="flex flex-wrap gap-4 justify-center lg:justify-start text-sm text-gray-500 dark:text-slate-400">
                <div className="flex items-center gap-2">
                  <MapPinIcon className="h-4 w-4 text-indigo-500" />
                  <span>Kinshasa, RDC</span>
                </div>
                <div className="flex items-center gap-2">
                  <ClockIcon className="h-4 w-4 text-indigo-500" />
                  <span>Culte Dimanche 9h00</span>
                </div>
              </div>
            </motion.div>

            {/* Right Visual - Abstract Church Community Illustration */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="relative"
            >
              <div className="relative rounded-3xl overflow-hidden shadow-2xl">
                {/* Placeholder for Church Image - Can be replaced with actual image */}
                <div className="aspect-[4/3] bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100 dark:from-indigo-900/30 dark:via-purple-900/30 dark:to-pink-900/30 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-32 h-32 mx-auto mb-4 rounded-full bg-white/50 dark:bg-white/10 flex items-center justify-center">
                      <HeartIcon className="h-16 w-16 text-indigo-500/50" />
                    </div>
                    <p className="text-gray-400 dark:text-slate-500 text-sm">Image de l'église</p>
                  </div>
                </div>
                
                {/* Overlay Stats */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-6">
                  <div className="flex gap-6 text-white">
                    <div>
                      <div className="text-2xl font-bold">500+</div>
                      <div className="text-xs opacity-80">Membres</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">15</div>
                      <div className="text-xs opacity-80">Années</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">12</div>
                      <div className="text-xs opacity-80">Ministères</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Elements */}
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
                className="absolute -top-4 -right-4 bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-4 border border-gray-100 dark:border-white/10"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <PlayIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="text-sm">
                    <div className="font-semibold text-gray-900 dark:text-white">En Direct</div>
                    <div className="text-gray-500 dark:text-slate-400">Culte en cours</div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <motion.div 
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-gray-400 dark:text-slate-500"
        >
          <span className="text-xs">Découvrir</span>
          <ArrowDownIcon className="h-5 w-5" />
        </motion.div>
      </section>

      {/* Service Times Section */}
      <section className="py-20 bg-gray-50 dark:bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <span className="text-indigo-600 dark:text-indigo-400 font-semibold text-sm uppercase tracking-wider">
              Nos Horaires
            </span>
            <h2 className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
              Venez nous rejoindre
            </h2>
            <p className="mt-4 text-gray-600 dark:text-slate-400 max-w-2xl mx-auto">
              Nous nous réunissons tout au long de la semaine pour célébrer, étudier et prier ensemble.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {CHURCH_INFO.serviceTimes.map((service, index) => (
              <motion.div
                key={service.day}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow border border-gray-100 dark:border-white/5"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 flex items-center justify-center mb-4">
                  <ClockIcon className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                  {service.day}
                </h3>
                <p className="text-indigo-600 dark:text-indigo-400 font-semibold text-sm mb-2">
                  {service.time}
                </p>
                <p className="text-gray-500 dark:text-slate-400 text-sm">
                  {service.name}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Ministries Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <span className="text-indigo-600 dark:text-indigo-400 font-semibold text-sm uppercase tracking-wider">
              Nos Ministères
            </span>
            <h2 className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
              Engagez-vous dans un ministère
            </h2>
            <p className="mt-4 text-gray-600 dark:text-slate-400 max-w-2xl mx-auto">
              Il y a une place pour chacun dans le corps de Christ. Découvrez comment vous pouvez servir.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {MINISTRIES.map((ministry, index) => (
              <motion.div
                key={ministry.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="group bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all border border-gray-100 dark:border-white/5 hover:-translate-y-1"
              >
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <ministry.icon className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                  {ministry.title}
                </h3>
                <p className="text-gray-500 dark:text-slate-400 text-sm leading-relaxed">
                  {ministry.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Upcoming Events Section */}
      <section className="py-20 bg-gradient-to-br from-indigo-600 to-purple-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <span className="text-indigo-200 font-semibold text-sm uppercase tracking-wider">
              À Venir
            </span>
            <h2 className="mt-2 text-3xl font-bold">
              Prochains événements
            </h2>
            <p className="mt-4 text-indigo-100 max-w-2xl mx-auto">
              Ne manquez pas nos moments importants de communion et de célébration.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {UPCOMING_EVENTS.map((event, index) => (
              <motion.div
                key={event.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/20 transition-colors"
              >
                <div className="flex items-center gap-3 mb-4">
                  <CalendarIcon className="h-5 w-5 text-indigo-300" />
                  <span className="text-indigo-200 text-sm font-medium">{event.date}</span>
                </div>
                <h3 className="text-xl font-bold mb-2">{event.title}</h3>
                <p className="text-indigo-100 text-sm mb-4">{event.description}</p>
                <Link 
                  to="/p/events" 
                  className="inline-flex items-center gap-2 text-sm font-semibold text-white hover:text-indigo-200 transition-colors"
                >
                  En savoir plus
                  <ChevronRightIcon className="h-4 w-4" />
                </Link>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link 
              to="/p/events" 
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-indigo-700 font-semibold rounded-2xl hover:bg-indigo-50 transition-colors shadow-lg"
            >
              Voir tous les événements
              <ArrowRightIcon className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl p-8 md:p-12 text-white text-center shadow-2xl"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Prêt à nous rejoindre ?
            </h2>
            <p className="text-indigo-100 text-lg mb-8 max-w-2xl mx-auto">
              Que vous soyez nouveau dans la foi ou à la recherche d'une communauté chrétienne, 
              vous êtes les bienvenus chez Consolation et Paix Divine.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                to="/p/events" 
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-indigo-600 font-semibold rounded-2xl hover:bg-indigo-50 transition-colors shadow-lg"
              >
                <CalendarDaysIcon className="h-5 w-5" />
                Planifier une visite
              </Link>
              <Link 
                to="/publications" 
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/20 text-white font-semibold rounded-2xl hover:bg-white/30 transition-colors border border-white/30"
              >
                <BookOpenIcon className="h-5 w-5" />
                Lire nos publications
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Contact & Info Footer Section */}
      <footer className="bg-gray-900 dark:bg-slate-950 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Church Info */}
            <div className="lg:col-span-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                  <Logo className="h-8 w-8 text-white" />
                </div>
                <div>
                  <div className="font-bold leading-tight">Consolation</div>
                  <div className="font-bold leading-tight text-indigo-400">et Paix Divine</div>
                </div>
              </div>
              <p className="text-gray-400 text-sm mb-4">
                Une communauté chrétienne dédiée à l'édification spirituelle, 
                à l'amour fraternel et au service.
              </p>
              <div className="flex gap-3">
                <a 
                  href={CHURCH_INFO.socials.facebook}
                  className="w-10 h-10 rounded-full bg-white/10 hover:bg-indigo-600 flex items-center justify-center transition-colors"
                  aria-label="Facebook"
                >
                  <GlobeAltIcon className="h-5 w-5" />
                </a>
                <a 
                  href={CHURCH_INFO.socials.youtube}
                  className="w-10 h-10 rounded-full bg-white/10 hover:bg-red-600 flex items-center justify-center transition-colors"
                  aria-label="YouTube"
                >
                  <PlayIcon className="h-5 w-5" />
                </a>
                <a 
                  href={CHURCH_INFO.socials.instagram}
                  className="w-10 h-10 rounded-full bg-white/10 hover:bg-pink-600 flex items-center justify-center transition-colors"
                  aria-label="Instagram"
                >
                  <HeartIcon className="h-5 w-5" />
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-semibold text-lg mb-4">Liens Rapides</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li>
                  <Link to="/eglise" className="hover:text-white transition-colors flex items-center gap-2">
                    <ChevronRightIcon className="h-4 w-4" />
                    À Propos de l'Église
                  </Link>
                </li>
                <li>
                  <Link to="/publications" className="hover:text-white transition-colors flex items-center gap-2">
                    <ChevronRightIcon className="h-4 w-4" />
                    Publications
                  </Link>
                </li>
                <li>
                  <Link to="/p/events" className="hover:text-white transition-colors flex items-center gap-2">
                    <ChevronRightIcon className="h-4 w-4" />
                    Événements
                  </Link>
                </li>
                <li>
                  <Link to="/login" className="hover:text-white transition-colors flex items-center gap-2">
                    <ChevronRightIcon className="h-4 w-4" />
                    Espace Membres
                  </Link>
                </li>
              </ul>
            </div>

            {/* Contact Info */}
            <div>
              <h4 className="font-semibold text-lg mb-4">Contact</h4>
              <ul className="space-y-3 text-gray-400 text-sm">
                <li className="flex items-start gap-3">
                  <MapPinIcon className="h-5 w-5 text-indigo-400 shrink-0 mt-0.5" />
                  <span>{CHURCH_INFO.address}</span>
                </li>
                <li className="flex items-center gap-3">
                  <PhoneIcon className="h-5 w-5 text-indigo-400 shrink-0" />
                  <span>{CHURCH_INFO.phone}</span>
                </li>
                <li className="flex items-center gap-3">
                  <EnvelopeIcon className="h-5 w-5 text-indigo-400 shrink-0" />
                  <span>{CHURCH_INFO.email}</span>
                </li>
              </ul>
            </div>

            {/* Service Times */}
            <div>
              <h4 className="font-semibold text-lg mb-4">Horaires du Culte</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                {CHURCH_INFO.serviceTimes.slice(0, 3).map((service) => (
                  <li key={service.day} className="flex justify-between">
                    <span>{service.day}</span>
                    <span className="text-white">{service.time}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="mt-12 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-400 text-sm">
              © {new Date().getFullYear()} Consolation et Paix Divine. Tous droits réservés.
            </p>
            <div className="flex gap-6 text-gray-400 text-sm">
              <Link to="/" className="hover:text-white transition-colors">Confidentialité</Link>
              <Link to="/" className="hover:text-white transition-colors">Conditions d'utilisation</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
