import React, { useState } from 'react';
import { usePDF } from '@react-pdf/renderer';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Dialog } from '@capacitor/dialog';
import { Share2, Loader2 } from 'lucide-react';

// Importa tu componente que define la estructura del PDF
import { OrderPDF } from './OrderPDF'; // Asegúrate que la ruta sea correcta

// Función para convertir Blob a Base64 (necesaria)
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

// Botón específico para compartir el PDF del OrderSummary
const OrderSharePDFButton = ({ order }) => {
    const [isLoading, setIsLoading] = useState(false);

    // 1. Hook usePDF para generar la instancia del PDF
    //    Le pasamos el componente OrderPDF con los datos del pedido actual
    const [instance, updateInstance] = usePDF({ document: <OrderPDF order={order} /> });

    // Llama a updateInstance si los datos del 'order' pudieran cambiar mientras se muestra
    // React.useEffect(() => {
    //   updateInstance();
    // }, [order, updateInstance]);


    const handleShare = async () => {
        // Si ya está generando o cargando, no hacer nada
        if (instance.loading || isLoading) return;

        // Si el blob no está listo (aún no se genera)
        if (!instance.blob) {
            await Dialog.alert({
                title: 'Generando PDF',
                message: 'El documento PDF aún se está creando. Intenta de nuevo en un momento.',
            });
            // Opcional: podrías intentar llamar a updateInstance() aquí para forzar la regeneración
            return;
        }

        setIsLoading(true);

        try {
            // 2. Convertir el Blob a Base64
            const base64Data = await blobToBase64(instance.blob);
            const fileName = `pedido_${order.client.replace(/\s+/g, '_')}_${String(order.id).slice(0, 5)}.pdf`;

            // 3. Escribir el archivo en el dispositivo usando Capacitor Filesystem
            const result = await Filesystem.writeFile({
                path: fileName,
                data: base64Data,
                directory: Directory.Cache, // Guardar en caché
                recursive: true
            });

            // 4. Usar Capacitor Share para compartir
            await Share.share({
                url: result.uri, // URI del archivo guardado
                title: `Pedido ${String(order.id).slice(0, 8)}`,
                dialogTitle: 'Compartir PDF del Pedido'
            });

        } catch (error) {
            console.error("Error al compartir PDF del pedido:", error);
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

    const isDisabled = isLoading || instance.loading;

    return (
        <button
            onClick={handleShare}
            disabled={isDisabled}
            className={`px-5 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center justify-center gap-2 transition-colors ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
            {isDisabled ? <Loader2 size={18} className="animate-spin" /> : <Share2 size={18} />}
            {isLoading ? 'Preparando...' : (instance.loading ? 'Generando...' : 'Compartir PDF')}
        </button>
    );
};

export default OrderSharePDFButton;