import React, { useEffect, useState } from 'react';
import jsPDF from 'jspdf';

import logoPath from '../../imagenes/printec.jpg';
import '../../cssGeneral/osDetail/receiptGenerator/receiptGenerator.css';

// Componente para generar recibos PDF con mejor diseño
const ReceiptGenerator = ({ orderData, onSuccess, onError }) => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ show: false, text: '', type: '' });

  // Llamar a la función de generación de PDF cuando el componente se monta
  useEffect(() => {
    generateReceipt();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Función para generar el recibo PDF
  const generateReceipt = async () => {
    try {
      setLoading(true);
      // Crear una nueva instancia de PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;
      let y = 30; // Posición inicial Y (más abajo para dejar espacio al logo)

      // Definir colores corporativos
      const printecBlue = [0, 48, 255]; // Color azul de Printec
      const darkBlue = [13, 71, 161];
      
      // Configuración de estilos
      const titleFontSize = 14;
      const contentFontSize = 10;
      const lineHeight = 7;

      // Añadir el logo de Printec desde archivo
      try {
        pdf.addImage(logoPath, 'JPEG', pageWidth / 2 - 30, 5, 60, 20);
      } catch (err) {
        console.error('Error cargando el logo:', err);
      }
      
      // Generar QR para el enlace a la página corporativa - TAMAÑO AUMENTADO
      // try {
      //   const qrDataUrl = await QRCode.toDataURL('https://corporacionprintec.github.io/Printec.github.io', {
      //     width: 800, // Aumentar calidad del QR
      //     margin: 1,  // Reducir margen alrededor del QR
      //     color: {
      //       dark: '#0030FF',  // Color azul para el QR
      //       light: '#FFFFFF'  // Fondo blanco
      //     }
      //   });
      //   // Añadir QR más grande en la esquina superior derecha
      //   pdf.addImage(qrDataUrl, 'PNG', pageWidth - 40, 5, 30, 30);
      //   // Añadir texto debajo del QR
      //   pdf.setFontSize(8);
      //   pdf.setTextColor(...printecBlue);
      //   pdf.setFont('helvetica', 'bold');
      //   pdf.text('CONOCE MÁS SOBRE NOSOTROS', pageWidth - 25, 38, { align: 'center' });
      // } catch (err) {
      //   console.error('Error generando QR:', err);
      // }

      // Añadir un fondo de color azul claro en la cabecera
      pdf.setFillColor(230, 240, 255);
      pdf.rect(0, 35, pageWidth, 15, 'F');
      
      // Información del Recibo en la cabecera
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(16);
      pdf.setTextColor(...darkBlue);
      pdf.text(`RECIBO #${orderData?.data?.ticket || 'N/A'}`, margin, 45);
      
      // Fecha en la parte derecha de la cabecera
      const fechaActual = new Date().toLocaleString('es-PE', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      });
      pdf.setFontSize(9);
      pdf.setTextColor(100, 100, 100);
      pdf.text(`Fecha: ${fechaActual}`, pageWidth - margin, 45, { align: 'right' });
      
      // Información de la empresa
      y = 60;
      pdf.setFontSize(10);
      pdf.setTextColor(0, 0, 0);
      pdf.setFont('helvetica', 'normal');
      pdf.text('CALLE HUANUCO N.201- INT. 201 ICA- ICA - ICA', margin, y);
      y += lineHeight - 2;
      pdf.text('RUC: 20610753567 • +51966177851', margin, y);
      y += lineHeight - 2;
      pdf.text('IMPORTACIONES PRINTEC - SOLO LAS MEJORES MARCAS', margin, y);
      
      // Línea divisoria con degradado azul
      y += lineHeight;
      pdf.setDrawColor(...printecBlue);
      pdf.setLineWidth(0.5);
      pdf.line(margin, y, pageWidth - margin, y);
      
      // Sección Cliente
      y += lineHeight * 1.5;
      pdf.setFillColor(230, 240, 255);
      pdf.rect(margin, y - 5, pageWidth - (margin * 2), 10, 'F');
      
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(titleFontSize);
      pdf.setTextColor(...darkBlue);
      pdf.text('CLIENTE', margin + 2, y);
      y += lineHeight * 1.5;
      
      // Información del cliente en columnas
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(contentFontSize);
      pdf.setTextColor(0, 0, 0);
      
      const clienteNombre = `${orderData?.data?.dispositivo?.cliente?.nombre || ''} ${orderData?.data?.dispositivo?.cliente?.apellido || ''}`.trim();
      pdf.text(`Nombre: ${clienteNombre || 'N/A'}`, margin, y);
      pdf.text(`Teléfono: ${orderData?.data?.dispositivo?.cliente?.telefono || 'N/A'}`, pageWidth / 2, y);
      y += lineHeight;
      
      const fechaRecepcion = orderData?.data?.fecha_ingreso ?
        new Date(orderData.data.fecha_ingreso).toLocaleDateString('es-PE', {
          day: '2-digit',
          month: 'long',
          year: 'numeric'
        }) : 'N/A';
        
      pdf.text(`Fecha de Recepción: ${fechaRecepcion}`, margin, y);
      
      // Estado del servicio
      const estadoStr = orderData?.data?.estado ? 
        orderData.data.estado.replace(/_/g, ' ').toUpperCase() : 'N/A';
      pdf.text(`Estado: ${estadoStr}`, pageWidth / 2, y);
      
      // Sección Problema y Diagnóstico
      y += lineHeight * 2;
      pdf.setFillColor(230, 240, 255);
      pdf.rect(margin, y - 5, pageWidth - (margin * 2), 10, 'F');
      
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(titleFontSize);
      pdf.setTextColor(...darkBlue);
      pdf.text('PROBLEMA REPORTADO', margin + 2, y);
      y += lineHeight * 1.5;
      
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(contentFontSize);
      pdf.setTextColor(0, 0, 0);
      
      // Problema reportado con texto justificado
      const problema = orderData?.data?.problema_descrito || 'Sin descripción';
      const splitProblema = pdf.splitTextToSize(problema, pageWidth - (margin * 2));
      pdf.text(splitProblema, margin, y);
      y += (splitProblema.length * lineHeight) + lineHeight;
      
      // Sección Diagnóstico
      pdf.setFillColor(230, 240, 255);
      pdf.rect(margin, y - 5, pageWidth - (margin * 2), 10, 'F');
      
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(titleFontSize);
      pdf.setTextColor(...darkBlue);
      pdf.text('DIAGNÓSTICO TÉCNICO', margin + 2, y);
      y += lineHeight * 1.5;
      
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(contentFontSize);
      pdf.setTextColor(0, 0, 0);
      
      // Diagnóstico técnico con texto justificado
      const diagnostico = orderData?.data?.dispositivo?.diagnostico || 'Sin diagnóstico registrado';
      const splitDiagnostico = pdf.splitTextToSize(diagnostico, pageWidth - (margin * 2));
      pdf.text(splitDiagnostico, margin, y);
      y += (splitDiagnostico.length * lineHeight) + lineHeight;
      
      // Sección de Detalle del Servicio (Facturación)
      y += lineHeight;
      pdf.setFillColor(...printecBlue);
      pdf.rect(margin, y - 5, pageWidth - (margin * 2), 10, 'F');
      
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(titleFontSize);
      pdf.setTextColor(255, 255, 255); // Texto blanco sobre fondo azul
      pdf.text('DETALLE DEL SERVICIO', margin + 2, y);
      y += lineHeight * 1.5;
      
      // Encabezados de la tabla
      pdf.setFillColor(240, 240, 240);
      pdf.rect(margin, y - 5, pageWidth - (margin * 2), 10, 'F');
      
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(10);
      pdf.setTextColor(0, 0, 0);
      
      const col1Width = 100;
 
      pdf.text('DESCRIPCIÓN', margin + 2, y);
      pdf.text('CANT.', margin + col1Width + 5, y);
      pdf.text('PRECIO (S/)', pageWidth - margin - 20, y, { align: 'right' });
      
      y += lineHeight;
      pdf.setDrawColor(200, 200, 200);
      pdf.setLineWidth(0.1);
      pdf.line(margin, y, pageWidth - margin, y);
      
      // Detalle del servicio
      y += lineHeight;
      pdf.setFont('helvetica', 'normal');
      
      // Información del dispositivo agregada a la descripción del servicio
      const tipoDispositivo = orderData?.data?.dispositivo?.tipo_dispositivo || '';
      const marca = orderData?.data?.dispositivo?.marca || '';
      const modelo = orderData?.data?.dispositivo?.modelo || '';
      
      // Combinamos la información del dispositivo con el tipo de servicio
      let tipoServicio = orderData?.data?.tipoServicio || 'Servicio técnico general';
      if (tipoDispositivo || marca || modelo) {
        tipoServicio += ` - ${tipoDispositivo} ${marca} ${modelo}`.trim();
      }
      
      const cantidad = 1;
      const costoTotal = orderData?.data?.dispositivo?.costo_total || '0.00';
      
      // Dividir texto largo en múltiples líneas
      const splitTipoServicio = pdf.splitTextToSize(tipoServicio, col1Width);
      pdf.text(splitTipoServicio, margin + 2, y);
      
      // Si el texto tiene varias líneas, ajustamos la posición Y para la cantidad y precio
      const cantidadY = y + ((splitTipoServicio.length - 1) * lineHeight) / 2;
      
      pdf.text(`${cantidad}`, margin + col1Width + 5, cantidadY);
      pdf.text(`${costoTotal}`, pageWidth - margin - 20, cantidadY, { align: 'right' });
      
      // Ajustar la posición Y según la altura del texto dividido
      y += Math.max(lineHeight * 1.5, (splitTipoServicio.length * lineHeight));
      
      // Línea divisoria
      pdf.line(margin, y, pageWidth - margin, y);
      
      // Sección de totales con marco azul 
      y += lineHeight * 1.5;
      
      // Fondo azul para el total
      pdf.setFillColor(...printecBlue);
      pdf.rect(pageWidth / 2, y - 5, pageWidth / 2 - margin, 12, 'F');
      
      // TOTAL (sin IGV, según lo solicitado)
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(12);
      pdf.setTextColor(255, 255, 255); // Texto blanco sobre fondo azul
      pdf.text('TOTAL:', pageWidth - margin - 80, y);
      pdf.text(`S/ ${costoTotal}`, pageWidth - margin - 20, y, { align: 'right' });
      
      // Pie de página con mensaje
      y = pageHeight - 30;
      
      // Añadir borde redondeado para el mensaje final
      pdf.setFillColor(240, 248, 255);
      pdf.roundedRect(margin, y - 15, pageWidth - (margin * 2), 25, 3, 3, 'F');
      
      pdf.setFont('helvetica', 'italic');
      pdf.setFontSize(11);
      pdf.setTextColor(0, 0, 150);
      pdf.text('¡Gracias por confiar en Importaciones Printec!', pageWidth / 2, y - 5, { align: 'center' });
      
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      pdf.setTextColor(100, 100, 100);
      pdf.text('Para guías, manuales, instrucciones y videos tutoriales búsquenos en YouTube como PRINTEC ICA.', 
               pageWidth / 2, y + 5, { align: 'center' });
      
      // Generar nombre para el archivo
      const fileName = `recibo_${orderData?.data?.ticket || 'orden'}.pdf`;
      
      // IMPORTANTE: Ya no guardamos el PDF localmente aquí, lo haremos después de subir
      // Obtener el PDF como blob para enviarlo a la API
      const pdfBlob = pdf.output('blob');
      
      // Crear un FormData para enviar el archivo
      const formData = new FormData();
      formData.append('file', pdfBlob, fileName);
      
      // Obtener el ID del dispositivo
      const dispositivoId = orderData?.data?.dispositivo?.id;
      
      if (dispositivoId) {
        try {
          // Mostrar mensaje de subida en proceso
          setMessage({ show: true, text: 'Subiendo recibo al servidor...', type: 'info' });
          
          // Enviar el PDF a la API para subirlo a Google Drive
          const response = await fetch(
            `https://servidorserviciotecnico-production.up.railway.app/api/dispositivos/${dispositivoId}/recibo`, 
            {
              method: 'PUT',
              body: formData
            }
          );
          
          if (!response.ok) {
            throw new Error('Error en la actualización');
          }
          
          // La subida fue exitosa, ahora guardamos el PDF localmente
          pdf.save(fileName);
          
          // Mostrar mensaje de éxito
          setMessage({ show: true, text: 'Recibo subido correctamente y descargado', type: 'success' });
          
          // Llamar al callback de éxito
          if (onSuccess) onSuccess();
        } catch (uploadError) {
          console.error("Error al subir el recibo a Google Drive:", uploadError);
          let errorMessage = 'Error al subir el recibo a Google Drive';
          
          // Extraer mensajes más específicos del error
          if (uploadError.response) {
            // El servidor respondió con un código de estado que está fuera del rango 2xx
            console.error("Respuesta del servidor:", uploadError.response.data);
            console.error("Estado HTTP:", uploadError.response.status);
            errorMessage = `Error ${uploadError.response.status}: ${uploadError.response.data.message || 'Error en la respuesta del servidor'}`;
          } else if (uploadError.request) {
            // La solicitud se realizó pero no se recibió respuesta
            console.error("No se recibió respuesta:", uploadError.request);
            errorMessage = 'No se recibió respuesta del servidor. Verifique que el servidor esté funcionando.';
          } else {
            // Algo ocurrió al configurar la solicitud que desencadenó un error
            console.error("Error de configuración:", uploadError.message);
            errorMessage = `Error: ${uploadError.message}`;
          }
          
          setMessage({ show: true, text: errorMessage, type: 'danger' });
          if (onError) onError(uploadError);
        }
      } else {
        // Si no hay ID de dispositivo, mostrar mensaje de error
        setMessage({ show: true, text: 'No se pudo obtener el ID del dispositivo', type: 'danger' });
        if (onError) onError(new Error('No se pudo obtener el ID del dispositivo'));
      }
      
    } catch (error) {
      console.error("Error al generar el recibo PDF:", error);
      setMessage({ show: true, text: 'Error al generar el recibo PDF', type: 'danger' });
      if (onError) onError(error);
    } finally {
      setLoading(false);
    }
  };

  // Renderizado de spinner y alert personalizados
  return (
    <>
      {loading && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(255,255,255,0.6)',
          zIndex: 3000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <div style={{ textAlign: 'center' }}>
            <span className="rg-spinner" style={{ width: '2.5em', height: '2.5em', marginBottom: '1em' }}></span>
            <div style={{ fontWeight: 600, color: '#265d97', fontSize: '1.2em' }}>Generando PDF...</div>
          </div>
        </div>
      )}
      <div style={{ textAlign: 'center', margin: '2em 0' }}>
        {message.show && (
          <div className={`rg-alert${message.type === 'danger' ? ' rg-alert-danger' : message.type === 'success' ? ' rg-alert-success' : ''}`}>
            {message.text}
          </div>
        )}
      </div>
    </>
  );
};

export default React.memo(ReceiptGenerator); 