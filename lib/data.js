import fs from 'fs';
import path from 'path';

// Configuración de GitHub para Vercel
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPO = process.env.GITHUB_REPO;
const GITHUB_BRANCH = 'main';

// Detectar si estamos en Vercel
const isVercel = process.env.VERCEL === '1';

// Configuración local
const dataPath = path.join(process.cwd(), 'data');

// Crear directorio data si no existe (solo desarrollo)
if (!isVercel && !fs.existsSync(dataPath)) {
  fs.mkdirSync(dataPath, { recursive: true });
}

// Inicializar archivos si no existen (solo desarrollo)
if (!isVercel) {
  const requiredFiles = ['users.json', 'products.json', 'movements.json', 'requests.json'];
  requiredFiles.forEach(file => {
    const filePath = path.join(dataPath, file);
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, '[]');
    }
  });
}

// Datos por defecto en memoria para Vercel
const defaultData = {
  'users.json': [
    {
      id: 1,
      usuario: "admin",
      password: "$2a$10$8K1p/a0dRL1//.2Kc.5YfO5R2l2c2WU2c2WU2c2WU2c2WU2c2WU2c2W", // admin123
      tipo: "admin",
      fecha_creacion: new Date().toISOString()
    },
    {
      id: 2,
      usuario: "operador", 
      password: "$2a$10$8K1p/a0dRL1//.2Kc.5YfO5R2l2c2WU2c2WU2c2WU2c2WU2c2WU2c2W", // operador123
      tipo: "operador",
      fecha_creacion: new Date().toISOString()
    }
  ],
  'products.json': [],
  'requests.json': [],
  'movements.json': []
};

// Cache en memoria para Vercel
let memoryCache = { ...defaultData };

// ==================== FUNCIONES PARA GITHUB (VERCEL) ====================

// Función para leer desde GitHub
async function readFromGitHub(filename) {
  try {
    if (!GITHUB_TOKEN || !GITHUB_REPO) {
      console.log('⚠️ GitHub no configurado, usando datos en memoria');
      return memoryCache[filename] || [];
    }

    console.log(`🔍 Leyendo ${filename} desde GitHub...`);
    
    const response = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/contents/data/${filename}?ref=${GITHUB_BRANCH}`,
      {
        headers: {
          'Authorization': `Bearer ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      }
    );

    if (response.status === 404) {
      console.log(`📄 ${filename} no existe en GitHub, creando con datos por defecto...`);
      // Guardar datos por defecto
      await writeToGitHub(filename, memoryCache[filename] || []);
      return memoryCache[filename] || [];
    }

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }

    const fileData = await response.json();
    const content = Buffer.from(fileData.content, 'base64').toString('utf8');
    const data = JSON.parse(content);
    
    console.log(`✅ ${filename} cargado desde GitHub:`, data.length, 'registros');
    
    // Actualizar cache
    memoryCache[filename] = data;
    return data;
  } catch (error) {
    console.error(`❌ Error leyendo ${filename} desde GitHub:`, error.message);
    console.log('🔄 Usando datos en memoria como fallback');
    return memoryCache[filename] || [];
  }
}

// Función para guardar en GitHub
async function writeToGitHub(filename, data) {
  try {
    if (!GITHUB_TOKEN || !GITHUB_REPO) {
      console.log('⚠️ GitHub no configurado, guardando en memoria');
      memoryCache[filename] = data;
      return true;
    }

    console.log(`💾 Guardando ${filename} en GitHub...`, data.length, 'registros');

    // Primero obtener el SHA del archivo actual (si existe)
    let sha = null;
    try {
      const existingResponse = await fetch(
        `https://api.github.com/repos/${GITHUB_REPO}/contents/data/${filename}?ref=${GITHUB_BRANCH}`,
        {
          headers: {
            'Authorization': `Bearer ${GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        }
      );
      
      if (existingResponse.ok) {
        const existingData = await existingResponse.json();
        sha = existingData.sha;
      }
    } catch (error) {
      // El archivo no existe, no hay problema
    }

    const content = Buffer.from(JSON.stringify(data, null, 2)).toString('base64');
    
    const response = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/contents/data/${filename}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: `Actualizar ${filename} - ${new Date().toISOString()}`,
          content: content,
          branch: GITHUB_BRANCH,
          sha: sha
        })
      }
    );

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }

    console.log(`✅ ${filename} guardado exitosamente en GitHub`);
    
    // Actualizar cache
    memoryCache[filename] = data;
    return true;
  } catch (error) {
    console.error(`❌ Error guardando ${filename} en GitHub:`, error.message);
    console.log('🔄 Guardando en memoria como fallback');
    memoryCache[filename] = data;
    return true;
  }
}

// Función para crear la carpeta data en GitHub si no existe
async function ensureDataFolder() {
  try {
    if (!GITHUB_TOKEN || !GITHUB_REPO) return;

    // Verificar si existe la carpeta data
    const response = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/contents/data?ref=${GITHUB_BRANCH}`,
      {
        headers: {
          'Authorization': `Bearer ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      }
    );

    if (response.status === 404) {
      console.log('📁 Creando carpeta data en GitHub...');
      // Crear carpeta data creando un archivo .gitkeep
      const createResponse = await fetch(
        `https://api.github.com/repos/${GITHUB_REPO}/contents/data/.gitkeep`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            message: 'Crear carpeta data',
            content: Buffer.from('{}').toString('base64'),
            branch: GITHUB_BRANCH
          })
        }
      );
      
      if (createResponse.ok) {
        console.log('✅ Carpeta data creada en GitHub');
      }
    }
  } catch (error) {
    console.error('Error creando carpeta data:', error);
  }
}

// ==================== FUNCIONES PRINCIPALES ====================

export async function readData(fileName) {
  try {
    if (isVercel) {
      // En Vercel: usar GitHub
      await ensureDataFolder();
      return await readFromGitHub(fileName);
    } else {
      // Desarrollo local: usar filesystem (tu código original)
      const filePath = path.join(dataPath, fileName);
      
      // Si el archivo no existe, crearlo con array vacío
      if (!fs.existsSync(filePath)) {
        writeData(fileName, []);
        return [];
      }
      
      const data = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error(`Error reading ${fileName}:`, error);
    
    // Fallback a memoria en Vercel
    if (isVercel) {
      return memoryCache[fileName] || [];
    }
    
    return [];
  }
}

export async function writeData(fileName, data) {
  try {
    if (isVercel) {
      // En Vercel: guardar en GitHub
      return await writeToGitHub(fileName, data);
    } else {
      // Desarrollo local: usar filesystem (tu código original)
      const filePath = path.join(dataPath, fileName);
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
      return true;
    }
  } catch (error) {
    console.error(`Error writing ${fileName}:`, error);
    
    // Fallback a memoria en Vercel
    if (isVercel) {
      memoryCache[fileName] = data;
      return true;
    }
    
    return false;
  }
}