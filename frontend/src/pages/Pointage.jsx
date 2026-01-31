import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  CheckCircleIcon,
  MinusIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';

import { api } from '../services/apiClient';
import { useToast } from '../components/ToastProvider';
import { useAuth } from '../contexts/AuthProvider';

export default function Pointage() {
  const toast = useToast();
  const { user } = useAuth();

  const rawRole = user?.is_superuser ? 'super_admin' : user?.is_staff ? 'admin' : user?.role;
  const role = rawRole === 'administrator' ? 'admin' : rawRole === 'pastor' ? 'super_admin' : rawRole;
  const departmentName = String(user?.department_name || '').toLowerCase();
  const canLogistics = useMemo(() => {
    if (role === 'admin' || role === 'super_admin') return true;
    if (role === 'logistics_head') return true;
    if (role === 'department_head' && (departmentName.includes('logist') || departmentName.includes('logistique'))) return true;
    return false;
  }, [departmentName, role]);

  const [events, setEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [eventsError, setEventsError] = useState('');
  const [selectedEventId, setSelectedEventId] = useState('');

  const [allEvents, setAllEvents] = useState([]);
  const [loadingAllEvents, setLoadingAllEvents] = useState(false);

  const selectedEvent = useMemo(() => {
    return events.find((e) => String(e.id) === String(selectedEventId)) || null;
  }, [events, selectedEventId]);

  const isDepartmentMeeting = useMemo(() => {
    if (!selectedEvent) return false;
    if (selectedEvent.event_type !== 'department_meeting') return false;
    return !!selectedEvent.department;
  }, [selectedEvent]);

  const [agg, setAgg] = useState({ male_adults: 0, female_adults: 0, male_children: 0, female_children: 0 });
  const [savingAgg, setSavingAgg] = useState(false);

  const [visitors, setVisitors] = useState({ male_visitors: 0, female_visitors: 0 });
  const [savingVisitors, setSavingVisitors] = useState(false);

  const [savingAll, setSavingAll] = useState(false);

  const [logisticsItems, setLogisticsItems] = useState([]);
  const [loadingLogisticsItems, setLoadingLogisticsItems] = useState(false);
  const [consumptionMap, setConsumptionMap] = useState({});
  const [savingConsumption, setSavingConsumption] = useState(false);
  const [consumptionRows, setConsumptionRows] = useState([]);

  const [deptMembers, setDeptMembers] = useState([]);
  const [deptPresentMap, setDeptPresentMap] = useState({});
  const [loadingDept, setLoadingDept] = useState(false);

  const formatApiError = useCallback((err, fallback) => {
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
  }, []);



  const loadAllPrograms = useCallback(async () => {
    setLoadingAllEvents(true);
    try {
      const res = await api.get('/api/events/');
      const data = Array.isArray(res.data) ? res.data : res.data?.results || [];
      setAllEvents(data);
    } catch (err) {
      setAllEvents([]);
      toast.push({ type: 'error', title: 'Programmes', message: formatApiError(err, 'Impossible de charger les programmes.') });
    } finally {
      setLoadingAllEvents(false);
    }
  }, [formatApiError, toast]);

  const loadLogisticsItems = useCallback(async () => {
    if (!canLogistics) {
      setLogisticsItems([]);
      return;
    }
    setLoadingLogisticsItems(true);
    try {
      const res = await api.get('/api/logistics-items/');
      const data = Array.isArray(res.data) ? res.data : res.data?.results || [];
      const out = (data || []).filter((x) => x?.is_active !== false);
      out.sort((a, b) => String(a?.name || '').localeCompare(String(b?.name || ''), 'fr', { sensitivity: 'base' }));
      setLogisticsItems(out);
    } catch (err) {
      setLogisticsItems([]);
      toast.push({ type: 'error', title: 'Logistique', message: formatApiError(err, 'Impossible de charger les matériels.') });
    } finally {
      setLoadingLogisticsItems(false);
    }
  }, [canLogistics, formatApiError, toast]);

  useEffect(() => {
    loadAllPrograms();
  }, [loadAllPrograms]);

  useEffect(() => {
    loadLogisticsItems();
  }, [loadLogisticsItems]);

  useEffect(() => {
    setEventsError('');
  }, []);

  useEffect(() => {
    const data = Array.isArray(allEvents) ? [...allEvents] : [];
    data.sort((a, b) => {
      const d = String(a?.date || '').localeCompare(String(b?.date || ''));
      if (d !== 0) return d;
      return String(a?.time || '').localeCompare(String(b?.time || ''));
    });
    setEvents(data);
    if (!selectedEventId && data.length) setSelectedEventId(String(data[0].id));
  }, [allEvents, selectedEventId]);

  const loadAttendanceForEvent = useCallback(async (eventId) => {
    if (!eventId) {
      setAgg({ male_adults: 0, female_adults: 0, male_children: 0, female_children: 0 });
      setVisitors({ male_visitors: 0, female_visitors: 0 });
      setConsumptionMap({});
      setConsumptionRows([]);
      setDeptMembers([]);
      setDeptPresentMap({});
      return;
    }

    setDeptMembers([]);
    setDeptPresentMap({});

    try {
      const aggRes = await api.get(`/api/events/${eventId}/attendance-aggregate/`);
      setAgg({
        male_adults: Number(aggRes.data?.male_adults ?? 0),
        female_adults: Number(aggRes.data?.female_adults ?? 0),
        male_children: Number(aggRes.data?.male_children ?? 0),
        female_children: Number(aggRes.data?.female_children ?? 0),
      });
    } catch {
      setAgg({ male_adults: 0, female_adults: 0, male_children: 0, female_children: 0 });
    }

    try {
      const res = await api.get(`/api/events/${eventId}/visitor-aggregate/`);
      setVisitors({
        male_visitors: Number(res.data?.male_visitors ?? 0),
        female_visitors: Number(res.data?.female_visitors ?? 0),
      });
    } catch {
      setVisitors({ male_visitors: 0, female_visitors: 0 });
    }

    if (canLogistics) {
      try {
        const res = await api.get(`/api/events/${eventId}/logistics-consumption/`);
        const items = Array.isArray(res.data?.items) ? res.data.items : [];
        const next = {};
        items.forEach((r) => {
          const id = r?.item;
          if (!id) return;
          next[String(id)] = Number(r?.quantity_used ?? 0);
        });
        setConsumptionMap(next);
        setConsumptionRows(Object.keys(next));
      } catch {
        setConsumptionMap({});
        setConsumptionRows([]);
      }
    } else {
      setConsumptionMap({});
      setConsumptionRows([]);
    }

    const ev = events.find((e) => String(e.id) === String(eventId));
    if (ev?.department) {
      setLoadingDept(true);
      try {
        const [membersRes, presentRes] = await Promise.all([
          api.get(`/api/events/${eventId}/department-members/`),
          api.get('/api/attendance/', { params: { event: eventId, attended: 1 } }),
        ]);
        const members = membersRes.data?.members || [];
        const attendances = Array.isArray(presentRes.data) ? presentRes.data : presentRes.data?.results || [];
        const present = {};
        attendances.forEach((a) => {
          if (a?.member) present[String(a.member)] = true;
        });
        setDeptMembers(members);
        setDeptPresentMap(present);
      } catch {
        setDeptMembers([]);
        setDeptPresentMap({});
      } finally {
        setLoadingDept(false);
      }
    }
  }, [canLogistics, events]);

  useEffect(() => {
    loadAttendanceForEvent(selectedEventId);
  }, [loadAttendanceForEvent, selectedEventId]);

  const adjustAgg = (k, delta) => {
    setAgg((a) => {
      const next = { ...a };
      const cur = Number(next[k] || 0);
      next[k] = Math.max(0, cur + delta);
      return next;
    });
  };

  const saveAggregate = async () => {
    if (!selectedEventId) return;
    setSavingAgg(true);
    try {
      await api.post(`/api/events/${selectedEventId}/attendance-aggregate/`, {
        male_adults: Number(agg.male_adults || 0),
        female_adults: Number(agg.female_adults || 0),
        male_children: Number(agg.male_children || 0),
        female_children: Number(agg.female_children || 0),
      });
      toast.push({ type: 'success', title: 'Pointage enregistré' });
    } catch (err) {
      toast.push({ type: 'error', title: 'Erreur', message: formatApiError(err, "Impossible d'enregistrer le pointage.") });
    } finally {
      setSavingAgg(false);
    }
  };

  const adjustVisitors = (k, delta) => {
    setVisitors((a) => {
      const next = { ...a };
      const cur = Number(next[k] || 0);
      next[k] = Math.max(0, cur + delta);
      return next;
    });
  };

  const saveVisitors = async () => {
    if (!selectedEventId) return;
    setSavingVisitors(true);
    try {
      await api.post(`/api/events/${selectedEventId}/visitor-aggregate/`, {
        male_visitors: Number(visitors.male_visitors || 0),
        female_visitors: Number(visitors.female_visitors || 0),
      });
      toast.push({ type: 'success', title: 'Visiteurs enregistrés' });
    } catch (err) {
      toast.push({ type: 'error', title: 'Erreur', message: formatApiError(err, "Impossible d'enregistrer les visiteurs.") });
    } finally {
      setSavingVisitors(false);
    }
  };

  const adjustConsumption = (itemId, delta) => {
    const idStr = String(itemId);
    const item = logisticsItems.find((x) => String(x?.id) === idStr);
    const stock = Number(item?.quantity ?? 0);

    setConsumptionMap((m) => {
      const next = { ...(m || {}) };
      const cur = Number(next[idStr] || 0);
      let val = Math.max(0, cur + delta);
      if (Number.isFinite(stock) && stock >= 0) val = Math.min(stock, val);
      next[idStr] = val;
      return next;
    });
  };

  const addConsumptionRow = () => {
    if (!selectedEventId) return;
    const current = consumptionRows.map((x) => String(x));
    const pick = (logisticsItems || []).find((x) => x?.id && !current.includes(String(x.id)));
    const idStr = pick?.id ? String(pick.id) : '';
    if (!idStr) {
      toast.push({ type: 'error', title: 'Consommation', message: 'Tous les articles sont déjà ajoutés.' });
      return;
    }

    setConsumptionRows((rows) => {
      const cur = Array.isArray(rows) ? rows : [];
      if (cur.includes(idStr)) return cur;
      return [...cur, idStr];
    });
    setConsumptionMap((m) => {
      const next = { ...(m || {}) };
      if (next[idStr] === undefined) next[idStr] = 0;
      return next;
    });
  };

  const removeConsumptionRow = (idStr) => {
    setConsumptionRows((rows) => (Array.isArray(rows) ? rows.filter((x) => String(x) !== String(idStr)) : []));
    setConsumptionMap((m) => {
      const next = { ...(m || {}) };
      delete next[String(idStr)];
      return next;
    });
  };

  const setConsumptionRowItem = (oldIdStr, newIdStr) => {
    const from = String(oldIdStr);
    const to = String(newIdStr);
    if (!to) return;

    setConsumptionRows((rows) => {
      const cur = Array.isArray(rows) ? rows : [];
      const out = cur.map((x) => (String(x) === from ? to : String(x)));
      return Array.from(new Set(out));
    });

    setConsumptionMap((m) => {
      const next = { ...(m || {}) };
      const val = Number(next[from] || 0);
      delete next[from];
      if (next[to] === undefined) next[to] = val;
      return next;
    });
  };

  const saveConsumption = async () => {
    if (!canLogistics) {
      toast.push({ type: 'error', title: 'Logistique', message: 'Accès logistique non autorisé.' });
      return;
    }
    if (!selectedEventId) return;
    setSavingConsumption(true);
    try {
      const items = Object.entries(consumptionMap || {}).map(([item, quantity_used]) => ({
        item: Number(item),
        quantity_used: Number(quantity_used || 0),
      }));

      await api.post(`/api/events/${selectedEventId}/logistics-consumption/`, { items });
      toast.push({ type: 'success', title: 'Consommation enregistrée' });
    } catch (err) {
      toast.push({ type: 'error', title: 'Erreur', message: formatApiError(err, "Impossible d'enregistrer la consommation.") });
    } finally {
      setSavingConsumption(false);
    }
  };

  const saveAll = async () => {
    if (!selectedEventId) {
      toast.push({ type: 'error', title: 'Programme requis', message: 'Sélectionne un programme.' });
      return;
    }
    setSavingAll(true);
    try {
      await api.post(`/api/events/${selectedEventId}/attendance-aggregate/`, {
        male_adults: Number(agg.male_adults || 0),
        female_adults: Number(agg.female_adults || 0),
        male_children: Number(agg.male_children || 0),
        female_children: Number(agg.female_children || 0),
      });

      await api.post(`/api/events/${selectedEventId}/visitor-aggregate/`, {
        male_visitors: Number(visitors.male_visitors || 0),
        female_visitors: Number(visitors.female_visitors || 0),
      });

      if (canLogistics) {
        const items = Object.entries(consumptionMap || {}).map(([item, quantity_used]) => ({
          item: Number(item),
          quantity_used: Number(quantity_used || 0),
        }));
        await api.post(`/api/events/${selectedEventId}/logistics-consumption/`, { items });
      }

      toast.push({ type: 'success', title: 'Fiche enregistrée' });
    } catch (err) {
      toast.push({ type: 'error', title: 'Erreur', message: formatApiError(err, "Impossible d'enregistrer la fiche.") });
    } finally {
      setSavingAll(false);
    }
  };

  const toggleDeptMember = async (memberId, attended) => {
    if (!selectedEventId) return;
    const idStr = String(memberId);
    setDeptPresentMap((m) => ({ ...m, [idStr]: !!attended }));
    try {
      await api.post(`/api/events/${selectedEventId}/department-checkin/`, { member_id: memberId, attended: !!attended });
    } catch {
      setDeptPresentMap((m) => ({ ...m, [idStr]: !attended }));
      toast.push({ type: 'error', title: 'Erreur', message: 'Impossible de pointer ce membre.' });
    }
  };

  const totalAnon =
    Number(agg.male_adults || 0) + Number(agg.female_adults || 0) + Number(agg.male_children || 0) + Number(agg.female_children || 0);

  const totalVisitors = Number(visitors.male_visitors || 0) + Number(visitors.female_visitors || 0);

  return (
    <div className="h-full min-h-0 flex flex-col">
      <div className="shrink-0 mb-4">
        <h2 className="text-xl font-extrabold text-gray-900">Pointage</h2>
        <p className="text-gray-600">Fiche unique: visiteurs et participants anonymes.</p>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1">
        <div className="min-h-[calc(100vh-12rem)] bg-white/80 backdrop-blur-md border border-white/60 rounded-2xl shadow p-4">
          <div className="flex flex-col lg:flex-row lg:items-end gap-3 justify-between">
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-gray-600 mb-1">Programme</div>
              <select
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white/70 px-3 py-2"
                disabled={loadingEvents}
              >
                <option value="">Sélectionner...</option>
                {events.map((ev) => (
                  <option key={ev.id} value={String(ev.id)}>
                    {ev.date} • {String(ev.time || '').slice(0, 5)} • {ev.title}
                  </option>
                ))}
              </select>
              {selectedEvent ? (
                <div className="mt-3 text-sm text-gray-700">
                  <div className="font-semibold text-gray-900">{selectedEvent.title}</div>
                  <div>{selectedEvent.date} • {String(selectedEvent.time || '').slice(0, 5)} • {selectedEvent.event_type}</div>
                  <div>Lieu: {selectedEvent.location || '—'}</div>
                </div>
              ) : null}
            </div>

            <div className="flex items-center gap-2 flex-wrap justify-end">
              <motion.button
                type="button"
                onClick={saveAll}
                disabled={!selectedEventId || savingAll || savingAgg || savingVisitors || savingConsumption}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
                whileHover={{ scale: !savingAll && !savingAgg && !savingVisitors && !savingConsumption ? 1.03 : 1 }}
                whileTap={{ scale: !savingAll && !savingAgg && !savingVisitors && !savingConsumption ? 0.98 : 1 }}
              >
                <CheckCircleIcon className="h-5 w-5" />
                {savingAll ? 'Enregistrement…' : 'Enregistrer'}
              </motion.button>
            </div>
          </div>

          {eventsError ? (
            <div className="mt-3 bg-rose-50 text-rose-700 border border-rose-100 rounded-xl p-3 whitespace-pre-wrap">{eventsError}</div>
          ) : null}

          <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-white/60 bg-white/70 p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-gray-600">Pointage visiteurs</div>
                  <div className="text-3xl font-bold text-gray-900">{totalVisitors}</div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  { key: 'male_visitors', label: 'Hommes visiteurs' },
                  { key: 'female_visitors', label: 'Femmes visiteurs' },
                ].map((row) => (
                  <div key={row.key} className="p-3 rounded-xl bg-purple-50">
                    <div className="text-xs font-semibold text-purple-800">{row.label}</div>
                    <div className="mt-2 flex items-center justify-between">
                      <motion.button
                        type="button"
                        onClick={() => adjustVisitors(row.key, -1)}
                        disabled={!selectedEventId}
                        className="p-2 rounded-lg bg-white/80 border border-white/60 text-purple-900 shadow disabled:opacity-60"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <MinusIcon className="h-5 w-5" />
                      </motion.button>
                      <div className="text-2xl font-bold text-purple-900">{Number(visitors[row.key] || 0)}</div>
                      <motion.button
                        type="button"
                        onClick={() => adjustVisitors(row.key, 1)}
                        disabled={!selectedEventId}
                        className="p-2 rounded-lg bg-white/80 border border-white/60 text-purple-900 shadow disabled:opacity-60"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <PlusIcon className="h-5 w-5" />
                      </motion.button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-white/60 bg-white/70 p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-gray-600">Pointage participants (anonymes)</div>
                  <div className="text-3xl font-bold text-gray-900">{totalAnon}</div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  { key: 'male_adults', label: 'Hommes adultes' },
                  { key: 'female_adults', label: 'Femmes adultes' },
                  { key: 'male_children', label: 'Garçons (enfants)' },
                  { key: 'female_children', label: 'Filles (enfants)' },
                ].map((row) => (
                  <div key={row.key} className="p-3 rounded-xl bg-indigo-50">
                    <div className="text-xs font-semibold text-indigo-800">{row.label}</div>
                    <div className="mt-2 flex items-center justify-between">
                      <motion.button
                        type="button"
                        onClick={() => adjustAgg(row.key, -1)}
                        disabled={!selectedEventId}
                        className="p-2 rounded-lg bg-white/80 border border-white/60 text-indigo-900 shadow disabled:opacity-60"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <MinusIcon className="h-5 w-5" />
                      </motion.button>
                      <div className="text-2xl font-bold text-indigo-900">{Number(agg[row.key] || 0)}</div>
                      <motion.button
                        type="button"
                        onClick={() => adjustAgg(row.key, 1)}
                        disabled={!selectedEventId}
                        className="p-2 rounded-lg bg-white/80 border border-white/60 text-indigo-900 shadow disabled:opacity-60"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <PlusIcon className="h-5 w-5" />
                      </motion.button>
                    </div>
                  </div>
                ))}
              </div>

              {isDepartmentMeeting ? (
                <details className="mt-4">
                  <summary className="text-xs font-semibold text-gray-700 cursor-pointer select-none">Pointage département</summary>

                  {loadingDept ? (
                    <div className="mt-3 text-sm text-gray-600">Chargement des membres…</div>
                  ) : deptMembers.length === 0 ? (
                    <div className="mt-3 text-sm text-gray-600">Aucun membre trouvé pour ce département.</div>
                  ) : (
                    <div className="mt-3 max-h-[46vh] overflow-y-auto pr-1 space-y-2">
                      {deptMembers.map((m) => {
                        const idStr = String(m.id);
                        const checked = !!deptPresentMap[idStr];
                        const label = `${m.last_name || ''} ${m.first_name || ''}`.trim() || m.username || m.member_number || `#${m.id}`;
                        return (
                          <label
                            key={m.id}
                            className="flex items-center justify-between gap-3 p-3 rounded-xl border border-gray-100 bg-white hover:bg-gray-50"
                          >
                            <div>
                              <div className="text-sm font-semibold text-gray-900">{label}</div>
                              {m.member_number ? <div className="text-xs text-gray-500">{m.member_number}</div> : null}
                            </div>
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(e) => toggleDeptMember(m.id, e.target.checked)}
                              className="h-5 w-5 rounded border-gray-300"
                            />
                          </label>
                        );
                      })}
                    </div>
                  )}
                </details>
              ) : null}
            </div>

            {canLogistics ? (
              <div className="rounded-2xl border border-white/60 bg-white/70 p-4 shadow-sm lg:col-span-2">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-semibold text-gray-600">Consommation logistique</div>
                    <div className="text-sm text-gray-700">Indique les quantités utilisées pendant l'activité.</div>
                  </div>

                  <div className="flex items-center gap-2">
                    <motion.button
                      type="button"
                      onClick={addConsumptionRow}
                      disabled={!selectedEventId || loadingLogisticsItems || logisticsItems.length === 0}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/80 border border-white/60 text-gray-900 shadow hover:shadow-md disabled:opacity-60 text-sm"
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <PlusIcon className="h-5 w-5" />
                      Article
                    </motion.button>
                  </div>
                </div>

                {!selectedEventId ? (
                  <div className="mt-3 text-sm text-gray-600">Sélectionne d'abord un programme.</div>
                ) : loadingLogisticsItems ? (
                  <div className="mt-3 text-sm text-gray-600">Chargement des matériels…</div>
                ) : logisticsItems.length === 0 ? (
                  <div className="mt-3 text-sm text-gray-600">Aucun matériel disponible.</div>
                ) : (
                  <div className="mt-4 overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="text-xs font-extrabold text-gray-600">
                          <th className="text-left py-2 pr-3">Article</th>
                          <th className="text-left py-2 pr-3">Stock</th>
                          <th className="text-left py-2 pr-3">Quantité utilisée</th>
                          <th className="text-right py-2">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {consumptionRows.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="py-3 text-sm text-gray-600">
                              Aucun article ajouté. Clique sur <span className="font-semibold">Article</span> pour ajouter.
                            </td>
                          </tr>
                        ) : (
                          consumptionRows.map((idStr) => {
                            const it = logisticsItems.find((x) => String(x?.id) === String(idStr));
                            const used = Number(consumptionMap?.[String(idStr)] || 0);
                            const stock = Number(it?.quantity ?? 0);
                            const unit = (it?.unit || '').trim();

                            return (
                              <tr key={String(idStr)}>
                                <td className="py-2 pr-3 min-w-[220px]">
                                  <select
                                    value={String(idStr)}
                                    onChange={(e) => setConsumptionRowItem(idStr, e.target.value)}
                                    className="w-full rounded-xl border border-gray-200 bg-white/80 px-3 py-1.5 text-sm"
                                  >
                                    {logisticsItems.map((x) => (
                                      <option key={x.id} value={String(x.id)}>
                                        {x.name}
                                      </option>
                                    ))}
                                  </select>
                                </td>

                                <td className="py-2 pr-3 text-gray-700 whitespace-nowrap">
                                  {Number.isFinite(stock) ? stock : 0}{unit ? ` ${unit}` : ''}
                                </td>

                                <td className="py-2 pr-3">
                                  <div className="inline-flex items-center gap-2">
                                    <motion.button
                                      type="button"
                                      onClick={() => adjustConsumption(idStr, -1)}
                                      className="p-2 rounded-lg bg-white/80 border border-white/60 text-gray-900 shadow disabled:opacity-60"
                                      whileHover={{ scale: 1.05 }}
                                      whileTap={{ scale: 0.95 }}
                                      disabled={!selectedEventId}
                                    >
                                      <MinusIcon className="h-5 w-5" />
                                    </motion.button>
                                    <div className="w-12 text-center font-extrabold text-gray-900">{used}</div>
                                    <motion.button
                                      type="button"
                                      onClick={() => adjustConsumption(idStr, 1)}
                                      className="p-2 rounded-lg bg-white/80 border border-white/60 text-gray-900 shadow disabled:opacity-60"
                                      whileHover={{ scale: 1.05 }}
                                      whileTap={{ scale: 0.95 }}
                                      disabled={!selectedEventId || used >= stock}
                                    >
                                      <PlusIcon className="h-5 w-5" />
                                    </motion.button>
                                  </div>
                                </td>

                                <td className="py-2 text-right">
                                  <motion.button
                                    type="button"
                                    onClick={() => removeConsumptionRow(idStr)}
                                    className="px-3 py-1.5 rounded-xl bg-white/80 border border-white/60 text-gray-900 shadow hover:shadow-md text-sm"
                                    whileHover={{ scale: 1.03 }}
                                    whileTap={{ scale: 0.98 }}
                                  >
                                    Retirer
                                  </motion.button>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
