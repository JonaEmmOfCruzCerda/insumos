import { readData } from '@/lib/data';

export async function GET(request) {
  try {
    console.log('🔍 Iniciando GET /api/products');
    
    const { searchParams } = new URL(request.url);
    const codigo = searchParams.get('codigo');
    
    console.log('📋 Parámetros de búsqueda:', { codigo });

    // Leer productos
    const products = await readData('products.json');
    console.log('📦 Productos cargados:', products.length);

    // Si se proporciona un código, filtrar por él
    if (codigo) {
      console.log('🔍 Buscando producto con código:', codigo);
      const producto = products.find(p => {
        if (!p.codigo) return false;
        const codigoProducto = p.codigo.toString().toUpperCase().trim();
        const codigoBusqueda = codigo.toUpperCase().trim();
        return codigoProducto === codigoBusqueda;
      });
      
      console.log('🎯 Resultado de búsqueda:', producto ? 'Encontrado' : 'No encontrado');
      
      if (!producto) {
        return Response.json([], { status: 200 });
      }
      return Response.json([producto]);
    }
    
    // Si no hay código, devolver todos los productos
    console.log('✅ Devolviendo todos los productos:', products.length);
    return Response.json(products);

  } catch (error) {
    console.error('❌ ERROR en GET /api/products:', error);
    console.error('📝 Stack trace:', error.stack);
    
    return Response.json(
      { 
        error: 'Error interno del servidor',
        message: error.message,
        // Solo en desarrollo mostrar detalles
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
      },
      { status: 500 }
    );
  }
}