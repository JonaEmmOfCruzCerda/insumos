import fs from 'fs';
import path from 'path';

// Detectar si estamos en Vercel
const isVercel = process.env.VERCEL === '1';

// Datos en memoria para Vercel
let memoryData = {
  'users.json': [
    {
      id: 1,
      usuario: "admin",
      password: "$2a$10$8K1p/a0dRL1//.2Kc.5YfO5R2l2c2WU2c2WU2c2WU2c2WU2c2WU2c2W", // password: admin123
      tipo: "admin",
      fecha_creacion: new Date().toISOString()
    }
  ],
  'products.json': [],
  'requests.json': [],
  'movements.json': []
};

export function readData(filename) {
  try {
    if (isVercel) {
      console.log('🔧 Vercel: Leyendo de memoria', filename);
      return memoryData[filename] || [];
    } else {
      // Desarrollo - usar archivos
      const dataPath = path.join(process.cwd(), 'data');
      const filePath = path.join(dataPath, filename);
      
      if (!fs.existsSync(filePath)) {
        writeData(filename, []);
        return [];
      }
      
      const data = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error(`Error reading ${filename}:`, error);
    return [];
  }
}

export function writeData(filename, data) {
  try {
    if (isVercel) {
      console.log('🔧 Vercel: Guardando en memoria', filename);
      memoryData[filename] = data;
      console.log('✅ Guardado exitoso en memoria');
      return true;
    } else {
      // Desarrollo - usar archivos
      const dataPath = path.join(process.cwd(), 'data');
      if (!fs.existsSync(dataPath)) {
        fs.mkdirSync(dataPath, { recursive: true });
      }
      
      const filePath = path.join(dataPath, filename);
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
      return true;
    }
  } catch (error) {
    console.error(`❌ Error writing ${filename}:`, error);
    return false;
  }
}