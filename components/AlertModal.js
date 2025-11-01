'use client';
import { useState, useEffect } from 'react';
import ApproveRequestModal from './ApproveRequestModal';

export default function AlertModal({ onClose, onApproveRequest }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showApproveModal, setShowApproveModal] = useState(false);

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
        const allRequests = await response.json();
        const pendingRequests = allRequests.filter(req => req.estado === 'pendiente');
        setRequests(pendingRequests);
      }
    } catch (error) {
      console.error('Error cargando solicitudes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveClick = (request) => {
    setSelectedRequest(request);
    setShowApproveModal(true);
  };

  const handleConfirmApprove = async (cantidad) => {
    try {
      await onApproveRequest(selectedRequest, cantidad);
      setShowApproveModal(false);
      setSelectedRequest(null);
      await loadPendingRequests(); // Recargar lista
    } catch (error) {
      console.error('Error aprobando solicitud:', error);
    }
  };

  const handleReject = async (requestId) => {
    if (!confirm('¿Está seguro de que desea rechazar esta solicitud?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const userData = JSON.parse(localStorage.getItem('user'));
      
      const response = await fetch(`/api/requests/${requestId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          estado: 'rechazada',
          administrador: userData.usuario,
          observaciones: 'Solicitud rechazada por el administrador'
        }),
      });

      if (response.ok) {
        await loadPendingRequests(); // Recargar lista
      } else {
        alert('Error al rechazar la solicitud');
      }
    } catch (error) {
      alert('Error de conexión');
    }
  };

  const formatFecha = (fecha) => {
    return new Date(fecha).toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-opacity-50 backdrop-blur-sm flex items-start justify-center p-4 z-50 overflow-y-auto">
      {/* Overlay para cerrar */}
      <div className="fixed inset-0" onClick={onClose}></div>
      
      {/* Modal principal */}
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl mt-20 transform transition-all duration-300 ease-out scale-100 opacity-100">
        <div className="px-6 py-4 border-b flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">
            Alertas y Solicitudes Pendientes
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-6">
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <div className="text-xl">Cargando solicitudes...</div>
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-8">
              <svg className="w-16 h-16 text-green-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-lg text-gray-600">No hay solicitudes pendientes</p>
              <p className="text-sm text-gray-500 mt-2">Todo está al día</p>
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map((request) => (
                <div key={request.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                          PENDIENTE
                        </span>
                        <span className="text-sm text-gray-500">
                          {formatFecha(request.fecha_solicitud)}
                        </span>
                      </div>
                      
                      <h4 className="font-semibold text-gray-900">
                        {request.producto_nombre}
                      </h4>
                      <p className="text-sm text-gray-600">
                        <strong>Código:</strong> {request.producto_codigo}
                      </p>
                      <p className="text-sm text-gray-600">
                        <strong>Solicitado por:</strong> {request.operador}
                      </p>
                    </div>
                    
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleApproveClick(request)}
                        className="px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors"
                      >
                        Aprobar
                      </button>
                      <button
                        onClick={() => handleReject(request.id)}
                        className="px-3 py-1 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 transition-colors"
                      >
                        Rechazar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal para aprobar solicitud */}
      {showApproveModal && selectedRequest && (
        <ApproveRequestModal
          request={selectedRequest}
          onSave={handleConfirmApprove}
          onCancel={() => {
            setShowApproveModal(false);
            setSelectedRequest(null);
          }}
        />
      )}
    </div>
  );
}