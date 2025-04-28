import React, { useState, useRef, useEffect } from "react";
import '../../cssGeneral/osDetail/qrScannerSection/qrScannerSection.css';
import QrScanner from "qr-scanner";

const QrScannerSection = ({ 
  qrResult,
  setQrResult,
  machineHistory,
  setMachineHistory,
  dniTecnico,
  showToast,
  hasCamera,
  allDataOfCurrentRequest,
  selectedTipoServicio,
  setSelectedTipoServicio,
  canVincular,
  setCanVincular,
  isUpdating,
  handleVincularQR,
  showHistory,
  setShowHistory,
  setShowModelInput,
  setShowLocationModal
}) => {
  const videoRef = useRef(null);
  const qrScannerRef = useRef(null);

  // Detener el escáner QR cuando el componente se desmonte
  useEffect(() => {
    return () => {
      if (qrScannerRef.current) {
        qrScannerRef.current.stop();
      }
    };
  }, []);

  const handleScanQR = () => {
    if (!hasCamera) {
      showToast("El dispositivo no tiene cámara.", "warning");
      return;
    }
    if (videoRef.current) {
      qrScannerRef.current = new QrScanner(
        videoRef.current,
        (result) => {
          setQrResult(result);
          setSelectedTipoServicio('');
          setCanVincular(false);
          qrScannerRef.current.stop();

          fetch(
            `https://servidorserviciotecnico-production.up.railway.app/dispositivos/validar-qr?qr=${encodeURIComponent(result.data)}`
          )
            .then((response) => response.json())
            .then((data) => {
              if (data.valid && Array.isArray(data.data) && data.data.length > 0) {
                // Mapeo del historial
                const newEntries = data.data.map((item, index) => ({
                  id: index + 1,
                  fecha: new Date().toLocaleDateString(),
                  descripcion:
                    item.problemas_descritos && item.problemas_descritos.length > 0
                      ? item.problemas_descritos[0]
                      : "Sin descripción",
                  cliente: {
                    nombre: item.nombre || "",
                    apellido: item.apellido || "",
                    telefono: item.telefono || "",
                  },
                  dispositivo: {
                    tipo_dispositivo: item.tipo_dispositivo || "",
                    marca: item.marca || "",
                    modelo: item.modelo || "",
                    diagnostico: item.diagnostico && item.diagnostico !== "" ? item.diagnostico : "Sin diagnóstico",
                    imagenen_diagnostico:
                      item.imagenen_diagnostico && item.imagenen_diagnostico !== ""
                        ? item.imagenen_diagnostico
                        : "",
                    dni_tecnico: dniTecnico,
                  },
                }));

                showToast(`QR validado: se encontraron ${newEntries.length} registros.`, "success");
                setMachineHistory(newEntries);
              } else {
                showToast("QR no registrado o formato incorrecto.", "warning");
              }
            })
            .catch((error) => {
              console.error("Error al validar el QR:", error);
              showToast("Error al validar el QR", "danger");
            });
        },
        {
          highlightScanRegion: true,
          highlightCodeOutline: true,
        }
      );
      qrScannerRef.current.start();
    }
  };

  return (
    <div className="qrs-card">
      <div className="qrs-card-header">
        <div className="qrs-card-title">Escanear QR</div>
      </div>
      <div className="qrs-card-body">
        {allDataOfCurrentRequest?.data?.dispositivo?.qr_scan ? (
          <>
            <p>QR vinculado: {allDataOfCurrentRequest.data.dispositivo.qr_scan}</p>
            <div className="qrs-btn-group">
              <button
                className="qrs-btn"
                onClick={() => {
                  setShowModelInput(true); 
                  setShowHistory(false);
                }}
                disabled={!allDataOfCurrentRequest?.data?.dispositivo?.qr_scan}
              >
                Diagnosticar
              </button>
              <button
                className="qrs-btn qrs-btn-outline"
                onClick={() => setShowHistory(!showHistory)}
              >
                {showHistory ? "Ocultar Historial" : "Ver Historial de la Máquina"}
              </button>
              <button
                className="qrs-btn qrs-btn-outline-info"
                onClick={() => setShowLocationModal(true)}
              >
                Máquina trasladada
              </button>
            </div>
          </>
        ) : (
          <>
            {!qrResult ? (
              <>
                {hasCamera === false ? (
                  <p>El dispositivo no tiene cámara para escanear QR.</p>
                ) : (
                  <div className="qrs-qr-video-container">
                    <video
                      ref={videoRef}
                      className="qrs-qr-video"
                      playsInline
                      muted
                    ></video>
                    {/* Overlay de guías visuales */}
                    <div className="qrs-qr-guide-overlay">
                      <div className="qrs-qr-corner qrs-qr-corner-tl"></div>
                      <div className="qrs-qr-corner qrs-qr-corner-tr"></div>
                      <div className="qrs-qr-corner qrs-qr-corner-bl"></div>
                      <div className="qrs-qr-corner qrs-qr-corner-br"></div>
                    </div>
                  </div>
                )}
                <button className="qrs-btn" onClick={handleScanQR} style={{ marginTop: '1em' }}>
                  Escanear QR
                </button>
              </>
            ) : (
              <>
                <p className="qrs-alert-info">QR escaneado: {qrResult.data}</p>
                <div style={{ marginTop: '1em' }}>
                  <div style={{ marginBottom: '1.5em' }}>
                    <h6 style={{ marginBottom: '1em', fontWeight: 600, color: '#265d97' }}>Seleccione lugar de atención:</h6>
                    <div className="qrs-radio-group">
                      <label className="qrs-radio-option">
                        <input
                          type="radio"
                          name="tipoServicio"
                          value="En Taller M."
                          checked={selectedTipoServicio === "En Taller M."}
                          onChange={(e) => {
                            setSelectedTipoServicio(e.target.value);
                            setCanVincular(true);
                          }}
                        />
                        <span className="qrs-radio-label">En Taller M.</span>
                      </label>
                      <label className="qrs-radio-option">
                        <input
                          type="radio"
                          name="tipoServicio"
                          value="En Tienda H."
                          checked={selectedTipoServicio === "En Tienda H."}
                          onChange={(e) => {
                            setSelectedTipoServicio(e.target.value);
                            setCanVincular(true);
                          }}
                        />
                        <span className="qrs-radio-label">En Tienda H.</span>
                      </label>
                    </div>
                  </div>
                  <div className="qrs-btn-group">
                    <button
                      className="qrs-btn"
                      onClick={handleVincularQR}
                      disabled={!canVincular || !selectedTipoServicio || isUpdating}
                    >
                      {isUpdating ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5em' }}>
                          <span className="spinner-border spinner-border-sm" role="status" style={{ width: '1em', height: '1em', borderWidth: '2px', marginRight: '0.5em' }}></span>
                          Actualizando...
                        </span>
                      ) : (
                        'Vincular QR'
                      )}
                    </button>
                    <button
                      className="qrs-btn qrs-btn-outline"
                      onClick={() => setShowHistory(!showHistory)}
                    >
                      {showHistory ? "Ocultar Historial" : "Ver Historial de la Máquina"}
                    </button>
                    <button
                      className="qrs-btn qrs-btn-outline"
                      onClick={() => {
                        setShowModelInput(true);
                        setShowHistory(false);
                      }}
                      disabled={!allDataOfCurrentRequest?.data?.dispositivo?.qr_scan}
                    >
                      Diagnosticar
                    </button>
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default React.memo(QrScannerSection); 