import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthProvider';
import { api } from '../services/apiClient';
import { useToast } from '../components/ToastProvider';

export default function About() {
  const { user } = useAuth();
  const toast = useToast();
  const role = user?.is_superuser || user?.is_staff ? 'admin' : user?.role;
  const isAdmin = role === 'admin' || role === 'super_admin';

  const [biography, setBiography] = useState(null);
  const [consistory, setConsistory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingBiography, setEditingBiography] = useState(false);
  const [editingConsistory, setEditingConsistory] = useState(false);
  const [biographyForm, setBiographyForm] = useState({ title: '', content: '' });
  const [consistoryForm, setConsistoryForm] = useState({ title: '', content: '' });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [bioRes, conRes] = await Promise.all([
        api.get('/api/church-biography/'),
        api.get('/api/church-consistory/')
      ]);
      
      const bioData = bioRes.data.results || bioRes.data;
      const conData = conRes.data.results || conRes.data;
      
      setBiography(bioData[0] || null);
      setConsistory(conData[0] || null);
    } catch (err) {
      console.error('Erreur chargement données:', err);
      toast.push({ type: 'error', title: 'Erreur', message: 'Impossible de charger les informations.' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const handleEditBiography = () => {
    setBiographyForm({
      title: biography?.title || "Biographie de l'église",
      content: biography?.content || ''
    });
    setEditingBiography(true);
  };

  const handleEditConsistory = () => {
    setConsistoryForm({
      title: consistory?.title || "Consistoire de l'église",
      content: consistory?.content || ''
    });
    setEditingConsistory(true);
  };

  const handleSaveBiography = async () => {
    if (!biographyForm.content.trim()) {
      toast.push({ type: 'error', title: 'Erreur', message: 'Le contenu est requis.' });
      return;
    }

    setSaving(true);
    try {
      let savedBiography;
      if (biography) {
        // Mise à jour
        const response = await api.patch(`/api/church-biography/${biography.id}/`, biographyForm);
        savedBiography = response.data;
      } else {
        // Création
        const response = await api.post('/api/church-biography/', biographyForm);
        savedBiography = response.data;
      }
      
      // Fermer immédiatement le formulaire
      setEditingBiography(false);
      
      // Mettre à jour l'état local
      setBiography(savedBiography);
      
      // Notification de succès
      toast.push({ type: 'success', title: 'Succès', message: 'Biographie mise à jour.' });
      
      // Recharger les données pour s'assurer que tout est synchronisé
      await load();
    } catch (err) {
      console.error('Erreur sauvegarde biographie:', err);
      toast.push({ type: 'error', title: 'Erreur', message: 'Impossible de sauvegarder.' });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveConsistory = async () => {
    if (!consistoryForm.content.trim()) {
      toast.push({ type: 'error', title: 'Erreur', message: 'Le contenu est requis.' });
      return;
    }

    setSaving(true);
    try {
      let savedConsistory;
      if (consistory) {
        // Mise à jour
        const response = await api.patch(`/api/church-consistory/${consistory.id}/`, consistoryForm);
        savedConsistory = response.data;
      } else {
        // Création
        const response = await api.post('/api/church-consistory/', consistoryForm);
        savedConsistory = response.data;
      }
      
      // Fermer immédiatement le formulaire
      setEditingConsistory(false);
      
      // Mettre à jour l'état local
      setConsistory(savedConsistory);
      
      // Notification de succès
      toast.push({ type: 'success', title: 'Succès', message: 'Consistoire mis à jour.' });
      
      // Recharger les données pour s'assurer que tout est synchronisé
      await load();
    } catch (err) {
      console.error('Erreur sauvegarde consistoire:', err);
      toast.push({ type: 'error', title: 'Erreur', message: 'Impossible de sauvegarder.' });
    } finally {
      setSaving(false);
    }
  };
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Infos de l’église</h2>
        <p className="text-gray-600">Biographies, consistoire et présentation.</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Chargement...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <motion.div
            className="bg-white/80 backdrop-blur-md border border-white/60 rounded-2xl shadow p-5"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.02 }}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-900">Biographie</h3>
              {isAdmin && (
                <button
                  type="button"
                  onClick={handleEditBiography}
                  className="px-3 py-1.5 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                >
                  Modifier la biographie
                </button>
              )}
            </div>
          {editingBiography ? (
            <div className="space-y-3">
              <input
                type="text"
                value={biographyForm.title}
                onChange={(e) => setBiographyForm({ ...biographyForm, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Titre de la biographie"
              />
              <textarea
                value={biographyForm.content}
                onChange={(e) => setBiographyForm({ ...biographyForm, content: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent h-32 resize-none"
                placeholder="Contenu de la biographie"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleSaveBiography}
                  disabled={saving}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {saving ? 'Sauvegarde...' : 'Sauvegarder'}
                </button>
                <button
                  type="button"
                  onClick={() => setEditingBiography(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                >
                  Annuler
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-2 text-gray-700 whitespace-pre-line">
              {biography?.content || (
                <>
                  Consolation et Paix Divine est une communauté chrétienne dédiée à l'édification spirituelle,
                  à l'amour fraternel et au service.

                  Cette section peut contenir l'histoire de l'église, les responsables, et les orientations.
                </>
              )}
            </div>
          )}
        </motion.div>

        <motion.div
          className="bg-white/80 backdrop-blur-md border border-white/60 rounded-2xl shadow p-5"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-900">Consistoire</h3>
            {isAdmin && (
              <button
                type="button"
                onClick={handleEditConsistory}
                className="px-3 py-1.5 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
              >
                Modifier consistoire
              </button>
            )}
          </div>
          {editingConsistory ? (
            <div className="space-y-3">
              <input
                type="text"
                value={consistoryForm.title}
                onChange={(e) => setConsistoryForm({ ...consistoryForm, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Titre du consistoire"
              />
              <textarea
                value={consistoryForm.content}
                onChange={(e) => setConsistoryForm({ ...consistoryForm, content: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent h-32 resize-none"
                placeholder="Contenu du consistoire"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleSaveConsistory}
                  disabled={saving}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {saving ? 'Sauvegarde...' : 'Sauvegarder'}
                </button>
                <button
                  type="button"
                  onClick={() => setEditingConsistory(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                >
                  Annuler
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-2 text-gray-700 whitespace-pre-line">
              {consistory?.content || (
                <>
                  Le consistoire regroupe les responsables de l'église et les équipes de gestion.

                  Ici, tu peux afficher la liste des membres du consistoire et leurs fonctions.
                </>
              )}
            </div>
          )}
        </motion.div>
      </div>
      )}
    </div>
  );
}
