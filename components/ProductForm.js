'use client';
import { useState, useEffect } from 'react';

export default function ProductForm({ product, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    codigo: '',
    producto: '',
    descripcion: '',
    observaciones: '',
    punto_reorden: 2,
    stock: 0
  });

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Cargar productos para calcular el siguiente código
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const response = await fetch('/api/products');
        if (response.ok) {
          const data = await response.json();
          setProducts(data);
          
          // Si es un nuevo producto, calcular el siguiente código automáticamente
          if (!product) {
            const siguienteCodigo = calcularSiguienteCodigo(data);
            setFormData(prev => ({
              ...prev,
              codigo: siguienteCodigo
            }));
          }
        }
      } catch (error) {
        console.error('Error al cargar productos:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, [product]);

  // Si es edición, cargar los datos del producto
  useEffect(() => {
    if (product) {
      setFormData(product);
    }
  }, [product]);

  // Función para calcular el siguiente código
  const calcularSiguienteCodigo = (productos) => {
    if (productos.length === 0) {
      return 'PROD-001';
    }
    
    let maxNumber = 0;
    
    productos.forEach(producto => {
      const match = producto.codigo.match(/PROD-(\d+)/);
      if (match) {
        const number = parseInt(match[1]);
        if (number > maxNumber) {
          maxNumber = number;
        }
      }
    });
    
    const nuevoNumero = maxNumber + 1;
    return `PROD-${nuevoNumero.toString().padStart(3, '0')}`;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'punto_reorden' || name === 'stock' ? parseInt(value) || 0 : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Para nuevo producto, no enviar el campo código (se genera en backend)
    const dataToSend = product 
      ? formData // Edición: enviar todos los datos
      : { // Nuevo: no enviar código (se genera automáticamente)
          producto: formData.producto,
          descripcion: formData.descripcion,
          observaciones: formData.observaciones,
          punto_reorden: formData.punto_reorden,
          stock: formData.stock
        };
    
    onSave(dataToSend);
  };

  if (loading && !product) {
    return (
      <div className="fixed inset-0 backdrop-blur-sm bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg shadow-xl p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Calculando código...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-opacity-50 backdrop-blur-sm flex items-start justify-center p-4 z-50 overflow-y-auto">
      {/* Overlay con efecto de clic para cerrar */}
      <div 
        className="fixed inset-0" 
        onClick={onCancel}
      ></div>
      
      {/* Modal con animación */}
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mt-20 transform transition-all duration-300 ease-out scale-100 opacity-100">
        <div className="px-6 py-4 border-b sticky top-0 bg-white">
          <h3 className="text-lg font-semibold text-gray-900">
            {product ? 'Editar Producto' : 'Nuevo Producto'}
          </h3>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Código {!product && <span className="text-xs text-gray-500">(Auto-generado)</span>}
            </label>
            <input
              type="text"
              name="codigo"
              value={formData.codigo}
              onChange={handleChange}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                !product ? 'bg-gray-100 text-gray-600' : ''
              }`}
              required
              disabled={!product} // Solo habilitado para edición
              readOnly={!product} // Solo lectura para nuevo producto
            />
            {!product && (
              <p className="text-xs text-gray-500 mt-1">
                El código se genera automáticamente
              </p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Producto *
            </label>
            <input
              type="text"
              name="producto"
              value={formData.producto}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción
            </label>
            <textarea
              name="descripcion"
              value={formData.descripcion}
              onChange={handleChange}
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Observaciones
            </label>
            <textarea
              name="observaciones"
              value={formData.observaciones}
              onChange={handleChange}
              rows="2"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Punto de Reorden *
              </label>
              <input
                type="number"
                name="punto_reorden"
                value={formData.punto_reorden}
                onChange={handleChange}
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Stock Inicial *
              </label>
              <input
                type="number"
                name="stock"
                value={formData.stock}
                onChange={handleChange}
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>
          
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            >
              {product ? 'Actualizar' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}