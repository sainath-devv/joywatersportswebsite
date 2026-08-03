import React, { useState, useRef, useEffect } from 'react';
import { RotateCcw } from 'lucide-react';

export interface SignaturePadProps {
  label?: string;
  onSignatureChange?: (signatureDataUrl: string) => void;
  onChange?: (signatureDataUrl: string) => void;
  initialValue?: string;
  value?: string;
  required?: boolean;
  error?: string;
}

export const SignaturePad: React.FC<SignaturePadProps> = ({
  label = 'Signature',
  onSignatureChange,
  onChange,
  initialValue = '',
  value = '',
  required = false,
  error
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [typedName, setTypedName] = useState('');
  const [mode, setMode] = useState<'draw' | 'type'>('draw');

  const emitSignature = (sigUrl: string) => {
    if (onSignatureChange) onSignatureChange(sigUrl);
    if (onChange) onChange(sigUrl);
  };

  const effectiveInitial = initialValue || value || '';

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions
    canvas.width = canvas.parentElement?.clientWidth || 320;
    canvas.height = 80;

    // Set line style
    ctx.strokeStyle = '#0f172a'; // slate-900
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (effectiveInitial && effectiveInitial.startsWith('data:image')) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
        setHasDrawn(true);
      };
      img.src = effectiveInitial;
    }
  }, []);

  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();

    if ('touches' in e && e.touches.length > 0) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
      };
    } else if ('clientX' in e) {
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    }
    return { x: 0, y: 0 };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (mode !== 'draw') return;
    if (e.cancelable) e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || mode !== 'draw') return;
    if (e.cancelable) e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasDrawn(true);
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      try {
        const dataUrl = canvas.toDataURL('image/png');
        emitSignature(dataUrl);
      } catch (err) {
        emitSignature(canvas.toDataURL());
      }
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
    setTypedName('');
    emitSignature('');
  };

  const handleTypedNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTypedName(val);
    if (val.trim()) {
      emitSignature(`typed:${val.trim()}`);
    } else {
      emitSignature('');
    }
  };

  return (
    <div className="space-y-1.5" id="field-signature">
      <div className="flex items-center justify-between text-xs">
        <label className="font-semibold text-slate-700 uppercase tracking-wide flex items-center gap-1">
          {label} {required && <span className="text-red-600">*</span>}
        </label>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setMode(mode === 'draw' ? 'type' : 'draw');
              clearCanvas();
            }}
            className="text-[11px] text-[#004E98] hover:underline font-medium cursor-pointer"
          >
            {mode === 'draw' ? 'Type signature instead' : 'Draw signature'}
          </button>
          <button
            type="button"
            onClick={clearCanvas}
            className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-red-600 cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            Clear
          </button>
        </div>
      </div>

      {mode === 'draw' ? (
        <div className={`relative border-2 border-dashed bg-slate-50/70 rounded p-1 ${error ? 'border-red-400 bg-red-50/30' : 'border-slate-300'}`}>
          <canvas
            ref={canvasRef}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
            className="w-full h-20 touch-none cursor-crosshair block"
          />
          {!hasDrawn && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-slate-400 text-xs italic">
              Sign here using touch or mouse...
            </div>
          )}
        </div>
      ) : (
        <div className={`border-b-2 border-dashed py-1 ${error ? 'border-red-400' : 'border-slate-400'}`}>
          <input
            type="text"
            value={typedName}
            onChange={handleTypedNameChange}
            placeholder="Type your full name as digital signature..."
            className="w-full bg-transparent italic text-sm text-slate-900 focus:outline-none"
          />
        </div>
      )}

      {error && (
        <p className="text-[11px] font-semibold text-red-600 mt-1">{error}</p>
      )}
    </div>
  );
};

export default SignaturePad;
