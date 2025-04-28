import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';

const AudioRecorder = forwardRef(({ onAudioRecorded, onError }, ref) => {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  useImperativeHandle(ref, () => ({
    startRecording,
    stopRecording,
  }));

  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stream?.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const options = { mimeType: 'audio/webm; codecs=opus' };
      mediaRecorderRef.current = new MediaRecorder(stream, options);

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { 
          type: mediaRecorderRef.current.mimeType
        });
        const audioFile = new File([audioBlob], `grabacion_${Date.now()}.webm`, {
          type: mediaRecorderRef.current.mimeType,
          lastModified: Date.now()
        });
        onAudioRecorded(audioFile);
        audioChunksRef.current = [];
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Error de grabación:', err);
      if (onError) {
         onError(`No se pudo grabar el audio: ${err.message}`);
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  return (
    <div className="audio-recorder">
      <button 
        type="button"
        onClick={isRecording ? stopRecording : startRecording}
        style={{ backgroundColor: isRecording ? '#ff4444' : '#4CAF50' }}
      >
        {isRecording ? '⏹ Detener' : '🎤 Grabar audio'}
      </button>
    </div>
  );
});

export default AudioRecorder;
