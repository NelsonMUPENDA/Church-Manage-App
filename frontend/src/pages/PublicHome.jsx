import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRightIcon,
  ArrowDownIcon,
  InformationCircleIcon,
  BookOpenIcon,
  SparklesIcon,
  CalendarDaysIcon,
  HeartIcon,
  MapPinIcon,
  ClockIcon,
  UsersIcon,
  PlayIcon,
  MusicalNoteIcon,
  HandRaisedIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';

import PublicLayout from '../components/PublicLayout';

const CHURCH_INFO = {
  tagline: 'Une église vivante, une famille unie',
};

const MINISTRIES = [
  { icon: UsersIcon, title: 'Accueil & Intégration', description: 'Intégration des nouveaux membres.' },
  { icon: HandRaisedIcon, title: 'Prière & Intercession', description: 'Groupe de prière pour les besoins.' },
  { icon: MusicalNoteIcon, title: 'Louange & Adoration', description: 'Ministère de musique et adoration.' },
  { icon: UserGroupIcon, title: 'Jeunesse', description: 'Programmes pour les jeunes (12-25 ans).' },
];

const UPCOMING_EVENTS = [
  { title: 'Conférence Annuelle', date: '15-17 Août 2025', description: '3 jours de louange.' },
  { title: 'Baptême Collectif', date: 'Dernier Dimanche', description: 'Cérémonie de baptême.' },
  { title: 'Soirée de Louange', date: 'Vendredi 28 Juin', description: 'Soirée d\'adoration.' },
];

const SERVICE_TIMES = [
  { day: 'Dimanche', time: '9h00 - 12h00', name: 'Culte' },
  { day: 'Mardi', time: '17h00 - 19h00', name: 'Étude' },
  { day: 'Jeudi', time: '17h00 - 19h00', name: 'Prière' },
  { day: 'Samedi', time: '14h00 - 16h00', name: 'Jeunes' },
];

export default function PublicHome() {
  const fadeUp = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

  return (
    <PublicLayout>
      <section className="relative min-h-screen flex items-center pt-20 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950" />
          <motion.div className="absolute top-20 -right-40 h-[500px] w-[500px] rounded-full bg-indigo-200/40 blur-3xl" animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 20, repeat: Infinity }} />
          <motion.div className="absolute bottom-0 -left-40 h-[600px] w-[600px] rounded-full bg-purple-200/40 blur-3xl" animate={{ scale: [1.1, 1, 1.1] }} transition={{ duration: 25, repeat: Infinity }} />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <motion.div initial="hidden" animate="show" variants={fadeUp} transition={{ duration: 0.6 }} className="text-center lg:text-left">
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 border border-indigo-200 mb-6">
                <SparklesIcon className="h-4 w-4 text-indigo-600" />
                <span className="text-sm font-semibold text-indigo-800">Bienvenue</span>
              </motion.div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-gray-900 dark:text-white leading-tight mb-6">
                <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Consolation</span><br />et Paix Divine
              </h1>
              <p className="text-xl text-gray-600 dark:text-slate-400 mb-8 max-w-lg mx-auto lg:mx-0">{CHURCH_INFO.tagline}</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link to="/evenements" className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-2xl shadow-xl">
                  <CalendarDaysIcon className="h-5 w-5" />Nos Programmes<ArrowRightIcon className="h-5 w-5" />
                </Link>
                <Link to="/about" className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white dark:bg-slate-800 text-gray-900 dark:text-white font-semibold rounded-2xl border-2 border-gray-200 shadow-lg">
                  <InformationCircleIcon className="h-5 w-5" />Découvrir
                </Link>
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, delay: 0.3 }} className="relative">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl">
                <div className="aspect-[4/3] bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100 flex items-center justify-center">
                  <HeartIcon className="h-24 w-24 text-indigo-500/50" />
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 2, repeat: Infinity }} className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-gray-400">
          <span className="text-xs">Découvrir</span>
          <ArrowDownIcon className="h-5 w-5" />
        </motion.div>
      </section>

      <section className="py-20 bg-gray-50 dark:bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <span className="text-indigo-600 font-semibold text-sm uppercase">Nos Horaires</span>
            <h2 className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">Venez nous rejoindre</h2>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {SERVICE_TIMES.map((service, index) => (
              <motion.div key={service.day} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.1 }} className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-gray-100">
                <ClockIcon className="h-6 w-6 text-indigo-600 mb-4" />
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">{service.day}</h3>
                <p className="text-indigo-600 font-semibold text-sm">{service.time}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <span className="text-indigo-600 font-semibold text-sm uppercase">Nos Ministères</span>
            <h2 className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">Engagez-vous</h2>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {MINISTRIES.map((ministry, index) => (
              <motion.div key={ministry.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.1 }} className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-gray-100">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mb-4">
                  <ministry.icon className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{ministry.title}</h3>
                <p className="text-gray-500 text-sm">{ministry.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-gradient-to-br from-indigo-600 to-purple-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <h2 className="text-3xl font-bold">Prochains événements</h2>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {UPCOMING_EVENTS.map((event, index) => (
              <motion.div key={event.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.1 }} className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                <ClockIcon className="h-5 w-5 text-indigo-300 mb-4" />
                <h3 className="text-xl font-bold mb-2">{event.title}</h3>
                <p className="text-indigo-100 text-sm">{event.date}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl p-8 md:p-12 text-white text-center shadow-2xl">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Prêt à nous rejoindre ?</h2>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/evenements" className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-indigo-600 font-semibold rounded-2xl shadow-lg">
                <CalendarDaysIcon className="h-5 w-5" />Planifier une visite
              </Link>
              <Link to="/publications" className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/20 text-white font-semibold rounded-2xl border border-white/30">
                <BookOpenIcon className="h-5 w-5" />Nos publications
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </PublicLayout>
  );
}
