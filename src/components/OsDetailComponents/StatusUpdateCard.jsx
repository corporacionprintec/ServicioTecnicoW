import React from "react";
import '../../cssGeneral/osDetail/statusUpdateCard/statusUpdateCard.css';

const statusLabels = {
  pendiente: 'Pendiente',
  en_proceso: 'Diagnosticado',
  entregado: 'Entregado',
  cancelado: 'En Abandono',
};

// Nuevo componente para la barra deslizable
export const DeliverySlider = ({ handleStatusChange }) => (
  <div className="status-update-card" style={{ border: '1px solid #b3d4fc' }}>
    <div className="status-update-card-title" style={{ color: '#007bff' }}>
      ➡️ Desliza para entregar
    </div>
    <div className="status-slider-container">
      <span className="status-badge diagnosticado">Diagnosticado</span>
      <input
        type="range"
        min="0"
        max="100"
        defaultValue="0"
        className="status-slider"
        onChange={(e) => {
          if (parseInt(e.target.value) === 100) {
            handleStatusChange("entregado");
          }
        }}
      />
      <span className="status-badge entregado">Entregado</span>
    </div>
  </div>
);

const StatusUpdateCard = ({ 
  currentStatus,
  handleStatusChange,
  onClose
}) => {
  return (
    <>
      <div className="status-update-card" style={{ position: 'relative' }}>
        {onClose && (
          <button
            type="button"
            style={{ position: 'absolute', top: 8, right: 8, background: 'none', border: 'none', fontSize: '1.2em', color: '#888', cursor: 'pointer' }}
            onClick={onClose}
            title="Cerrar"
          >
            ❌
          </button>
        )}
        <div className="status-update-card-title">Actualizar Estado</div>
        <div className="status-update-btn-group">
          <button
            type="button"
            className={`status-update-btn${currentStatus === "pendiente" ? " selected" : ""}`}
            onClick={() => handleStatusChange("pendiente")}
          >
            Pendiente
          </button>
          <button
            type="button"
            className={`status-update-btn${currentStatus === "en_proceso" ? " selected" : ""}`}
            onClick={() => handleStatusChange("en_proceso")}
          >
            Diagnosticado
          </button>
          <button
            type="button"
            className={`status-update-btn${currentStatus === "entregado" ? " selected" : ""}`}
            onClick={() => handleStatusChange("entregado")}
          >
            Entregado
          </button>
          <button
            type="button"
            className={`status-update-btn${currentStatus === "cancelado" ? " selected" : ""}`}
            onClick={() => handleStatusChange("cancelado")}
          >
            En Abandono
          </button>
        </div>
      </div>
    </>
  );
};

export default React.memo(StatusUpdateCard); 