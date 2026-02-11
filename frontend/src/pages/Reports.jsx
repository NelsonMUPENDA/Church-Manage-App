import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';

import { api } from '../services/apiClient';
import { useToast } from '../components/ToastProvider';

export default function Reports() {
  const toast = useToast();

  const fmt = (n, digits = 2) => {
    const x = Number(n);
    if (!Number.isFinite(x)) return '0';
    return x.toLocaleString('fr-FR', { minimumFractionDigits: digits, maximumFractionDigits: digits });
  };

  const StatCard = ({ title, value, subtitle, tone = 'gray' }) => {
    const tones = {
      gray: 'bg-gray-50 text-gray-900',
      indigo: 'bg-indigo-50 text-indigo-900',
      amber: 'bg-amber-50 text-amber-900',
      emerald: 'bg-emerald-50 text-emerald-900',
      teal: 'bg-teal-50 text-teal-900',
    };
    return (
      <div className={`rounded-2xl border border-white/60 p-4 ${tones[tone] || tones.gray}`}>
        <div className="text-xs font-semibold text-gray-600">{title}</div>
        <div className="mt-1 text-2xl font-black">{value}</div>
        {subtitle ? <div className="mt-2 text-xs text-gray-700 whitespace-pre-wrap">{subtitle}</div> : null}
      </div>
    );
  };

  const Section = ({ title, subtitle, children, defaultOpen = true }) => (
    <details className="cpd-card p-4" open={defaultOpen}>
      <summary className="cursor-pointer list-none">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-sm font-black text-gray-900 truncate">{title}</div>
            {subtitle ? <div className="mt-0.5 text-xs text-gray-600">{subtitle}</div> : null}
          </div>
          <div className="shrink-0 text-xs font-semibold text-gray-500">Afficher/Masquer</div>
        </div>
      </summary>
      <div className="mt-4">{children}</div>
    </details>
  );

  const periodLabel = (p) => {
    const t = String(p || '').toLowerCase();
    if (t === 'daily') return 'Journalier';
    if (t === 'weekly') return 'Hebdomadaire';
    if (t === 'monthly') return 'Mensuel';
    if (t === 'annual' || t === 'yearly') return 'Annuel';
    return p || '—';
  };

  const sectionLabel = (k) => {
    const t = String(k || '').toLowerCase();
    if (t === 'programmes') return 'Programmes';
    if (t === 'pointage') return 'Pointage';
    if (t === 'members') return 'Membres';
    if (t === 'finances') return 'Finances';
    if (t === 'logistics') return 'Logistique';
    if (t === 'diaconat') return 'Diaconat';
    if (t === 'evangelisation') return 'Évangélisation';
    return k || '—';
  };

  const durationLabel = (d) => {
    const t = String(d || '').toLowerCase();
    if (t === 'daily') return 'Journée';
    if (t === 'weekly') return 'Semaine';
    if (t === 'monthly') return 'Mois';
    if (t === 'annual' || t === 'yearly') return 'Année';
    return d || '—';
  };

  const eventTypeLabel = (eventType) => {
    const t = String(eventType || '').toLowerCase();
    if (t === 'baptism') return 'Baptême';
    if (t === 'evangelism') return 'Évangélisation';
    if (t === 'training') return 'Affermissement';
    if (t === 'marriage') return 'Mariage';
    return eventType || '—';
  };

  const [reportMode, setReportMode] = useState('activity');

  const [globalPeriod, setGlobalPeriod] = useState('daily');
  const [globalStart, setGlobalStart] = useState('');
  const [globalEnd, setGlobalEnd] = useState('');
  const [globalSections, setGlobalSections] = useState({
    programmes: true,
    pointage: true,
    members: true,
    finances: true,
    logistics: true,
  });
  const [globalReport, setGlobalReport] = useState(null);
  const [loadingGlobalReport, setLoadingGlobalReport] = useState(false);

  const [events, setEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [selectedEventId, setSelectedEventId] = useState('');

  const [report, setReport] = useState(null);
  const [loadingReport, setLoadingReport] = useState(false);

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

  const loadEvents = useCallback(async () => {
    setLoadingEvents(true);
    try {
      const res = await api.get('/api/events/');
      const data = Array.isArray(res.data) ? res.data : res.data?.results || [];
      data.sort((a, b) => String(b?.date || '').localeCompare(String(a?.date || '')));
      setEvents(data);
      if (data.length) {
        setSelectedEventId((prev) => (prev ? prev : String(data[0].id)));
      }
    } catch (err) {
      toast.push({ type: 'error', title: 'Erreur', message: formatApiError(err, 'Impossible de charger les événements.') });
    } finally {
      setLoadingEvents(false);
    }
  }, [formatApiError, toast]);

  const loadGlobalReport = useCallback(async () => {
    setLoadingGlobalReport(true);
    try {
      const qs = new URLSearchParams();
      qs.set('period', globalPeriod);
      if ((globalStart || '').trim()) qs.set('start', globalStart.trim());
      if ((globalEnd || '').trim()) qs.set('end', globalEnd.trim());

      Object.entries(globalSections).forEach(([k, enabled]) => {
        if (enabled) qs.append('sections', k);
      });

      const res = await api.get(`/api/reports/compiled/?${qs.toString()}`);
      setGlobalReport(res.data);
    } catch (err) {
      toast.push({ type: 'error', title: 'Rapport global', message: formatApiError(err, 'Impossible de charger le rapport global.') });
      setGlobalReport(null);
    } finally {
      setLoadingGlobalReport(false);
    }
  }, [formatApiError, globalEnd, globalPeriod, globalSections, globalStart, toast]);

  const loadReport = useCallback(async (eventId) => {
    if (!eventId) {
      setReport(null);
      return;
    }
    setLoadingReport(true);
    try {
      const res = await api.get(`/api/events/${eventId}/activity-report/`);
      setReport(res.data);
    } catch (err) {
      toast.push({ type: 'error', title: 'Rapport', message: formatApiError(err, 'Impossible de charger le rapport.') });
      setReport(null);
    } finally {
      setLoadingReport(false);
    }
  }, [formatApiError, toast]);

  useEffect(() => {
    if (reportMode === 'activity') {
      loadEvents();
    }
  }, [loadEvents, reportMode]);

  useEffect(() => {
    if (reportMode === 'activity') {
      loadReport(selectedEventId);
    }
  }, [loadReport, reportMode, selectedEventId]);

  const selectedEvent = useMemo(() => {
    return events.find((e) => String(e.id) === String(selectedEventId)) || null;
  }, [events, selectedEventId]);

  const totals = report?.finance?.totals || {};
  const breakdown = Array.isArray(report?.finance?.breakdown) ? report.finance.breakdown : [];
  const byType = report?.finance?.by_type || {};
  const anon = report?.attendance?.anonymous || {};
  const dept = report?.attendance?.department || null;
  const visitors = reportMode === 'activity' ? report?.visitors || {} : {};
  const consumption = reportMode === 'activity' && Array.isArray(report?.logistics_consumption) ? report.logistics_consumption : [];
  const baptism = reportMode === 'activity' ? report?.baptism || null : null;
  const reportEventType = String(report?.event?.event_type || '').toLowerCase();
  const isEvangelisationActivity = ['baptism', 'evangelism', 'training'].includes(reportEventType);
  const isBaptismActivity = reportEventType === 'baptism';
  const showAttendanceAndVisitors = !isEvangelisationActivity;
  const showFinance = !isEvangelisationActivity || isBaptismActivity;

  const specialLines = (ev) => {
    const et = String(ev?.event_type || '').toLowerCase();
    const sd = ev?.special_details || null;
    if (et === 'training') {
      const trainer = (sd?.trainer || '').trim();
      const lesson = (sd?.lesson || '').trim();
      return [trainer ? `Formateur: ${trainer}` : null, lesson ? `Leçon: ${lesson}` : null].filter(Boolean);
    }
    if (et === 'evangelism') {
      const moderator = String(sd?.moderator || ev?.moderator || '').trim();
      return [moderator ? `Modérateur: ${moderator}` : null].filter(Boolean);
    }
    if (et === 'baptism') {
      const moderator = String(sd?.moderator || ev?.moderator || '').trim();
      const executors = Array.isArray(sd?.executors) ? sd.executors.map((x) => String(x || '').trim()).filter(Boolean) : [];
      return [
        moderator ? `Exécutant principal: ${moderator}` : null,
        executors.length ? `Exécutants: ${executors.slice(0, 5).join(', ')}` : null,
      ].filter(Boolean);
    }
    return [];
  };

  const downloadPdf = async () => {
    if (reportMode === 'activity') {
      if (!selectedEventId) return;
      try {
        const res = await api.get(`/api/events/${selectedEventId}/activity-report-pdf/`, { responseType: 'blob' });
        const blob = new Blob([res.data], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `rapport_activite_${selectedEventId}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      } catch (err) {
        toast.push({ type: 'error', title: 'PDF', message: formatApiError(err, 'Impossible de télécharger le PDF.') });
      }
      return;
    }

    try {
      const qs = new URLSearchParams();
      qs.set('period', globalPeriod);
      if ((globalStart || '').trim()) qs.set('start', globalStart.trim());
      if ((globalEnd || '').trim()) qs.set('end', globalEnd.trim());
      Object.entries(globalSections).forEach(([k, enabled]) => {
        if (enabled) qs.append('sections', k);
      });

      const res = await api.get(`/api/reports/compiled-pdf/?${qs.toString()}`, { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rapport_global_${globalPeriod}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      toast.push({ type: 'error', title: 'PDF', message: formatApiError(err, 'Impossible de télécharger le PDF.') });
    }
  };

  return (
    <div className="h-full min-h-0 flex flex-col">
      <div className="shrink-0 flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Rapports</h2>
          <p className="text-gray-600">Rapport par activité ou rapport global compilé (programme, membres, finance, logistique, pointage).</p>
        </div>

        <motion.button
          onClick={downloadPdf}
          disabled={(reportMode === 'activity' ? (!selectedEventId || loadingReport) : loadingGlobalReport)}
          className="cpd-btn cpd-btn-danger"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.98 }}
        >
          <ArrowDownTrayIcon className="h-5 w-5" />
          Exporter PDF
        </motion.button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1 space-y-4">
        <div className="cpd-card p-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="text-xs font-semibold text-gray-600">Type de rapport</div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setReportMode('activity')}
                className={[
                  'cpd-btn',
                  reportMode === 'activity' ? 'cpd-btn-primary' : 'cpd-btn-ghost',
                ].join(' ')}
              >
                Par activité
              </button>
              <button
                type="button"
                onClick={() => setReportMode('global')}
                className={[
                  'cpd-btn',
                  reportMode === 'global' ? 'cpd-btn-primary' : 'cpd-btn-ghost',
                ].join(' ')}
              >
                Global compilé
              </button>
            </div>
          </div>
        </div>

        {reportMode === 'global' ? (
          <div className="cpd-card p-4">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
              <div>
                <div className="text-xs font-semibold text-gray-600 mb-1">Période</div>
                <select
                  value={globalPeriod}
                  onChange={(e) => setGlobalPeriod(e.target.value)}
                  className="cpd-select"
                >
                  <option value="daily">Journalier</option>
                  <option value="weekly">Hebdomadaire</option>
                  <option value="monthly">Mensuel</option>
                  <option value="annual">Annuel</option>
                </select>
              </div>

              <div>
                <div className="text-xs font-semibold text-gray-600 mb-1">Date début (optionnel)</div>
                <input
                  type="date"
                  value={globalStart}
                  onChange={(e) => setGlobalStart(e.target.value)}
                  className="cpd-input"
                />
              </div>

              <div>
                <div className="text-xs font-semibold text-gray-600 mb-1">Date fin (optionnel)</div>
                <input
                  type="date"
                  value={globalEnd}
                  onChange={(e) => setGlobalEnd(e.target.value)}
                  className="cpd-input"
                />
              </div>

              <div className="flex items-end justify-end gap-2">
                <motion.button
                  type="button"
                  onClick={loadGlobalReport}
                  disabled={loadingGlobalReport}
                  className="cpd-btn cpd-btn-ghost"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Générer
                </motion.button>
              </div>
            </div>

            <div className="mt-4">
              <div className="text-xs font-semibold text-gray-600 mb-2">Sections à inclure</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2">
                {[
                  ['programmes', 'Programmes'],
                  ['pointage', 'Pointage'],
                  ['members', 'Membres'],
                  ['finances', 'Finances'],
                  ['diaconat', 'Diaconat'],
                  ['evangelisation', 'Évangélisation'],
                ].map(([key, label]) => (
                  <label key={key} className="cpd-card flex items-center gap-2 px-3 py-2">
                    <input
                      type="checkbox"
                      checked={!!globalSections[key]}
                      onChange={(e) => setGlobalSections((prev) => ({ ...prev, [key]: e.target.checked }))}
                    />
                    <span className="text-sm font-semibold text-gray-800">{label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        ) : (
        <div className="cpd-card p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2">
              <div className="text-xs font-semibold text-gray-600 mb-1">Activité / Événement</div>
              <select
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
                className="cpd-select"
                disabled={loadingEvents}
              >
                <option value="">Sélectionner...</option>
                {events.map((ev) => (
                  <option key={ev.id} value={String(ev.id)}>
                    {ev.date} • {String(ev.time || '').slice(0, 5)} • {ev.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end justify-end">
              <motion.button
                type="button"
                onClick={loadEvents}
                className="cpd-btn cpd-btn-ghost"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
              >
                Actualiser
              </motion.button>
            </div>
          </div>
        </div>
        )}

        {reportMode === 'global' ? (
          loadingGlobalReport ? (
            <div className="cpd-card p-6 text-gray-600">Chargement du rapport global…</div>
          ) : !globalReport ? (
            <div className="cpd-card p-6 text-gray-600">Configure la période et les sections, puis clique sur Générer.</div>
          ) : (
            <div className="space-y-4">
              <div className="cpd-card p-5">
                <div className="text-xs font-semibold text-gray-600">Rapport global compilé</div>
                <div className="mt-1 text-xl font-black text-gray-900">{globalReport?.start || '—'} → {globalReport?.end || '—'}</div>
                <div className="mt-2 text-sm text-gray-700">Période: <span className="font-semibold">{periodLabel(globalReport?.period)}</span></div>
                <div className="mt-1 text-sm text-gray-700">Sections: <span className="font-semibold">{(globalReport?.sections || []).map(sectionLabel).join(', ') || '—'}</span></div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {globalReport?.data?.programmes ? (
                  <StatCard
                    tone="indigo"
                    title="Programmes"
                    value={globalReport.data.programmes.count ?? 0}
                    subtitle={`Publiées: ${globalReport.data.programmes.published_count ?? 0}\nDépartement: ${globalReport.data.programmes.department_events_count ?? 0}`}
                  />
                ) : null}

                {globalReport?.data?.pointage ? (
                  <StatCard
                    tone="amber"
                    title="Pointage (total)"
                    value={globalReport.data.pointage.anonymous_totals?.total ?? 0}
                    subtitle={`Présence membres: ${globalReport.data.pointage.members_present_count ?? 0}\nTaux: ${fmt((globalReport.data.pointage.attendance_rate ?? 0) * 100, 1)}%`}
                  />
                ) : null}

                {globalReport?.data?.members ? (
                  <StatCard
                    tone="emerald"
                    title="Membres"
                    value={globalReport.data.members.total ?? 0}
                    subtitle={`Nouveaux (période): ${globalReport.data.members.new_count ?? 0}\nActifs: ${globalReport.data.members.active ?? 0} • Inactifs: ${globalReport.data.members.inactive ?? 0}`}
                  />
                ) : null}
              </div>

              {globalReport?.data?.finances?.totals ? (
                <Section title="Finances" subtitle="Synthèse Entrées / Sorties / Solde" defaultOpen>
                  {Object.keys(globalReport.data.finances.totals || {}).length ? (
                    <div className="cpd-table-wrap">
                      <table className="cpd-table min-w-[520px]">
                        <thead>
                          <tr className="text-xs text-gray-600">
                            <th className="px-3 py-2 font-semibold">Devise</th>
                            <th className="px-3 py-2 font-semibold">Entrées</th>
                            <th className="px-3 py-2 font-semibold">Sorties</th>
                            <th className="px-3 py-2 font-semibold">Solde</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {Object.entries(globalReport.data.finances.totals).map(([cur, agg]) => (
                            <tr key={cur} className="hover:bg-gray-50/60">
                              <td className="px-3 py-2 text-sm text-gray-700">{cur}</td>
                              <td className="px-3 py-2 text-sm text-gray-700">{fmt(agg?.in || 0)}</td>
                              <td className="px-3 py-2 text-sm text-gray-700">{fmt(agg?.out || 0)}</td>
                              <td className="px-3 py-2 text-sm font-semibold text-gray-900">{fmt(agg?.net || 0)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-600">Aucune donnée finance.</div>
                  )}
                </Section>
              ) : null}

              {globalReport?.data?.diaconat || globalReport?.data?.logistics ? (
                <Section title="Logistique / Diaconat" subtitle="État des matériels" defaultOpen={false}>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <StatCard tone="teal" title="Articles" value={(globalReport.data.diaconat || globalReport.data.logistics).items_count ?? 0} />
                    <StatCard tone="teal" title="Actifs" value={(globalReport.data.diaconat || globalReport.data.logistics).active_items_count ?? 0} />
                    <StatCard tone="teal" title="Quantité totale" value={fmt((globalReport.data.diaconat || globalReport.data.logistics).quantity_total ?? 0, 0)} />
                  </div>
                </Section>
              ) : null}

              {globalReport?.data?.evangelisation ? (
                <Section title="Évangélisation" subtitle="Statistiques" defaultOpen={false}>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <StatCard tone="teal" title="Baptêmes" value={globalReport.data.evangelisation.baptisms_count ?? 0} />
                    <StatCard tone="teal" title="Candidats" value={globalReport.data.evangelisation.candidates_count ?? 0} />
                    <StatCard tone="teal" title="Activités" value={globalReport.data.evangelisation.evangelism_activities_count ?? 0} />
                    <StatCard tone="teal" title="Affermissements" value={globalReport.data.evangelisation.training_events_count ?? 0} />
                  </div>
                </Section>
              ) : null}
            </div>
          )
        ) : (
          loadingReport ? (
            <div className="cpd-card p-6 text-gray-600">Chargement du rapport…</div>
          ) : !report ? (
            <div className="cpd-card p-6 text-gray-600">Sélectionne une activité pour afficher son rapport.</div>
          ) : (
            <div className="space-y-4">
              <div className="cpd-card p-5">
                <div className="text-xs font-semibold text-gray-600">Activité</div>
                <div className="mt-1 text-xl font-black text-gray-900">{selectedEvent?.title || report?.event?.title || '—'}</div>
                <div className="mt-2 text-sm text-gray-700">
                  {report?.event?.date || '—'} • {String(report?.event?.time || '').slice(0, 5) || '—'} • {eventTypeLabel(report?.event?.event_type)}
                </div>
                <div className="mt-1 text-sm text-gray-700">Durée: <span className="font-semibold">{durationLabel(report?.event?.duration_type)}</span></div>
                <div className="mt-1 text-sm text-gray-700">Lieu: <span className="font-semibold">{report?.event?.location || '—'}</span></div>
                {report?.event?.description ? <div className="mt-3 text-sm text-gray-700 whitespace-pre-wrap">{report.event.description}</div> : null}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {showAttendanceAndVisitors && report?.attendance?.anonymous ? (
                  <StatCard
                    tone="indigo"
                    title="Pointage (anonyme)"
                    value={anon.total ?? 0}
                    subtitle={`Hommes adultes: ${anon.male_adults ?? 0} • Femmes adultes: ${anon.female_adults ?? 0}\nGarçons: ${anon.male_children ?? 0} • Filles: ${anon.female_children ?? 0}`}
                  />
                ) : null}

                {showFinance && report?.finance ? (
                  <StatCard
                    tone="amber"
                    title="Finances"
                    value={report?.finance?.transaction_count ?? 0}
                    subtitle={
                      Object.keys(totals).length === 0
                        ? 'Aucune transaction liée'
                        : Object.entries(totals)
                            .map(([cur, t]) => `${cur}: +${fmt(t?.in || 0)} / -${fmt(t?.out || 0)} / solde ${fmt(t?.net || 0)}`)
                            .join('\n')
                    }
                  />
                ) : null}

                {showAttendanceAndVisitors && dept ? (
                  <StatCard
                    tone="emerald"
                    title="Département"
                    value={dept?.department_name || '—'}
                    subtitle={
                      dept?.stats
                        ? `Membres présents: ${dept.stats.members_present ?? 0}\nHommes: ${dept.stats.men ?? 0} • Femmes: ${dept.stats.women ?? 0} • Enfants: ${dept.stats.children ?? 0}`
                        : null
                    }
                  />
                ) : null}
              </div>

              {showAttendanceAndVisitors && report?.visitors ? (
                <Section title="Visiteurs" subtitle="Détails" defaultOpen={false}>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <StatCard tone="gray" title="Total" value={visitors.total ?? 0} />
                    <StatCard tone="gray" title="Hommes" value={visitors.male_visitors ?? 0} />
                    <StatCard tone="gray" title="Femmes" value={visitors.female_visitors ?? 0} />
                  </div>
                </Section>
              ) : null}

              <Section title="Consommation logistique" subtitle="Articles consommés pendant l'activité" defaultOpen={false}>
                {consumption.length === 0 ? (
                  <div className="text-sm text-gray-600">Aucune consommation.</div>
                ) : (
                  <div className="cpd-table-wrap">
                    <table className="cpd-table min-w-[520px]">
                      <thead>
                        <tr className="text-xs text-gray-600">
                          <th className="px-3 py-2 font-semibold">Article</th>
                          <th className="px-3 py-2 font-semibold">Qté</th>
                          <th className="px-3 py-2 font-semibold">Unité</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {consumption.map((it) => (
                          <tr key={`${it.item_id}-${it.item_name}`} className="hover:bg-gray-50/60">
                            <td className="px-3 py-2 text-sm font-semibold text-gray-900">{it.item_name || '—'}</td>
                            <td className="px-3 py-2 text-sm text-gray-700">{it.quantity_used ?? 0}</td>
                            <td className="px-3 py-2 text-sm text-gray-700">{it.item_unit || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Section>

              {baptism ? (
                <Section title={`Baptême — Candidats (${baptism.candidates_count ?? 0})`} subtitle="Liste" defaultOpen={false}>
                  {Array.isArray(baptism.candidates) && baptism.candidates.length ? (
                    <div className="cpd-table-wrap">
                      <table className="cpd-table min-w-[520px]">
                        <thead>
                          <tr className="text-xs text-gray-600">
                            <th className="px-3 py-2 font-semibold">Nom</th>
                            <th className="px-3 py-2 font-semibold">Naissance</th>
                            <th className="px-3 py-2 font-semibold">Lieu</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {baptism.candidates.map((c) => (
                            <tr key={c.id} className="hover:bg-gray-50/60">
                              <td className="px-3 py-2 text-sm font-semibold text-gray-900">{`${c.name || ''} ${c.post_name || ''}`.trim() || '—'}</td>
                              <td className="px-3 py-2 text-sm text-gray-700">{String(c.birth_date || '—').slice(0, 10)}</td>
                              <td className="px-3 py-2 text-sm text-gray-700">{c.place_of_birth || '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-600">Aucun candidat.</div>
                  )}
                </Section>
              ) : null}

              {showFinance && Object.keys(byType || {}).length ? (
                <Section title="Finances — Synthèse par catégorie" subtitle="Regroupement comptable" defaultOpen={false}>
                  <div className="cpd-table-wrap">
                    <table className="cpd-table min-w-[640px]">
                      <thead>
                        <tr className="text-xs text-gray-600">
                          <th className="px-3 py-2 font-semibold">Devise</th>
                          <th className="px-3 py-2 font-semibold">Catégorie</th>
                          <th className="px-3 py-2 font-semibold">Entrées</th>
                          <th className="px-3 py-2 font-semibold">Sorties</th>
                          <th className="px-3 py-2 font-semibold">Solde</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {Object.entries(byType).flatMap(([cur, typeMap]) =>
                          Object.entries(typeMap || {}).map(([txType, agg]) => (
                            <tr key={`${cur}-${txType}`} className="hover:bg-gray-50/60">
                              <td className="px-3 py-2 text-sm text-gray-700">{cur}</td>
                              <td className="px-3 py-2 text-sm font-semibold text-gray-900">{txType}</td>
                              <td className="px-3 py-2 text-sm text-gray-700">{fmt(agg?.in || 0)}</td>
                              <td className="px-3 py-2 text-sm text-gray-700">{fmt(agg?.out || 0)}</td>
                              <td className="px-3 py-2 text-sm font-semibold text-gray-900">{fmt(agg?.net || 0)}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </Section>
              ) : null}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Section title="Intervenants" subtitle="Modérateur, prédicateur, équipes…" defaultOpen>
                  <div className="text-sm text-gray-700 space-y-1">
                    {isEvangelisationActivity ? (
                      specialLines(report?.event).length ? (
                        specialLines(report?.event).map((ln) => (
                          <div key={ln}><span className="font-semibold">{ln}</span></div>
                        ))
                      ) : (
                        <div className="text-sm text-gray-600">Aucun intervenant renseigné.</div>
                      )
                    ) : specialLines(report?.event).length ? (
                      specialLines(report?.event).map((ln) => (
                        <div key={ln}><span className="font-semibold">{ln}</span></div>
                      ))
                    ) : (
                      <>
                        <div>Modérateur: <span className="font-semibold">{report?.event?.moderator || '—'}</span></div>
                        <div>Prédicateur: <span className="font-semibold">{report?.event?.preacher || '—'}</span></div>
                        <div>Chorale: <span className="font-semibold">{report?.event?.choir || '—'}</span></div>
                        <div>Protocole: <span className="font-semibold">{report?.event?.protocol_team || '—'}</span></div>
                        <div>Technique/Media: <span className="font-semibold">{report?.event?.tech_team || '—'}</span></div>
                        <div>Communicateur: <span className="font-semibold">{report?.event?.communicator || '—'}</span></div>
                      </>
                    )}
                  </div>
                </Section>

                {showFinance && isBaptismActivity ? (
                  <Section title="Offrandes — Détails" subtitle="Détail des lignes" defaultOpen={false}>
                    {breakdown.length ? (
                      <div className="cpd-table-wrap">
                        <table className="cpd-table min-w-[720px]">
                          <thead>
                            <tr className="text-xs text-gray-600">
                              <th className="px-3 py-2 font-semibold">Devise</th>
                              <th className="px-3 py-2 font-semibold">Catégorie</th>
                              <th className="px-3 py-2 font-semibold">Description</th>
                              <th className="px-3 py-2 font-semibold">Sens</th>
                              <th className="px-3 py-2 font-semibold">Total</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {breakdown.map((b, idx) => (
                              <tr key={`${b.currency}-${b.direction}-${b.transaction_type}-${b.description}-${idx}`} className="hover:bg-gray-50/60">
                                <td className="px-3 py-2 text-sm text-gray-700">{b.currency || 'CDF'}</td>
                                <td className="px-3 py-2 text-sm font-semibold text-gray-900">{b.transaction_type || '—'}</td>
                                <td className="px-3 py-2 text-sm text-gray-700">{b.description || '—'}</td>
                                <td className="px-3 py-2 text-sm text-gray-700">{b.direction === 'out' ? 'Sortie' : 'Entrée'}</td>
                                <td className="px-3 py-2 text-sm font-semibold text-gray-900">{fmt(b.total || 0)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-sm text-gray-600">Aucun détail.</div>
                    )}
                  </Section>
                ) : null}
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}
