import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRightIcon,
  BookOpenIcon,
  SparklesIcon,
  ChevronRightIcon,
  MagnifyingGlassIcon,
  BookmarkIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

import PublicLayout from '../components/PublicLayout';

const FEATURED_PUBLICATION = {
  title: 'L\'Importance de la Prière',
  excerpt: 'Découvrez comment la prière peut transformer votre vie.',
  author: 'Pasteur Jean M.',
  date: '15 Mars 2025',
  category: 'Formation',
};

const PUBLICATIONS = [
  { id: 1, title: 'Guide du Nouveau Croyant', excerpt: 'Les fondements essentiels.', category: 'Formation', author: 'Équipe Pastorale', date: '10 Mars 2025' },
  { id: 2, title: 'Conférence Annuelle 2025', excerpt: 'Inscrivez-vous dès maintenant.', category: 'Annonce', author: 'Secrétariat', date: '8 Mars 2025' },
  { id: 3, title: 'Témoignage: Ma Délivrance', excerpt: 'Comment Dieu a transformé ma vie.', category: 'Célébration', author: 'Marie K.', date: '5 Mars 2025' },
  { id: 4, title: 'Rapport Février 2025', excerpt: 'Retour sur les activités.', category: 'Rapport', author: 'Direction', date: '1 Mars 2025' },
  { id: 5, title: 'Le Mariage Chrétien', excerpt: 'Construire un mariage solide.', category: 'Formation', author: 'Pasteur Adjoint', date: '25 Février 2025' },
  { id: 6, title: 'Projet Orphelinat', excerpt: 'Soutenez notre projet.', category: 'Évangélisation', author: 'Diaconat', date: '20 Février 2025' },
];

const CATEGORIES = ['Tous', 'Annonce', 'Formation', 'Évangélisation', 'Célébration', 'Rapport'];

export default function PublicPublications() {
  const [selectedCategory, setSelectedCategory] = useState('Tous');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredPublications = PUBLICATIONS.filter(pub => {
    const matchesCategory = selectedCategory === 'Tous' || pub.category === selectedCategory;
    const matchesSearch = pub.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

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
              <BookOpenIcon className="h-4 w-4 text-indigo-600" />
              <span className="text-sm font-semibold text-indigo-800">Publications</span>
            </motion.div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-gray-900 dark:text-white leading-tight mb-6">
              Nos <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Publications</span>
            </h1>
          </motion.div>
        </div>
      </section>

      <section className="py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl overflow-hidden shadow-2xl">
            <div className="grid grid-cols-1 lg:grid-cols-2">
              <div className="p-8 lg:p-12">
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-medium mb-4">
                  <SparklesIcon className="h-3 w-3" />{FEATURED_PUBLICATION.category}
                </span>
                <h2 className="text-2xl lg:text-3xl font-bold text-white mb-4">{FEATURED_PUBLICATION.title}</h2>
                <p className="text-indigo-100 mb-6">{FEATURED_PUBLICATION.excerpt}</p>
                <div className="flex items-center gap-4 text-indigo-200 text-sm mb-6">
                  <span>{FEATURED_PUBLICATION.author}</span><span>•</span><span>{FEATURED_PUBLICATION.date}</span>
                </div>
                <Link to="#" className="inline-flex items-center gap-2 px-6 py-3 bg-white text-indigo-600 font-semibold rounded-xl">Lire l'article<ArrowRightIcon className="h-5 w-5" /></Link>
              </div>
              <div className="hidden lg:flex items-center justify-center bg-white/10">
                <BookmarkIcon className="h-24 w-24 text-white/50" />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((category) => (
                <button key={category} onClick={() => setSelectedCategory(category)} className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${selectedCategory === category ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                  {category}
                </button>
              ))}
            </div>
            <div className="relative w-full md:w-72">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input type="text" placeholder="Rechercher..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>
        </div>
      </section>

      <section className="py-10 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPublications.map((pub, index) => (
              <motion.div key={pub.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.1 }} className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-lg border border-gray-100">
                <div className="h-48 bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
                  <BookOpenIcon className="h-16 w-16 text-indigo-300" />
                </div>
                <div className="p-6">
                  <span className="inline-block px-3 py-1 rounded-full bg-indigo-100 text-indigo-800 text-xs font-medium mb-3">{pub.category}</span>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{pub.title}</h3>
                  <p className="text-gray-500 text-sm mb-4">{pub.excerpt}</p>
                  <div className="flex items-center justify-between text-sm text-gray-400">
                    <span>{pub.author}</span><span>{pub.date}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-gray-50 dark:bg-slate-900/50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl p-8 md:p-12 text-white text-center shadow-2xl">
            <h2 className="text-3xl font-bold mb-4">Restez informé</h2>
            <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-lg mx-auto">
              <input type="email" placeholder="Votre email" className="flex-1 px-6 py-4 rounded-xl text-gray-900 bg-white border-0" />
              <button className="px-8 py-4 bg-white text-indigo-600 font-semibold rounded-xl shadow-lg">S'abonner</button>
            </div>
          </motion.div>
        </div>
      </section>
    </PublicLayout>
  );
}
