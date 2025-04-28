import React from "react";
import '../../cssGeneral/osDetail/machineHistoryTable/machineHistoryTable.css';

// Función auxiliar para extraer el ID de un enlace de Google Drive
const extractFileIdFromUrl = (url) => {
  const regex = /\/file\/d\/([^/]+)\//;
  const match = url.match(regex);
  return match ? match[1] : null;
};

const MachineHistoryTable = ({ machineHistory, showHistory }) => {
  if (!showHistory || !machineHistory) {
    return null;
  }

  return (
    <div className="mht-section">
      <h6 className="mht-title">Historial de la Máquina:</h6>
      <table className="mht-table">
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Descripción</th>
            <th>Cliente</th>
            <th>Teléfono</th>
            <th>Diagnóstico</th>
            <th>Imagen Diagnóstico</th>
          </tr>
        </thead>
        <tbody>
          {machineHistory.map((historial) => (
            <tr key={historial.id}>
              <td>{historial.fecha}</td>
              <td>{historial.descripcion}</td>
              <td>
                {historial.cliente.nombre} {historial.cliente.apellido}
              </td>
              <td>{historial.cliente.telefono}</td>
              <td>
                {historial.dispositivo.diagnostico
                  ? historial.dispositivo.diagnostico
                  : "Sin diagnóstico"}
              </td>
              <td>
                {historial.dispositivo.imagenen_diagnostico ? (
                  (() => {
                    const fileId = extractFileIdFromUrl(
                      historial.dispositivo.imagenen_diagnostico
                    );
                    if (fileId) {
                      return (
                        <button
                          className="mht-btn"
                          onClick={() => {
                            window.open(
                              `https://drive.google.com/file/d/${fileId}/view`,
                              "_blank"
                            );
                          }}
                        >
                          📷 Ver imagen
                        </button>
                      );
                    } else {
                      return <span>Enlace no válido.</span>;
                    }
                  })()
                ) : (
                  "Sin imagen"
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default React.memo(MachineHistoryTable); 