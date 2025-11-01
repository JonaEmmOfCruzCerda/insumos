import { readData, writeData } from '@/lib/data';
import { verifyToken } from '@/lib/auth';

export async function POST(request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return Response.json({ error: 'No autorizado' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return Response.json({ error: 'No tiene permisos' }, { status: 403 });
    }

    const movementData = await request.json();
    
    // Validaciones
    if (!movementData.producto_id || !movementData.tipo || !movementData.cantidad) {
      return Response.json(
        { error: 'Datos incompletos' },
        { status: 400 }
      );
    }

    if (movementData.tipo !== 'entrada' && movementData.tipo !== 'salida') {
      return Response.json(
        { error: 'Tipo de movimiento inválido' },
        { status: 400 }
      );
    }

    // Leer datos
    const products = readData('products.json');
    const movements = readData('movements.json');

    // Encontrar el producto
    const productIndex = products.findIndex(p => p.id === movementData.producto_id);
    if (productIndex === -1) {
      return Response.json({ error: 'Producto no encontrado' }, { status: 404 });
    }

    const product = products[productIndex];

    // Validar stock para salidas
    if (movementData.tipo === 'salida' && movementData.cantidad > product.stock) {
      return Response.json(
        { error: 'Stock insuficiente' },
        { status: 400 }
      );
    }

    // Calcular nuevo stock
    const stockAnterior = product.stock;
    let stockActual;
    
    if (movementData.tipo === 'entrada') {
      stockActual = product.stock + movementData.cantidad;
    } else {
      stockActual = product.stock - movementData.cantidad;
    }

    // Actualizar producto
    products[productIndex].stock = stockActual;
    
    // Actualizar campo "solicitar" basado en el nuevo stock
    // Si el stock es menor o igual al punto de reorden, activar solicitud
    // Si el stock es mayor al punto de reorden, desactivar solicitud
    products[productIndex].solicitar = stockActual <= product.punto_reorden;

    // Crear registro de movimiento
    const newMovement = {
      id: movements.length > 0 ? Math.max(...movements.map(m => m.id)) + 1 : 1,
      producto_id: movementData.producto_id,
      tipo: movementData.tipo,
      cantidad: movementData.cantidad,
      stock_anterior: stockAnterior,
      stock_actual: stockActual,
      usuario: decoded.usuario,
      fecha: new Date().toISOString(),
      // Incluir información del producto para referencia
      producto_codigo: product.codigo,
      producto_nombre: product.producto,
      punto_reorden: product.punto_reorden,
      solicitar_activado: products[productIndex].solicitar
    };

    movements.push(newMovement);

    // Guardar cambios
    writeData('products.json', products);
    writeData('movements.json', movements);

    return Response.json({
      message: 'Movimiento registrado exitosamente',
      movement: newMovement,
      product: products[productIndex]
    });

  } catch (error) {
    return Response.json(
      { error: 'Error al registrar movimiento' },
      { status: 500 }
    );
  }
}