import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MagnifyingGlassIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

import { api } from '../services/apiClient';

export default function AuditLogs() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [page, setPage] = useState(1);
  const [pageMeta, setPageMeta] = useState({ count: 0, next: null, previous: null });

  const [model, setModel] = useState('');
  const [action, setAction] = useState('');
  const [q, setQ] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = { page };
      if (model) params.model = model;
      if (action) params.action = action;
      if (q.trim()) params.q = q.trim();

      const res = await api.get('/api/audit-logs/', { params });
      const data = Array.isArray(res.data) ? res.data : res.data?.results || [];
      setItems(data);
      setPageMeta({
        count: Number.isFinite(res.data?.count) ? res.data.count : Array.isArray(res.data) ? res.data.length : 0,
        next: res.data?.next || null,
        previous: res.data?.previous || null,
      });
    } catch (e) {
      setError("Impossible de charger l'historique.");
    } finally {
      setLoading(false);
    }
  }, [action, model, page, q]);

  useEffect(() => {
    setPage(1);
  }, [model, action, q]);

  useEffect(() => {
    const t = setTimeout(() => {
      load();
    }, 200);
    return () => clearTimeout(t);
  }, [load]);

  const rows = useMemo(() => {
    return items.map((x) => {
      const when = x.created_at ? new Date(x.created_at).toLocaleString() : '—';
      const who = x.actor_username || '—';
      const what = x.object_repr || x.object_id || '—';
      return { ...x, when, who, what };
    });
  }, [items]);

  const badgeClass = (val) => {
    if (val === 'create') return 'bg-emerald-50 text-emerald-700';
    if (val === 'update') return 'bg-amber-50 text-amber-700';
    if (val === 'delete') return 'bg-rose-50 text-rose-700';
    return 'bg-gray-100 text-gray-700';
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Audit Logs</h2>
          <p className="text-gray-600">Traçabilité des actions administratives.</p>
        </div>

        <button
          type="button"
          className="cpd-btn cpd-btn-ghost px-3 py-2"
          onClick={() => {
            if (window.history.length > 1) navigate(-1);
            else navigate('/account', { state: { section: 'security' } });
          }}
        >
          <span className="inline-flex items-center gap-2">
            <ArrowLeftIcon className="h-4 w-4" />
            Retour
          </span>
        </button>
      </div>

      <div className="mb-4 bg-white/80 backdrop-blur-md border border-white/60 rounded-2xl shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
          <div className="md:col-span-2">
            <div className="text-xs font-semibold text-gray-600 mb-1">Recherche</div>
            <div className="relative">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white/80 px-10 py-2 text-sm font-medium text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
                placeholder="Objet, id, acteur…"
              />
            </div>
          </div>
          <div>
            <div className="text-xs font-semibold text-gray-600 mb-1">Modèle</div>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-white/80 px-3 py-2 text-sm font-medium text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
            >
              <option value="">Tous</option>
              <option value="Member">Member</option>
              <option value="FinancialTransaction">FinancialTransaction</option>
              <option value="Document">Document</option>
            </select>
          </div>
          <div>
            <div className="text-xs font-semibold text-gray-600 mb-1">Action</div>
            <select
              value={action}
              onChange={(e) => setAction(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-white/80 px-3 py-2 text-sm font-medium text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
            >
              <option value="">Toutes</option>
              <option value="create">create</option>
              <option value="update">update</option>
              <option value="delete">delete</option>
            </select>
          </div>
        </div>
      </div>

      {error ? <div className="mb-4 bg-rose-50 text-rose-700 border border-rose-100 rounded-xl p-4">{error}</div> : null}

      <div className="overflow-hidden bg-white/80 backdrop-blur-md border border-white/60 rounded-2xl shadow">
        <table className="w-full text-left">
          <thead className="bg-gray-50/70">
            <tr className="text-sm text-gray-600">
              <th className="px-4 py-3 font-semibold">Date</th>
              <th className="px-4 py-3 font-semibold">Acteur</th>
              <th className="px-4 py-3 font-semibold">Action</th>
              <th className="px-4 py-3 font-semibold">Modèle</th>
              <th className="px-4 py-3 font-semibold">Objet</th>
              <th className="px-4 py-3 font-semibold">IP</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td className="px-4 py-6 text-gray-500" colSpan={6}>
                  Chargement…
                </td>
              </tr>
            ) : null}

            {!loading && rows.length === 0 ? (
              <tr>
                <td className="px-4 py-10 text-gray-500" colSpan={6}>
                  Aucun log.
                </td>
              </tr>
            ) : null}

            {!loading
              ? rows.map((r) => (
                  <tr key={r.id} className="hover:bg-indigo-50/40 transition-colors">
                    <td className="px-4 py-3 text-gray-900">{r.when}</td>
                    <td className="px-4 py-3 text-gray-700">{r.who}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-[11px] font-semibold ${badgeClass(r.action)}`}>{r.action}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{r.model}</td>
                    <td className="px-4 py-3 text-gray-900">{r.what}</td>
                    <td className="px-4 py-3 text-gray-600">{r.ip_address || '—'}</td>
                  </tr>
                ))
              : null}
          </tbody>
        </table>

        <div className="px-4 py-3 flex items-center justify-between border-t border-gray-100 bg-white/60">
          <div className="text-sm text-gray-600">
            Total: <span className="font-semibold text-gray-900">{pageMeta.count || 0}</span>
          </div>
          <div className="flex items-center gap-2">
            <motion.button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={!pageMeta.previous || loading}
              className="px-3 py-1.5 rounded-lg bg-white/80 border border-white/60 text-gray-900 shadow hover:shadow-md disabled:opacity-60"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
            >
              Précédent
            </motion.button>
            <div className="text-sm font-semibold text-gray-900 px-2">Page {page}</div>
            <motion.button
              type="button"
              onClick={() => setPage((p) => p + 1)}
              disabled={!pageMeta.next || loading}
              className="px-3 py-1.5 rounded-lg bg-white/80 border border-white/60 text-gray-900 shadow hover:shadow-md disabled:opacity-60"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
            >
              Suivant
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
}
