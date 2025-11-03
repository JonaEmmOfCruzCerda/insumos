import { readData, writeData } from '@/lib/data';
import { verifyToken } from '@/lib/auth';

// PUT - Actualizar solicitud (aprobación/rechazo)
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

    const updateData = await request.json();
    
    // Leer solicitudes
    const requests = readData('requests.json') || [];
    const requestIndex = requests.findIndex(r => r.id === parseInt(id));
    
    if (requestIndex === -1) {
      return Response.json({ error: 'Solicitud no encontrada' }, { status: 404 });
    }

    // Actualizar solicitud
    requests[requestIndex] = {
      ...requests[requestIndex],
      ...updateData,
      fecha_respuesta: new Date().toISOString()
    };

    writeData('requests.json', requests);

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