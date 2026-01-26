import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { api } from '../services/apiClient';
import { useAuth } from './AuthProvider';

const ApprovalQueueContext = createContext(null);

export function useApprovalQueue() {
  const ctx = useContext(ApprovalQueueContext);
  if (!ctx) throw new Error('useApprovalQueue must be used within ApprovalQueueProvider');
  return ctx;
}

function storageKey(user) {
  const id = user?.id ?? user?.username ?? 'anonymous';
  return `cpd.approvalQueue.v1.${String(id)}`;
}

function normalizeItem(x) {
  if (!x) return null;
  const id = Number(x.id);
  if (!Number.isFinite(id) || id <= 0) return null;

  return {
    id,
    model: x.model || x.model_name || x.modelLabel || null,
    action: x.action || null,
    object_repr: x.object_repr || x.objectRepr || null,
    status: x.status || 'pending',
    rejection_reason: x.rejection_reason || null,
    created_at: x.created_at || null,
    updated_at: x.updated_at || null,
    decided_at: x.decided_at || null,
  };
}

function mergeById(existing, incoming) {
  const map = new Map();

  (existing || []).forEach((it) => {
    const n = normalizeItem(it);
    if (n) map.set(n.id, n);
  });

  (incoming || []).forEach((it) => {
    const n = normalizeItem(it);
    if (!n) return;
    const prev = map.get(n.id);
    map.set(n.id, { ...(prev || {}), ...n });
  });

  const out = Array.from(map.values());
  out.sort((a, b) => {
    const da = Date.parse(a.created_at || '') || 0;
    const db = Date.parse(b.created_at || '') || 0;
    if (db !== da) return db - da;
    return b.id - a.id;
  });
  return out;
}

export default function ApprovalQueueProvider({ children }) {
  const { user } = useAuth();

  const rawRole = user?.is_superuser ? 'super_admin' : user?.is_staff ? 'admin' : user?.role;
  const role = rawRole === 'administrator' ? 'admin' : rawRole === 'pastor' ? 'super_admin' : rawRole;
  const isAdmin = role === 'admin' || role === 'super_admin';

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const keyRef = useRef('');

  useEffect(() => {
    const key = storageKey(user);
    keyRef.current = key;

    if (!user) {
      setItems([]);
      setError('');
      setLoading(false);
      return;
    }

    try {
      const raw = window.localStorage.getItem(key);
      const parsed = raw ? JSON.parse(raw) : null;
      const loaded = Array.isArray(parsed?.items) ? parsed.items : [];
      setItems(mergeById([], loaded));
    } catch {
      setItems([]);
    }
  }, [user?.id, user?.username]);

  useEffect(() => {
    const key = keyRef.current;
    if (!key) return;

    try {
      window.localStorage.setItem(key, JSON.stringify({ version: 1, items }));
    } catch {
      return;
    }
  }, [items]);

  const addPending = useCallback((req) => {
    const id = Number(req?.id);
    if (!Number.isFinite(id) || id <= 0) return;

    const nowIso = new Date().toISOString();
    const item = {
      id,
      model: req?.model || null,
      action: req?.action || null,
      object_repr: req?.object_repr || null,
      status: 'pending',
      created_at: nowIso,
      updated_at: nowIso,
      decided_at: null,
      rejection_reason: null,
    };

    setItems((prev) => mergeById(prev, [item]));
  }, []);

  const dismiss = useCallback((id) => {
    const num = Number(id);
    if (!Number.isFinite(num) || num <= 0) return;
    setItems((prev) => (prev || []).filter((x) => Number(x?.id) !== num));
  }, []);

  const refresh = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError('');

    try {
      if (!isAdmin) {
        const res = await api.get('/api/approval-requests/');
        const data = Array.isArray(res.data) ? res.data : res.data?.results || [];
        setItems((prev) => mergeById(prev, data));
        return;
      }

      const ids = (items || []).map((x) => Number(x?.id)).filter((x) => Number.isFinite(x) && x > 0);
      if (!ids.length) return;

      const results = [];
      for (const id of ids) {
        try {
          const r = await api.get(`/api/approval-requests/${id}/`);
          if (r?.data) results.push(r.data);
        } catch {
          continue;
        }
      }

      if (results.length) {
        setItems((prev) => mergeById(prev, results));
      }
    } catch {
      setError('Impossible de charger vos demandes.');
    } finally {
      setLoading(false);
    }
  }, [isAdmin, items, user]);

  useEffect(() => {
    if (!user) return undefined;
    refresh();
    const id = window.setInterval(() => {
      refresh();
    }, 25000);
    return () => window.clearInterval(id);
  }, [refresh, user]);

  const pendingCount = useMemo(() => (items || []).filter((x) => x?.status === 'pending').length, [items]);

  const value = useMemo(
    () => ({
      items,
      pendingCount,
      loading,
      error,
      addPending,
      dismiss,
      refresh,
    }),
    [addPending, dismiss, error, items, loading, pendingCount, refresh]
  );

  return <ApprovalQueueContext.Provider value={value}>{children}</ApprovalQueueContext.Provider>;
}
