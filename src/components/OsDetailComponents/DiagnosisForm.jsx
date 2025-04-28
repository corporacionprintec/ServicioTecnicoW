import React from "react";
import '../../cssGeneral/osDetail/diagnosisForm/diagnosisForm.css';
import VoiceDictation from "./VoiceDictation";

const DiagnosisForm = ({
  showModelInput,
  newOrderType,
  setNewOrderType,
  setNewOrderImage,
  costoTotal,
  setCostoTotal,
  handleUpdateDevice,
  isUpdatingDiagnostico,
  showToast
}) => {
  if (!showModelInput) {
    return null;
  }

  return (
    <div className="df-section">
      <h5 className="df-title">Diagnóstico</h5>
      <VoiceDictation 
        value={newOrderType}
        onChange={setNewOrderType}
        maxLength={900}
        showToast={showToast}
      />
      <div className="df-group">
        <label className="df-label">Imagen de diagnóstico</label>
        <input
          className="df-input"
          type="file"
          onChange={(e) => setNewOrderImage(e.target.files[0])}
        />
      </div>
      <div className="df-group">
        <label className="df-label">Costo total de reparación (S/.)</label>
        <input
          className="df-input"
          type="number"
          placeholder="Ingrese el costo total"
          value={costoTotal}
          onChange={(e) => setCostoTotal(e.target.value)}
          min="0"
          step="0.01"
        />
      </div>
      <button 
        className="df-btn"
        onClick={handleUpdateDevice} 
        disabled={isUpdatingDiagnostico || !newOrderType}
      >
        {isUpdatingDiagnostico ? (
          <>
            <span className="df-spinner"></span>
            Procesando...
          </>
        ) : (
          "Guardar Diagnóstico"
        )}
      </button>
    </div>
  );
};

export default React.memo(DiagnosisForm); 