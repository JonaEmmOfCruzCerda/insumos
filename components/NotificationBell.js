'use client';
import { useState, useEffect } from 'react';

export default function NotificationBell({ onShowAlerts }) {
  const [pendingRequests, setPendingRequests] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPendingRequests();
  }, []);

  const loadPendingRequests = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/requests', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const requests = await response.json();
        const pending = requests.filter(req => req.estado === 'pendiente').length;
        setPendingRequests(pending);
      }
    } catch (error) {
      console.error('Error cargando notificaciones:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="relative">
        <button className="p-2 text-gray-600 hover:text-gray-900 transition-colors">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM10.24 8.56a5.97 5.97 0 01-4.66-6.24M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <button 
        onClick={onShowAlerts}
        className="p-2 text-gray-600 hover:text-gray-900 transition-colors relative"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM10.24 8.56a5.97 5.97 0 01-4.66-6.24M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        
        {/* Badge de notificaciones pendientes */}
        {pendingRequests > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
            {pendingRequests}
          </span>
        )}
      </button>

      {/* Tooltip */}
      {pendingRequests > 0 && (
        <div className="absolute right-0 top-12 w-48 bg-white rounded-lg shadow-lg border p-2 z-50 hidden group-hover:block">
          <p className="text-sm text-gray-700">
            {pendingRequests} solicitud{pendingRequests !== 1 ? 'es' : ''} pendiente{pendingRequests !== 1 ? 's' : ''}
          </p>
        </div>
      )}
    </div>
  );
}