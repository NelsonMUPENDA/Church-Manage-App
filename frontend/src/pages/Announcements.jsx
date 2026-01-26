import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowUpOnSquareIcon,
  ArrowDownTrayIcon,
  ChatBubbleLeftRightIcon,
  HandThumbUpIcon,
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

import { api } from '../services/apiClient';
import { useAuth } from '../contexts/AuthProvider';
import { useToast } from '../components/ToastProvider';
import PhotoPicker from '../components/PhotoPicker';

export default function Announcements() {
  const toast = useToast();
  const { user } = useAuth();

  const role = user?.is_superuser || user?.is_staff ? 'admin' : user?.role;
  const isAdmin = role === 'admin' || role === 'super_admin';

  const [adminTab, setAdminTab] = useState('posts');

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);
  const [showComposer, setShowComposer] = useState(false);
  const [composer, setComposer] = useState({ title: '', content: '' });
  const [composerImage, setComposerImage] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [q, setQ] = useState('');
  const [commentState, setCommentState] = useState({});

  const [events, setEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [decks, setDecks] = useState([]);
  const [loadingDecks, setLoadingDecks] = useState(false);

  const [deckId, setDeckId] = useState(null);
  const [deckEventId, setDeckEventId] = useState('');
  const [deckTitle, setDeckTitle] = useState('');
  const [deckHeader, setDeckHeader] = useState('');
  const [deckTheme, setDeckTheme] = useState('');
  const [deckItems, setDeckItems] = useState([{ text: '' }]);
  const [savingDeck, setSavingDeck] = useState(false);
  const [generatingDeck, setGeneratingDeck] = useState(false);

  const formatApiError = (err, fallback) => {
    const data = err?.response?.data;
    if (!data) return fallback;
    if (typeof data === 'string') return data;
    if (Array.isArray(data)) return data.map((x) => String(x)).join('\n');
    if (typeof data === 'object') {
      const lines = [];
      Object.entries(data).forEach(([k, v]) => {
        if (Array.isArray(v)) lines.push(`${k}: ${v.map((x) => String(x)).join(' ')}`);
        else if (v && typeof v === 'object') lines.push(`${k}: ${JSON.stringify(v)}`);
        else lines.push(`${k}: ${String(v)}`);
      });
      if (lines.length) return lines.join('\n');
    }
    return fallback;
  };

  const toggleCommentLike = async (a, c) => {
    try {
      const res = await api.post(`/api/announcements/${a.id}/comments/${c.id}/like/`);
      const liked = Boolean(res?.data?.liked);
      const likeCount = Number(res?.data?.like_count ?? (c.like_count || 0));
      setCommentState((prev) => {
        const st = prev[a.id];
        if (!st?.items) return prev;
        return {
          ...prev,
          [a.id]: {
            ...st,
            items: st.items.map((x) => (x.id === c.id ? { ...x, liked_by_me: liked, like_count: likeCount } : x)),
          },
        };
      });
    } catch (err) {
      toast.push({ type: 'error', title: 'Like', message: formatApiError(err, "Impossible d'aimer ce commentaire.") });
    }
  };

  const loadEvents = async () => {
    setLoadingEvents(true);
    try {
      const res = await api.get('/api/events/');
      const data = Array.isArray(res.data) ? res.data : res.data?.results || [];
      data.sort((a, b) => String(b?.date || '').localeCompare(String(a?.date || '')));
      setEvents(data);
    } catch (err) {
      setEvents([]);
    } finally {
      setLoadingEvents(false);
    }
  };

  const loadDecks = async () => {
    if (!isAdmin) return;
    setLoadingDecks(true);
    try {
      const res = await api.get('/api/announcement-decks/');
      const data = Array.isArray(res.data) ? res.data : res.data?.results || [];
      setDecks(data);
    } catch (err) {
      setDecks([]);
    } finally {
      setLoadingDecks(false);
    }
  };

  const mediaUrl = (path) => {
    if (!path) return null;
    if (typeof path !== 'string') return null;
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    const base = api.defaults?.baseURL || '';
    if (!base) return path;
    if (path.startsWith('/')) return `${base}${path}`;
    return `${base}/${path}`;
  };

  const displayName = (a) => a?.author_name || a?.author?.username || 'Admin';

  const initials = (name) => {
    const s = String(name || '').trim();
    if (!s) return 'A';
    const parts = s.split(/\s+/).filter(Boolean);
    if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
    return `${parts[0].slice(0, 1)}${parts[parts.length - 1].slice(0, 1)}`.toUpperCase();
  };

  const fmtDate = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return String(iso);
    return d.toLocaleString();
  };

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/api/announcements/');
      const data = Array.isArray(res.data) ? res.data : res.data?.results || [];
      setItems(data);
    } catch (e) {
      setError('Impossible de charger les annonces.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    loadEvents();
    loadDecks();
  }, [isAdmin]);

  const selectedEvent = useMemo(() => {
    return events.find((e) => String(e.id) === String(deckEventId)) || null;
  }, [deckEventId, events]);

  const resetDeckForm = () => {
    setDeckId(null);
    setDeckEventId('');
    setDeckTitle('');
    setDeckHeader('');
    setDeckTheme('');
    setDeckItems([{ text: '' }]);
  };

  const loadDeckIntoForm = async (id) => {
    if (!id) return;
    try {
      const res = await api.get(`/api/announcement-decks/${id}/`);
      const d = res.data;
      setDeckId(d?.id || null);
      setDeckEventId(d?.event ? String(d.event) : '');
      setDeckTitle(d?.title || '');
      setDeckHeader(d?.header_text || '');
      setDeckTheme(d?.theme_text || '');

      const itemsRes = await api.get(`/api/announcement-decks/${d.id}/items/`);
      const its = Array.isArray(itemsRes.data) ? itemsRes.data : itemsRes.data?.results || [];
      setDeckItems(its.length ? its.map((x) => ({ text: x.text || '' })) : [{ text: '' }]);
    } catch (err) {
      toast.push({ type: 'error', title: 'Deck', message: formatApiError(err, 'Impossible de charger le deck.') });
    }
  };

  const ensureDeckDefaultsFromEvent = () => {
    if (!selectedEvent) return;
    if (!String(deckTitle || '').trim()) {
      setDeckTitle(`Annonces — ${selectedEvent.title || 'Programme'}`);
    }
    if (!String(deckHeader || '').trim()) {
      const t = String(selectedEvent.time || '').slice(0, 5) || '—';
      const l = selectedEvent.location || '—';
      setDeckHeader(`Programme: ${selectedEvent.title || '—'}\nDate: ${selectedEvent.date || '—'}\nHeure: ${t}\nLieu: ${l}`);
    }
  };

  useEffect(() => {
    if (!isAdmin) return;
    ensureDeckDefaultsFromEvent();
  }, [deckEventId]);

  const saveDeck = async () => {
    if (!isAdmin) return;
    if (!deckEventId) {
      toast.push({ type: 'error', title: 'Deck', message: 'Sélectionne un programme.' });
      return;
    }
    if (!String(deckTitle || '').trim()) {
      toast.push({ type: 'error', title: 'Deck', message: 'Titre du deck requis.' });
      return;
    }

    const cleanedItems = (deckItems || [])
      .map((it, idx) => ({ order: idx + 1, text: String(it?.text || '').trim() }))
      .filter((x) => x.text);

    setSavingDeck(true);
    try {
      const payload = {
        event: Number(deckEventId),
        title: deckTitle || '',
        header_text: deckHeader || '',
        theme_text: deckTheme || '',
      };

      let id = deckId;
      if (id) {
        await api.patch(`/api/announcement-decks/${id}/`, payload);
      } else {
        const res = await api.post('/api/announcement-decks/', payload);
        id = res.data?.id;
        setDeckId(id || null);
      }

      if (id) {
        await api.post(`/api/announcement-decks/${id}/set-items/`, { items: cleanedItems });
      }

      toast.push({ type: 'success', title: 'Deck enregistré' });
      await loadDecks();
    } catch (err) {
      toast.push({ type: 'error', title: 'Deck', message: formatApiError(err, 'Impossible d’enregistrer le deck.') });
    } finally {
      setSavingDeck(false);
    }
  };

  const downloadBlob = (blob, filename) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || 'annonces.pptx';
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  };

  const generatePptx = async () => {
    if (!deckId) {
      await saveDeck();
    }
    const id = deckId;
    if (!id) return;
    setGeneratingDeck(true);
    try {
      const res = await api.post(`/api/announcement-decks/${id}/generate/`, {}, { responseType: 'blob' });
      downloadBlob(new Blob([res.data], { type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' }), `annonces_deck_${id}.pptx`);
      toast.push({ type: 'success', title: 'PowerPoint généré' });
      await loadDecks();
    } catch (err) {
      toast.push({ type: 'error', title: 'PowerPoint', message: formatApiError(err, 'Impossible de générer le PowerPoint.') });
    } finally {
      setGeneratingDeck(false);
    }
  };

  const resetComposer = () => {
    setComposer({ title: '', content: '' });
    setComposerImage(null);
    setEditingId(null);
    setShowComposer(false);
  };

  const startCreate = () => {
    setEditingId(null);
    setComposer({ title: '', content: '' });
    setComposerImage(null);
    setShowComposer(true);
  };

  const startEdit = (a) => {
    setEditingId(a.id);
    setComposer({ title: a.title || '', content: a.content || '' });
    setComposerImage(null);
    setShowComposer(true);
  };

  const savePost = async (e) => {
    e.preventDefault();
    if (!String(composer.title || '').trim() && !String(composer.content || '').trim() && !composerImage) {
      toast.push({ type: 'error', title: 'Publication vide', message: 'Ajoute un titre, un texte ou une image.' });
      return;
    }

    setCreating(true);
    try {
      const isEditing = Boolean(editingId);
      const url = isEditing ? `/api/announcements/${editingId}/` : '/api/announcements/';

      if (composerImage) {
        const fd = new FormData();
        fd.append('title', composer.title || '');
        fd.append('content', composer.content || '');
        fd.append('is_active', 'true');
        fd.append('image', composerImage);
        if (isEditing) await api.patch(url, fd);
        else await api.post(url, fd);
      } else {
        const payload = {
          title: composer.title || '',
          content: composer.content || '',
          is_active: true,
        };
        if (isEditing) await api.patch(url, payload);
        else await api.post(url, payload);
      }

      toast.push({ type: 'success', title: isEditing ? 'Publication mise à jour' : 'Publication créée' });
      resetComposer();
      await load();
    } catch (err) {
      toast.push({ type: 'error', title: 'Erreur', message: formatApiError(err, 'Impossible de publier.') });
    } finally {
      setCreating(false);
    }
  };

  const deletePost = async (a) => {
    if (!window.confirm('Supprimer cette publication ?')) return;
    try {
      await api.delete(`/api/announcements/${a.id}/`);
      toast.push({ type: 'success', title: 'Publication supprimée' });
      await load();
    } catch (err) {
      toast.push({ type: 'error', title: 'Suppression', message: formatApiError(err, 'Impossible de supprimer.') });
    }
  };

  const toggleLike = async (a) => {
    try {
      const res = await api.post(`/api/announcements/${a.id}/like/`);
      const liked = Boolean(res?.data?.liked);
      const likeCount = Number(res?.data?.like_count ?? (a.like_count || 0));
      setItems((prev) => prev.map((x) => (x.id === a.id ? { ...x, liked_by_me: liked, like_count: likeCount } : x)));
    } catch (err) {
      toast.push({ type: 'error', title: 'Like', message: formatApiError(err, "Impossible d'aimer.") });
    }
  };

  const ensureCommentsLoaded = async (a) => {
    setCommentState((prev) => {
      const existing = prev[a.id];
      if (existing?.loaded || existing?.loading) return prev;
      return { ...prev, [a.id]: { open: true, loading: true, loaded: false, items: [], text: '' } };
    });

    try {
      const res = await api.get(`/api/announcements/${a.id}/comments/`);
      const data = Array.isArray(res.data) ? res.data : res.data?.results || [];
      setCommentState((prev) => ({
        ...prev,
        [a.id]: { ...(prev[a.id] || {}), open: true, loading: false, loaded: true, items: data },
      }));
    } catch (err) {
      setCommentState((prev) => ({
        ...prev,
        [a.id]: { ...(prev[a.id] || {}), open: true, loading: false, loaded: false, error: true },
      }));
      toast.push({ type: 'error', title: 'Commentaires', message: formatApiError(err, 'Impossible de charger les commentaires.') });
    }
  };

  const toggleCommentsOpen = (a) => {
    const st = commentState[a.id];
    if (!st) {
      ensureCommentsLoaded(a);
      return;
    }
    setCommentState((prev) => ({
      ...prev,
      [a.id]: { ...st, open: !st.open },
    }));
    if (!st.loaded && !st.loading && !st.error) ensureCommentsLoaded(a);
  };

  const submitComment = async (a) => {
    const st = commentState[a.id];
    const text = String(st?.text || '').trim();
    if (!text) return;
    setCommentState((prev) => ({
      ...prev,
      [a.id]: { ...(prev[a.id] || {}), sending: true },
    }));
    try {
      await api.post(`/api/announcements/${a.id}/comments/`, { body: text });
      setCommentState((prev) => ({
        ...prev,
        [a.id]: { ...(prev[a.id] || {}), text: '', sending: false },
      }));
      await ensureCommentsLoaded(a);
      setItems((prev) => prev.map((x) => (x.id === a.id ? { ...x, comment_count: (x.comment_count || 0) + 1 } : x)));
    } catch (err) {
      setCommentState((prev) => ({
        ...prev,
        [a.id]: { ...(prev[a.id] || {}), sending: false },
      }));
      toast.push({ type: 'error', title: 'Commentaire', message: formatApiError(err, 'Impossible de commenter.') });
    }
  };

  const filtered = useMemo(() => {
    const needle = String(q || '').trim().toLowerCase();
    if (!needle) return items;
    return items.filter((a) => {
      const hay = `${a.title || ''} ${a.content || ''} ${a.author_name || ''}`.toLowerCase();
      return hay.includes(needle);
    });
  }, [items, q]);

  return (
    <div className="h-full min-h-0 flex flex-col">
      <div className="shrink-0 flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Fil d’actualité</h2>
          <p className="text-gray-600">Annonces officielles + échanges de la communauté.</p>
        </div>
        {isAdmin && adminTab === 'posts' ? (
          <motion.button
            onClick={startCreate}
            disabled={creating}
            className="cpd-btn cpd-btn-solid"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
          >
            <PlusIcon className="h-5 w-5" />
            Publier
          </motion.button>
        ) : null}
      </div>

      {isAdmin ? (
        <div className="shrink-0 mb-4 cpd-tabs w-full">
          {[
            { key: 'posts', label: 'Publications' },
            { key: 'projection', label: 'Projection (PPT)' },
          ].map((t) => {
            const on = adminTab === t.key;
            return (
              <motion.button
                key={t.key}
                type="button"
                onClick={() => setAdminTab(t.key)}
                className={[
                  'cpd-tab',
                  on ? 'cpd-tab-active' : 'cpd-tab-inactive',
                ].join(' ')}
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.98 }}
              >
                {t.label}
              </motion.button>
            );
          })}
        </div>
      ) : null}

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1">
        {error ? (
          <div className="mb-4 bg-rose-50 text-rose-700 border border-rose-100 rounded-xl p-4">{error}</div>
        ) : null}

        {isAdmin && adminTab === 'projection' ? (
          <div className="mb-4 bg-white/80 backdrop-blur-md border border-white/60 rounded-2xl shadow p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-bold text-gray-900">Annonces du programme (projection)</div>
                <div className="text-xs text-gray-600">Crée un deck lié à un programme, puis génère un PowerPoint prêt à projeter.</div>
              </div>
              <div className="flex items-center gap-2">
                <motion.button
                  type="button"
                  onClick={resetDeckForm}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/80 border border-white/60 text-gray-900 shadow hover:shadow-md"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <XMarkIcon className="h-4 w-4" />
                  Nouveau
                </motion.button>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-3">
              <div className="lg:col-span-2">
                <div className="text-xs font-semibold text-gray-600 mb-1">Programme (événement)</div>
                <select
                  value={deckEventId}
                  onChange={(e) => setDeckEventId(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white/70 px-3 py-2"
                  disabled={loadingEvents}
                >
                  <option value="">Sélectionner…</option>
                  {events.map((ev) => (
                    <option key={ev.id} value={String(ev.id)}>
                      {ev.date} • {String(ev.time || '').slice(0, 5)} • {ev.title}
                    </option>
                  ))}
                </select>
                {loadingEvents ? <div className="mt-1 text-xs text-gray-500">Chargement des programmes…</div> : null}
              </div>

              <div>
                <div className="text-xs font-semibold text-gray-600 mb-1">Deck existant (optionnel)</div>
                <select
                  value={deckId ? String(deckId) : ''}
                  onChange={(e) => loadDeckIntoForm(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white/70 px-3 py-2"
                  disabled={loadingDecks}
                >
                  <option value="">—</option>
                  {decks.map((d) => (
                    <option key={d.id} value={String(d.id)}>
                      #{d.id} • {d.title}
                    </option>
                  ))}
                </select>
                {loadingDecks ? <div className="mt-1 text-xs text-gray-500">Chargement des decks…</div> : null}
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-2">
                <div className="text-xs font-semibold text-gray-600 mb-1">Titre du deck</div>
                <input
                  value={deckTitle}
                  onChange={(e) => setDeckTitle(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white/70 px-3 py-2"
                  placeholder="Ex: Annonces — Culte dominical"
                />
              </div>
              <div>
                <div className="text-xs font-semibold text-gray-600 mb-1">Thème (optionnel)</div>
                <input
                  value={deckTheme}
                  onChange={(e) => setDeckTheme(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white/70 px-3 py-2"
                  placeholder="Ex: Foi / Verset / Thème"
                />
              </div>
              <div className="md:col-span-3">
                <div className="text-xs font-semibold text-gray-600 mb-1">En-tête (affiché en slide)</div>
                <textarea
                  value={deckHeader}
                  onChange={(e) => setDeckHeader(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white/70 px-3 py-2 min-h-[90px]"
                  placeholder="Message d’accueil, rappel du programme, etc."
                />
              </div>
            </div>

            <div className="mt-4">
              <div className="flex items-center justify-between">
                <div className="text-sm font-bold text-gray-900">Annonces</div>
                <motion.button
                  type="button"
                  onClick={() => setDeckItems((prev) => [...prev, { text: '' }])}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/80 border border-white/60 text-gray-900 shadow hover:shadow-md"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <PlusIcon className="h-4 w-4" />
                  Ajouter
                </motion.button>
              </div>

              <div className="mt-3 space-y-2">
                {(deckItems || []).map((it, idx) => (
                  <div key={idx} className="bg-white/70 border border-white/60 rounded-xl p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-xs font-semibold text-gray-600">Annonce {idx + 1}</div>
                      <motion.button
                        type="button"
                        onClick={() => setDeckItems((prev) => prev.filter((_, i) => i !== idx))}
                        disabled={(deckItems || []).length <= 1}
                        className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-rose-600 text-white shadow hover:shadow-md disabled:opacity-60"
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <TrashIcon className="h-4 w-4" />
                        Retirer
                      </motion.button>
                    </div>
                    <textarea
                      value={it.text}
                      onChange={(e) => {
                        const v = e.target.value;
                        setDeckItems((prev) => prev.map((x, i) => (i === idx ? { ...x, text: v } : x)));
                      }}
                      className="mt-2 w-full rounded-xl border border-gray-200 bg-white/80 px-3 py-2 min-h-[80px]"
                      placeholder="Texte de l’annonce…"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 flex flex-col md:flex-row md:items-center md:justify-end gap-2">
              <motion.button
                type="button"
                onClick={saveDeck}
                disabled={savingDeck}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-white/80 border border-white/60 text-gray-900 shadow hover:shadow-md disabled:opacity-60"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <ArrowUpOnSquareIcon className="h-5 w-5" />
                {savingDeck ? 'Enregistrement…' : 'Enregistrer'}
              </motion.button>

              <motion.button
                type="button"
                onClick={generatePptx}
                disabled={generatingDeck || savingDeck}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow hover:shadow-lg disabled:opacity-60"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <ArrowDownTrayIcon className="h-5 w-5" />
                {generatingDeck ? 'Génération…' : 'Générer PowerPoint'}
              </motion.button>
            </div>
          </div>
        ) : null}

        {(!isAdmin || adminTab === 'posts') && (
          <>
            <div className="mb-4 bg-white/80 backdrop-blur-md border border-white/60 rounded-2xl shadow p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-2">
                  <div className="text-xs font-semibold text-gray-600 mb-1">Rechercher</div>
                  <input value={q} onChange={(e) => setQ(e.target.value)} className="w-full rounded-xl border border-gray-200 bg-white/70 px-3 py-2" placeholder="Titre, texte, auteur..." />
                </div>
                <div>
                  <div className="text-xs font-semibold text-gray-600 mb-1">Statut</div>
                  <div className="w-full rounded-xl border border-gray-200 bg-white/70 px-3 py-2 text-sm text-gray-700">
                    {loading ? 'Chargement…' : `${filtered.length} publication(s)`}
                  </div>
                </div>
              </div>
            </div>

            {showComposer && isAdmin ? (
              <div className="mb-4 bg-white/80 backdrop-blur-md border border-white/60 rounded-2xl shadow overflow-hidden">
                <div className="p-4 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-bold text-gray-900">{editingId ? 'Modifier la publication' : 'Créer une publication'}</div>
                    <div className="text-xs text-gray-600">Ajoute une image pour un rendu type Instagram.</div>
                  </div>
                  <motion.button
                    type="button"
                    onClick={resetComposer}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/80 border border-white/60 text-gray-900 shadow hover:shadow-md"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <XMarkIcon className="h-4 w-4" />
                    Fermer
                  </motion.button>
                </div>

                <form onSubmit={savePost} className="px-4 pb-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="md:col-span-2">
                    <div className="text-xs font-semibold text-gray-600 mb-1">Titre</div>
                    <input value={composer.title} onChange={(e) => setComposer((s) => ({ ...s, title: e.target.value }))} className="w-full rounded-xl border border-gray-200 bg-white/70 px-3 py-2" placeholder="Ex: Information importante, Programme de la semaine..." />
                  </div>
                  <div>
                    <PhotoPicker
                      label="Image (optionnel)"
                      file={composerImage}
                      existingUrl={null}
                      onChange={(file) => setComposerImage(file)}
                      optional
                      showPreview
                      className="rounded-xl border border-gray-200 bg-white/70 px-3 py-2"
                      labelClassName="text-xs font-semibold text-gray-600 mb-1"
                    />
                  </div>
                  <div className="md:col-span-3">
                    <div className="text-xs font-semibold text-gray-600 mb-1">Texte</div>
                    <textarea value={composer.content} onChange={(e) => setComposer((s) => ({ ...s, content: e.target.value }))} className="w-full rounded-xl border border-gray-200 bg-white/70 px-3 py-2 min-h-[110px]" placeholder="Écris ton message..." />
                  </div>
                  <div className="md:col-span-3 flex justify-end">
                    <motion.button
                      type="submit"
                      disabled={creating}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow hover:shadow-lg disabled:opacity-60"
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <ArrowUpOnSquareIcon className="h-5 w-5" />
                      {creating ? 'Enregistrement…' : editingId ? 'Mettre à jour' : 'Publier'}
                    </motion.button>
                  </div>
                </form>
              </div>
            ) : null}

            <div className="mx-auto w-full max-w-2xl space-y-4">
              {loading ? <div className="text-gray-500">Chargement…</div> : null}
              {!loading && filtered.length === 0 ? <div className="text-gray-500">Aucune publication.</div> : null}

              {filtered.map((a, idx) => {
                const name = displayName(a);
                const img = mediaUrl(a.image);
                const st = commentState[a.id];

                return (
                  <motion.div
                    key={a.id}
                    className="bg-white/80 backdrop-blur-md border border-white/60 rounded-2xl shadow overflow-hidden"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.02 }}
                  >
                    <div className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white flex items-center justify-center font-bold">
                          {initials(name)}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-gray-900">{name}</div>
                          <div className="text-xs text-gray-600">{fmtDate(a.published_date)}</div>
                        </div>
                      </div>

                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${a.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                        {a.is_active ? 'Actif' : 'Inactif'}
                      </span>
                    </div>

                    {isAdmin ? (
                      <div className="px-4 -mt-1 flex justify-end gap-2">
                        <motion.button
                          onClick={() => startEdit(a)}
                          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/80 border border-white/60 text-gray-900 shadow hover:shadow-md"
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <PencilSquareIcon className="h-4 w-4" />
                          Modifier
                        </motion.button>
                        <motion.button
                          onClick={() => deletePost(a)}
                          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-rose-600 text-white shadow hover:shadow-md"
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <TrashIcon className="h-4 w-4" />
                          Supprimer
                        </motion.button>
                      </div>
                    ) : null}

                    {a.title ? <div className="px-4 text-base font-bold text-gray-900">{a.title}</div> : null}
                    {a.content ? <div className="px-4 mt-2 text-sm text-gray-700 whitespace-pre-wrap">{a.content}</div> : null}

                    {img ? (
                      <div className="mt-3">
                        <img src={img} alt="Annonce" className="w-full max-h-[560px] object-cover" />
                      </div>
                    ) : (
                      <div className="mt-3 px-4">
                        <div className="w-full h-0" />
                      </div>
                    )}

                    <div className="px-4 py-3 flex items-center justify-between text-xs text-gray-600">
                      <div>{a.like_count || 0} like(s)</div>
                      <div>{a.comment_count || 0} commentaire(s)</div>
                    </div>

                    <div className="px-4 pb-4 grid grid-cols-2 gap-2">
                      <motion.button
                        onClick={() => toggleLike(a)}
                        className={`inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl border shadow-sm hover:shadow ${a.liked_by_me ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white/80 text-gray-900 border-white/60'}`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <HandThumbUpIcon className="h-5 w-5" />
                        J’aime
                      </motion.button>
                      <motion.button
                        onClick={() => toggleCommentsOpen(a)}
                        className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-white/80 border border-white/60 text-gray-900 shadow-sm hover:shadow"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <ChatBubbleLeftRightIcon className="h-5 w-5" />
                        Commentaires
                      </motion.button>
                    </div>

                    {st?.open ? (
                      <div className="px-4 pb-4">
                        {st.loading ? <div className="text-sm text-gray-600">Chargement…</div> : null}
                        {st.error ? <div className="text-sm text-rose-700">Impossible de charger.</div> : null}

                        {!st.loading && st.loaded && (st.items || []).length === 0 ? (
                          <div className="mt-2 text-sm text-gray-600">Aucun commentaire pour l’instant.</div>
                        ) : null}

                        <div className="mt-3 space-y-2">
                          {(st.items || []).slice(0, 30).map((c) => (
                            <div key={c.id} className="bg-white/80 border border-white/60 rounded-xl px-3 py-2">
                              <div className="text-xs text-gray-600">
                                <span className="font-semibold text-gray-900">{c.author_name || '—'}</span>
                                <span className="mx-2">•</span>
                                {fmtDate(c.created_at)}
                              </div>
                              <div className="mt-1 text-sm text-gray-700 whitespace-pre-wrap">{c.body}</div>
                              <div className="mt-2 flex items-center justify-between">
                                <div className="text-xs text-gray-600">{c.like_count || 0} like(s)</div>
                                <motion.button
                                  onClick={() => toggleCommentLike(a, c)}
                                  className={`inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg border shadow-sm hover:shadow ${c.liked_by_me ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white/80 text-gray-900 border-white/60'}`}
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                >
                                  <HandThumbUpIcon className="h-4 w-4" />
                                  J’aime
                                </motion.button>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="mt-4 flex gap-2">
                          <input
                            value={st.text || ''}
                            onChange={(e) =>
                              setCommentState((prev) => ({
                                ...prev,
                                [a.id]: { ...(prev[a.id] || {}), text: e.target.value },
                              }))
                            }
                            className="flex-1 rounded-xl border border-gray-200 bg-white/80 px-3 py-2"
                            placeholder="Écrire un commentaire…"
                          />
                          <motion.button
                            onClick={() => submitComment(a)}
                            disabled={Boolean(st.sending) || !String(st.text || '').trim()}
                            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow hover:shadow-lg disabled:opacity-60"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <ArrowUpOnSquareIcon className="h-5 w-5" />
                            Envoyer
                          </motion.button>
                        </div>
                      </div>
                    ) : null}
                  </motion.div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
