'use client';
import { useState } from 'react';

export default function ProductTable({ products, onEdit, onDelete, onAddStock, userType }) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredProducts = (products || []).filter(product =>
    product.codigo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.producto?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Filtrar productos que necesitan surtir
  const productosNecesitanSurtir = filteredProducts.filter(
    product => product.stock <= product.punto_reorden
  );

  // Función para exportar a Excel
  const exportarAExcel = () => {
    if (productosNecesitanSurtir.length === 0) {
      alert('No hay productos que necesiten surtir');
      return;
    }

    // Crear contenido CSV
    const headers = ['Código', 'Producto', 'Descripción', 'Observaciones', 'Punto Reorden', 'Stock Actual', 'Estado'];
    const csvContent = [
      headers.join(','),
      ...productosNecesitanSurtir.map(product => [
        product.codigo,
        `"${product.producto}"`,
        `"${product.descripcion || ''}"`,
        `"${product.observaciones || ''}"`,
        product.punto_reorden,
        product.stock,
        'Necesita Surtir'
      ].join(','))
    ].join('\n');

    // Crear y descargar archivo
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `productos_necesitan_surtir_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Función para exportar a PDF
  const exportarAPDF = () => {
    if (productosNecesitanSurtir.length === 0) {
      alert('No hay productos que necesiten surtir');
      return;
    }

    // Crear contenido HTML para el PDF
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Productos que Necesitan Surtir</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1 { color: #333; text-align: center; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f5f5f5; font-weight: bold; }
          .header-info { margin-bottom: 20px; text-align: center; }
          .urgent { background-color: #fff3cd; }
        </style>
      </head>
      <body>
        <div class="header-info">
          <h1>Productos que Necesitan Surtir</h1>
          <p><strong>Fecha de generación:</strong> ${new Date().toLocaleDateString()}</p>
          <p><strong>Total de productos:</strong> ${productosNecesitanSurtir.length}</p>
        </div>
        <table>
          <thead>
            <tr>
              <th>Código</th>
              <th>Producto</th>
              <th>Descripción</th>
              <th>Observaciones</th>
              <th>Punto Reorden</th>
              <th>Stock Actual</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            ${productosNecesitanSurtir.map(product => `
              <tr class="urgent">
                <td>${product.codigo}</td>
                <td>${product.producto}</td>
                <td>${product.descripcion || '-'}</td>
                <td>${product.observaciones || '-'}</td>
                <td>${product.punto_reorden}</td>
                <td><strong>${product.stock}</strong></td>
                <td><strong>NECESITA SURTIR</strong></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div style="margin-top: 30px; text-align: center; font-size: 12px; color: #666;">
          Generado automáticamente por el Sistema de Inventario
        </div>
      </body>
      </html>
    `;

    // Abrir ventana para imprimir/guardar como PDF
    const printWindow = window.open('', '_blank');
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-4 border-b">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Inventario de Productos</h2>
          <input
            type="text"
            placeholder="Buscar producto..."
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-400 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        {/* Botones de exportación */}
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-600">
            Mostrando {filteredProducts.length} de {products?.length || 0} productos
            {productosNecesitanSurtir.length > 0 && (
              <span className="ml-2 text-orange-600 font-medium">
                ({productosNecesitanSurtir.length} necesitan surtir)
              </span>
            )}
          </div>
          
          {productosNecesitanSurtir.length > 0 && (
            <div className="flex space-x-2">
              <button
                onClick={exportarAExcel}
                className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors flex items-center"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Exportar Excel
              </button>
              <button
                onClick={exportarAPDF}
                className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors flex items-center"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Exportar PDF
              </button>
            </div>
          )}
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Código</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descripción</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Observaciones</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Punto Reorden</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
              {userType === 'admin' && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredProducts.length === 0 ? (
              <tr>
                <td 
                  colSpan={userType === 'admin' ? 8 : 7} 
                  className="px-6 py-4 text-center text-sm text-gray-500"
                >
                  {!products || products.length === 0 
                    ? 'No hay productos registrados' 
                    : 'No se encontraron productos que coincidan con la búsqueda'
                  }
                </td>
              </tr>
            ) : (
              filteredProducts.map((product) => (
                <tr 
                  key={product.id} 
                  className={`hover:bg-gray-50 ${
                    product.stock <= product.punto_reorden ? 'bg-orange-50' : ''
                  }`}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{product.codigo}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product.producto}</td>
                  <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">{product.descripcion || '-'}</td>
                  <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">{product.observaciones || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {product.punto_reorden}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      product.stock <= product.punto_reorden 
                        ? 'bg-red-100 text-red-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {product.stock}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {product.stock <= product.punto_reorden ? (
                      <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs font-medium rounded-full">
                        Necesita surtir
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                        Normal
                      </span>
                    )}
                  </td>
                  {userType === 'admin' && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => onAddStock(product)}
                          className="px-2 py-1 rounded-full text-xs font-medium bg-gray-200 text-gray-800"
                          title="Agregar/Retirar Stock"
                        >
                          Actualizar Stock
                        </button>
                        <button
                          onClick={() => onEdit(product)}
                          className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => onDelete(product.id)}
                          className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800"
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}