import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowTrendingUpIcon,
  BoltIcon,
  CalendarIcon,
  CheckCircleIcon,
  CurrencyDollarIcon,
  HeartIcon,
  LightBulbIcon,
  MegaphoneIcon,
  SparklesIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';

import { api } from '../services/apiClient';
import { useToast } from '../components/ToastProvider';
import { UI_TEXT } from '../uiText';

const COLOR_STYLES = {
  indigo: {
    badgeText: 'text-indigo-700',
    badgeBg: 'bg-indigo-50',
    iconBg: 'bg-indigo-100',
    iconText: 'text-indigo-700',
    ring: 'ring-indigo-600/20',
    gradFrom: 'from-indigo-600',
    gradTo: 'to-purple-600',
  },
  green: {
    badgeText: 'text-green-700',
    badgeBg: 'bg-green-50',
    iconBg: 'bg-green-100',
    iconText: 'text-green-700',
    ring: 'ring-green-600/20',
    gradFrom: 'from-emerald-600',
    gradTo: 'to-teal-600',
  },
  yellow: {
    badgeText: 'text-yellow-700',
    badgeBg: 'bg-yellow-50',
    iconBg: 'bg-yellow-100',
    iconText: 'text-yellow-700',
    ring: 'ring-yellow-600/20',
    gradFrom: 'from-amber-600',
    gradTo: 'to-orange-600',
  },
  red: {
    badgeText: 'text-red-700',
    badgeBg: 'bg-red-50',
    iconBg: 'bg-red-100',
    iconText: 'text-red-700',
    ring: 'ring-rose-600/20',
    gradFrom: 'from-rose-600',
    gradTo: 'to-pink-600',
  },
};

const timeAgo = (iso) => {
  if (!iso) return '';
  const dt = new Date(iso);
  if (Number.isNaN(dt.getTime())) return '';
  const diffMs = Date.now() - dt.getTime();
  const sec = Math.max(0, Math.floor(diffMs / 1000));
  if (sec < 60) return "À l'instant";
  const min = Math.floor(sec / 60);
  if (min < 60) return `Il y a ${min} min`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `Il y a ${hr} heures`;
  const day = Math.floor(hr / 24);
  return `Il y a ${day} jours`;
};

const PAGE_VARIANTS = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 90,
      damping: 16,
      staggerChildren: 0.06,
    },
  },
};

const ITEM_VARIANTS = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

export default function Dashboard({ actionItems = [], onNavigate }) {
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [activeView, setActiveView] = useState('overview');

  const canFinance = !!summary?.permissions?.finance;
  const canAttendance = !!summary?.permissions?.attendance;
  const canMembers = !!summary?.permissions?.members;

  const formatApiError = useCallback((err, fallback) => {
    const data = err?.response?.data;
    if (!data) return fallback;
    if (typeof data === 'string') return data;
    if (Array.isArray(data)) return data.map((x) => String(x)).join('\n');
    if (typeof data === 'object') return JSON.stringify(data);
    return fallback;
  }, []);

  const loadSummary = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/dashboard/summary/');
      setSummary(res.data);
    } catch (err) {
      toast.push({ type: 'error', title: 'Dashboard', message: formatApiError(err, 'Impossible de charger le tableau de bord.') });
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, [formatApiError, toast]);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  useEffect(() => {
    if (activeView === 'finance' && !canFinance) setActiveView('overview');
    if (activeView === 'attendance' && !canAttendance) setActiveView('overview');
  }, [activeView, canAttendance, canFinance]);

  const todayLabel = useMemo(() => {
    try {
      return new Intl.DateTimeFormat('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).format(new Date());
    } catch {
      return '';
    }
  }, []);

  const statItems = useMemo(() => {
    const s = summary?.stats || {};

    const financeTotals = s.finance_month_totals || {};
    const firstCur = financeTotals.CDF ? 'CDF' : Object.keys(financeTotals)[0];
    const monthIn = firstCur ? Number(financeTotals[firstCur]?.in || 0) : 0;

    const out = [];

    if (canMembers) {
      out.push({
        icon: UserGroupIcon,
        label: 'Total Membres',
        value: String(s.members_total ?? 0),
        color: 'indigo',
        change: `+${s.members_new_week ?? 0} cette semaine`,
      });
    }

    out.push({
      icon: CalendarIcon,
      label: 'Événements',
      value: String(s.events_week ?? 0),
      color: 'green',
      change: `${s.events_upcoming ?? 0} à venir`,
    });

    if (canFinance) {
      out.push({
        icon: CurrencyDollarIcon,
        label: 'Dons du Mois',
        value: firstCur ? `${firstCur} ${monthIn.toFixed(2)}` : '0',
        color: 'yellow',
        change: `Entrées ce mois`,
      });
    }

    if (canAttendance) {
      out.push({
        icon: HeartIcon,
        label: 'Présence',
        value: `${Math.round(Number(s.attendance_rate_week || 0) * 100)}%`,
        color: 'red',
        change: `Semaine: ${s.attendance_present_week ?? 0} / ${s.attendance_rows_week ?? 0}`,
      });
    }

    return out;
  }, [canAttendance, canFinance, canMembers, summary]);

  const alertItems = useMemo(() => {
    const items = Array.isArray(summary?.alerts) ? summary.alerts : [];
    return items.slice(0, 6).map((a) => ({
      id: a?.id,
      title: a?.title || 'Programme',
      date: a?.date || '—',
      time: a?.time || '—',
      message: a?.message || null,
      is_published: !!a?.is_published,
    }));
  }, [summary]);

  const activityItems = useMemo(() => {
    const items = Array.isArray(summary?.recent_activity) ? summary.recent_activity : [];
    return items.slice(0, 8).map((a) => {
      const kind = a?.kind;
      if (kind === 'finance') {
        return {
          icon: CurrencyDollarIcon,
          color: 'green',
          title: a?.title || 'Finance',
          description: a?.description || '—',
          time: timeAgo(a?.created_at),
        };
      }
      if (kind === 'event') {
        return {
          icon: CalendarIcon,
          color: 'yellow',
          title: a?.title || 'Événement',
          description: a?.description || '—',
          time: timeAgo(a?.created_at),
        };
      }
      return {
        icon: UserGroupIcon,
        color: 'indigo',
        title: a?.title || 'Membre',
        description: a?.description || '—',
        time: timeAgo(a?.created_at),
      };
    });
  }, [summary]);

  const charts = useMemo(() => {
    const s = summary?.stats || {};
    const financeTotals = s.finance_month_totals || {};
    const rows = Object.entries(financeTotals || {}).map(([cur, agg]) => {
      const vin = Number(agg?.in || 0);
      const vout = Number(agg?.out || 0);
      const vnet = Number(agg?.net || (vin - vout));
      return { cur, vin, vout, vnet };
    });
    const maxVal = Math.max(
      1,
      ...rows.flatMap((r) => [Math.abs(r.vin), Math.abs(r.vout), Math.abs(r.vnet)]),
    );

    const attendanceRate = Math.max(0, Math.min(1, Number(s.attendance_rate_week || 0)));
    const attendancePct = Math.round(attendanceRate * 100);
    const eventsWeek = Number(s.events_week || 0);
    const eventsUpcoming = Number(s.events_upcoming || 0);
    const membersNewWeek = Number(s.members_new_week || 0);

    return {
      finance: {
        rows,
        maxVal,
      },
      attendance: {
        rate: attendanceRate,
        pct: attendancePct,
        present: Number(s.attendance_present_week || 0),
        total: Number(s.attendance_rows_week || 0),
      },
      momentum: {
        eventsWeek,
        eventsUpcoming,
        membersNewWeek,
      },
    };
  }, [summary]);

  const tabs = useMemo(() => {
    const out = [
      { key: 'overview', label: 'Aperçu', icon: SparklesIcon },
    ];
    if (canFinance) out.push({ key: 'finance', label: 'Finances', icon: CurrencyDollarIcon });
    if (canAttendance) out.push({ key: 'attendance', label: 'Présence', icon: HeartIcon });
    out.push({ key: 'activity', label: 'Activités', icon: LightBulbIcon });
    return out;
  }, [canAttendance, canFinance]);

  return (
    <motion.div variants={PAGE_VARIANTS} initial="hidden" animate="show" className="h-full min-h-0 overflow-y-auto">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
      <motion.div variants={ITEM_VARIANTS} className="cpd-surface">
        <div className="p-6 sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-gray-900 dark:text-white">Tableau de bord</h2>
              <p className="mt-1 text-sm text-gray-600 dark:text-slate-300">
                {todayLabel ? `Résumé • ${todayLabel}` : 'Résumé'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:flex sm:items-center sm:gap-3">
              <div className="rounded-2xl bg-white/70 dark:bg-white/10 border border-white/60 dark:border-white/10 px-4 py-3">
                <div className="text-xs text-gray-500 dark:text-slate-400">État système</div>
                <div className="mt-1 inline-flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
                  <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                  OK
                </div>
              </div>
              <div className="rounded-2xl bg-white/70 dark:bg-white/10 border border-white/60 dark:border-white/10 px-4 py-3">
                <div className="text-xs text-gray-500 dark:text-slate-400">Rythme</div>
                <div className="mt-1 inline-flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
                  <ArrowTrendingUpIcon className="h-4 w-4 text-indigo-600 dark:text-indigo-300" />
                  En progression
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2">
            <div className="cpd-tabs">
              {tabs.map((t) => {
                const active = activeView === t.key;
                const Icon = t.icon;
                return (
                  <motion.button
                    key={t.key}
                    type="button"
                    className={[
                      'cpd-tab',
                      active ? 'cpd-tab-active' : 'cpd-tab-inactive',
                    ].join(' ')}
                    onClick={() => setActiveView(t.key)}
                    whileTap={{ scale: 0.97 }}
                    transition={{ type: 'spring', stiffness: 420, damping: 26 }}
                  >
                    <span className="relative inline-flex items-center gap-2">
                      <Icon className="h-4 w-4 text-gray-500 dark:text-slate-300" />
                      {t.label}
                    </span>
                  </motion.button>
                );
              })}
            </div>

            <motion.button
              type="button"
              className="w-full sm:w-auto sm:ml-auto cpd-btn cpd-btn-outline px-3 py-2"
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 380, damping: 22 }}
              onClick={loadSummary}
            >
              <BoltIcon className="h-4 w-4" />
              {UI_TEXT.refresh}
            </motion.button>
          </div>
        </div>
      </motion.div>

      <motion.div variants={ITEM_VARIANTS} className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statItems.map((stat) => {
          const color = COLOR_STYLES[stat.color] || COLOR_STYLES.indigo;
          return (
            <motion.div
              key={stat.label}
              className="cpd-card group"
              variants={ITEM_VARIANTS}
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.99 }}
            >
              <div className="p-5 min-h-[118px] flex flex-col">
                <div className="flex items-center justify-between">
                  <motion.div
                    className={`p-3 rounded-2xl ${color.iconBg} dark:bg-white/10`}
                    whileHover={{ scale: 1.02 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 18 }}
                  >
                    <stat.icon className={`h-6 w-6 ${color.iconText} dark:text-white`} />
                  </motion.div>
                  <motion.button
                    type="button"
                    className="text-xs text-gray-600 dark:text-slate-300 px-2.5 py-1 rounded-lg border border-gray-200/70 dark:border-white/10 bg-gray-50/70 dark:bg-white/5"
                    whileTap={{ scale: 0.96 }}
                    transition={{ type: 'spring', stiffness: 420, damping: 26 }}
                    onClick={() => {
                      if (stat.label.includes('Dons')) setActiveView('finance');
                      else if (stat.label.includes('Présence')) setActiveView('attendance');
                      else if (stat.label.includes('Événements')) setActiveView('activity');
                      else setActiveView('overview');
                    }}
                  >
                    {stat.change}
                  </motion.button>
                </div>
                <div className="mt-4">
                  <div className="text-xs text-gray-500 dark:text-slate-400">{stat.label}</div>
                  <div className="mt-1 text-[26px] leading-8 font-semibold text-gray-900 dark:text-white">{loading ? '—' : stat.value}</div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      <AnimatePresence mode="popLayout">
      {(activeView === 'overview' || (activeView === 'finance' && canFinance) || (activeView === 'attendance' && canAttendance)) ? (
      <motion.div
        key="finance-grid"
        layout
        variants={ITEM_VARIANTS}
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -14 }}
        transition={{ type: 'spring', stiffness: 90, damping: 16 }}
        className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-4"
      >
        <motion.div layout variants={ITEM_VARIANTS} className="lg:col-span-7">
          <div className="rounded-2xl border border-gray-200/70 dark:border-white/10 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200/60 dark:border-white/10 bg-gray-50 dark:bg-white/5">
              <div className="flex items-center justify-between">
                <h3 className="text-sm text-gray-900 dark:text-white flex items-center gap-2">
                  <CurrencyDollarIcon className="h-5 w-5 text-gray-500 dark:text-slate-300" />
                  Finances (mois)
                </h3>
                <div className="text-xs text-gray-500 dark:text-slate-400">Réel</div>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {!canFinance ? (
                <div className="text-sm text-gray-600 dark:text-slate-300">Accès restreint.</div>
              ) : (charts.finance.rows || []).length ? (
                charts.finance.rows.map((r) => {
                  const inPct = Math.round((Math.abs(r.vin) / charts.finance.maxVal) * 100);
                  const outPct = Math.round((Math.abs(r.vout) / charts.finance.maxVal) * 100);
                  const netPct = Math.round((Math.abs(r.vnet) / charts.finance.maxVal) * 100);
                  const netPositive = r.vnet >= 0;
                  return (
                    <div key={r.cur} className="rounded-2xl bg-white dark:bg-slate-900 border border-gray-200/70 dark:border-white/10 p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div className="text-sm text-gray-900 dark:text-white">{r.cur}</div>
                        <div className="text-xs text-gray-500 dark:text-slate-400">Solde: {r.vnet.toFixed(2)}</div>
                      </div>

                      <div className="mt-3 space-y-2">
                        <div>
                          <div className="flex items-center justify-between text-xs">
                            <div className="text-gray-700 dark:text-slate-300">Entrées</div>
                            <div className="text-gray-900 dark:text-white">{r.vin.toFixed(2)}</div>
                          </div>
                          <div className="mt-1 h-2 rounded-full bg-gray-200/70 dark:bg-white/10 overflow-hidden">
                            <motion.div
                              className="h-2 rounded-full bg-emerald-500/70"
                              initial={{ width: 0 }}
                              animate={{ width: `${inPct}%` }}
                              transition={{ type: 'spring', stiffness: 120, damping: 18 }}
                            />
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center justify-between text-xs">
                            <div className="text-gray-700 dark:text-slate-300">Sorties</div>
                            <div className="text-gray-900 dark:text-white">{r.vout.toFixed(2)}</div>
                          </div>
                          <div className="mt-1 h-2 rounded-full bg-gray-200/70 dark:bg-white/10 overflow-hidden">
                            <motion.div
                              className="h-2 rounded-full bg-rose-500/60"
                              initial={{ width: 0 }}
                              animate={{ width: `${outPct}%` }}
                              transition={{ type: 'spring', stiffness: 120, damping: 18 }}
                            />
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center justify-between text-xs">
                            <div className="text-gray-700 dark:text-slate-300">Solde</div>
                            <div className="text-gray-900 dark:text-white">{r.vnet.toFixed(2)}</div>
                          </div>
                          <div className="mt-1 h-2 rounded-full bg-gray-200/70 dark:bg-white/10 overflow-hidden">
                            <motion.div
                              className={`h-2 rounded-full ${netPositive ? 'bg-indigo-500/65' : 'bg-amber-500/65'}`}
                              initial={{ width: 0 }}
                              animate={{ width: `${netPct}%` }}
                              transition={{ type: 'spring', stiffness: 120, damping: 18 }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-sm text-gray-600 dark:text-slate-300">{loading ? 'Chargement…' : 'Aucune donnée finance.'}</div>
              )}
            </div>
          </div>
        </motion.div>

        <motion.div layout variants={ITEM_VARIANTS} className="lg:col-span-5 space-y-4">
          <div className="rounded-2xl border border-gray-200/70 dark:border-white/10 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200/60 dark:border-white/10 bg-gray-50 dark:bg-white/5">
              <div className="flex items-center justify-between">
                <h3 className="text-sm text-gray-900 dark:text-white flex items-center gap-2">
                  <HeartIcon className="h-5 w-5 text-gray-500 dark:text-slate-300" />
                  Présence (semaine)
                </h3>
                <div className="text-xs text-gray-500 dark:text-slate-400">Réel</div>
              </div>
            </div>

            <div className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
              {!canAttendance ? (
                <div className="text-sm text-gray-600 dark:text-slate-300">Accès restreint.</div>
              ) : (
                <>
                  <motion.div
                    className="h-28 w-28 rounded-full p-2"
                    initial={{ '--p': 0 }}
                    animate={{ '--p': charts.attendance.pct }}
                    transition={{ type: 'spring', stiffness: 90, damping: 16 }}
                    style={{
                      background: 'conic-gradient(#10b981 calc(var(--p) * 1%), rgba(15,23,42,0.10) 0)',
                    }}
                  >
                    <div className="h-full w-full rounded-full bg-white/90 dark:bg-slate-900/70 backdrop-blur-md flex items-center justify-center border border-white/60 dark:border-white/10">
                      <div className="text-center">
                        <div className="text-2xl text-gray-900 dark:text-white">{loading ? '—' : `${charts.attendance.pct}%`}</div>
                        <div className="text-[11px] text-gray-500 dark:text-slate-400">présence</div>
                      </div>
                    </div>
                  </motion.div>

                  <div className="min-w-0 flex-1 space-y-3">
                    <div className="rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200/70 dark:border-white/10 p-4">
                      <div className="text-xs text-gray-700 dark:text-slate-300">Participants</div>
                      <div className="mt-1 text-sm text-gray-900 dark:text-white">
                        {loading ? '—' : `${charts.attendance.present} / ${charts.attendance.total}`}
                      </div>
                    </div>

                    <div className="rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200/70 dark:border-white/10 p-4">
                      <div className="text-xs text-gray-700 dark:text-slate-300">Dynamique</div>
                      <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2">
                        <div className="rounded-xl border border-gray-200/70 dark:border-white/10 bg-white dark:bg-slate-900 px-3 py-2">
                          <div className="text-[11px] text-gray-500 dark:text-slate-400">Événements</div>
                          <div className="text-sm text-gray-900 dark:text-white">{loading ? '—' : charts.momentum.eventsWeek}</div>
                        </div>
                        <div className="rounded-xl border border-gray-200/70 dark:border-white/10 bg-white dark:bg-slate-900 px-3 py-2">
                          <div className="text-[11px] text-gray-500 dark:text-slate-400">À venir</div>
                          <div className="text-sm text-gray-900 dark:text-white">{loading ? '—' : charts.momentum.eventsUpcoming}</div>
                        </div>
                        <div className="rounded-xl border border-gray-200/70 dark:border-white/10 bg-white dark:bg-slate-900 px-3 py-2">
                          <div className="text-[11px] text-gray-500 dark:text-slate-400">Nouveaux</div>
                          <div className="text-sm text-gray-900 dark:text-white">{loading ? '—' : charts.momentum.membersNewWeek}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
      ) : null}
      </AnimatePresence>

      <AnimatePresence mode="popLayout">
      {(activeView === 'overview' || activeView === 'activity') ? (
      <motion.div
        key="activity-grid"
        layout
        variants={ITEM_VARIANTS}
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -14 }}
        transition={{ type: 'spring', stiffness: 90, damping: 16 }}
        className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-4"
      >
        <motion.div variants={ITEM_VARIANTS} className="lg:col-span-8">
          <div className="rounded-2xl border border-gray-200/70 dark:border-white/10 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200/60 dark:border-white/10 bg-gray-50 dark:bg-white/5">
              <div className="flex items-center justify-between">
                <h3 className="text-sm text-gray-900 dark:text-white flex items-center gap-2">
                  <LightBulbIcon className="h-5 w-5 text-gray-500 dark:text-slate-300" />
                  Activités récentes
                </h3>
                <div className="text-xs text-gray-500 dark:text-slate-400">Synchronisé</div>
              </div>
            </div>

            <div className="p-2">
              <AnimatePresence>
                {(activityItems || []).length ? activityItems.map((activity, index) => {
                  const color = COLOR_STYLES[activity.color] || COLOR_STYLES.indigo;
                  return (
                    <motion.div
                      key={activity.title}
                      className="group flex items-center justify-between gap-4 px-4 py-4 rounded-xl"
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -12 }}
                      transition={{ delay: index * 0.05, duration: 0.35 }}
                      whileHover={{ backgroundColor: 'rgba(148, 163, 184, 0.12)' }}
                    >
                      <div className="flex items-center min-w-0">
                        <motion.div
                          className={`h-10 w-10 rounded-2xl ${color.iconBg} dark:bg-white/10 flex items-center justify-center mr-4 shrink-0`}
                          whileHover={{ scale: 1.03 }}
                          transition={{ type: 'spring', stiffness: 350, damping: 18 }}
                        >
                          <activity.icon className={`h-5 w-5 ${color.iconText} dark:text-white`} />
                        </motion.div>
                        <div className="min-w-0">
                          <div className="text-sm text-gray-900 dark:text-white truncate">{activity.title}</div>
                          <div className="text-sm text-gray-600 dark:text-slate-300 truncate">{activity.description}</div>
                        </div>
                      </div>
                      <div className="text-xs text-gray-400 dark:text-slate-400 shrink-0">{activity.time}</div>
                    </motion.div>
                  );
                }) : (
                  <motion.div
                    key="empty"
                    className="px-4 py-4 text-sm text-gray-600 dark:text-slate-300"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    {loading ? 'Chargement…' : 'Aucune activité récente.'}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>

        <motion.div variants={ITEM_VARIANTS} className="lg:col-span-4 space-y-4">
          <div className="rounded-2xl border border-gray-200/70 dark:border-white/10 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200/60 dark:border-white/10 bg-gray-50 dark:bg-white/5">
              <div className="flex items-center justify-between">
                <h3 className="text-sm text-gray-900 dark:text-white flex items-center gap-2">
                  <MegaphoneIcon className="h-5 w-5 text-gray-500 dark:text-slate-300" />
                  Alertes programmes
                </h3>
                <div className="text-xs text-gray-500 dark:text-slate-400">{loading ? '—' : (summary?.stats?.alerts_count ?? alertItems.length)}</div>
              </div>
            </div>

            <div className="p-4 space-y-3">
              {(alertItems || []).length ? (
                alertItems.map((a) => (
                  <motion.div
                    key={a.id || a.title}
                    className="rounded-2xl bg-white dark:bg-slate-900 border border-gray-200/70 dark:border-white/10 p-4"
                    whileHover={{ y: -1 }}
                    transition={{ type: 'spring', stiffness: 250, damping: 20 }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm text-gray-900 dark:text-white truncate">{a.title}</div>
                        <div className="mt-1 text-xs text-gray-600 dark:text-slate-300">{a.date} • {a.time}</div>
                        {a.message ? (
                          <div className="mt-2 text-xs text-gray-700 dark:text-slate-300">{a.message}</div>
                        ) : null}
                      </div>
                      <span className={`shrink-0 text-[11px] px-2 py-1 rounded-full border ${a.is_published ? 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-white/10 dark:text-emerald-200 dark:border-white/10' : 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-white/10 dark:text-amber-200 dark:border-white/10'}`}>
                        {a.is_published ? 'Publié' : 'Brouillon'}
                      </span>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="text-sm text-gray-600 dark:text-slate-300">{loading ? 'Chargement…' : 'Aucune alerte.'}</div>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200/70 dark:border-white/10 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200/60 dark:border-white/10 bg-gray-50 dark:bg-white/5">
              <div className="flex items-center justify-between">
                <h3 className="text-sm text-gray-900 dark:text-white flex items-center gap-2">
                  <BoltIcon className="h-5 w-5 text-gray-500 dark:text-slate-300" />
                  Actions rapides
                </h3>
              </div>
            </div>

            <div className="p-4 grid grid-cols-1 gap-3">
              {(actionItems || []).length ? (
                actionItems.slice(0, 4).map((a, idx) => (
                  <motion.button
                    key={a.label}
                    type="button"
                    className="group w-full rounded-2xl bg-white dark:bg-slate-900 border border-gray-200/70 dark:border-white/10 px-4 py-3 shadow-sm hover:shadow flex items-center justify-between"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 + idx * 0.05, duration: 0.3 }}
                    whileHover={{ y: -1 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => {
                      if (typeof onNavigate === 'function') onNavigate(a.to);
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-2xl bg-gray-50 dark:bg-white/10 border border-gray-200/70 dark:border-white/10 flex items-center justify-center">
                        <a.icon className="h-5 w-5 text-gray-700 dark:text-slate-200" />
                      </div>
                      <div className="text-left">
                        <div className="text-sm text-gray-900 dark:text-white leading-tight">{a.label}</div>
                        <div className="text-xs text-gray-500 dark:text-slate-400">Accès direct</div>
                      </div>
                    </div>
                    <ArrowTrendingUpIcon className="h-5 w-5 text-gray-400 dark:text-slate-400 group-hover:text-gray-700 dark:group-hover:text-white" />
                  </motion.button>
                ))
              ) : (
                <div className="text-sm text-gray-600 dark:text-slate-300">Aucune action disponible.</div>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200/70 dark:border-white/10 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200/60 dark:border-white/10 bg-gray-50 dark:bg-white/5">
              <h3 className="text-sm text-gray-900 dark:text-white flex items-center gap-2">
                <CheckCircleIcon className="h-5 w-5 text-gray-500 dark:text-slate-300" />
                Focus de la semaine
              </h3>
            </div>
            <div className="p-4 space-y-4">
              {[
                { label: 'Engagement membres', value: 72, color: 'from-emerald-500 to-teal-500' },
                { label: 'Organisation événements', value: 58, color: 'from-indigo-500 to-purple-500' },
                { label: 'Suivi finances', value: 64, color: 'from-amber-500 to-orange-500' },
              ].map((kpi) => (
                <div key={kpi.label}>
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-gray-700 dark:text-slate-300">{kpi.label}</div>
                    <div className="text-xs text-gray-900 dark:text-white">{kpi.value}%</div>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-gray-200/70 dark:bg-white/10 overflow-hidden">
                    <motion.div
                      className={`h-2 rounded-full bg-gradient-to-r ${kpi.color}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${kpi.value}%` }}
                      transition={{ duration: 0.9, ease: 'easeOut' }}
                    />
                  </div>
                </div>
              ))}

              <div className="rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200/70 dark:border-white/10 p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-2xl bg-white dark:bg-slate-900 border border-gray-200/70 dark:border-white/10 flex items-center justify-center">
                    <MegaphoneIcon className="h-5 w-5 text-gray-700 dark:text-slate-200" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm text-gray-900 dark:text-white">Conseil</div>
                    <div className="text-xs text-gray-600 dark:text-slate-300 truncate">Publie une annonce avec image pour plus d’engagement.</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
      ) : null}
      </AnimatePresence>
      </div>
    </motion.div>
  );
}
