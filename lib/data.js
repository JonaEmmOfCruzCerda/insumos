import fs from 'fs';
import path from 'path';

const dataPath = path.join(process.cwd(), 'data');

// Crear directorio data si no existe
if (!fs.existsSync(dataPath)) {
  fs.mkdirSync(dataPath, { recursive: true });
}

// Inicializar archivos si no existen
const requiredFiles = ['users.json', 'products.json', 'movements.json', 'requests.json'];
requiredFiles.forEach(file => {
  const filePath = path.join(dataPath, file);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, '[]');
  }
});

export function readData(fileName) {
  try {
    const filePath = path.join(dataPath, fileName);
    
    // Si el archivo no existe, crearlo con array vacío
    if (!fs.existsSync(filePath)) {
      writeData(fileName, []);
      return [];
    }
    
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading ${fileName}:`, error);
    return [];
  }
}

export function writeData(fileName, data) {
  try {
    const filePath = path.join(dataPath, fileName);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error(`Error writing ${fileName}:`, error);
    return false;
  }
}