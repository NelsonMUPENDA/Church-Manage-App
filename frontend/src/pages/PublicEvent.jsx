import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  CalendarDaysIcon,
  ClockIcon,
  MapPinIcon,
  ChatBubbleLeftRightIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline';

import { api } from '../services/apiClient';

export default function PublicEvent() {
  const { slug } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [event, setEvent] = useState(null);

  const [commentName, setCommentName] = useState('');
  const [commentBody, setCommentBody] = useState('');
  const [sending, setSending] = useState(false);

  const mediaUrl = (path) => {
    if (!path) return null;
    if (typeof path !== 'string') return null;
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    const base = api.defaults?.baseURL || '';
    if (!base) return path;
    if (path.startsWith('/')) return `${base}${path}`;
    return `${base}/${path}`;
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/api/events/public/${slug}/`);
      setEvent(res.data);
    } catch (e) {
      setError("Impossible de charger ce programme.");
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    load();
  }, [load]);

  const poster = useMemo(() => mediaUrl(event?.poster_image), [event]);

  const submitComment = async (e) => {
    e.preventDefault();
    if (!String(commentBody || '').trim()) return;
    setSending(true);
    try {
      await api.post(`/api/events/public/${slug}/comment/`, {
        author_name: commentName || 'Anonyme',
        body: commentBody,
      });
      setCommentBody('');
      await load();
    } catch (err) {
      setError("Impossible d'envoyer le commentaire.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen cpd-dynamic-theme bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <Link to="/login" className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-700 hover:underline">
            <ArrowLeftIcon className="h-4 w-4" />
            Retour
          </Link>
          <div className="text-xs text-gray-600">Lien public • Programme & Activité</div>
        </div>

        {error ? (
          <div className="mb-4 bg-rose-50 text-rose-700 border border-rose-100 rounded-xl p-4">{error}</div>
        ) : null}

        {loading ? (
          <div className="text-gray-500">Chargement…</div>
        ) : null}

        {!loading && event ? (
          <>
            <motion.div
              className="overflow-hidden bg-white/80 backdrop-blur-md border border-white/60 rounded-3xl shadow"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="relative">
                {poster ? (
                  <img src={poster} alt="Affiche" className="w-full h-64 object-cover" />
                ) : (
                  <div className="w-full h-64 bg-gradient-to-r from-indigo-500/20 to-purple-500/20" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <div className="text-white text-2xl font-bold">{event.title}</div>
                  <div className="text-white/90 text-sm">{event.event_type} • {event.duration_type}</div>
                </div>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="rounded-2xl border border-gray-100 bg-white/70 p-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                      <CalendarDaysIcon className="h-5 w-5 text-indigo-600" />
                      Date
                    </div>
                    <div className="mt-1 text-gray-700">{event.date || '—'}</div>
                  </div>
                  <div className="rounded-2xl border border-gray-100 bg-white/70 p-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                      <ClockIcon className="h-5 w-5 text-indigo-600" />
                      Heure
                    </div>
                    <div className="mt-1 text-gray-700">{event.time || '—'}</div>
                  </div>
                  <div className="rounded-2xl border border-gray-100 bg-white/70 p-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                      <MapPinIcon className="h-5 w-5 text-indigo-600" />
                      Lieu
                    </div>
                    <div className="mt-1 text-gray-700">{event.location || '—'}</div>
                  </div>
                </div>

                {event.description ? (
                  <div className="mt-4 rounded-2xl border border-gray-100 bg-white/70 p-4">
                    <div className="text-sm font-semibold text-gray-900">Détails</div>
                    <div className="mt-1 text-gray-700 whitespace-pre-wrap">{event.description}</div>
                  </div>
                ) : null}

                <div className="mt-4 rounded-2xl border border-gray-100 bg-white/70 p-4">
                  <div className="text-sm font-semibold text-gray-900">Intervenants</div>
                  <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-700">
                    <div>Modérateur: <span className="font-semibold text-gray-900">{event.moderator || '—'}</span></div>
                    <div>Prédicateur: <span className="font-semibold text-gray-900">{event.preacher || '—'}</span></div>
                    <div>Chorale: <span className="font-semibold text-gray-900">{event.choir || '—'}</span></div>
                    <div>Protocole & Diaconat: <span className="font-semibold text-gray-900">{event.protocol_team || '—'}</span></div>
                    <div>Sonorisation & Technique & Media: <span className="font-semibold text-gray-900">{event.tech_team || '—'}</span></div>
                    <div>Communicateur: <span className="font-semibold text-gray-900">{event.communicator || '—'}</span></div>
                  </div>
                </div>
              </div>
            </motion.div>

            <div className="mt-6 bg-white/80 backdrop-blur-md border border-white/60 rounded-3xl shadow p-6">
              <div className="flex items-center gap-2 text-gray-900 font-bold">
                <ChatBubbleLeftRightIcon className="h-5 w-5 text-indigo-600" />
                Commentaires
              </div>

              <form onSubmit={submitComment} className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <div className="text-xs font-semibold text-gray-600 mb-1">Nom (optionnel)</div>
                  <input value={commentName} onChange={(e) => setCommentName(e.target.value)} className="w-full rounded-xl border border-gray-200 bg-white/70 px-3 py-2" placeholder="Votre nom" />
                </div>
                <div className="md:col-span-2">
                  <div className="text-xs font-semibold text-gray-600 mb-1">Votre commentaire</div>
                  <input value={commentBody} onChange={(e) => setCommentBody(e.target.value)} className="w-full rounded-xl border border-gray-200 bg-white/70 px-3 py-2" placeholder="Écrivez un commentaire..." />
                </div>
                <div className="md:col-span-3 flex justify-end">
                  <motion.button
                    type="submit"
                    disabled={sending || !String(commentBody || '').trim()}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow hover:shadow-lg disabled:opacity-60"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {sending ? 'Envoi…' : 'Publier'}
                  </motion.button>
                </div>
              </form>

              <div className="mt-4 space-y-3">
                {(event.comments || []).length === 0 ? (
                  <div className="text-sm text-gray-600">Aucun commentaire.</div>
                ) : (
                  (event.comments || []).map((c) => (
                    <div key={c.id} className="rounded-2xl border border-gray-100 bg-white/70 p-4">
                      <div className="text-sm font-semibold text-gray-900">{c.author_name || '—'}</div>
                      <div className="text-sm text-gray-700 whitespace-pre-wrap">{c.body}</div>
                      <div className="mt-1 text-xs text-gray-500">{String(c.created_at || '').replace('T', ' ').slice(0, 16)}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
