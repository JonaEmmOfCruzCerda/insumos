'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import OperatorProductTable from '@/components/OperatorProductTable';
import RequestProductModal from '@/components/RequestProductModal';

export default function OperatorDashboard() {
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (!token || !userData) {
      router.push('/');
      return;
    }

    const parsedUser = JSON.parse(userData);
    if (parsedUser.tipo !== 'operador') {
      router.push('/admin/dashboard');
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

  const handleRequestProduct = () => {
    setShowRequestModal(true);
  };

  const handleCancelRequest = () => {
    setShowRequestModal(false);
  };

  // ✅ ESTA ES LA FUNCIÓN CORRECTA
  const handleSaveRequest = async (solicitudData) => {
    try {
      const token = localStorage.getItem('token');
      const userData = JSON.parse(localStorage.getItem('user'));

      console.log('🔄 ===== INICIO handleSaveRequest =====');
      console.log('📦 solicitudData recibida del modal:', solicitudData);

      // Extraer datos correctamente del modal
      const codigoBuscado = solicitudData.codigo;
      const cantidadSolicitada = solicitudData.cantidad;
      const observaciones = solicitudData.observaciones || '';

      console.log('📋 Datos extraídos del modal:', {
        codigoBuscado,
        cantidadSolicitada, 
        observaciones
      });

      // Validaciones
      if (!codigoBuscado) {
        alert('Por favor ingresa un código de producto válido');
        return;
      }

      if (!cantidadSolicitada || cantidadSolicitada <= 0) {
        alert('La cantidad debe ser mayor a 0');
        return;
      }

      console.log('🔍 Buscando producto con código:', codigoBuscado);

      // Buscar producto
      const searchResponse = await fetch(`/api/products?codigo=${encodeURIComponent(codigoBuscado)}`);
      
      if (!searchResponse.ok) {
        alert('❌ Error al buscar producto en el servidor');
        return;
      }

      const productosEncontrados = await searchResponse.json();
      console.log('📦 Resultado de búsqueda:', productosEncontrados);

      if (!Array.isArray(productosEncontrados) || productosEncontrados.length === 0) {
        alert(`❌ Producto no encontrado. Código: ${codigoBuscado}`);
        return;
      }

      const producto = productosEncontrados[0];
      console.log('✅ Producto encontrado:', producto);

      // ✅ Estructura CORRECTA para el backend
      const requestData = {
        producto_codigo: producto.codigo,
        cantidad_solicitada: Number(cantidadSolicitada),
        observaciones: observaciones,
        operador: userData.usuario
      };

      console.log('📤 Enviando al backend (ESTRUCTURA CORREGIDA):', requestData);

      const response = await fetch('/api/requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(requestData),
      });

      const responseData = await response.json();

      if (response.ok) {
        setSuccess(`✅ Solicitud enviada correctamente por ${cantidadSolicitada} unidades`);
        setShowRequestModal(false);
        setTimeout(() => setSuccess(''), 5000);
      } else {
        setError(`❌ Error: ${responseData.error}`);
        setTimeout(() => setError(''), 5000);
      }

    } catch (error) {
      console.error('❌ Error completo en handleSaveRequest:', error);
      setError('❌ Error de conexión al enviar solicitud');
      setTimeout(() => setError(''), 5000);
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
                Panel de Operador
              </h1>
              <p className="text-gray-600">Bienvenido, {user.usuario}</p>
            </div>

            <div className='flex items-center space-x-4'>
              <button 
                onClick={handleRequestProduct}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
              >
                Solicitar Producto
              </button>
              <button 
                onClick={handleLogout} 
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md transition-colors"
              >
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {success && (
            <div className="mb-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
              {success}
            </div>
          )}
          
          {error && (
            <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">
                Inventario de Productos ({products.length})
              </h2>
              <button 
                onClick={handleRequestProduct}
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md text-sm transition-colors"
              >
                Solicitar Producto
              </button>
            </div>

            {loading ? (
              <div className='flex justify-center items-center h-32'>
                <div className='text-xl'>Cargando productos...</div>
              </div>
            ) : (
              <OperatorProductTable 
                products={products}
                onRequestProduct={handleRequestProduct}
              />
            )}
          </div>
        </div>
      </main>

      {/* ✅ CORREGIDO: Usa handleSaveRequest en lugar de handleSubmitRequest */}
      {showRequestModal && (
        <RequestProductModal 
          onSave={handleSaveRequest}
          onCancel={handleCancelRequest}
        />
      )}
    </div>
  );
}