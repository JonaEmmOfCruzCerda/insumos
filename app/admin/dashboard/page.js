'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ProductTable from '@/components/ProductTable';
import ProductForm from '@/components/ProductForm';
import ExcelUpload from '@/components/ExcelUpload';
import AddStockModal from '@/components/AddStockModal';
import NotificationBell from '@/components/NotificationBell';
import AlertModal from '@/components/AlertModal';

export default function AdminDashboard() {
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [showProductForm, setShowProductForm] = useState(false);
  const [showExcelUpload, setShowExcelUpload] = useState(false);
  const [showAddStockModal, setShowAddStockModal] = useState(false);
  const [showAlertModal, setShowAlertModal] = useState(false);


  const [editingProduct, setEditingProduct] = useState(null);
  const [stockProduct, setStockProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (!token || !userData) {
      router.push('/');
      return;
    }

    const parsedUser = JSON.parse(userData);
    if (parsedUser.tipo !== 'admin') {
      router.push('/operator/dashboard');
      return;
    }

    setUser(parsedUser);
    loadProducts();
  }, [router]);

  const loadProducts = async () => {
    try {
      const response = await fetch('/api/products');
      if (response.ok) {
        const data = await response.json();
        setProducts(data);
      } else {
        setError('Error al cargar productos');
      }
    } catch (error) {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/');
  };

  const handleCreateProduct = () => {
    setEditingProduct(null);
    setShowProductForm(true);
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setShowProductForm(true);
  };

  // Función para abrir el modal de stock
  const handleAddStock = (product) => {
    console.log('Abriendo modal para producto:', product.codigo);
    setStockProduct(product);
    setShowAddStockModal(true);
  };

  // Función para guardar el movimiento de stock
  const handleSaveStock = async (movementData) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/movements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(movementData),
      });

      if (response.ok) {
        setShowAddStockModal(false);
        setStockProduct(null);
        await loadProducts(); // Recargar productos para ver el stock actualizado
        
        const result = await response.json();
        setError(`${result.message}`);
      } else {
        const errorData = await response.json();
        setError(`${errorData.error}`);
      }
    } catch (error) {
      setError('Error de conexión al guardar movimiento');
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!confirm('¿Está seguro de que desea eliminar este producto?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/products/${productId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        await loadProducts();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Error al eliminar producto');
      }
    } catch (error) {
      setError('Error de conexión');
    }
  };

  const handleSaveProduct = async (productData) => {
    try {
      const token = localStorage.getItem('token');
      const url = editingProduct ? `/api/products/${editingProduct.id}` : `/api/products`;

      const method = editingProduct ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(productData),
      });

      if(response.ok) {
        setShowProductForm(false);
        setEditingProduct(null);
        await loadProducts();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Error al guardar producto');
      }
    } catch (error) {
      setError('Error de conexión');
    }
  };

  const handleProductsFromExcel = async (productsFromExcel) => {
    try {
      const token = localStorage.getItem('token');
      setLoading(true);
      setError('');

      let successCount = 0;
      let errorCount = 0;
      const errors = [];

      for (const productData of productsFromExcel) {
        try {
          const response = await fetch('/api/products', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(productData),
          });

          if (response.ok) {
            successCount++;
          } else {
            const errorData = await response.json();
            errors.push(`Producto ${productData.codigo}: ${errorData.error}`);
            errorCount++;
          }
        } catch (error) {
          errors.push(`Producto ${productData.codigo}: Error de conexión`);
          errorCount++;
        }
      }

      await loadProducts();

      if (errorCount > 0) {
        setError(
          `Proceso completado: ${successCount} productos cargados, ${errorCount} errores. ` +
          `Errores: ${errors.join('; ')}`
        );
      } else {
        setError(`¡Éxito! ${successCount} productos cargados correctamente.`);
      }

      setShowExcelUpload(false);

    } catch (error) {
      setError('Error al procesar los productos del Excel');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelProduct = () => {
    setShowProductForm(false);
    setEditingProduct(null);
  };

  const handleCancelStock = () => {
    setShowAddStockModal(false);
    setStockProduct(null);
  };

  const handleShowAlerts = () => {
    setShowAlertModal(true);
  };

// En el Dashboard Admin - función para aprobar solicitud y descontar stock
const handleApproveRequest = async (solicitud, cantidadAprobada, observacionesAdmin) => {
  try {
    const token = localStorage.getItem('token');
    const userData = JSON.parse(localStorage.getItem('user'));

    console.log('Procesando aprobación:', {
      solicitud_id: solicitud.id,
      producto_id: solicitud.producto_id,
      cantidad_aprobada: cantidadAprobada
    });

    // 1. Primero obtener el producto actual para ver el stock anterior
    console.log('Buscando producto con ID:', solicitud.producto_id);
    const productResponse = await fetch(`/api/products/${solicitud.producto_id}`);
    
    if (!productResponse.ok) {
      const errorData = await productResponse.json();
      throw new Error(`Error al obtener producto: ${errorData.error || 'Producto no encontrado'}`);
    }

    const productoActual = await productResponse.json();
    console.log('Producto encontrado:', productoActual);
    
    const stockAnterior = productoActual.stock;

    // 2. Actualizar el stock del producto (restar la cantidad aprobada)
    const updateStockResponse = await fetch(`/api/products/${solicitud.producto_id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        operacion: 'salida',
        cantidad: cantidadAprobada,
        observaciones: observacionesAdmin || `Solicitud aprobada - ID: ${solicitud.id}`
      }),
    });

    if (!updateStockResponse.ok) {
      const errorData = await updateStockResponse.json();
      throw new Error(errorData.error || 'Error al actualizar stock');
    }

    const productoActualizado = await updateStockResponse.json();

    // 3. Actualizar el estado de la solicitud
    const updateRequestResponse = await fetch(`/api/requests/${solicitud.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        estado: 'aprobada',
        cantidad_aprobada: cantidadAprobada,
        administrador: userData.usuario,
        observaciones_admin: observacionesAdmin,
        fecha_aprobacion: new Date().toISOString()
      }),
    });

    if (!updateRequestResponse.ok) {
      throw new Error('Error al actualizar la solicitud');
    }

    // 4. Mostrar mensaje de éxito con información del stock
    let mensaje = `Salida registrada con éxito\n\n` +
                 `Producto: ${solicitud.producto_nombre}\n` +
                 `Código: ${solicitud.producto_codigo}\n` +
                 `Cantidad entregada: ${cantidadAprobada}\n` +
                 `Stock anterior: ${stockAnterior}\n` +
                 `Stock actual: ${productoActualizado.stock_actual || productoActualizado.stock}`;

    // 5. Verificar punto de reorden
    const puntoReorden = productoActualizado.punto_reorden || 2;
    const stockActual = productoActualizado.stock_actual || productoActualizado.stock;
    
    if (stockActual <= puntoReorden) {
      mensaje += `\n\n⚠️ ALERTA: El producto está en o por debajo del punto de reorden (${puntoReorden}).\n¡Es necesario solicitar más inventario!`;
    }

    alert(mensaje);
    
    // 6. Recargar datos
    await loadProducts();

  } catch (error) {
    console.error('Error al procesar la solicitud:', error);
    alert(`Error: ${error.message}`);
  }
};

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Panel de Administración
              </h1>
              <p className="text-gray-600">Bienvenido, {user.usuario}</p>
            </div>

            <div className='flex items-center space-x-4'>
              <NotificationBell onShowAlerts={handleShowAlerts}/>
              <Link href="/register" className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md">Registro</Link>
              <button 
                onClick={() => setShowExcelUpload(true)} 
                className="bg-gray-600 hover:bg-gray-900 text-white px-4 py-2 rounded-md"
              >
                Cargar Excel
              </button>
              <button onClick={handleCreateProduct} className='bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md'>Nuevo Producto</button>
              <button onClick={handleLogout} className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md">Cerrar sesión</button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-8xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0 space-y-6">
          {error && (
            <div className={`mb-4 px-4 py-3 rounded ${
              error.includes('✅') || error.includes('¡Éxito!') 
                ? 'bg-green-100 border border-green-400 text-green-700'
                : 'bg-red-100 border border-red-400 text-red-700'
            }`}>
              {error}
            </div>
          )}

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">
                Carga Masiva desde Excel
              </h2>
              <button
                onClick={() => setShowExcelUpload(true)}
                className="bg-gray-700 hover:bg-gray-900 text-white px-4 py-2 rounded-md"
              >
                Subir Archivo Excel
              </button>
            </div>
            
            <div className="text-sm text-gray-600 space-y-2">
              <p><strong>Formato requerido:</strong> Código, Producto, Descripción, Observaciones, Punto Reorden, Stock</p>
              <p><strong>Columnas obligatorias:</strong> Código, Producto</p>
              <p><strong>Formatos soportados:</strong> .xlsx, .xls, .csv</p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">
                Gestión de Productos ({products.length})
              </h2>
              <div className="flex space-x-2">
                <button 
                  onClick={() => setShowExcelUpload(true)}
                  className="bg-gray-600 hover:bg-gray-900 text-white px-3 py-1 rounded-md text-sm"
                >
                  Cargar Excel
                </button>
                <button 
                  onClick={handleCreateProduct}
                  className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-md text-sm"
                >
                  + Producto
                </button>
              </div>
            </div>

            {loading ? (
              <div className='flex justify-center items-center h-32'>
                <div className='text-xl'>Cargando productos...</div>
              </div>
            ) : (
              <ProductTable 
                products={products} 
                onEdit={handleEditProduct} 
                onDelete={handleDeleteProduct}
                onAddStock={handleAddStock}
                userType="admin"
              />
            )}
          </div>
        </div>
      </main>

      {/* MODALES */}
      {showProductForm && (
        <ProductForm 
          product={editingProduct} 
          onSave={handleSaveProduct} 
          onCancel={handleCancelProduct}
        />
      )}

      {showExcelUpload && (
        <ExcelUpload 
          onProductsLoaded={handleProductsFromExcel} 
          onClose={() => setShowExcelUpload(false)}
        />
      )}

      {/* Modal para agregar stock - IMPORTANTE: debe estar aquí */}
      {showAddStockModal && stockProduct && (
        <AddStockModal 
          product={stockProduct}
          onSave={handleSaveStock}
          onCancel={handleCancelStock}
        />
      )}

      {showAlertModal && (
        <AlertModal onClose={() => setShowAlertModal(false)} onApproveRequest={handleApproveRequest}/>
      )}
    </div>
  );
}