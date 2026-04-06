import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRightIcon,
  RadioIcon,
  SignalIcon,
  UsersIcon,
  PlayCircleIcon,
  ClockIcon,
  TvIcon,
  PlayIcon,
  GlobeAltIcon,
} from '@heroicons/react/24/outline';

import PublicLayout from '../components/PublicLayout';

const PLATFORMS = [
  { name: 'YouTube', icon: PlayIcon, color: 'bg-red-600' },
  { name: 'Facebook', icon: GlobeAltIcon, color: 'bg-blue-600' },
];

const STREAMS = [
  { id: 1, title: 'Culte Dominical', description: 'Notre culte hebdomadaire.', schedule: 'Tous les dimanches à 9h00', status: 'live' },
  { id: 2, title: 'Étude Biblique', description: 'Étude de la Parole.', schedule: 'Mardis à 17h00', status: 'upcoming' },
  { id: 3, title: 'Prière', description: 'Moment de prière.', schedule: 'Jeudis à 17h00', status: 'upcoming' },
];

const PAST_STREAMS = [
  { id: 1, title: 'Culte: La Foi', date: '23 Mars 2025', duration: '1h45', views: '1.2k' },
  { id: 2, title: 'Étude: Actes 1', date: '18 Mars 2025', duration: '1h20', views: '890' },
  { id: 3, title: 'Journée des Jeunes', date: '16 Mars 2025', duration: '2h10', views: '2.1k' },
  { id: 4, title: 'Prière pour la Nation', date: '13 Mars 2025', duration: '1h30', views: '750' },
];

export default function PublicDiffusions() {
  return (
    <PublicLayout>
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-br from-red-50 via-white to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-red-950" />
          <motion.div className="absolute top-20 -right-40 h-[500px] w-[500px] rounded-full bg-red-200/40 blur-3xl" animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 20, repeat: Infinity }} />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-center max-w-3xl mx-auto">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-100 border border-red-200 mb-6">
              <RadioIcon className="h-4 w-4 text-red-600" />
              <span className="text-sm font-semibold text-red-800">Diffusions en Direct</span>
            </motion.div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-gray-900 dark:text-white leading-tight mb-6">
              Suivez nos <span className="bg-gradient-to-r from-red-600 to-indigo-600 bg-clip-text text-transparent">Cultes en Direct</span>
            </h1>
            <div className="flex flex-wrap gap-4 justify-center">
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-green-100 text-green-800 text-sm font-medium">
                <SignalIcon className="h-4 w-4 animate-pulse" />En direct
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-100 text-indigo-800 text-sm font-medium">
                <UsersIcon className="h-4 w-4" />245 spectateurs
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="bg-gray-900 rounded-3xl overflow-hidden shadow-2xl">
            <div className="aspect-video bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center relative">
              <div className="text-center">
                <PlayCircleIcon className="h-20 w-20 text-white mx-auto mb-4" />
                <p className="text-white text-lg font-medium">Culte Dominical - En Direct</p>
              </div>
              <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1 rounded-full bg-red-600 text-white text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-white animate-pulse" />LIVE
              </div>
            </div>
            <div className="p-4 bg-gray-800 flex items-center justify-between text-white/80 text-sm">
              <span className="flex items-center gap-1"><ClockIcon className="h-4 w-4" /> En cours depuis 45 min</span>
              <span className="flex items-center gap-1"><UsersIcon className="h-4 w-4" /> 245 spectateurs</span>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-20 bg-gray-50 dark:bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Prochaines Diffusions</h2>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {STREAMS.map((stream, index) => (
              <motion.div key={stream.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.1 }} className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-lg border border-gray-100">
                <div className="aspect-video bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center relative">
                  <TvIcon className="h-16 w-16 text-indigo-300" />
                  {stream.status === 'live' && <div className="absolute top-3 left-3 px-2 py-1 rounded bg-red-600 text-white text-xs font-bold">LIVE</div>}
                </div>
                <div className="p-5">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{stream.title}</h3>
                  <p className="text-gray-500 text-sm mb-3">{stream.description}</p>
                  <div className="flex items-center gap-2 text-indigo-600 text-sm mb-4">
                    <ClockIcon className="h-4 w-4" />{stream.schedule}
                  </div>
                  {stream.status === 'upcoming' && <button className="w-full py-2.5 bg-indigo-600 text-white font-medium rounded-xl">Rappelle-moi</button>}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Nos Plateformes</h2>
          </motion.div>
          <div className="flex justify-center gap-6">
            {PLATFORMS.map((platform) => (
              <motion.a key={platform.name} href="#" whileHover={{ scale: 1.05 }} className={`${platform.color} text-white rounded-2xl p-6 shadow-lg flex flex-col items-center gap-3 min-w-[160px]`}>
                <platform.icon className="h-10 w-10" />
                <span className="font-bold">{platform.name}</span>
              </motion.a>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-gray-50 dark:bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Cultes Passés</h2>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {PAST_STREAMS.map((stream, index) => (
              <motion.div key={stream.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.1 }} className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-lg cursor-pointer">
                <div className="aspect-video bg-gray-200 flex items-center justify-center relative">
                  <PlayIcon className="h-12 w-12 text-gray-400" />
                  <div className="absolute bottom-2 right-2 px-2 py-1 rounded bg-black/70 text-white text-xs">{stream.duration}</div>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1 line-clamp-2">{stream.title}</h3>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>{stream.date}</span>
                    <span className="flex items-center gap-1"><UsersIcon className="h-3 w-3" />{stream.views}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
