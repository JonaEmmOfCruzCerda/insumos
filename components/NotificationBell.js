'use client';
import { useState, useEffect } from 'react';

export default function NotificationBell({ onShowAlerts }) {
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    loadPendingCount();
  }, []);

  const loadPendingCount = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/requests', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const allRequests = await response.json();
        const pendingRequests = allRequests.filter(req => req.estado === 'pendiente');
        setPendingCount(pendingRequests.length);
      }
    } catch (error) {
      console.error('Error cargando notificaciones:', error);
    }
  };

  return (
    <button
      onClick={onShowAlerts}
      className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors"
    >
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM10.24 8.56a5.97 5.97 0 01-4.66-6.24M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      
      {pendingCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
          {pendingCount}
        </span>
      )}
      
      <span className="sr-only">Notificaciones</span>
    </button>
  );
}