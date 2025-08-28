import React, { useRef, useEffect, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';

interface Props {
  onSave: (base64: string) => void;
}

export const SignaturePad: React.FC<Props> = ({ onSave }) => {
  const sigRef = useRef<SignatureCanvas>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 450, height: 120 });

  useEffect(() => {
    const updateCanvasSize = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth;
        // Use container width minus padding (20px on each side)
        const availableWidth = containerWidth - 40;
        const newWidth = Math.max(300, availableWidth);
        
        setCanvasSize({
          width: newWidth,
          height: 120
        });

        // Force canvas to redraw with correct dimensions
        if (sigRef.current) {
          // Use a timeout to ensure the canvas is rendered with new dimensions
          setTimeout(() => {
            if (sigRef.current) {
              sigRef.current.getCanvas().width = newWidth;
              sigRef.current.getCanvas().height = 120;
              sigRef.current.getCanvas().style.width = `${newWidth}px`;
              sigRef.current.getCanvas().style.height = '120px';
            }
          }, 10);
        }
      }
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    
    return () => window.removeEventListener('resize', updateCanvasSize);
  }, []);

  const isSigRefValid = (ref: SignatureCanvas | null): ref is SignatureCanvas => {
    return ref !== null;
  };

  const handleClear = () => {
    if (isSigRefValid(sigRef.current)) {
      sigRef.current.clear();
      onSave('');
    }
  };

  const handleEnd = () => {
    if (isSigRefValid(sigRef.current) && !sigRef.current.isEmpty()) {
      const dataURL = sigRef.current.toDataURL('image/png');
      onSave(dataURL);
    }
  };

  return (
    <div className="signature-pad-container" ref={containerRef}>
      <div className="text-center mb-2">
        <small className="text-muted">
          <i className="fas fa-info-circle me-1"></i>
          חתום באזור הלבן למטה
        </small>
      </div>
      <div className="signature-canvas-wrapper">
        <SignatureCanvas
          ref={sigRef}
          penColor="black"
          onEnd={handleEnd}
          canvasProps={{
            width: canvasSize.width,
            height: canvasSize.height,
            className: 'signature-canvas',
            style: { 
              cursor: 'crosshair',
              width: `${canvasSize.width}px`,
              height: `${canvasSize.height}px`,
              touchAction: 'none',
              border: '2px solid #667eea',
              borderRadius: '8px',
              backgroundColor: 'white',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }
          }}
        />
      </div>
      <div className="text-center mt-3">
        <button 
          type="button" 
          className="btn btn-sm"
          onClick={handleClear}
          style={{
            background: 'rgba(255, 193, 7, 0.1)',
            border: '1px solid #ffc107',
            color: '#ffc107',
            padding: '8px 16px',
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: '500',
            transition: 'all 0.2s ease',
            cursor: 'pointer'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 193, 7, 0.2)';
            e.currentTarget.style.color = '#ffcd39';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 193, 7, 0.1)';
            e.currentTarget.style.color = '#ffc107';
          }}
        >
          <i className="fas fa-eraser me-2"></i>
          נקה חתימה
        </button>
      </div>
    </div>
  );
};
