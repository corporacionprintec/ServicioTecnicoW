import React, { useRef, useEffect } from 'react';
import '../../cssGeneral/repairRequestForm/cameraCapture/cameraCapture.css';
// import { FaCamera, FaTimes } from 'react-icons/fa';

/**
 * Componente para capturar fotos con la cámara
 * @param {Object} props
 * @param {boolean} props.showCamera - Indica si se muestra la cámara
 * @param {function} props.onCapturePhoto - Función para capturar foto
 * @param {function} props.onCloseCamera - Función para cerrar la cámara
 * @param {React.RefObject} props.videoRef - Referencia al elemento video
 * @param {React.RefObject} props.canvasRef - Referencia al elemento canvas
 */
const CameraCapture = ({ 
  showCamera, 
  onCapturePhoto, 
  onCloseCamera, 
  videoRef, 
  canvasRef 
}) => {
  useEffect(() => {
    // Cleanup function to stop camera when component unmounts
    const videoEl = videoRef.current;
    return () => {
      if (videoEl && videoEl.srcObject) {
        videoEl.srcObject.getTracks().forEach(track => track.stop());
      }
    };
  }, [videoRef]);

  if (!showCamera) return null;
  
  return (
    <div className="camera-capture-container">
      <video ref={videoRef} autoPlay className="camera-capture-video"></video>
      <div className="camera-capture-btn-row">
        <button
          type="button"
          className="camera-capture-btn"
          onClick={onCapturePhoto}
        >
          <span role="img" aria-label="camera">📷</span> Capturar
        </button>
        <button
          type="button"
          className="camera-capture-btn cancel"
          onClick={onCloseCamera}
        >
          <span role="img" aria-label="cancel">❌</span> Cancelar
        </button>
      </div>
      <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
    </div>
  );
};

export default CameraCapture; 