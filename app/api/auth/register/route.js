import { registerUser } from '@/lib/auth';

export async function POST(request) {
  try {
    const { usuario, password, tipo } = await request.json();

    if (!usuario || !password) {
      return Response.json(
        { error: 'Usuario y contraseña son requeridos' },
        { status: 400 }
      );
    }

    const newUser = await registerUser({
      usuario,
      password,
      tipo: tipo || 'operador'
    });
    
    return Response.json({ 
      message: 'Usuario registrado exitosamente',
      user: newUser 
    });
  } catch (error) {
    return Response.json(
      { error: error.message },
      { status: 400 }
    );
  }
}