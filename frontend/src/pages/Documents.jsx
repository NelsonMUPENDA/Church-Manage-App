import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowDownTrayIcon, ArrowUpTrayIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

import { api } from '../services/apiClient';
import { useAuth } from '../contexts/AuthProvider';
import { useToast } from '../components/ToastProvider';

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
  const [q, setQ] = useState('');
  const [docType, setDocType] = useState('');

  const fileUrl = (path) => {
    if (!path || typeof path !== 'string') return '';
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    const base = api.defaults?.baseURL || '';
    if (!base) return path;
    if (path.startsWith('/')) return `${base}${path}`;
    return `${base}/${path}`;
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

  const startUpload = () => {
    if (inputRef.current) inputRef.current.click();
  };

  const onFileChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setUploading(true);
    try {
      const title = window.prompt('Titre du document ?') || file.name;
      const document_type = window.prompt('Type (sermon|official|report|other) ?') || 'other';

      const form = new FormData();
      form.append('title', title);
      form.append('document_type', document_type);
      form.append('file', file);

      await api.post('/api/documents/', form);
      toast.push({ type: 'success', title: 'Document importé' });
      await load();
    } catch (err) {
      toast.push({ type: 'error', title: 'Erreur', message: "Impossible d'importer le document." });
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
            <input ref={inputRef} type="file" className="hidden" onChange={onFileChange} />
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
        {docs.map((d, idx) => (
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
                <p className="text-gray-600">{d.document_type} • {d.uploaded_at || d.created_at || '—'}</p>
              </div>
              <span className="text-xs font-semibold bg-purple-50 text-purple-700 px-2 py-1 rounded-full">{d.document_type}</span>
            </div>

            <div className="mt-4 flex justify-end">
              {d.file ? (
                <a
                  href={fileUrl(d.file)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white/80 border border-white/60 text-gray-900 shadow hover:shadow-md"
                >
                  <ArrowDownTrayIcon className="h-5 w-5" />
                  Ouvrir
                </a>
              ) : null}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
