import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRightIcon,
  HeartIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  ClockIcon,
  PaperAirplaneIcon,
  CheckCircleIcon,
  CalendarIcon,
  VideoCameraIcon,
  GlobeAltIcon,
  PlayIcon,
} from '@heroicons/react/24/outline';

import PublicLayout from '../components/PublicLayout';

const CHURCH_INFO = {
  address: '123 Avenue de la Foi, Kinshasa, RDC',
  phone: '+243 99 999 9999',
  email: 'contact@consolationetpaix.org',
};

export default function PublicContact() {
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsSubmitting(false);
    setIsSubmitted(true);
    setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  return (
    <PublicLayout>
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950" />
          <motion.div className="absolute top-20 -right-40 h-[500px] w-[500px] rounded-full bg-indigo-200/40 blur-3xl" animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 20, repeat: Infinity }} />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-center max-w-3xl mx-auto">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-indigo-100 to-purple-100 border border-indigo-200 mb-6">
              <EnvelopeIcon className="h-4 w-4 text-indigo-600" />
              <span className="text-sm font-semibold text-indigo-800">Restons en Contact</span>
            </motion.div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-gray-900 dark:text-white leading-tight mb-6">
              Contactez-<span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">nous</span>
            </h1>
          </motion.div>
        </div>
      </section>

      <section className="py-20 bg-gray-50 dark:bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-xl border border-gray-100">
              {isSubmitted ? (
                <div className="text-center py-12">
                  <CheckCircleIcon className="h-16 w-16 text-green-600 mx-auto mb-6" />
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Message envoyé !</h3>
                  <button onClick={() => setIsSubmitted(false)} className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-xl">Envoyer un autre message</button>
                </div>
              ) : (
                <>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Envoyez-nous un message</h2>
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <input type="text" name="name" value={formData.name} onChange={handleChange} required placeholder="Nom complet" className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500" />
                      <input type="email" name="email" value={formData.email} onChange={handleChange} required placeholder="Email" className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <input type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="Téléphone" className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500" />
                      <select name="subject" value={formData.subject} onChange={handleChange} required className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500">
                        <option value="">Sujet</option>
                        <option value="general">Demande générale</option>
                        <option value="prayer">Demande de prière</option>
                        <option value="visit">Planifier une visite</option>
                      </select>
                    </div>
                    <textarea name="message" value={formData.message} onChange={handleChange} required rows="5" placeholder="Votre message..." className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 resize-none" />
                    <button type="submit" disabled={isSubmitting} className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl shadow-lg flex items-center justify-center gap-2">
                      {isSubmitting ? 'Envoi en cours...' : <><PaperAirplaneIcon className="h-5 w-5" />Envoyer</>}
                    </button>
                  </form>
                </>
              )}
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="space-y-6">
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-gray-100">
                <div className="flex items-start gap-4">
                  <MapPinIcon className="h-6 w-6 text-indigo-600 shrink-0" />
                  <div><h3 className="font-semibold text-gray-900 dark:text-white">Adresse</h3><p className="text-gray-500">{CHURCH_INFO.address}</p></div>
                </div>
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-gray-100">
                <div className="flex items-start gap-4">
                  <PhoneIcon className="h-6 w-6 text-green-600 shrink-0" />
                  <div><h3 className="font-semibold text-gray-900 dark:text-white">Téléphone</h3><p className="text-gray-500">{CHURCH_INFO.phone}</p></div>
                </div>
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-gray-100">
                <div className="flex items-start gap-4">
                  <EnvelopeIcon className="h-6 w-6 text-purple-600 shrink-0" />
                  <div><h3 className="font-semibold text-gray-900 dark:text-white">Email</h3><p className="text-gray-500">{CHURCH_INFO.email}</p></div>
                </div>
              </div>
              <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl p-6 text-white">
                <div className="flex items-center gap-3 mb-4">
                  <ClockIcon className="h-6 w-6" />
                  <h3 className="font-semibold">Heures de Bureau</h3>
                </div>
                <div className="space-y-2 text-indigo-100 text-sm">
                  <div className="flex justify-between"><span>Lundi - Vendredi</span><span>9h00 - 17h00</span></div>
                  <div className="flex justify-between"><span>Samedi</span><span>9h00 - 12h00</span></div>
                </div>
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-gray-100">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Suivez-nous</h3>
                <div className="flex gap-3">
                  <a href="#" className="w-12 h-12 rounded-xl bg-indigo-100 hover:bg-indigo-600 flex items-center justify-center transition-colors group"><GlobeAltIcon className="h-6 w-6 text-indigo-600 group-hover:text-white" /></a>
                  <a href="#" className="w-12 h-12 rounded-xl bg-red-100 hover:bg-red-600 flex items-center justify-center transition-colors group"><PlayIcon className="h-6 w-6 text-red-600 group-hover:text-white" /></a>
                  <a href="#" className="w-12 h-12 rounded-xl bg-pink-100 hover:bg-pink-600 flex items-center justify-center transition-colors group"><HeartIcon className="h-6 w-6 text-pink-600 group-hover:text-white" /></a>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-gradient-to-r from-indigo-600 to-purple-600">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Nous avons hâte de vous rencontrer</h2>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/evenements" className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-indigo-600 font-semibold rounded-2xl shadow-lg">
                <CalendarIcon className="h-5 w-5" />Nos événements
              </Link>
              <Link to="/diffusions" className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/20 text-white font-semibold rounded-2xl border border-white/30">
                <VideoCameraIcon className="h-5 w-5" />Nos diffusions
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </PublicLayout>
  );
}
