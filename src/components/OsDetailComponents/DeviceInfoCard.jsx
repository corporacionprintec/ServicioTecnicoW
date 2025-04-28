import React from "react";
import '../../cssGeneral/osDetail/deviceInfoCard/deviceInfoCard.css';

// Función auxiliar para extraer el ID de un enlace de Google Drive
const extractFileIdFromUrl = (url) => {
  const regex = /\/file\/d\/([^/]+)\//;
  const match = url.match(regex);
  return match ? match[1] : null;
};

const DeviceInfoCard = ({ 
  deviceData, 
  handleSendWhatsApp, 
  reciboURL,
  estado
}) => {
  return (
    <div className="dic-card">
      <div className="dic-card-header">
        <h5 className="dic-card-title">Información del Equipo</h5>
      </div>
      <div className="dic-card-body">
        <p>
          <strong>Diagnóstico:</strong>{" "}
          {deviceData?.diagnostico || "Sin diagnóstico"}
        </p>
        {/* Mostrar nombre del técnico solo si el estado es en_proceso y hay detalles */}
        {estado === 'en_proceso' && deviceData?.detalles && (
          <p>
            <strong>Técnico que diagnosticó:</strong> {deviceData.detalles}
          </p>
        )}
        {deviceData?.imagenen_diagnostico && (
          <p>
            <strong>Imagen Diagnóstico:</strong>{" "}
            {(() => {
              const fileId = extractFileIdFromUrl(deviceData.imagenen_diagnostico);
              if (fileId) {
                const previewUrl = `https://drive.google.com/file/d/${fileId}/preview`;
                return (
                  <iframe
                    src={previewUrl}
                    width="100%"
                    height="400px"
                    style={{ border: "none", borderRadius: "8px", marginBottom: "16px" }}
                    title="Imagen del diagnóstico"
                  />
                );
              } else {
                return <span>Enlace no válido.</span>;
              }
            })()}
          </p>
        )}
        <p>
          <strong>Costo total de reparación:</strong>{" "}
          {deviceData?.costo_total 
            ? `S/. ${deviceData.costo_total}` 
            : "No registrado"}
        </p>
        {/* Campo Facturado - se muestra cuando hay un recibo */}
        {deviceData?.recibo && (
          <div style={{ marginTop: '1em' }}>
            <span className="dic-badge-success">✅ FACTURADO</span>
            <div style={{ marginTop: '1em', display: 'flex', flexDirection: 'column', gap: '0.5em' }}>
              <a
                href={deviceData.recibo}
                target="_blank"
                rel="noopener noreferrer"
                className="dic-btn dic-btn-pdf"
              >
                📄 Ver recibo
              </a>
              <button 
                className="dic-btn dic-btn-whatsapp"
                onClick={handleSendWhatsApp}
              >
                💬 Enviar por WhatsApp
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(DeviceInfoCard); 