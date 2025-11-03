import { readData, writeData } from './data.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'insumos-app-secret-key-2024';

export async function hashPassword(password) {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
}

export async function verifyPassword(password, hashedPassword) {
  return await bcrypt.compare(password, hashedPassword);
}

export async function registerUser(userData) {
  try {
    console.log('🔧 Iniciando registro para:', userData.usuario);
    
    const users = readData('users.json');
    console.log('📊 Usuarios existentes:', users.length);
    
    // Verificar si el usuario ya existe
    const existingUser = users.find(u => u.usuario === userData.usuario);
    if (existingUser) {
      console.log('❌ Usuario ya existe:', userData.usuario);
      throw new Error('El usuario ya existe');
    }
    
    // Hashear contraseña
    console.log('🔐 Hasheando contraseña...');
    const hashedPassword = await hashPassword(userData.password);
    
    // Crear nuevo usuario
    const newUser = {
      id: users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1,
      usuario: userData.usuario,
      password: hashedPassword,
      tipo: userData.tipo || 'operador',
      fecha_creacion: new Date().toISOString()
    };
    
    console.log('👤 Nuevo usuario creado:', newUser.usuario);
    
    users.push(newUser);
    
    // Guardar en archivo
    console.log('💾 Intentando guardar usuario...');
    const success = writeData('users.json', users);
    
    if (!success) {
      console.log('❌ Error al guardar usuario');
      throw new Error('Error al guardar el usuario');
    }
    
    console.log('✅ Usuario guardado exitosamente');
    
    // Verificar que se guardó
    const usersAfterSave = readData('users.json');
    console.log('📊 Usuarios después de guardar:', usersAfterSave.length);
    
    return {
      id: newUser.id,
      usuario: newUser.usuario,
      tipo: newUser.tipo
    };
  } catch (error) {
    console.error('❌ Error completo en registerUser:', error);
    throw error;
  }
}

export async function authenticateUser(usuario, password) {
  try {
    console.log('🔧 Autenticando usuario:', usuario);
    
    const users = readData('users.json');
    console.log('📊 Total de usuarios:', users.length);
    
    const user = users.find(u => u.usuario === usuario);
    
    if (!user) {
      console.log('❌ Usuario no encontrado:', usuario);
      throw new Error('Usuario no encontrado');
    }
    
    console.log('✅ Usuario encontrado, verificando contraseña...');
    const isValid = await verifyPassword(password, user.password);
    
    if (!isValid) {
      console.log('❌ Contraseña incorrecta para:', usuario);
      throw new Error('Contraseña incorrecta');
    }
    
    // Generar token JWT
    const token = jwt.sign(
      { 
        id: user.id, 
        usuario: user.usuario, 
        tipo: user.tipo 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    console.log('✅ Autenticación exitosa para:', usuario);
    
    return { 
      token, 
      user: { 
        id: user.id, 
        usuario: user.usuario, 
        tipo: user.tipo 
      } 
    };
  } catch (error) {
    console.error('❌ Error en authenticateUser:', error);
    throw error;
  }
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    console.error('❌ Error en verifyToken:', error.message);
    return null;
  }
}