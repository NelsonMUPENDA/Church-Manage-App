import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { PlusIcon, MagnifyingGlassIcon, PencilSquareIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/outline';

import { api } from '../services/apiClient';
import { useToast } from '../components/ToastProvider';
import { useApprovalQueue } from '../contexts/ApprovalQueueProvider';

export default function Logistics() {
  const toast = useToast();
  const { addPending } = useApprovalQueue();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [items, setItems] = useState([]);
  const [q, setQ] = useState('');

  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const defaultForm = useCallback(() => {
    return {
      name: '',
      category: '',
      asset_tag: '',
      quantity: 1,
      unit: '',
      condition: 'good',
      location: '',
      acquired_date: '',
      purchase_price: '',
      supplier: '',
      notes: '',
      is_active: true,
    };
  }, []);

  const [form, setForm] = useState(defaultForm());

  const inputClass = 'cpd-input';
  const selectClass = 'cpd-select';

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

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (q.trim()) params.q = q.trim();
      const res = await api.get('/api/logistics-items/', { params });
      const data = Array.isArray(res.data) ? res.data : res.data?.results || [];
      setItems(data);
    } catch (e) {
      const status = e?.response?.status;
      if (status === 401) setError('Session expirée. Reconnectez-vous.');
      else if (status === 403) setError("Accès refusé. Rôle admin requis.");
      else setError('Impossible de charger les matériels.');
    } finally {
      setLoading(false);
    }
  }, [q]);

  useEffect(() => {
    const t = setTimeout(() => {
      load();
    }, 200);
    return () => clearTimeout(t);
  }, [load]);

  const rows = useMemo(() => {
    const out = [...items];
    out.sort((a, b) => String(a?.name || '').localeCompare(String(b?.name || ''), 'fr', { sensitivity: 'base' }));
    return out;
  }, [items]);

  const openCreate = () => {
    setEditingId(null);
    setForm(defaultForm());
    setOpen(true);
  };

  const openEdit = (item) => {
    setEditingId(item?.id || null);
    setForm({
      name: item?.name || '',
      category: item?.category || '',
      asset_tag: item?.asset_tag || '',
      quantity: Number.isFinite(Number(item?.quantity)) ? Number(item.quantity) : 1,
      unit: item?.unit || '',
      condition: item?.condition || 'good',
      location: item?.location || '',
      acquired_date: item?.acquired_date || '',
      purchase_price: item?.purchase_price ?? '',
      supplier: item?.supplier || '',
      notes: item?.notes || '',
      is_active: item?.is_active !== false,
    });
    setOpen(true);
  };

  const close = () => {
    if (saving) return;
    setOpen(false);
    setEditingId(null);
    setForm(defaultForm());
  };

  const normalizePayload = (f) => {
    const payload = {
      name: (f.name || '').trim(),
      category: (f.category || '').trim() || null,
      asset_tag: (f.asset_tag || '').trim() || null,
      quantity: Number(f.quantity),
      unit: (f.unit || '').trim() || null,
      condition: f.condition || 'good',
      location: (f.location || '').trim() || null,
      acquired_date: f.acquired_date || null,
      purchase_price: f.purchase_price === '' || f.purchase_price === null || f.purchase_price === undefined ? null : Number(f.purchase_price),
      supplier: (f.supplier || '').trim() || null,
      notes: (f.notes || '').trim() || null,
      is_active: !!f.is_active,
    };

    Object.keys(payload).forEach((k) => {
      if (payload[k] === '') payload[k] = null;
    });

    return payload;
  };

  const submit = async (e) => {
    e.preventDefault();

    if (!String(form.name || '').trim()) {
      toast.push({ type: 'error', title: 'Nom requis', message: 'Renseignez le nom du matériel.' });
      return;
    }

    const qty = Number(form.quantity);
    if (!Number.isFinite(qty) || qty <= 0) {
      toast.push({ type: 'error', title: 'Quantité invalide', message: 'Entrez une quantité supérieure à 0.' });
      return;
    }

    setSaving(true);
    try {
      const payload = normalizePayload(form);
      if (editingId) {
        const res = await api.patch(`/api/logistics-items/${editingId}/`, payload);
        if (res?.status === 202) {
          const approvalId = res?.data?.approval_request_id;
          if (approvalId) addPending({ id: approvalId, model: 'LogisticsItem', action: 'update' });
          toast.push({ type: 'info', title: 'En attente', message: "Modification soumise à approbation de l'administrateur." });
          close();
          return;
        }
        toast.push({ type: 'success', title: 'Matériel mis à jour' });
      } else {
        const res = await api.post('/api/logistics-items/', payload);
        if (res?.status === 202) {
          const approvalId = res?.data?.approval_request_id;
          if (approvalId) addPending({ id: approvalId, model: 'LogisticsItem', action: 'create' });
          toast.push({ type: 'info', title: 'En attente', message: "Création soumise à approbation de l'administrateur." });
          close();
          return;
        }
        toast.push({ type: 'success', title: 'Matériel enregistré' });
      }
      close();
      await load();
    } catch (err) {
      toast.push({ type: 'error', title: 'Erreur', message: formatApiError(err, "Impossible d'enregistrer.") });
    } finally {
      setSaving(false);
    }
  };

  const remove = async (item) => {
    const label = item?.asset_tag ? `${item.name} (${item.asset_tag})` : item?.name || `#${item?.id}`;
    if (!window.confirm(`Supprimer le matériel ${label} ?`)) return;
    try {
      const res = await api.delete(`/api/logistics-items/${item.id}/`);
      if (res?.status === 202) {
        const approvalId = res?.data?.approval_request_id;
        if (approvalId) addPending({ id: approvalId, model: 'LogisticsItem', action: 'delete' });
        toast.push({ type: 'info', title: 'En attente', message: "Suppression soumise à approbation de l'administrateur." });
        await load();
        return;
      }
      toast.push({ type: 'success', title: 'Supprimé' });
      await load();
    } catch (err) {
      toast.push({ type: 'error', title: 'Erreur', message: formatApiError(err, 'Impossible de supprimer.') });
    }
  };

  const conditionLabel = (c) => {
    if (c === 'new') return 'Neuf';
    if (c === 'good') return 'Bon';
    if (c === 'fair') return 'Moyen';
    if (c === 'needs_repair') return 'À réparer';
    if (c === 'damaged') return 'Endommagé';
    return c || '—';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white">Logistique</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-slate-300">Inventaire des matériels de l'église: enregistrement, suivi et mise à jour.</p>
        </div>

        <button
          onClick={openCreate}
          className="cpd-btn cpd-btn-solid"
        >
          <PlusIcon className="h-5 w-5" />
          Ajouter un matériel
        </button>
      </div>

      <div className="cpd-card p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <div className="relative w-full sm:w-96">
              <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Rechercher (nom, catégorie, code, emplacement...)"
                className={`pl-10 ${inputClass}`}
              />
            </div>
          </div>

          <div className="text-sm text-gray-600 dark:text-slate-300">Total: <span className="font-semibold text-gray-900 dark:text-white">{rows.length}</span></div>
        </div>

        {error ? (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
        ) : null}

        <div className="mt-4 overflow-hidden rounded-2xl border border-gray-100 dark:border-white/10 bg-white dark:bg-white/5">
          <div className="max-h-[60vh] overflow-auto cpd-table-wrap">
            <table className="cpd-table min-w-[980px] text-sm">
              <thead className="sticky top-0 z-10 bg-white/95 backdrop-blur">
                <tr className="text-left text-xs uppercase tracking-wider text-gray-500">
                <th className="py-2 pr-3">Matériel</th>
                <th className="py-2 pr-3">Catégorie</th>
                <th className="py-2 pr-3">Code</th>
                <th className="py-2 pr-3">Qté</th>
                <th className="py-2 pr-3">État</th>
                <th className="py-2 pr-3">Emplacement</th>
                <th className="py-2 pr-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-gray-500">Chargement...</td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-gray-500">Aucun matériel.</td>
                  </tr>
                ) : (
                  rows.map((it) => (
                    <tr key={it.id} className="border-t border-gray-100 hover:bg-gray-50/60">
                      <td className="py-3 pr-3">
                        <div className="font-semibold text-gray-900 dark:text-white">{it.name}</div>
                        {it.supplier ? <div className="text-xs text-gray-500">Fournisseur: {it.supplier}</div> : null}
                      </td>
                      <td className="py-3 pr-3 text-gray-700 dark:text-slate-200">{it.category || '—'}</td>
                      <td className="py-3 pr-3 text-gray-700 dark:text-slate-200">{it.asset_tag || '—'}</td>
                      <td className="py-3 pr-3 text-gray-700 dark:text-slate-200">
                        {it.quantity}
                        {it.unit ? ` ${it.unit}` : ''}
                      </td>
                      <td className="py-3 pr-3 text-gray-700 dark:text-slate-200">{conditionLabel(it.condition)}</td>
                      <td className="py-3 pr-3 text-gray-700 dark:text-slate-200">{it.location || '—'}</td>
                      <td className="py-3 pr-0">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => openEdit(it)}
                            className="cpd-btn cpd-btn-outline px-3 py-2 text-xs"
                          >
                            <PencilSquareIcon className="h-4 w-4" />
                            Modifier
                          </button>
                          <button
                            onClick={() => remove(it)}
                            className="cpd-btn px-3 py-2 text-xs border border-rose-200/70 dark:border-rose-500/20 bg-rose-50/70 dark:bg-rose-500/10 text-rose-700 dark:text-rose-200 hover:bg-rose-100/70 dark:hover:bg-rose-500/15"
                          >
                            <TrashIcon className="h-4 w-4" />
                            Supprimer
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-3xl cpd-surface shadow-xl"
          >
            <div className="flex items-start justify-between gap-4 border-b border-gray-100 dark:border-white/10 p-5">
              <div>
                <div className="text-xs uppercase tracking-wider text-gray-500 dark:text-slate-400">Fiche matériel</div>
                <div className="mt-1 text-xl font-black text-gray-900 dark:text-white">{editingId ? 'Modifier' : 'Nouveau matériel'}</div>
              </div>
              <button
                onClick={close}
                className="rounded-xl p-2 text-gray-500 hover:bg-gray-100 dark:text-slate-300 dark:hover:bg-white/5"
                aria-label="Fermer"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={submit} className="max-h-[calc(90vh-84px)] overflow-y-auto p-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold text-gray-600 dark:text-slate-300">Nom du matériel *</label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    className={`mt-1 ${inputClass}`}
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-600 dark:text-slate-300">Catégorie</label>
                  <input
                    value={form.category}
                    onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                    className={`mt-1 ${inputClass}`}
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-600 dark:text-slate-300">Code inventaire (Asset Tag)</label>
                  <input
                    value={form.asset_tag}
                    onChange={(e) => setForm((f) => ({ ...f, asset_tag: e.target.value }))}
                    className={`mt-1 ${inputClass}`}
                    placeholder="Ex: CPD-LOG-0001"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-600 dark:text-slate-300">Quantité *</label>
                  <input
                    type="number"
                    min={1}
                    value={form.quantity}
                    onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
                    className={`mt-1 ${inputClass}`}
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-600 dark:text-slate-300">Unité</label>
                  <input
                    value={form.unit}
                    onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
                    className={`mt-1 ${inputClass}`}
                    placeholder="Ex: pièces, cartons, chaises"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-600 dark:text-slate-300">État</label>
                  <select
                    value={form.condition}
                    onChange={(e) => setForm((f) => ({ ...f, condition: e.target.value }))}
                    className={`mt-1 ${selectClass}`}
                  >
                    <option value="new">Neuf</option>
                    <option value="good">Bon</option>
                    <option value="fair">Moyen</option>
                    <option value="needs_repair">À réparer</option>
                    <option value="damaged">Endommagé</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-600 dark:text-slate-300">Emplacement</label>
                  <input
                    value={form.location}
                    onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                    className={`mt-1 ${inputClass}`}
                    placeholder="Ex: Salle principale, Dépôt, Bureau"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-600 dark:text-slate-300">Date d'acquisition</label>
                  <input
                    type="date"
                    value={form.acquired_date}
                    onChange={(e) => setForm((f) => ({ ...f, acquired_date: e.target.value }))}
                    className={`mt-1 ${inputClass}`}
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-600 dark:text-slate-300">Prix d'achat</label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={form.purchase_price}
                    onChange={(e) => setForm((f) => ({ ...f, purchase_price: e.target.value }))}
                    className={`mt-1 ${inputClass}`}
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-600 dark:text-slate-300">Fournisseur</label>
                  <input
                    value={form.supplier}
                    onChange={(e) => setForm((f) => ({ ...f, supplier: e.target.value }))}
                    className={`mt-1 ${inputClass}`}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold text-gray-600 dark:text-slate-300">Notes</label>
                  <textarea
                    value={form.notes}
                    onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                    className={`mt-1 min-h-[90px] ${inputClass}`}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-slate-200">
                    <input
                      type="checkbox"
                      checked={!!form.is_active}
                      onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    Actif (disponible)
                  </label>
                </div>
              </div>

              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={close}
                  className="cpd-btn cpd-btn-outline"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="cpd-btn cpd-btn-solid"
                >
                  {saving ? 'Enregistrement...' : editingId ? 'Mettre à jour' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      ) : null}
    </div>
  );
}
