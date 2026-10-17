import React, { useRef, useState } from 'react';
import { UploadCloud, AlertCircle } from 'lucide-react';

const formatBytes = (bytes, decimals = 1) => {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};

const DropZone = ({
  onFileSelect,
  accept = '.jpg,.jpeg,.png',
  maxSize = 10 * 1024 * 1024, // 10MB default
  label = 'Tarik & letakkan foto jalan rusak di sini',
  sublabel = 'Mendukung format JPG, PNG dengan metadata koordinat GPS',
  icon = null,
  className = '',
  disabled = false,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const fileInputRef = useRef(null);

  const validateAndHandleFiles = (files) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    setErrorMessage('');

    if (maxSize && file.size > maxSize) {
      setErrorMessage(`Ukuran file melebihi batas maksimal ${formatBytes(maxSize)}`);
      return;
    }

    if (onFileSelect) {
      onFileSelect(file);
    }
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    setIsDragOver(true);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (disabled) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndHandleFiles(e.dataTransfer.files);
    }
  };

  const handleClick = () => {
    if (disabled) return;
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleInputChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndHandleFiles(e.target.files);
    }
  };

  return (
    <div className="w-full">
      <div
        onClick={handleClick}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`w-full border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center transition-all cursor-pointer flex flex-col items-center justify-center select-none active:scale-[0.99] ${
          isDragOver
            ? 'border-blue-500 bg-blue-50/70 scale-[1.01]'
            : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50/70 bg-white'
        } ${disabled ? 'opacity-50 cursor-not-allowed hover:border-slate-300 hover:bg-white' : ''} ${className}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleInputChange}
          className="hidden"
          disabled={disabled}
        />

        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center text-2xl mb-3 shadow-inner">
          {icon ? (
            typeof icon === 'string' ? (
              <span>{icon}</span>
            ) : (
              icon
            )
          ) : (
            <UploadCloud className="w-6 h-6 text-blue-600" />
          )}
        </div>

        <p className="text-xs sm:text-sm font-bold text-slate-800 tracking-tight mb-1">
          {label}
        </p>

        <p className="text-[11px] sm:text-xs text-slate-500 max-w-sm mb-3">
          {sublabel}
        </p>

        <div className="flex items-center gap-2 text-[10px] sm:text-[11px] text-slate-400 font-medium">
          <span>Format: {accept}</span>
          <span>•</span>
          <span>Maks: {formatBytes(maxSize)}</span>
        </div>
      </div>

      {errorMessage && (
        <div className="mt-2 text-xs text-rose-600 font-semibold flex items-center justify-center gap-1.5 text-center">
          <AlertCircle className="w-3.5 h-3.5" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
};

export default DropZone;
