import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ShieldCheckIcon,
  UserCircleIcon,
  LockClosedIcon,
  ArrowLeftIcon,
  UserGroupIcon,
  ClipboardDocumentCheckIcon,
} from '@heroicons/react/24/outline';

import { api, API_BASE_URL } from '../services/apiClient';
import { useAuth } from '../contexts/AuthProvider';
import { useToast } from '../components/ToastProvider';
import PhotoPicker from '../components/PhotoPicker';

export default function Account() {
  const { user, refreshMe, logout } = useAuth();
  const toast = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  const initialUsername = user?.username || '';
  const initialFirstName = user?.first_name || '';
  const initialLastName = user?.last_name || '';

  const [username, setUsername] = useState(initialUsername);
  const [firstName, setFirstName] = useState(initialFirstName);
  const [lastName, setLastName] = useState(initialLastName);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [photo, setPhoto] = useState(null);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('personal');

  const wantsUsername = username && username !== initialUsername;
  const wantsPassword = !!newPassword;
  const wantsPhoto = photo instanceof File;
  const wantsName = String(firstName || '').trim() !== String(initialFirstName || '').trim()
    || String(lastName || '').trim() !== String(initialLastName || '').trim();

  const displayName = useMemo(() => {
    const fn = String(user?.first_name || '').trim();
    const ln = String(user?.last_name || '').trim();
    const name = `${fn} ${ln}`.trim();
    return name || user?.username || 'Utilisateur';
  }, [user?.first_name, user?.last_name, user?.username]);

  const roleLabel = useMemo(() => {
    const r = user?.role || '';
    if (!r) return 'Utilisateur';
    return String(r).replace(/_/g, ' ');
  }, [user?.role]);

  const isAdmin = useMemo(() => {
    const rawRole = user?.is_superuser ? 'super_admin' : user?.is_staff ? 'admin' : user?.role;
    const role = rawRole === 'administrator' ? 'admin' : rawRole === 'pastor' ? 'super_admin' : rawRole;
    return role === 'admin' || role === 'super_admin';
  }, [user?.is_staff, user?.is_superuser, user?.role]);

  const userPhotoUrl = useMemo(() => {
    const p = user?.photo;
    if (!p) return '';
    if (String(p).startsWith('http')) return String(p);
    return `${API_BASE_URL}${p}`;
  }, [API_BASE_URL, user?.photo]);

  useEffect(() => {
    setUsername(initialUsername);
    setFirstName(initialFirstName);
    setLastName(initialLastName);
  }, [initialFirstName, initialLastName, initialUsername]);

  const passwordStrength = useMemo(() => {
    const p = String(newPassword || '');
    if (!p) return { score: 0, label: '—', color: 'bg-gray-200/70 dark:bg-white/10' };

    let score = 0;
    if (p.length >= 8) score += 1;
    if (p.length >= 12) score += 1;
    if (/[A-Z]/.test(p)) score += 1;
    if (/[0-9]/.test(p)) score += 1;
    if (/[^A-Za-z0-9]/.test(p)) score += 1;
    score = Math.max(1, Math.min(5, score));

    const label = score <= 2 ? 'Faible' : score === 3 ? 'Moyen' : 'Fort';
    const color = score <= 2 ? 'bg-rose-500/70' : score === 3 ? 'bg-amber-500/70' : 'bg-emerald-500/70';
    return { score, label, color };
  }, [newPassword]);

  useEffect(() => {
    const section = location?.state?.section;
    if (!section) return;
    const key = section === 'security' ? 'security' : 'personal';
    setActiveTab(key);
  }, [location?.state?.section]);

  const canSubmitProfile = useMemo(() => {
    return (wantsPhoto || wantsName) && !saving;
  }, [saving, wantsName, wantsPhoto]);

  const canSubmitSecurity = useMemo(() => {
    if ((!wantsUsername && !wantsPassword) || saving) return false;
    if (!currentPassword) return false;
    if (wantsPassword && newPassword !== confirmPassword) return false;
    return true;
  }, [confirmPassword, currentPassword, newPassword, saving, wantsPassword, wantsUsername]);

  const formatApiError = useCallback((err, fallback) => {
    const data = err?.response?.data;
    if (!data) return fallback;
    if (data?.current_password) return Array.isArray(data.current_password) ? data.current_password.join(' ') : String(data.current_password);
    if (data?.username) return Array.isArray(data.username) ? data.username.join(' ') : String(data.username);
    if (data?.first_name) return Array.isArray(data.first_name) ? data.first_name.join(' ') : String(data.first_name);
    if (data?.last_name) return Array.isArray(data.last_name) ? data.last_name.join(' ') : String(data.last_name);
    if (data?.new_password) return Array.isArray(data.new_password) ? data.new_password.join(' ') : String(data.new_password);
    if (data?.detail) return String(data.detail);
    return fallback;
  }, []);

  const onSaveProfile = useCallback(async (e) => {
    e.preventDefault();
    if (!canSubmitProfile) return;

    setSaving(true);
    try {
      if (wantsPhoto) {
        const fd = new FormData();
        fd.append('photo', photo);
        await api.patch('/api/me/', fd);
      }

      if (wantsName) {
        await api.patch('/api/me/', {
          first_name: String(firstName || '').trim(),
          last_name: String(lastName || '').trim(),
        });
      }

      await refreshMe();
      toast.push({ type: 'success', title: 'Profil', message: 'Profil mis à jour.' });
      setPhoto(null);
    } catch (err) {
      toast.push({ type: 'error', title: 'Profil', message: formatApiError(err, 'Impossible de mettre à jour le profil.') });
    } finally {
      setSaving(false);
    }
  }, [canSubmitProfile, firstName, formatApiError, lastName, photo, refreshMe, toast, wantsName, wantsPhoto]);

  const onSaveSecurity = useCallback(async (e) => {
    e.preventDefault();
    if (!canSubmitSecurity) return;

    if (wantsPassword && newPassword !== confirmPassword) {
      toast.push({ type: 'error', title: 'Sécurité', message: 'Les mots de passe ne correspondent pas.' });
      return;
    }

    setSaving(true);
    try {
      const payload = { current_password: currentPassword };
      if (wantsUsername) payload.username = username;
      if (wantsPassword) payload.new_password = newPassword;
      await api.patch('/api/me/', payload);

      await refreshMe();
      toast.push({ type: 'success', title: 'Sécurité', message: 'Sécurité mise à jour.' });

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      if (newPassword) {
        logout();
        navigate('/login', { replace: true });
      }
    } catch (err) {
      toast.push({ type: 'error', title: 'Sécurité', message: formatApiError(err, 'Impossible de mettre à jour la sécurité.') });
    } finally {
      setSaving(false);
    }
  }, [canSubmitSecurity, confirmPassword, currentPassword, formatApiError, logout, navigate, newPassword, refreshMe, toast, wantsPassword, wantsUsername, username]);

  return (
    <div className="max-w-5xl">
      <div className="cpd-surface p-6 sm:p-8">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="cpd-btn cpd-btn-ghost px-3 py-2"
                onClick={() => {
                  if (window.history.length > 1) navigate(-1);
                  else navigate('/dashboard');
                }}
              >
                <span className="inline-flex items-center gap-2">
                  <ArrowLeftIcon className="h-4 w-4" />
                  Retour
                </span>
              </button>
            </div>
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full border border-gray-200/70 dark:border-white/10 bg-white dark:bg-slate-900 overflow-hidden">
                {userPhotoUrl ? (
                  <img alt="Avatar" src={userPhotoUrl} className="h-16 w-16 object-cover" />
                ) : (
                  <div className="h-16 w-16 flex items-center justify-center text-lg font-semibold text-gray-900 dark:text-white">
                    {(user?.username || 'A').slice(0, 1).toUpperCase()}
                  </div>
                )}
              </div>

              <div className="min-w-0">
                <div className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white truncate">{displayName}</div>
                <div className="mt-1 text-sm text-gray-600 dark:text-slate-300 flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[12px] border border-gray-200/70 dark:border-white/10 bg-gray-50/70 dark:bg-white/5">{roleLabel}</span>
                  <span className="text-gray-500">•</span>
                  <span className="inline-flex items-center gap-2 text-[12px] text-gray-600 dark:text-slate-300">
                    <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                    Actif
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="cpd-tabs">
              <button
                type="button"
                className={['cpd-tab', activeTab === 'personal' ? 'cpd-tab-active' : 'cpd-tab-inactive'].join(' ')}
                onClick={() => setActiveTab('personal')}
              >
                <span className="inline-flex items-center gap-2">
                  <UserCircleIcon className="h-4 w-4" />
                  Profil
                </span>
              </button>
              <button
                type="button"
                className={['cpd-tab', activeTab === 'security' ? 'cpd-tab-active' : 'cpd-tab-inactive'].join(' ')}
                onClick={() => setActiveTab('security')}
              >
                <span className="inline-flex items-center gap-2">
                  <LockClosedIcon className="h-4 w-4" />
                  Sécurité
                </span>
              </button>
            </div>
          </div>

          {activeTab === 'personal' ? (
            <form onSubmit={onSaveProfile} className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="cpd-card p-5 lg:col-span-2">
                <div className="text-sm font-semibold text-gray-900 dark:text-white">Informations personnelles</div>
                <div className="text-xs text-gray-500 dark:text-slate-400 mt-1">Identité et photo de profil.</div>

                <div className="mt-4">
                  <label className="cpd-label">Photo de profil</label>
                  <PhotoPicker
                    label={null}
                    file={photo}
                    existingUrl={user?.photo || ''}
                    onChange={setPhoto}
                    optional
                    showPreview
                  />
                </div>

                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="cpd-label">Prénom</label>
                    <input
                      className="cpd-input"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      autoComplete="given-name"
                      placeholder="Prénom"
                    />
                  </div>
                  <div>
                    <label className="cpd-label">Nom</label>
                    <input
                      className="cpd-input"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      autoComplete="family-name"
                      placeholder="Nom"
                    />
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-end">
                  <button
                    type="submit"
                    className="cpd-btn cpd-btn-solid px-4 py-2"
                    disabled={!canSubmitProfile}
                  >
                    {saving ? 'Enregistrement…' : 'Enregistrer'}
                  </button>
                </div>
              </div>

              <div className="cpd-card p-5">
                <div className="text-sm font-semibold text-gray-900 dark:text-white">Aperçu</div>
                <div className="text-xs text-gray-500 dark:text-slate-400 mt-1">Informations affichées sur l’application.</div>
                <div className="mt-4 space-y-3">
                  <div>
                    <div className="text-xs text-gray-500 dark:text-slate-400">Nom</div>
                    <div className="text-sm text-gray-900 dark:text-white">{displayName}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 dark:text-slate-400">Rôle</div>
                    <div className="text-sm text-gray-900 dark:text-white">{roleLabel}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 dark:text-slate-400">Statut</div>
                    <div className="text-sm text-gray-900 dark:text-white inline-flex items-center gap-2">
                      <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                      Actif
                    </div>
                  </div>
                </div>
              </div>
            </form>
          ) : (
            <form onSubmit={onSaveSecurity} className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="cpd-card p-5 lg:col-span-2">
                <div className="text-sm font-semibold text-gray-900 dark:text-white">Sécurité</div>
                <div className="text-xs text-gray-500 dark:text-slate-400 mt-1">Gestion du nom d’utilisateur et du mot de passe.</div>

                <div className="mt-4">
                  <label className="cpd-label">Nom d’utilisateur</label>
                  <input
                    className="cpd-input"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    autoComplete="username"
                    placeholder={initialUsername || 'Nom d’utilisateur'}
                  />
                  <div className="text-xs text-gray-500 dark:text-slate-400 mt-1">Actuel: {initialUsername || '—'}</div>
                </div>

                <div className="mt-4">
                  <label className="cpd-label">Mot de passe actuel</label>
                  <input
                    className="cpd-input"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                    placeholder="Requis pour confirmer la modification"
                  />
                </div>

                <div className="mt-4">
                  <label className="cpd-label">Nouveau mot de passe</label>
                  <input
                    className="cpd-input"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    autoComplete="new-password"
                    placeholder="Laisse vide pour ne pas changer"
                  />
                  <div className="mt-2 flex items-center justify-between gap-3">
                    <div className="text-xs text-gray-500 dark:text-slate-400 inline-flex items-center gap-2">
                      <ShieldCheckIcon className="h-4 w-4" />
                      Force: <span className="font-semibold text-gray-700 dark:text-slate-200">{passwordStrength.label}</span>
                    </div>
                    <div className="h-2 w-28 rounded-full bg-gray-200/70 dark:bg-white/10 overflow-hidden">
                      <div
                        className={['h-2 rounded-full transition-all duration-200', passwordStrength.color].join(' ')}
                        style={{ width: `${Math.round((passwordStrength.score / 5) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <label className="cpd-label">Confirmer le nouveau mot de passe</label>
                  <input
                    className="cpd-input"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                    disabled={!newPassword}
                    placeholder="Répéter le mot de passe"
                  />
                  {newPassword && confirmPassword && newPassword !== confirmPassword ? (
                    <div className="text-xs text-rose-700 mt-1">Les mots de passe ne correspondent pas.</div>
                  ) : null}
                </div>

                <div className="mt-4 flex items-center justify-end">
                  <button
                    type="submit"
                    className="cpd-btn cpd-btn-solid px-4 py-2"
                    disabled={!canSubmitSecurity}
                  >
                    {saving ? 'Mise à jour…' : 'Mettre à jour la sécurité'}
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {isAdmin ? (
                  <div className="cpd-card p-5">
                    <div className="text-sm font-semibold text-gray-900 dark:text-white">Administration</div>
                    <div className="text-xs text-gray-500 dark:text-slate-400 mt-1">Gérer les comptes, rôles et permissions.</div>

                    <div className="mt-4 space-y-2">
                      <button
                        type="button"
                        className="cpd-btn cpd-btn-outline w-full justify-between px-3 py-2"
                        onClick={() => navigate('/users')}
                      >
                        <span className="inline-flex items-center gap-2">
                          <UserGroupIcon className="h-5 w-5" />
                          Gestion des utilisateurs & rôles
                        </span>
                        <span className="text-xs text-gray-500 dark:text-slate-400">Ouvrir</span>
                      </button>

                      <button
                        type="button"
                        className="cpd-btn cpd-btn-outline w-full justify-between px-3 py-2"
                        onClick={() => navigate('/audit-logs')}
                      >
                        <span className="inline-flex items-center gap-2">
                          <ClipboardDocumentCheckIcon className="h-5 w-5" />
                          Journal d’audit
                        </span>
                        <span className="text-xs text-gray-500 dark:text-slate-400">Ouvrir</span>
                      </button>
                    </div>
                  </div>
                ) : null}

                <div className="cpd-card p-5">
                  <div className="text-sm font-semibold text-gray-900 dark:text-white">Conseils</div>
                  <div className="text-xs text-gray-500 dark:text-slate-400 mt-1">Bonnes pratiques de sécurité.</div>
                  <div className="mt-4 text-sm text-gray-700 dark:text-slate-200 space-y-2">
                    <div>Utilise au moins 12 caractères.</div>
                    <div>Mélange lettres, chiffres et symboles.</div>
                    <div>Évite les mots de passe réutilisés.</div>
                  </div>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
