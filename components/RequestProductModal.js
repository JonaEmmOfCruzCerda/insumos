'use client';
import { useState } from 'react';

export default function RequestProductModal({ onSave, onCancel }) {
  const [productCode, setProductCode] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!productCode.trim()) {
      alert('Por favor ingresa un código de producto');
      return;
    }

    onSave(productCode.trim().toUpperCase());
  };

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-opacity-50 backdrop-blur-sm flex items-start justify-center p-4 z-50 overflow-y-auto">
      {/* Overlay con efecto de clic para cerrar */}
      <div 
        className="fixed inset-0" 
        onClick={onCancel}
      ></div>
      
      {/* Modal con animación */}
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mt-20 transform transition-all duration-300 ease-out scale-100 opacity-100">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">
            Solicitar Producto
          </h3>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Código del Producto *
            </label>
            <input
              type="text"
              placeholder="Ej: PROD-001"
              value={productCode}
              onChange={(e) => setProductCode(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-700 placeholder-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Ingresa el código exacto del producto que necesitas
            </p>
          </div>

          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-sm text-blue-700">
              <strong>⚠️ Importante:</strong> Esta solicitud será enviada al administrador para su aprobación. 
              Recibirás una notificación cuando el producto esté disponible.
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
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
            >
              Enviar Solicitud
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}