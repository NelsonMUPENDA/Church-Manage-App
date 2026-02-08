import React, { useEffect, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ClipboardDocumentCheckIcon, Cog6ToothIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline';
import { useLocation, useNavigate } from 'react-router-dom';

import { useAuth } from '../contexts/AuthProvider';
import Pointage from './Pointage';
import Logistics from './Logistics';
import Finances from './Finances';

const TAB_ITEMS = [
  { key: 'pointage', label: 'Pointage', icon: ClipboardDocumentCheckIcon },
  { key: 'logistique', label: 'Logistique', icon: Cog6ToothIcon },
  { key: 'finance', label: 'Finance', icon: CurrencyDollarIcon },
];

export default function Diaconat() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const rawRole = user?.is_superuser ? 'super_admin' : user?.is_staff ? 'admin' : user?.role;
  const role = rawRole === 'administrator' ? 'admin' : rawRole === 'pastor' ? 'super_admin' : rawRole;
  const departmentName = String(user?.department_name || '').toLowerCase();
  const isAdmin = role === 'admin' || role === 'super_admin';
  const isProtocolDeptHead = role === 'department_head' && (departmentName.includes('protoc') || departmentName.includes('protocol'));
  const isSecretary = role === 'secretary' || role === 'protocol_head' || isProtocolDeptHead;
  const isLogisticsHead = (role === 'logistics_head' || (role === 'department_head' && (departmentName.includes('logist') || departmentName.includes('logistique')))) && !isProtocolDeptHead;
  const isTreasurer = role === 'treasurer' || role === 'financial_head';

  const allowedTabs = useMemo(() => {
    if (isAdmin) return TAB_ITEMS;
    if (isSecretary) return TAB_ITEMS.filter((t) => t.key === 'pointage');
    if (isLogisticsHead) return TAB_ITEMS.filter((t) => t.key === 'logistique');
    if (isTreasurer) return TAB_ITEMS.filter((t) => t.key === 'finance');
    return [];
  }, [isAdmin, isSecretary, isLogisticsHead, isTreasurer]);

  const activeTab = useMemo(() => {
    if (!allowedTabs.length) return '';
    const sp = new URLSearchParams(location.search || '');
    const t = String(sp.get('tab') || allowedTabs[0].key || 'pointage').toLowerCase();
    if (allowedTabs.some((x) => x.key === t)) return t;
    return allowedTabs[0].key;
  }, [location.search, allowedTabs]);

  const setTab = (key) => {
    if (!allowedTabs.some((t) => t.key === key)) return;
    const sp = new URLSearchParams(location.search || '');
    sp.set('tab', key);
    navigate({ pathname: '/diaconat', search: `?${sp.toString()}` }, { replace: true });
  };

  useEffect(() => {
    if (allowedTabs.length) return;
    navigate('/events', { replace: true });
  }, [allowedTabs.length, navigate]);

  if (!allowedTabs.length) return null;

  return (
    <div className="h-full min-h-0 flex flex-col">
      <div className="shrink-0 flex items-start justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-extrabold text-gray-900 dark:text-white">Diaconat</h2>
          <p className="text-gray-600 dark:text-slate-300">Pointage, logistique et rapport d’activité.</p>
        </div>
      </div>

      <div className="shrink-0 mb-3 cpd-tabs w-full">
        {allowedTabs.map((t) => {
          const isActive = t.key === activeTab;
          const Icon = t.icon;
          return (
            <motion.button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={[
                'cpd-tab',
                isActive ? 'cpd-tab-active' : 'cpd-tab-inactive',
              ].join(' ')}
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.98 }}
            >
              <Icon className="h-5 w-5 text-gray-500 dark:text-slate-300" />
              {t.label}
            </motion.button>
          );
        })}
      </div>

      <div className="min-h-0 flex-1">
        <AnimatePresence mode="wait">
          {activeTab === 'pointage' ? (
            <motion.div
              key="tab-pointage"
              className="h-full min-h-0"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
            >
              <Pointage />
            </motion.div>
          ) : activeTab === 'logistique' ? (
            <motion.div
              key="tab-logistique"
              className="h-full min-h-0"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
            >
              <Logistics />
            </motion.div>
          ) : (
            <motion.div
              key="tab-finance"
              className="h-full min-h-0"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
            >
              <Finances />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
