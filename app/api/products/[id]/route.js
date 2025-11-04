import { readData, writeData } from '@/lib/data';
import { verifyToken } from '@/lib/auth';

// PUT - Actualizar stock de producto
export async function PUT(request, { params }) {
  try {
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
    const products = await readData('products.json');
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

    await writeData('products.json', products);

    // Registrar movimiento
    const movements = await readData('movements.json');
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
    await writeData('movements.json', movements);

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