import { readData, writeData } from '@/lib/data';
import { verifyToken } from '@/lib/auth';

// PUT - Actualizar producto
export async function PUT(request, { params }) {
  try {
    // Desempaquetar los params
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

    const productData = await request.json();
    const products = readData('products.json');
    const productId = parseInt(id);
    
    const productIndex = products.findIndex(p => p.id === productId);
    if (productIndex === -1) {
      return Response.json({ error: 'Producto no encontrado' }, { status: 404 });
    }

    // Actualizar producto
    products[productIndex] = {
      ...products[productIndex],
      ...productData,
      id: productId // Mantener el ID original
    };

    writeData('products.json', products);

    return Response.json(products[productIndex]);
  } catch (error) {
    return Response.json(
      { error: 'Error al actualizar producto' },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar producto
export async function DELETE(request, { params }) {
  try {
    // Desempaquetar los params
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

    const products = readData('products.json');
    const productId = parseInt(id);
    
    const productIndex = products.findIndex(p => p.id === productId);
    if (productIndex === -1) {
      return Response.json({ error: 'Producto no encontrado' }, { status: 404 });
    }

    // Eliminar producto
    products.splice(productIndex, 1);
    writeData('products.json', products);

    return Response.json({ message: 'Producto eliminado correctamente' });
  } catch (error) {
    return Response.json(
      { error: 'Error al eliminar producto' },
      { status: 500 }
    );
  }
}