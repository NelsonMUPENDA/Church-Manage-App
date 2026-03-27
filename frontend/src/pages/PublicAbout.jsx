import React, { useMemo, useState, useEffect } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRightIcon,
  HeartIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  ClockIcon,
  UsersIcon,
  PlayIcon,
  XMarkIcon,
  Bars3Icon,
  HomeIcon,
  NewspaperIcon,
  CalendarIcon,
  UserGroupIcon,
  InformationCircleIcon,
  VideoCameraIcon,
  SparklesIcon,
  BookOpenIcon,
  GlobeAltIcon,
  ChevronRightIcon,
  EyeIcon,
  HandRaisedIcon,
  LightBulbIcon,
  RocketLaunchIcon,
} from '@heroicons/react/24/outline';

import Logo from '../components/Logo';
import { useAuth } from '../contexts/AuthProvider';

const CHURCH_INFO = {
  name: 'Consolation et Paix Divine',
  founded: '2010',
  address: '123 Avenue de la Foi, Kinshasa, RDC',
  phone: '+243 99 999 9999',
  email: 'contact@consolationetpaix.org',
  serviceTimes: [
    { day: 'Dimanche', time: '9h00 - 12h00', name: 'Culte Dominical' },
    { day: 'Mardi', time: '17h00 - 19h00', name: 'Étude Biblique' },
    { day: 'Jeudi', time: '17h00 - 19h00', name: 'Prière et Intercession' },
  ],
  socials: {
    facebook: '#',
    youtube: '#',
    instagram: '#',
  }
};

const VALUES = [
  {
    icon: HeartIcon,
    title: 'Amour',
    description: 'L\'amour est le fondement de notre communauté. Nous aimons Dieu et nous aimons les uns les autres.',
  },
  {
    icon: EyeIcon,
    title: 'Foi',
    description: 'Nous croyons en un Dieu puissant qui transforme les vies et accomplit des miracles.',
  },
  {
    icon: HandRaisedIcon,
    title: 'Service',
    description: 'Nous sommes appelés à servir notre communauté et à être les mains et les pieds de Christ.',
  },
  {
    icon: LightBulbIcon,
    title: 'Excellence',
    description: 'Nous nous engageons à faire de notre mieux dans tout ce que nous entreprenons pour la gloire de Dieu.',
  },
];

const LEADERSHIP = [
  {
    name: 'Pasteur Principal',
    role: 'Fondateur & Président',
    description: 'Dirige l\'église depuis sa fondation avec passion et dévouement.',
  },
  {
    name: 'Pasteur Adjoint',
    role: 'Co-Pasteur',
    description: 'Responsable de l\'enseignement et du développement spirituel.',
  },
  {
    name: 'Diacre Principal',
    role: 'Direction Administrative',
    description: 'Supervise les opérations et la gestion de l\'église.',
  },
  {
    name: 'Responsable Jeunesse',
    role: 'Ministère Jeunes',
    description: 'Encadre et accompagne les jeunes dans leur foi.',
  },
];

const NAV_ITEMS = [
  { to: '/', icon: HomeIcon, label: 'Accueil' },
  { to: '/about', icon: InformationCircleIcon, label: 'À Propos' },
  { to: '/announcements', icon: NewspaperIcon, label: 'Publications' },
  { to: '/events', icon: VideoCameraIcon, label: 'Diffusions' },
  { to: '/events', icon: CalendarIcon, label: 'Événements' },
  { to: '/login', icon: UserGroupIcon, label: 'Connexion', mobileOnly: true },
];

export default function PublicAbout() {
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
            <Link to="/" className="flex items-center gap-3 group">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
                <Logo className="h-8 w-8 text-white" />
              </div>
              <div className="hidden sm:block">
                <div className="text-sm font-bold text-gray-900 dark:text-white leading-tight">Consolation et</div>
                <div className="text-sm font-bold text-indigo-600 dark:text-indigo-400 leading-tight">Paix Divine</div>
              </div>
            </Link>

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
              
              <button 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-xl text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-white/5"
              >
                {mobileMenuOpen ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

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
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
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
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            animate="show"
            variants={fadeUp}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto"
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 border border-indigo-200 dark:border-indigo-700/30 mb-6"
            >
              <BookOpenIcon className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              <span className="text-sm font-semibold text-indigo-800 dark:text-indigo-200">Notre Histoire</span>
            </motion.div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-gray-900 dark:text-white leading-tight mb-6">
              À Propos de <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Notre Église</span>
            </h1>

            <p className="text-xl text-gray-600 dark:text-slate-400 mb-8">
              Découvrez qui nous sommes, ce que nous croyons et notre vision pour la communauté.
            </p>
          </motion.div>
        </div>
      </section>

      {/* History Section */}
      <section className="py-20 bg-gray-50 dark:bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <span className="text-indigo-600 dark:text-indigo-400 font-semibold text-sm uppercase tracking-wider">Notre Histoire</span>
              <h2 className="mt-2 text-3xl font-bold text-gray-900 dark:text-white mb-4">
                Une communauté de foi depuis {CHURCH_INFO.founded}
              </h2>
              <p className="text-gray-600 dark:text-slate-400 mb-4 leading-relaxed">
                Consolation et Paix Divine a été fondée avec une vision claire : créer un espace où chacun peut 
                expérimenter l'amour de Dieu, grandir spirituellement et servir la communauté. 
                Au fil des années, nous sommes devenus une famille unie, dédiée à l'édification spirituelle 
                et à l'impact social.
              </p>
              <p className="text-gray-600 dark:text-slate-400 leading-relaxed">
                Notre église accueille aujourd'hui plus de 500 membres actifs, avec des programmes 
                diversifiés pour tous les âges et des ministères touchant chaque aspect de la vie communautaire.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="rounded-3xl overflow-hidden shadow-2xl">
                <div className="aspect-[4/3] bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100 dark:from-indigo-900/30 dark:via-purple-900/30 dark:to-pink-900/30 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-32 h-32 mx-auto mb-4 rounded-full bg-white/50 dark:bg-white/10 flex items-center justify-center">
                      <SparklesIcon className="h-16 w-16 text-indigo-500/50" />
                    </div>
                    <p className="text-gray-400 dark:text-slate-500 text-sm">Image de l'église</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <span className="text-indigo-600 dark:text-indigo-400 font-semibold text-sm uppercase tracking-wider">Nos Valeurs</span>
            <h2 className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">Ce qui nous définit</h2>
            <p className="mt-4 text-gray-600 dark:text-slate-400 max-w-2xl mx-auto">
              Ces principes fondamentaux guident chaque aspect de notre vie communautaire.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {VALUES.map((value, index) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="group bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all border border-gray-100 dark:border-white/5 hover:-translate-y-1 text-center"
              >
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform">
                  <value.icon className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{value.title}</h3>
                <p className="text-gray-500 dark:text-slate-400 text-sm leading-relaxed">{value.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-20 bg-gradient-to-br from-indigo-600 to-purple-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20"
            >
              <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center mb-4">
                <RocketLaunchIcon className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Notre Mission</h3>
              <p className="text-indigo-100 leading-relaxed">
                Évangéliser notre communauté, édifier les croyants à travers l'enseignement de la Parole, 
                et servir les nécessiteux. Nous cherchons à être le sel et la lumière dans notre société, 
                en partageant l'amour de Christ par nos actions et nos paroles.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20"
            >
              <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center mb-4">
                <LightBulbIcon className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Notre Vision</h3>
              <p className="text-indigo-100 leading-relaxed">
                Devenir une église modèle qui impacte positivement notre nation. Nous rêvons de voir 
                des vies transformées, des familles restaurées et des leaders spirituels émerger 
                pour bâtir une génération qui craint Dieu.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Leadership Section */}
      <section className="py-20 bg-gray-50 dark:bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <span className="text-indigo-600 dark:text-indigo-400 font-semibold text-sm uppercase tracking-wider">Notre Équipe</span>
            <h2 className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">Le Leadership</h2>
            <p className="mt-4 text-gray-600 dark:text-slate-400 max-w-2xl mx-auto">
              Des hommes et des femmes dévoués qui servent avec passion et intégrité.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {LEADERSHIP.map((leader, index) => (
              <motion.div
                key={leader.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg text-center border border-gray-100 dark:border-white/5"
              >
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 flex items-center justify-center mx-auto mb-4">
                  <UsersIcon className="h-12 w-12 text-indigo-500" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{leader.name}</h3>
                <p className="text-indigo-600 dark:text-indigo-400 text-sm font-medium mb-2">{leader.role}</p>
                <p className="text-gray-500 dark:text-slate-400 text-sm">{leader.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Service Times & Contact */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Horaires des Cultes</h2>
              <div className="space-y-4">
                {CHURCH_INFO.serviceTimes.map((service, index) => (
                  <div key={service.day} className="flex items-center gap-4 bg-white dark:bg-slate-800 rounded-xl p-4 shadow border border-gray-100 dark:border-white/5">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 flex items-center justify-center">
                      <ClockIcon className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">{service.day}</h3>
                      <p className="text-indigo-600 dark:text-indigo-400 text-sm">{service.time}</p>
                      <p className="text-gray-500 dark:text-slate-400 text-sm">{service.name}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Nous Contacter</h2>
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-white/5">
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center shrink-0">
                      <MapPinIcon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">Adresse</h4>
                      <p className="text-gray-500 dark:text-slate-400 text-sm">{CHURCH_INFO.address}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center shrink-0">
                      <PhoneIcon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">Téléphone</h4>
                      <p className="text-gray-500 dark:text-slate-400 text-sm">{CHURCH_INFO.phone}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center shrink-0">
                      <EnvelopeIcon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">Email</h4>
                      <p className="text-gray-500 dark:text-slate-400 text-sm">{CHURCH_INFO.email}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-100 dark:border-white/10">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Suivez-nous</h4>
                  <div className="flex gap-3">
                    <a href={CHURCH_INFO.socials.facebook} className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 hover:bg-indigo-600 dark:hover:bg-indigo-600 flex items-center justify-center transition-colors group">
                      <GlobeAltIcon className="h-5 w-5 text-indigo-600 dark:text-indigo-400 group-hover:text-white" />
                    </a>
                    <a href={CHURCH_INFO.socials.youtube} className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 hover:bg-red-600 dark:hover:bg-red-600 flex items-center justify-center transition-colors group">
                      <PlayIcon className="h-5 w-5 text-red-600 dark:text-red-400 group-hover:text-white" />
                    </a>
                    <a href={CHURCH_INFO.socials.instagram} className="w-10 h-10 rounded-full bg-pink-100 dark:bg-pink-900/30 hover:bg-pink-600 dark:hover:bg-pink-600 flex items-center justify-center transition-colors group">
                      <HeartIcon className="h-5 w-5 text-pink-600 dark:text-pink-400 group-hover:text-white" />
                    </a>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-indigo-600 to-purple-600">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Rejoignez notre famille
            </h2>
            <p className="text-indigo-100 text-lg mb-8 max-w-2xl mx-auto">
              Nous serions ravis de vous accueillir et de vous aider à grandir dans votre foi.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/events" className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-indigo-600 font-semibold rounded-2xl hover:bg-indigo-50 transition-colors shadow-lg">
                <CalendarIcon className="h-5 w-5" />
                Planifier une visite
              </Link>
              <Link to="/" className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/20 text-white font-semibold rounded-2xl hover:bg-white/30 transition-colors border border-white/30">
                <HomeIcon className="h-5 w-5" />
                Retour à l'accueil
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 dark:bg-slate-950 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                  <Logo className="h-8 w-8 text-white" />
                </div>
                <div><div className="font-bold leading-tight">Consolation</div><div className="font-bold leading-tight text-indigo-400">et Paix Divine</div></div>
              </div>
              <p className="text-gray-400 text-sm mb-4">Une communauté chrétienne dédiée à l'édification spirituelle, à l'amour fraternel et au service.</p>
            </div>

            <div>
              <h4 className="font-semibold text-lg mb-4">Liens Rapides</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><Link to="/" className="hover:text-white transition-colors flex items-center gap-2"><ChevronRightIcon className="h-4 w-4" />Accueil</Link></li>
                <li><Link to="/about" className="hover:text-white transition-colors flex items-center gap-2"><ChevronRightIcon className="h-4 w-4" />À Propos</Link></li>
                <li><Link to="/announcements" className="hover:text-white transition-colors flex items-center gap-2"><ChevronRightIcon className="h-4 w-4" />Publications</Link></li>
                <li><Link to="/events" className="hover:text-white transition-colors flex items-center gap-2"><ChevronRightIcon className="h-4 w-4" />Événements</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-lg mb-4">Contact</h4>
              <ul className="space-y-3 text-gray-400 text-sm">
                <li className="flex items-start gap-3"><MapPinIcon className="h-5 w-5 text-indigo-400 shrink-0 mt-0.5" /><span>{CHURCH_INFO.address}</span></li>
                <li className="flex items-center gap-3"><PhoneIcon className="h-5 w-5 text-indigo-400 shrink-0" /><span>{CHURCH_INFO.phone}</span></li>
                <li className="flex items-center gap-3"><EnvelopeIcon className="h-5 w-5 text-indigo-400 shrink-0" /><span>{CHURCH_INFO.email}</span></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-lg mb-4">Horaires du Culte</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                {CHURCH_INFO.serviceTimes.map((service) => (
                  <li key={service.day} className="flex justify-between"><span>{service.day}</span><span className="text-white">{service.time}</span></li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-400 text-sm">© {new Date().getFullYear()} Consolation et Paix Divine. Tous droits réservés.</p>
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
