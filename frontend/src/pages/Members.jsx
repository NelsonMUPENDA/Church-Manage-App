import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowDownTrayIcon, PlusIcon, MagnifyingGlassIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

import { api, API_BASE_URL } from '../services/apiClient';
import { useAuth } from '../contexts/AuthProvider';
import { useToast } from '../components/ToastProvider';
import PhotoPicker from '../components/PhotoPicker';

export default function Members() {
  const { user } = useAuth();
  const toast = useToast();
  const [query, setQuery] = useState('');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [creatingMember, setCreatingMember] = useState(false);
  const [form, setForm] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [qrSvg, setQrSvg] = useState('');
  const [qrLoading, setQrLoading] = useState(false);

  const DEFAULT_PHONE_CODE = '+243';
  const PHONE_CODE_OPTIONS = useMemo(
    () => [
      { code: '+243', label: 'RDC (+243)' },
      { code: '+242', label: 'Congo (+242)' },
      { code: '+250', label: 'Rwanda (+250)' },
      { code: '+257', label: 'Burundi (+257)' },
      { code: '+256', label: 'Ouganda (+256)' },
      { code: '+254', label: 'Kenya (+254)' },
      { code: '+255', label: 'Tanzanie (+255)' },
      { code: '+244', label: 'Angola (+244)' },
      { code: '+260', label: 'Zambie (+260)' },
      { code: '+27', label: 'Afrique du Sud (+27)' },
      { code: '+33', label: 'France (+33)' },
      { code: '+32', label: 'Belgique (+32)' },
      { code: '+1', label: 'USA/Canada (+1)' },
    ],
    []
  );

  const [phoneCode, setPhoneCode] = useState(DEFAULT_PHONE_CODE);
  const [phoneNumber, setPhoneNumber] = useState('');

  const isAdmin = !!user && (user.is_superuser || user.is_staff || user.role === 'admin' || user.role === 'super_admin');

  const inputClass = 'cpd-input';
  const selectClass = 'cpd-select';

  const COUNTRY_CODES =
    'AF AX AL DZ AS AD AO AI AQ AG AR AM AW AU AT AZ BS BH BD BB BY BE BZ BJ BM BT BO BQ BA BW BV BR IO BN BG BF BI KH CM CA CV KY CF TD CL CN CX CC CO KM CG CD CK CR CI HR CU CW CY CZ DK DJ DM DO EC EG SV GQ ER EE SZ ET FK FO FJ FI FR GF PF TF GA GM GE DE GH GI GR GL GD GP GU GT GG GN GW GY HT HM VA HN HK HU IS IN ID IR IQ IE IM IL IT JM JP JE JO KZ KE KI KP KR KW KG LA LV LB LS LR LY LI LT LU MO MG MW MY MV ML MT MH MQ MR MU YT MX FM MD MC MN ME MS MA MZ MM NA NR NP NL NC NZ NI NE NG NU NF MK MP NO OM PK PW PS PA PG PY PE PH PN PL PT PR QA RE RO RU RW BL SH KN LC MF PM VC WS SM ST SA SN RS SC SL SG SX SK SI SB SO ZA GS SS ES LK SD SR SJ SE CH SY TW TJ TZ TH TL TG TK TO TT TN TR TM TC TV UG UA AE GB US UM UY UZ VU VE VN VG VI WF EH YE ZM ZW'
      .split(' ');

  const regionNames = useMemo(() => {
    try {
      return new Intl.DisplayNames(['fr'], { type: 'region' });
    } catch {
      return null;
    }
  }, []);

  const nationalityOptions = useMemo(() => {
    const names = COUNTRY_CODES.map((code) => (regionNames ? regionNames.of(code) : code)).filter(Boolean);
    const uniq = Array.from(new Set(names));
    uniq.sort((a, b) => String(a).localeCompare(String(b), 'fr', { sensitivity: 'base' }));
    const rdc = (regionNames && regionNames.of('CD')) || 'RDCongo';
    return [rdc, ...uniq.filter((x) => x !== rdc)];
  }, [regionNames]);

  const pad = useCallback((n, width = 6) => String(n ?? '').padStart(width, '0'), []);
  const memberNumber = useCallback((id) => `CPD-MEM-${pad(id)}`, [pad]);
  const displayMemberNumber = useCallback((m) => m?.memberNumber || memberNumber(m?.id), [memberNumber]);
  const formatDate = (value) => {
    if (!value) return '—';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return String(value);
    return d.toLocaleDateString();
  };

  const startEdit = () => {
    if (!selected) return;
    setEditing(true);
    setSaving(false);
    setPhotoFile(null);
    setPhotoPreview(selected.photo || '');

     const splitPhone = (raw, fallbackCode) => {
       const s = String(raw || '').trim();
       if (!s) return { code: fallbackCode, number: '' };
       if (!s.startsWith('+')) return { code: fallbackCode, number: s };
       const m = s.match(/^\+(\d{1,4})\s*(.*)$/);
       if (!m) return { code: fallbackCode, number: s };
       return { code: `+${m[1]}`, number: String(m[2] || '').trim() };
     };

     const split = splitPhone(selected.phone, DEFAULT_PHONE_CODE);
     setPhoneCode(split.code || DEFAULT_PHONE_CODE);
     setPhoneNumber(split.number || '');

    setForm({
      user: {
        first_name: selected.firstName || '',
        last_name: selected.lastName || '',
        email: selected.email || '',
        phone: selected.phone || '',
      },
      member: {
        post_name: selected.postName || '',
        birth_date: selected.birthDate || '',
        place_of_birth: selected.placeOfBirth || '',
        gender: selected.gender || '',
        nationality: selected.nationality || '',
        marital_status: selected.maritalStatus || '',
        occupation: selected.occupation || '',
        public_function: selected.publicFunction || '',
        church_position: selected.churchPosition || '',
        education_level: selected.educationLevel || '',
        father_full_name: selected.fatherFullName || '',
        mother_full_name: selected.motherFullName || '',
        province: selected.province || '',
        city: selected.city || '',
        commune: selected.commune || '',
        quarter: selected.quarter || '',
        avenue: selected.avenue || '',
        house_number: selected.houseNumber || '',
        emergency_contact_name: selected.emergencyContactName || '',
        emergency_contact_phone: selected.emergencyContactPhone || '',
        emergency_contact_relation: selected.emergencyContactRelation || '',
        baptism_date: selected.baptismDate || '',
        is_active: selected.status === 'Actif',
        inactive_reason: selected.inactiveReason || '',
      },
    });
  };

  const startCreate = () => {
    setCreatingMember(true);
    setEditing(true);
    setSaving(false);
    setPhotoFile(null);
    setPhotoPreview('');

    setPhoneCode(DEFAULT_PHONE_CODE);
    setPhoneNumber('');

    setSelected({
      id: null,
      userId: null,
      memberNumber: '',
      fullName: 'Nouveau membre',
      firstName: '',
      postName: '',
      lastName: '',
      username: '',
      email: '',
      phone: '',
      address: '',
      photo: '',
      status: 'Actif',
      inactiveReason: null,
      gender: null,
      birthDate: null,
      placeOfBirth: null,
      nationality: null,
      maritalStatus: null,
      occupation: null,
      publicFunction: null,
      churchPosition: null,
      educationLevel: null,
      fatherFullName: null,
      motherFullName: null,
      province: null,
      city: null,
      commune: null,
      quarter: null,
      avenue: null,
      houseNumber: null,
      emergencyContactName: null,
      emergencyContactPhone: null,
      emergencyContactRelation: null,
      baptismDate: null,
      createdAt: null,
    });
    setForm({
      user: {
        username: '',
        password: '',
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        address: '',
      },
      member: {
        post_name: '',
        birth_date: '',
        place_of_birth: '',
        gender: '',
        nationality: '',
        marital_status: '',
        occupation: '',
        public_function: '',
        church_position: '',
        education_level: '',
        father_full_name: '',
        mother_full_name: '',
        province: '',
        city: '',
        commune: '',
        quarter: '',
        avenue: '',
        house_number: '',
        emergency_contact_name: '',
        emergency_contact_phone: '',
        emergency_contact_relation: '',
        baptism_date: '',
        is_active: true,
        inactive_reason: '',
      },
    });
  };

  const cancelEdit = () => {
    setEditing(false);
    setSaving(false);
    setForm(null);
    setPhotoFile(null);
    setPhotoPreview('');
    setPhoneCode(DEFAULT_PHONE_CODE);
    setPhoneNumber('');
  };

  const closePanel = () => {
    cancelEdit();
    setCreatingMember(false);
    setSelected(null);
  };

  const onPickPhoto = (file) => {
    if (!file) {
      setPhotoFile(null);
      setPhotoPreview(selected?.photo || '');
      return;
    }
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const saveEdit = async () => {
    if (!selected || !form) return;

    if (!String(form?.user?.first_name || '').trim()) {
      toast.push({ type: 'error', title: 'Prénom requis', message: 'Renseignez le prénom.' });
      return;
    }
    if (!String(form?.member?.post_name || '').trim()) {
      toast.push({ type: 'error', title: 'Postnom requis', message: 'Renseignez le postnom.' });
      return;
    }
    if (!String(form?.user?.last_name || '').trim()) {
      toast.push({ type: 'error', title: 'Nom requis', message: 'Renseignez le nom.' });
      return;
    }

    const normalizedPhoneNumber = String(phoneNumber || '').replace(/[^0-9]+/g, '').trim();
    if (!normalizedPhoneNumber) {
      toast.push({ type: 'error', title: 'Téléphone requis', message: 'Renseignez le numéro de téléphone.' });
      return;
    }
    if (!String(form?.member?.gender || '').trim()) {
      toast.push({ type: 'error', title: 'Sexe requis', message: 'Sélectionnez le sexe.' });
      return;
    }
    if (!String(form?.member?.nationality || '').trim()) {
      toast.push({ type: 'error', title: 'Nationalité requise', message: 'Sélectionnez la nationalité.' });
      return;
    }

    if (form?.member?.is_active === false && !String(form?.member?.inactive_reason || '').trim()) {
      toast.push({ type: 'error', title: 'Cause requise', message: 'Sélectionnez la cause de l’inactivité.' });
      return;
    }

    setSaving(true);
    try {
      if (creatingMember) {
        const baseUsername = `${(form.user?.first_name || '').trim()}.${(form.user?.last_name || '').trim()}`
          .replace(/\s+/g, '')
          .toLowerCase();
        const username = (form.user?.username || '').trim() || `${baseUsername || 'member'}${Math.floor(Math.random() * 1000)}`;
        const password = (form.user?.password || '').trim() || `Member@${Math.floor(Math.random() * 100000)}`;

        let userRes;
        if (photoFile) {
          const fd = new FormData();
          fd.append('username', username);
          fd.append('password', password);
          fd.append('role', 'member');
          Object.entries(form.user).forEach(([k, v]) => {
            if (k === 'username' || k === 'password') return;
            if (v !== undefined && v !== null) fd.append(k, v);
          });
          fd.append('photo', photoFile);
          userRes = await api.post('/api/users/', fd);
        } else {
          userRes = await api.post('/api/users/', {
            username,
            password,
            role: 'member',
            first_name: form.user?.first_name || '',
            last_name: form.user?.last_name || '',
            email: form.user?.email || '',
            phone: form.user?.phone || '',
          });
        }

        const userId = userRes.data?.id;
        if (!userId) throw new Error('User creation failed: missing id');
        await api.post('/api/members/', {
          user_id: userId,
          ...normalize(form.member),
        });

        toast.push({
          type: 'success',
          title: 'Membre créé',
          message: `Compte: ${username} / ${password}`,
          ttl: 7000,
        });

        closePanel();
        await load();
      } else {
        await api.patch(`/api/members/${selected.id}/`, normalize(form.member));

        if (selected.userId) {
          const fd = new FormData();
          Object.entries(form.user).forEach(([k, v]) => {
            if (v !== undefined && v !== null) fd.append(k, v);
          });
          if (photoFile) fd.append('photo', photoFile);

          await api.patch(`/api/users/${selected.userId}/`, fd);
        }

        toast.push({ type: 'success', title: 'Enregistré', message: 'Profil membre mis à jour.' });
        cancelEdit();
        await load();
      }
    } catch (e) {
      const detail = e?.response?.data;
      const msg =
        typeof detail === 'string'
          ? detail
          : detail && typeof detail === 'object'
            ? JSON.stringify(detail)
            : e?.message || "Impossible d'enregistrer.";
      toast.push({ type: 'error', title: 'Erreur', message: msg });
    } finally {
      setSaving(false);
    }
  };

  const deleteSelected = async () => {
    if (!selected?.id) return;
    const ok = window.confirm('Supprimer ce membre ? Cette action est irréversible.');
    if (!ok) return;

    setSaving(true);
    try {
      await api.delete(`/api/members/${selected.id}/`);
      if (selected.userId) {
        try {
          await api.delete(`/api/users/${selected.userId}/`);
        } catch {
          // ignore
        }
      }
      toast.push({ type: 'success', title: 'Supprimé', message: 'Le membre a été supprimé.' });
      closePanel();
      await load();
    } catch {
      toast.push({ type: 'error', title: 'Erreur', message: 'Impossible de supprimer le membre.' });
    } finally {
      setSaving(false);
    }
  };

  const inactiveReasonLabel = (v) => {
    const key = String(v || '').toLowerCase();
    if (key === 'excommunie' || key === 'excommunié') return 'Excommunié';
    if (key === 'abandonne' || key === 'abandonné') return 'Abandonné';
    return v ? String(v) : '—';
  };

  const genderLabel = (g) => {
    if (g === 'M') return 'Masculin';
    if (g === 'F') return 'Féminin';
    if (g === 'O') return 'Autre';
    return '—';
  };
  const safe = (v) => (v === null || v === undefined || v === '' ? '—' : String(v));
  const photoUrl = useCallback(
    (photo) => {
      if (!photo) return '';
      if (typeof photo !== 'string') return '';
      if (photo.startsWith('http://') || photo.startsWith('https://')) return photo;
      if (photo.startsWith('/')) return `${API_BASE_URL}${photo}`;
      return `${API_BASE_URL}/${photo}`;
    },
    [API_BASE_URL]
  );

  const normalize = useCallback((obj) => {
    if (!obj || typeof obj !== 'object') return obj;
    const out = {};
    Object.entries(obj).forEach(([k, v]) => {
      if (v === '') out[k] = null;
      else out[k] = v;
    });
    return out;
  }, []);

  const exportExcel = async () => {
    try {
      const params = {};
      if (query.trim()) params.q = query.trim();
      const res = await api.get('/api/members/export/', { params, responseType: 'blob' });
      const url = window.URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `members_${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      toast.push({ type: 'error', title: 'Erreur', message: "Impossible d'exporter le fichier Excel." });
    }
  };

  const exportMemberFiche = async () => {
    if (!selected?.id) return;
    try {
      const res = await api.get(`/api/members/${selected.id}/fiche/`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fiche_membre_${selected.memberNumber || selected.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      toast.push({ type: 'error', title: 'Erreur', message: "Impossible d'exporter la fiche du membre." });
    }
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/api/members/');
      const data = Array.isArray(res.data) ? res.data : res.data?.results || [];
      const mapped = data.map((m) => {
        const fullName = [m.user?.first_name, m.post_name, m.user?.last_name].filter(Boolean).join(' ') || m.user?.username || `Membre ${m.id}`;
        const p = m.user?.photo;
        return {
          id: m.id,
          userId: m.user?.id,
          memberNumber: m.member_number || '',
          fullName,
          firstName: m.user?.first_name || '',
          postName: m.post_name || '',
          lastName: m.user?.last_name || '',
          username: m.user?.username || '',
          email: m.user?.email || '',
          phone: m.user?.phone || '',
          photo: photoUrl(p),
          status: m.is_active ? 'Actif' : 'Inactif',
          inactiveReason: m.inactive_reason || null,
          gender: m.gender || null,
          birthDate: m.birth_date || null,
          placeOfBirth: m.place_of_birth || null,
          nationality: m.nationality || null,
          maritalStatus: m.marital_status || null,
          occupation: m.occupation || null,
          publicFunction: m.public_function || null,
          churchPosition: m.church_position || null,
          educationLevel: m.education_level || null,
          fatherFullName: m.father_full_name || null,
          motherFullName: m.mother_full_name || null,
          province: m.province || null,
          city: m.city || null,
          commune: m.commune || null,
          quarter: m.quarter || null,
          avenue: m.avenue || null,
          houseNumber: m.house_number || null,
          emergencyContactName: m.emergency_contact_name || null,
          emergencyContactPhone: m.emergency_contact_phone || null,
          emergencyContactRelation: m.emergency_contact_relation || null,
          baptismDate: m.baptism_date || null,
          family: m.family || null,
          homeGroup: m.home_group || null,
          department: m.department || null,
          ministry: m.ministry || null,
          createdAt: m.created_at || null,
          raw: m,
        };
      });
      mapped.sort((a, b) => (a.fullName || '').localeCompare(b.fullName || '', 'fr', { sensitivity: 'base' }));
      setRows(mapped);
    } catch (e) {
      setError('Impossible de charger les membres.');
    } finally {
      setLoading(false);
    }
  }, [photoUrl]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!selected?.id) {
      setQrSvg('');
      setQrLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      setQrLoading(true);
      try {
        const res = await api.get(`/api/members/${selected.id}/qr/`, { responseType: 'text' });
        if (!cancelled) setQrSvg(typeof res.data === 'string' ? res.data : '');
      } catch {
        if (!cancelled) setQrSvg('');
      } finally {
        if (!cancelled) setQrLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selected?.id]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => {
      const hay = [
        r.fullName,
        r.username,
        r.email,
        r.phone,
        displayMemberNumber(r),
        r.nationalIdNumber,
        r.nationality,
        r.placeOfBirth,
        r.province,
        r.city,
        r.commune,
        r.quarter,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }, [query, rows, displayMemberNumber]);

  return (
    <div className="relative h-full overflow-hidden rounded-[28px] border border-white/70 ring-1 ring-indigo-100/70 shadow-[0_20px_70px_-45px_rgba(79,70,229,0.45)]">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-sky-50 via-white to-fuchsia-50" />
        <div
          className="absolute inset-0 opacity-70"
          style={{
            backgroundImage:
              'radial-gradient(circle at 18% 18%, rgba(99,102,241,0.20), transparent 46%), radial-gradient(circle at 80% 12%, rgba(168,85,247,0.18), transparent 42%), radial-gradient(circle at 55% 92%, rgba(14,165,233,0.18), transparent 46%)',
          }}
        />
        <div
          className="absolute inset-0 opacity-35"
          style={{
            backgroundImage:
              'linear-gradient(to right, rgba(99,102,241,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(99,102,241,0.08) 1px, transparent 1px)',
            backgroundSize: '56px 56px',
            maskImage: 'radial-gradient(circle at 50% 35%, black 40%, transparent 70%)',
            WebkitMaskImage: 'radial-gradient(circle at 50% 35%, black 40%, transparent 70%)',
          }}
        />
        <motion.div
          className="absolute -top-32 -right-40 w-[520px] h-[520px] rounded-full blur-3xl opacity-25"
          style={{ background: 'radial-gradient(circle at 30% 30%, rgba(99,102,241,0.7), rgba(168,85,247,0.0) 70%)' }}
          animate={{
            x: [0, -18, 0],
            y: [0, 14, 0],
            scale: [1, 1.05, 1],
          }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute -bottom-40 -left-44 w-[560px] h-[560px] rounded-full blur-3xl opacity-25"
          style={{ background: 'radial-gradient(circle at 40% 40%, rgba(14,165,233,0.7), rgba(99,102,241,0.0) 70%)' }}
          animate={{
            x: [0, 22, 0],
            y: [0, -16, 0],
            scale: [1.02, 1, 1.02],
          }}
          transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      <div className="relative z-10 h-full overflow-hidden flex flex-col p-4">
        <div className="shrink-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight text-gray-900">Membres</h2>
            <p className="text-sm text-gray-600">Registre d’identification des membres.</p>
          </div>
          {isAdmin ? (
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:justify-end">
              <motion.button
                onClick={exportExcel}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-white/80 border border-white/60 text-gray-900 shadow hover:shadow-lg"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
              >
                <ArrowDownTrayIcon className="h-5 w-5" />
                Exporter Excel
              </motion.button>
              <motion.button
                onClick={startCreate}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow hover:shadow-lg disabled:opacity-60"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
              >
                <PlusIcon className="h-5 w-5" />
                Ajouter
              </motion.button>
            </div>
          ) : null}
        </div>

      {error ? (
        <div className="shrink-0 mb-4 bg-rose-50 text-rose-700 border border-rose-100 rounded-xl p-4">{error}</div>
      ) : null}

      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className={`lg:col-span-5 min-h-0 ${selected ? 'hidden lg:block' : ''}`}>
          <div className="h-full min-h-0 bg-white/70 backdrop-blur-xl border border-white/60 rounded-3xl shadow overflow-hidden flex flex-col">
            <div className="shrink-0 p-4 border-b border-white/60 bg-white/40">
              <div className="flex items-center gap-2">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-500" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className={inputClass}
                  placeholder="Rechercher (nom, téléphone, e-mail, N° membre)…"
                />
              </div>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 space-y-3">
              {loading && (
                <div className="bg-white/80 backdrop-blur-md border border-white/60 rounded-2xl shadow p-6 text-gray-600">
                  Chargement…
                </div>
              )}

              {!loading && filtered.length === 0 && (
                <div className="bg-white/80 backdrop-blur-md border border-white/60 rounded-2xl shadow p-6 text-gray-600">
                  Aucun résultat.
                </div>
              )}

              {filtered.map((m) => (
                <motion.button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    setCreatingMember(false);
                    cancelEdit();
                    setSelected(m);
                  }}
                  className="w-full text-left group"
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <div className="flex items-center gap-3 rounded-2xl border border-gray-200/70 bg-white/70 backdrop-blur-xl shadow-sm hover:shadow-md transition-shadow px-4 py-3">
                    <div className="relative shrink-0">
                      <div
                        className={`h-12 w-12 rounded-full overflow-hidden ring-2 shadow-sm ${
                          m.status === 'Actif' ? 'ring-emerald-400/70' : 'ring-gray-200'
                        } bg-gray-100`}
                      >
                        {m.photo ? (
                          <img src={m.photo} alt={m.fullName} className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-200 text-gray-700 font-bold">
                            {(m.firstName || m.fullName || 'M')[0]?.toUpperCase()}
                            {(m.lastName || '')[0]?.toUpperCase()}
                          </div>
                        )}
                      </div>
                      <span
                        className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full ring-2 ring-white ${
                          m.status === 'Actif' ? 'bg-emerald-500' : 'bg-gray-400'
                        }`}
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="text-sm font-extrabold text-gray-900 truncate">{m.fullName}</div>
                            {!m.baptismDate ? (
                              <div className="shrink-0 inline-flex items-center px-1.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-100">
                                <ExclamationTriangleIcon className="h-4 w-4" />
                              </div>
                            ) : null}
                          </div>
                          <div className="mt-0.5 text-xs text-gray-600 truncate">
                            N° {displayMemberNumber(m)}
                            {m.phone ? ` • ${m.phone}` : ''}
                          </div>
                        </div>
                        <div className="shrink-0 flex items-center gap-2">
                          <span
                            className={`px-2 py-1 rounded-full text-[11px] font-semibold ${
                              m.status === 'Actif' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {m.status}
                          </span>
                        </div>
                      </div>

                      <div className="mt-1 text-xs text-gray-500 truncate">
                        {[m.city, m.commune, m.quarter].filter(Boolean).join(' • ') || safe(m.address)}
                      </div>
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-7 min-h-0">
          {!selected ? (
            <div className="h-full bg-white/70 backdrop-blur-xl border border-white/60 rounded-3xl shadow p-8 flex flex-col justify-center">
              <div className="text-xs tracking-wider uppercase text-gray-500">Fiche membre</div>
              <div className="mt-2 text-2xl font-extrabold tracking-tight text-gray-900">Sélectionnez un membre</div>
              <div className="mt-1 text-sm text-gray-600">Ou cliquez sur “Ajouter” pour enregistrer un nouveau membre.</div>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="h-full bg-white/80 backdrop-blur-xl border border-white/60 rounded-3xl shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="h-20 bg-gradient-to-r from-indigo-600 via-purple-600 to-fuchsia-600" />
              <div className="p-6 -mt-10 flex flex-col min-h-0 flex-1">
                <div className="shrink-0 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div>
                    <div className="text-xs tracking-wider uppercase text-gray-500">{creatingMember ? 'Enregistrement' : 'Fiche membre'}</div>
                    <div className="mt-1 text-2xl font-extrabold text-gray-900">{creatingMember ? 'Nouveau membre' : selected.fullName}</div>
                    <div className="text-sm text-gray-600">N° {selected.id ? displayMemberNumber(selected) : '—'}</div>
                  </div>
                  <div className="flex items-center gap-2 justify-end flex-wrap">
                    {!editing ? (
                      <button
                        type="button"
                        className="px-3 py-2 rounded-xl bg-gray-100 text-gray-800 hover:bg-gray-200"
                        onClick={closePanel}
                        disabled={saving}
                      >
                        {creatingMember ? 'Annuler' : 'Retour'}
                      </button>
                    ) : null}
                    {isAdmin && !editing && !creatingMember ? (
                      <button
                        type="button"
                        className="px-3 py-2 rounded-xl bg-white text-gray-900 border border-gray-200 hover:bg-gray-50"
                        onClick={exportMemberFiche}
                        disabled={saving}
                      >
                        Exporter fiche
                      </button>
                    ) : null}
                    {isAdmin && !editing ? (
                      <>
                        <button
                          type="button"
                          className="px-3 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700"
                          onClick={startEdit}
                        >
                          Modifier
                        </button>
                        <button
                          type="button"
                          className="px-3 py-2 rounded-xl bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-60"
                          onClick={deleteSelected}
                          disabled={saving}
                        >
                          Supprimer
                        </button>
                      </>
                    ) : null}
                    {isAdmin && editing ? (
                      <>
                        <button
                          type="button"
                          className="px-3 py-2 rounded-xl bg-gray-100 text-gray-800 hover:bg-gray-200"
                          onClick={() => {
                            if (creatingMember) closePanel();
                            else cancelEdit();
                          }}
                          disabled={saving}
                        >
                          Annuler
                        </button>
                        <button
                          type="button"
                          className="px-3 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60"
                          onClick={saveEdit}
                          disabled={saving}
                        >
                          {saving ? 'Enregistrement…' : creatingMember ? 'Créer' : 'Enregistrer'}
                        </button>
                      </>
                    ) : null}
                  </div>
                </div>

                <div className="mt-6 flex-1 min-h-0 overflow-y-auto overscroll-contain pr-1">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-1">
                  <div className="rounded-2xl overflow-hidden border border-gray-200 bg-gray-50">
                    {photoPreview || selected.photo ? (
                      <img src={photoPreview || selected.photo} alt={selected.fullName} className="w-full h-72 object-cover" />
                    ) : (
                      <div className="w-full h-72 flex items-center justify-center text-gray-600 font-bold">
                        PHOTO
                      </div>
                    )}
                  </div>

                  <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-4">
                    <div className="text-[10px] uppercase tracking-wider text-gray-500">QR code membre</div>
                    <div className="mt-3 flex items-center justify-center">
                      {qrLoading ? (
                        <div className="text-sm text-gray-600">Chargement…</div>
                      ) : qrSvg ? (
                        <div className="w-40 h-40" dangerouslySetInnerHTML={{ __html: qrSvg }} />
                      ) : (
                        <div className="text-sm text-gray-600">Indisponible</div>
                      )}
                    </div>
                    <div className="mt-2 text-xs text-gray-600 text-center">{safe(displayMemberNumber(selected))}</div>
                  </div>

                  {isAdmin && editing ? (
                    <div className="mt-3">
                      <PhotoPicker
                        label="Photo"
                        file={photoFile}
                        existingUrl={photoPreview || selected.photo}
                        onChange={(file) => onPickPhoto(file)}
                        optional
                        showPreview={false}
                      />
                    </div>
                  ) : null}
                </div>
                <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="rounded-2xl border border-gray-200 bg-white p-4">
                    <div className="text-[10px] uppercase tracking-wider text-gray-500">Prénom</div>
                    {editing ? (
                      <input
                        value={form?.user?.first_name ?? ''}
                        onChange={(e) => setForm((f) => ({ ...f, user: { ...f.user, first_name: e.target.value } }))}
                        required
                        className={`mt-1 ${inputClass}`}
                      />
                    ) : (
                      <div className="text-base font-semibold text-gray-900">{safe(selected.firstName)}</div>
                    )}
                  </div>
                  <div className="rounded-2xl border border-gray-200 bg-white p-4">
                    <div className="text-[10px] uppercase tracking-wider text-gray-500">Postnom</div>
                    {editing ? (
                      <input
                        value={form?.member?.post_name ?? ''}
                        onChange={(e) => setForm((f) => ({ ...f, member: { ...f.member, post_name: e.target.value } }))}
                        required
                        className={`mt-1 ${inputClass}`}
                      />
                    ) : (
                      <div className="text-base font-semibold text-gray-900">{safe(selected.postName)}</div>
                    )}
                  </div>
                  <div className="rounded-2xl border border-gray-200 bg-white p-4">
                    <div className="text-[10px] uppercase tracking-wider text-gray-500">Nom</div>
                    {editing ? (
                      <input
                        value={form?.user?.last_name ?? ''}
                        onChange={(e) => setForm((f) => ({ ...f, user: { ...f.user, last_name: e.target.value } }))}
                        required
                        className={`mt-1 ${inputClass}`}
                      />
                    ) : (
                      <div className="text-base font-semibold text-gray-900">{safe(selected.lastName)}</div>
                    )}
                  </div>
                  <div className="rounded-2xl border border-gray-200 bg-white p-4">
                    <div className="text-[10px] uppercase tracking-wider text-gray-500">Numéro membre</div>
                    <div className="text-base font-semibold text-gray-900">{safe(displayMemberNumber(selected))}</div>
                  </div>
                  <div className="rounded-2xl border border-gray-200 bg-white p-4">
                    <div className="text-[10px] uppercase tracking-wider text-gray-500">Téléphone</div>
                    {editing ? (
                      <div className="mt-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <select
                          value={phoneCode}
                          onChange={(e) => {
                            const nextCode = e.target.value;
                            setPhoneCode(nextCode);
                            const combined = `${nextCode}${String(phoneNumber || '').trim() ? ` ${String(phoneNumber || '').trim()}` : ''}`.trim();
                            setForm((f) => ({ ...f, user: { ...f.user, phone: combined } }));
                          }}
                          className={selectClass}
                        >
                          {PHONE_CODE_OPTIONS.map((opt) => (
                            <option key={opt.code} value={opt.code}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                        <input
                          value={phoneNumber}
                          onChange={(e) => {
                            const nextNumber = e.target.value;
                            setPhoneNumber(nextNumber);
                            const combined = `${String(phoneCode || DEFAULT_PHONE_CODE)}${String(nextNumber || '').trim() ? ` ${String(nextNumber || '').trim()}` : ''}`.trim();
                            setForm((f) => ({ ...f, user: { ...f.user, phone: combined } }));
                          }}
                          required
                          placeholder="Numéro"
                          className={`sm:col-span-2 ${inputClass}`}
                        />
                      </div>
                    ) : (
                      <div className="text-base font-semibold text-gray-900">{safe(selected.phone)}</div>
                    )}
                  </div>
                  <div className="rounded-2xl border border-gray-200 bg-white p-4">
                    <div className="text-[10px] uppercase tracking-wider text-gray-500">E-mail</div>
                    {editing ? (
                      <input
                        value={form?.user?.email ?? ''}
                        onChange={(e) => setForm((f) => ({ ...f, user: { ...f.user, email: e.target.value } }))}
                        className={`mt-1 ${inputClass}`}
                      />
                    ) : (
                      <div className="text-base font-semibold text-gray-900 break-all">{safe(selected.email)}</div>
                    )}
                  </div>
                  <div className="rounded-2xl border border-gray-200 bg-white p-4">
                    <div className="text-[10px] uppercase tracking-wider text-gray-500">Sexe</div>
                    {editing ? (
                      <select
                        value={form?.member?.gender ?? ''}
                        onChange={(e) => setForm((f) => ({ ...f, member: { ...f.member, gender: e.target.value } }))}
                        required
                        className={`mt-1 ${selectClass}`}
                      >
                        <option value="">—</option>
                        <option value="M">Masculin</option>
                        <option value="F">Féminin</option>
                      </select>
                    ) : (
                      <div className="text-base font-semibold text-gray-900">{genderLabel(selected.gender)}</div>
                    )}
                  </div>
                  <div className="rounded-2xl border border-gray-200 bg-white p-4">
                    <div className="text-[10px] uppercase tracking-wider text-gray-500">Date de naissance</div>
                    {editing ? (
                      <input
                        type="date"
                        value={form?.member?.birth_date ?? ''}
                        onChange={(e) => setForm((f) => ({ ...f, member: { ...f.member, birth_date: e.target.value } }))}
                        className={`mt-1 ${inputClass}`}
                      />
                    ) : (
                      <div className="text-base font-semibold text-gray-900">{formatDate(selected.birthDate)}</div>
                    )}
                  </div>
                  <div className="rounded-2xl border border-gray-200 bg-white p-4">
                    <div className="text-[10px] uppercase tracking-wider text-gray-500">Lieu de naissance</div>
                    {editing ? (
                      <input
                        value={form?.member?.place_of_birth ?? ''}
                        onChange={(e) => setForm((f) => ({ ...f, member: { ...f.member, place_of_birth: e.target.value } }))}
                        className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2"
                      />
                    ) : (
                      <div className="text-base font-semibold text-gray-900">{safe(selected.placeOfBirth)}</div>
                    )}
                  </div>
                  <div className="rounded-2xl border border-gray-200 bg-white p-4">
                    <div className="text-[10px] uppercase tracking-wider text-gray-500">Nationalité</div>
                    {editing ? (
                      <select
                        value={form?.member?.nationality ?? ''}
                        onChange={(e) => setForm((f) => ({ ...f, member: { ...f.member, nationality: e.target.value } }))}
                        required
                        className={`mt-1 ${selectClass}`}
                      >
                        <option value="">—</option>
                        {form?.member?.nationality && !nationalityOptions.includes(form.member.nationality) ? (
                          <option value={form.member.nationality}>{form.member.nationality}</option>
                        ) : null}
                        {nationalityOptions.map((n) => (
                          <option key={n} value={n}>
                            {n}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="text-base font-semibold text-gray-900">{safe(selected.nationality)}</div>
                    )}
                  </div>
                  <div className="rounded-2xl border border-gray-200 bg-white p-4">
                    <div className="text-[10px] uppercase tracking-wider text-gray-500">État civil</div>
                    {editing ? (
                      <input
                        value={form?.member?.marital_status ?? ''}
                        onChange={(e) => setForm((f) => ({ ...f, member: { ...f.member, marital_status: e.target.value } }))}
                        className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2"
                      />
                    ) : (
                      <div className="text-base font-semibold text-gray-900">{safe(selected.maritalStatus)}</div>
                    )}
                  </div>
                  <div className="rounded-2xl border border-gray-200 bg-white p-4">
                    <div className="text-[10px] uppercase tracking-wider text-gray-500">Profession</div>
                    {editing ? (
                      <input
                        value={form?.member?.occupation ?? ''}
                        onChange={(e) => setForm((f) => ({ ...f, member: { ...f.member, occupation: e.target.value } }))}
                        className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2"
                      />
                    ) : (
                      <div className="text-base font-semibold text-gray-900">{safe(selected.occupation)}</div>
                    )}
                  </div>
                  <div className="rounded-2xl border border-gray-200 bg-white p-4">
                    <div className="text-[10px] uppercase tracking-wider text-gray-500">Fonction publique</div>
                    {editing ? (
                      <input
                        value={form?.member?.public_function ?? ''}
                        onChange={(e) => setForm((f) => ({ ...f, member: { ...f.member, public_function: e.target.value } }))}
                        className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2"
                      />
                    ) : (
                      <div className="text-base font-semibold text-gray-900">{safe(selected.publicFunction)}</div>
                    )}
                  </div>
                  <div className="rounded-2xl border border-gray-200 bg-white p-4">
                    <div className="text-[10px] uppercase tracking-wider text-gray-500">Poste à l’église</div>
                    {editing ? (
                      <input
                        value={form?.member?.church_position ?? ''}
                        onChange={(e) => setForm((f) => ({ ...f, member: { ...f.member, church_position: e.target.value } }))}
                        className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2"
                      />
                    ) : (
                      <div className="text-base font-semibold text-gray-900">{safe(selected.churchPosition)}</div>
                    )}
                  </div>
                  <div className="rounded-2xl border border-gray-200 bg-white p-4">
                    <div className="text-[10px] uppercase tracking-wider text-gray-500">Niveau d’étude</div>
                    {editing ? (
                      <input
                        value={form?.member?.education_level ?? ''}
                        onChange={(e) => setForm((f) => ({ ...f, member: { ...f.member, education_level: e.target.value } }))}
                        className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2"
                      />
                    ) : (
                      <div className="text-base font-semibold text-gray-900">{safe(selected.educationLevel)}</div>
                    )}
                  </div>
                  <div className="sm:col-span-2 rounded-2xl border border-gray-200 bg-white p-4">
                    <div className="text-[10px] uppercase tracking-wider text-gray-500">Adresse détaillée</div>
                    {editing ? (
                      <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <input
                          placeholder="Province"
                          value={form?.member?.province ?? ''}
                          onChange={(e) => setForm((f) => ({ ...f, member: { ...f.member, province: e.target.value } }))}
                          className="w-full rounded-xl border border-gray-200 px-3 py-2"
                        />
                        <input
                          placeholder="Ville"
                          value={form?.member?.city ?? ''}
                          onChange={(e) => setForm((f) => ({ ...f, member: { ...f.member, city: e.target.value } }))}
                          className="w-full rounded-xl border border-gray-200 px-3 py-2"
                        />
                        <input
                          placeholder="Commune"
                          value={form?.member?.commune ?? ''}
                          onChange={(e) => setForm((f) => ({ ...f, member: { ...f.member, commune: e.target.value } }))}
                          className="w-full rounded-xl border border-gray-200 px-3 py-2"
                        />
                        <input
                          placeholder="Quartier"
                          value={form?.member?.quarter ?? ''}
                          onChange={(e) => setForm((f) => ({ ...f, member: { ...f.member, quarter: e.target.value } }))}
                          className="w-full rounded-xl border border-gray-200 px-3 py-2"
                        />
                        <input
                          placeholder="Avenue"
                          value={form?.member?.avenue ?? ''}
                          onChange={(e) => setForm((f) => ({ ...f, member: { ...f.member, avenue: e.target.value } }))}
                          className="w-full rounded-xl border border-gray-200 px-3 py-2"
                        />
                        <input
                          placeholder="N° maison"
                          value={form?.member?.house_number ?? ''}
                          onChange={(e) => setForm((f) => ({ ...f, member: { ...f.member, house_number: e.target.value } }))}
                          className="w-full rounded-xl border border-gray-200 px-3 py-2"
                        />
                      </div>
                    ) : (
                      <div className="text-base font-semibold text-gray-900">
                        {[
                          selected.province ? `Province: ${selected.province}` : null,
                          selected.city ? `Ville: ${selected.city}` : null,
                          selected.commune ? `Commune: ${selected.commune}` : null,
                          selected.quarter ? `Quartier: ${selected.quarter}` : null,
                          selected.avenue ? `Avenue: ${selected.avenue}` : null,
                          selected.houseNumber ? `N°: ${selected.houseNumber}` : null,
                        ]
                          .filter(Boolean)
                          .join(' | ') || '—'}
                      </div>
                    )}
                  </div>
                  <div className="sm:col-span-2 rounded-2xl border border-gray-200 bg-white p-4">
                    <div className="text-[10px] uppercase tracking-wider text-gray-500">Parents</div>
                    {editing ? (
                      <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <input
                          placeholder="Nom complet du père"
                          value={form?.member?.father_full_name ?? ''}
                          onChange={(e) => setForm((f) => ({ ...f, member: { ...f.member, father_full_name: e.target.value } }))}
                          className="w-full rounded-xl border border-gray-200 px-3 py-2"
                        />
                        <input
                          placeholder="Nom complet de la mère"
                          value={form?.member?.mother_full_name ?? ''}
                          onChange={(e) => setForm((f) => ({ ...f, member: { ...f.member, mother_full_name: e.target.value } }))}
                          className="w-full rounded-xl border border-gray-200 px-3 py-2"
                        />
                      </div>
                    ) : (
                      <div className="text-base font-semibold text-gray-900">
                        {[
                          selected.fatherFullName ? `Père: ${selected.fatherFullName}` : null,
                          selected.motherFullName ? `Mère: ${selected.motherFullName}` : null,
                        ]
                          .filter(Boolean)
                          .join(' | ') || '—'}
                      </div>
                    )}
                  </div>
                  <div className="sm:col-span-2 rounded-2xl border border-gray-200 bg-white p-4">
                    <div className="text-[10px] uppercase tracking-wider text-gray-500">Contact d’urgence</div>
                    {editing ? (
                      <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <input
                          placeholder="Nom"
                          value={form?.member?.emergency_contact_name ?? ''}
                          onChange={(e) => setForm((f) => ({ ...f, member: { ...f.member, emergency_contact_name: e.target.value } }))}
                          className="w-full rounded-xl border border-gray-200 px-3 py-2"
                        />
                        <input
                          placeholder="Lien"
                          value={form?.member?.emergency_contact_relation ?? ''}
                          onChange={(e) => setForm((f) => ({ ...f, member: { ...f.member, emergency_contact_relation: e.target.value } }))}
                          className="w-full rounded-xl border border-gray-200 px-3 py-2"
                        />
                        <input
                          placeholder="Téléphone"
                          value={form?.member?.emergency_contact_phone ?? ''}
                          onChange={(e) => setForm((f) => ({ ...f, member: { ...f.member, emergency_contact_phone: e.target.value } }))}
                          className="w-full rounded-xl border border-gray-200 px-3 py-2"
                        />
                      </div>
                    ) : (
                      <div className="text-base font-semibold text-gray-900">
                        {[
                          selected.emergencyContactName ? `Nom: ${selected.emergencyContactName}` : null,
                          selected.emergencyContactRelation ? `Lien: ${selected.emergencyContactRelation}` : null,
                          selected.emergencyContactPhone ? `Tél: ${selected.emergencyContactPhone}` : null,
                        ]
                          .filter(Boolean)
                          .join(' | ') || '—'}
                      </div>
                    )}
                  </div>
                  <div className="rounded-2xl border border-gray-200 bg-white p-4">
                    <div className="text-[10px] uppercase tracking-wider text-gray-500">Baptême</div>
                    {editing ? (
                      <input
                        type="date"
                        value={form?.member?.baptism_date ?? ''}
                        onChange={(e) => setForm((f) => ({ ...f, member: { ...f.member, baptism_date: e.target.value } }))}
                        className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2"
                      />
                    ) : (
                      <div className="text-base font-semibold text-gray-900">{formatDate(selected.baptismDate)}</div>
                    )}
                  </div>
                  <div className="rounded-2xl border border-gray-200 bg-white p-4">
                    <div className="text-[10px] uppercase tracking-wider text-gray-500">Statut du membre</div>
                    {editing ? (
                      <>
                        <label className="mt-2 inline-flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={!!form?.member?.is_active}
                            onChange={(e) => {
                              const checked = !!e.target.checked;
                              setForm((f) => ({
                                ...f,
                                member: {
                                  ...f.member,
                                  is_active: checked,
                                  inactive_reason: checked ? null : (f?.member?.inactive_reason ?? ''),
                                },
                              }));
                            }}
                          />
                          Actif
                        </label>

                        {!form?.member?.is_active ? (
                          <div className="mt-3">
                            <div className="text-[10px] uppercase tracking-wider text-gray-500">Cause</div>
                            <select
                              value={form?.member?.inactive_reason ?? ''}
                              onChange={(e) => setForm((f) => ({ ...f, member: { ...f.member, inactive_reason: e.target.value } }))}
                              className={`mt-1 ${selectClass}`}
                            >
                              <option value="">Sélectionner…</option>
                              <option value="excommunie">Excommunié</option>
                              <option value="abandonne">Abandonné</option>
                            </select>
                          </div>
                        ) : null}
                      </>
                    ) : (
                      <div className="text-base font-semibold text-gray-900">
                        {selected.status}
                        {selected.status === 'Inactif' && selected.inactiveReason ? ` (${inactiveReasonLabel(selected.inactiveReason)})` : ''}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            </div>
            </motion.div>
          )}
        </div>
        </div>
      </div>
    </div>
  );
}
