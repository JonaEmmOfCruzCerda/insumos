import { readData } from '@/lib/data';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const codigo = searchParams.get('codigo');
    
    const products = readData('products.json');
    
    console.log('🔍 Búsqueda de producto con código:', codigo);
    console.log('📊 Productos disponibles:', products.map(p => p.codigo));
    
    // Si se proporciona un código, filtrar por él
    if (codigo) {
      const producto = products.find(p => {
        if (!p.codigo) return false;
        
        // Comparación case-insensitive y sin espacios
        const codigoProducto = p.codigo.toString().toUpperCase().trim();
        const codigoBusqueda = codigo.toUpperCase().trim();
        
        console.log('Comparando:', codigoProducto, 'con', codigoBusqueda);
        
        return codigoProducto === codigoBusqueda;
      });
      
      console.log('🎯 Producto encontrado:', producto ? 'SÍ' : 'NO');
      
      if (!producto) {
        return Response.json([], { status: 200 });
      }
      return Response.json([producto]);
    }
    
    // Si no hay código, devolver todos los productos
    return Response.json(products);
  } catch (error) {
    console.error('❌ Error en GET /api/products:', error);
    return Response.json(
      { error: 'Error al obtener productos' },
      { status: 500 }
    );
  }
}