import React, { useState, useEffect, useRef } from 'react';
import '../cssGeneral/employeeDashboard/employeeDashboard.css';
import { useNavigate } from 'react-router-dom';
import OsDetail from './OsDetail';
import { useAuth } from '../contexts/AuthContext';
import QrScanner from 'qr-scanner';
import QrScannerComponent from './QrScannerComponent';

const API_URL = "https://servidorserviciotecnico-production.up.railway.app/ordenes";

const useOrdenes = (refreshTrigger) => {
  const [ordenes, setOrdenes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const fetchOrdenes = async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}?page=1&limit=10000`);
      const data = await response.json();
      const nuevasOrdenes = data.data.ordenes.sort((a, b) =>
        new Date(b.createdAt) - new Date(a.createdAt)
      );
      setOrdenes(nuevasOrdenes);
    } catch (error) {} finally {
      setIsLoading(false);
    }
  };
  useEffect(() => { fetchOrdenes(); }, [refreshTrigger]);
  return { ordenes, isLoading };
};

function TechnicianDashboard() {
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const limit = 15;
  const [page, setPage] = useState(1);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [searchQRCode, setSearchQRCode] = useState('');
  const [searchPhone, setSearchPhone] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showEliminados, setShowEliminados] = useState(false);
  const [showAbandonados, setShowAbandonados] = useState(false);
  const [filterTipoServicio, setFilterTipoServicio] = useState('');
  const { ordenes, isLoading } = useOrdenes(refreshTrigger);
  const { currentUser, login } = useAuth();
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [currentRequest, setCurrentRequest] = useState(null);
  const [showQrModal, setShowQrModal] = useState(false);
  const [hasCamera, setHasCamera] = useState(true);
  const videoRef = useRef(null);
  const qrScannerRef = useRef(null);
  const [qrScanMode, setQrScanMode] = useState('camera');
  const fileInputRef = useRef(null);
  useEffect(() => { setPage(1); }, [searchQRCode, searchPhone, filterStatus, showEliminados, showAbandonados, filterTipoServicio]);
  useEffect(() => {
    const storedDni = localStorage.getItem('dni');
    const storedRole = localStorage.getItem('role');
    const storedToken = localStorage.getItem('token');
    if (storedDni && storedRole && storedToken && !currentUser) {
      login(storedDni, storedRole, storedToken)
        .then(() => setIsLoadingAuth(false))
        .catch(() => {
          localStorage.removeItem('dni');
          localStorage.removeItem('role');
          localStorage.removeItem('token');
          window.location.href = '/login';
        });
    } else {
      setIsLoadingAuth(false);
    }
  }, [currentUser, login]);
  useEffect(() => {
    const checkCameraAvailability = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const hasCam = devices.some(device => device.kind === 'videoinput');
        setHasCamera(hasCam);
      } catch (error) { setHasCamera(false); }
    };
    checkCameraAvailability();
  }, []);
  useEffect(() => {
    return () => {
      if (qrScannerRef.current) {
        qrScannerRef.current.stop();
        qrScannerRef.current.destroy();
      }
    };
  }, []);
  const onDeleteOrden = async (id) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar esta solicitud?')) return;
    try {
      const response = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
      const data = await response.json();
      if (data.status === 'success') {
        setRefreshTrigger(prev => prev + 1);
        setShowDetailsModal(false);
      } else { alert(data.message); }
    } catch (error) { alert("Error al eliminar la orden"); }
  };
  const handleScanQR = () => { setQrScanMode('camera-only'); setShowQrModal(true); };
  const handleUploadQR = () => { if (fileInputRef.current) fileInputRef.current.click(); };
  const handleQrImageSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const result = await QrScanner.scanImage(file);
      if (result) handleQrResult(result);
    } catch (error) { alert("No se pudo detectar un código QR en la imagen seleccionada."); }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };
  const handleQrResult = (qrData) => { if (qrData) setSearchQRCode(qrData); };
  useEffect(() => {
    if (!ordenes) return;
    let ordenesFiltered = [...ordenes];
    if (showEliminados === 'con') {
      ordenesFiltered = ordenesFiltered.filter(orden => 
        orden.dispositivo && 
        orden.dispositivo.recibo && 
        orden.dispositivo.recibo !== "" && 
        orden.dispositivo.recibo !== null && 
        orden.dispositivo.recibo !== "null" && 
        orden.dispositivo.recibo !== undefined
      );
    } else if (showEliminados === 'sin') {
      ordenesFiltered = ordenesFiltered.filter(orden => 
        !orden.dispositivo || 
        !orden.dispositivo.recibo || 
        orden.dispositivo.recibo === "" || 
        orden.dispositivo.recibo === null || 
        orden.dispositivo.recibo === "null" || 
        orden.dispositivo.recibo === undefined
      );
    }
    ordenesFiltered = ordenesFiltered.filter(orden => orden.estado !== 'acudiendo' && orden.estado !== 'atentido');
    if (showEliminados) {
      ordenesFiltered = ordenesFiltered.filter(orden => orden.costo_acordado);
    } else if (showAbandonados) {
      ordenesFiltered = ordenesFiltered.filter(orden => orden.estado === 'cancelado');
    } else {
      ordenesFiltered = ordenesFiltered.filter(orden => !orden.costo_acordado);
    }
    if (searchQRCode) {
      ordenesFiltered = ordenesFiltered.filter(orden =>
        orden.dispositivo.qr_scan.toLowerCase().includes(searchQRCode.toLowerCase())
      );
    }
    if (searchPhone) {
      ordenesFiltered = ordenesFiltered.filter(orden => {
        const phone = orden.dispositivo.cliente.telefono || '';
        const name = orden.dispositivo.cliente.nombre || '';
        return phone.includes(searchPhone) || 
               name.toLowerCase().includes(searchPhone.toLowerCase());
      });
    }
    if (filterStatus) {
      ordenesFiltered = ordenesFiltered.filter(orden => orden.estado === filterStatus);
    }
    if (filterTipoServicio) {
      ordenesFiltered = ordenesFiltered.filter(orden => orden.tipoServicio === filterTipoServicio);
    }
    setFilteredRequests(ordenesFiltered);
  }, [searchQRCode, searchPhone, ordenes, filterStatus, showEliminados, showAbandonados, filterTipoServicio]);
  const totalFiltered = filteredRequests.length;
  const currentTotalPages = Math.ceil(totalFiltered / limit);
  const requestsToDisplay = filteredRequests.slice((page - 1) * limit, page * limit);
  const renderStatusBadge = (status) => {
    switch (status) {
      case 'pendiente':
        return <span className="badge badge-warning">⏳ Pendiente</span>;
      case 'en_proceso':
        return <span className="badge badge-info">🔧 Diagnosticado</span>;
      case 'entregado':
        return <span className="badge badge-dark">📦 Entregado</span>;
      case 'cancelado':
        return <span className="badge badge-danger">🚫 En Abandono</span>;
      default:
        return <span className="badge badge-secondary">{status}</span>;
    }
  };
  const handleRequestClick = (request) => {
    if (!showEliminados && request.costo_acordado) return;
    setCurrentRequest(request);
    setShowDetailsModal(true);
  };
  const handlePrevious = () => { if (page > 1) setPage(page - 1); };
  const handleNext = () => { if (page < currentTotalPages) setPage(page + 1); };
  const technicianInfo = currentUser ? {
    nombre: currentUser.name,
    apellido: currentUser.lastname,
    id: currentUser.id,
    especialidad: 'Técnico especializado'
  } : {
    nombre: 'Técnico no identificado',
    id: 'N/A',
    especialidad: 'N/A'
  };
  const handleLogout = () => {
    localStorage.removeItem('dni');
    localStorage.removeItem('role');
    localStorage.removeItem('token');
    window.location.href = '/login';
  };
  const handleGoBack = () => {
    navigate('/');
  };
  if (isLoadingAuth) return <div>Cargando...</div>;
  if (!currentUser) { window.location.href = '/login'; return null; }
  const filterOptions = [
    { value: "pendiente", label: "Pendiente" },
    { value: "en_proceso", label: "Diagnosticado" },
    { value: "entregado", label: "Entregado" }
  ];
  const tipoServicioOptions = [
    { value: "En Tienda H.", label: "En Tienda H." },
    { value: "En Taller M.", label: "En Taller M." }
  ];

  return (
    <div>
      {/* Navbar */}
      <div className="ed-navbar">
        <div className="ed-navbar-left">
          <span className="ed-navbar-logo">🛠️ PRINTEC Dashboard</span>
        </div>
        <div className="ed-navbar-center">
          <span className="ed-navbar-user">👨‍🔧 {technicianInfo.nombre.split(' ')[0]} {technicianInfo.apellido.split(' ')[0]}</span>
        </div>
        <div className="ed-navbar-right">
          <button className="ed-btn ed-btn-green" onClick={handleGoBack}>⬅️ Nueva Hoja de Atención</button>
          <button className="ed-btn ed-btn-red" onClick={handleLogout}>⏏️ Cerrar sesión</button>
        </div>
      </div>
      {/* Contenido principal */}
      <div className="ed-main-content">
        <div className="ed-table-card">
          <div className="ed-table-header">
            <span className="ed-table-title">📋 Solicitudes de Reparación</span>
            <div className="ed-table-controls">
              <input className="ed-input" placeholder="🔍 Buscar por nombre o teléfono..." value={searchPhone} onChange={e => setSearchPhone(e.target.value)} />
              <button className="ed-btn ed-btn-blue" onClick={handleScanQR}>📷 Buscar QR</button>
              <button className="ed-btn ed-btn-purple" onClick={handleUploadQR}>🖼️ Cargar imagen QR</button>
              <select className="ed-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                <option value="">Todos los estados</option>
                {filterOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
              <select className="ed-select" value={filterTipoServicio} onChange={e => setFilterTipoServicio(e.target.value)}>
                <option value="">Ver ubicaciones</option>
                {tipoServicioOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
              <button className="ed-btn ed-btn-red" onClick={() => setShowEliminados(!showEliminados)}>
                🗑️ Ver eliminados
              </button>
            </div>
            <input type="file" ref={fileInputRef} accept="image/*" onChange={handleQrImageSelect} style={{ display: 'none' }} />
          </div>
          <div className="ed-table-responsive">
            <table className="ed-table">
              <thead>
                <tr>
                  <th>📞 Teléfono</th>
                  <th>📅 Fecha</th>
                  <th>🔖 Estado</th>
                </tr>
              </thead>
              <tbody>
                {requestsToDisplay.length > 0 ? (
                  requestsToDisplay.map(orden => (
                    <tr key={orden.id} className="order-row" onClick={() => handleRequestClick(orden)}>
                      <td>
                        <div className="ed-table-phone">
                          <a href={`tel:${orden.dispositivo.cliente.telefono}`} className="ed-btn ed-btn-pink" onClick={e => e.stopPropagation()}>📞</a>
                          <a href={`https://wa.me/+51${orden.dispositivo.cliente.telefono.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="ed-btn ed-btn-green" onClick={e => e.stopPropagation()}>💬</a>
                          <span className="ed-table-phone-number">{orden.dispositivo.cliente.telefono || 'N/A'}</span>
                        </div>
                      </td>
                      <td>{new Date(orden.createdAt).toLocaleDateString()}</td>
                      <td>{renderStatusBadge(orden.estado)}{orden.tipoServicio && <div className="ed-tipo-servicio">• {orden.tipoServicio}</div>}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="3" className="text-center">No se encontraron solicitudes que coincidan con la búsqueda</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {totalFiltered > limit && (
            <div className="ed-pagination">
              <button className="ed-btn" disabled={page === 1} onClick={handlePrevious}>⬅️</button>
              <span className="ed-pagination-info">Página {page} de {currentTotalPages}</span>
              <button className="ed-btn" disabled={page === currentTotalPages} onClick={handleNext}>➡️</button>
            </div>
          )}
        </div>
        <OsDetail 
          showDetailsModal={showDetailsModal} 
          setShowDetailsModal={setShowDetailsModal} 
          currentRequest={currentRequest} 
          onDeleteOrden={onDeleteOrden}
        />
        <QrScannerComponent
          show={showQrModal}
          onHide={() => setShowQrModal(false)}
          onScan={handleQrResult}
          title="Escanear código QR"
          initialMode={qrScanMode}
          hideOptions={qrScanMode === 'camera-only'}
        />
      </div>
    </div>
  );
}

export default TechnicianDashboard;