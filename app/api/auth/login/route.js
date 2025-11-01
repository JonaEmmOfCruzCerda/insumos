import { authenticateUser } from '@/lib/auth';

export async function POST(request) {
  try {
    const { usuario, password } = await request.json();

    if (!usuario || !password) {
      return Response.json(
        { error: 'Usuario y contraseña son requeridos' },
        { status: 400 }
      );
    }

    const result = await authenticateUser(usuario, password);
    
    return Response.json(result);
  } catch (error) {
    return Response.json(
      { error: error.message },
      { status: 401 }
    );
  }
}