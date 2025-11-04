import { readData, writeData } from '@/lib/data';
import { verifyToken } from '@/lib/auth';

// GET - Obtener todas las solicitudes (admin)
export async function GET(request) {
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

    const requests = await readData('requests.json');
    return Response.json(requests);
  } catch (error) {
    console.error('Error en GET /api/requests:', error);
    return Response.json(
      { error: 'Error al obtener solicitudes' },
      { status: 500 }
    );
  }
}

// POST - Crear nueva solicitud (operadores)
export async function POST(request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return Response.json({ error: 'No autorizado' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return Response.json({ error: 'Token inválido' }, { status: 403 });
    }

    const requestData = await request.json();
    
    // Validaciones
    if (!requestData.producto_codigo) {
      return Response.json(
        { error: 'Código de producto es requerido' },
        { status: 400 }
      );
    }

    // Verificar que el producto exista
    const products = await readData('products.json');
    const product = products.find(p => p.codigo === requestData.producto_codigo);
    
    if (!product) {
      return Response.json(
        { error: 'Producto no encontrado' },
        { status: 404 }
      );
    }

    // Leer y crear solicitud
    const requests = await readData('requests.json');
    
    const newRequest = {
      id: requests.length > 0 ? Math.max(...requests.map(r => r.id)) + 1 : 1,
      producto_id: product.id,
      producto_codigo: product.codigo,
      producto_nombre: product.producto,
      cantidad_solicitada: requestData.cantidad_solicitada || 1,
      observaciones: requestData.observaciones || '',
      operador: decoded.usuario,
      operador_id: decoded.id,
      estado: 'pendiente',
      fecha_solicitud: new Date().toISOString(),
      fecha_respuesta: null,
      administrador: null,
      observaciones_admin: null,
      cantidad_aprobada: null
    };

    requests.push(newRequest);
    await writeData('requests.json', requests);

    return Response.json({
      message: 'Solicitud enviada correctamente',
      request: newRequest
    }, { status: 201 });

  } catch (error) {
    console.error('Error en POST /api/requests:', error);
    return Response.json(
      { error: 'Error al crear solicitud' },
      { status: 500 }
    );
  }
}