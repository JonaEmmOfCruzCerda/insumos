import { readData, writeData } from '@/lib/data';
import { verifyToken } from '@/lib/auth';

// GET - Obtener todas las solicitudes (para admin)
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

    const requests = readData('requests.json');
    return Response.json(requests);
  } catch (error) {
    return Response.json(
      { error: 'Error al obtener solicitudes' },
      { status: 500 }
    );
  }
}

// POST - Crear nueva solicitud (para operadores)
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

    const requestData = await request.json();
    
    // Validaciones
    if (!requestData.producto_codigo) {
      return Response.json(
        { error: 'Código de producto es requerido' },
        { status: 400 }
      );
    }

    // Verificar que el producto exista
    const products = readData('products.json');
    const product = products.find(p => p.codigo === requestData.producto_codigo);
    
    if (!product) {
      return Response.json(
        { error: 'Producto no encontrado' },
        { status: 404 }
      );
    }

    // Leer y crear solicitud
    const requests = readData('requests.json');
    
    const newRequest = {
      id: requests.length > 0 ? Math.max(...requests.map(r => r.id)) + 1 : 1,
      producto_id: product.id,
      producto_codigo: requestData.producto_codigo,
      producto_nombre: product.producto,
      operador: requestData.operador,
      estado: 'pendiente', // pendiente, aprobada, rechazada
      fecha_solicitud: new Date().toISOString(),
      fecha_respuesta: null,
      administrador: null,
      observaciones: null
    };

    requests.push(newRequest);
    writeData('requests.json', requests);

    return Response.json({
      message: 'Solicitud enviada correctamente',
      request: newRequest
    });

  } catch (error) {
    return Response.json(
      { error: 'Error al crear solicitud' },
      { status: 500 }
    );
  }
}