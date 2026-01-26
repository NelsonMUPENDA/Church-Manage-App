import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

import { api } from '../services/apiClient';
import { useAuth } from '../contexts/AuthProvider';
import { useToast } from '../components/ToastProvider';

const ROLE_OPTIONS = [
  { value: 'pastor', label: 'Pasteur' },
  { value: 'administrator', label: 'Administrateur' },
  { value: 'protocol_head', label: 'Chef Protocole' },
  { value: 'financial_head', label: 'Chef Finances' },
  { value: 'logistics_head', label: 'Chef Logistique' },
  { value: 'evangelism_head', label: 'Chef Évangélisation' },
];

export default function Users() {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const roleOptions = useMemo(() => ROLE_OPTIONS, []);

  const [query, setQuery] = useState('');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({
    username: '',
    password: '',
    role: 'visitor',
    is_active: true,
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/api/users/');
      const data = Array.isArray(res.data) ? res.data : res.data?.results || [];
      setRows(Array.isArray(data) ? data : []);
    } catch {
      setRows([]);
      setError('Impossible de charger les utilisateurs.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = String(query || '').trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((u) => {
      const s = `${u.username || ''} ${u.first_name || ''} ${u.last_name || ''} ${u.email || ''} ${u.role || ''}`.toLowerCase();
      return s.includes(q);
    });
  }, [query, rows]);

  const roleLabel = useCallback((r) => {
    const opt = roleOptions.find((x) => x.value === r);
    return opt ? opt.label : r || '—';
  }, [roleOptions]);

  const startCreate = () => {
    setForm({
      username: '',
      password: '',
      role: 'protocol_head',
      is_active: true,
    });
    setCreateOpen(true);
  };

  const submitCreate = useCallback(async (e) => {
    e.preventDefault();
    const username = String(form.username || '').trim();
    const password = String(form.password || '').trim();
    if (!username) {
      toast.push({ type: 'error', title: 'Utilisateur', message: "Nom d'utilisateur requis." });
      return;
    }
    if (!password || password.length < 6) {
      toast.push({ type: 'error', title: 'Utilisateur', message: 'Mot de passe requis (min 6 caractères).' });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        username,
        password,
        role: form.role,
        is_active: !!form.is_active,
      };

      await api.post('/api/users/', payload);
      toast.push({
        type: 'success',
        title: 'Utilisateur créé',
        message: `Compte: ${username} / ${password}`,
        ttl: 8000,
      });
      setCreateOpen(false);
      await load();
    } catch (err) {
      const data = err?.response?.data;
      const msg = data && typeof data === 'object' ? JSON.stringify(data) : 'Impossible de créer.';
      toast.push({ type: 'error', title: 'Utilisateur', message: msg });
    } finally {
      setSaving(false);
    }
  }, [form.is_active, form.password, form.role, form.username, load, toast]);

  const blockUser = useCallback(async (id) => {
    if (!id) return;
    setSaving(true);
    try {
      await api.post(`/api/users/${id}/block/`);
      toast.push({ type: 'success', title: 'Utilisateur', message: 'Utilisateur bloqué.' });
      await load();
    } catch {
      toast.push({ type: 'error', title: 'Utilisateur', message: 'Impossible de bloquer.' });
    } finally {
      setSaving(false);
    }
  }, [load, toast]);

  const deleteUser = useCallback(async (u) => {
    if (!u?.id) return;
    if (String(u.id) === String(user?.id)) {
      toast.push({ type: 'error', title: 'Utilisateur', message: 'Impossible de supprimer votre propre compte.' });
      return;
    }
    const ok = window.confirm(`Supprimer l'utilisateur ${u.username || ''} ? Cette action est irréversible.`);
    if (!ok) return;
    setSaving(true);
    try {
      await api.delete(`/api/users/${u.id}/`);
      toast.push({ type: 'success', title: 'Utilisateur', message: 'Utilisateur supprimé.' });
      await load();
    } catch {
      toast.push({ type: 'error', title: 'Utilisateur', message: 'Impossible de supprimer.' });
    } finally {
      setSaving(false);
    }
  }, [load, toast, user?.id]);

  const unblockUser = useCallback(async (id) => {
    if (!id) return;
    setSaving(true);
    try {
      await api.post(`/api/users/${id}/unblock/`);
      toast.push({ type: 'success', title: 'Utilisateur', message: 'Utilisateur débloqué.' });
      await load();
    } catch {
      toast.push({ type: 'error', title: 'Utilisateur', message: 'Impossible de débloquer.' });
    } finally {
      setSaving(false);
    }
  }, [load, toast]);

  const resetPassword = useCallback(async (id, username) => {
    if (!id) return;
    const pwd = window.prompt(`Nouveau mot de passe pour ${username || 'utilisateur'} :`, '');
    if (!pwd) return;
    if (String(pwd).length < 6) {
      toast.push({ type: 'error', title: 'Mot de passe', message: 'Min 6 caractères.' });
      return;
    }
    setSaving(true);
    try {
      await api.patch(`/api/users/${id}/`, { password: pwd });
      toast.push({ type: 'success', title: 'Mot de passe', message: 'Mot de passe réinitialisé.' });
      await load();
    } catch {
      toast.push({ type: 'error', title: 'Mot de passe', message: 'Impossible de réinitialiser.' });
    } finally {
      setSaving(false);
    }
  }, [load, toast]);

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">Utilisateurs</div>
          <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">
            Création et gestion des comptes (admin uniquement).
          </div>
        </div>

        <div className="flex items-center gap-2">
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

          <button type="button" className="cpd-btn" onClick={startCreate} disabled={saving}>
            Créer un utilisateur
          </button>
        </div>
      </div>

      <div className="mt-6 cpd-surface p-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <input
            className="cpd-input max-w-md"
            placeholder="Rechercher (username, nom, email, rôle)…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button type="button" className="text-sm text-indigo-600 hover:text-indigo-700" onClick={load}>
            Actualiser
          </button>
        </div>

        <div className="mt-4">
          {loading ? (
            <div className="text-sm text-gray-600 dark:text-gray-300">Chargement…</div>
          ) : error ? (
            <div className="text-sm text-red-600">{error}</div>
          ) : filtered.length === 0 ? (
            <div className="text-sm text-gray-600 dark:text-gray-300">Aucun utilisateur.</div>
          ) : (
            <div className="cpd-table-wrap">
              <table className="cpd-table min-w-[720px] text-sm">
                <thead>
                  <tr className="text-left text-gray-500">
                    <th className="py-2">Utilisateur</th>
                    <th className="py-2">Rôle</th>
                    <th className="py-2">Statut</th>
                    <th className="py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-white/10">
                  {filtered.map((u) => (
                    <tr key={u.id}>
                      <td className="py-2">
                        <div className="font-semibold text-gray-900 dark:text-white">{u.username || '—'}</div>
                        <div className="text-xs text-gray-500">
                          {(u.first_name || u.last_name) ? `${u.first_name || ''} ${u.last_name || ''}`.trim() : '—'}
                          {u.email ? ` • ${u.email}` : ''}
                        </div>
                      </td>
                      <td className="py-2">{roleLabel(u.role)}</td>
                      <td className="py-2">
                        {u.is_active ? (
                          <span className="text-green-700">Actif</span>
                        ) : (
                          <span className="text-red-700">Bloqué</span>
                        )}
                      </td>
                      <td className="py-2">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            className="cpd-btn px-3 py-1.5 text-xs"
                            onClick={() => resetPassword(u.id, u.username)}
                            disabled={saving}
                          >
                            Mot de passe
                          </button>
                          {u.is_active ? (
                            <button
                              type="button"
                              className="cpd-btn px-3 py-1.5 text-xs"
                              onClick={() => blockUser(u.id)}
                              disabled={saving}
                            >
                              Bloquer
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="cpd-btn px-3 py-1.5 text-xs"
                              onClick={() => unblockUser(u.id)}
                              disabled={saving}
                            >
                              Débloquer
                            </button>
                          )}
                          <button
                            type="button"
                            className="px-3 py-1.5 text-xs rounded-xl bg-rose-600 text-white shadow hover:shadow disabled:opacity-60"
                            onClick={() => deleteUser(u)}
                            disabled={saving}
                          >
                            Supprimer
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {createOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setCreateOpen(false)} />
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.16 }}
            className="relative w-full max-w-xl rounded-2xl bg-white dark:bg-slate-900 shadow-xl border border-white/60 dark:border-white/10"
          >
            <div className="px-5 py-4 border-b border-gray-100 dark:border-white/10">
              <div className="text-lg font-semibold text-gray-900 dark:text-white">Créer un utilisateur</div>
              <div className="text-xs text-gray-500 mt-1">Comme sur les applications modernes: tu crées un compte et tu donnes le rôle.</div>
            </div>

            <form onSubmit={submitCreate} className="p-5 space-y-4">
              <div>
                <label className="cpd-label">Nom d’utilisateur</label>
                <input
                  className="cpd-input"
                  value={form.username}
                  onChange={(e) => setForm((s) => ({ ...s, username: e.target.value }))}
                  autoComplete="username"
                />
              </div>

              <div>
                <label className="cpd-label">Mot de passe</label>
                <input
                  className="cpd-input"
                  value={form.password}
                  onChange={(e) => setForm((s) => ({ ...s, password: e.target.value }))}
                  type="password"
                  autoComplete="new-password"
                />
              </div>

              <div>
                <label className="cpd-label">Rôle</label>
                <select
                  className="cpd-select"
                  value={form.role}
                  onChange={(e) => setForm((s) => ({ ...s, role: e.target.value }))}
                >
                  {roleOptions.map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-3">
                <input
                  id="isActive"
                  type="checkbox"
                  checked={!!form.is_active}
                  onChange={(e) => setForm((s) => ({ ...s, is_active: e.target.checked }))}
                />
                <label htmlFor="isActive" className="text-sm text-gray-700 dark:text-gray-300">Compte actif</label>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button type="button" className="cpd-btn" onClick={() => setCreateOpen(false)} disabled={saving}>
                  Annuler
                </button>
                <button type="submit" className="cpd-btn" disabled={saving}>
                  {saving ? 'Création…' : 'Créer'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      ) : null}
    </div>
  );
}
