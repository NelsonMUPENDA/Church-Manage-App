import React from 'react';
import { motion } from 'framer-motion';

export default function About() {
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Infos de l’église</h2>
        <p className="text-gray-600">Biographies, consistoire et présentation.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <motion.div
          className="bg-white/80 backdrop-blur-md border border-white/60 rounded-2xl shadow p-5"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.02 }}
        >
          <h3 className="text-lg font-semibold text-gray-900">Biographie</h3>
          <div className="mt-2 text-gray-700 whitespace-pre-line">
            Consolation et Paix Divine est une communauté chrétienne dédiée à l’édification spirituelle,
            à l’amour fraternel et au service.

            Cette section peut contenir l’histoire de l’église, les responsables, et les orientations.
          </div>
        </motion.div>

        <motion.div
          className="bg-white/80 backdrop-blur-md border border-white/60 rounded-2xl shadow p-5"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <h3 className="text-lg font-semibold text-gray-900">Consistoire</h3>
          <div className="mt-2 text-gray-700 whitespace-pre-line">
            Le consistoire regroupe les responsables de l’église et les équipes de gestion.

            Ici, tu peux afficher la liste des membres du consistoire et leurs fonctions.
          </div>
        </motion.div>
      </div>
    </div>
  );
}
