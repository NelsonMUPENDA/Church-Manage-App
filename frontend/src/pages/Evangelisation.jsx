import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  CalendarIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  PlusIcon,
  TrashIcon,
  UserPlusIcon,
} from '@heroicons/react/24/outline';

import { api } from '../services/apiClient';
import { useToast } from '../components/ToastProvider';
import { useLocation, useNavigate } from 'react-router-dom';
import { useApprovalQueue } from '../contexts/ApprovalQueueProvider';

const TAB_ITEMS = [
  { key: 'bapteme', label: 'Baptême', icon: UserPlusIcon },
  { key: 'activites', label: 'Activités évangéliques', icon: CalendarIcon },
  { key: 'formation', label: 'Formation & Affermissement', icon: CalendarIcon },
];

export default function Evangelisation() {
  const toast = useToast();
  const { addPending } = useApprovalQueue();
  const location = useLocation();
  const navigate = useNavigate();

  const activeTab = useMemo(() => {
    const sp = new URLSearchParams(location.search || '');
    const t = String(sp.get('tab') || 'bapteme').toLowerCase();
    if (TAB_ITEMS.some((x) => x.key === t)) return t;
    return 'bapteme';
  }, [location.search]);

  const setTab = (key) => {
    const sp = new URLSearchParams(location.search || '');
    sp.set('tab', key);
    navigate({ pathname: '/evangelisation', search: `?${sp.toString()}` }, { replace: true });
  };

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

  // Baptême
  const [baptismEvents, setBaptismEvents] = useState([]);
  const [loadingBaptismEvents, setLoadingBaptismEvents] = useState(false);
  const [selectedBaptismEventId, setSelectedBaptismEventId] = useState('');

  const [newBaptism, setNewBaptism] = useState(() => ({
    title: 'Baptême',
    date: new Date().toISOString().slice(0, 10),
    time: '09:00',
    location: '',
  }));
  const [creatingBaptism, setCreatingBaptism] = useState(false);

  const loadBaptismEvents = useCallback(async () => {
    setLoadingBaptismEvents(true);
    try {
      const res = await api.get('/api/baptism-events/');
      const data = Array.isArray(res.data) ? res.data : res.data?.results || [];
      setBaptismEvents(data);
      if (!selectedBaptismEventId && data.length) {
        setSelectedBaptismEventId(String(data[0].id));
      }
    } catch (err) {
      setBaptismEvents([]);
      toast.push({ type: 'error', title: 'Baptême', message: formatApiError(err, 'Impossible de charger.') });
    } finally {
      setLoadingBaptismEvents(false);
    }
  }, [selectedBaptismEventId, toast]);

  useEffect(() => {
    if (activeTab !== 'bapteme') return;
    loadBaptismEvents();
  }, [activeTab, loadBaptismEvents]);

  const selectedBaptismEvent = useMemo(() => {
    return baptismEvents.find((x) => String(x?.id) === String(selectedBaptismEventId)) || null;
  }, [baptismEvents, selectedBaptismEventId]);

  const createBaptism = async () => {
    setCreatingBaptism(true);
    try {
      await api.post('/api/baptism-events/', {
        title: (newBaptism.title || 'Baptême').trim(),
        date: newBaptism.date,
        time: newBaptism.time,
        location: (newBaptism.location || '').trim(),
      });
      toast.push({ type: 'success', title: 'Baptême créé' });
      setNewBaptism({
        title: 'Baptême',
        date: new Date().toISOString().slice(0, 10),
        time: '09:00',
        location: '',
      });
      await loadBaptismEvents();
    } catch (err) {
      toast.push({ type: 'error', title: 'Erreur', message: formatApiError(err, 'Impossible de créer.') });
    } finally {
      setCreatingBaptism(false);
    }
  };

  // Candidats
  const [candidates, setCandidates] = useState([]);
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  const [creatingCandidate, setCreatingCandidate] = useState(false);
  const photoRef = useRef(null);

  const [membersToFollow, setMembersToFollow] = useState([]);
  const [loadingMembersToFollow, setLoadingMembersToFollow] = useState(false);

  const [candidateForm, setCandidateForm] = useState({
    name: '',
    post_name: '',
    address: '',
    phone_number: '',
    place_of_birth: '',
    birth_date: '',
    passport_photo: null,
  });

  const loadCandidates = useCallback(async () => {
    if (!selectedBaptismEventId) {
      setCandidates([]);
      return;
    }
    setLoadingCandidates(true);
    try {
      const res = await api.get('/api/baptism-candidates/', { params: { baptism_event: selectedBaptismEventId } });
      const data = Array.isArray(res.data) ? res.data : res.data?.results || [];
      setCandidates(data);
    } catch (err) {
      setCandidates([]);
      toast.push({ type: 'error', title: 'Candidats', message: formatApiError(err, 'Impossible de charger.') });
    } finally {
      setLoadingCandidates(false);
    }
  }, [selectedBaptismEventId, toast]);

  useEffect(() => {
    if (activeTab !== 'bapteme') return;
    loadCandidates();
  }, [activeTab, loadCandidates]);

  const loadMembersToFollow = useCallback(async () => {
    setLoadingMembersToFollow(true);
    try {
      const res = await api.get('/api/members/');
      const data = Array.isArray(res.data) ? res.data : res.data?.results || [];
      const mapped = data
        .filter((m) => !m?.baptism_date)
        .map((m) => {
          const fullName = [m.user?.first_name, m.post_name, m.user?.last_name].filter(Boolean).join(' ') || m.user?.username || `Membre ${m.id}`;
          return {
            id: m.id,
            memberNumber: m.member_number || '',
            fullName,
            phone: m.user?.phone || '',
            city: m.city || '',
            commune: m.commune || '',
            quarter: m.quarter || '',
          };
        });
      mapped.sort((a, b) => (a.fullName || '').localeCompare(b.fullName || '', 'fr', { sensitivity: 'base' }));
      setMembersToFollow(mapped);
    } catch (err) {
      setMembersToFollow([]);
      toast.push({ type: 'error', title: 'Suivi', message: formatApiError(err, 'Impossible de charger les membres.') });
    } finally {
      setLoadingMembersToFollow(false);
    }
  }, [toast]);

  useEffect(() => {
    if (activeTab !== 'bapteme') return;
    loadMembersToFollow();
  }, [activeTab, loadMembersToFollow]);

  const addCandidate = async () => {
    if (!selectedBaptismEventId) return;
    if (!String(candidateForm.name || '').trim() || !String(candidateForm.post_name || '').trim()) {
      toast.push({ type: 'error', title: 'Champs requis', message: 'Nom et post-nom requis.' });
      return;
    }
    if (!candidateForm.birth_date || !String(candidateForm.place_of_birth || '').trim()) {
      toast.push({ type: 'error', title: 'Champs requis', message: 'Lieu et date de naissance requis.' });
      return;
    }

    setCreatingCandidate(true);
    try {
      const form = new FormData();
      form.append('baptism_event_id', String(selectedBaptismEventId));
      form.append('name', candidateForm.name);
      form.append('post_name', candidateForm.post_name);
      form.append('address', candidateForm.address || '');
      form.append('phone_number', candidateForm.phone_number || '');
      form.append('place_of_birth', candidateForm.place_of_birth);
      form.append('birth_date', candidateForm.birth_date);
      if (candidateForm.passport_photo) form.append('passport_photo', candidateForm.passport_photo);

      await api.post('/api/baptism-candidates/', form);
      toast.push({ type: 'success', title: 'Candidat ajouté' });
      setCandidateForm({ name: '', post_name: '', address: '', phone_number: '', place_of_birth: '', birth_date: '', passport_photo: null });
      if (photoRef.current) photoRef.current.value = '';
      await loadCandidates();
    } catch (err) {
      toast.push({ type: 'error', title: 'Erreur', message: formatApiError(err, 'Impossible de créer.') });
    } finally {
      setCreatingCandidate(false);
    }
  };

  const removeCandidate = async (cand) => {
    if (!cand?.id) return;
    if (!window.confirm('Supprimer ce candidat ?')) return;
    try {
      await api.delete(`/api/baptism-candidates/${cand.id}/`);
      toast.push({ type: 'success', title: 'Supprimé' });
      await loadCandidates();
    } catch (err) {
      toast.push({ type: 'error', title: 'Erreur', message: formatApiError(err, 'Impossible de supprimer.') });
    }
  };

  // Activités évangéliques
  const [evActs, setEvActs] = useState([]);
  const [loadingEvActs, setLoadingEvActs] = useState(false);
  const [creatingEvAct, setCreatingEvAct] = useState(false);
  const [evActForm, setEvActForm] = useState(() => ({
    title: '',
    activity_type: 'field',
    date: new Date().toISOString().slice(0, 10),
    time: '09:00',
    location: '',
  }));

  const loadEvActs = useCallback(async () => {
    setLoadingEvActs(true);
    try {
      const res = await api.get('/api/evangelism-activities/');
      const data = Array.isArray(res.data) ? res.data : res.data?.results || [];
      setEvActs(data);
    } catch (err) {
      setEvActs([]);
      toast.push({ type: 'error', title: 'Activités', message: formatApiError(err, 'Impossible de charger.') });
    } finally {
      setLoadingEvActs(false);
    }
  }, [toast]);

  useEffect(() => {
    if (activeTab !== 'activites') return;
    loadEvActs();
  }, [activeTab, loadEvActs]);

  const createEvAct = async () => {
    if (!String(evActForm.title || '').trim()) {
      toast.push({ type: 'error', title: 'Titre requis', message: "Renseigne le titre de l'activité." });
      return;
    }
    setCreatingEvAct(true);
    try {
      const res = await api.post('/api/evangelism-activities/', {
        title: evActForm.title,
        activity_type: evActForm.activity_type,
        date: evActForm.date,
        time: evActForm.time,
        location: evActForm.location,
      });
      if (res?.status === 202) {
        const approvalId = res?.data?.approval_request_id;
        if (approvalId) addPending({ id: approvalId, model: 'EvangelismActivity', action: 'create' });
        toast.push({ type: 'info', title: 'En attente', message: "Activité soumise à approbation de l'administrateur." });
        setEvActForm({
          title: '',
          activity_type: 'field',
          date: new Date().toISOString().slice(0, 10),
          time: '09:00',
          location: '',
        });
        return;
      }
      toast.push({ type: 'success', title: 'Activité enregistrée' });
      setEvActForm({
        title: '',
        activity_type: 'field',
        date: new Date().toISOString().slice(0, 10),
        time: '09:00',
        location: '',
      });
      await loadEvActs();
    } catch (err) {
      toast.push({ type: 'error', title: 'Erreur', message: formatApiError(err, 'Impossible de créer.') });
    } finally {
      setCreatingEvAct(false);
    }
  };

  const removeEvAct = async (row) => {
    if (!row?.id) return;
    if (!window.confirm('Supprimer cette activité ?')) return;
    try {
      await api.delete(`/api/evangelism-activities/${row.id}/`);
      toast.push({ type: 'success', title: 'Supprimé' });
      await loadEvActs();
    } catch (err) {
      toast.push({ type: 'error', title: 'Erreur', message: formatApiError(err, 'Impossible de supprimer.') });
    }
  };

  // Formations
  const [trainings, setTrainings] = useState([]);
  const [loadingTrainings, setLoadingTrainings] = useState(false);
  const [creatingTraining, setCreatingTraining] = useState(false);
  const [trainingForm, setTrainingForm] = useState(() => ({
    title: '',
    date: new Date().toISOString().slice(0, 10),
    time: '09:00',
    location: '',
    trainer: '',
    lesson: '',
  }));

  const loadTrainings = useCallback(async () => {
    setLoadingTrainings(true);
    try {
      const res = await api.get('/api/training-events/');
      const data = Array.isArray(res.data) ? res.data : res.data?.results || [];
      setTrainings(data);
    } catch (err) {
      setTrainings([]);
      toast.push({ type: 'error', title: 'Formations', message: formatApiError(err, 'Impossible de charger.') });
    } finally {
      setLoadingTrainings(false);
    }
  }, [toast]);

  useEffect(() => {
    if (activeTab !== 'formation') return;
    loadTrainings();
  }, [activeTab, loadTrainings]);

  const createTraining = async () => {
    if (!String(trainingForm.title || '').trim()) {
      toast.push({ type: 'error', title: 'Titre requis', message: 'Renseigne le titre.' });
      return;
    }
    if (!String(trainingForm.trainer || '').trim() || !String(trainingForm.lesson || '').trim()) {
      toast.push({ type: 'error', title: 'Champs requis', message: 'Formateur et leçon requis.' });
      return;
    }

    setCreatingTraining(true);
    try {
      const res = await api.post('/api/training-events/', {
        title: trainingForm.title,
        date: trainingForm.date,
        time: trainingForm.time,
        location: trainingForm.location,
        trainer: trainingForm.trainer,
        lesson: trainingForm.lesson,
      });
      if (res?.status === 202) {
        const approvalId = res?.data?.approval_request_id;
        if (approvalId) addPending({ id: approvalId, model: 'TrainingEvent', action: 'create' });
        toast.push({ type: 'info', title: 'En attente', message: "Formation soumise à approbation de l'administrateur." });
        setTrainingForm({
          title: '',
          date: new Date().toISOString().slice(0, 10),
          time: '09:00',
          location: '',
          trainer: '',
          lesson: '',
        });
        return;
      }
      toast.push({ type: 'success', title: 'Formation enregistrée' });
      setTrainingForm({
        title: '',
        date: new Date().toISOString().slice(0, 10),
        time: '09:00',
        location: '',
        trainer: '',
        lesson: '',
      });
      await loadTrainings();
    } catch (err) {
      toast.push({ type: 'error', title: 'Erreur', message: formatApiError(err, 'Impossible de créer.') });
    } finally {
      setCreatingTraining(false);
    }
  };

  const removeTraining = async (row) => {
    if (!row?.id) return;
    if (!window.confirm('Supprimer cette formation ?')) return;
    try {
      await api.delete(`/api/training-events/${row.id}/`);
      toast.push({ type: 'success', title: 'Supprimé' });
      await loadTrainings();
    } catch (err) {
      toast.push({ type: 'error', title: 'Erreur', message: formatApiError(err, 'Impossible de supprimer.') });
    }
  };

  return (
    <div className="h-full min-h-0 flex flex-col">
      <div className="shrink-0 flex items-start justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Évangélisation</h2>
          <p className="text-gray-600 dark:text-slate-300">Baptême, activités évangéliques, formation & affermissement.</p>
        </div>
      </div>

      <div className="shrink-0 mb-4 cpd-tabs w-full">
        {TAB_ITEMS.map((t) => {
          const isActive = t.key === activeTab;
          const Icon = t.icon;
          return (
            <motion.button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={['cpd-tab', isActive ? 'cpd-tab-active' : 'cpd-tab-inactive'].join(' ')}
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.98 }}
            >
              <Icon className="h-5 w-5 text-gray-500 dark:text-slate-300" />
              {t.label}
            </motion.button>
          );
        })}
      </div>

      <div className="min-h-0 flex-1 pr-1">
        <AnimatePresence mode="wait">
          {activeTab === 'bapteme' ? (
            <motion.div key="tab-bapteme" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="bg-white/80 backdrop-blur-md border border-white/60 rounded-2xl shadow p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="text-sm font-extrabold text-gray-900">Créer un baptême</div>
                    <motion.button
                      type="button"
                      onClick={createBaptism}
                      disabled={creatingBaptism}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow hover:shadow-lg disabled:opacity-60"
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <PlusIcon className="h-5 w-5" />
                      {creatingBaptism ? 'Création…' : 'Créer'}
                    </motion.button>
                  </div>

                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input
                      value={newBaptism.title}
                      onChange={(e) => setNewBaptism((f) => ({ ...f, title: e.target.value }))}
                      className="w-full rounded-xl border border-gray-200 bg-white/80 px-3 py-2"
                      placeholder="Titre"
                    />
                    <input
                      value={newBaptism.moderator}
                      onChange={(e) => setNewBaptism((f) => ({ ...f, moderator: e.target.value }))}
                      className="w-full rounded-xl border border-gray-200 bg-white/80 px-3 py-2"
                      placeholder="Exécutant principal"
                    />
                    <input
                      value={newBaptism.location}
                      onChange={(e) => setNewBaptism((f) => ({ ...f, location: e.target.value }))}
                      className="w-full rounded-xl border border-gray-200 bg-white/80 px-3 py-2"
                      placeholder="Lieu"
                    />
                    <input
                      value={newBaptism.executors}
                      onChange={(e) => setNewBaptism((f) => ({ ...f, executors: e.target.value }))}
                      className="w-full rounded-xl border border-gray-200 bg-white/80 px-3 py-2"
                      placeholder="Exécutants (max 5) : nom1, nom2, ..."
                    />
                    <input
                      type="date"
                      value={newBaptism.date}
                      onChange={(e) => setNewBaptism((f) => ({ ...f, date: e.target.value }))}
                      className="w-full rounded-xl border border-gray-200 bg-white/80 px-3 py-2"
                    />
                    <input
                      type="time"
                      value={newBaptism.time}
                      onChange={(e) => setNewBaptism((f) => ({ ...f, time: e.target.value }))}
                      className="w-full rounded-xl border border-gray-200 bg-white/80 px-3 py-2"
                    />
                  </div>
                </div>

                <div className="bg-white/80 backdrop-blur-md border border-white/60 rounded-2xl shadow p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-extrabold text-gray-900">Baptême sélectionné</div>
                      <div className="text-xs text-gray-600">Choisis l’évènement pour ajouter des candidats.</div>
                    </div>
                  </div>

                  <div className="mt-4">
                    <select
                      value={selectedBaptismEventId}
                      onChange={(e) => setSelectedBaptismEventId(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 bg-white/80 px-3 py-2"
                      disabled={loadingBaptismEvents}
                    >
                      <option value="">Sélectionner…</option>
                      {baptismEvents.map((be) => {
                        const ev = be?.event;
                        const label = `${ev?.date || ''} • ${String(ev?.time || '').slice(0, 5)} • ${ev?.title || 'Baptême'}`.trim();
                        return (
                          <option key={be.id} value={String(be.id)}>
                            {label}
                          </option>
                        );
                      })}
                    </select>

                    {selectedBaptismEvent ? (
                      <div className="mt-3 text-sm text-gray-700">
                        <div className="font-semibold text-gray-900">{selectedBaptismEvent?.event?.title || 'Baptême'}</div>
                        <div>
                          {selectedBaptismEvent?.event?.date || '—'} • {String(selectedBaptismEvent?.event?.time || '').slice(0, 5) || '—'}
                        </div>
                        <div>Lieu: {selectedBaptismEvent?.event?.location || '—'}</div>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="mt-4 bg-white/80 backdrop-blur-md border border-white/60 rounded-2xl shadow p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-extrabold text-gray-900">Suivi évangélisation</div>
                    <div className="text-xs text-gray-600">Membres non baptisés à suivre.</div>
                  </div>
                  <div className="shrink-0 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-50 text-amber-800 border border-amber-100">
                    <ExclamationTriangleIcon className="h-5 w-5" />
                    <div className="text-sm font-bold">{loadingMembersToFollow ? '…' : membersToFollow.length}</div>
                  </div>
                </div>

                <div className="mt-4">
                  {loadingMembersToFollow ? (
                    <div className="text-sm text-gray-600">Chargement…</div>
                  ) : membersToFollow.length === 0 ? (
                    <div className="text-sm text-gray-600">Aucun membre à suivre.</div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {membersToFollow.map((m) => (
                        <div key={m.id} className="rounded-2xl border border-amber-100 bg-amber-50/40 p-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="text-sm font-extrabold text-gray-900 truncate">{m.fullName}</div>
                              <div className="mt-1 text-xs text-gray-700 truncate">N° {m.memberNumber || m.id}</div>
                              {m.phone ? <div className="mt-1 text-xs text-gray-700 truncate">Tél: {m.phone}</div> : null}
                              {[m.city, m.commune, m.quarter].filter(Boolean).length ? (
                                <div className="mt-1 text-xs text-gray-600 truncate">{[m.city, m.commune, m.quarter].filter(Boolean).join(' • ')}</div>
                              ) : null}
                            </div>
                            <div className="shrink-0 p-2 rounded-xl bg-amber-100 text-amber-800 border border-amber-200">
                              <ExclamationTriangleIcon className="h-5 w-5" />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 bg-white/80 backdrop-blur-md border border-white/60 rounded-2xl shadow p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-extrabold text-gray-900">Candidats</div>
                    <div className="text-xs text-gray-600">Enregistrer les personnes à baptiser (photo passeport optionnelle).</div>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 lg:grid-cols-7 gap-3">
                  <input
                    value={candidateForm.name}
                    onChange={(e) => setCandidateForm((f) => ({ ...f, name: e.target.value }))}
                    className="w-full rounded-xl border border-gray-200 bg-white/80 px-3 py-2"
                    placeholder="Nom"
                    disabled={!selectedBaptismEventId}
                  />
                  <input
                    value={candidateForm.post_name}
                    onChange={(e) => setCandidateForm((f) => ({ ...f, post_name: e.target.value }))}
                    className="w-full rounded-xl border border-gray-200 bg-white/80 px-3 py-2"
                    placeholder="Post-nom"
                    disabled={!selectedBaptismEventId}
                  />
                  <input
                    value={candidateForm.address}
                    onChange={(e) => setCandidateForm((f) => ({ ...f, address: e.target.value }))}
                    className="w-full rounded-xl border border-gray-200 bg-white/80 px-3 py-2"
                    placeholder="Adresse"
                    disabled={!selectedBaptismEventId}
                  />
                  <input
                    value={candidateForm.phone_number}
                    onChange={(e) => setCandidateForm((f) => ({ ...f, phone_number: e.target.value }))}
                    className="w-full rounded-xl border border-gray-200 bg-white/80 px-3 py-2"
                    placeholder="Téléphone"
                    disabled={!selectedBaptismEventId}
                  />
                  <input
                    value={candidateForm.place_of_birth}
                    onChange={(e) => setCandidateForm((f) => ({ ...f, place_of_birth: e.target.value }))}
                    className="w-full rounded-xl border border-gray-200 bg-white/80 px-3 py-2"
                    placeholder="Lieu de naissance"
                    disabled={!selectedBaptismEventId}
                  />
                  <input
                    type="date"
                    value={candidateForm.birth_date}
                    onChange={(e) => setCandidateForm((f) => ({ ...f, birth_date: e.target.value }))}
                    className="w-full rounded-xl border border-gray-200 bg-white/80 px-3 py-2"
                    disabled={!selectedBaptismEventId}
                  />

                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 min-w-0">
                    <input
                      ref={photoRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => setCandidateForm((f) => ({ ...f, passport_photo: e.target.files?.[0] || null }))}
                      className="block w-full text-sm min-w-0"
                      disabled={!selectedBaptismEventId}
                    />
                    <motion.button
                      type="button"
                      onClick={addCandidate}
                      disabled={!selectedBaptismEventId || creatingCandidate}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow hover:shadow-lg disabled:opacity-60"
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <CheckCircleIcon className="h-5 w-5" />
                      {creatingCandidate ? '…' : 'Ajouter'}
                    </motion.button>
                  </div>
                </div>

                <div className="mt-4">
                  {loadingCandidates ? (
                    <div className="text-sm text-gray-600">Chargement…</div>
                  ) : candidates.length === 0 ? (
                    <div className="text-sm text-gray-600">Aucun candidat.</div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {candidates.map((c) => {
                        const label = `${c?.name || ''} ${c?.post_name || ''}`.trim();
                        return (
                          <div key={c.id} className="rounded-2xl border border-gray-200 bg-white/70 p-3">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="text-sm font-extrabold text-gray-900 truncate">{label || '—'}</div>
                                <div className="mt-1 text-xs text-gray-600">{c?.birth_date || '—'} • {c?.place_of_birth || '—'}</div>
                                {c?.address ? <div className="mt-1 text-xs text-gray-600">Adresse: {c.address}</div> : null}
                                {c?.phone_number ? <div className="mt-1 text-xs text-gray-600">Téléphone: {c.phone_number}</div> : null}
                              </div>
                              <motion.button
                                type="button"
                                onClick={() => removeCandidate(c)}
                                className="p-2 rounded-xl bg-rose-50 text-rose-700 border border-rose-100"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                <TrashIcon className="h-5 w-5" />
                              </motion.button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ) : activeTab === 'activites' ? (
            <motion.div key="tab-activites" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
              <div className="bg-white/80 backdrop-blur-md border border-white/60 rounded-2xl shadow p-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <div className="text-sm font-extrabold text-gray-900">Planifier une activité</div>
                    <div className="text-xs text-gray-600">Descente sur terrain / réunion de prière.</div>
                  </div>
                  <motion.button
                    type="button"
                    onClick={createEvAct}
                    disabled={creatingEvAct}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow hover:shadow-lg disabled:opacity-60"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <PlusIcon className="h-5 w-5" />
                    {creatingEvAct ? 'Enregistrement…' : 'Enregistrer'}
                  </motion.button>
                </div>

                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3 min-w-0">
                  <input
                    value={evActForm.title}
                    onChange={(e) => setEvActForm((f) => ({ ...f, title: e.target.value }))}
                    className="w-full min-w-0 rounded-xl border border-gray-200 bg-white/80 px-3 py-2"
                    placeholder="Titre"
                  />
                  <input
                    value={evActForm.moderator}
                    onChange={(e) => setEvActForm((f) => ({ ...f, moderator: e.target.value }))}
                    className="w-full min-w-0 rounded-xl border border-gray-200 bg-white/80 px-3 py-2"
                    placeholder="Modérateur"
                  />
                  <select
                    value={evActForm.activity_type}
                    onChange={(e) => setEvActForm((f) => ({ ...f, activity_type: e.target.value }))}
                    className="w-full min-w-0 rounded-xl border border-gray-200 bg-white/80 px-3 py-2"
                  >
                    <option value="field">Descente sur terrain</option>
                    <option value="prayer">Réunion de prière</option>
                  </select>
                  <input
                    type="date"
                    value={evActForm.date}
                    onChange={(e) => setEvActForm((f) => ({ ...f, date: e.target.value }))}
                    className="w-full min-w-0 rounded-xl border border-gray-200 bg-white/80 px-3 py-2"
                  />
                  <input
                    type="time"
                    value={evActForm.time}
                    onChange={(e) => setEvActForm((f) => ({ ...f, time: e.target.value }))}
                    className="w-full min-w-0 rounded-xl border border-gray-200 bg-white/80 px-3 py-2"
                  />
                  <input
                    value={evActForm.location}
                    onChange={(e) => setEvActForm((f) => ({ ...f, location: e.target.value }))}
                    className="w-full min-w-0 rounded-xl border border-gray-200 bg-white/80 px-3 py-2"
                    placeholder="Lieu"
                  />
                </div>
              </div>

              <div className="mt-4">
                {loadingEvActs ? (
                  <div className="text-sm text-gray-600">Chargement…</div>
                ) : evActs.length === 0 ? (
                  <div className="text-sm text-gray-600">Aucune activité.</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {evActs.map((row) => (
                      <div key={row.id} className="rounded-2xl border border-white/60 dark:border-white/10 bg-white/70 dark:bg-white/5 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-sm font-extrabold text-gray-900 dark:text-white truncate">{row.title}</div>
                            <div className="mt-1 text-xs text-gray-600 dark:text-slate-300">{row.date} • {String(row.time || '').slice(0, 5)} • {row.location}</div>
                            <div className="mt-1 text-xs text-gray-500 dark:text-slate-400">{row.activity_type === 'prayer' ? 'Réunion de prière' : 'Descente sur terrain'}</div>
                          </div>
                          <motion.button
                            type="button"
                            onClick={() => removeEvAct(row)}
                            className="p-2 rounded-xl bg-rose-50 text-rose-700 border border-rose-100"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <TrashIcon className="h-5 w-5" />
                          </motion.button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div key="tab-formation" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
              <div className="bg-white/80 backdrop-blur-md border border-white/60 rounded-2xl shadow p-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <div className="text-sm font-extrabold text-gray-900">Planifier une formation</div>
                    <div className="text-xs text-gray-600">Lieu, date/heure, formateur, leçon.</div>
                  </div>
                  <motion.button
                    type="button"
                    onClick={createTraining}
                    disabled={creatingTraining}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow hover:shadow-lg disabled:opacity-60"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <PlusIcon className="h-5 w-5" />
                    {creatingTraining ? 'Enregistrement…' : 'Enregistrer'}
                  </motion.button>
                </div>

                <div className="mt-4 grid grid-cols-1 md:grid-cols-6 gap-3 min-w-0">
                  <input
                    value={trainingForm.title}
                    onChange={(e) => setTrainingForm((f) => ({ ...f, title: e.target.value }))}
                    className="md:col-span-2 w-full min-w-0 rounded-xl border border-gray-200 bg-white/80 px-3 py-2"
                    placeholder="Titre"
                  />
                  <input
                    type="date"
                    value={trainingForm.date}
                    onChange={(e) => setTrainingForm((f) => ({ ...f, date: e.target.value }))}
                    className="w-full min-w-0 rounded-xl border border-gray-200 bg-white/80 px-3 py-2"
                  />
                  <input
                    type="time"
                    value={trainingForm.time}
                    onChange={(e) => setTrainingForm((f) => ({ ...f, time: e.target.value }))}
                    className="w-full min-w-0 rounded-xl border border-gray-200 bg-white/80 px-3 py-2"
                  />
                  <input
                    value={trainingForm.location}
                    onChange={(e) => setTrainingForm((f) => ({ ...f, location: e.target.value }))}
                    className="w-full min-w-0 rounded-xl border border-gray-200 bg-white/80 px-3 py-2"
                    placeholder="Lieu"
                  />
                  <input
                    value={trainingForm.trainer}
                    onChange={(e) => setTrainingForm((f) => ({ ...f, trainer: e.target.value }))}
                    className="w-full min-w-0 rounded-xl border border-gray-200 bg-white/80 px-3 py-2"
                    placeholder="Formateur"
                  />
                  <input
                    value={trainingForm.lesson}
                    onChange={(e) => setTrainingForm((f) => ({ ...f, lesson: e.target.value }))}
                    className="md:col-span-3 w-full min-w-0 rounded-xl border border-gray-200 bg-white/80 px-3 py-2"
                    placeholder="Leçon"
                  />
                </div>
              </div>

              <div className="mt-4">
                {loadingTrainings ? (
                  <div className="text-sm text-gray-600">Chargement…</div>
                ) : trainings.length === 0 ? (
                  <div className="text-sm text-gray-600">Aucune formation.</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {trainings.map((row) => (
                      <div key={row.id} className="rounded-2xl border border-white/60 dark:border-white/10 bg-white/70 dark:bg-white/5 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-sm font-extrabold text-gray-900 dark:text-white truncate">{row.title}</div>
                            <div className="mt-1 text-xs text-gray-600 dark:text-slate-300">{row.date} • {String(row.time || '').slice(0, 5)} • {row.location}</div>
                            <div className="mt-1 text-xs text-gray-500 dark:text-slate-400">Formateur: {row.trainer}</div>
                            <div className="mt-1 text-xs text-gray-500 dark:text-slate-400">Leçon: {row.lesson}</div>
                          </div>
                          <motion.button
                            type="button"
                            onClick={() => removeTraining(row)}
                            className="p-2 rounded-xl bg-rose-50 text-rose-700 border border-rose-100"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <TrashIcon className="h-5 w-5" />
                          </motion.button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
