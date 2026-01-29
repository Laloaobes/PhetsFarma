import React, { useState } from 'react';
import { usePDF } from '@react-pdf/renderer';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem'; // Encoding ya no se usará aquí, pero puede ser útil en otros lados
import { Share } from '@capacitor/share';
import { Dialog } from '@capacitor/dialog';
import { Download, Loader2 } from 'lucide-react';

// Función para convertir Blob a Base64 (Esta es correcta)
const blobToBase64 = (blob) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = reject;
        reader.onload = () => {
            // Resultado: "data:application/pdf;base64,SGVsbG8gV29ybGQ="
            // Quita el prefijo "data:application/pdf;base64,"
            const base64Data = reader.result.split(',')[1];
            resolve(base64Data);
        };
        reader.readAsDataURL(blob);
    });
};

const ProductMobilePDFButton = ({ document, fileName, ...props }) => {
    const [isLoading, setIsLoading] = useState(false);

    // Genera la instancia del PDF en memoria
    const [instance] = usePDF({ document });

    const handleNativeDownload = async () => {
        if (instance.loading || isLoading) return;

        if (!instance.blob) {
            await Dialog.alert({
                title: 'Error',
                message: 'El documento PDF aún se está generando. Intenta de nuevo en un segundo.',
            });
            return;
        }

        setIsLoading(true);

        try {
            // Convertir el Blob a Base64
            const base64Data = await blobToBase64(instance.blob);

            // --- CORRECCIÓN AQUÍ ---
            // Escribir el archivo SIN especificar 'encoding' cuando los datos son base64
            const result = await Filesystem.writeFile({
                path: fileName,
                data: base64Data, // Los datos ya están en base64
                directory: Directory.Cache, // Guardar en el directorio temporal de caché
                // encoding: Encoding.UTF8, // <--- ESTA LÍNEA SE HA QUITADO
                recursive: true // Asegura que se creen directorios si no existen (buena práctica)
            });

            // Usar la API nativa de Share con el URI del archivo guardado
            await Share.share({
                title: 'Compartir Reporte PDF',
                text: `Archivo adjunto: ${fileName}`, // Texto opcional
                url: result.uri, // El URI devuelto por writeFile (ej: file:///...)
                dialogTitle: 'Compartir PDF con', // Título del diálogo de compartir
            });

        } catch (error) {
            console.error("Error al compartir PDF nativo:", error);
            if (error.message && !error.message.includes("Share canceled")) {
                await Dialog.alert({
                    title: 'Error',
                    message: `No se pudo guardar o compartir el PDF: ${error.message}`,
                });
            }
        } finally {
            setIsLoading(false);
        }
    };

    const isGenerating = instance.loading || isLoading;

    return (
        <button
            onClick={handleNativeDownload}
            disabled={isGenerating}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 disabled:bg-green-300"
        >
            {isGenerating ? <Loader2 className="animate-spin" size={18} /> : <Download size={18} />}
            {isGenerating ? 'Generando...' : 'PDF'}
        </button>
    );
};

export default ProductMobilePDFButton;