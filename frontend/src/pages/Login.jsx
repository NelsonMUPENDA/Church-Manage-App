import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowPathIcon,
  ChartBarIcon,
  EyeIcon,
  EyeSlashIcon,
  HeartIcon,
  LockClosedIcon,
  SparklesIcon,
  UserGroupIcon,
  UserIcon,
} from '@heroicons/react/24/outline';

import Logo from '../components/Logo';
import { useAuth } from '../contexts/AuthProvider';
import { useToast } from '../components/ToastProvider';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const toast = useToast();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const from = location.state?.from?.pathname || '/dashboard';

  const onSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSubmitting(true);
    try {
      await login({ username, password });
      toast.push({ type: 'success', title: 'Connexion réussie', message: 'Bienvenue !' });
      navigate(from, { replace: true });
    } catch (err) {
      const status = err?.response?.status;
      const detail = err?.response?.data?.detail;

      const isNetworkError = !err?.response && (err?.message === 'Network Error' || err?.code === 'ERR_NETWORK');
      if (isNetworkError) {
        const host = (typeof window !== 'undefined' && window?.location?.hostname) ? window.location.hostname : 'IP_DU_PC';
        const msg = `API injoignable. Vérifie que le backend tourne sur http://${host}:8000 et que le pare-feu Windows autorise le port 8000.`;
        setErrorMsg(msg);
        toast.push({ type: 'error', title: 'Connexion échouée', message: msg });
      } else if (status === 401) {
        setErrorMsg(detail || 'Vérifiez vos identifiants.');
        toast.push({ type: 'error', title: 'Connexion échouée', message: detail || 'Vérifiez vos identifiants.' });
      } else {
        setErrorMsg(detail || 'Impossible de se connecter.');
        toast.push({ type: 'error', title: 'Connexion échouée', message: detail || 'Impossible de se connecter.' });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const canSubmit = !!(username || '').trim() && !!(password || '').trim() && !submitting;

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-indigo-200/35 blur-3xl dark:bg-indigo-600/12" />
        <div className="absolute -bottom-28 -right-28 h-80 w-80 rounded-full bg-purple-200/35 blur-3xl dark:bg-purple-600/12" />
        <motion.div
          className="absolute top-1/3 left-1/2 -translate-x-1/2 h-96 w-96 rounded-full bg-gradient-to-br from-emerald-200/25 to-indigo-200/20 blur-3xl dark:from-emerald-500/8 dark:to-indigo-500/8"
          animate={{ scale: [1, 1.08, 1], rotate: [0, 10, 0] }}
          transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
        />
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              'linear-gradient(to right, rgba(99,102,241,0.12) 1px, transparent 1px), linear-gradient(to bottom, rgba(99,102,241,0.10) 1px, transparent 1px)',
            backgroundSize: '72px 72px',
            maskImage: 'radial-gradient(circle at 50% 40%, black 35%, transparent 70%)',
            WebkitMaskImage: 'radial-gradient(circle at 50% 40%, black 35%, transparent 70%)',
          }}
        />
      </div>

      <div className="relative z-10 min-h-screen grid grid-cols-1 lg:grid-cols-2">
        <div className="hidden lg:block relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-fuchsia-600" />
          <div className="absolute inset-0 opacity-35" style={{ backgroundImage: 'radial-gradient(circle at 20% 20%, rgba(255,255,255,0.55), transparent 45%), radial-gradient(circle at 78% 30%, rgba(255,255,255,0.35), transparent 42%), radial-gradient(circle at 40% 86%, rgba(255,255,255,0.35), transparent 40%)' }} />

          <motion.div
            className="absolute -top-10 -left-10 h-56 w-56 rounded-full bg-white/15 blur-2xl"
            animate={{ x: [0, 20, 0], y: [0, 16, 0], scale: [1, 1.06, 1] }}
            transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute -bottom-16 -right-16 h-72 w-72 rounded-full bg-white/10 blur-2xl"
            animate={{ x: [0, -24, 0], y: [0, -14, 0], scale: [1.04, 1, 1.04] }}
            transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
          />

          <div className="relative h-full p-10 flex flex-col justify-between">
            <div>
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45 }}
                className="inline-flex items-center gap-2 rounded-full bg-white/15 border border-white/20 px-3 py-1.5 text-white/90"
              >
                <SparklesIcon className="h-4 w-4" />
                <span className="text-xs font-semibold tracking-wide">Gestion & Église Consolation et Paix Divine</span>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.05 }}
                className="mt-6"
              >
                <div className="text-4xl font-black tracking-tight text-white">Consolation et Paix Divine</div>
                <div className="mt-2 text-base text-white/90 max-w-xl">
                  Une plateforme moderne pour servir l’Église, organiser les activités, suivre les membres et gérer les ressources avec excellence.
                </div>
              </motion.div>

              <div className="mt-10 grid grid-cols-2 gap-4 max-w-xl">
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, delay: 0.12 }}
                  className="rounded-3xl bg-white/12 border border-white/20 p-4 backdrop-blur"
                >
                  <div className="h-10 w-10 rounded-2xl bg-white/15 flex items-center justify-center">
                    <UserGroupIcon className="h-5 w-5 text-white" />
                  </div>
                  <div className="mt-3 text-sm font-extrabold text-white">Gestion des membres</div>
                  <div className="mt-1 text-xs text-white/85">Profils, présence, départements, suivi.</div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, delay: 0.16 }}
                  className="rounded-3xl bg-white/12 border border-white/20 p-4 backdrop-blur"
                >
                  <div className="h-10 w-10 rounded-2xl bg-white/15 flex items-center justify-center">
                    <ChartBarIcon className="h-5 w-5 text-white" />
                  </div>
                  <div className="mt-3 text-sm font-extrabold text-white">Gestion & rapports</div>
                  <div className="mt-1 text-xs text-white/85">Suivi, statistiques, exports & PDF.</div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, delay: 0.2 }}
                  className="rounded-3xl bg-white/12 border border-white/20 p-4 backdrop-blur"
                >
                  <div className="h-10 w-10 rounded-2xl bg-white/15 flex items-center justify-center">
                    <HeartIcon className="h-5 w-5 text-white" />
                  </div>
                  <div className="mt-3 text-sm font-extrabold text-white">Service & amour</div>
                  <div className="mt-1 text-xs text-white/85">Unité, édification et impact.</div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, delay: 0.24 }}
                  className="rounded-3xl bg-white/12 border border-white/20 p-4 backdrop-blur"
                >
                  <div className="h-10 w-10 rounded-2xl bg-white/15 flex items-center justify-center">
                    <SparklesIcon className="h-5 w-5 text-white" />
                  </div>
                  <div className="mt-3 text-sm font-extrabold text-white">Excellence</div>
                  <div className="mt-1 text-xs text-white/85">Clarté, sécurité et simplicité.</div>
                </motion.div>
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.28 }}
              className="text-xs text-white/80"
            >
              « Tout ce que vous faites, faites-le de bon cœur, comme pour le Seigneur. »
            </motion.div>
          </div>
        </div>

        <div className="flex items-center justify-center px-4 sm:px-6 py-10">
          <motion.div
            className="relative w-full max-w-md"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
          >
            <div className="cpd-surface p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-8">
                <motion.div
                  className="h-12 w-12 rounded-2xl bg-white/90 dark:bg-slate-900/40 border border-gray-200/70 dark:border-white/10 flex items-center justify-center shadow-sm"
                  whileHover={{ rotate: 2, scale: 1.02 }}
                  transition={{ type: 'spring', stiffness: 250, damping: 18 }}
                >
                  <Logo className="h-8 w-8" />
                </motion.div>
                <div className="min-w-0">
                  <div className="text-base sm:text-lg font-semibold tracking-tight text-gray-900 dark:text-white truncate">Consolation et Paix Divine</div>
                  <div className="text-sm text-gray-600 dark:text-slate-300">Connexion</div>
                </div>
              </div>

              <form onSubmit={onSubmit} className="space-y-5">
                {errorMsg ? (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-2xl border border-red-200/70 dark:border-red-500/20 bg-red-50/70 dark:bg-red-500/10 px-4 py-3"
                  >
                    <div className="text-sm font-semibold text-red-700 dark:text-red-200">Connexion refusée</div>
                    <div className="text-sm text-red-700/80 dark:text-red-200/80">{errorMsg}</div>
                  </motion.div>
                ) : null}

                <div>
                  <label className="cpd-label">Nom d’utilisateur</label>
                  <div className="mt-1 relative">
                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="cpd-input pl-10"
                      placeholder="ex: admin"
                      autoComplete="username"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="cpd-label">Mot de passe</label>
                  <div className="mt-1 relative">
                    <LockClosedIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="cpd-input pl-10 pr-12"
                      placeholder="••••••••"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white"
                      aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                    >
                      {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <motion.button
                  type="submit"
                  disabled={!canSubmit}
                  className="w-full cpd-btn cpd-btn-solid px-4 py-3 disabled:opacity-60 disabled:cursor-not-allowed"
                  whileHover={{ scale: canSubmit ? 1.02 : 1 }}
                  whileTap={{ scale: canSubmit ? 0.99 : 1 }}
                >
                  <span className="inline-flex items-center justify-center gap-2">
                    {submitting ? (
                      <motion.span
                        className="inline-flex"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                      >
                        <ArrowPathIcon className="h-5 w-5" />
                      </motion.span>
                    ) : null}
                    {submitting ? 'Connexion…' : 'Se connecter'}
                  </span>
                </motion.button>

                <div className="text-xs text-gray-500 dark:text-slate-400">
                  Identifiants par défaut: <span className="font-semibold">admin / admin123</span>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
