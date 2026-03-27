import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRightIcon,
  BuildingLibraryIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';

import Logo from '../components/Logo';
import { api } from '../services/apiClient';

export default function PublicChurch() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [biography, setBiography] = useState(null);
  const [consistory, setConsistory] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [bioRes, conRes] = await Promise.all([
        api.get('/api/church-biography/'),
        api.get('/api/church-consistory/'),
      ]);
      const bioData = bioRes?.data?.results || bioRes?.data || [];
      const conData = conRes?.data?.results || conRes?.data || [];
      setBiography((Array.isArray(bioData) ? bioData : []).at(0) || null);
      setConsistory((Array.isArray(conData) ? conData : []).at(0) || null);
    } catch (e) {
      setError("Impossible de charger la présentation.");
      setBiography(null);
      setConsistory(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const bioText = useMemo(() => String(biography?.content || '').trim(), [biography]);
  const conText = useMemo(() => String(consistory?.content || '').trim(), [consistory]);

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
              <div className="text-xs text-gray-500 dark:text-slate-300">Présentation</div>
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
            Présentation de l’Église
          </h1>
          <p className="mt-2 text-gray-700 dark:text-slate-200">
            Découvrez notre histoire, notre vision et l’équipe de responsables.
          </p>
        </div>

        {error ? (
          <div className="mb-4 rounded-2xl border border-rose-200/70 dark:border-rose-500/20 bg-rose-50/70 dark:bg-rose-500/10 px-4 py-3 text-sm text-rose-700 dark:text-rose-200">
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="text-sm text-gray-600 dark:text-slate-300">Chargement…</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <motion.div
              className="cpd-surface p-5"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
            >
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
                <BuildingLibraryIcon className="h-5 w-5 text-indigo-700 dark:text-indigo-200" />
                Biographie
              </div>
              <div className="mt-3 text-sm text-gray-700 dark:text-slate-200 whitespace-pre-line">
                {bioText || (
                  <>
                    Consolation et Paix Divine est une communauté chrétienne dédiée à l'édification spirituelle,
                    à l'amour fraternel et au service.
                  </>
                )}
              </div>
            </motion.div>

            <motion.div
              className="cpd-surface p-5"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: 0.03 }}
            >
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
                <UsersIcon className="h-5 w-5 text-indigo-700 dark:text-indigo-200" />
                Consistoire
              </div>
              <div className="mt-3 text-sm text-gray-700 dark:text-slate-200 whitespace-pre-line">
                {conText || (
                  <>
                    Le consistoire regroupe les responsables de l'église et les équipes de gestion.
                    Cette section peut présenter les responsables et leurs fonctions.
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </main>
    </div>
  );
}
