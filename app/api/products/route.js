import { readData, writeData } from '@/lib/data';
import { verifyToken } from '@/lib/auth';

// GET - Obtener productos
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const codigo = searchParams.get('codigo');
    
    const products = await readData('products.json');

    if (codigo) {
      const producto = products.find(p => 
        p.codigo && p.codigo.toString().toUpperCase() === codigo.toUpperCase()
      );
      return Response.json(producto ? [producto] : []);
    }

    return Response.json(products);

  } catch (error) {
    console.error('Error en GET /api/products:', error);
    return Response.json({ error: 'Error al obtener productos' }, { status: 500 });
  }
}

// POST - Crear nuevo producto
export async function POST(request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return Response.json({ error: 'No autorizado' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = verifyToken(token);
    
    if (!decoded || decoded.tipo !== 'admin') {
      return Response.json({ error: 'No tiene permisos' }, { status: 403 });
    }

    const productData = await request.json();
    
    // Validaciones
    if (!productData.codigo || !productData.producto) {
      return Response.json(
        { error: 'Código y nombre del producto son requeridos' },
        { status: 400 }
      );
    }

    const products = await readData('products.json');
    
    // Verificar que el código no exista
    const existingProduct = products.find(p => p.codigo === productData.codigo);
    if (existingProduct) {
      return Response.json(
        { error: 'Ya existe un producto con este código' },
        { status: 409 }
      );
    }

    // Crear nuevo producto
    const newProduct = {
      id: products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1,
      codigo: productData.codigo,
      producto: productData.producto,
      descripcion: productData.descripcion || '',
      stock: productData.stock || 0,
      punto_reorden: productData.punto_reorden || 2,
      observaciones: productData.observaciones || '',
      fecha_creacion: new Date().toISOString()
    };

    products.push(newProduct);
    
    // Guardar
    const success = await writeData('products.json', products);
    if (!success) {
      throw new Error('Error al guardar producto');
    }

    // Registrar movimiento si hay stock inicial
    if (newProduct.stock > 0) {
      const movements = await readData('movements.json');
      movements.push({
        id: movements.length > 0 ? Math.max(...movements.map(m => m.id)) + 1 : 1,
        producto_id: newProduct.id,
        producto_codigo: newProduct.codigo,
        producto_nombre: newProduct.producto,
        tipo: 'entrada',
        cantidad: newProduct.stock,
        stock_anterior: 0,
        stock_actual: newProduct.stock,
        observaciones: 'Producto creado con stock inicial',
        usuario: decoded.usuario,
        fecha: new Date().toISOString()
      });
      await writeData('movements.json', movements);
    }

    return Response.json({
      message: 'Producto creado correctamente',
      product: newProduct
    }, { status: 201 });

  } catch (error) {
    console.error('Error en POST /api/products:', error);
    return Response.json(
      { error: 'Error al crear producto' },
      { status: 500 }
    );
  }
}