import { readData, writeData } from '@/lib/data';
import { verifyToken } from '@/lib/auth';

// PUT - Aprobar/Rechazar solicitud
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

    const updateData = await request.json();
    
    // Leer solicitudes
    const requests = await readData('requests.json');
    const requestIndex = requests.findIndex(r => r.id === parseInt(id));
    
    if (requestIndex === -1) {
      return Response.json({ error: 'Solicitud no encontrada' }, { status: 404 });
    }

    const solicitud = requests[requestIndex];

    // Si se está aprobando, actualizar stock
    if (updateData.estado === 'aprobada' && updateData.cantidad_aprobada) {
      // Actualizar stock del producto
      const products = await readData('products.json');
      const productIndex = products.findIndex(p => p.id === solicitud.producto_id);
      
      if (productIndex === -1) {
        return Response.json({ error: 'Producto no encontrado' }, { status: 404 });
      }

      const producto = products[productIndex];
      const stockAnterior = producto.stock;
      const nuevoStock = stockAnterior - updateData.cantidad_aprobada;

      // Validar stock suficiente
      if (nuevoStock < 0) {
        return Response.json(
          { error: `Stock insuficiente. Stock disponible: ${stockAnterior}, solicitado: ${updateData.cantidad_aprobada}` },
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
      movements.push({
        id: movements.length > 0 ? Math.max(...movements.map(m => m.id)) + 1 : 1,
        producto_id: producto.id,
        producto_codigo: producto.codigo,
        producto_nombre: producto.producto,
        tipo: 'salida',
        cantidad: updateData.cantidad_aprobada,
        stock_anterior: stockAnterior,
        stock_actual: nuevoStock,
        observaciones: `Solicitud aprobada - ID: ${solicitud.id}`,
        usuario: decoded.usuario,
        fecha: new Date().toISOString()
      });
      await writeData('movements.json', movements);
    }

    // Actualizar solicitud
    requests[requestIndex] = {
      ...solicitud,
      ...updateData,
      fecha_respuesta: new Date().toISOString(),
      administrador: decoded.usuario
    };

    await writeData('requests.json', requests);

    return Response.json({
      message: 'Solicitud actualizada correctamente',
      request: requests[requestIndex]
    });

  } catch (error) {
    console.error('Error en PUT /api/requests/[id]:', error);
    return Response.json(
      { error: 'Error al actualizar solicitud' },
      { status: 500 }
    );
  }
}