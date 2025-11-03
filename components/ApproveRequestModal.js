'use client';
import { useState, useEffect } from 'react';

export default function ApproveRequestModal({ request, onSave, onCancel }) {
  const [cantidad, setCantidad] = useState(1);
  const [observaciones, setObservaciones] = useState('');
  const [stockDisponible, setStockDisponible] = useState(0);

  // Cargar información del producto al abrir el modal
  useEffect(() => {
    const loadProductInfo = async () => {
      try {
        const response = await fetch(`/api/products/${request.producto_id}`);
        if (response.ok) {
          const producto = await response.json();
          setStockDisponible(producto.stock || 0);
          
          // Establecer cantidad por defecto (mínimo entre lo solicitado y stock disponible)
          const cantidadSolicitada = request.cantidad_solicitada || 1;
          const cantidadDefault = Math.min(cantidadSolicitada, producto.stock);
          setCantidad(cantidadDefault > 0 ? cantidadDefault : 1);
        }
      } catch (error) {
        console.error('Error cargando información del producto:', error);
      }
    };

    if (request) {
      loadProductInfo();
    }
  }, [request]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (cantidad <= 0) {
      alert('La cantidad debe ser mayor a 0');
      return;
    }

    if (cantidad > stockDisponible) {
      alert(`No hay suficiente stock. Stock disponible: ${stockDisponible}`);
      return;
    }

    onSave(cantidad, observaciones);
  };

  // Verificación segura de las propiedades
  const productoNombre = request?.producto_nombre || 'Producto no disponible';
  const productoCodigo = request?.producto_codigo || 'N/A';
  const operador = request?.operador || 'Solicitante no disponible';
  const cantidadSolicitada = request?.cantidad_solicitada || 1;

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-opacity-50 flex items-start justify-center p-4 z-50 overflow-y-auto">
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
              <strong>Solicitante:</strong> {operador}<br/>
              <strong>Cantidad solicitada:</strong> {cantidadSolicitada}<br/>
              <strong>Stock disponible:</strong> {stockDisponible}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cantidad a entregar *
            </label>
            <input
              type="number"
              min="0"
              max={stockDisponible}
              value={cantidad}
              onChange={(e) => setCantidad(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border text-gray-600 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Máximo: {stockDisponible} unidades disponibles
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Observaciones (opcional)
            </label>
            <textarea
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 text-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Observaciones adicionales..."
            />
          </div>

          <div className="bg-green-50 p-3 rounded-lg">
            <p className="text-sm text-green-700">
              <strong>Esta acción:</strong><br/>
              • Aprobará la solicitud del operador<br/>
              • Descontará {cantidad} unidades del stock<br/>
              • Stock resultante: {stockDisponible - cantidad} unidades<br/>
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
              Aprobar y Descontar Stock
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}