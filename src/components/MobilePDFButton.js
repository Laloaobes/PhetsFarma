import React, { useState } from 'react';
import { usePDF } from '@react-pdf/renderer';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Dialog } from '@capacitor/dialog';
import { Download, Loader2 } from 'lucide-react';

// Función para convertir Blob a Base64 (Esta es correcta)
const blobToBase64 = (blob) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = reject;
        reader.onload = () => {
            const base64Data = reader.result.split(',')[1];
            resolve(base64Data);
        };
        reader.readAsDataURL(blob);
    });
};

const MobilePDFButton = ({ document, fileName, user, formatCurrency, summaryDataForCards, appliedFilters }) => {
    const [isLoading, setIsLoading] = useState(false);

    // 1. Usamos el hook usePDF para generar la instancia del PDF
    const [instance] = usePDF({
        document: React.cloneElement(document, { 
            user, 
            formatCurrency, 
            summaryData: summaryDataForCards, 
            orders: document.props.orders, 
            dateRange: appliedFilters.startDate && appliedFilters.endDate ? `${new Date(appliedFilters.startDate).toLocaleDateString('es-MX')} a ${new Date(appliedFilters.endDate).toLocaleDateString('es-MX')}` : null
        })
    });

    const handleNativeDownload = async () => {
        if (isLoading || instance.loading || !instance.blob) {
            if (!instance.blob) {
                 await Dialog.alert({
                    title: "Error",
                    message: "El documento PDF aún no está listo. Intenta de nuevo."
                });
            }
            return;
        }

        setIsLoading(true);

        // Permisos: Capacitor's Directory.Cache no requiere permisos especiales en Android.
        
        try {
            // 3. Convertir el Blob a Base64
            const base64Data = await blobToBase64(instance.blob);
            
            // 4. Escribir el archivo en el dispositivo usando Capacitor Filesystem
            const result = await Filesystem.writeFile({
                path: fileName,
                data: base64Data,
                directory: Directory.Cache // Guardar en el directorio de caché
            });

            // 5. Usar Capacitor Share para abrir el diálogo nativo
            await Share.share({
                url: result.uri, // Usamos el URI que nos devuelve Filesystem
                title: 'Compartir Reporte',
                dialogTitle: 'Compartir Reporte PDF'
            });

        } catch (error) {
            console.error("Error al guardar o compartir PDF:", error);
            // Ignora el error si el usuario simplemente canceló
            if (error.message && !error.message.includes("Share canceled")) { 
                 await Dialog.alert({
                    title: "Error",
                    message: "No se pudo guardar o compartir el PDF."
                });
            }
        } finally {
            setIsLoading(false);
        }
    };

    // Usamos un <button> normal, ya que Capacitor es una WebView
    return (
        <button
            onClick={handleNativeDownload}
            disabled={isLoading || instance.loading}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 disabled:bg-green-400"
            style={{ minWidth: '90px' }} // Añade un ancho mínimo para que no salte
        >
            {isLoading || instance.loading ? (
                <Loader2 size={18} className="animate-spin" />
            ) : (
                <Download size={18} />
            )}
            <span className="ml-1">
                {isLoading ? 'Generando...' : (instance.loading ? 'Cargando...' : 'PDF')}
            </span>
        </button>
    );
};

export default MobilePDFButton;