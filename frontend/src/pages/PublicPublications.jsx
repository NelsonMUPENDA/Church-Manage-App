import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRightIcon,
  BookOpenIcon,
  SparklesIcon,
  MagnifyingGlassIcon,
  BookmarkIcon,
  HeartIcon,
  ChatBubbleLeftRightIcon,
  PaperAirplaneIcon,
  XMarkIcon,
  UserIcon,
} from '@heroicons/react/24/outline';

import PublicLayout from '../components/PublicLayout';
import { api } from '../services/apiClient';
import { useAuth } from '../contexts/AuthProvider';

const CATEGORIES = ['Tous', 'Annonce', 'Formation', 'Évangélisation', 'Célébration', 'Rapport'];

const mediaUrl = (path) => {
  if (!path) return null;
  if (typeof path !== 'string') return null;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const base = api.defaults?.baseURL || '';
  if (!base) return path;
  if (path.startsWith('/')) return `${base}${path}`;
  return `${base}/${path}`;
};

const fmtDate = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
};

const fmtDateTime = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  return d.toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
};

const initials = (name) => {
  const s = String(name || '').trim();
  if (!s) return 'A';
  const parts = s.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return `${parts[0].slice(0, 1)}${parts[parts.length - 1].slice(0, 1)}`.toUpperCase();
};

export default function PublicPublications() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState('Tous');
  const [searchQuery, setSearchQuery] = useState('');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // État pour les commentaires
  const [commentState, setCommentState] = useState({});
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Charger les annonces depuis la BD
  const loadAnnouncements = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/api/announcements/');
      const data = Array.isArray(res.data) ? res.data : res.data?.results || [];
      // Ne garder que les annonces actives
      setItems(data.filter(a => a.is_active !== false));
    } catch (e) {
      setError('Impossible de charger les publications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnnouncements();
  }, []);

  // Fonction pour liker une publication
  const toggleLike = async (pub) => {
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }
    try {
      const res = await api.post(`/api/announcements/${pub.id}/like/`);
      const liked = Boolean(res?.data?.liked);
      const likeCount = Number(res?.data?.like_count ?? (pub.like_count || 0));
      setItems((prev) => prev.map((x) => (x.id === pub.id ? { ...x, liked_by_me: liked, like_count: likeCount } : x)));
    } catch (err) {
      console.error('Erreur lors du like:', err);
    }
  };

  // Charger les commentaires d'une publication
  const loadComments = async (pub) => {
    setCommentState((prev) => ({
      ...prev,
      [pub.id]: { ...(prev[pub.id] || {}), loading: true, open: true }
    }));
    try {
      const res = await api.get(`/api/announcements/${pub.id}/comments/`);
      const data = Array.isArray(res.data) ? res.data : res.data?.results || [];
      setCommentState((prev) => ({
        ...prev,
        [pub.id]: { ...prev[pub.id], items: data, loading: false, loaded: true, text: '' }
      }));
    } catch (err) {
      setCommentState((prev) => ({
        ...prev,
        [pub.id]: { ...(prev[pub.id] || {}), loading: false, error: true }
      }));
    }
  };

  // Toggle l'affichage des commentaires
  const toggleComments = (pub) => {
    const st = commentState[pub.id];
    if (!st) {
      loadComments(pub);
      return;
    }
    setCommentState((prev) => ({
      ...prev,
      [pub.id]: { ...st, open: !st.open }
    }));
    if (!st.loaded && !st.loading && !st.error) loadComments(pub);
  };

  // Soumettre un commentaire
  const submitComment = async (pub) => {
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }
    const st = commentState[pub.id];
    const text = String(st?.text || '').trim();
    if (!text) return;
    
    setCommentState((prev) => ({
      ...prev,
      [pub.id]: { ...(prev[pub.id] || {}), sending: true }
    }));
    try {
      await api.post(`/api/announcements/${pub.id}/comments/`, { body: text });
      setCommentState((prev) => ({
        ...prev,
        [pub.id]: { ...(prev[pub.id] || {}), text: '', sending: false }
      }));
      await loadComments(pub);
      setItems((prev) => prev.map((x) => (x.id === pub.id ? { ...x, comment_count: (x.comment_count || 0) + 1 } : x)));
    } catch (err) {
      setCommentState((prev) => ({
        ...prev,
        [pub.id]: { ...(prev[pub.id] || {}), sending: false }
      }));
      console.error('Erreur lors du commentaire:', err);
    }
  };

  // Mettre à jour le texte du commentaire
  const setCommentText = (pubId, text) => {
    setCommentState((prev) => ({
      ...prev,
      [pubId]: { ...(prev[pubId] || {}), text }
    }));
  };

  // Filtrer les publications
  const filteredPublications = items.filter(pub => {
    const matchesCategory = selectedCategory === 'Tous' || pub.category === selectedCategory;
    const matchesSearch = (pub.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (pub.content || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Publication en vedette (la plus récente)
  const featuredPub = items[0] || null;

  return (
    <PublicLayout>
      {/* Modal de connexion */}
      <AnimatePresence>
        {showLoginModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setShowLoginModal(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Connexion requise</h3>
                <button onClick={() => setShowLoginModal(false)} className="p-1 rounded-full hover:bg-gray-100">
                  <XMarkIcon className="h-5 w-5 text-gray-500" />
                </button>
              </div>
              <p className="text-gray-600 dark:text-slate-400 mb-6">Connectez-vous pour aimer et commenter les publications.</p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowLoginModal(false)} 
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl font-medium"
                >
                  Annuler
                </button>
                <button 
                  onClick={() => navigate('/login')} 
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-xl font-medium"
                >
                  Se connecter
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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

      {/* Publication en vedette - depuis la BD */}
      {featuredPub && (
        <section className="py-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl overflow-hidden shadow-2xl">
              <div className="grid grid-cols-1 lg:grid-cols-2">
                <div className="p-8 lg:p-12">
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-medium mb-4">
                    <SparklesIcon className="h-3 w-3" />À la une
                  </span>
                  <h2 className="text-2xl lg:text-3xl font-bold text-white mb-4">{featuredPub.title}</h2>
                  <p className="text-indigo-100 mb-6 line-clamp-3">{featuredPub.content}</p>
                  <div className="flex items-center gap-4 text-indigo-200 text-sm mb-6">
                    <span>{featuredPub.author_name || 'Admin'}</span>
                    <span>•</span>
                    <span>{fmtDate(featuredPub.published_date)}</span>
                  </div>
                  <div className="flex items-center gap-6 text-white/80">
                    <button 
                      onClick={() => toggleLike(featuredPub)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-full transition-colors ${featuredPub.liked_by_me ? 'bg-white/30' : 'bg-white/10 hover:bg-white/20'}`}
                    >
                      <HeartIcon className={`h-5 w-5 ${featuredPub.liked_by_me ? 'fill-rose-400 text-rose-400' : ''}`} />
                      <span>{featuredPub.like_count || 0}</span>
                    </button>
                    <button 
                      onClick={() => toggleComments(featuredPub)}
                      className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                    >
                      <ChatBubbleLeftRightIcon className="h-5 w-5" />
                      <span>{featuredPub.comment_count || 0}</span>
                    </button>
                  </div>
                </div>
                <div className="hidden lg:flex items-center justify-center bg-white/10">
                  {featuredPub.image ? (
                    <img src={mediaUrl(featuredPub.image)} alt={featuredPub.title} className="h-full w-full object-cover" />
                  ) : (
                    <BookmarkIcon className="h-24 w-24 text-white/50" />
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      )}

      {/* Filtres et recherche */}
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

      {/* Liste des publications - données réelles */}
      <section className="py-10 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {error && (
            <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">
              {error}
              <button onClick={loadAnnouncements} className="ml-4 text-sm font-semibold underline">Réessayer</button>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="inline-flex h-10 w-10 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600 mb-4" />
                <p className="text-gray-500">Chargement des publications...</p>
              </div>
            </div>
          ) : filteredPublications.length === 0 ? (
            <div className="text-center py-20">
              <BookmarkIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">Aucune publication trouvée.</p>
              <p className="text-gray-400 text-sm">Les nouvelles annonces apparaîtront ici.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPublications.map((pub, index) => {
                const st = commentState[pub.id];
                return (
                  <motion.div key={pub.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.05 }} className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
                    {/* Image */}
                    <div className="h-48 bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center relative overflow-hidden">
                      {pub.image ? (
                        <img src={mediaUrl(pub.image)} alt={pub.title} className="h-full w-full object-cover" />
                      ) : (
                        <BookOpenIcon className="h-16 w-16 text-indigo-300" />
                      )}
                      {pub.is_active === false && (
                        <div className="absolute top-3 left-3 px-2 py-1 rounded-full bg-gray-600 text-white text-xs font-medium">
                          Inactif
                        </div>
                      )}
                    </div>

                    {/* Contenu */}
                    <div className="p-6">
                      {/* Auteur et date */}
                      <div className="flex items-center gap-3 mb-3">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white flex items-center justify-center text-xs font-bold">
                          {initials(pub.author_name || 'Admin')}
                        </div>
                        <div className="text-xs text-gray-500">
                          <span className="font-medium text-gray-700">{pub.author_name || 'Admin'}</span>
                          <span className="mx-1">•</span>
                          <span>{fmtDate(pub.published_date)}</span>
                        </div>
                      </div>

                      {/* Titre et contenu */}
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 line-clamp-2">{pub.title}</h3>
                      <p className="text-gray-500 text-sm mb-4 line-clamp-3">{pub.content}</p>

                      {/* Boutons Like et Commentaire */}
                      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        <button 
                          onClick={() => toggleLike(pub)}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${pub.liked_by_me ? 'text-rose-500 bg-rose-50' : 'text-gray-500 hover:bg-gray-100'}`}
                        >
                          <HeartIcon className={`h-5 w-5 ${pub.liked_by_me ? 'fill-current' : ''}`} />
                          <span className="text-sm font-medium">{pub.like_count || 0}</span>
                        </button>
                        <button 
                          onClick={() => toggleComments(pub)}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${st?.open ? 'text-indigo-600 bg-indigo-50' : 'text-gray-500 hover:bg-gray-100'}`}
                        >
                          <ChatBubbleLeftRightIcon className="h-5 w-5" />
                          <span className="text-sm font-medium">{pub.comment_count || 0}</span>
                        </button>
                      </div>

                      {/* Section Commentaires */}
                      <AnimatePresence>
                        {st?.open && (
                          <motion.div 
                            initial={{ height: 0, opacity: 0 }} 
                            animate={{ height: 'auto', opacity: 1 }} 
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="mt-4 pt-4 border-t border-gray-100">
                              {/* Liste des commentaires */}
                              {st?.loading ? (
                                <div className="text-center py-4">
                                  <div className="inline-flex h-6 w-6 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" />
                                </div>
                              ) : st?.items?.length > 0 ? (
                                <div className="space-y-3 mb-4 max-h-48 overflow-y-auto">
                                  {st.items.map((comment) => (
                                    <div key={comment.id} className="flex gap-3">
                                      <div className="h-8 w-8 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white flex items-center justify-center text-xs font-bold shrink-0">
                                        {initials(comment.author_name || 'User')}
                                      </div>
                                      <div className="flex-1 bg-gray-50 rounded-2xl rounded-tl-none px-3 py-2">
                                        <div className="flex items-center gap-2 mb-1">
                                          <span className="text-xs font-semibold text-gray-700">{comment.author_name || 'Utilisateur'}</span>
                                          <span className="text-xs text-gray-400">{fmtDateTime(comment.created_at)}</span>
                                        </div>
                                        <p className="text-sm text-gray-600">{comment.body}</p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-center text-gray-400 text-sm py-4">Aucun commentaire. Soyez le premier !</p>
                              )}

                              {/* Formulaire de commentaire */}
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  value={st?.text || ''}
                                  onChange={(e) => setCommentText(pub.id, e.target.value)}
                                  onKeyDown={(e) => e.key === 'Enter' && submitComment(pub)}
                                  placeholder="Ajouter un commentaire..."
                                  className="flex-1 px-4 py-2 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                                />
                                <button
                                  onClick={() => submitComment(pub)}
                                  disabled={st?.sending || !st?.text?.trim()}
                                  className="px-3 py-2 bg-indigo-600 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  {st?.sending ? (
                                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                  ) : (
                                    <PaperAirplaneIcon className="h-5 w-5" />
                                  )}
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-20 bg-gray-50 dark:bg-slate-900/50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl p-8 md:p-12 text-white text-center shadow-2xl">
            <h2 className="text-3xl font-bold mb-4">Restez informé</h2>
            <p className="text-indigo-100 mb-6">Abonnez-vous pour recevoir les dernières publications.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-lg mx-auto">
              <input type="email" placeholder="Votre email" className="flex-1 px-6 py-4 rounded-xl text-gray-900 bg-white border-0" />
              <button className="px-8 py-4 bg-white text-indigo-600 font-semibold rounded-xl shadow-lg hover:bg-gray-100 transition-colors">S'abonner</button>
            </div>
          </motion.div>
        </div>
      </section>
    </PublicLayout>
  );
}
