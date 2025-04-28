import { useState, useEffect, useCallback, useRef } from "react";
import NotesSection from "./OsDetailComponents/NotesSection";
import ReceiptGenerator from "./OsDetailComponents/ReceiptGenerator";
import '../cssGeneral/osDetail/osDetail.css';

// Importar los componentes modulares directamente
import QrScannerSection from "./OsDetailComponents/QrScannerSection";
import MachineHistoryTable from "./OsDetailComponents/MachineHistoryTable";
import DiagnosisForm from "./OsDetailComponents/DiagnosisForm";
import ClientInfoCard from "./OsDetailComponents/ClientInfoCard";
import DeviceInfoCard from "./OsDetailComponents/DeviceInfoCard";
import ProblemDescriptionCard from "./OsDetailComponents/ProblemDescriptionCard";
import StatusUpdateCard, { DeliverySlider } from "./OsDetailComponents/StatusUpdateCard";
import LocationModal from "./OsDetailComponents/LocationModal";
import ReceiptActions from "./OsDetailComponents/ReceiptActions";

// Función auxiliar para extraer el ID de un enlace de Google Drive
const extractFileIdFromUrl = (url) => {
  const regex = /\/file\/d\/([^/]+)\//;
  const match = url.match(regex);
  return match ? match[1] : null;
};

const OsDetail = ({ showDetailsModal, setShowDetailsModal, currentRequest, onDeleteOrden }) => {
  // Estados generales
  const [allDataOfCurrentRequest, setAllDataOfCurrentRequest] = useState(null);
  const [audioData, setAudioData] = useState({ audioUrl: null });
  const [comment, setComment] = useState("");
  const [qrResult, setQrResult] = useState(null);
  const [machineHistory, setMachineHistory] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [hasCamera, setHasCamera] = useState(null);

  const [showLocationModal, setShowLocationModal] = useState(false);
  const [currentLocation, setCurrentLocation] = useState('');
  const [destinationLocation, setDestinationLocation] = useState('');

  //estado para manejar la seleccion y habilitacion del orden 
  const [selectedTipoServicio,setSelectedTipoServicio] = useState('');
  const [canVincular,setCanVincular] = useState(false);

  const [costoTotal, setCostoTotal] = useState(""); // Nuevo estado para el costo total
  // Estados para actualizar el dispositivo (diagnóstico e imagen)

  const [newOrderType, setNewOrderType] = useState(""); // Se ingresa el diagnóstico
  const [newOrderImage, setNewOrderImage] = useState(null); // Archivo de imagen
  const [showModelInput, setShowModelInput] = useState(false);
  const [dniTecnico, setDniTecnico] = useState("");

  // Estado para las notas
  const [notes, setNotes] = useState([]);

  // Estado para Toast
  const [toastMessage, setToastMessage] = useState({ show: false, text: "", variant: "" });

  // Estado para la generación de PDF
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  // URL del recibo en Google Drive
  const [reciboURL, setReciboURL] = useState(null);

  // Variables derivadas
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUpdatingDiagnostico, setIsUpdatingDiagnostico] = useState(false);

  // Estado para tabs
  const [activeTab, setActiveTab] = useState('details');

  // Estado para mostrar los botones de estado
  const [showStatusButtons, setShowStatusButtons] = useState(false);

  // Función para enviar el recibo por WhatsApp
  const handleSendWhatsApp = useCallback(() => {
    const telefono = allDataOfCurrentRequest?.data?.dispositivo?.cliente?.telefono;
    
    if (!telefono) {
      showToast("No se encontró el número de teléfono del cliente.", "warning");
      return;
    }
    
    // Formatear el número de teléfono (asegurarse que tenga formato internacional)
    let telefonoFormateado = telefono.replace(/\D/g, '');
    if (!telefonoFormateado.startsWith('51') && telefonoFormateado.length === 9) {
      telefonoFormateado = '51' + telefonoFormateado;
    }
    
    // Crear mensaje con el enlace al recibo
    const mensaje = `Hola, aquí está el recibo de servicio técnico de Importaciones Printec: ${reciboURL}`;
    
    // Abrir WhatsApp con el número y mensaje
    const whatsappURL = `https://wa.me/${telefonoFormateado}?text=${encodeURIComponent(mensaje)}`;
    window.open(whatsappURL, '_blank');
  }, [allDataOfCurrentRequest, reciboURL]);

  // Función para manejar la exportación del recibo
  const handleExportReceipt = useCallback(() => {
    // Verificar que exista un diagnóstico antes de generar el recibo
    if (!allDataOfCurrentRequest?.data?.dispositivo?.diagnostico) {
      showToast("Por favor, realiza tu diagnóstico primero", "warning");
      return;
    }
    
    setIsGeneratingPDF(true);
  }, [allDataOfCurrentRequest]);
  
  // Función de callback para cuando el PDF se genera correctamente
  const handlePDFSuccess = useCallback(() => {
    setIsGeneratingPDF(false);
    // Actualizar la URL del recibo después de subir
    setReciboURL(allDataOfCurrentRequest?.data?.dispositivo?.recibo);
    showToast("Recibo exportado correctamente", "success");
  }, [allDataOfCurrentRequest]);
  
  // Función de callback para cuando hay un error al generar el PDF
  const handlePDFError = useCallback((error) => {
    setIsGeneratingPDF(false);
    showToast("Error al generar el recibo: " + error.message, "danger");
  }, []);

  const showToast = useCallback((text, variant = "info") => {
    setToastMessage({ show: true, text, variant });
    setTimeout(() => {
      setToastMessage({ show: false, text: "", variant: "" });
    }, 3000);
  }, []);

  const renderStatusBadge = useCallback((status) => {
    switch (status) {
      case "pendiente":
        return <span className="badge badge-warning">Pendiente</span>;
      case "en_proceso":
        return <span className="badge badge-info">Diagnosticado</span>;
      case "entregado":
        return <span className="badge badge-dark">Entregado</span>;
      case "cancelado":
        return <span className="badge badge-danger">En Abandono</span>;
      default:
        return <span className="badge badge-secondary">Desconocido</span>;
    }
  }, []);

  // Actualiza la URL del audio grabado
  const handleAudioRecorded = useCallback((audioUrl) => {
    setAudioData({ audioUrl });
  }, []);

  const handleStatusChange = useCallback(async (newStatus) => {
    if (!currentRequest) return;
    try {
      const response = await fetch(
        `https://servidorserviciotecnico-production.up.railway.app/ordenes/${currentRequest.id}?estado=${newStatus}`,
        { method: "PATCH" }
      );
      const data = await response.json();
      if (data.status === "success") {
        setAllDataOfCurrentRequest(data);
      } else {
        showToast(data.message, "warning");
      }
    } catch (error) {
      console.error("Error al actualizar el estado:", error);
      showToast("Hubo un error al actualizar el estado.", "danger");
    }
  }, [currentRequest, showToast]);

  const handleVincularQR = useCallback(async () => {
    setIsUpdating(true);
    if (!qrResult || !qrResult.data) {
      showToast("No hay QR para vincular.", "warning");
      setIsUpdating(false);
      return;
    }

    const ordenId= allDataOfCurrentRequest?.data?.id;
    const dispositivoId= allDataOfCurrentRequest?.data?.dispositivo?.id;

    if (!dispositivoId) {
      showToast("No se encontró el dispositivo para vincular.", "warning");
      setIsUpdating(false);
      return;
    }

    try {
      // Actualizar primero el tipo de servicio
      const tipoServicioResponse = await fetch(
        `https://servidorserviciotecnico-production.up.railway.app/ordenes/${ordenId}/tipo-servicio`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tipoServicio: selectedTipoServicio
          })
        }
      );

      if (!tipoServicioResponse.ok) {
        showToast("Error al actualizar el tipo de servicio.", "warning");
        setIsUpdating(false);
        return;
      }

      const response = await fetch(
        `https://servidorserviciotecnico-production.up.railway.app/dispositivoscanup/${dispositivoId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            qr_scan: qrResult.data
          }),
        }
      );
      const data = await response.json();
      if (response.ok) {
        showToast("QR vinculado correctamente.", "success");
        setAllDataOfCurrentRequest((prev) => ({
          ...prev,
          data: {
            ...prev.data,
            dispositivo: {
              ...prev.data.dispositivo,
              qr_scan: data.dispositivo?.qr_scan || qrResult.data
            },
          },
        }));
      } else {
        showToast(data.message || "Error al vincular el QR.", "warning");
      }
    } catch (error) {
      console.error("Error al vincular el QR:", error);
      showToast("Error al vincular el QR.", "danger");
    } finally {
      setIsUpdating(false);
    }
  }, [qrResult, allDataOfCurrentRequest, selectedTipoServicio, showToast]);

  const handleUpdateLocation = useCallback(async () => {
    if (destinationLocation) {
      const ordenId = allDataOfCurrentRequest?.data?.id;
      try {
        const response = await fetch(
          `https://servidorserviciotecnico-production.up.railway.app/ordenes/${ordenId}/tipo-servicio`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              tipoServicio: destinationLocation
            })
          }
        );
        
        if (response.ok) {
          showToast("Ubicación actualizada correctamente", "success");
          setCurrentLocation(destinationLocation);
          setShowLocationModal(false);
        } else {
          showToast("Error al actualizar la ubicación", "danger");
        }
      } catch (error) {
        showToast("Error al actualizar la ubicación", "danger");
      }
    } else {
      showToast("Por favor seleccione una ubicación", "warning");
    }
  }, [allDataOfCurrentRequest, destinationLocation, showToast]);

  const handleUpdateDevice = useCallback(async () => {
    const dispositivoId = allDataOfCurrentRequest?.data?.dispositivo?.id;
    if (!dispositivoId) {
      showToast("No se encontró el dispositivo para actualizar.", "warning");
      return;
    }
    if (!newOrderType.trim()) {
      showToast("Por favor, ingrese un diagnóstico.", "warning");
      return;
    }
    
    // Validar que el costo total sea un número válido
    const costoTotalNum = parseFloat(costoTotal);
    if (isNaN(costoTotalNum) || costoTotalNum < 0) {
      showToast("Por favor, ingrese un costo total válido.", "warning");
      return;
    }
    setIsUpdatingDiagnostico(true);
    
    try {
      const formData = new FormData();
      formData.append("diagnostico", newOrderType);
      formData.append("dni_tecnico", dniTecnico);
      formData.append("costo_total", costoTotal); // Agregar el costo total al FormData
      if (newOrderImage) {
        formData.append("file", newOrderImage);
      }

      const response = await fetch(
        `https://servidorserviciotecnico-production.up.railway.app/api/dispositivos/${dispositivoId}/imagen-diagnostico`,
        {
          method: "PUT",
          body: formData,
        }
      );
      const data = await response.json();
      if (response.ok) {
        // Obtener el nombre y apellido del técnico del localStorage
        const storedUser = localStorage.getItem("currentUser");
        let nombreTecnico = "";
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          nombreTecnico = `${parsedUser.name} ${parsedUser.lastname}`;
        }

        // Actualizar también el campo detalles con el QR existente
        const qrScan = allDataOfCurrentRequest?.data?.dispositivo?.qr_scan;
        if (qrScan) {
          const detallesResponse = await fetch(
            `https://servidorserviciotecnico-production.up.railway.app/dispositivoscanup/${dispositivoId}`,
            {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ 
                qr_scan: qrScan,
                detalles: nombreTecnico
              }),
            }
          );
          
          if (detallesResponse.ok) {
            const detallesData = await detallesResponse.json();
            
            // Cambiar automáticamente el estado a "en_proceso" (diagnosticado)
            await handleStatusChange("en_proceso");
            
            showToast("Dispositivo y detalles actualizados correctamente", "success");
            
            setAllDataOfCurrentRequest((prev) => ({
              ...prev,
              data: {
                ...prev.data,
                dispositivo: {
                  ...prev.data.dispositivo,
                  ...data.dispositivo,
                  detalles: detallesData.dispositivo?.detalles || nombreTecnico
                },
              },
            }));
          } else {
            showToast("Dispositivo actualizado, pero hubo un error al actualizar los detalles", "warning");
            
            // Cambiar automáticamente el estado a "en_proceso" (diagnosticado)
            await handleStatusChange("en_proceso");
            
            setAllDataOfCurrentRequest((prev) => ({
              ...prev,
              data: {
                ...prev.data,
                dispositivo: {
                  ...prev.data.dispositivo,
                  ...data.dispositivo,
                },
              },
            }));
          }
        } else {
          showToast("Dispositivo actualizado correctamente", "success");
          
          // Cambiar automáticamente el estado a "en_proceso" (diagnosticado)
          await handleStatusChange("en_proceso");
          
          setAllDataOfCurrentRequest((prev) => ({
            ...prev,
            data: {
              ...prev.data,
              dispositivo: {
                ...prev.data.dispositivo,
                ...data.dispositivo,
              },
            },
          }));
        }
        setShowModelInput(false); // Ocultar inputs de diagnóstico al guardar exitosamente
      } else {
        showToast("Error al actualizar: " + data.message, "danger");
      }
    } catch (err) {
      console.error(err);
      showToast("Error al actualizar el dispositivo", "danger");
    } finally {
      setIsUpdatingDiagnostico(false);
    }
  }, [allDataOfCurrentRequest, costoTotal, dniTecnico, handleStatusChange, newOrderImage, newOrderType, showToast]);

  const handleAddNote = useCallback(() => {
    if (!comment.trim()) {
      showToast("Por favor, ingresa un comentario.", "warning");
      return;
    }
    const newNote = {
      id: notes.length + 1,
      text: comment,
      date: new Date().toLocaleString(),
    };
    setNotes([...notes, newNote]);
    setComment("");
  }, [comment, notes, showToast]);

  useEffect(() => {
    async function checkCamera() {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
          const devices = await navigator.mediaDevices.enumerateDevices();
          const videoDevices = devices.filter((device) => device.kind === "videoinput");
          setHasCamera(videoDevices.length > 0);
        } else {
          setHasCamera(false);
        }
      } catch (error) {
        console.error("Error al verificar la cámara:", error);
        setHasCamera(false);
      }
    }
    checkCamera();
  }, []);

  useEffect(() => {
    if (showDetailsModal && currentRequest?.id) {
      const storedUser = localStorage.getItem("currentUser");
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setDniTecnico(`${parsedUser.name} ${parsedUser.lastname}`);
      }
      async function getCurrentRequest(id) {
        try {
          const response = await fetch(
            `https://servidorserviciotecnico-production.up.railway.app/ordenes/${id}`
          );
          const data = await response.json();
          setAllDataOfCurrentRequest(data);
          
          // Actualizar también la URL del recibo
          if (data?.data?.dispositivo?.recibo) {
            setReciboURL(data.data.dispositivo.recibo);
          }
          
          if (data?.data?.dispositivo?.costo_total) {
            setCostoTotal(data.data.dispositivo.costo_total.toString());
          } else {
            setCostoTotal("");
          }
        } catch (error) {
          console.error("Error al obtener la solicitud:", error);
        }
      }
      getCurrentRequest(currentRequest?.id);
    } else {
      // Resetear estados cuando se cierra el modal
      setAllDataOfCurrentRequest(null);
      setQrResult(null);
      setMachineHistory(null);
      setNewOrderType("");
      setNewOrderImage(null);
      setCostoTotal("");
      setShowModelInput(false);
      setNotes([]);
      setComment("");
      setShowHistory(false);
    }
  }, [showDetailsModal, currentRequest]);

  useEffect(() => {
    if (allDataOfCurrentRequest?.data?.dispositivo?.qr_scan) {
      fetch(
        `https://servidorserviciotecnico-production.up.railway.app/dispositivos/validar-qr?qr=${encodeURIComponent(
          allDataOfCurrentRequest.data.dispositivo.qr_scan
        )}`
      )
        .then((response) => response.json())
        .then((data) => {
          if (data.valid && Array.isArray(data.data) && data.data.length > 0) {
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
            setMachineHistory(newEntries);
          }
        })
        .catch((error) => {
          console.error("Error fetching machine history:", error);
          showToast("Error al obtener historial de la máquina.", "danger");
        });
    }
  }, [allDataOfCurrentRequest, dniTecnico, showToast]);

  // Si el componente aún no tiene datos, no renderizar nada
  if (!showDetailsModal) {
    return null;
  }

  return (
    <div className="osd-modal">
      <div className="osd-modal-content">
        {allDataOfCurrentRequest && (
          <>
            <div className="osd-modal-header">
              <span className="osd-modal-title">
                Solicitud {allDataOfCurrentRequest.data.ticket}
                <span style={{ marginLeft: '1em' }}>
                  <span className={`badge badge-${allDataOfCurrentRequest.data.estado}`}>
                    {allDataOfCurrentRequest.data.estado === 'en_proceso' ? 'diagnosticado' : allDataOfCurrentRequest.data.estado}
                  </span>
                </span>
              </span>
              {/* Mostrar solo los nombres de técnicos si hay detalles, siempre */}
              {allDataOfCurrentRequest.data.dispositivo?.detalles && (
                <div style={{ color: '#fff', fontWeight: 500, marginTop: 4, fontSize: '1.05em' }}>
                  {Array.isArray(allDataOfCurrentRequest.data.dispositivo.detalles)
                    ? allDataOfCurrentRequest.data.dispositivo.detalles.filter(Boolean).join(', ')
                    : allDataOfCurrentRequest.data.dispositivo.detalles}
                </div>
              )}
              <button className="osd-modal-close" onClick={() => setShowDetailsModal(false)}>❌</button>
            </div>

            {toastMessage.show && (
              <div className="osd-modal-body" style={{ background: '#eaf3fb', color: '#1a4d7c', marginBottom: '1em', borderRadius: '6px', padding: '0.7em 1em' }}>
                {toastMessage.text}
              </div>
            )}

            <div className="osd-modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
              {/* Tabs puros */}
              <div className="osd-tabs">
                <button className={`osd-tab-btn${activeTab === 'details' ? ' active' : ''}`} onClick={() => setActiveTab('details')}>Detalles</button>
                <button className={`osd-tab-btn${activeTab === 'notes' ? ' active' : ''}`} onClick={() => setActiveTab('notes')}>📝 Diagnóstico avanzado</button>
              </div>
              <div className="osd-tab-content">
                {activeTab === 'details' && (
                  <>
                    <div className="osd-row mb-3">
                      <div className="osd-col-6">
                        <ClientInfoCard 
                          clientData={allDataOfCurrentRequest.data.dispositivo.cliente}
                          fechaIngreso={allDataOfCurrentRequest.data.fecha_ingreso}
                        />
                      </div>
                      <div className="osd-col-6">
                        <DeviceInfoCard 
                          deviceData={allDataOfCurrentRequest.data.dispositivo}
                          handleSendWhatsApp={handleSendWhatsApp}
                          reciboURL={reciboURL}
                          estado={allDataOfCurrentRequest.data.estado}
                        />
                      </div>
                    </div>

                    <div className="osd-row mb-3">
                      <div className="osd-col-12">
                        <QrScannerSection 
                          qrResult={qrResult}
                          setQrResult={setQrResult}
                          machineHistory={machineHistory}
                          setMachineHistory={setMachineHistory}
                          dniTecnico={dniTecnico}
                          showToast={showToast}
                          hasCamera={hasCamera}
                          allDataOfCurrentRequest={allDataOfCurrentRequest}
                          selectedTipoServicio={selectedTipoServicio}
                          setSelectedTipoServicio={setSelectedTipoServicio}
                          canVincular={canVincular}
                          setCanVincular={setCanVincular}
                          isUpdating={isUpdating}
                          handleVincularQR={handleVincularQR}
                          showHistory={showHistory}
                          setShowHistory={setShowHistory}
                          setShowModelInput={setShowModelInput}
                          setShowLocationModal={setShowLocationModal}
                        />

                        <MachineHistoryTable 
                          machineHistory={machineHistory}
                          showHistory={showHistory}
                        />

                        <DiagnosisForm 
                          showModelInput={showModelInput}
                          newOrderType={newOrderType}
                          setNewOrderType={setNewOrderType}
                          setNewOrderImage={setNewOrderImage}
                          costoTotal={costoTotal}
                          setCostoTotal={setCostoTotal}
                          handleUpdateDevice={handleUpdateDevice}
                          isUpdatingDiagnostico={isUpdatingDiagnostico}
                          showToast={showToast}
                        />
                      </div>
                    </div>

                    <ProblemDescriptionCard 
                      problema={allDataOfCurrentRequest.data.problema_descrito}
                      audio={allDataOfCurrentRequest.data.audio}
                      audio_id={allDataOfCurrentRequest.data.audio_id}
                      imagenes={allDataOfCurrentRequest.data.imagenes}
                    />

                    {/* Mostrar barra deslizable para entregar si el estado es 'en_proceso' */}
                    {allDataOfCurrentRequest.data.estado === 'en_proceso' && (
                      <DeliverySlider handleStatusChange={handleStatusChange} />
                    )}

                    {!showStatusButtons && (
                      <button className="osd-btn osd-btn-primary" style={{marginTop: '1em'}} onClick={() => setShowStatusButtons(true)}>
                        Cambiar estados
                      </button>
                    )}
                    {showStatusButtons && (
                      <StatusUpdateCard 
                        currentStatus={allDataOfCurrentRequest.data.estado}
                        handleStatusChange={handleStatusChange}
                        onClose={() => setShowStatusButtons(false)}
                      />
                    )}
                  </>
                )}
                {activeTab === 'notes' && (
                  <NotesSection
                    dispositivoId={allDataOfCurrentRequest.data.dispositivo.id}
                    onDiagnosisUpdated={(updatedDevice) => {}}
                  />
                )}
              </div>
            </div>

            <div className="osd-modal-footer">
              <button className="osd-btn osd-btn-primary" onClick={handleExportReceipt} disabled={isGeneratingPDF}>
                📄 Exportar Recibo
              </button>
              <button className="osd-btn osd-btn-danger" onClick={() => onDeleteOrden(currentRequest?.id)}>
                🗑️ Eliminar
              </button>
              <button className="osd-btn" onClick={() => setShowDetailsModal(false)}>
                ❌ Cerrar
              </button>
              {isGeneratingPDF && (
                <ReceiptGenerator 
                  orderData={allDataOfCurrentRequest} 
                  onSuccess={handlePDFSuccess}
                  onError={handlePDFError}
                />
              )}
            </div>

            <LocationModal 
              showLocationModal={showLocationModal}
              setShowLocationModal={setShowLocationModal}
              destinationLocation={destinationLocation}
              setDestinationLocation={setDestinationLocation}
              handleUpdateLocation={handleUpdateLocation}
              showToast={showToast}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default OsDetail;


