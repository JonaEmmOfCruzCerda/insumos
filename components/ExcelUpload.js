'use client';
import { useState, useRef } from "react";

export default function ExcelUpload({onProductsLoaded, onClose}) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const fileInputRef = useRef(null);

    const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        if(!file) return;

        // validar que sea un archivo excel
        const validExtensions = ['.xlsx', '.xls', '.csv'];
        const fileExtension = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));

        if (!validExtensions.includes(fileExtension)) {
            setError('Por favor, sube un archivo Excel (.xlsx, .xls, .csv)');
            return;
        }

        setLoading(true);
        setError('');

        try {
            // Importación dinámica de xlsx para evitar problemas con SSR
            const XLSX = await import('xlsx');
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, {type: 'array'});

                    // Obtener la primera hoja
                    const firstSheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[firstSheetName];

                    // Convertir a JSON
                    const jsonData = XLSX.utils.sheet_to_json(worksheet);

                    // validar y mapear los datos
                    const products = jsonData.map((row, index) => {
                        // Validar columnas minimas requeridas
                        if (!row.codigo && !row['Código']) {
                            throw new Error(`Fila ${index + 2}: Falta el código del producto`);
                        } if (!row.producto && !row['Producto'] && !row.insumo && !row['Insumoo']) {
                            throw new Error(`Fila ${index + 2}: Falta el nombre del producto`);
                        }

                        return {
                            codigo: row.codigo || row['Código'] || '',
                            producto: row.producto || row['Producto'] || row.insumo || row['Insumo'] || '',
                            descripcion: row.descripcion || row['Descripción'] || row.descripcion || '',
                            observaciones: row.observaciones || row['Observaciones'] || '',
                            punto_reorden: parseInt(row.stock || row['Punto Reorden'] || 0),
                            stock: parseInt(row.stock || row['Stock'] || 0),
                        };
                    });

                    if (products.length === 0) {
                        setError('El archivo no contiene datos válidos');
                        return;
                    }

                    onProductsLoaded(products),
                    onClose();
                } catch (parseError) {
                    setError(`Error al procesar el archivo: ${parseError.message}`);
                }
            };

            reader.onerror = () => {
                setError('Error al leer el archivo');
                setLoading(false);
            };

            reader.readAsArrayBuffer(file);
        } catch (error) {
            setError(`Error: ${error.message}`);
            setLoading(false);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();

        const files = e.dataTransfer.files;
        if(files.length > 0) {
            fileInputRef.current.files = files;
            handleFileUpload({target: {files}});
        }
    };

    return(
        <div className="fixed inset-0 backdrop-blur-sm bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                <div className="px-6 py-4 border-b">
                    <h3 className="text-lg font-semibold text-gray-900">Cargar Productos desde Excel</h3>
                </div>

                <div className="p-6">
                    {error && (
                        <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                            {error}
                        </div>
                    )}

                    <div className="border-2 border-dashed border-gray-30 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 transition-colors" onDragOver={handleDragOver} onDrop={handleDrop} onClick={() => fileInputRef.current?.click()}>
                        <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".xlsx,.xls,.csv" className="hidden"/>
                        <div className="flex flex-col items-center">
                            <svg className="w-12 h-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                            <p className="text-lg font-medium text-gray-700 mb-2">
                                {loading ? 'Procesando archivo...' : 'Haz clic o arrastra tu archivo aquí'}
                            </p>
                            <p className="text-sm text-gray-500 mb-4">
                                Formatos soportados: .xlsx, .xls, .csv
                            </p>

                            <button type="button" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disable:opacity-50">
                                {loading ? 'Cargando...' : 'Seleccionar Archivo'}
                            </button>
                        </div>
                    </div>

                    <div className="mt-6">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Formato requerido:</h4>
                        <div className="text-xs text-gray-600 space-y-1">
                            <p><strong>Columnas:</strong> Código, Producto, Descripción, Observaciones, Punto Reorden, Stock</p>
                        </div>
                    </div>

                    <div className="mt-4 flex jusify-between">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">Cancelar</button>
                        
                    </div>

                </div>
            </div>
        </div>
    );
}