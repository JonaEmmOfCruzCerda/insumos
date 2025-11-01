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
  const users = readData('users.json');
  
  // Verificar si el usuario ya existe
  const existingUser = users.find(u => u.usuario === userData.usuario);
  if (existingUser) {
    throw new Error('El usuario ya existe');
  }
  
  // Hashear contraseña
  const hashedPassword = await hashPassword(userData.password);
  
  // Crear nuevo usuario
  const newUser = {
    id: users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1,
    usuario: userData.usuario,
    password: hashedPassword,
    tipo: userData.tipo || 'operador', // Por defecto operador
    fecha_creacion: new Date().toISOString()
  };
  
  users.push(newUser);
  
  // Guardar en archivo
  const success = writeData('users.json', users);
  if (!success) {
    throw new Error('Error al guardar el usuario');
  }
  
  return {
    id: newUser.id,
    usuario: newUser.usuario,
    tipo: newUser.tipo
  };
}

export async function authenticateUser(usuario, password) {
  const users = readData('users.json');
  const user = users.find(u => u.usuario === usuario);
  
  if (!user) {
    throw new Error('Usuario no encontrado');
  }
  
  const isValid = await verifyPassword(password, user.password);
  if (!isValid) {
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
  
  return { 
    token, 
    user: { 
      id: user.id, 
      usuario: user.usuario, 
      tipo: user.tipo 
    } 
  };
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}