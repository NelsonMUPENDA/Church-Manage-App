import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  ArrowUpOnSquareIcon,
  ArrowDownTrayIcon,
  LinkIcon,
  CheckCircleIcon,
  EyeSlashIcon,
  PhotoIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

import { api } from '../services/apiClient';
import { useToast } from '../components/ToastProvider';
import { useAuth } from '../contexts/AuthProvider';
import PhotoPicker from '../components/PhotoPicker';

export default function Events() {
  const toast = useToast();
  const { user } = useAuth();

  const role = user?.is_superuser || user?.is_staff ? 'admin' : user?.role;
  const isAdmin = role === 'admin' || role === 'super_admin';

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);

  const [departments, setDepartments] = useState([]);
  const [loadingDepartments, setLoadingDepartments] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [posterFile, setPosterFile] = useState(null);

  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewEvent, setPreviewEvent] = useState(null);

  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [durationFilter, setDurationFilter] = useState('all');
  const [q, setQ] = useState('');

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

  const eventTypeBadge = (eventType) => {
    const t = String(eventType || '').toLowerCase();
    if (t === 'baptism') return { label: 'Baptême', cls: 'bg-emerald-50 text-emerald-700' };
    if (t === 'evangelism') return { label: 'Évangélisation', cls: 'bg-teal-50 text-teal-700' };
    if (t === 'training') return { label: 'Affermissement', cls: 'bg-indigo-50 text-indigo-700' };
    if (t === 'marriage') return { label: 'Mariage', cls: 'bg-rose-50 text-rose-700' };
    return { label: 'Programme', cls: 'bg-gray-100 text-gray-700' };
  };

  const specialPreviewLines = (ev) => {
    const et = String(ev?.event_type || '').toLowerCase();
    const sd = ev?.special_details || null;
    if (et === 'training') {
      const trainer = (sd?.trainer || '').trim();
      const lesson = (sd?.lesson || '').trim();
      return [
        trainer ? `Formateur: ${trainer}` : null,
        lesson ? `Leçon: ${lesson}` : null,
      ].filter(Boolean);
    }
    if (et === 'evangelism') {
      const moderator = String(sd?.moderator || ev?.moderator || '').trim();
      return [moderator ? `Modérateur: ${moderator}` : null].filter(Boolean);
    }
    if (et === 'baptism') {
      const moderator = String(sd?.moderator || ev?.moderator || '').trim();
      const executors = Array.isArray(sd?.executors) ? sd.executors.map((x) => String(x || '').trim()).filter(Boolean) : [];
      const cand = sd?.candidates_count;
      return [
        moderator ? `Exécutant principal: ${moderator}` : null,
        executors.length ? `Exécutants: ${executors.slice(0, 5).join(', ')}` : null,
        Number.isFinite(Number(cand)) ? `Candidats: ${Number(cand)}` : null,
      ].filter(Boolean);
    }
    return [];
  };

  const programmeCardLine1 = (ev) => {
    const et = String(ev?.event_type || '').toLowerCase();
    const date = ev?.date || '—';
    const time = String(ev?.time || '').slice(0, 5) || '—';
    if (et === 'training' || et === 'evangelism' || et === 'baptism') {
      return `${date} • ${time}`;
    }
    return `${date} • ${time} • ${ev?.duration_type || '—'}`;
  };

  const programmeCardLine2 = (ev) => {
    const et = String(ev?.event_type || '').toLowerCase();
    const sd = ev?.special_details || null;
    const location = (ev?.location || '').trim() || '—';

    if (et === 'training') {
      const trainer = String(sd?.trainer || '').trim() || '—';
      const lesson = String(sd?.lesson || '').trim() || '—';
      return `Formateur: ${trainer} • Leçon: ${lesson}`;
    }

    if (et === 'evangelism') {
      const moderator = String(sd?.moderator || ev?.moderator || '').trim() || '—';
      return `Lieu: ${location} • Modérateur: ${moderator}`;
    }

    if (et === 'baptism') {
      const main = String(sd?.moderator || ev?.moderator || '').trim() || '—';
      const executors = Array.isArray(sd?.executors) ? sd.executors.map((x) => String(x || '').trim()).filter(Boolean) : [];
      const extra = executors.length ? ` • Exécutants: ${executors.slice(0, 5).join(', ')}` : '';
      return `Lieu: ${location} • Exécutant principal: ${main}${extra}`;
    }

    return `Lieu: ${location}`;
  };

  const eventStartMs = (ev) => {
    try {
      const d = String(ev?.date || '').trim();
      const t = String(ev?.time || '').trim();
      if (!d) return null;
      const timePart = (t ? t.slice(0, 5) : '00:00') || '00:00';
      const dt = new Date(`${d}T${timePart}:00`);
      const ms = dt.getTime();
      if (Number.isNaN(ms)) return null;
      return ms;
    } catch {
      return null;
    }
  };

  const openPreview = (ev) => {
    setPreviewEvent(ev);
    setPreviewOpen(true);
  };

  const closePreview = () => {
    setPreviewOpen(false);
    setPreviewEvent(null);
  };

  const filenameFromContentDisposition = (cd) => {
    if (!cd) return null;
    const m = String(cd).match(/filename="([^"]+)"/i);
    if (m?.[1]) return m[1];
    const m2 = String(cd).match(/filename=([^;]+)/i);
    if (m2?.[1]) return String(m2[1]).trim();
    return null;
  };

  const downloadPdf = async (ev) => {
    try {
      const res = await api.get(`/api/events/${ev.id}/pdf/`, { responseType: 'blob' });
      const cd = res?.headers?.['content-disposition'] || res?.headers?.['Content-Disposition'];
      const filename = filenameFromContentDisposition(cd) || 'programme.pdf';

      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      toast.push({ type: 'error', title: 'PDF', message: formatApiError(err, 'Impossible de télécharger le PDF.') });
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

  const editingPosterUrl = useMemo(() => {
    if (!editingId) return null;
    const ev = (events || []).find((x) => String(x?.id) === String(editingId));
    return mediaUrl(ev?.poster_image);
  }, [editingId, events]);

  const defaultForm = () => ({
    title: '',
    description: '',
    event_type: 'service',
    duration_type: 'daily',
    date: new Date().toISOString().slice(0, 10),
    time: '10:00',
    location: '',
    moderator: '',
    preacher: '',
    choir: '',
    protocol_team: '',
    tech_team: '',
    communicator: '',
    department: '',
  });

  const [form, setForm] = useState(defaultForm());

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/api/events/');
      const data = Array.isArray(res.data) ? res.data : res.data?.results || [];
      setEvents(data);
    } catch (e) {
      setError("Impossible de charger les événements.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const loadDepts = async () => {
      if (!isAdmin) return;
      setLoadingDepartments(true);
      try {
        const res = await api.get('/api/departments/');
        const data = Array.isArray(res.data) ? res.data : res.data?.results || [];
        data.sort((a, b) => String(a?.name || '').localeCompare(String(b?.name || ''), 'fr', { sensitivity: 'base' }));
        setDepartments(data);
      } catch {
        setDepartments([]);
      } finally {
        setLoadingDepartments(false);
      }
    };
    loadDepts();
  }, [isAdmin]);

  const startCreate = () => {
    setEditingId(null);
    setPosterFile(null);
    setForm(defaultForm());
    setShowForm(true);
  };

  const startEdit = (ev) => {
    setEditingId(ev.id);
    setPosterFile(null);
    setForm({
      title: ev.title || '',
      description: ev.description || '',
      event_type: ev.event_type || 'service',
      duration_type: ev.duration_type || 'daily',
      date: ev.date || new Date().toISOString().slice(0, 10),
      time: (ev.time || '10:00').slice(0, 5),
      location: ev.location || '',
      moderator: ev.moderator || '',
      preacher: ev.preacher || '',
      choir: ev.choir || '',
      protocol_team: ev.protocol_team || '',
      tech_team: ev.tech_team || '',
      communicator: ev.communicator || '',
      department: ev.department ? String(ev.department) : '',
    });
    setShowForm(true);
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingId(null);
    setPosterFile(null);
    setForm(defaultForm());
  };

  const saveEvent = async (e) => {
    e.preventDefault();
    if (!String(form.title || '').trim()) {
      toast.push({ type: 'error', title: 'Titre requis', message: "Entrez le titre de l'activité." });
      return;
    }
    if (!form.date) {
      toast.push({ type: 'error', title: 'Date requise', message: 'Sélectionnez la date.' });
      return;
    }
    if (!form.time) {
      toast.push({ type: 'error', title: 'Heure requise', message: "Sélectionnez l'heure." });
      return;
    }

    if (form.event_type === 'department_meeting' && !String(form.department || '').trim()) {
      toast.push({ type: 'error', title: 'Département requis', message: 'Sélectionnez le département.' });
      return;
    }

    setCreating(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (v === undefined || v === null) return;
        if (k === 'department' && !String(v || '').trim()) return;
        fd.append(k, String(v));
      });
      if (posterFile) fd.append('poster_image', posterFile);

      if (editingId) {
        await api.patch(`/api/events/${editingId}/`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.push({ type: 'success', title: 'Programme mis à jour' });
      } else {
        await api.post('/api/events/', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.push({ type: 'success', title: 'Programme créé' });
      }

      cancelForm();
      await load();
    } catch (err) {
      toast.push({ type: 'error', title: 'Erreur', message: formatApiError(err, "Impossible d'enregistrer.") });
    } finally {
      setCreating(false);
    }
  };

  const deleteEvent = async (ev) => {
    if (!window.confirm(`Supprimer « ${ev.title} » ?`)) return;
    try {
      await api.delete(`/api/events/${ev.id}/`);
      toast.push({ type: 'success', title: 'Supprimé' });
      await load();
    } catch (err) {
      toast.push({ type: 'error', title: 'Erreur', message: formatApiError(err, 'Impossible de supprimer.') });
    }
  };

  const togglePublish = async (ev) => {
    try {
      if (ev.is_published) {
        await api.post(`/api/events/${ev.id}/unpublish/`);
        toast.push({ type: 'success', title: 'Dépublié' });
      } else {
        const res = await api.post(`/api/events/${ev.id}/publish/`);
        toast.push({ type: 'success', title: 'Publié' });
        const updated = res?.data || { id: ev.id };
        await downloadPdf(updated);
      }
      await load();
    } catch (err) {
      toast.push({ type: 'error', title: 'Erreur', message: formatApiError(err, 'Impossible de changer le statut.') });
    }
  };

  const shareLink = (ev) => {
    const slug = ev.share_slug;
    if (!slug) return null;
    return `${window.location.origin}/p/${slug}`;
  };

  const copyShare = async (ev) => {
    const link = shareLink(ev);
    if (!link) {
      toast.push({ type: 'error', title: 'Lien indisponible', message: "Ce programme n'a pas encore de lien." });
      return;
    }
    try {
      await navigator.clipboard.writeText(link);
      toast.push({ type: 'success', title: 'Lien copié', message: link });
    } catch (err) {
      toast.push({ type: 'error', title: 'Erreur', message: 'Impossible de copier le lien.' });
    }
  };

  const filtered = useMemo(() => {
    const needle = String(q || '').trim().toLowerCase();
    return events.filter((ev) => {
      if (statusFilter === 'published' && !ev.is_published) return false;
      if (statusFilter === 'draft' && ev.is_published) return false;
      if (typeFilter !== 'all' && ev.event_type !== typeFilter) return false;
      if (durationFilter !== 'all' && ev.duration_type !== durationFilter) return false;
      if (needle) {
        const hay = `${ev.title || ''} ${ev.description || ''} ${ev.location || ''}`.toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      return true;
    });
  }, [events, statusFilter, typeFilter, durationFilter, q]);

  const statusItems = useMemo(() => {
    const nowMs = Date.now();
    const items = filtered.filter((ev) => {
      if (ev?.closure_validated_at) return false;
      const startMs = eventStartMs(ev);
      if (!startMs) return false;
      return startMs > nowMs;
    });
    items.sort((a, b) => {
      const d = String(a?.date || '').localeCompare(String(b?.date || ''));
      if (d !== 0) return d;
      return String(a?.time || '').localeCompare(String(b?.time || ''));
    });
    return items.slice(0, 24);
  }, [filtered]);

  const upcomingItems = useMemo(() => {
    const nowMs = Date.now();
    const items = filtered.filter((ev) => {
      if (ev?.closure_validated_at) return false;
      const startMs = eventStartMs(ev);
      if (!startMs) return false;
      return startMs > nowMs;
    });
    items.sort((a, b) => {
      const d = String(a?.date || '').localeCompare(String(b?.date || ''));
      if (d !== 0) return d;
      return String(a?.time || '').localeCompare(String(b?.time || ''));
    });
    return items;
  }, [filtered]);

  const recentlyClosedItems = useMemo(() => {
    const nowMs = Date.now();
    const delayMs = 24 * 60 * 60 * 1000;
    const items = filtered.filter((ev) => {
      if (!ev?.closure_validated_at) return false;
      const startMs = eventStartMs(ev);
      if (!startMs) return false;
      if (startMs > nowMs) return false;
      return (nowMs - startMs) < delayMs;
    });
    items.sort((a, b) => {
      const d = String(b?.date || '').localeCompare(String(a?.date || ''));
      if (d !== 0) return d;
      return String(b?.time || '').localeCompare(String(a?.time || ''));
    });
    return items;
  }, [filtered]);

  const historyItems = useMemo(() => {
    const nowMs = Date.now();
    const delayMs = 24 * 60 * 60 * 1000;
    const items = filtered.filter((ev) => {
      const startMs = eventStartMs(ev);
      if (!startMs) return false;
      if (startMs > nowMs) return false;
      if (ev?.closure_validated_at) return (nowMs - startMs) >= delayMs;
      return true;
    });
    items.sort((a, b) => {
      const d = String(b?.date || '').localeCompare(String(a?.date || ''));
      if (d !== 0) return d;
      return String(b?.time || '').localeCompare(String(a?.time || ''));
    });
    return items;
  }, [filtered]);

  return (
    <div className="h-full min-h-0 flex flex-col">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Programmes & Activités</h2>
          <p className="text-gray-600 dark:text-slate-300">Planification, publication, partage communauté.</p>
        </div>
        {isAdmin ? (
          <motion.button
            onClick={startCreate}
            disabled={creating}
            className="cpd-btn cpd-btn-success"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
          >
            <PlusIcon className="h-5 w-5" />
            Nouveau
          </motion.button>
        ) : null}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1">
        {error ? (
          <div className="mb-4 bg-rose-50 text-rose-700 border border-rose-100 rounded-xl p-4">{error}</div>
        ) : null}

        {showForm ? (
          <div className="mb-4 cpd-card p-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <div className="text-sm font-bold text-gray-900 dark:text-white">{editingId ? 'Modifier le programme' : 'Nouveau programme'}</div>
                <div className="text-xs text-gray-600 dark:text-slate-300">Renseigne les détails puis publie pour obtenir un lien public.</div>
              </div>
              <motion.button
                type="button"
                onClick={cancelForm}
                className="cpd-btn cpd-btn-ghost"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
              >
                Fermer
              </motion.button>
            </div>

            <form onSubmit={saveEvent} className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div className="sm:col-span-2 lg:col-span-2 min-w-0">
                <div className="text-xs font-semibold text-gray-600 mb-1">Type d'activité (titre)</div>
                <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} className="cpd-input" placeholder="ex: Culte spécial, Conférence, Réunion..." required />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-gray-600 mb-1">Catégorie</div>
                <select value={form.event_type} onChange={(e) => setForm((f) => ({ ...f, event_type: e.target.value }))} className="cpd-select">
                  <option value="service">Service</option>
                  <option value="meeting">Réunion</option>
                  <option value="special">Évènement spécial</option>
                  <option value="conference">Conférence</option>
                  <option value="workshop">Atelier</option>
                  <option value="weekly_service">Culte hebdomadaire</option>
                  <option value="sunday_service">Culte dominical</option>
                  <option value="seminar">Séminaire</option>
                  <option value="mothers_teaching">Enseignement des mamans</option>
                  <option value="fathers_teaching">Enseignement des papas</option>
                  <option value="youth_service">Culte des jeunes</option>
                  <option value="department_meeting">Rencontre de département</option>
                </select>
              </div>

              {form.event_type === 'department_meeting' ? (
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-gray-600 mb-1">Département</div>
                  <select
                    value={form.department}
                    onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))}
                    className="cpd-select"
                    disabled={loadingDepartments}
                    required
                  >
                    <option value="">Sélectionner...</option>
                    {departments.map((d) => (
                      <option key={d.id} value={String(d.id)}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}

              <div className="min-w-0">
                <div className="text-xs font-semibold text-gray-600 mb-1">Durée d'activité</div>
                <select value={form.duration_type} onChange={(e) => setForm((f) => ({ ...f, duration_type: e.target.value }))} className="cpd-select">
                  <option value="daily">Journalière</option>
                  <option value="weekly">Hebdomadaire</option>
                  <option value="21d">21j</option>
                  <option value="40d">40j</option>
                </select>
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-gray-600 mb-1">Date</div>
                <input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} className="cpd-input" required />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-gray-600 mb-1">Heure</div>
                <input type="time" value={form.time} onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))} className="cpd-input" required />
              </div>

              <div className="sm:col-span-2 lg:col-span-2 min-w-0">
                <div className="text-xs font-semibold text-gray-600 mb-1">Lieu</div>
                <input value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} className="cpd-input" placeholder="Adresse / Salle / Quartier" />
              </div>
              <div className="min-w-0">
                <PhotoPicker
                  label="Affiche"
                  file={posterFile}
                  existingUrl={editingPosterUrl}
                  onChange={(file) => setPosterFile(file)}
                  optional
                  showPreview
                  className="cpd-input"
                  labelClassName="text-xs font-semibold text-gray-600 mb-1"
                />
              </div>

              <div className="sm:col-span-2 lg:col-span-3 min-w-0">
                <div className="text-xs font-semibold text-gray-600 mb-1">Description</div>
                <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className="cpd-textarea min-h-[90px]" placeholder="Détails du programme, consignes, thème..." />
              </div>

              <div className="min-w-0">
                <div className="text-xs font-semibold text-gray-600 mb-1">Intervenant (Modérateur)</div>
                <input value={form.moderator} onChange={(e) => setForm((f) => ({ ...f, moderator: e.target.value }))} className="cpd-input" placeholder="Nom" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-gray-600 mb-1">Intervenant (Prédicateur)</div>
                <input value={form.preacher} onChange={(e) => setForm((f) => ({ ...f, preacher: e.target.value }))} className="cpd-input" placeholder="Nom" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-gray-600 mb-1">Intervenant (Chorale)</div>
                <input value={form.choir} onChange={(e) => setForm((f) => ({ ...f, choir: e.target.value }))} className="cpd-input" placeholder="Groupe" />
              </div>

              <div className="min-w-0">
                <div className="text-xs font-semibold text-gray-600 mb-1">Protocole & Diaconat</div>
                <input value={form.protocol_team} onChange={(e) => setForm((f) => ({ ...f, protocol_team: e.target.value }))} className="cpd-input" placeholder="Responsable / Équipe" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-gray-600 mb-1">Sonorisation & Technique & Media</div>
                <input value={form.tech_team} onChange={(e) => setForm((f) => ({ ...f, tech_team: e.target.value }))} className="cpd-input" placeholder="Responsable / Équipe" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-gray-600 mb-1">Communicateur</div>
                <input value={form.communicator} onChange={(e) => setForm((f) => ({ ...f, communicator: e.target.value }))} className="cpd-input" placeholder="Nom" />
              </div>

              <div className="sm:col-span-2 lg:col-span-3 flex flex-col sm:flex-row sm:justify-end gap-2">
                <motion.button
                  type="submit"
                  disabled={creating}
                  className="cpd-btn cpd-btn-success w-full sm:w-auto"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <ArrowUpOnSquareIcon className="h-5 w-5" />
                  {creating ? 'Enregistrement…' : editingId ? 'Mettre à jour' : 'Enregistrer'}
                </motion.button>
              </div>
            </form>
          </div>
        ) : null}

        <div className="mb-4 cpd-card p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="min-w-0">
              <div className="text-xs font-semibold text-gray-600 mb-1">Recherche</div>
              <input value={q} onChange={(e) => setQ(e.target.value)} className="cpd-input" placeholder="Titre, lieu, description..." />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-gray-600 mb-1">Statut</div>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="cpd-select">
                <option value="all">Tout</option>
                <option value="published">Publié</option>
                <option value="draft">Brouillon</option>
              </select>
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-gray-600 mb-1">Catégorie</div>
              <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="cpd-select">
                <option value="all">Toutes</option>
                <option value="service">Service</option>
                <option value="meeting">Réunion</option>
                <option value="special">Évènement spécial</option>
                <option value="conference">Conférence</option>
                <option value="workshop">Atelier</option>
              </select>
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-gray-600 mb-1">Durée</div>
              <select value={durationFilter} onChange={(e) => setDurationFilter(e.target.value)} className="cpd-select">
                <option value="all">Toutes</option>
                <option value="daily">Journalière</option>
                <option value="weekly">Hebdomadaire</option>
                <option value="21d">21j</option>
                <option value="40d">40j</option>
              </select>
            </div>
          </div>
        </div>

        <div className="mb-4 relative overflow-hidden rounded-3xl border border-white/60 bg-white/70 backdrop-blur-md shadow">
          <div className="absolute inset-0">
            <div className="absolute -top-16 -right-16 h-64 w-64 rounded-full bg-gradient-to-br from-emerald-500/20 to-teal-500/20 blur-2xl" />
            <div className="absolute -bottom-16 -left-16 h-64 w-64 rounded-full bg-gradient-to-br from-indigo-500/15 to-purple-500/15 blur-2xl" />
          </div>

          <div className="relative p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-xs font-semibold text-gray-500">Statuts</div>
                <div className="text-sm font-extrabold text-gray-900">Programmes en ligne</div>
              </div>
              <div className="text-xs font-semibold text-gray-600">{loading ? '…' : `${statusItems.length} à venir`}</div>
            </div>

            <div className="mt-4 flex gap-4 overflow-x-auto pb-2 pr-2 snap-x snap-mandatory">
              {statusItems.map((ev, idx) => {
                const poster = mediaUrl(ev.poster_image);
                const b = eventTypeBadge(ev.event_type);
                const ring = ev.is_alert
                  ? 'bg-gradient-to-r from-rose-500 via-amber-500 to-orange-500'
                  : ev.is_published
                    ? 'bg-gradient-to-r from-emerald-500 via-indigo-500 to-purple-500'
                    : 'bg-gray-200';
                return (
                  <motion.button
                    key={ev.id}
                    type="button"
                    onClick={() => openPreview(ev)}
                    className="snap-start shrink-0 w-[92px]"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.01 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className={`p-[3px] rounded-full ${ring}`}>
                      <div className="h-[78px] w-[78px] rounded-full bg-white flex items-center justify-center overflow-hidden">
                        {poster ? (
                          <img src={poster} alt="Affiche" className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full w-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center">
                            <PhotoIcon className="h-7 w-7 text-indigo-600" />
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-2 text-[11px] font-extrabold text-gray-900 truncate">{ev.title || 'Programme'}</div>
                    <div className="text-[10px] font-semibold text-gray-500 truncate">{String(ev.date || '').slice(5)} • {String(ev.time || '').slice(0, 5) || '—'}</div>
                    <div className="mt-1">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold ${b.cls}`}>{b.label}</span>
                    </div>
                  </motion.button>
                );
              })}

              {!loading && statusItems.length === 0 ? (
                <div className="text-sm text-gray-600">Aucun programme.</div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {loading ? <div className="text-gray-500">Chargement…</div> : null}

          {!loading && upcomingItems.length ? (
            <div>
              <div className="mb-2 flex items-center justify-between">
                <div className="text-sm font-extrabold text-gray-900">À venir</div>
                <div className="text-xs font-semibold text-gray-500">{upcomingItems.length}</div>
              </div>
              <div className="space-y-3">
                {upcomingItems.map((ev, idx) => {
                  const poster = mediaUrl(ev.poster_image);
                  const typeB = eventTypeBadge(ev.event_type);
                  const badge = ev.is_alert
                    ? 'bg-rose-50 text-rose-700'
                    : ev.is_published
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-gray-100 text-gray-700';
                  const badgeLabel = ev.is_alert ? 'Alerte' : ev.is_published ? 'Publié' : 'Brouillon';
                  return (
                    <motion.div
                      key={ev.id}
                      className="cpd-card overflow-hidden"
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.02 }}
                      whileHover={{ scale: 1.01 }}
                    >
                      <button type="button" onClick={() => openPreview(ev)} className="w-full text-left">
                        <div className="p-5">
                          <div className="flex items-center gap-4">
                            <div className="h-14 w-14 rounded-2xl overflow-hidden border border-white/60 bg-white shrink-0">
                              {poster ? (
                                <img src={poster} alt="Affiche" className="h-full w-full object-cover" />
                              ) : (
                                <div className="h-full w-full bg-gradient-to-br from-indigo-500/15 to-purple-500/15 flex items-center justify-center">
                                  <PhotoIcon className="h-6 w-6 text-indigo-500" />
                                </div>
                              )}
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-2">
                                <div className="text-base font-extrabold text-gray-900 truncate">{ev.title || 'Programme'}</div>
                                <div className="flex items-center gap-2">
                                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${badge}`}>{badgeLabel}</span>
                                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${typeB.cls}`}>{typeB.label}</span>
                                </div>
                              </div>
                              <div className="mt-1 text-sm text-gray-600 truncate">{programmeCardLine1(ev)}</div>
                              <div className="mt-1 text-sm text-gray-700 truncate">{programmeCardLine2(ev)}</div>
                            </div>
                          </div>
                        </div>
                      </button>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ) : null}

          {!loading && recentlyClosedItems.length ? (
            <div>
              <div className="mb-2 flex items-center justify-between">
                <div className="text-sm font-extrabold text-gray-900">Clôturés (24h)</div>
                <div className="text-xs font-semibold text-gray-500">{recentlyClosedItems.length}</div>
              </div>
              <div className="space-y-3">
                {recentlyClosedItems.map((ev, idx) => {
                  const poster = mediaUrl(ev.poster_image);
                  const badge = ev.is_alert ? 'bg-rose-50 text-rose-700' : 'bg-indigo-50 text-indigo-700';
                  const badgeLabel = ev.is_alert ? 'Alerte' : 'Clôturé';
                  return (
                    <motion.div
                      key={ev.id}
                      className="cpd-card overflow-hidden"
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.02 }}
                      whileHover={{ scale: 1.01 }}
                    >
                      <button type="button" onClick={() => openPreview(ev)} className="w-full text-left">
                        <div className="p-5">
                          <div className="flex items-center gap-4">
                            <div className="h-14 w-14 rounded-2xl overflow-hidden border border-white/60 bg-white shrink-0">
                              {poster ? (
                                <img src={poster} alt="Affiche" className="h-full w-full object-cover" />
                              ) : (
                                <div className="h-full w-full bg-gradient-to-br from-indigo-500/15 to-purple-500/15 flex items-center justify-center">
                                  <PhotoIcon className="h-6 w-6 text-indigo-500" />
                                </div>
                              )}
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-2">
                                <div className="text-base font-extrabold text-gray-900 truncate">{ev.title || 'Programme'}</div>
                                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${badge}`}>{badgeLabel}</span>
                              </div>
                              <div className="mt-1 text-sm text-gray-600 truncate">{programmeCardLine1(ev)}</div>
                              <div className="mt-1 text-sm text-gray-700 truncate">{programmeCardLine2(ev)}</div>
                            </div>
                          </div>
                        </div>
                      </button>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ) : null}

          {!loading ? (
            <div>
              <div className="mb-2 flex items-center justify-between">
                <div className="text-sm font-extrabold text-gray-900">Historique</div>
                <div className="text-xs font-semibold text-gray-500">{historyItems.length}</div>
              </div>
              {historyItems.length === 0 ? (
                <div className="text-gray-500">Aucun programme pour les filtres.</div>
              ) : (
                <div className="space-y-3">
                  {historyItems.map((ev, idx) => {
                    const poster = mediaUrl(ev.poster_image);
                    const badge = ev.is_alert ? 'bg-rose-50 text-rose-700' : 'bg-gray-100 text-gray-700';
                    const badgeLabel = ev.is_alert ? 'Alerte' : 'Historique';
                    return (
                      <motion.div
                        key={ev.id}
                        className="cpd-card overflow-hidden"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.01 }}
                        whileHover={{ scale: 1.01 }}
                      >
                        <button type="button" onClick={() => openPreview(ev)} className="w-full text-left">
                          <div className="p-5">
                            <div className="flex items-center gap-4">
                              <div className="h-14 w-14 rounded-2xl overflow-hidden border border-white/60 bg-white shrink-0">
                                {poster ? (
                                  <img src={poster} alt="Affiche" className="h-full w-full object-cover" />
                                ) : (
                                  <div className="h-full w-full bg-gradient-to-br from-indigo-500/15 to-purple-500/15 flex items-center justify-center">
                                    <PhotoIcon className="h-6 w-6 text-indigo-500" />
                                  </div>
                                )}
                              </div>

                              <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-2">
                                  <div className="text-base font-extrabold text-gray-900 truncate">{ev.title || 'Programme'}</div>
                                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${badge}`}>{badgeLabel}</span>
                                </div>
                                <div className="mt-1 text-sm text-gray-600 truncate">{programmeCardLine1(ev)}</div>
                                <div className="mt-1 text-sm text-gray-700 truncate">{programmeCardLine2(ev)}</div>
                              </div>
                            </div>
                          </div>
                        </button>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>

      <AnimatePresence>
        {previewOpen && previewEvent ? (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closePreview}
          >
            <motion.div
              className="w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-3xl bg-white shadow-2xl"
              initial={{ opacity: 0, y: 24, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 110, damping: 18 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative">
                {mediaUrl(previewEvent.poster_image) ? (
                  <img src={mediaUrl(previewEvent.poster_image)} alt="Affiche" className="w-full h-64 object-cover" />
                ) : (
                  <div className="w-full h-64 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 flex items-center justify-center">
                    <PhotoIcon className="h-12 w-12 text-indigo-600" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/20 to-transparent" />

                <button
                  type="button"
                  onClick={closePreview}
                  className="absolute top-4 right-4 rounded-2xl p-2 bg-white/20 text-white backdrop-blur hover:bg-white/30"
                  aria-label="Fermer"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>

                <div className="absolute bottom-4 left-5 right-5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-xl font-black text-white truncate">{previewEvent.title || 'Programme'}</div>
                      <div className="mt-1 text-sm text-white/85 truncate">{previewEvent.date || '—'} • {String(previewEvent.time || '').slice(0, 5) || '—'} • {previewEvent.duration_type || '—'}</div>
                    </div>
                    <span className={`shrink-0 text-xs font-semibold px-2 py-1 rounded-full ${previewEvent.is_published ? 'bg-emerald-500/20 text-emerald-50 border border-emerald-300/20' : 'bg-white/15 text-white border border-white/15'}`}>
                      {previewEvent.is_published ? 'Publié' : 'Brouillon'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-4 overflow-y-auto max-h-[calc(90vh-16rem)]">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 p-4">
                    <div className="text-xs font-semibold text-gray-500 dark:text-slate-400">Lieu</div>
                    <div className="mt-1 text-sm font-bold text-gray-900 dark:text-white">{previewEvent.location || '—'}</div>
                  </div>
                  <div className="rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 p-4">
                    <div className="text-xs font-semibold text-gray-500 dark:text-slate-400">Coordonnées</div>
                    <div className="mt-1 text-sm text-gray-900 dark:text-slate-200">
                      {specialPreviewLines(previewEvent).length ? (
                        <div className="space-y-1">
                          {specialPreviewLines(previewEvent).map((ln) => (
                            <div key={ln} className="text-sm text-gray-900 dark:text-slate-200">{ln}</div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm text-gray-900 dark:text-slate-200">
                          Modérateur: <span className="font-bold">{previewEvent.moderator || '—'}</span>
                          {' • '}
                          Prédicateur: <span className="font-bold">{previewEvent.preacher || '—'}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {previewEvent.description ? (
                  <div className="rounded-2xl bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 p-4">
                    <div className="text-xs font-semibold text-gray-500 dark:text-slate-400">Description</div>
                    <div className="mt-2 text-sm text-gray-800 dark:text-slate-200 whitespace-pre-wrap">{previewEvent.description}</div>
                  </div>
                ) : null}

                <div className="flex flex-wrap gap-2">
                  {previewEvent.is_published && shareLink(previewEvent) ? (
                    <motion.button
                      type="button"
                      onClick={() => copyShare(previewEvent)}
                      className="cpd-btn cpd-btn-ghost"
                      whileHover={{ y: -1 }}
                      whileTap={{ scale: 0.98 }}
                      title={shareLink(previewEvent)}
                    >
                      <LinkIcon className="h-5 w-5" />
                      Partager
                    </motion.button>
                  ) : null}

                  {previewEvent.is_published ? (
                    <motion.button
                      type="button"
                      onClick={() => downloadPdf(previewEvent)}
                      className="cpd-btn cpd-btn-ghost"
                      whileHover={{ y: -1 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <ArrowDownTrayIcon className="h-5 w-5" />
                      PDF
                    </motion.button>
                  ) : null}

                  {isAdmin ? (
                    <motion.button
                      type="button"
                      onClick={() => togglePublish(previewEvent)}
                      className={[
                        'cpd-btn',
                        previewEvent.is_published ? 'cpd-btn-ghost' : 'cpd-btn-success',
                      ].join(' ')}
                      whileHover={{ y: -1 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {previewEvent.is_published ? <EyeSlashIcon className="h-5 w-5" /> : <CheckCircleIcon className="h-5 w-5" />}
                      {previewEvent.is_published ? 'Dépublier' : 'Publier'}
                    </motion.button>
                  ) : null}

                  {isAdmin ? (
                    <motion.button
                      type="button"
                      onClick={() => {
                        closePreview();
                        startEdit(previewEvent);
                      }}
                      className="cpd-btn cpd-btn-ghost"
                      whileHover={{ y: -1 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <PencilSquareIcon className="h-5 w-5" />
                      Modifier
                    </motion.button>
                  ) : null}

                  {isAdmin ? (
                    <motion.button
                      type="button"
                      onClick={() => {
                        closePreview();
                        deleteEvent(previewEvent);
                      }}
                      className="cpd-btn cpd-btn-danger"
                      whileHover={{ y: -1 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <TrashIcon className="h-5 w-5" />
                      Supprimer
                    </motion.button>
                  ) : null}
                </div>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
