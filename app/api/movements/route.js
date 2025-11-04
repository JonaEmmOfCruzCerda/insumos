import { readData } from '@/lib/data';
import { verifyToken } from '@/lib/auth';

// GET - Obtener historial de movimientos
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

    const movements = await readData('movements.json');
    return Response.json(movements);
  } catch (error) {
    console.error('Error en GET /api/movements:', error);
    return Response.json(
      { error: 'Error al obtener movimientos' },
      { status: 500 }
    );
  }
}