import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AudioRecorder from './AudioRecorder';
import eytelImage from '../imagenes/eytel.jpeg';
import '../cssGeneral/repairRequestForm/repairRequestForm.css';

// Importación de componentes comunes
import NotificationBanner from './common/NotificationBanner';
import CameraCapture from './common/CameraCapture';
import ImagePreview from './common/ImagePreview';
import AudioPreview from './common/AudioPreview';
import SubmitButton from './common/SubmitButton';

const RepairRequestForm = ({ prefillData = {} }) => {

  // Estado para notificaciones fijas en la parte superior
  const [notification, setNotification] = useState(null);
  const notificationTimerRef = useRef(null);
  
  const showNotification = (message, type = 'danger') => {
    setNotification({ message, type });
    // Limpiar temporizador anterior si existe
    if (notificationTimerRef.current) {
      clearTimeout(notificationTimerRef.current);
    }
    // Guardar referencia al nuevo temporizador
    notificationTimerRef.current = setTimeout(() => {
      setNotification(null);
      notificationTimerRef.current = null;
    }, 5000);
  };

  const [formData, setFormData] = useState({
    nombreApellido: '',
    telefono: '',
    descripcionProblema: '',
    audioFile: null,
    fotos: [],
    qr_scan: '',
    tipoServicio: '', // Valor vacío inicialmente
    direccion: '',
    fechaHoraServicio: ''
  });

  // Eliminado: fechaHoraModo y setFechaHoraModo (no se utilizan)

  const [hasCamera, setHasCamera] = useState(true);
  const [hasMicrophone, setHasMicrophone] = useState(true);

  useEffect(() => {
    if (prefillData && Object.keys(prefillData).length > 0) {
      setFormData(prevData => ({
        ...prevData,
        nombreApellido: prefillData.nombreApellido || '',
        telefono: prefillData.telefono || '',
        qr_scan: prefillData.qr_scan || ''
      }));
    }
  }, [prefillData]);

  useEffect(() => {
    if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
      navigator.mediaDevices.enumerateDevices()
        .then(devices => {
          const foundCamera = devices.some(device => device.kind === 'videoinput');
          const foundMicrophone = devices.some(device => device.kind === 'audioinput');
          setHasCamera(foundCamera);
          setHasMicrophone(foundMicrophone);
        })
        .catch(error => {
          console.error('Error al enumerar dispositivos:', error);
          setHasCamera(false);
          setHasMicrophone(false);
        });
    } else {
      setHasCamera(false);
      setHasMicrophone(false);
    }
  }, []);

  const [loading, setLoading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const audioRecorderRef = useRef(null);
  const fileInputRef = useRef(null);

  const [audioURL, setAudioURL] = useState(null);
  const [photoURLs, setPhotoURLs] = useState([]);
  
  useEffect(() => {
    // Define la función dentro del efecto para evitar dependencias externas
    const createObjectURLs = (files) => {
      return files.map(file => URL.createObjectURL(file));
    };
    const newUrls = createObjectURLs(formData.fotos);
    setPhotoURLs(newUrls);
    // Limpieza al desmontar o cuando cambia la lista de fotos
    return () => {
      newUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [formData.fotos]);

  useEffect(() => {
    if (formData.audioFile) {
      if (audioURL) {
        URL.revokeObjectURL(audioURL);
      }
      const url = URL.createObjectURL(formData.audioFile);
      setAudioURL(url);
    } else {
      if (audioURL) {
        URL.revokeObjectURL(audioURL);
        setAudioURL(null);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.audioFile]);

  // Limpieza completa al desmontar
  useEffect(() => {
    const videoEl = videoRef.current;
    return () => {
      // Limpiar temporizador de notificación
      if (notificationTimerRef.current) {
        clearTimeout(notificationTimerRef.current);
      }
      // Revocar URLs de objetos
      if (photoURLs && photoURLs.length > 0) {
        photoURLs.forEach(url => URL.revokeObjectURL(url));
      }
      if (audioURL) {
        URL.revokeObjectURL(audioURL);
      }
      // Asegurar que la cámara esté detenida
      if (videoEl && videoEl.srcObject) {
        videoEl.srcObject.getTracks().forEach(track => track.stop());
      }
    };
  }, [audioURL, photoURLs]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({ ...prevData, [name]: value }));
  };

  // 1. Limitar tamaño máximo de imagen y duración de audio
  const MAX_IMAGE_SIZE_MB = 2;
  const MAX_AUDIO_DURATION_SEC = 30;

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (formData.fotos.length + files.length > 3) {
      showNotification('Solo puedes subir un máximo de 3 fotos.', 'warning');
      return;
    }

    // Validar tamaño de archivos
    for (const file of files) {
      if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
        showNotification(`La imagen "${file.name}" supera el tamaño máximo de ${MAX_IMAGE_SIZE_MB}MB.`, 'danger');
        return;
      }
    }

    // Optimizar imágenes antes de guardarlas
    const optimizedImages = [];
    let processingCount = files.length;
    
    files.forEach(file => {
      // Solo procesar archivos de imagen
      if (!file.type.startsWith('image/')) {
        processingCount--;
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          // Configurar dimensiones máximas
          const MAX_WIDTH = 1280;
          const MAX_HEIGHT = 720;
          
          let width = img.width;
          let height = img.height;
          
          // Redimensionar si es necesario
          if (width > MAX_WIDTH) {
            height = (height * MAX_WIDTH) / width;
            width = MAX_WIDTH;
          }
          
          if (height > MAX_HEIGHT) {
            width = (width * MAX_HEIGHT) / height;
            height = MAX_HEIGHT;
          }
          
          // Crear canvas para redimensionar
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          // Convertir a Blob con calidad reducida
          canvas.toBlob((blob) => {
            if (blob) {
              const optimizedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: new Date().getTime()
              });
              
              optimizedImages.push(optimizedFile);
            }
            
            processingCount--;
            // Cuando se han procesado todas las imágenes, actualizar el estado
            if (processingCount === 0) {
              setFormData(prevData => ({
                ...prevData,
                fotos: [...prevData.fotos, ...optimizedImages]
              }));
            }
          }, 'image/jpeg', 0.7); // Calidad del 70%
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleAudioRecorded = (audioFile) => {
    const audio = document.createElement('audio');
    audio.src = URL.createObjectURL(audioFile);

    const checkDuration = () => {
      if (audio.duration > MAX_AUDIO_DURATION_SEC) {
        showNotification(`El audio supera la duración máxima de ${MAX_AUDIO_DURATION_SEC} segundos.`, 'danger');
        URL.revokeObjectURL(audio.src);
      } else {
        setFormData(prevData => ({ ...prevData, audioFile }));
        setTimeout(() => URL.revokeObjectURL(audio.src), 1000);
      }
    };

    const validateDuration = () => {
      if (audio.duration === Infinity || isNaN(audio.duration)) {
        audio.currentTime = 1e101;
        audio.ontimeupdate = () => {
          audio.ontimeupdate = null;
          audio.currentTime = 0;
          checkDuration();
        };
      } else {
        checkDuration();
      }
    };

    audio.onloadedmetadata = validateDuration;
  };

  const handleTakePhoto = async () => {
    if (!hasCamera) return;
    setShowCamera(true);
    try {
      // Detener cualquier stream anterior si existe
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
      
      const constraints = { video: { facingMode: 'environment' } };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      showNotification('No se pudo acceder a la cámara. Por favor, revise los permisos de cámara en su navegador y reintente.', 'warning');
    }
  };

  const handleCapturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    // Establecer un tamaño máximo razonable
    const MAX_WIDTH = 1280;
    const MAX_HEIGHT = 720;
    
    let width = video.videoWidth;
    let height = video.videoHeight;
    
    // Calcular nuevas dimensiones manteniendo la relación de aspecto
    if (width > MAX_WIDTH) {
      const ratio = MAX_WIDTH / width;
      width = MAX_WIDTH;
      height = height * ratio;
    }
    
    if (height > MAX_HEIGHT) {
      const ratio = MAX_HEIGHT / height;
      height = MAX_HEIGHT;
      width = width * ratio;
    }
    
    canvas.width = width;
    canvas.height = height;
    context.drawImage(video, 0, 0, width, height);

    // Reducir calidad de la imagen
    canvas.toBlob((blob) => {
      const file = new File([blob], `foto_${Date.now()}.jpg`, { 
        type: 'image/jpeg', 
        lastModified: Date.now() 
      });
      
      if (formData.fotos.length >= 3) {
        showNotification('Solo puedes subir un máximo de 3 fotos.', 'warning');
        return;
      }
      
      setFormData(prevData => ({ 
        ...prevData, 
        fotos: [...prevData.fotos, file] 
      }));
    }, 'image/jpeg', 0.7); // Reducir calidad al 70%

    handleCloseCamera();
  };

  const handleCloseCamera = () => {
    setShowCamera(false);
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
    }
  };

  const handleRemovePhoto = (index) => {
    // Crear una copia del array de fotos sin la foto eliminada
    const updatedFotos = formData.fotos.filter((_, i) => i !== index);
    // Limpiar la URL correspondiente
    if (photoURLs[index]) {
      URL.revokeObjectURL(photoURLs[index]);
    }
    setFormData(prevData => ({
      ...prevData,
      fotos: updatedFotos
    }));
  };

  const handleRemoveAudio = () => {
    if (audioURL) {
      URL.revokeObjectURL(audioURL);
    }
    setFormData(prevData => ({ ...prevData, audioFile: null }));
  };

  const handleButtonHover = (e) => {
    e.currentTarget.style.transform = 'translateY(-3px)';
    e.currentTarget.style.boxShadow = '0 15px 30px rgba(29, 120, 78, 0.3)';
  };

  const handleButtonLeave = (e) => {
    e.currentTarget.style.transform = 'translateY(0)';
    e.currentTarget.style.boxShadow = '0 10px 25px rgba(29, 120, 78, 0.25)';
  };

  // Función para resetear el formulario
  const resetForm = () => {
    // Limpiar URLs antes de resetear
    if (photoURLs && photoURLs.length > 0) {
      photoURLs.forEach(url => URL.revokeObjectURL(url));
    }
    
    if (audioURL) {
      URL.revokeObjectURL(audioURL);
    }
    
    setFormData({
      nombreApellido: '',
      telefono: '',
      descripcionProblema: '',
      audioFile: null,
      fotos: [],
      qr_scan: '',
      tipoServicio: '',
      direccion: '',
      fechaHoraServicio: ''
    });
    
    // Limpiar URLs
    setPhotoURLs([]);
    setAudioURL(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Separamos el nombre y apellido
    const nameParts = formData.nombreApellido.trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    // Extraemos solo los dígitos del teléfono
    let telefonoFormateado = formData.telefono.replace(/\D/g, '');
    if (telefonoFormateado.length > 9) {
      telefonoFormateado = telefonoFormateado.slice(-9);
    }

    try {
      let imagenesLinks = null;
      if (formData.fotos.length > 0) {
        const photosFormData = new FormData();
        formData.fotos.forEach((foto) => {
          // Cambiamos el nombre del campo a 'files' que es probablemente lo que espera el servidor
          photosFormData.append('files', foto);
        });

        const uploadResponse = await fetch('https://servidorserviciotecnico-production.up.railway.app/upload/photos', {
          method: 'POST',
          body: photosFormData
        });

        if (!uploadResponse.ok) throw new Error('Error al subir las fotos');

        const uploadResult = await uploadResponse.json();
        imagenesLinks = JSON.stringify(uploadResult.uploadedFiles.map(file => file.webViewLink));
      }

      const mainFormData = new FormData();
      mainFormData.append('nombre', firstName);
      mainFormData.append('apellido', lastName);
      mainFormData.append('telefono', telefonoFormateado);
      mainFormData.append('descripcion_problema', formData.descripcionProblema);
      mainFormData.append('tipo_dispositivo', '');
      mainFormData.append('otro_dispositivo', '');
      mainFormData.append('marca', '');
      mainFormData.append('modelo', '');
      mainFormData.append('qr_scan', formData.qr_scan);

      if (formData.audioFile) mainFormData.append('audio', formData.audioFile);
      if (imagenesLinks) mainFormData.append('imagenes', imagenesLinks);

      mainFormData.append('tipoServicio', formData.tipoServicio);
      
      const response = await fetch('https://servidorserviciotecnico-production.up.railway.app/ordenes', {
        method: 'POST',
        body: mainFormData
      });

      if (response.ok) {
        const responseData = await response.json();
        const ticketNumber = responseData.data?.ticket || 'OS-PENDIENTE';
        
        // Mostrar notificación de éxito con el número de ticket
        showNotification(`✅ Solicitud enviada con éxito. Ticket: ${ticketNumber}`, 'success');
        
        // Resetear el formulario
        resetForm();
        
        // No navegamos a la página success, nos quedamos en el formulario
        setLoading(false);
      } else {
        showNotification('❌ Error al enviar la solicitud.', 'danger');
        setLoading(false);
      }
    } catch (error) {
      console.error('Error en el envío:', error);
      showNotification('❌ Error de conexión con el servidor.', 'danger');
      setLoading(false);
    }
  };

  return (
    <div className="repair-form-bg">
      {/* Usar el componente NotificationBanner en lugar de crear el div directamente */}
      <NotificationBanner notification={notification} />
      <div>
        <div className="repair-form-card">
          {/* Hero Section */}
          <div>
            <div className="repair-form-card-img-top">
              <img 
                src={eytelImage}
                alt="Servicio Técnico Eytel"
                className="repair-form-hero-img"
              />
            </div>
            <div className="repair-form-hero-overlay">
              <div className="repair-form-hero-title">
                <h1>
                  <span className="repair-form-hero-icon">🏭</span> 
                  <Link to="/login" className="repair-form-hero-link">
                    PRINTEC
                  </Link> 
                  <span className="repair-form-hero-icon">🔧</span>
                </h1>
                <p className="repair-form-hero-desc">
                  Formulario de Solicitud de Reparación
                </p>
              </div>
            </div>
          </div>
          <div className="repair-form-card-body">
            <div className="repair-form-p-4">
              <form onSubmit={handleSubmit} className="needs-validation">
                <div className="repair-form-row">
                  {/* Información Personal */}
                  <div className="repair-form-col-lg-6">
                    <div>
                      <h4 className="repair-form-section-title">
                        <span className="repair-form-section-icon">👤</span>
                        <span>Información Personal</span>
                      </h4>
                      <div>
                        <label className="repair-form-form-label">
                          <span role="img" aria-label="user">👤</span> 
                          Nombre y Apellido
                        </label>
                        <input
                          type="text"
                          className="repair-form-input"
                          name="nombreApellido"
                          value={formData.nombreApellido}
                          placeholder="Ej: Juan Pérez"
                          onChange={handleChange}
                          required
                        />
                      </div>
                      <div>
                        <label className="repair-form-form-label">
                          <span role="img" aria-label="phone">📞</span> 
                          Teléfono
                          <span className="repair-form-label-hint">(ej: +51 123456789)</span>
                        </label>
                        <input
                          type="tel"
                          className="repair-form-input"
                          name="telefono"
                          value={formData.telefono}
                          onChange={handleChange}
                          placeholder="Ej: +51 123456789"
                          required
                        />
                      </div>
                      <div style={{ display: 'none' }}>
                        <input
                          type="text"
                          className="repair-form-input"
                          name="qr_scan"
                          value={formData.qr_scan}
                          onChange={handleChange}
                        />
                      </div>
                    </div>
                  </div>
                  {/* Descripción, Audio y Fotos */}
                  <div className="repair-form-col-lg-6">
                    <div>
                      <h4 className="repair-form-section-title">
                        <span className="repair-form-section-icon">🛠️</span>
                        <span>Descripción del Problema</span>
                      </h4>
                      <div>
                        <textarea
                          className="repair-form-input"
                          name="descripcionProblema"
                          value={formData.descripcionProblema}
                          onChange={handleChange}
                          rows="4"
                          required
                          placeholder="Indique la marca de su equipo y describa el problema..."
                        ></textarea>
                      </div>
                      <div className="d-flex flex-wrap gap-2 mb-3">
                        <AudioRecorder 
                          ref={audioRecorderRef} 
                          onAudioRecorded={handleAudioRecorded}
                          onError={showNotification}
                        />
                        
                        <button
                          type="button"
                          className="repair-form-btn shadow-sm"
                          style={{ 
                            borderRadius: '10px',
                            padding: '10px 15px',
                            backgroundColor: '#1d784e',
                            color: 'white',
                            border: 'none',
                            transition: 'all 0.2s ease'
                          }}
                          onClick={handleTakePhoto}
                          disabled={!hasCamera}
                        >
                          <span role="img" aria-label="camera">📷</span> Tomar foto
                        </button>
                        
                        <button
                          type="button"
                          className="repair-form-btn shadow-sm"
                          style={{ 
                            borderRadius: '10px',
                            padding: '10px 15px',
                            backgroundColor: '#0c71a6',
                            color: 'white',
                            border: 'none',
                            transition: 'all 0.2s ease'
                          }}
                          onClick={() => fileInputRef.current && fileInputRef.current.click()}
                        >
                          <span role="img" aria-label="upload">⬆️</span> Subir imagen
                        </button>
                      </div>
                      
                      {!hasMicrophone && (
                        <div className="repair-form-alert mt-2 py-2" style={{ 
                          borderRadius: '10px', 
                          fontSize: '0.9rem',
                          backgroundColor: 'rgba(41, 128, 185, 0.15)',
                          border: '1px solid #1c6c99',
                          color: '#15557a'
                        }}>
                          <span role="img" aria-label="microphone">🎤</span> No se detectó un micrófono. Por favor, conecte uno y reintente.
                        </div>
                      )}
                      
                      {!hasCamera && (
                        <div className="repair-form-alert mt-2 py-2" style={{ 
                          borderRadius: '10px', 
                          fontSize: '0.9rem',
                          backgroundColor: 'rgba(41, 128, 185, 0.15)',
                          border: '1px solid #1c6c99',
                          color: '#15557a'
                        }}>
                          <span role="img" aria-label="camera">📷</span> No se detectó una cámara. Por favor, conecte una y reintente.
                        </div>
                      )}
                      
                      <input
                        type="file"
                        ref={fileInputRef}
                        style={{ display: 'none' }}
                        onChange={handleFileChange}
                        accept="image/*"
                        multiple
                      />
                      
                      {/* Usar componente CameraCapture en lugar del div anterior */}
                      <CameraCapture
                        showCamera={showCamera}
                        onCapturePhoto={handleCapturePhoto}
                        onCloseCamera={handleCloseCamera}
                        videoRef={videoRef}
                        canvasRef={canvasRef}
                      />
                      
                      {/* Usar componente ImagePreview en lugar del div anterior */}
                      <ImagePreview
                        photos={photoURLs}
                        onRemovePhoto={handleRemovePhoto}
                      />
                      
                      {/* Usar componente AudioPreview en lugar del div anterior */}
                      <AudioPreview
                        audioURL={audioURL}
                        onRemoveAudio={handleRemoveAudio}
                      />
                    </div>
                  </div>
                  <div className="repair-form-col-12 repair-form-mt-3">
                    <SubmitButton
                      text="Enviar Solicitud"
                      loading={loading}
                      onMouseOver={handleButtonHover}
                      onMouseOut={handleButtonLeave}
                    />
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RepairRequestForm;
