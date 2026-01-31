import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowDownTrayIcon, ArrowUpTrayIcon, MagnifyingGlassIcon, TrashIcon } from '@heroicons/react/24/outline';

import { api } from '../services/apiClient';
import { useAuth } from '../contexts/AuthProvider';
import { useToast } from '../components/ToastProvider';

const MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024;
const PAGE_SIZE = 10;
const ALLOWED_EXTENSIONS = new Set(['.pdf', '.doc', '.docx', '.ppt', '.pptx', '.xls', '.xlsx']);

const getFileExtension = (name) => {
  const s = String(name || '').trim();
  const idx = s.lastIndexOf('.');
  if (idx === -1) return '';
  return s.slice(idx).toLowerCase();
};

const stripExtension = (name) => {
  const s = String(name || '').trim();
  return s.replace(/\.[^/.]+$/, '');
};

const fileNameFromPath = (path) => {
  const s = String(path || '');
  const clean = s.split('?')[0].split('#')[0];
  const last = clean.lastIndexOf('/');
  return last >= 0 ? clean.slice(last + 1) : clean;
};

const formatDateTime = (value) => {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString('fr-FR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatApiError = (err, fallback) => {
  const data = err?.response?.data;
  if (!data) return fallback;
  if (typeof data === 'string') return data;
  if (Array.isArray(data)) return data.map((x) => String(x)).join('\n');
  if (typeof data === 'object') {
    if (typeof data.detail === 'string') return data.detail;
    if (typeof data.error === 'string') return data.error;
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

export default function Documents() {
  const toast = useToast();
  const { user } = useAuth();

  const role = user?.is_superuser || user?.is_staff ? 'admin' : user?.role;
  const isAdmin = role === 'admin' || role === 'super_admin';

  const inputRef = useRef(null);

  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [q, setQ] = useState('');
  const [docType, setDocType] = useState('');
  const [page, setPage] = useState(1);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil((docs.length || 0) / PAGE_SIZE));
  }, [docs.length]);

  const pageDocs = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return docs.slice(start, start + PAGE_SIZE);
  }, [docs, page]);

  const fileUrl = (path) => {
    if (!path || typeof path !== 'string') return '';
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    const base = api.defaults?.baseURL || '';
    if (!base) return path;
    if (path.startsWith('/')) return `${base}${path}`;
    return `${base}/${path}`;
  };

  const deleteDocument = async (doc) => {
    const id = doc?.id;
    if (!id) return;
    setConfirmDelete(doc);
  };

  const handleConfirmDelete = async () => {
    const doc = confirmDelete;
    if (!doc?.id) return;
    setConfirmDelete(null);
    setDeletingId(doc.id);
    try {
      await api.delete(`/api/documents/${doc.id}/`);
      toast.push({ type: 'success', title: 'Document supprimé' });
      await load();
    } catch (err) {
      toast.push({ type: 'error', title: 'Erreur', message: formatApiError(err, 'Impossible de supprimer le document.') });
    } finally {
      setDeletingId(null);
    }
  };

  const ConfirmDeleteModal = ({ doc, onCancel, onConfirm }) => {
    if (!doc) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-2xl shadow-2xl p-6 m-4 max-w-sm w-full"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center">
              <TrashIcon className="h-6 w-6 text-rose-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Supprimer le document</h3>
              <p className="text-sm text-gray-600">Cette action est irréversible.</p>
            </div>
          </div>

          <div className="mb-6 p-3 bg-gray-50 rounded-xl">
            <p className="text-sm font-medium text-gray-900">{doc.title}</p>
            {doc.document_type && (
              <p className="text-xs text-gray-500 mt-1">Type: {doc.document_type}</p>
            )}
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-2 rounded-xl border border-gray-200 bg-white text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className="flex-1 px-4 py-2 rounded-xl bg-rose-600 text-white font-medium hover:bg-rose-700 transition-colors"
            >
              Continuer
            </button>
          </div>
        </motion.div>
      </div>
    );
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (q.trim()) params.q = q.trim();
      if (docType) params.document_type = docType;
      const res = await api.get('/api/documents/', { params });
      const data = Array.isArray(res.data) ? res.data : res.data?.results || [];
      setDocs(data);
    } catch (e) {
      setError('Impossible de charger les documents.');
    } finally {
      setLoading(false);
    }
  }, [q, docType]);

  useEffect(() => {
    const t = setTimeout(() => {
      load();
    }, 250);
    return () => clearTimeout(t);
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [q, docType]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const startUpload = () => {
    if (inputRef.current) inputRef.current.click();
  };

  const onFileChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    const ext = getFileExtension(file.name);
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      toast.push({
        type: 'error',
        title: 'Fichier non accepté',
        message: 'Formats acceptés: PDF, Word, Excel, PowerPoint.',
      });
      return;
    }

    if (Number(file.size || 0) > MAX_UPLOAD_SIZE_BYTES) {
      const maxMb = Math.round((MAX_UPLOAD_SIZE_BYTES / (1024 * 1024)) * 10) / 10;
      toast.push({
        type: 'error',
        title: 'Fichier trop volumineux',
        message: `Taille maximale: ${maxMb} MB.`,
      });
      return;
    }

    setUploading(true);
    try {
      const defaultTitle = stripExtension(file.name) || file.name;
      const rawTitle = window.prompt('Nom du document ?', defaultTitle);
      if (rawTitle === null) return;
      const title = String(rawTitle || '').trim();
      if (!title) {
        toast.push({ type: 'error', title: 'Nom requis', message: 'Veuillez saisir le nom du document.' });
        return;
      }

      const rawType = window.prompt('Type (sermon|official|report|other) ?', 'other');
      const document_type = String(rawType || 'other').trim() || 'other';

      const form = new FormData();
      form.append('title', title);
      form.append('document_type', document_type);
      form.append('file', file);

      await api.post('/api/documents/', form);
      toast.push({ type: 'success', title: 'Document importé' });
      await load();
    } catch (err) {
      toast.push({ type: 'error', title: 'Erreur', message: formatApiError(err, "Impossible d'importer le document.") });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Documents</h2>
          <p className="text-gray-600">Sermons / documents (API).</p>
        </div>
        {isAdmin ? (
          <>
            <input
              ref={inputRef}
              type="file"
              className="hidden"
              onChange={onFileChange}
              accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            />
            <motion.button
              onClick={startUpload}
              disabled={uploading}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white shadow hover:shadow-lg disabled:opacity-60"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
            >
              <ArrowUpTrayIcon className="h-5 w-5" />
              {uploading ? 'Import…' : 'Importer'}
            </motion.button>
          </>
        ) : null}
      </div>

      <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="md:col-span-2">
          <div className="relative">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-white/80 px-10 py-2 text-sm font-medium text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
              placeholder="Rechercher un document…"
            />
          </div>
        </div>
        <div>
          <select
            value={docType}
            onChange={(e) => setDocType(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-white/80 px-3 py-2 text-sm font-medium text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
          >
            <option value="">Tous les types</option>
            <option value="sermon">Sermon</option>
            <option value="official">Document officiel</option>
            <option value="report">Rapport</option>
            <option value="other">Autre</option>
          </select>
        </div>
      </div>

      {error ? (
        <div className="mb-4 bg-rose-50 text-rose-700 border border-rose-100 rounded-xl p-4">{error}</div>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {loading ? <div className="text-gray-500">Chargement…</div> : null}
        {!loading && docs.length === 0 ? <div className="text-gray-500">Aucun document.</div> : null}
        {pageDocs.map((d, idx) => (
          <motion.div
            key={d.id}
            className="bg-white/80 backdrop-blur-md border border-white/60 rounded-2xl shadow p-5"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.03 }}
            whileHover={{ scale: 1.01 }}
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{d.title}</h3>
                <p className="text-gray-600">
                  {d.document_type}
                  {(() => {
                    const ext = getFileExtension(fileNameFromPath(d.file));
                    return ext ? ` • ${ext}` : '';
                  })()}
                  {' • '}
                  {formatDateTime(d.uploaded_at || d.created_at)}
                </p>
              </div>
              <span className="text-xs font-semibold bg-purple-50 text-purple-700 px-2 py-1 rounded-full">{d.document_type}</span>
            </div>

            <div className="mt-4 flex justify-end">
              {d.file ? (
                <div className="flex items-center gap-2">
                  <a
                    href={fileUrl(d.file)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white/80 border border-white/60 text-gray-900 shadow hover:shadow-md"
                  >
                    <ArrowDownTrayIcon className="h-5 w-5" />
                    Ouvrir
                  </a>

                  {isAdmin ? (
                    <button
                      type="button"
                      onClick={() => deleteDocument(d)}
                      disabled={deletingId === d.id}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-rose-600 text-white shadow hover:shadow-md disabled:opacity-60"
                    >
                      <TrashIcon className="h-5 w-5" />
                      {deletingId === d.id ? 'Suppression…' : 'Supprimer'}
                    </button>
                  ) : null}
                </div>
              ) : null}
            </div>
          </motion.div>
        ))}
      </div>

      {docs.length > PAGE_SIZE ? (
        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="px-3 py-2 rounded-xl bg-white/80 border border-white/60 text-gray-900 shadow hover:shadow-md disabled:opacity-60"
          >
            Précédent
          </button>

          <div className="text-sm font-semibold text-gray-700">
            Page {page} / {totalPages}
          </div>

          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="px-3 py-2 rounded-xl bg-white/80 border border-white/60 text-gray-900 shadow hover:shadow-md disabled:opacity-60"
          >
            Suivant
          </button>
        </div>
      ) : null}

      <ConfirmDeleteModal
        doc={confirmDelete}
        onCancel={() => setConfirmDelete(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
