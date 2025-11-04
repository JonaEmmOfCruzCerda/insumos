'use client';
import { useState, useEffect } from 'react';

export default function AddStockModal({ product, onSave, onCancel }) {
  const [cantidad, setCantidad] = useState(0);
  const [tipoMovimiento, setTipoMovimiento] = useState('entrada'); // 'entrada' o 'salida'

  useEffect(() => {
    if (product) {
      setCantidad(0);
      setTipoMovimiento('entrada');
    }
  }, [product]);

  const handleSubmit = async (e) => {
  e.preventDefault();

  if (cantidad <= 0) {
    alert('La cantidad debe ser mayor a 0');
    return;
  }

  if (tipoMovimiento === 'salida' && cantidad > product.stock) {
    alert('No hay suficiente stock para realizar esta salida');
    return;
  }

  try {
    // 🔐 Obtener token JWT del almacenamiento local
    const token = localStorage.getItem('token');
    if (!token) {
      alert('No hay token de autenticación. Inicia sesión nuevamente.');
      return;
    }

    // 🧾 Construir payload de la operación
    const payload = {
      operacion: tipoMovimiento,
      cantidad: parseInt(cantidad),
      observaciones: `Movimiento manual de ${tipoMovimiento}`,
    };

    // 🚀 Llamada a la API con token en el header
    const res = await fetch(`/api/products/${product.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error('❌ Error en la API:', data.error);
      alert(data.error || 'Error al actualizar producto');
      return;
    }

    // ✅ Mostrar mensaje de confirmación
    alert(data.message || 'Movimiento registrado correctamente');

    // 🔄 Actualizar el producto en la vista local
    onSave({
      ...product,
      stock: data.stock_actual,
    });
  } catch (error) {
    console.error('Error en handleSubmit:', error);
    alert('Error al guardar los cambios. Revisa la consola.');
  }
};

  const calcularNuevoStock = () => {
    if (tipoMovimiento === 'entrada') {
      return product.stock + parseInt(cantidad || 0);
    } else {
      return product.stock - parseInt(cantidad || 0);
    }
  };

  // Determinar si después del movimiento se debe activar la solicitud
  const necesitaSolicitar = () => {
    return calcularNuevoStock() <= product.punto_reorden;
  };

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">
            {tipoMovimiento === 'entrada' ? 'Agregar Stock' : 'Retirar Stock'}
          </h3>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-700 mb-2">Producto:</h4>
            <p className="text-sm text-gray-600">
              <strong>Código:</strong> {product.codigo}<br/>
              <strong>Producto:</strong> {product.producto}<br/>
              <strong>Descripción:</strong> {product.descripcion || 'Sin descripción'}<br/>
              <strong>Observaciones:</strong> {product.observaciones || 'Sin observaciones'}<br/>
              <strong>Punto de reorden:</strong> {product.punto_reorden}<br/>
              <strong>Stock actual:</strong> <span className="font-bold">{product.stock}</span><br/>
              <strong>Estado solicitud:</strong> 
              <span className={`ml-1 ${product.solicitar ? 'text-red-600 font-bold' : 'text-green-600'}`}>
                {product.solicitar ? 'Solicitado' : 'Normal'}
              </span>
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo de Movimiento
            </label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="entrada"
                  checked={tipoMovimiento === 'entrada'}
                  onChange={(e) => setTipoMovimiento(e.target.value)}
                  className="mr-2"
                />
                <span className="text-green-600 font-medium">Entrada</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="salida"
                  checked={tipoMovimiento === 'salida'}
                  onChange={(e) => setTipoMovimiento(e.target.value)}
                  className="mr-2"
                />
                <span className="text-red-600 font-medium">Salida</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cantidad
            </label>
            <input
              type="number"
              min="1"
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {cantidad > 0 && (
            <div className={`p-3 rounded-lg ${
              necesitaSolicitar() ? 'bg-red-50 border border-red-200' : 'bg-blue-50'
            }`}>
              <p className={`text-sm ${necesitaSolicitar() ? 'text-red-700' : 'text-blue-700'}`}>
                <strong>Stock después del movimiento:</strong>{' '}
                <span className={`font-bold ${
                  necesitaSolicitar() ? 'text-red-600' : 'text-green-600'
                }`}>
                  {calcularNuevoStock()}
                </span>
                
                {necesitaSolicitar() ? (
                  <span className="block mt-1 text-red-600 text-xs font-medium">
                    ⚠️ ALERTA: El stock estará por debajo del punto de reorden ({product.punto_reorden})<br/>
                    • Se activará la bandera "solicitar" automáticamente
                  </span>
                ) : (
                  <span className="block mt-1 text-green-600 text-xs">
                    ✅ El stock estará por encima del punto de reorden
                    {product.solicitar && (
                      <span className="block text-blue-600">
                        • Se desactivará la bandera "solicitar" automáticamente
                      </span>
                    )}
                  </span>
                )}
              </p>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              {tipoMovimiento === 'entrada' ? 'Agregar Stock' : 'Retirar Stock'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}