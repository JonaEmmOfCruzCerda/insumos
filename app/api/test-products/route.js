import { readData } from '@/lib/data';

export async function GET() {
  try {
    console.log('🧪 Iniciando test de productos...');
    
    const products = await readData('products.json');
    
    const result = {
      success: true,
      products_count: products.length,
      sample_product: products[0] || 'No hay productos',
      timestamp: new Date().toISOString()
    };

    console.log('✅ Test de productos:', result);
    
    return Response.json(result);
  } catch (error) {
    console.error('❌ ERROR en test de productos:', error);
    
    return Response.json({
      success: false,
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}