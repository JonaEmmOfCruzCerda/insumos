import { readData, writeData } from '@/lib/data';
import { verifyToken } from '@/lib/auth';

// POST - Crear nueva solicitud (para operadores)
export async function POST(request) {
  try {
    console.log('📨 ===== INICIO POST /api/requests =====');
    
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      console.log('❌ No hay autorización');
      return Response.json({ error: 'No autorizado' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = verifyToken(token);
    
    if (!decoded) {
      console.log('❌ Token inválido');
      return Response.json({ error: 'Token inválido' }, { status: 403 });
    }

    const requestData = await request.json();
    console.log('📝 Datos recibidos en backend (RAW):', requestData);
    console.log('🔍 Estructura completa recibida:', JSON.stringify(requestData, null, 2));
    
    // ✅ CORREGIDO: Extracción robusta
    let producto_codigo = requestData.producto_codigo;
    let cantidad_solicitada = requestData.cantidad_solicitada;
    let observaciones = requestData.observaciones || '';
    let operador = requestData.operador || decoded.usuario;

    console.log('🔍 Datos extraídos inicialmente:', {
      producto_codigo,
      tipo_producto_codigo: typeof producto_codigo,
      cantidad_solicitada,
      tipo_cantidad_solicitada: typeof cantidad_solicitada,
      observaciones,
      operador
    });

    // ✅ CORREGIDO: Manejo seguro de producto_codigo
    if (producto_codigo && typeof producto_codigo === 'object') {
      console.log('⚠️ producto_codigo es objeto, extrayendo...');
      producto_codigo = producto_codigo.codigo || producto_codigo.toString();
    }

    // Asegurar que sea string
    if (producto_codigo) {
      producto_codigo = producto_codigo.toString().toUpperCase().trim();
    }

    // ✅ CORREGIDO: Manejo seguro de cantidad_solicitada
    if (cantidad_solicitada) {
      cantidad_solicitada = Number(cantidad_solicitada);
      if (isNaN(cantidad_solicitada) || cantidad_solicitada <= 0) {
        cantidad_solicitada = 1;
      }
    } else {
      cantidad_solicitada = 1;
    }

    console.log('🔍 Datos procesados:', {
      producto_codigo,
      cantidad_solicitada,
      tipo_cantidad_final: typeof cantidad_solicitada,
      observaciones,
      operador
    });

    // Validaciones finales
    if (!producto_codigo || producto_codigo === '[OBJECT OBJECT]') {
      console.log('❌ Código de producto inválido');
      return Response.json(
        { error: 'Código de producto inválido' },
        { status: 400 }
      );
    }

    // Buscar producto
    const products = readData('products.json');
    console.log('🔍 Buscando producto con código:', producto_codigo);
    
    const product = products.find(p => {
      if (!p.codigo) return false;
      const codigoProducto = p.codigo.toString().toUpperCase().trim();
      return codigoProducto === producto_codigo;
    });
    
    if (!product) {
      console.log('❌ Producto no encontrado');
      return Response.json(
        { error: `Producto no encontrado. Código: ${producto_codigo}` },
        { status: 404 }
      );
    }

    console.log('✅ Producto encontrado:', product.producto);

    // Crear solicitud
    const requests = readData('requests.json');
    
    const newRequest = {
      id: requests.length > 0 ? Math.max(...requests.map(r => r.id)) + 1 : 1,
      producto_id: product.id,
      producto_codigo: product.codigo,
      producto_nombre: product.producto,
      cantidad_solicitada: cantidad_solicitada, // ✅ Usar la cantidad procesada
      observaciones: observaciones,
      operador: operador,
      operador_id: decoded.id,
      estado: 'pendiente',
      fecha_solicitud: new Date().toISOString(),
      fecha_respuesta: null,
      administrador: null,
      observaciones_admin: null,
      cantidad_aprobada: null
    };

    console.log('💾 Guardando solicitud:', newRequest);
    console.log('🔢 cantidad_solicitada guardada:', newRequest.cantidad_solicitada);

    requests.push(newRequest);
    writeData('requests.json', requests);

    console.log('✅ Solicitud guardada exitosamente');
    console.log('======= FIN POST /api/requests =======');

    return Response.json({
      message: `Solicitud enviada correctamente por ${cantidad_solicitada} unidades`,
      request: newRequest
    }, { status: 201 });

  } catch (error) {
    console.error('❌ Error en POST /api/requests:', error);
    return Response.json(
      { error: 'Error al crear solicitud' },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    console.log('📨 GET /api/requests - Obteniendo solicitudes...');
    
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      console.log('❌ No hay token de autorización');
      return Response.json({ error: 'No autorizado' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = verifyToken(token);
    
    if (!decoded) {
      console.log('❌ Token inválido');
      return Response.json({ error: 'Token inválido' }, { status: 403 });
    }

    // Permitir tanto admin como operador para ver sus propias solicitudes
    if (decoded.tipo !== 'admin' && decoded.tipo !== 'operador') {
      console.log('❌ Usuario sin permisos:', decoded.tipo);
      return Response.json({ error: 'No tiene permisos' }, { status: 403 });
    }

    const requests = readData('requests.json');
    console.log('📋 Solicitudes encontradas:', requests.length);
    
    return Response.json(requests);
  } catch (error) {
    console.error('❌ Error en GET /api/requests:', error);
    return Response.json(
      { error: 'Error al obtener solicitudes' },
      { status: 500 }
    );
  }
}