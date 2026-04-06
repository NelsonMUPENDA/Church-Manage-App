import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRightIcon,
  HeartIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  ClockIcon,
  UsersIcon,
  PlayIcon,
  HomeIcon,
  CalendarIcon,
  BookOpenIcon,
  GlobeAltIcon,
  EyeIcon,
  HandRaisedIcon,
  LightBulbIcon,
  RocketLaunchIcon,
} from '@heroicons/react/24/outline';

import PublicLayout from '../components/PublicLayout';

const CHURCH_INFO = {
  founded: '2010',
  address: '123 Avenue de la Foi, Kinshasa, RDC',
  phone: '+243 99 999 9999',
  email: 'contact@consolationetpaix.org',
};

const VALUES = [
  { icon: HeartIcon, title: 'Amour', description: 'L\'amour est le fondement de notre communauté.' },
  { icon: EyeIcon, title: 'Foi', description: 'Nous croyons en un Dieu puissant.' },
  { icon: HandRaisedIcon, title: 'Service', description: 'Nous sommes appelés à servir.' },
  { icon: LightBulbIcon, title: 'Excellence', description: 'Nous nous engageons à faire de notre mieux.' },
];

const LEADERSHIP = [
  { name: 'Pasteur Principal', role: 'Fondateur', description: 'Dirige l\'église depuis 2010.' },
  { name: 'Pasteur Adjoint', role: 'Co-Pasteur', description: 'Responsable de l\'enseignement.' },
  { name: 'Diacre Principal', role: 'Administration', description: 'Supervise les opérations.' },
  { name: 'Responsable Jeunesse', role: 'Ministère Jeunes', description: 'Encadre les jeunes.' },
];

export default function PublicAbout() {
  const fadeUp = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

  return (
    <PublicLayout>
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950" />
          <motion.div className="absolute top-20 -right-40 h-[500px] w-[500px] rounded-full bg-indigo-200/40 blur-3xl" animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 20, repeat: Infinity }} />
          <motion.div className="absolute bottom-0 -left-40 h-[600px] w-[600px] rounded-full bg-purple-200/40 blur-3xl" animate={{ scale: [1.1, 1, 1.1] }} transition={{ duration: 25, repeat: Infinity }} />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial="hidden" animate="show" variants={fadeUp} transition={{ duration: 0.6 }} className="text-center max-w-3xl mx-auto">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-indigo-100 to-purple-100 border border-indigo-200 mb-6">
              <BookOpenIcon className="h-4 w-4 text-indigo-600" />
              <span className="text-sm font-semibold text-indigo-800">Notre Histoire</span>
            </motion.div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-gray-900 dark:text-white leading-tight mb-6">
              À Propos de <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Notre Église</span>
            </h1>
          </motion.div>
        </div>
      </section>

      <section className="py-20 bg-gray-50 dark:bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <span className="text-indigo-600 font-semibold text-sm uppercase">Notre Histoire</span>
              <h2 className="mt-2 text-3xl font-bold text-gray-900 dark:text-white mb-4">Depuis {CHURCH_INFO.founded}</h2>
              <p className="text-gray-600 dark:text-slate-400 leading-relaxed">Consolation et Paix Divine a été fondée avec une vision claire : créer un espace où chacun peut expérimenter l'amour de Dieu.</p>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="relative">
              <div className="rounded-3xl overflow-hidden shadow-2xl">
                <div className="aspect-[4/3] bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
                  <HeartIcon className="h-24 w-24 text-indigo-500/50" />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <span className="text-indigo-600 font-semibold text-sm uppercase">Nos Valeurs</span>
            <h2 className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">Ce qui nous définit</h2>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {VALUES.map((value, index) => (
              <motion.div key={value.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.1 }} className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg text-center border border-gray-100">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mb-4 mx-auto">
                  <value.icon className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{value.title}</h3>
                <p className="text-gray-500 text-sm">{value.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-gradient-to-br from-indigo-600 to-purple-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="bg-white/10 rounded-2xl p-8 border border-white/20">
              <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center mb-4">
                <RocketLaunchIcon className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Notre Mission</h3>
              <p className="text-indigo-100">Évangéliser notre communauté et servir les nécessiteux.</p>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }} className="bg-white/10 rounded-2xl p-8 border border-white/20">
              <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center mb-4">
                <LightBulbIcon className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Notre Vision</h3>
              <p className="text-indigo-100">Devenir une église modèle qui impacte positivement notre nation.</p>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-gray-50 dark:bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <span className="text-indigo-600 font-semibold text-sm uppercase">Notre Équipe</span>
            <h2 className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">Le Leadership</h2>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {LEADERSHIP.map((leader, index) => (
              <motion.div key={leader.name} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.1 }} className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg text-center border border-gray-100">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center mx-auto mb-4">
                  <UsersIcon className="h-12 w-12 text-indigo-500" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{leader.name}</h3>
                <p className="text-indigo-600 text-sm font-medium mb-2">{leader.role}</p>
                <p className="text-gray-500 text-sm">{leader.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Contact</h2>
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-gray-100">
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <MapPinIcon className="h-5 w-5 text-indigo-600 shrink-0" />
                    <div><h4 className="font-semibold text-gray-900 dark:text-white">Adresse</h4><p className="text-gray-500 text-sm">{CHURCH_INFO.address}</p></div>
                  </div>
                  <div className="flex items-start gap-4">
                    <PhoneIcon className="h-5 w-5 text-indigo-600 shrink-0" />
                    <div><h4 className="font-semibold text-gray-900 dark:text-white">Téléphone</h4><p className="text-gray-500 text-sm">{CHURCH_INFO.phone}</p></div>
                  </div>
                  <div className="flex items-start gap-4">
                    <EnvelopeIcon className="h-5 w-5 text-indigo-600 shrink-0" />
                    <div><h4 className="font-semibold text-gray-900 dark:text-white">Email</h4><p className="text-gray-500 text-sm">{CHURCH_INFO.email}</p></div>
                  </div>
                </div>
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Horaires</h2>
              <div className="space-y-4">
                {['Dimanche 9h00-12h00', 'Mardi 17h00-19h00', 'Jeudi 17h00-19h00'].map((time) => (
                  <div key={time} className="flex items-center gap-4 bg-white dark:bg-slate-800 rounded-xl p-4 shadow border border-gray-100">
                    <ClockIcon className="h-6 w-6 text-indigo-600" />
                    <span className="text-gray-900 dark:text-white">{time}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-gradient-to-r from-indigo-600 to-purple-600">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Rejoignez notre famille</h2>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/evenements" className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-indigo-600 font-semibold rounded-2xl"><CalendarIcon className="h-5 w-5" />Planifier une visite</Link>
              <Link to="/" className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/20 text-white font-semibold rounded-2xl border border-white/30"><HomeIcon className="h-5 w-5" />Retour à l'accueil</Link>
            </div>
          </motion.div>
        </div>
      </section>
    </PublicLayout>
  );
}
