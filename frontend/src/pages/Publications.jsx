import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRightIcon,
  BookOpenIcon,
  CalendarDaysIcon,
} from '@heroicons/react/24/outline';

import Logo from '../components/Logo';
import { api, API_BASE_URL } from '../services/apiClient';

export default function Publications() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rows, setRows] = useState([]);

  const mediaUrl = useCallback((path) => {
    if (!path) return '';
    const s = String(path);
    if (!s) return '';
    if (s.startsWith('http://') || s.startsWith('https://')) return s;
    return `${API_BASE_URL}${s}`;
  }, [API_BASE_URL]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/api/announcements/');
      const data = Array.isArray(res.data) ? res.data : (res.data?.results || []);
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      setRows([]);
      setError('Impossible de charger les publications.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const items = useMemo(() => (rows || []).slice(0, 50), [rows]);

  return (
    <div className="min-h-screen cpd-dynamic-theme bg-gradient-to-br from-slate-50 via-white to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950">
      <header className="sticky top-0 z-40 bg-white/75 dark:bg-slate-900/55 backdrop-blur border-b border-gray-200/70 dark:border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-white/90 dark:bg-slate-900/40 border border-gray-200/70 dark:border-white/10 flex items-center justify-center shadow-sm">
              <Logo className="h-7 w-7" />
            </div>
            <div className="leading-tight">
              <div className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white">
                Consolation et Paix Divine
              </div>
              <div className="text-xs text-gray-500 dark:text-slate-300">Publications</div>
            </div>
          </Link>

          <nav className="hidden sm:flex items-center gap-1">
            <NavLink
              to="/eglise"
              className={({ isActive }) =>
                [
                  'px-3 py-2 rounded-xl text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-indigo-50 dark:bg-white/10 text-indigo-700 dark:text-white'
                    : 'text-gray-700 dark:text-slate-200 hover:bg-gray-100/80 dark:hover:bg-white/5',
                ].join(' ')
              }
            >
              Présentation
            </NavLink>
            <NavLink
              to="/publications"
              className={({ isActive }) =>
                [
                  'px-3 py-2 rounded-xl text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-indigo-50 dark:bg-white/10 text-indigo-700 dark:text-white'
                    : 'text-gray-700 dark:text-slate-200 hover:bg-gray-100/80 dark:hover:bg-white/5',
                ].join(' ')
              }
            >
              Publications
            </NavLink>
          </nav>

          <Link
            to="/login"
            className="inline-flex items-center gap-2 cpd-btn cpd-btn-solid px-4 py-2"
          >
            Se connecter
            <ArrowRightIcon className="h-4 w-4" />
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-gray-900 dark:text-white">
            Publications & annonces
          </h1>
          <p className="mt-2 text-gray-700 dark:text-slate-200">
            Actualités, communications et informations de l’Église.
          </p>
        </div>

        {error ? (
          <div className="mb-4 rounded-2xl border border-rose-200/70 dark:border-rose-500/20 bg-rose-50/70 dark:bg-rose-500/10 px-4 py-3 text-sm text-rose-700 dark:text-rose-200">
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="text-sm text-gray-600 dark:text-slate-300">Chargement…</div>
        ) : items.length === 0 ? (
          <div className="cpd-surface p-5">
            <div className="text-sm font-semibold text-gray-900 dark:text-white">Aucune publication</div>
            <div className="mt-1 text-sm text-gray-700 dark:text-slate-200">
              Les annonces publiées apparaîtront ici.
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((row) => {
              const img = mediaUrl(row?.image || row?.cover_image || row?.photo);
              const title = String(row?.title || row?.subject || 'Annonce').trim();
              const body = String(row?.content || row?.message || row?.body || '').trim();
              const when = String(row?.published_date || row?.created_at || '').replace('T', ' ').slice(0, 16);

              return (
                <motion.div
                  key={row?.id || title}
                  className="cpd-surface p-5 overflow-hidden"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="flex items-start gap-4">
                    <div className="shrink-0">
                      {img ? (
                        <img
                          src={img}
                          alt="Illustration"
                          className="h-20 w-20 rounded-2xl object-cover border border-gray-200/70 dark:border-white/10"
                        />
                      ) : (
                        <div className="h-20 w-20 rounded-2xl bg-indigo-50 dark:bg-white/10 border border-gray-200/70 dark:border-white/10 flex items-center justify-center">
                          <BookOpenIcon className="h-7 w-7 text-indigo-700 dark:text-indigo-200" />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-base font-bold text-gray-900 dark:text-white break-words">
                            {title}
                          </div>
                          {when ? (
                            <div className="mt-1 text-xs text-gray-500 dark:text-slate-300 inline-flex items-center gap-1">
                              <CalendarDaysIcon className="h-4 w-4" />
                              {when}
                            </div>
                          ) : null}
                        </div>
                      </div>

                      {body ? (
                        <div className="mt-2 text-sm text-gray-700 dark:text-slate-200 whitespace-pre-wrap">
                          {body}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
