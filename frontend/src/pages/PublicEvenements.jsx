import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRightIcon,
  MapPinIcon,
  CalendarIcon,
  ClockIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';

import PublicLayout from '../components/PublicLayout';

const CATEGORIES = ['Tous', 'Conférence', 'Cérémonie', 'Célébration', 'Jeunesse', 'Formation'];

const FEATURED_EVENT = {
  title: 'Conférence Annuelle 2025',
  date: '15-17 Août 2025',
  time: '9h00 - 17h00',
  location: 'Centre de Convention, Kinshasa',
  description: '3 jours intenses de louange, enseignement et communion.',
  category: 'Conférence',
};

const EVENTS = [
  { id: 1, title: 'Culte de Pâques', date: '20 Avril 2025', time: '9h00 - 12h00', location: 'Église Centrale', category: 'Célébration' },
  { id: 2, title: 'Retraite des Jeunes', date: '25-27 Avril 2025', time: 'Tout le week-end', location: 'Centre de Retraite', category: 'Jeunesse' },
  { id: 3, title: 'Formation Leadership', date: '5 Mai 2025', time: '14h00 - 17h00', location: 'Salle de Formation', category: 'Formation' },
  { id: 4, title: 'Croisade', date: '12 Mai 2025', time: '17h00 - 20h00', location: 'Stade Municipal', category: 'Évangélisation' },
  { id: 5, title: 'Mariage Collectif', date: '1er Juin 2025', time: '10h00 - 13h00', location: 'Église Centrale', category: 'Cérémonie' },
  { id: 6, title: 'Journée d\'Adoration', date: '15 Juin 2025', time: '16h00 - 20h00', location: 'Église Centrale', category: 'Célébration' },
];

export default function PublicEvenements() {
  const [selectedCategory, setSelectedCategory] = useState('Tous');
  const filteredEvents = EVENTS.filter(event => selectedCategory === 'Tous' || event.category === selectedCategory);

  return (
    <PublicLayout>
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-50 via-white to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-amber-950" />
          <motion.div className="absolute top-20 -right-40 h-[500px] w-[500px] rounded-full bg-amber-200/40 blur-3xl" animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 20, repeat: Infinity }} />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-center max-w-3xl mx-auto">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-amber-100 to-indigo-100 border border-amber-200 mb-6">
              <SparklesIcon className="h-4 w-4 text-amber-600" />
              <span className="text-sm font-semibold text-amber-800">Événements à Venir</span>
            </motion.div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-gray-900 dark:text-white leading-tight mb-6">
              Nos <span className="bg-gradient-to-r from-amber-600 to-indigo-600 bg-clip-text text-transparent">Événements</span>
            </h1>
          </motion.div>
        </div>
      </section>

      <section className="py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="bg-gradient-to-r from-amber-600 to-indigo-600 rounded-3xl overflow-hidden shadow-2xl">
            <div className="grid grid-cols-1 lg:grid-cols-2">
              <div className="p-8 lg:p-12">
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-medium mb-4">
                  <SparklesIcon className="h-3 w-3" />{FEATURED_EVENT.category}
                </span>
                <h2 className="text-2xl lg:text-3xl font-bold text-white mb-4">{FEATURED_EVENT.title}</h2>
                <p className="text-amber-100 mb-6">{FEATURED_EVENT.description}</p>
                <div className="space-y-2 text-amber-100 text-sm mb-6">
                  <div className="flex items-center gap-2"><CalendarIcon className="h-4 w-4" />{FEATURED_EVENT.date}</div>
                  <div className="flex items-center gap-2"><ClockIcon className="h-4 w-4" />{FEATURED_EVENT.time}</div>
                  <div className="flex items-center gap-2"><MapPinIcon className="h-4 w-4" />{FEATURED_EVENT.location}</div>
                </div>
                <Link to="#" className="inline-flex items-center gap-2 px-6 py-3 bg-white text-amber-600 font-semibold rounded-xl">S'inscrire<ArrowRightIcon className="h-5 w-5" /></Link>
              </div>
              <div className="hidden lg:flex items-center justify-center bg-white/10">
                <CalendarIcon className="h-24 w-24 text-white/50" />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap gap-2 justify-center">
            {CATEGORIES.map((category) => (
              <button key={category} onClick={() => setSelectedCategory(category)} className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${selectedCategory === category ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                {category}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="py-10 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event, index) => (
              <motion.div key={event.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.1 }} className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-lg border border-gray-100">
                <div className="h-48 bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
                  <CalendarIcon className="h-16 w-16 text-indigo-300" />
                </div>
                <div className="p-6">
                  <span className="inline-block px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-medium mb-3">{event.category}</span>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{event.title}</h3>
                  <div className="space-y-1 text-sm text-gray-400">
                    <div className="flex items-center gap-2"><CalendarIcon className="h-4 w-4" />{event.date}</div>
                    <div className="flex items-center gap-2"><ClockIcon className="h-4 w-4" />{event.time}</div>
                    <div className="flex items-center gap-2"><MapPinIcon className="h-4 w-4" />{event.location}</div>
                  </div>
                  <button className="w-full mt-4 py-2.5 bg-indigo-600 text-white font-medium rounded-xl">S'inscrire</button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-gray-50 dark:bg-slate-900/50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="bg-gradient-to-r from-amber-600 to-indigo-600 rounded-3xl p-8 md:p-12 text-white text-center shadow-2xl">
            <h2 className="text-3xl font-bold mb-4">Ne manquez aucun événement</h2>
            <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-lg mx-auto">
              <input type="email" placeholder="Votre email" className="flex-1 px-6 py-4 rounded-xl text-gray-900 bg-white border-0" />
              <button className="px-8 py-4 bg-white text-amber-600 font-semibold rounded-xl shadow-lg">S'abonner</button>
            </div>
          </motion.div>
        </div>
      </section>
    </PublicLayout>
  );
}
