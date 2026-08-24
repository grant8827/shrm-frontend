import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';

export interface SignaturePadHandle {
  clear: () => void;
  isEmpty: () => boolean;
  toDataURL: () => string | null;
}

interface SignaturePadProps {
  className?: string;
  onChange?: (isEmpty: boolean) => void;
}

// Lightweight HTML5 canvas signature pad — mouse + touch, no external
// dependency. Draws at the canvas's actual pixel resolution (accounting for
// devicePixelRatio) so signatures stay crisp, and exposes toDataURL() for
// submission as a base64 PNG.
const SignaturePad = forwardRef<SignaturePadHandle, SignaturePadProps>(({ className, onChange }, ref) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawingRef = useRef(false);
  const hasStrokeRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const [isEmpty, setIsEmpty] = useState(true);

  // Size the backing bitmap to the element's actual on-screen size so lines
  // aren't blurry or offset, and re-apply stroke style after any resize.
  const setupCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const ratio = window.devicePixelRatio || 1;
    canvas.width = rect.width * ratio;
    canvas.height = rect.height * ratio;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(ratio, ratio);
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#1f2937';
  };

  useEffect(() => {
    setupCanvas();
    const handleResize = () => {
      // Resizing would wipe the bitmap; simplest correct behavior is to
      // clear rather than distort an in-progress signature.
      clear();
      setupCanvas();
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getPoint = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const startDrawing = (x: number, y: number) => {
    drawingRef.current = true;
    lastPointRef.current = { x, y };
  };

  const draw = (x: number, y: number) => {
    if (!drawingRef.current) return;
    const ctx = canvasRef.current?.getContext('2d');
    const last = lastPointRef.current;
    if (!ctx || !last) return;
    ctx.beginPath();
    ctx.moveTo(last.x, last.y);
    ctx.lineTo(x, y);
    ctx.stroke();
    lastPointRef.current = { x, y };
    if (!hasStrokeRef.current) {
      hasStrokeRef.current = true;
      setIsEmpty(false);
      onChange?.(false);
    }
  };

  const stopDrawing = () => {
    drawingRef.current = false;
    lastPointRef.current = null;
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = getPoint(e.clientX, e.clientY);
    startDrawing(x, y);
  };
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = getPoint(e.clientX, e.clientY);
    draw(x, y);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const touch = e.touches[0];
    if (!touch) return;
    const { x, y } = getPoint(touch.clientX, touch.clientY);
    startDrawing(x, y);
  };
  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const touch = e.touches[0];
    if (!touch) return;
    const { x, y } = getPoint(touch.clientX, touch.clientY);
    draw(x, y);
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    hasStrokeRef.current = false;
    setIsEmpty(true);
    onChange?.(true);
  };

  useImperativeHandle(ref, () => ({
    clear,
    isEmpty: () => !hasStrokeRef.current,
    toDataURL: () => (hasStrokeRef.current ? canvasRef.current?.toDataURL('image/png') || null : null),
  }));

  return (
    <div className={className}>
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={stopDrawing}
        className="w-full h-40 bg-white border-2 border-dashed border-neutral-300 rounded-lg touch-none cursor-crosshair"
      />
      {isEmpty && (
        <p className="text-xs text-neutral-400 mt-1 text-center">Sign above using your mouse or finger</p>
      )}
    </div>
  );
});

SignaturePad.displayName = 'SignaturePad';

export default SignaturePad;
