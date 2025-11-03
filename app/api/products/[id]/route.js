import { readData, writeData } from '@/lib/data';
import { verifyToken } from '@/lib/auth';

// GET - Obtener producto por ID
export async function GET(request, { params }) {
  try {
    // ✅ CORREGIDO: await params
    const { id } = await params;
    
    const products = readData('products.json') || [];
    const product = products.find(p => p.id === parseInt(id));
    
    if (!product) {
      return Response.json({ error: 'Producto no encontrado' }, { status: 404 });
    }

    return Response.json(product);
  } catch (error) {
    console.error('Error en GET /api/products/[id]:', error);
    return Response.json(
      { error: 'Error al obtener producto' },
      { status: 500 }
    );
  }
}

// PUT - Actualizar producto (stock)
export async function PUT(request, { params }) {
  try {
    // ✅ CORREGIDO: await params
    const { id } = await params;
    
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return Response.json({ error: 'No autorizado' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = verifyToken(token);
    
    if (!decoded || decoded.tipo !== 'admin') {
      return Response.json({ error: 'No tiene permisos' }, { status: 403 });
    }

    const { operacion, cantidad, observaciones } = await request.json();
    
    if (!operacion || !cantidad) {
      return Response.json(
        { error: 'Operación y cantidad son requeridas' },
        { status: 400 }
      );
    }

    // Obtener productos
    const products = readData('products.json') || [];
    const productIndex = products.findIndex(p => p.id === parseInt(id));
    
    if (productIndex === -1) {
      return Response.json({ error: 'Producto no encontrado' }, { status: 404 });
    }

    const producto = products[productIndex];
    const stockAnterior = producto.stock || 0;
    let nuevoStock;

    // Actualizar stock según la operación
    if (operacion === 'salida') {
      nuevoStock = stockAnterior - cantidad;
    } else if (operacion === 'entrada') {
      nuevoStock = stockAnterior + cantidad;
    } else {
      return Response.json({ error: 'Operación no válida' }, { status: 400 });
    }

    // Validar que el stock no sea negativo
    if (nuevoStock < 0) {
      return Response.json(
        { error: `Stock insuficiente. Stock disponible: ${stockAnterior}, solicitado: ${cantidad}` },
        { status: 400 }
      );
    }

    // Actualizar producto
    products[productIndex] = {
      ...producto,
      stock: nuevoStock
    };

    writeData('products.json', products);

    // Registrar movimiento
    try {
      const movements = readData('movements.json') || [];
      const newMovement = {
        id: movements.length > 0 ? Math.max(...movements.map(m => m.id)) + 1 : 1,
        producto_id: producto.id,
        producto_codigo: producto.codigo,
        producto_nombre: producto.producto,
        tipo: operacion,
        cantidad: cantidad,
        stock_anterior: stockAnterior,
        stock_actual: nuevoStock,
        observaciones: observaciones || `Operación: ${operacion}`,
        usuario: decoded.usuario,
        fecha: new Date().toISOString()
      };
      
      movements.push(newMovement);
      writeData('movements.json', movements);
    } catch (error) {
      console.error('Error registrando movimiento:', error);
    }

    return Response.json({
      ...products[productIndex],
      stock_anterior: stockAnterior,
      stock_actual: nuevoStock,
      message: `Stock actualizado correctamente. ${operacion === 'salida' ? 'Descontado' : 'Agregado'}: ${cantidad} unidades`
    });

  } catch (error) {
    console.error('Error en PUT /api/products/[id]:', error);
    return Response.json(
      { error: 'Error al actualizar producto' },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar producto
export async function DELETE(request, { params }) {
  try {
    // ✅ CORREGIDO: await params
    const { id } = await params;
    
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return Response.json({ error: 'No autorizado' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = verifyToken(token);
    
    if (!decoded || decoded.tipo !== 'admin') {
      return Response.json({ error: 'No tiene permisos' }, { status: 403 });
    }

    const products = readData('products.json') || [];
    const productId = parseInt(id);
    
    const productIndex = products.findIndex(p => p.id === productId);
    if (productIndex === -1) {
      return Response.json({ error: 'Producto no encontrado' }, { status: 404 });
    }

    // Eliminar producto
    products.splice(productIndex, 1);
    writeData('products.json', products);

    return Response.json({ message: 'Producto eliminado correctamente' });
  } catch (error) {
    console.error('Error en DELETE /api/products/[id]:', error);
    return Response.json(
      { error: 'Error al eliminar producto' },
      { status: 500 }
    );
  }
}