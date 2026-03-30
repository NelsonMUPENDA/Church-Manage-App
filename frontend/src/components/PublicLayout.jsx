import React, { useState, useEffect } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRightIcon,
  HeartIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  ClockIcon,
  PlayIcon,
  XMarkIcon,
  Bars3Icon,
  HomeIcon,
  NewspaperIcon,
  CalendarIcon,
  UserGroupIcon,
  InformationCircleIcon,
  VideoCameraIcon,
  GlobeAltIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';

import Logo from '../components/Logo';
import { useAuth } from '../contexts/AuthProvider';

const CHURCH_INFO = {
  name: 'Consolation et Paix Divine',
  address: '123 Avenue de la Foi, Kinshasa, RDC',
  phone: '+243 99 999 9999',
  email: 'contact@consolationetpaix.org',
  socials: {
    facebook: '#',
    youtube: '#',
    instagram: '#',
  }
};

const SERVICE_TIMES = [
  { day: 'Dimanche', time: '9h00 - 12h00', name: 'Culte Dominical' },
  { day: 'Mardi', time: '17h00 - 19h00', name: 'Étude Biblique' },
  { day: 'Jeudi', time: '17h00 - 19h00', name: 'Prière et Intercession' },
  { day: 'Samedi', time: '14h00 - 16h00', name: 'Réunion Jeunes' },
];

export const NAV_ITEMS = [
  { to: '/', icon: HomeIcon, label: 'Accueil' },
  { to: '/about', icon: InformationCircleIcon, label: 'À Propos' },
  { to: '/publications', icon: NewspaperIcon, label: 'Publications' },
  { to: '/diffusions', icon: VideoCameraIcon, label: 'Diffusions' },
  { to: '/evenements', icon: CalendarIcon, label: 'Événements' },
  { to: '/contact', icon: EnvelopeIcon, label: 'Contact' },
  { to: '/login', icon: UserGroupIcon, label: 'Connexion', mobileOnly: true },
];

export function PublicHeader() {
  const { user, isAuthenticated } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const getAdminPath = () => {
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
  };

  return (
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
              <Link to={getAdminPath()} className="hidden sm:flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-300 transition-colors">
                Administration
              </Link>
            )}
            <Link 
              to={isAuthenticated ? getAdminPath() : '/login'} 
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
  );
}

export function PublicFooter() {
  return (
    <footer className="bg-gray-900 dark:bg-slate-950 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
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
              Une communauté chrétienne dédiée à l'édification spirituelle, à l'amour fraternel et au service.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-lg mb-4">Liens Rapides</h4>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li><Link to="/" className="hover:text-white transition-colors flex items-center gap-2"><ChevronRightIcon className="h-4 w-4" />Accueil</Link></li>
              <li><Link to="/about" className="hover:text-white transition-colors flex items-center gap-2"><ChevronRightIcon className="h-4 w-4" />À Propos</Link></li>
              <li><Link to="/publications" className="hover:text-white transition-colors flex items-center gap-2"><ChevronRightIcon className="h-4 w-4" />Publications</Link></li>
              <li><Link to="/diffusions" className="hover:text-white transition-colors flex items-center gap-2"><ChevronRightIcon className="h-4 w-4" />Diffusions</Link></li>
              <li><Link to="/evenements" className="hover:text-white transition-colors flex items-center gap-2"><ChevronRightIcon className="h-4 w-4" />Événements</Link></li>
              <li><Link to="/contact" className="hover:text-white transition-colors flex items-center gap-2"><ChevronRightIcon className="h-4 w-4" />Contact</Link></li>
            </ul>
          </div>

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

          <div>
            <h4 className="font-semibold text-lg mb-4">Horaires du Culte</h4>
            <ul className="space-y-2 text-gray-400 text-sm">
              {SERVICE_TIMES.map((service) => (
                <li key={service.day} className="flex justify-between">
                  <span>{service.day}</span>
                  <span className="text-white">{service.time}</span>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex gap-3">
              <a href={CHURCH_INFO.socials.facebook} className="w-10 h-10 rounded-full bg-white/10 hover:bg-indigo-600 flex items-center justify-center transition-colors" aria-label="Facebook">
                <GlobeAltIcon className="h-5 w-5" />
              </a>
              <a href={CHURCH_INFO.socials.youtube} className="w-10 h-10 rounded-full bg-white/10 hover:bg-red-600 flex items-center justify-center transition-colors" aria-label="YouTube">
                <PlayIcon className="h-5 w-5" />
              </a>
              <a href={CHURCH_INFO.socials.instagram} className="w-10 h-10 rounded-full bg-white/10 hover:bg-pink-600 flex items-center justify-center transition-colors" aria-label="Instagram">
                <HeartIcon className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4 text-sm">
            <p className="text-gray-400">© {new Date().getFullYear()} Consolation et Paix Divine. Tous droits réservés.</p>
            <p className="text-gray-500">Propulsé et développé par <a href="https://www.mupenda.cd" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 transition-colors font-medium">Mupenda Company</a></p>
          </div>
          <div className="flex gap-6 text-gray-400 text-sm">
            <Link to="/" className="hover:text-white transition-colors">Confidentialité</Link>
            <Link to="/" className="hover:text-white transition-colors">Conditions d'utilisation</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default function PublicLayout({ children }) {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <PublicHeader />
      <main>{children}</main>
      <PublicFooter />
    </div>
  );
}
