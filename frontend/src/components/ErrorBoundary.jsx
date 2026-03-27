import React from 'react';
import { useRouteError } from 'react-router-dom';
import { ExclamationTriangleIcon, ArrowPathIcon, HomeIcon } from '@heroicons/react/24/outline';

/**
 * Error Boundary component for catching and displaying errors
 */
export function ErrorBoundary() {
  const error = useRouteError();
  
  console.error('Route Error:', error);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-4">
      <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-xl shadow-lg p-8 text-center">
        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <ExclamationTriangleIcon className="w-8 h-8 text-red-600 dark:text-red-400" />
        </div>
        
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
          Oups ! Une erreur est survenue
        </h1>
        
        <p className="text-slate-600 dark:text-slate-400 mb-6">
          Nous sommes désolés, mais quelque chose s'est mal passé. 
          Veuillez réessayer ou contacter le support si le problème persiste.
        </p>
        
        {error?.message && (
          <div className="bg-slate-100 dark:bg-slate-700 rounded-lg p-4 mb-6 text-left">
            <p className="text-sm font-mono text-slate-700 dark:text-slate-300 break-all">
              {error.message}
            </p>
          </div>
        )}
        
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
          >
            <ArrowPathIcon className="w-4 h-4" />
            Réessayer
          </button>
          
          <a
            href="/"
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg transition-colors"
          >
            <HomeIcon className="w-4 h-4" />
            Accueil
          </a>
        </div>
      </div>
    </div>
  );
}

/**
 * Component for handling API query errors
 */
export function QueryErrorFallback({ error, resetErrorBoundary }) {
  return (
    <div className="p-6 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg">
      <div className="flex items-start gap-3">
        <ExclamationTriangleIcon className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="font-semibold text-red-900 dark:text-red-100">
            Erreur de chargement
          </h3>
          <p className="text-sm text-red-700 dark:text-red-300 mt-1">
            {error?.message || 'Une erreur est survenue lors du chargement des données.'}
          </p>
          {resetErrorBoundary && (
            <button
              onClick={resetErrorBoundary}
              className="mt-3 text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
            >
              Réessayer
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * 404 Not Found page
 */
export function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-slate-300 dark:text-slate-600 mb-4">
          404
        </h1>
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
          Page non trouvée
        </h2>
        <p className="text-slate-600 dark:text-slate-400 mb-6">
          La page que vous recherchez n'existe pas ou a été déplacée.
        </p>
        <a
          href="/"
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
        >
          <HomeIcon className="w-4 h-4" />
          Retour à l'accueil
        </a>
      </div>
    </div>
  );
}
