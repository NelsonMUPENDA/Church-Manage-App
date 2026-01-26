import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArchiveBoxIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  EyeIcon,
  HeartIcon,
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';

import { api } from '../services/apiClient';
import { useAuth } from '../contexts/AuthProvider';
import { useToast } from '../components/ToastProvider';
import PhotoPicker from '../components/PhotoPicker';

export default function Mariage() {
  const toast = useToast();
  const { user } = useAuth();

  const role = user?.is_superuser || user?.is_staff ? 'admin' : user?.role;
  const canEdit = role === 'admin' || role === 'super_admin' || role === 'secretary';

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

  const defaultCreateForm = useCallback(
    () => ({
      groom_full_name: '',
      groom_birth_date: '',
      groom_birth_place: '',
      groom_nationality: '',
      groom_passport_photo: null,

      bride_full_name: '',
      bride_birth_date: '',
      bride_birth_place: '',
      bride_nationality: '',
      bride_passport_photo: null,

      godfather_full_name: '',
      godfather_nationality: '',
      godfather_passport_photo: null,

      godmother_full_name: '',
      godmother_nationality: '',
      godmother_passport_photo: null,

      planned_date: new Date().toISOString().slice(0, 10),
      planned_time: '10:00',
      location: '',
      dowry_paid: false,
      civil_verified: false,
      prenuptial_tests: false,
      approved: false,
    }),
    []
  );

  const [records, setRecords] = useState([]);
  const [loadingRecords, setLoadingRecords] = useState(false);

  const [viewRow, setViewRow] = useState(null);
  const [editRow, setEditRow] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);

  const loadRecords = useCallback(async () => {
    setLoadingRecords(true);
    try {
      const res = await api.get('/api/marriages/');
      const data = Array.isArray(res.data) ? res.data : res.data?.results || [];
      setRecords(data);
    } catch (err) {
      setRecords([]);
      toast.push({ type: 'error', title: 'Mariage', message: formatApiError(err, 'Impossible de charger.') });
    } finally {
      setLoadingRecords(false);
    }
  }, [toast]);

  const mediaUrl = (path) => {
    if (!path) return null;
    if (typeof path !== 'string') return null;
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    const base = api.defaults?.baseURL || '';
    if (!base) return path;
    if (path.startsWith('/')) return `${base}${path}`;
    return `${base}/${path}`;
  };

  const initials = (name) => {
    const s = String(name || '').trim();
    if (!s) return '—';
    const parts = s.split(/\s+/).filter(Boolean);
    if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
    return `${parts[0].slice(0, 1)}${parts[parts.length - 1].slice(0, 1)}`.toUpperCase();
  };

  const openEdit = (row) => {
    if (!row) return;
    setEditRow({
      id: row.id,

      groom_full_name: row.groom_full_name || row.groom_name || '',
      groom_birth_date: row.groom_birth_date || '',
      groom_birth_place: row.groom_birth_place || '',
      groom_nationality: row.groom_nationality || '',
      groom_passport_photo: null,

      bride_full_name: row.bride_full_name || row.bride_name || '',
      bride_birth_date: row.bride_birth_date || '',
      bride_birth_place: row.bride_birth_place || '',
      bride_nationality: row.bride_nationality || '',
      bride_passport_photo: null,

      godfather_full_name: row.godfather_full_name || '',
      godfather_nationality: row.godfather_nationality || '',
      godfather_passport_photo: null,

      godmother_full_name: row.godmother_full_name || '',
      godmother_nationality: row.godmother_nationality || '',
      godmother_passport_photo: null,

      planned_date: row.planned_date || '',
      planned_time: String(row.planned_time || '').slice(0, 5) || '',
      location: row.location || '',

      dowry_paid: Boolean(row.dowry_paid),
      civil_verified: Boolean(row.civil_verified),
      prenuptial_tests: Boolean(row.prenuptial_tests),
      approved: Boolean(row.approved),
    });
  };

  const saveEdit = async () => {
    if (!editRow?.id) return;
    setSavingEdit(true);
    try {
      const fd = new FormData();
      const put = (k, v) => {
        const s = typeof v === 'string' ? v.trim() : v;
        if (s === '' || s === null || s === undefined) return;
        fd.append(k, s);
      };

      put('groom_full_name', editRow.groom_full_name);
      put('groom_birth_date', editRow.groom_birth_date);
      put('groom_birth_place', editRow.groom_birth_place);
      put('groom_nationality', editRow.groom_nationality);
      if (editRow.groom_passport_photo instanceof File) fd.append('groom_passport_photo', editRow.groom_passport_photo);

      put('bride_full_name', editRow.bride_full_name);
      put('bride_birth_date', editRow.bride_birth_date);
      put('bride_birth_place', editRow.bride_birth_place);
      put('bride_nationality', editRow.bride_nationality);
      if (editRow.bride_passport_photo instanceof File) fd.append('bride_passport_photo', editRow.bride_passport_photo);

      put('godfather_full_name', editRow.godfather_full_name);
      put('godfather_nationality', editRow.godfather_nationality);
      if (editRow.godfather_passport_photo instanceof File) fd.append('godfather_passport_photo', editRow.godfather_passport_photo);

      put('godmother_full_name', editRow.godmother_full_name);
      put('godmother_nationality', editRow.godmother_nationality);
      if (editRow.godmother_passport_photo instanceof File) fd.append('godmother_passport_photo', editRow.godmother_passport_photo);

      put('planned_date', editRow.planned_date);
      put('planned_time', editRow.planned_time);
      put('location', editRow.location);

      fd.append('dowry_paid', editRow.dowry_paid ? 'true' : 'false');
      fd.append('civil_verified', editRow.civil_verified ? 'true' : 'false');
      fd.append('prenuptial_tests', editRow.prenuptial_tests ? 'true' : 'false');
      fd.append('approved', editRow.approved ? 'true' : 'false');

      const res = await api.patch(`/api/marriages/${editRow.id}/`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      const updated = res.data;
      setRecords((prev) => prev.map((x) => (x.id === editRow.id ? updated : x)));
      toast.push({ type: 'success', title: 'Mariage mis à jour' });
      setEditRow(null);
    } catch (err) {
      toast.push({ type: 'error', title: 'Erreur', message: formatApiError(err, 'Impossible de modifier.') });
    } finally {
      setSavingEdit(false);
    }
  };

  const PersonTile = ({ title, name, subtitle, photoPath, variant = 'bride' }) => {
    const src = mediaUrl(photoPath);
    const palette =
      variant === 'groom'
        ? {
            ring: 'ring-sky-200/70 dark:ring-sky-500/20',
            badge: 'bg-sky-100 text-sky-800 dark:bg-sky-500/15 dark:text-sky-200',
            avatar: 'from-sky-600 to-indigo-600',
          }
        : variant === 'godfather'
        ? {
            ring: 'ring-emerald-200/70 dark:ring-emerald-500/20',
            badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-200',
            avatar: 'from-emerald-600 to-teal-600',
          }
        : variant === 'godmother'
        ? {
            ring: 'ring-fuchsia-200/70 dark:ring-fuchsia-500/20',
            badge: 'bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-500/15 dark:text-fuchsia-200',
            avatar: 'from-fuchsia-600 to-purple-600',
          }
        : {
            ring: 'ring-rose-200/70 dark:ring-rose-500/20',
            badge: 'bg-rose-100 text-rose-800 dark:bg-rose-500/15 dark:text-rose-200',
            avatar: 'from-pink-600 to-rose-600',
          };

    return (
      <div className="cpd-panel p-3">
        <div className="flex items-center justify-between">
          <div className={['text-[11px] px-2 py-0.5 rounded-full ring-1', palette.badge, palette.ring].join(' ')}>
            {title}
          </div>
        </div>
        <div className="mt-2 flex items-center gap-3">
          <div
            className={[
              'h-14 w-14 rounded-2xl text-white flex items-center justify-center overflow-hidden shadow ring-2 ring-white/70 dark:ring-white/10',
              'bg-gradient-to-br',
              palette.avatar,
            ].join(' ')}
          >
            {src ? (
              <img src={src} alt={name || title} className="h-full w-full object-cover" />
            ) : (
              <div className="text-lg">{initials(name)}</div>
            )}
          </div>
          <div className="min-w-0">
            <div className="text-sm text-gray-900 dark:text-white truncate">{name || '—'}</div>
            {subtitle ? <div className="text-xs text-gray-600 dark:text-slate-300 truncate">{subtitle}</div> : null}
          </div>
        </div>
      </div>
    );
  };

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  const [activeTab, setActiveTab] = useState('avenir');
  const [showCreate, setShowCreate] = useState(false);
  const [createStep, setCreateStep] = useState(0);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(() => defaultCreateForm());

  const allOk = useMemo(() => {
    return Boolean(form.dowry_paid && form.civil_verified && form.prenuptial_tests && form.approved);
  }, [form]);

  const createRecord = async () => {
    if (!String(form.groom_full_name || '').trim()) {
      toast.push({ type: 'error', title: 'Champs requis', message: 'Nom du mari requis.' });
      return;
    }
    if (!String(form.bride_full_name || '').trim()) {
      toast.push({ type: 'error', title: 'Champs requis', message: 'Nom de la mariée requis.' });
      return;
    }
    if (!String(form.planned_date || '').trim()) {
      toast.push({ type: 'error', title: 'Champs requis', message: 'Date de célébration requise.' });
      return;
    }
    if (!String(form.planned_time || '').trim()) {
      toast.push({ type: 'error', title: 'Champs requis', message: 'Heure de célébration requise.' });
      return;
    }
    if (!String(form.location || '').trim()) {
      toast.push({ type: 'error', title: 'Champs requis', message: 'Lieu de célébration requis.' });
      return;
    }
    setCreating(true);
    try {
      const fd = new FormData();

      const put = (k, v) => {
        const s = typeof v === 'string' ? v.trim() : v;
        if (s === '' || s === null || s === undefined) return;
        fd.append(k, s);
      };

      put('groom_full_name', form.groom_full_name);
      put('groom_birth_date', form.groom_birth_date);
      put('groom_birth_place', form.groom_birth_place);
      put('groom_nationality', form.groom_nationality);
      if (form.groom_passport_photo instanceof File) fd.append('groom_passport_photo', form.groom_passport_photo);

      put('bride_full_name', form.bride_full_name);
      put('bride_birth_date', form.bride_birth_date);
      put('bride_birth_place', form.bride_birth_place);
      put('bride_nationality', form.bride_nationality);
      if (form.bride_passport_photo instanceof File) fd.append('bride_passport_photo', form.bride_passport_photo);

      put('godfather_full_name', form.godfather_full_name);
      put('godfather_nationality', form.godfather_nationality);
      if (form.godfather_passport_photo instanceof File) fd.append('godfather_passport_photo', form.godfather_passport_photo);

      put('godmother_full_name', form.godmother_full_name);
      put('godmother_nationality', form.godmother_nationality);
      if (form.godmother_passport_photo instanceof File) fd.append('godmother_passport_photo', form.godmother_passport_photo);

      put('planned_date', form.planned_date);
      put('planned_time', form.planned_time);
      put('location', form.location);

      fd.append('dowry_paid', form.dowry_paid ? 'true' : 'false');
      fd.append('civil_verified', form.civil_verified ? 'true' : 'false');
      fd.append('prenuptial_tests', form.prenuptial_tests ? 'true' : 'false');
      fd.append('approved', form.approved ? 'true' : 'false');

      await api.post('/api/marriages/', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.push({ type: 'success', title: 'Mariage enregistré', message: allOk ? 'Publié automatiquement comme programme.' : undefined });
      setForm(defaultCreateForm());
      setCreateStep(0);
      await loadRecords();
      setShowCreate(false);
      setActiveTab('avenir');
    } catch (err) {
      toast.push({ type: 'error', title: 'Erreur', message: formatApiError(err, 'Impossible de créer.') });
    } finally {
      setCreating(false);
    }
  };

  const toggle = async (row, key) => {
    if (!row?.id) return;
    const nextVal = !row[key];
    try {
      const payload = { [key]: nextVal };
      const res = await api.patch(`/api/marriages/${row.id}/`, payload);
      const updated = res.data;
      setRecords((prev) => prev.map((x) => (x.id === row.id ? updated : x)));
      const needsPublish = Boolean(updated?.dowry_paid && updated?.civil_verified && updated?.prenuptial_tests && updated?.approved);
      if (needsPublish) {
        toast.push({ type: 'success', title: 'Validé', message: 'Le mariage est publié comme programme.' });
      } else {
        toast.push({ type: 'success', title: 'Mis à jour' });
      }
    } catch (err) {
      toast.push({ type: 'error', title: 'Erreur', message: formatApiError(err, 'Impossible de mettre à jour.') });
    }
  };

  const removeRecord = async (row) => {
    if (!row?.id) return;
    if (!window.confirm('Supprimer cet enregistrement de mariage ?')) return;
    try {
      await api.delete(`/api/marriages/${row.id}/`);
      toast.push({ type: 'success', title: 'Supprimé' });
      await loadRecords();
    } catch (err) {
      toast.push({ type: 'error', title: 'Erreur', message: formatApiError(err, 'Impossible de supprimer.') });
    }
  };

  const isFuture = (row) => {
    try {
      const d = new Date(`${row?.planned_date}T00:00:00`);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return d.getTime() >= today.getTime();
    } catch {
      return true;
    }
  };

  const futureRecords = useMemo(() => (records || []).filter(isFuture), [records]);
  const pastRecords = useMemo(() => (records || []).filter((r) => !isFuture(r)), [records]);

  const tabs = [
    { key: 'avenir', label: `Mariages à venir (${futureRecords.length})`, icon: CalendarDaysIcon, iconClass: 'text-pink-600' },
    { key: 'historique', label: `Historique (${pastRecords.length})`, icon: ArchiveBoxIcon, iconClass: 'text-indigo-600' },
  ];

  return (
    <div className="h-full min-h-0 flex flex-col">
      <div className="shrink-0 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4 min-w-0">
        <div>
          <h2 className="text-xl text-gray-900 dark:text-white">Mariage</h2>
          <p className="text-gray-600 dark:text-slate-300">Enregistrement et suivi (thème amour). Publication automatique dès validation.</p>
        </div>

        <motion.button
          type="button"
          onClick={() =>
            setShowCreate((v) => {
              const next = !v;
              if (next) {
                setCreateStep(0);
                setForm(defaultCreateForm());
              }
              return next;
            })
          }
          className="cpd-btn cpd-btn-solid"
          style={{ width: 'auto' }}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
        >
          <HeartIcon className="h-5 w-5" />
          Créer mariage
        </motion.button>
      </div>

      {showCreate ? (
        <div className="shrink-0 cpd-panel p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm text-gray-900 dark:text-white">Nouveau mariage</div>
              <div className="cpd-label">Saisie pas-à-pas pour éviter la confusion.</div>
            </div>
            <div className="cpd-label">
              Étape {createStep + 1} / 4
            </div>
          </div>

          <div className="mt-4 cpd-tabs w-full">
            {['Conjoints', 'Parrain/Marraine', 'Célébration', 'Checklist'].map((label, idx) => {
              const on = idx === createStep;
              const done = idx < createStep;
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => setCreateStep(idx)}
                  className={[
                    'cpd-tab flex-1 justify-start',
                    on ? 'cpd-tab-active' : 'cpd-tab-inactive',
                  ].join(' ')}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={[
                        'inline-flex items-center justify-center h-6 w-6 rounded-full border text-[11px]',
                        done
                          ? 'bg-indigo-600/10 text-indigo-700 border-indigo-200 dark:border-white/10 dark:text-indigo-200'
                          : on
                          ? 'bg-gray-900/5 text-gray-900 border-gray-200/70 dark:border-white/10 dark:text-white'
                          : 'bg-white/60 text-gray-700 border-gray-200/70 dark:bg-white/5 dark:border-white/10 dark:text-slate-200',
                      ].join(' ')}
                    >
                      {idx + 1}
                    </span>
                    <span className="text-sm text-gray-900 dark:text-white">{label}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {createStep === 0 ? (
            <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-3">
              <div className="lg:col-span-2">
                <div className="cpd-label mb-1">Nom complet du mari</div>
                <input
                  value={form.groom_full_name}
                  onChange={(e) => setForm((f) => ({ ...f, groom_full_name: e.target.value }))}
                  className="cpd-input"
                  placeholder="Nom complet"
                />
              </div>

              <div className="lg:col-span-2">
                <div className="cpd-label mb-1">Nom complet de la mariée</div>
                <input
                  value={form.bride_full_name}
                  onChange={(e) => setForm((f) => ({ ...f, bride_full_name: e.target.value }))}
                  className="cpd-input"
                  placeholder="Nom complet"
                />
              </div>

              <div>
                <div className="cpd-label mb-1">Date de naissance (mari)</div>
                <input
                  type="date"
                  value={form.groom_birth_date}
                  onChange={(e) => setForm((f) => ({ ...f, groom_birth_date: e.target.value }))}
                  className="cpd-input"
                />
              </div>

              <div>
                <div className="cpd-label mb-1">Lieu de naissance (mari)</div>
                <input
                  value={form.groom_birth_place}
                  onChange={(e) => setForm((f) => ({ ...f, groom_birth_place: e.target.value }))}
                  className="cpd-input"
                  placeholder="Ville / pays"
                />
              </div>

              <div>
                <div className="cpd-label mb-1">Nationalité (mari)</div>
                <input
                  value={form.groom_nationality}
                  onChange={(e) => setForm((f) => ({ ...f, groom_nationality: e.target.value }))}
                  className="cpd-input"
                  placeholder="Nationalité"
                />
              </div>

              <div>
                <PhotoPicker
                  label="Photo passeport (mari)"
                  file={form.groom_passport_photo}
                  onChange={(file) => setForm((f) => ({ ...f, groom_passport_photo: file }))}
                  optional
                  className="rounded-2xl border border-gray-200/70 dark:border-white/10 bg-white/70 dark:bg-white/10 px-3 py-2 shadow-sm"
                />
              </div>

              <div>
                <div className="cpd-label mb-1">Date de naissance (mariée)</div>
                <input
                  type="date"
                  value={form.bride_birth_date}
                  onChange={(e) => setForm((f) => ({ ...f, bride_birth_date: e.target.value }))}
                  className="cpd-input"
                />
              </div>

              <div>
                <div className="cpd-label mb-1">Lieu de naissance (mariée)</div>
                <input
                  value={form.bride_birth_place}
                  onChange={(e) => setForm((f) => ({ ...f, bride_birth_place: e.target.value }))}
                  className="cpd-input"
                  placeholder="Ville / pays"
                />
              </div>

              <div>
                <div className="cpd-label mb-1">Nationalité (mariée)</div>
                <input
                  value={form.bride_nationality}
                  onChange={(e) => setForm((f) => ({ ...f, bride_nationality: e.target.value }))}
                  className="cpd-input"
                  placeholder="Nationalité"
                />
              </div>

              <div>
                <PhotoPicker
                  label="Photo passeport (mariée)"
                  file={form.bride_passport_photo}
                  onChange={(file) => setForm((f) => ({ ...f, bride_passport_photo: file }))}
                  optional
                  className="rounded-2xl border border-gray-200/70 dark:border-white/10 bg-white/70 dark:bg-white/10 px-3 py-2 shadow-sm"
                />
              </div>
            </div>
          ) : null}

          {createStep === 1 ? (
            <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
              <div>
                <div className="cpd-label mb-1">Nom complet du parrain</div>
                <input
                  value={form.godfather_full_name}
                  onChange={(e) => setForm((f) => ({ ...f, godfather_full_name: e.target.value }))}
                  className="cpd-input"
                  placeholder="Nom complet"
                />
              </div>

              <div>
                <div className="cpd-label mb-1">Nationalité (parrain)</div>
                <input
                  value={form.godfather_nationality}
                  onChange={(e) => setForm((f) => ({ ...f, godfather_nationality: e.target.value }))}
                  className="cpd-input"
                  placeholder="Nationalité"
                />
              </div>

              <div>
                <PhotoPicker
                  label="Photo passeport (parrain)"
                  file={form.godfather_passport_photo}
                  onChange={(file) => setForm((f) => ({ ...f, godfather_passport_photo: file }))}
                  optional
                  className="rounded-2xl border border-gray-200/70 dark:border-white/10 bg-white/70 dark:bg-white/10 px-3 py-2 shadow-sm"
                />
              </div>

              <div>
                <div className="cpd-label mb-1">Nom complet de la marraine</div>
                <input
                  value={form.godmother_full_name}
                  onChange={(e) => setForm((f) => ({ ...f, godmother_full_name: e.target.value }))}
                  className="cpd-input"
                  placeholder="Nom complet"
                />
              </div>

              <div>
                <div className="cpd-label mb-1">Nationalité (marraine)</div>
                <input
                  value={form.godmother_nationality}
                  onChange={(e) => setForm((f) => ({ ...f, godmother_nationality: e.target.value }))}
                  className="cpd-input"
                  placeholder="Nationalité"
                />
              </div>

              <div>
                <PhotoPicker
                  label="Photo passeport (marraine)"
                  file={form.godmother_passport_photo}
                  onChange={(file) => setForm((f) => ({ ...f, godmother_passport_photo: file }))}
                  optional
                  className="rounded-2xl border border-gray-200/70 dark:border-white/10 bg-white/70 dark:bg-white/10 px-3 py-2 shadow-sm"
                />
              </div>
            </div>
          ) : null}

          {createStep === 2 ? (
            <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-3">
              <div>
                <div className="cpd-label mb-1">Date</div>
                <input
                  type="date"
                  value={form.planned_date}
                  onChange={(e) => setForm((f) => ({ ...f, planned_date: e.target.value }))}
                  className="cpd-input"
                />
              </div>

              <div>
                <div className="cpd-label mb-1">Heure</div>
                <input
                  type="time"
                  value={form.planned_time}
                  onChange={(e) => setForm((f) => ({ ...f, planned_time: e.target.value }))}
                  className="cpd-input"
                />
              </div>

              <div className="lg:col-span-2 xl:col-span-4">
                <div className="cpd-label mb-1">Lieu</div>
                <input
                  value={form.location}
                  onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                  className="cpd-input"
                  placeholder="Lieu de célébration"
                />
              </div>
            </div>
          ) : null}

          {createStep === 3 ? (
            <div className="mt-4">
              <div className="cpd-label mb-2">Checklist</div>
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-2">
                {[
                  { key: 'dowry_paid', label: 'Dot payée' },
                  { key: 'civil_verified', label: 'Vérifié état civil' },
                  { key: 'prenuptial_tests', label: 'Tests prénuptiaux' },
                  { key: 'approved', label: 'Approuvé' },
                ].map((it) => (
                  <label key={it.key} className="inline-flex items-center gap-2 rounded-xl border border-gray-200/70 dark:border-white/10 bg-white/70 dark:bg-white/10 px-3 py-2">
                    <input
                      type="checkbox"
                      checked={Boolean(form[it.key])}
                      onChange={(e) => setForm((f) => ({ ...f, [it.key]: e.target.checked }))}
                    />
                    <span className="text-sm text-gray-900 dark:text-white">{it.label}</span>
                  </label>
                ))}
              </div>
              <div className="mt-2 text-xs">
                {allOk ? (
                  <span className="inline-flex items-center gap-1 text-emerald-700">
                    <CheckCircleIcon className="h-4 w-4" />
                    Publiera automatiquement comme programme
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-gray-600 dark:text-slate-300">
                    <XCircleIcon className="h-4 w-4" />
                    Pas encore publiable
                  </span>
                )}
              </div>
            </div>
          ) : null}

          <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <motion.button
                type="button"
                onClick={() => setShowCreate(false)}
                className="cpd-btn cpd-btn-outline"
                whileTap={{ scale: 0.98 }}
              >
                Fermer
              </motion.button>

              <motion.button
                type="button"
                onClick={() => setCreateStep((s) => Math.max(0, s - 1))}
                disabled={createStep === 0}
                className="cpd-btn cpd-btn-outline"
                whileTap={{ scale: 0.98 }}
              >
                Précédent
              </motion.button>
            </div>

            <div className="flex items-center gap-2 sm:justify-end">
              {createStep < 3 ? (
                <motion.button
                  type="button"
                  onClick={() => {
                    if (createStep === 0) {
                      if (!String(form.groom_full_name || '').trim()) {
                        toast.push({ type: 'error', title: 'Champs requis', message: 'Nom du mari requis.' });
                        return;
                      }
                      if (!String(form.bride_full_name || '').trim()) {
                        toast.push({ type: 'error', title: 'Champs requis', message: 'Nom de la mariée requis.' });
                        return;
                      }
                    }
                    setCreateStep((s) => Math.min(3, s + 1));
                  }}
                  className="cpd-btn cpd-btn-solid"
                  whileTap={{ scale: 0.98 }}
                >
                  Suivant
                </motion.button>
              ) : (
                <motion.button
                  type="button"
                  onClick={createRecord}
                  disabled={creating}
                  className="cpd-btn cpd-btn-solid"
                  whileTap={{ scale: 0.98 }}
                >
                  <PlusIcon className="h-5 w-5" />
                  {creating ? 'Enregistrement…' : 'Enregistrer'}
                </motion.button>
              )}
            </div>
          </div>
        </div>
      ) : null}

      <div className="shrink-0 mt-4 cpd-tabs w-full">
        {tabs.map((t) => {
          const isOn = t.key === activeTab;
          const Icon = t.icon;
          return (
            <motion.button
              key={t.key}
              type="button"
              onClick={() => setActiveTab(t.key)}
              className={[
                'cpd-tab',
                isOn ? 'cpd-tab-active' : 'cpd-tab-inactive',
              ].join(' ')}
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.98 }}
            >
              <span className="inline-flex items-center gap-2">
                <Icon className="h-5 w-5 text-gray-500 dark:text-slate-300" />
                <span>{t.label}</span>
              </span>
            </motion.button>
          );
        })}
      </div>

      <div className="mt-4 min-h-0 flex-1 pr-1">
        {loadingRecords ? (
          <div className="text-sm text-gray-600">Chargement…</div>
        ) : (activeTab === 'avenir' ? futureRecords : pastRecords).length === 0 ? (
          <div className="text-sm text-gray-600">Aucun enregistrement.</div>
        ) : (
          <div className="flex flex-col gap-4">
            {(activeTab === 'avenir' ? futureRecords : pastRecords).map((row) => {
              const published = Boolean(row?.dowry_paid && row?.civil_verified && row?.prenuptial_tests && row?.approved);
              const groomLabel = row.groom_name || row.groom_full_name || '—';
              const brideLabel = row.bride_name || row.bride_full_name || '—';
              const hasGodfather = Boolean(
                String(row?.godfather_full_name || '').trim() || row?.godfather_passport_photo || String(row?.godfather_nationality || '').trim()
              );
              const hasGodmother = Boolean(
                String(row?.godmother_full_name || '').trim() || row?.godmother_passport_photo || String(row?.godmother_nationality || '').trim()
              );
              return (
                <div
                  key={row.id}
                  className="cpd-panel p-4"
                >
                  <div className="flex flex-col lg:flex-row lg:items-stretch gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <div className="text-sm text-gray-900 dark:text-white truncate">Mariage #{row.id}</div>
                            {published ? (
                              <span className="inline-flex items-center rounded-full px-2 py-1 text-[11px] border border-emerald-200/70 bg-emerald-50 text-emerald-800 dark:border-white/10 dark:bg-white/10 dark:text-emerald-200">
                                Publié
                              </span>
                            ) : (
                              <span className="inline-flex items-center rounded-full px-2 py-1 text-[11px] border border-gray-200/70 bg-gray-50 text-gray-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200">
                                Brouillon
                              </span>
                            )}
                          </div>

                          <div className="mt-2 flex items-center gap-2">
                            <span className="inline-flex items-center justify-center h-9 w-9 rounded-2xl bg-white dark:bg-white/10 text-gray-700 dark:text-slate-200 border border-gray-200/70 dark:border-white/10 shadow-sm">
                              <HeartIcon className="h-5 w-5" />
                            </span>
                            <div className="min-w-0">
                              <div className="text-sm text-gray-900 dark:text-white truncate">
                                {groomLabel} <span className="text-gray-400">&</span> {brideLabel}
                              </div>
                              <div className="mt-0.5 text-xs text-gray-600 dark:text-slate-300 truncate">
                                {row.planned_date} • {String(row.planned_time || '').slice(0, 5)} • {row.location || '—'}
                              </div>
                            </div>
                          </div>
                        </div>

                        <motion.button
                          type="button"
                          onClick={() => removeRecord(row)}
                          disabled={!canEdit}
                          className="p-2 rounded-xl bg-white dark:bg-white/10 text-gray-700 dark:text-slate-200 border border-gray-200/70 dark:border-white/10 shadow-sm disabled:opacity-60"
                          whileHover={{ scale: canEdit ? 1.05 : 1 }}
                          whileTap={{ scale: canEdit ? 0.95 : 1 }}
                        >
                          <TrashIcon className="h-5 w-5" />
                        </motion.button>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        {[
                          { key: 'dowry_paid', label: 'Dot' },
                          { key: 'civil_verified', label: 'État civil' },
                          { key: 'prenuptial_tests', label: 'Tests' },
                          { key: 'approved', label: 'Approuvé' },
                        ].map((it) => {
                          const ok = Boolean(row[it.key]);
                          return (
                            <motion.button
                              key={it.key}
                              type="button"
                              onClick={() => (canEdit ? toggle(row, it.key) : null)}
                              disabled={!canEdit}
                              className={[
                                'px-3 py-1 rounded-xl border text-xs shadow-sm',
                                ok
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-100'
                                  : 'bg-gray-50 text-gray-700 border-gray-200/70 dark:bg-white/5 dark:text-slate-200 dark:border-white/10',
                                'disabled:opacity-60',
                              ].join(' ')}
                              whileHover={{ scale: canEdit ? 1.03 : 1 }}
                              whileTap={{ scale: canEdit ? 0.98 : 1 }}
                            >
                              {it.label}: {ok ? 'Oui' : 'Non'}
                            </motion.button>
                          );
                        })}
                      </div>

                      <div className="mt-3 text-xs">
                        {published ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700">
                            <CheckCircleIcon className="h-4 w-4" />
                            Publié comme programme
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-gray-600 dark:text-slate-300">
                            <XCircleIcon className="h-4 w-4" />
                            Non publié
                          </span>
                        )}
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <motion.button
                          type="button"
                          onClick={() => setViewRow(row)}
                          className="cpd-btn cpd-btn-outline"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <EyeIcon className="h-5 w-5" />
                          Voir
                        </motion.button>

                        <motion.button
                          type="button"
                          onClick={() => openEdit(row)}
                          disabled={!canEdit}
                          className="cpd-btn cpd-btn-solid"
                          whileHover={{ scale: canEdit ? 1.02 : 1 }}
                          whileTap={{ scale: canEdit ? 0.98 : 1 }}
                        >
                          <PencilSquareIcon className="h-5 w-5" />
                          Modifier
                        </motion.button>
                      </div>
                    </div>

                    {published ? (
                      <div className="lg:w-[420px] xl:w-[520px] shrink-0">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-2">
                          <PersonTile
                            title="Mari"
                            name={groomLabel}
                            subtitle={[row.groom_nationality, row.groom_birth_place].filter(Boolean).join(' • ')}
                            photoPath={row.groom_passport_photo}
                            variant="groom"
                          />
                          <PersonTile
                            title="Mariée"
                            name={brideLabel}
                            subtitle={[row.bride_nationality, row.bride_birth_place].filter(Boolean).join(' • ')}
                            photoPath={row.bride_passport_photo}
                            variant="bride"
                          />
                          {hasGodfather ? (
                            <PersonTile
                              title="Parrain"
                              name={row.godfather_full_name}
                              subtitle={row.godfather_nationality}
                              photoPath={row.godfather_passport_photo}
                              variant="godfather"
                            />
                          ) : null}
                          {hasGodmother ? (
                            <PersonTile
                              title="Marraine"
                              name={row.godmother_full_name}
                              subtitle={row.godmother_nationality}
                              photoPath={row.godmother_passport_photo}
                              variant="godmother"
                            />
                          ) : null}
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {viewRow ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setViewRow(null)} />
          <div className="relative w-full max-w-4xl cpd-panel p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-lg text-gray-900 dark:text-white">Fiche mariage #{viewRow.id}</div>
                <div className="mt-1 text-sm text-gray-600 dark:text-slate-300">{viewRow.planned_date} • {String(viewRow.planned_time || '').slice(0, 5)} • {viewRow.location || '—'}</div>
              </div>
              <motion.button
                type="button"
                onClick={() => setViewRow(null)}
                className="cpd-btn cpd-btn-outline"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Fermer
              </motion.button>
            </div>

            <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-3">
              <PersonTile
                title="Mari"
                name={viewRow.groom_name || viewRow.groom_full_name}
                subtitle={[viewRow.groom_birth_date, viewRow.groom_birth_place, viewRow.groom_nationality].filter(Boolean).join(' • ')}
                photoPath={viewRow.groom_passport_photo}
              />
              <PersonTile
                title="Mariée"
                name={viewRow.bride_name || viewRow.bride_full_name}
                subtitle={[viewRow.bride_birth_date, viewRow.bride_birth_place, viewRow.bride_nationality].filter(Boolean).join(' • ')}
                photoPath={viewRow.bride_passport_photo}
              />
              <PersonTile
                title="Parrain"
                name={viewRow.godfather_full_name}
                subtitle={viewRow.godfather_nationality}
                photoPath={viewRow.godfather_passport_photo}
              />
              <PersonTile
                title="Marraine"
                name={viewRow.godmother_full_name}
                subtitle={viewRow.godmother_nationality}
                photoPath={viewRow.godmother_passport_photo}
              />
            </div>
          </div>
        </div>
      ) : null}

      {editRow ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => (savingEdit ? null : setEditRow(null))} />
          <div className="relative w-full max-w-5xl cpd-panel p-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-lg text-gray-900 dark:text-white">Modifier mariage #{editRow.id}</div>
                <div className="mt-1 text-sm text-gray-600 dark:text-slate-300">Champs + photos. Enregistre en une fois.</div>
              </div>
              <div className="flex items-center gap-2">
                <motion.button
                  type="button"
                  onClick={() => setEditRow(null)}
                  disabled={savingEdit}
                  className="cpd-btn cpd-btn-outline"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Annuler
                </motion.button>
                <motion.button
                  type="button"
                  onClick={saveEdit}
                  disabled={savingEdit}
                  className="cpd-btn cpd-btn-solid"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {savingEdit ? 'Enregistrement…' : 'Enregistrer'}
                </motion.button>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 lg:grid-cols-4 gap-3">
              <div className="lg:col-span-2">
                <div className="cpd-label mb-1">Nom complet du mari</div>
                <input value={editRow.groom_full_name} onChange={(e) => setEditRow((p) => ({ ...p, groom_full_name: e.target.value }))} className="cpd-input" />
              </div>
              <div className="lg:col-span-2">
                <div className="cpd-label mb-1">Nom complet de la mariée</div>
                <input value={editRow.bride_full_name} onChange={(e) => setEditRow((p) => ({ ...p, bride_full_name: e.target.value }))} className="cpd-input" />
              </div>

              <div>
                <div className="cpd-label mb-1">Date de naissance (mari)</div>
                <input type="date" value={editRow.groom_birth_date || ''} onChange={(e) => setEditRow((p) => ({ ...p, groom_birth_date: e.target.value }))} className="cpd-input" />
              </div>
              <div>
                <div className="cpd-label mb-1">Lieu de naissance (mari)</div>
                <input value={editRow.groom_birth_place || ''} onChange={(e) => setEditRow((p) => ({ ...p, groom_birth_place: e.target.value }))} className="cpd-input" />
              </div>
              <div>
                <div className="cpd-label mb-1">Nationalité (mari)</div>
                <input value={editRow.groom_nationality || ''} onChange={(e) => setEditRow((p) => ({ ...p, groom_nationality: e.target.value }))} className="cpd-input" />
              </div>
              <div>
                <PhotoPicker
                  label="Photo passeport (mari)"
                  file={editRow.groom_passport_photo}
                  onChange={(file) => setEditRow((p) => ({ ...p, groom_passport_photo: file }))}
                  optional
                  className="rounded-2xl border border-gray-200/70 dark:border-white/10 bg-white/70 dark:bg-white/10 px-3 py-2 shadow-sm"
                />
              </div>

              <div>
                <div className="cpd-label mb-1">Date de naissance (mariée)</div>
                <input type="date" value={editRow.bride_birth_date || ''} onChange={(e) => setEditRow((p) => ({ ...p, bride_birth_date: e.target.value }))} className="cpd-input" />
              </div>
              <div>
                <div className="cpd-label mb-1">Lieu de naissance (mariée)</div>
                <input value={editRow.bride_birth_place || ''} onChange={(e) => setEditRow((p) => ({ ...p, bride_birth_place: e.target.value }))} className="cpd-input" />
              </div>
              <div>
                <div className="cpd-label mb-1">Nationalité (mariée)</div>
                <input value={editRow.bride_nationality || ''} onChange={(e) => setEditRow((p) => ({ ...p, bride_nationality: e.target.value }))} className="cpd-input" />
              </div>
              <div>
                <PhotoPicker
                  label="Photo passeport (mariée)"
                  file={editRow.bride_passport_photo}
                  onChange={(file) => setEditRow((p) => ({ ...p, bride_passport_photo: file }))}
                  optional
                  className="rounded-2xl border border-gray-200/70 dark:border-white/10 bg-white/70 dark:bg-white/10 px-3 py-2 shadow-sm"
                />
              </div>

              <div className="lg:col-span-2">
                <div className="cpd-label mb-1">Nom complet du parrain</div>
                <input value={editRow.godfather_full_name || ''} onChange={(e) => setEditRow((p) => ({ ...p, godfather_full_name: e.target.value }))} className="cpd-input" />
              </div>
              <div>
                <div className="cpd-label mb-1">Nationalité (parrain)</div>
                <input value={editRow.godfather_nationality || ''} onChange={(e) => setEditRow((p) => ({ ...p, godfather_nationality: e.target.value }))} className="cpd-input" />
              </div>
              <div>
                <PhotoPicker
                  label="Photo passeport (parrain)"
                  file={editRow.godfather_passport_photo}
                  onChange={(file) => setEditRow((p) => ({ ...p, godfather_passport_photo: file }))}
                  optional
                  className="rounded-2xl border border-gray-200/70 dark:border-white/10 bg-white/70 dark:bg-white/10 px-3 py-2 shadow-sm"
                />
              </div>

              <div className="lg:col-span-2">
                <div className="cpd-label mb-1">Nom complet de la marraine</div>
                <input value={editRow.godmother_full_name || ''} onChange={(e) => setEditRow((p) => ({ ...p, godmother_full_name: e.target.value }))} className="cpd-input" />
              </div>
              <div>
                <div className="cpd-label mb-1">Nationalité (marraine)</div>
                <input value={editRow.godmother_nationality || ''} onChange={(e) => setEditRow((p) => ({ ...p, godmother_nationality: e.target.value }))} className="cpd-input" />
              </div>
              <div>
                <PhotoPicker
                  label="Photo passeport (marraine)"
                  file={editRow.godmother_passport_photo}
                  onChange={(file) => setEditRow((p) => ({ ...p, godmother_passport_photo: file }))}
                  optional
                  className="rounded-2xl border border-gray-200/70 dark:border-white/10 bg-white/70 dark:bg-white/10 px-3 py-2 shadow-sm"
                />
              </div>

              <div>
                <div className="cpd-label mb-1">Date</div>
                <input type="date" value={editRow.planned_date || ''} onChange={(e) => setEditRow((p) => ({ ...p, planned_date: e.target.value }))} className="cpd-input" />
              </div>
              <div>
                <div className="cpd-label mb-1">Heure</div>
                <input type="time" value={editRow.planned_time || ''} onChange={(e) => setEditRow((p) => ({ ...p, planned_time: e.target.value }))} className="cpd-input" />
              </div>
              <div className="lg:col-span-2">
                <div className="cpd-label mb-1">Lieu</div>
                <input value={editRow.location || ''} onChange={(e) => setEditRow((p) => ({ ...p, location: e.target.value }))} className="cpd-input" />
              </div>

              <div className="lg:col-span-4">
                <div className="cpd-label mb-2">Checklist</div>
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-2">
                  {[
                    { key: 'dowry_paid', label: 'Dot payée' },
                    { key: 'civil_verified', label: 'Vérifié état civil' },
                    { key: 'prenuptial_tests', label: 'Tests prénuptiaux' },
                    { key: 'approved', label: 'Approuvé' },
                  ].map((it) => (
                    <label key={it.key} className="inline-flex items-center gap-2 rounded-xl border border-gray-200/70 dark:border-white/10 bg-white/70 dark:bg-white/10 px-3 py-2">
                      <input type="checkbox" checked={Boolean(editRow[it.key])} onChange={(e) => setEditRow((p) => ({ ...p, [it.key]: e.target.checked }))} />
                      <span className="text-sm text-gray-900 dark:text-white">{it.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
