'use client';
import { useState } from 'react';

export default function ApproveRequestModal({ request, onSave, onCancel }) {
  const [cantidad, setCantidad] = useState(1);
  const [observaciones, setObservaciones] = useState('');

  // Manejo seguro de propiedades - esto evita el error
  const productoNombre = request?.producto_nombre || request?.producto || 'Producto no disponible';
  const productoCodigo = request?.producto_codigo || request?.codigo || 'N/A';
  const operador = request?.operador || request?.usuario || 'Solicitante no disponible';

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (cantidad <= 0) {
      alert('La cantidad debe ser mayor a 0');
      return;
    }

    onSave(cantidad, observaciones);
  };

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-opacity-50 backdrop-blur-sm flex items-start justify-center p-4 z-50 overflow-y-auto">
      <div className="fixed inset-0" onClick={onCancel}></div>
      
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mt-20 transform transition-all duration-300 ease-out scale-100 opacity-100">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">
            Aprobar Solicitud
          </h3>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-700 mb-2">Solicitud:</h4>
            <p className="text-sm text-gray-600">
              <strong>Producto:</strong> {productoNombre}<br/>
              <strong>Código:</strong> {productoCodigo}<br/>
              <strong>Solicitante:</strong> {operador}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cantidad a entregar *
            </label>
            <input
              type="number"
              min="1"
              value={cantidad}
              onChange={(e) => setCantidad(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Observaciones (opcional)
            </label>
            <textarea
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Observaciones adicionales..."
            />
          </div>

          <div className="bg-green-50 p-3 rounded-lg">
            <p className="text-sm text-green-700">
              <strong>✅ Esta acción:</strong><br/>
              • Aprobará la solicitud del operador<br/>
              • Descontará {cantidad} unidades del stock<br/>
              • Registrará el movimiento en el historial
            </p>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors"
            >
              Aprobar y Registrar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}