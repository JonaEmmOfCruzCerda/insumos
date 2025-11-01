import { readData, writeData } from "@/lib/data";
import { verifyToken } from "@/lib/auth";

// Función para generar el siguiente código
function generarSiguienteCodigo(products) {
  if (products.length === 0) {
    return 'PROD-001';
  }
  
  // Encontrar el código más alto numéricamente
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
  
  const nuevoNumero = maxNumber + 1;
  return `PROD-${nuevoNumero.toString().padStart(3, '0')}`;
}

// Get - Para obtener los productos
export async function GET(request) {
    try {
        const productos = readData('products.json');
        return Response.json(productos);
    } catch (error) {
        return Response.json(
            {error: 'Error al obtener los productos'},
            {status: 500}
        );
    }
}

// Post - Crear nuevo producto
export async function POST(request) {
    try {
        const authHeader = request.headers.get('authorization');
        if (!authHeader) {
            return Response.json({error: 'No autorizado'}, {status: 401});
        }

        const token = authHeader.replace('Bearer ', '');
        const decoded = verifyToken(token);

        if (!decoded || decoded.tipo !== 'admin') {
            return Response.json({error: 'No tiene permisos'}, {status: 403});
        }

        const productData = await request.json();
        const products = readData('products.json');

        // Validaciones
        if (!productData.producto) {
            return Response.json(
                {error: 'El nombre del producto es requerido'},
                {status: 400}
            )
        }

        // Generar código automáticamente
        const nuevoCodigo = generarSiguienteCodigo(products);

        // Crear nuevo producto
        const newProduct = {
            id: products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1,
            codigo: nuevoCodigo, // ← Código generado automáticamente (PROD-345, PROD-346, etc.)
            producto: productData.producto,
            descripcion: productData.descripcion || '',
            observaciones: productData.observaciones || '',
            punto_reorden: productData.punto_reorden || 2,
            stock: productData.stock || 0,
            solicitar: false,
            fecha_creacion: new Date().toISOString()
        };

        products.push(newProduct);
        writeData('products.json', products);

        return Response.json(newProduct, {status: 201});
    } catch (error) {
        return Response.json(
            {error: 'Error al crear el producto'},
            {status: 500}
        );
    }
}