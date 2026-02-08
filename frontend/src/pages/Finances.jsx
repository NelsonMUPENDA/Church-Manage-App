import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { PlusIcon } from '@heroicons/react/24/outline';

import { api } from '../services/apiClient';
import { useToast } from '../components/ToastProvider';
import { useAuth } from '../contexts/AuthProvider';
import { useApprovalQueue } from '../contexts/ApprovalQueueProvider';
import PhotoPicker from '../components/PhotoPicker';

export default function Finances() {
  const toast = useToast();
  const { user } = useAuth();
  const { addPending } = useApprovalQueue();
  const [txs, setTxs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);

  const [events, setEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(false);

  const [page, setPage] = useState(1);
  const [pageMeta, setPageMeta] = useState({ count: 0, next: null, previous: null });

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

  const mediaUrl = (path) => {
    if (!path) return null;
    if (typeof path !== 'string') return null;
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    const base = api.defaults?.baseURL || '';
    if (!base) return path;
    if (path.startsWith('/')) return `${base}${path}`;
    return `${base}/${path}`;
  };

  const defaultIncomeForm = () => ({
    event: '',
    amount: '',
    currency: '',
    transaction_type: 'offering',
    date: new Date().toISOString().slice(0, 10),
    donor_name: '',
    donor_email: '',
    payment_method: '',
    reference_number: '',
    description: '',
  });

  const currencyOptions = useMemo(
    () => [
      { value: 'CDF', label: 'CDF' },
      { value: 'USD', label: 'USD' },
      { value: 'EUR', label: 'EUR' },
      { value: 'GBP', label: 'GBP' },
      { value: 'JPY', label: 'JPY' },
      { value: 'ZAR', label: 'ZAR' },
    ],
    []
  );

  const offeringTypes = useMemo(
    () => [
      { value: 'offering', label: 'Offrandes' },
      { value: 'tithe', label: 'Dîmes' },
      { value: 'thanksgiving', label: 'Actions de grâce' },
      { value: 'seed_vow', label: 'Semences et Vœux' },
      { value: 'gift_other', label: 'Dons et autres' },
    ],
    []
  );

  const expenseMotifs = useMemo(
    () => [
      { value: 'functioning', label: 'Fonctionnement' },
      { value: 'transport_communication', label: 'Transport et communication' },
      { value: 'investment', label: 'Investissement' },
      { value: 'rehabilitation', label: 'Réhabilitation' },
      { value: 'social_assistance', label: 'Assistance Sociale' },
    ],
    []
  );

  const txTypeLabel = useCallback(
    (value) => {
      const v = String(value || '').trim();
      const o = offeringTypes.find((x) => x.value === v);
      if (o) return o.label;
      const m = expenseMotifs.find((x) => x.value === v);
      if (m) return m.label;
      return v || '—';
    },
    [expenseMotifs, offeringTypes]
  );

  const defaultOfferingsRows = useCallback(
    () =>
      offeringTypes.map((t) => ({
        transaction_type: t.value,
        amount: '',
        description: '',
      })),
    [offeringTypes]
  );

  const defaultExpenseForm = () => ({
    link_to_event: false,
    event: '',
    amount: '',
    currency: '',
    transaction_type: 'functioning',
    date: new Date().toISOString().slice(0, 10),
    recipient_name: '',
    recipient_email: '',
    recipient_phone: '',
    payment_method: '',
    reference_number: '',
    description: '',
  });

  const [editingTx, setEditingTx] = useState(null);

  const [activeForm, setActiveForm] = useState('in');
  const [incomeForm, setIncomeForm] = useState(defaultIncomeForm());
  const [expenseForm, setExpenseForm] = useState(defaultExpenseForm());
  const [expenseProof, setExpenseProof] = useState(null);

  const [offeringsRows, setOfferingsRows] = useState(() => defaultOfferingsRows());

  const [directionFilter, setDirectionFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [currencyFilter, setCurrencyFilter] = useState('all');
  const [eventFilter, setEventFilter] = useState('');

  const [q, setQ] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [showHistory, setShowHistory] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showReportPanel, setShowReportPanel] = useState(false);

  const [totalsByCurrency, setTotalsByCurrency] = useState({});

  const [reportPeriod, setReportPeriod] = useState('daily');
  const [report, setReport] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);

  const eventLabel = useCallback(
    (eventId) => {
      if (!eventId) return '—';
      const ev = events.find((e) => String(e.id) === String(eventId));
      if (!ev) return `#${eventId}`;
      return `${ev.date} • ${ev.title}`;
    },
    [events]
  );

  const buildQueryParams = useCallback(
    ({ includePage } = { includePage: true }) => {
      const params = {};

      if (includePage) params.page = page;

      if (directionFilter !== 'all') params.direction = directionFilter;
      if (typeFilter !== 'all') params.transaction_type = typeFilter;
      if (currencyFilter !== 'all') params.currency = currencyFilter;
      if (String(eventFilter || '').trim()) params.event = String(eventFilter).trim();

      if (q.trim()) params.q = q.trim();
      if (startDate) params.start = startDate;
      if (endDate) params.end = endDate;

      if (!showHistory && !startDate && !endDate) {
        const d = new Date(Date.now() - 24 * 60 * 60 * 1000);
        params.start = d.toISOString().slice(0, 10);
      }

      return params;
    },
    [currencyFilter, directionFilter, endDate, eventFilter, page, q, showHistory, startDate, typeFilter]
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = buildQueryParams({ includePage: true });

      const res = await api.get('/api/financial-transactions/', { params });
      const data = Array.isArray(res.data) ? res.data : res.data?.results || [];
      setTxs(data);
      setPageMeta({
        count: Number.isFinite(res.data?.count) ? res.data.count : Array.isArray(res.data) ? res.data.length : 0,
        next: res.data?.next || null,
        previous: res.data?.previous || null,
      });

      try {
        const summaryRes = await api.get('/api/financial-transactions/summary/', {
          params: buildQueryParams({ includePage: false }),
        });
        setTotalsByCurrency(summaryRes.data?.totals || {});
      } catch {
        setTotalsByCurrency({});
      }
    } catch (e) {
      const status = e?.response?.status;
      if (status === 401) {
        setError('Impossible de charger les transactions (session expirée). Reconnectez-vous.');
      } else if (status === 403) {
        setError("Impossible de charger les transactions (accès refusé). Vérifiez votre rôle: chef finances/trésorier/admin.");
      } else if (status === 500) {
        setError("Impossible de charger les transactions (erreur serveur). Appliquez les migrations backend puis redémarrez le serveur.");
      } else {
        setError('Impossible de charger les transactions.');
      }
    } finally {
      setLoading(false);
    }
  }, [buildQueryParams]);

  useEffect(() => {
    setPage(1);
  }, [directionFilter, typeFilter, currencyFilter, eventFilter, q, startDate, endDate, showHistory]);

  useEffect(() => {
    const loadEvents = async () => {
      setLoadingEvents(true);
      try {
        const res = await api.get('/api/events/');
        const data = Array.isArray(res.data) ? res.data : res.data?.results || [];
        data.sort((a, b) => {
          const da = String(a?.date || '');
          const db = String(b?.date || '');
          if (db !== da) return db.localeCompare(da);
          return String(a?.title || '').localeCompare(String(b?.title || ''), 'fr', { sensitivity: 'base' });
        });
        setEvents(data);
      } catch {
        setEvents([]);
      } finally {
        setLoadingEvents(false);
      }
    };
    loadEvents();
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      load();
    }, 200);
    return () => clearTimeout(t);
  }, [load]);

  useEffect(() => {
    if (editingTx?.id) return;
    if (!String(incomeForm.event || '').trim()) return;
    setOfferingsRows(defaultOfferingsRows());
  }, [defaultOfferingsRows, editingTx?.id, incomeForm.event]);

  const filtered = useMemo(() => txs, [txs]);

  const fetchReport = async () => {
    setReportLoading(true);
    try {
      const res = await api.get(`/api/financial-transactions/report/?period=${reportPeriod}`);
      setReport(res.data);
    } catch (e) {
      toast.push({ type: 'error', title: 'Erreur', message: 'Impossible de charger le rapport.' });
    } finally {
      setReportLoading(false);
    }
  };

  const exportExcel = async () => {
    try {
      const res = await api.get('/api/financial-transactions/export/', {
        params: buildQueryParams({ includePage: false }),
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `financial_transactions_${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      toast.push({ type: 'error', title: 'Erreur', message: "Impossible d'exporter le fichier Excel." });
    }
  };

  const cashierDisplay = useMemo(() => {
    if (!user) return '—';
    const n = `${user.first_name || ''} ${user.last_name || ''}`.trim();
    return n || user.username || '—';
  }, [user]);

  const cancelEditing = () => {
    setEditingTx(null);
    setIncomeForm(defaultIncomeForm());
    setExpenseForm(defaultExpenseForm());
    setExpenseProof(null);
    setOfferingsRows(defaultOfferingsRows());
  };

  const startEditing = (tx) => {
    setEditingTx({ id: tx.id, direction: tx.direction });
    if (tx.direction === 'in') {
      setActiveForm('in');
      setIncomeForm({
        event: tx.event ? String(tx.event) : '',
        amount: String(tx.amount ?? ''),
        currency: (tx.currency || '').toUpperCase(),
        transaction_type: tx.transaction_type || 'offering',
        date: tx.date || new Date().toISOString().slice(0, 10),
        donor_name: tx.donor_name || '',
        donor_email: tx.donor_email || '',
        payment_method: tx.payment_method || '',
        reference_number: tx.reference_number || '',
        description: tx.description || '',
      });
    } else {
      setActiveForm('out');
      setExpenseForm({
        link_to_event: !!tx.event,
        event: tx.event ? String(tx.event) : '',
        amount: String(tx.amount ?? ''),
        currency: (tx.currency || '').toUpperCase(),
        transaction_type: tx.transaction_type || 'functioning',
        date: tx.date || new Date().toISOString().slice(0, 10),
        recipient_name: tx.recipient_name || '',
        recipient_email: tx.recipient_email || '',
        recipient_phone: tx.recipient_phone || '',
        payment_method: tx.payment_method || '',
        reference_number: tx.reference_number || '',
        description: tx.description || '',
      });
      setExpenseProof(null);
    }
  };

  const submitIncome = async (e) => {
    e.preventDefault();
    const isActivity = !!String(incomeForm.event || '').trim();

    if (!String(incomeForm.currency || '').trim()) {
      toast.push({ type: 'error', title: 'Devise requise', message: 'Sélectionnez la devise avant de saisir/valider.' });
      return;
    }

    if (editingTx?.id && editingTx.direction === 'in') {
      const amount = Number(incomeForm.amount);
      if (!Number.isFinite(amount) || amount <= 0) {
        toast.push({ type: 'error', title: 'Montant invalide', message: 'Entrez un montant supérieur à 0.' });
        return;
      }
    } else if (isActivity) {
      const items = (offeringsRows || [])
        .map((r) => ({
          transaction_type: r.transaction_type,
          amount: Number(r.amount),
          description: String(r.description || '').trim(),
        }))
        .filter((r) => Number.isFinite(r.amount) && r.amount > 0);

      if (!items.length) {
        toast.push({ type: 'error', title: 'Montants requis', message: 'Renseigne au moins une offrande/dîme/autre (montant > 0).' });
        return;
      }
    } else {
      const amount = Number(incomeForm.amount);
      if (!Number.isFinite(amount) || amount <= 0) {
        toast.push({ type: 'error', title: 'Montant invalide', message: 'Entrez un montant supérieur à 0.' });
        return;
      }
    }

    setCreating(true);
    try {
      if (editingTx?.id && editingTx.direction === 'in') {
        const amount = Number(incomeForm.amount);

        const payload = {
          direction: 'in',
          event: incomeForm.event ? Number(incomeForm.event) : null,
          amount,
          currency: (incomeForm.currency || 'CDF').toUpperCase(),
          transaction_type: incomeForm.transaction_type,
          date: incomeForm.date,
          donor_name: incomeForm.donor_name || null,
          donor_email: incomeForm.donor_email || null,
          payment_method: incomeForm.payment_method || null,
          reference_number: incomeForm.reference_number || null,
          description: incomeForm.description || null,
        };

        const res = await api.patch(`/api/financial-transactions/${editingTx.id}/`, payload);
        if (res?.status === 202) {
          const approvalId = res?.data?.approval_request_id;
          if (approvalId) addPending({ id: approvalId, model: 'FinancialTransaction', action: 'update' });
          toast.push({ type: 'info', title: 'En attente', message: "Modification soumise à approbation de l'administrateur." });
          cancelEditing();
          return;
        }
        toast.push({ type: 'success', title: 'Entrée mise à jour' });
      } else if (isActivity) {
        const items = (offeringsRows || [])
          .map((r) => ({
            transaction_type: r.transaction_type,
            amount: Number(r.amount),
            description: String(r.description || '').trim(),
          }))
          .filter((r) => Number.isFinite(r.amount) && r.amount > 0);

        for (const it of items) {
          const payload = {
            direction: 'in',
            event: Number(incomeForm.event),
            amount: it.amount,
            currency: (incomeForm.currency || 'CDF').toUpperCase(),
            transaction_type: it.transaction_type,
            date: incomeForm.date,
            donor_name: incomeForm.donor_name || null,
            donor_email: incomeForm.donor_email || null,
            payment_method: incomeForm.payment_method || null,
            reference_number: incomeForm.reference_number || null,
            description: it.description || null,
          };
          const res = await api.post('/api/financial-transactions/', payload);
          if (res?.status === 202) {
            const approvalId = res?.data?.approval_request_id;
            if (approvalId) addPending({ id: approvalId, model: 'FinancialTransaction', action: 'create' });
            toast.push({ type: 'info', title: 'En attente', message: "Offrande soumise à approbation de l'administrateur." });
          }
        }

        toast.push({
          type: 'success',
          title: 'Offrandes enregistrées',
          message: `${items.length} ligne(s) envoyée(s). Si vous n'êtes pas admin, elles resteront en attente jusqu'à approbation.`,
        });
      } else {
        const amount = Number(incomeForm.amount);
        if (!Number.isFinite(amount) || amount <= 0) {
          toast.push({ type: 'error', title: 'Montant invalide', message: 'Entrez un montant supérieur à 0.' });
          return;
        }

        const payload = {
          direction: 'in',
          event: null,
          amount,
          currency: (incomeForm.currency || 'CDF').toUpperCase(),
          transaction_type: incomeForm.transaction_type || 'offering',
          date: incomeForm.date,
          donor_name: incomeForm.donor_name || null,
          donor_email: incomeForm.donor_email || null,
          payment_method: incomeForm.payment_method || null,
          reference_number: incomeForm.reference_number || null,
          description: incomeForm.description || null,
        };

        const res = await api.post('/api/financial-transactions/', payload);
        if (res?.status === 202) {
          const approvalId = res?.data?.approval_request_id;
          if (approvalId) addPending({ id: approvalId, model: 'FinancialTransaction', action: 'create' });
          toast.push({ type: 'info', title: 'En attente', message: "Entrée soumise à approbation de l'administrateur." });
          cancelEditing();
          return;
        }
        toast.push({ type: 'success', title: 'Entrée enregistrée', message: "Le reçu PDF est généré automatiquement (et envoyé par email si l'adresse est renseignée)." });
      }

      cancelEditing();
      await load();
    } catch (err) {
      toast.push({ type: 'error', title: 'Erreur', message: formatApiError(err, "Impossible d'enregistrer l'entrée.") });
    } finally {
      setCreating(false);
    }
  };

  const submitExpense = async (e) => {
    e.preventDefault();
    if (!expenseForm.link_to_event) {
      // keep payload consistent
      if (String(expenseForm.event || '').trim()) {
        setExpenseForm((f) => ({ ...f, event: '' }));
      }
    }

    if (!String(expenseForm.currency || '').trim()) {
      toast.push({ type: 'error', title: 'Devise requise', message: 'Sélectionnez la devise avant de saisir/valider.' });
      return;
    }

    const amount = Number(expenseForm.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.push({ type: 'error', title: 'Montant invalide', message: 'Entrez un montant supérieur à 0.' });
      return;
    }

    if (!String(expenseForm.recipient_name || '').trim()) {
      toast.push({ type: 'error', title: 'Destinataire requis', message: 'Renseignez le nom du destinataire.' });
      return;
    }
    if (!String(expenseForm.recipient_email || '').trim()) {
      toast.push({ type: 'error', title: 'Email requis', message: "Renseignez l'email du destinataire." });
      return;
    }
    if (!String(expenseForm.recipient_phone || '').trim()) {
      toast.push({ type: 'error', title: 'Téléphone requis', message: 'Renseignez le numéro du destinataire.' });
      return;
    }

    if (!expenseProof && !editingTx?.id) {
      toast.push({ type: 'error', title: 'Preuve requise', message: 'Ajoutez une photo (preuve de dépense / reçu).' });
      return;
    }

    setCreating(true);
    try {

      const eventValue = expenseForm.event ? Number(expenseForm.event) : null;
      if (editingTx?.id && editingTx.direction === 'out' && !expenseProof) {
        const res = await api.patch(`/api/financial-transactions/${editingTx.id}/`, {
          direction: 'out',
          event: expenseForm.link_to_event ? eventValue : null,
          amount,
          currency: String((expenseForm.currency || 'CDF').toUpperCase()),
          transaction_type: String(expenseForm.transaction_type || 'functioning'),
          date: expenseForm.date,
          recipient_name: expenseForm.recipient_name || null,
          recipient_email: expenseForm.recipient_email || null,
          recipient_phone: expenseForm.recipient_phone || null,
          payment_method: expenseForm.payment_method || null,
          reference_number: expenseForm.reference_number || null,
          description: expenseForm.description || null,
        });
        if (res?.status === 202) {
          const approvalId = res?.data?.approval_request_id;
          if (approvalId) addPending({ id: approvalId, model: 'FinancialTransaction', action: 'update' });
          toast.push({ type: 'info', title: 'En attente', message: "Modification soumise à approbation de l'administrateur." });
          cancelEditing();
          return;
        }
        toast.push({ type: 'success', title: 'Sortie mise à jour' });
      } else {
        const fd = new FormData();
        fd.append('direction', 'out');
        if (expenseForm.link_to_event && expenseForm.event) fd.append('event', String(expenseForm.event));
        fd.append('amount', String(amount));
        fd.append('currency', String((expenseForm.currency || 'CDF').toUpperCase()));
        fd.append('transaction_type', String(expenseForm.transaction_type || 'functioning'));
        fd.append('date', String(expenseForm.date));
        if (expenseForm.recipient_name) fd.append('recipient_name', expenseForm.recipient_name);
        if (expenseForm.recipient_email) fd.append('recipient_email', expenseForm.recipient_email);
        if (expenseForm.recipient_phone) fd.append('recipient_phone', expenseForm.recipient_phone);
        if (expenseForm.payment_method) fd.append('payment_method', expenseForm.payment_method);
        if (expenseForm.reference_number) fd.append('reference_number', expenseForm.reference_number);
        if (expenseForm.description) fd.append('description', expenseForm.description);
        if (expenseProof) fd.append('proof_image', expenseProof);

        if (editingTx?.id && editingTx.direction === 'out') {
          const res = await api.patch(`/api/financial-transactions/${editingTx.id}/`, fd);
          if (res?.status === 202) {
            const approvalId = res?.data?.approval_request_id;
            if (approvalId) addPending({ id: approvalId, model: 'FinancialTransaction', action: 'update' });
            toast.push({ type: 'info', title: 'En attente', message: "Modification soumise à approbation de l'administrateur." });
            cancelEditing();
            return;
          }
          toast.push({ type: 'success', title: 'Sortie mise à jour' });
        } else {
          const res = await api.post('/api/financial-transactions/', fd);
          if (res?.status === 202) {
            const approvalId = res?.data?.approval_request_id;
            if (approvalId) addPending({ id: approvalId, model: 'FinancialTransaction', action: 'create' });
            toast.push({ type: 'info', title: 'En attente', message: "Sortie soumise à approbation de l'administrateur." });
            cancelEditing();
            return;
          }
          toast.push({ type: 'success', title: 'Sortie enregistrée' });
        }
      }

      cancelEditing();
      await load();
    } catch (err) {
      toast.push({ type: 'error', title: 'Erreur', message: formatApiError(err, "Impossible d'enregistrer la sortie.") });
    } finally {
      setCreating(false);
    }
  };

  const deleteTx = async (tx) => {
    const label = tx.document_number || tx.receipt_code || `#${tx.id}`;
    if (!window.confirm(`Supprimer la transaction ${label} ?`)) return;
    try {
      const res = await api.delete(`/api/financial-transactions/${tx.id}/`);
      if (res?.status === 202) {
        const approvalId = res?.data?.approval_request_id;
        if (approvalId) addPending({ id: approvalId, model: 'FinancialTransaction', action: 'delete' });
        if (editingTx?.id === tx.id) cancelEditing();
        toast.push({ type: 'info', title: 'En attente', message: "Suppression soumise à approbation de l'administrateur." });
        return;
      }
      if (editingTx?.id === tx.id) cancelEditing();
      toast.push({ type: 'success', title: 'Supprimé' });
      await load();
    } catch (err) {
      toast.push({ type: 'error', title: 'Erreur', message: "Impossible de supprimer." });
    }
  };

  const downloadReceiptPdf = async (tx) => {
    try {
      const res = await api.get(`/api/financial-transactions/${tx.id}/receipt/`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      const label = tx.document_number || tx.receipt_code || tx.id;
      a.download = `receipt_${label}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      toast.push({ type: 'error', title: 'Erreur', message: "Impossible de télécharger le reçu." });
    }
  };

  const downloadVoucherPdf = async (tx) => {
    try {
      const res = await api.get(`/api/financial-transactions/${tx.id}/voucher/`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      const label = tx.document_number || tx.id;
      a.download = `voucher_${label}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      toast.push({ type: 'error', title: 'Erreur', message: "Impossible de télécharger le bon de sortie." });
    }
  };

  const downloadReportPdf = async () => {
    try {
      const res = await api.get(`/api/financial-transactions/report-pdf/?period=${reportPeriod}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `report_${reportPeriod}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      toast.push({ type: 'error', title: 'Erreur', message: "Impossible de télécharger le rapport PDF." });
    }
  };

  return (
    <div className="h-full min-h-0 flex flex-col">
      <div className="shrink-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6 min-w-0">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Finances</h2>
          <p className="text-gray-600 dark:text-slate-300">Entrées / sorties multi-devises (API). Numéros générés automatiquement (RC/BS).</p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <motion.button
            onClick={() => setActiveForm('in')}
            className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl shadow transition-all w-full sm:w-auto ${
              activeForm === 'in'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white'
                : 'bg-white/80 text-gray-800 border border-white/60 dark:bg-white/10 dark:text-white dark:border-white/10'
            }`}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
          >
            <PlusIcon className="h-5 w-5" />
            Entrée
          </motion.button>
          <motion.button
            onClick={() => setActiveForm('out')}
            className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl shadow transition-all w-full sm:w-auto ${
              activeForm === 'out'
                ? 'bg-gradient-to-r from-rose-600 to-fuchsia-600 text-white'
                : 'bg-white/80 text-gray-800 border border-white/60 dark:bg-white/10 dark:text-white dark:border-white/10'
            }`}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
          >
            <PlusIcon className="h-5 w-5" />
            Sortie
          </motion.button>
        </div>
      </div>

      <div className="min-h-0 flex-1 pr-1">
        {error ? (
          <div className="mb-4 bg-rose-50 text-rose-700 border border-rose-100 rounded-xl p-4 flex items-center justify-between gap-3">
            <div>{error}</div>
            <motion.button
              onClick={load}
              className="shrink-0 px-3 py-1.5 rounded-lg bg-white/80 border border-white/60 text-gray-900 shadow hover:shadow-md"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
            >
              Réessayer
            </motion.button>
          </div>
        ) : null}

        <div className="mb-4 bg-white/80 dark:bg-white/5 backdrop-blur-md border border-white/60 dark:border-white/10 rounded-2xl shadow p-4 min-w-0">
        <div className="text-xs font-semibold text-gray-600 dark:text-slate-300">Caissier(ère)</div>
        <div className="text-sm font-semibold text-gray-900 dark:text-white mb-3 truncate">{cashierDisplay}</div>

        {activeForm === 'in' ? (
          <form onSubmit={submitIncome} className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            <div className="lg:col-span-3 min-w-0">
              <div className="text-xs font-semibold text-gray-600 mb-1">Activité / Événement</div>
              <select
                value={incomeForm.event}
                onChange={(e) => setIncomeForm((f) => ({ ...f, event: e.target.value }))}
                className="cpd-select"
                disabled={loadingEvents}
              >
                <option value="">— Aucune activité —</option>
                {events.map((ev) => (
                  <option key={ev.id} value={String(ev.id)}>
                    {ev.date} • {String(ev.time || '').slice(0, 5)} • {ev.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="min-w-0">
              <div className="text-xs font-semibold text-gray-600 mb-1">Devise</div>
              <select
                value={incomeForm.currency}
                onChange={(e) => setIncomeForm((f) => ({ ...f, currency: e.target.value }))}
                className="cpd-select"
                required
              >
                <option value="">Sélectionner…</option>
                {currencyOptions.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-gray-600 mb-1">Date</div>
              <input type="date" value={incomeForm.date} onChange={(e) => setIncomeForm((f) => ({ ...f, date: e.target.value }))} className="cpd-input" required />
            </div>

            {String(incomeForm.event || '').trim() && !(editingTx?.id && editingTx.direction === 'in') ? (
              <div className="lg:col-span-3">
                <div className="text-xs font-semibold text-gray-600 mb-1">Offrandes / Dîmes / Autres (activité)</div>
                <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white/70">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50/70">
                      <tr className="text-xs text-gray-600">
                        <th className="px-3 py-2 font-semibold">Catégorie</th>
                        <th className="px-3 py-2 font-semibold">Montant</th>
                        <th className="px-3 py-2 font-semibold">Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {offeringsRows.map((row, idx) => (
                        <tr key={`${row.transaction_type}-${idx}`} className="hover:bg-gray-50/60">
                          <td className="px-3 py-2 text-sm font-semibold text-gray-900">
                            {offeringTypes.find((t) => t.value === row.transaction_type)?.label || row.transaction_type}
                          </td>
                          <td className="px-3 py-2">
                            <input
                              value={row.amount}
                              onChange={(e) =>
                                setOfferingsRows((rows) => rows.map((r, i) => (i === idx ? { ...r, amount: e.target.value } : r)))
                              }
                              className="cpd-input"
                              placeholder="0"
                              disabled={!String(incomeForm.currency || '').trim()}
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              value={row.description}
                              onChange={(e) =>
                                setOfferingsRows((rows) => rows.map((r, i) => (i === idx ? { ...r, description: e.target.value } : r)))
                              }
                              className="cpd-input"
                              placeholder="Ex: offrande spéciale, enveloppe…"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div>
                <div className="text-xs font-semibold text-gray-600 mb-1">Montant</div>
                <input value={incomeForm.amount} onChange={(e) => setIncomeForm((f) => ({ ...f, amount: e.target.value }))} className="cpd-input" placeholder="0" disabled={!String(incomeForm.currency || '').trim()} required />
              </div>
            )}

            {!String(incomeForm.event || '').trim() || (editingTx?.id && editingTx.direction === 'in') ? (
              <div>
                <div className="text-xs font-semibold text-gray-600 mb-1">Type d’entrée</div>
                <select value={incomeForm.transaction_type} onChange={(e) => setIncomeForm((f) => ({ ...f, transaction_type: e.target.value }))} className="cpd-select">
                  {offeringTypes.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}
            <div>
              <div className="text-xs font-semibold text-gray-600 mb-1">Nom du donneur</div>
              <input value={incomeForm.donor_name} onChange={(e) => setIncomeForm((f) => ({ ...f, donor_name: e.target.value }))} className="cpd-input" placeholder="Nom complet" />
            </div>
            <div>
              <div className="text-xs font-semibold text-gray-600 mb-1">Email du donneur</div>
              <input type="email" value={incomeForm.donor_email} onChange={(e) => setIncomeForm((f) => ({ ...f, donor_email: e.target.value }))} className="cpd-input" placeholder="ex: donneur@mail.com" />
            </div>

            <div>
              <div className="text-xs font-semibold text-gray-600 mb-1">Mode de paiement</div>
              <input value={incomeForm.payment_method} onChange={(e) => setIncomeForm((f) => ({ ...f, payment_method: e.target.value }))} className="cpd-input" placeholder="Cash / Mobile Money / Banque..." />
            </div>
            <div>
              <div className="text-xs font-semibold text-gray-600 mb-1">Référence</div>
              <input value={incomeForm.reference_number} onChange={(e) => setIncomeForm((f) => ({ ...f, reference_number: e.target.value }))} className="cpd-input" placeholder="N° transaction / bordereau" />
            </div>

            {!String(incomeForm.event || '').trim() || (editingTx?.id && editingTx.direction === 'in') ? (
              <div>
                <div className="text-xs font-semibold text-gray-600 mb-1">Description</div>
                <input value={incomeForm.description} onChange={(e) => setIncomeForm((f) => ({ ...f, description: e.target.value }))} className="cpd-input" placeholder="Note (optionnel)" />
              </div>
            ) : null}

            <div className="lg:col-span-3 flex flex-col sm:flex-row sm:items-center sm:justify-end gap-2">
              {editingTx?.id ? (
                <motion.button
                  type="button"
                  onClick={cancelEditing}
                  className="w-full sm:w-auto px-4 py-2 rounded-xl bg-white/80 dark:bg-white/10 border border-white/60 dark:border-white/10 text-gray-900 dark:text-white shadow hover:shadow-lg"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Annuler
                </motion.button>
              ) : null}
              <motion.button
                type="submit"
                disabled={creating}
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow hover:shadow-lg disabled:opacity-60"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
              >
                {creating ? 'Enregistrement…' : editingTx?.id ? 'Mettre à jour entrée' : 'Enregistrer entrée'}
              </motion.button>
            </div>
          </form>
        ) : (
          <form onSubmit={submitExpense} className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            <div className="lg:col-span-3 min-w-0">
              <div className="flex items-center justify-between gap-3 mb-1">
                <div className="text-xs font-semibold text-gray-600">Activité / Événement</div>
                <label className="inline-flex items-center gap-2 text-xs font-semibold text-gray-700 select-none">
                  <input
                    type="checkbox"
                    checked={!!expenseForm.link_to_event}
                    onChange={(e) => {
                      const checked = !!e.target.checked;
                      setExpenseForm((f) => ({ ...f, link_to_event: checked, event: checked ? f.event : '' }));
                    }}
                  />
                  Lier la sortie à une activité
                </label>
              </div>
              <select
                value={expenseForm.event}
                onChange={(e) => setExpenseForm((f) => ({ ...f, event: e.target.value }))}
                className="cpd-select"
                disabled={loadingEvents || !expenseForm.link_to_event}
              >
                <option value="">— Aucune activité —</option>
                {events.map((ev) => (
                  <option key={ev.id} value={String(ev.id)}>
                    {ev.date} • {String(ev.time || '').slice(0, 5)} • {ev.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="min-w-0">
              <div className="text-xs font-semibold text-gray-600 mb-1">Montant</div>
              <input value={expenseForm.amount} onChange={(e) => setExpenseForm((f) => ({ ...f, amount: e.target.value }))} className="cpd-input" placeholder="0" required />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-gray-600 mb-1">Devise</div>
              <select value={expenseForm.currency} onChange={(e) => setExpenseForm((f) => ({ ...f, currency: e.target.value }))} className="cpd-select" required>
                <option value="">Sélectionner…</option>
                {currencyOptions.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-gray-600 mb-1">Date</div>
              <input type="date" value={expenseForm.date} onChange={(e) => setExpenseForm((f) => ({ ...f, date: e.target.value }))} className="cpd-input" required />
            </div>

            <div className="min-w-0">
              <div className="text-xs font-semibold text-gray-600 mb-1">Type de motif</div>
              <select value={expenseForm.transaction_type} onChange={(e) => setExpenseForm((f) => ({ ...f, transaction_type: e.target.value }))} className="cpd-select">
                {expenseMotifs.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="min-w-0">
              <div className="text-xs font-semibold text-gray-600 mb-1">Nom du destinataire</div>
              <input value={expenseForm.recipient_name} onChange={(e) => setExpenseForm((f) => ({ ...f, recipient_name: e.target.value }))} className="cpd-input" placeholder="Nom complet" required />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-gray-600 mb-1">Email du destinataire</div>
              <input type="email" value={expenseForm.recipient_email} onChange={(e) => setExpenseForm((f) => ({ ...f, recipient_email: e.target.value }))} className="cpd-input" placeholder="ex: destinataire@mail.com" required />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-gray-600 mb-1">Téléphone du destinataire</div>
              <input value={expenseForm.recipient_phone} onChange={(e) => setExpenseForm((f) => ({ ...f, recipient_phone: e.target.value }))} className="cpd-input" placeholder="+243..." required />
            </div>

            <div className="min-w-0">
              <div className="text-xs font-semibold text-gray-600 mb-1">Mode de paiement</div>
              <input value={expenseForm.payment_method} onChange={(e) => setExpenseForm((f) => ({ ...f, payment_method: e.target.value }))} className="cpd-input" placeholder="Cash / Mobile Money / Banque..." />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-gray-600 mb-1">Référence</div>
              <input value={expenseForm.reference_number} onChange={(e) => setExpenseForm((f) => ({ ...f, reference_number: e.target.value }))} className="cpd-input" placeholder="N° facture / reçu" />
            </div>

            <div className="lg:col-span-2 min-w-0">
              <div className="text-xs font-semibold text-gray-600 mb-1">Description</div>
              <input value={expenseForm.description} onChange={(e) => setExpenseForm((f) => ({ ...f, description: e.target.value }))} className="cpd-input" placeholder="Motif de la dépense" />
            </div>
            <div>
              <div className="text-xs font-semibold text-gray-600 mb-1">Preuve (photo)</div>
              <PhotoPicker
                label="Preuve (photo)"
                file={expenseProof}
                existingUrl={null}
                onChange={(file) => setExpenseProof(file)}
                optional={!!editingTx?.id}
                showPreview
                className="cpd-input"
                labelClassName="sr-only"
              />
            </div>

            <div className="lg:col-span-3 flex flex-col sm:flex-row sm:items-center sm:justify-end gap-2">
              {editingTx?.id ? (
                <motion.button
                  type="button"
                  onClick={cancelEditing}
                  className="w-full sm:w-auto px-4 py-2 rounded-xl bg-white/80 dark:bg-white/10 border border-white/60 dark:border-white/10 text-gray-900 dark:text-white shadow hover:shadow-lg"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Annuler
                </motion.button>
              ) : null}
              <motion.button
                type="submit"
                disabled={creating}
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-fuchsia-600 text-white shadow hover:shadow-lg disabled:opacity-60"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
              >
                {creating ? 'Enregistrement…' : editingTx?.id ? 'Mettre à jour sortie' : 'Enregistrer sortie'}
              </motion.button>
            </div>
          </form>
        )}
        </div>

        <div className="mb-4 flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <motion.button
              type="button"
              onClick={() => setShowFilters((v) => !v)}
              className="px-2.5 py-1.5 rounded-lg bg-white/80 border border-white/60 text-gray-900 shadow hover:shadow-md text-xs font-semibold"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
            >
              Filtres
            </motion.button>
            <motion.button
              type="button"
              onClick={() => setShowReportPanel((v) => !v)}
              className="px-2.5 py-1.5 rounded-lg bg-white/80 border border-white/60 text-gray-900 shadow hover:shadow-md text-xs font-semibold"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
            >
              Rapport
            </motion.button>

            <motion.button
              type="button"
              onClick={() => {
                setShowHistory(false);
                setStartDate('');
                setEndDate('');
              }}
              className="px-2.5 py-1.5 rounded-lg bg-white/80 border border-white/60 text-gray-900 shadow hover:shadow-md text-xs font-semibold"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
            >
              24h
            </motion.button>
            <motion.button
              type="button"
              onClick={() => {
                const end = new Date();
                const start = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                setShowHistory(true);
                setStartDate(start.toISOString().slice(0, 10));
                setEndDate(end.toISOString().slice(0, 10));
              }}
              className="px-2.5 py-1.5 rounded-lg bg-white/80 border border-white/60 text-gray-900 shadow hover:shadow-md text-xs font-semibold"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
            >
              7j
            </motion.button>
            <motion.button
              type="button"
              onClick={() => {
                const end = new Date();
                const start = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
                setShowHistory(true);
                setStartDate(start.toISOString().slice(0, 10));
                setEndDate(end.toISOString().slice(0, 10));
              }}
              className="px-2.5 py-1.5 rounded-lg bg-white/80 border border-white/60 text-gray-900 shadow hover:shadow-md text-xs font-semibold"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
            >
              30j
            </motion.button>

            {!showHistory ? (
              <motion.button
                type="button"
                onClick={() => setShowHistory(true)}
                className="px-2.5 py-1.5 rounded-lg bg-white/80 border border-white/60 text-gray-900 shadow hover:shadow-md text-xs font-semibold"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
              >
                Historique
              </motion.button>
            ) : (
              <motion.button
                type="button"
                onClick={() => {
                  setShowHistory(false);
                  setStartDate('');
                  setEndDate('');
                }}
                className="px-2.5 py-1.5 rounded-lg bg-white/80 border border-white/60 text-gray-900 shadow hover:shadow-md text-xs font-semibold"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
              >
                Masquer
              </motion.button>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <motion.button
              type="button"
              onClick={exportExcel}
              className="px-2.5 py-1.5 rounded-lg bg-white/80 border border-white/60 text-gray-900 shadow hover:shadow-md text-xs font-semibold"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
            >
              Excel
            </motion.button>
          </div>
        </div>

        {showFilters ? (
          <div className="mb-4 bg-white/80 dark:bg-white/5 backdrop-blur-md border border-white/60 dark:border-white/10 rounded-2xl shadow p-4">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
            <div className="min-w-0">
              <div className="text-xs font-semibold text-gray-600 mb-1">Sens</div>
              <select value={directionFilter} onChange={(e) => setDirectionFilter(e.target.value)} className="cpd-select">
                <option value="all">Tout</option>
                <option value="in">Entrées</option>
                <option value="out">Sorties</option>
              </select>
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-gray-600 mb-1">Type</div>
              <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="cpd-select">
                <option value="all">Tout</option>
                {offeringTypes.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
                {expenseMotifs.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-gray-600 mb-1">Devise</div>
              <select value={currencyFilter} onChange={(e) => setCurrencyFilter(e.target.value)} className="cpd-select">
                <option value="all">Toutes</option>
                {currencyOptions.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="min-w-0">
              <div className="text-xs font-semibold text-gray-600 mb-1">Activité</div>
              <select value={eventFilter} onChange={(e) => setEventFilter(e.target.value)} className="cpd-select" disabled={loadingEvents}>
                <option value="">Toutes</option>
                {events.map((ev) => (
                  <option key={ev.id} value={String(ev.id)}>
                    {ev.date} • {ev.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-1 lg:grid-cols-3 gap-3">
            <div className="lg:col-span-1 min-w-0">
              <div className="text-xs font-semibold text-gray-600 mb-1">Recherche</div>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="cpd-input"
                placeholder="N° pièce, donneur, référence…"
              />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-gray-600 mb-1">Du</div>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setShowHistory(true);
                  setStartDate(e.target.value);
                }}
                className="cpd-input"
              />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-gray-600 mb-1">Au</div>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setShowHistory(true);
                  setEndDate(e.target.value);
                }}
                className="cpd-input"
              />
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-3">
            {Object.keys(totalsByCurrency).length === 0 ? (
              <div className="text-gray-500">Aucun total pour les filtres sélectionnés.</div>
            ) : (
              Object.entries(totalsByCurrency).map(([cur, agg]) => (
                <div key={cur} className="rounded-xl border border-gray-100 bg-white/70 p-3">
                  <div className="text-sm font-semibold text-gray-900">{cur}</div>
                  <div className="text-sm text-gray-700">Entrées: <span className="font-semibold">{agg.in.toFixed(2)}</span></div>
                  <div className="text-sm text-gray-700">Sorties: <span className="font-semibold">{agg.out.toFixed(2)}</span></div>
                  <div className="text-sm text-gray-700">Net: <span className="font-semibold">{agg.net.toFixed(2)}</span></div>
                </div>
              ))
            )}
          </div>
          </div>
        ) : null}

        {showReportPanel ? (
          <div className="mb-4 bg-white/80 dark:bg-white/5 backdrop-blur-md border border-white/60 dark:border-white/10 rounded-2xl shadow p-4">
          <div className="flex items-end gap-3 flex-wrap">
            <div>
              <div className="text-xs font-semibold text-gray-600 mb-1">Rapport</div>
              <select value={reportPeriod} onChange={(e) => setReportPeriod(e.target.value)} className="cpd-select">
                <option value="daily">Journalier</option>
                <option value="weekly">Hebdomadaire</option>
                <option value="monthly">Mensuel</option>
                <option value="yearly">Annuel</option>
              </select>
            </div>
            <motion.button
              onClick={fetchReport}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow hover:shadow-lg"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
            >
              {reportLoading ? 'Chargement…' : 'Générer'}
            </motion.button>
            <motion.button
              onClick={downloadReportPdf}
              className="px-4 py-2 rounded-xl bg-white/80 border border-white/60 text-gray-900 shadow hover:shadow-lg"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
            >
              Télécharger PDF
            </motion.button>
          </div>

          {report ? (
            <div className="mt-4 cpd-table-wrap">
              <table className="cpd-table min-w-[640px]">
                <thead className="sticky top-0 z-10">
                  <tr className="text-sm text-gray-600">
                    <th className="px-4 py-3 font-semibold">Période</th>
                    <th className="px-4 py-3 font-semibold">Devise</th>
                    <th className="px-4 py-3 font-semibold">Entrées</th>
                    <th className="px-4 py-3 font-semibold">Sorties</th>
                    <th className="px-4 py-3 font-semibold">Net</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {Object.entries(report.series || {}).map(([p, curMap]) =>
                    Object.entries(curMap).map(([cur, agg]) => (
                      <tr key={`${p}-${cur}`} className="hover:bg-indigo-50/40 transition-colors">
                        <td className="px-4 py-3 text-gray-900">{p}</td>
                        <td className="px-4 py-3 text-gray-700">{cur}</td>
                        <td className="px-4 py-3 text-gray-700">{Number(agg.in || 0).toFixed(2)}</td>
                        <td className="px-4 py-3 text-gray-700">{Number(agg.out || 0).toFixed(2)}</td>
                        <td className="px-4 py-3 font-medium text-gray-900">{Number(agg.net || 0).toFixed(2)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          ) : null}
          </div>
        ) : null}

        <div className="overflow-hidden bg-white/80 dark:bg-white/5 backdrop-blur-md border border-white/60 dark:border-white/10 rounded-2xl shadow">
        <div className="cpd-table-wrap">
        <table className="cpd-table min-w-[980px]">
          <thead className="sticky top-0 z-10">
            <tr className="text-sm text-gray-600">
              <th className="px-4 py-3 font-semibold">N° Pièce</th>
              <th className="px-4 py-3 font-semibold">Activité</th>
              <th className="px-4 py-3 font-semibold">Type</th>
              <th className="px-4 py-3 font-semibold">Montant</th>
              <th className="px-4 py-3 font-semibold">Date</th>
              <th className="px-4 py-3 font-semibold">Donneur / Destinataire</th>
              <th className="px-4 py-3 font-semibold">Pièce</th>
              <th className="px-4 py-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading && (
              <tr>
                <td className="px-4 py-6 text-gray-500" colSpan={8}>Chargement…</td>
              </tr>
            )}
            {!loading && filtered.length === 0 ? (
              <tr>
                <td className="px-4 py-10 text-gray-500" colSpan={8}>Aucune transaction pour les filtres sélectionnés.</td>
              </tr>
            ) : null}
            {filtered.map((t) => (
              <tr key={t.id} className="hover:bg-amber-50/40 transition-colors">
                <td className="px-4 py-3 text-gray-900 font-medium">{t.document_number || t.receipt_code || '—'}</td>
                <td className="px-4 py-3 text-gray-700">{eventLabel(t.event)}</td>
                <td className="px-4 py-3 font-medium text-gray-900">{txTypeLabel(t.transaction_type)}</td>
                <td className="px-4 py-3 text-gray-700">{t.amount} {t.currency || 'CDF'} ({t.direction === 'out' ? 'sortie' : 'entrée'})</td>
                <td className="px-4 py-3 text-gray-700">{t.date}</td>
                <td className="px-4 py-3 text-gray-700">
                  <div className="font-medium text-gray-900">{t.direction === 'out' ? (t.recipient_name || '—') : (t.donor_name || '—')}</div>
                  <div className="text-xs text-gray-600">Caissier: {t.cashier_name || '—'}</div>
                </td>
                <td className="px-4 py-3">
                  {t.direction === 'in' ? (
                    <div className="flex flex-col items-start gap-1">
                      <motion.button
                        onClick={() => downloadReceiptPdf(t)}
                        className="px-3 py-1.5 rounded-lg bg-white/80 border border-white/60 text-gray-900 shadow hover:shadow-md"
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        Reçu PDF
                      </motion.button>
                      {t.receipt_sent_at ? <div className="text-xs text-gray-600">Email envoyé</div> : null}
                    </div>
                  ) : (
                    <div className="flex flex-col items-start gap-1">
                      <motion.button
                        onClick={() => downloadVoucherPdf(t)}
                        className="px-3 py-1.5 rounded-lg bg-white/80 border border-white/60 text-gray-900 shadow hover:shadow-md"
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        Bon PDF
                      </motion.button>
                      {t.proof_image ? (
                        <a
                          href={mediaUrl(t.proof_image) || undefined}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm font-medium text-indigo-700 hover:underline"
                        >
                          Voir preuve
                        </a>
                      ) : null}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <motion.button
                      onClick={() => startEditing(t)}
                      className="px-3 py-1.5 rounded-lg bg-white/80 border border-white/60 text-gray-900 shadow hover:shadow-md"
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Modifier
                    </motion.button>
                    <motion.button
                      onClick={() => deleteTx(t)}
                      className="px-3 py-1.5 rounded-lg bg-rose-600 text-white shadow hover:shadow-md"
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Supprimer
                    </motion.button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>

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
    </div>
  );
}
