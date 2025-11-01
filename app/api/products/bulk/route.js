import { readData, writeData } from '@/lib/data';
import { verifyToken } from '@/lib/auth';

// Función para generar el siguiente código (la misma que arriba)
function generarSiguienteCodigo(products) {
  if (products.length === 0) {
    return 'PROD-001';
  }
  
  let maxNumber = 0;
  
  products.forEach(product => {
    const match = product.codigo.match(/PROD-(\d+)/);
    if (match) {
      const number = parseInt(match[1]);
      if (number > maxNumber) {
        maxNumber = number;
      }
    }
  });
  
  return maxNumber;
}

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

    const productsData = await request.json();
    
    if (!Array.isArray(productsData)) {
      return Response.json(
        { error: 'Se esperaba un array de productos' },
        { status: 400 }
      );
    }

    const products = readData('products.json');
    const results = {
      success: 0,
      errors: [],
      total: productsData.length
    };

    // Obtener el último número de código
    let ultimoNumero = generarSiguienteCodigo(products);

    for (const productData of productsData) {
      try {
        // Validaciones
        if (!productData.producto) {
          results.errors.push(`Producto sin nombre: ${JSON.stringify(productData)}`);
          continue;
        }

        // Generar código automáticamente
        ultimoNumero++;
        const nuevoCodigo = `PROD-${ultimoNumero.toString().padStart(3, '0')}`;

        // Crear nuevo producto
        const newProduct = {
          id: products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1,
          codigo: nuevoCodigo, // ← Código generado automáticamente
          producto: productData.producto,
          descripcion: productData.descripcion || '',
          observaciones: productData.observaciones || '',
          punto_reorden: productData.punto_reorden || 2,
          stock: productData.stock || 0,
          solicitar: false,
          fecha_creacion: new Date().toISOString()
        };

        products.push(newProduct);
        results.success++;

      } catch (error) {
        results.errors.push(`Error con producto: ${error.message}`);
      }
    }

    // Guardar todos los productos exitosos
    if (results.success > 0) {
      writeData('products.json', products);
    }

    return Response.json(results);

  } catch (error) {
    return Response.json(
      { error: 'Error al procesar carga masiva' },
      { status: 500 }
    );
  }
}