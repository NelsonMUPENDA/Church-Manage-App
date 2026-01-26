import React, { useEffect, useMemo, useRef, useState } from 'react';

export default function PhotoPicker({
  label,
  file,
  existingUrl,
  onChange,
  disabled,
  optional,
  className = '',
  labelClassName = '',
  optionalClassName = '',
  showPreview = true,
  captureFacingMode = 'environment',
}) {
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');

  const effectiveExistingUrl = useMemo(() => {
    if (previewUrl) return previewUrl;
    if (file instanceof File) return previewUrl;
    return existingUrl || '';
  }, [existingUrl, file, previewUrl]);

  useEffect(() => {
    if (!(file instanceof File)) {
      setPreviewUrl('');
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  useEffect(() => {
    return () => {
      const st = streamRef.current;
      streamRef.current = null;
      if (st) {
        try {
          st.getTracks().forEach((t) => t.stop());
        } catch {
        }
      }
    };
  }, []);

  const closeCamera = async () => {
    setCameraOpen(false);
    setCameraError('');
    const st = streamRef.current;
    streamRef.current = null;
    if (st) {
      try {
        st.getTracks().forEach((t) => t.stop());
      } catch {
      }
    }
  };

  const openCamera = async () => {
    if (disabled) return;
    setCameraError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: captureFacingMode },
        audio: false,
      });
      streamRef.current = stream;
      setCameraOpen(true);
      await new Promise((r) => setTimeout(r, 0));
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (e) {
      setCameraError("Impossible d'ouvrir la caméra.");
      await closeCamera();
    }
  };

  const capturePhoto = async () => {
    const video = videoRef.current;
    if (!video) return;
    const w = video.videoWidth || 1280;
    const h = video.videoHeight || 720;
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, w, h);

    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.92));
    if (!blob) return;

    const picked = new File([blob], `photo-${Date.now()}.jpg`, { type: 'image/jpeg' });
    onChange?.(picked);
    await closeCamera();
  };

  const pickFile = () => {
    if (disabled) return;
    fileInputRef.current?.click();
  };

  return (
    <div className={['w-full', className].join(' ')}>
      {label ? (
        <div className="flex items-center justify-between gap-2">
          <div className={labelClassName || 'text-xs font-extrabold text-gray-700 mb-1'}>{label}</div>
          {optional ? <div className={optionalClassName || 'text-[11px] text-gray-500'}>Optionnel</div> : null}
        </div>
      ) : null}

      {showPreview ? (
        <div className="mb-2">
          {effectiveExistingUrl ? (
            <img src={effectiveExistingUrl} alt={label || 'Photo'} className="h-24 w-24 rounded-2xl object-cover border border-gray-200" />
          ) : (
            <div className="h-24 w-24 rounded-2xl border border-dashed border-gray-200 bg-white/60" />
          )}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={(e) => onChange?.(e.target.files?.[0] || null)}
          className="hidden"
          disabled={disabled}
        />

        <button
          type="button"
          onClick={pickFile}
          disabled={disabled}
          className="h-9 px-3 rounded-xl text-sm bg-white/80 border border-gray-200 text-gray-900 shadow hover:shadow-md disabled:opacity-60"
        >
          Téléverser
        </button>

        <button
          type="button"
          onClick={openCamera}
          disabled={disabled}
          className="h-9 px-3 rounded-xl text-sm bg-white/80 border border-gray-200 text-gray-900 shadow hover:shadow-md disabled:opacity-60"
        >
          Caméra
        </button>

        <button
          type="button"
          onClick={() => onChange?.(null)}
          disabled={disabled}
          className="h-9 px-3 rounded-xl text-sm bg-rose-50 text-rose-700 border border-rose-100 disabled:opacity-60"
        >
          Retirer
        </button>
      </div>

      {cameraError ? <div className="mt-2 text-sm text-rose-700">{cameraError}</div> : null}

      {cameraOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={closeCamera} />
          <div className="relative w-full max-w-2xl rounded-3xl bg-white dark:bg-slate-900 border border-white/60 dark:border-white/10 shadow-2xl p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-extrabold text-gray-900 dark:text-white">Caméra</div>
              <button
                type="button"
                onClick={closeCamera}
                className="px-3 py-2 rounded-xl bg-white/80 border border-gray-200 text-gray-900 shadow hover:shadow-md"
              >
                Fermer
              </button>
            </div>

            <div className="mt-3 overflow-hidden rounded-2xl border border-gray-200 bg-black">
              <video ref={videoRef} className="w-full max-h-[60vh] object-contain" playsInline />
            </div>

            <div className="mt-3 flex justify-end gap-2">
              <button
                type="button"
                onClick={capturePhoto}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow hover:shadow-lg"
              >
                Capturer
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
