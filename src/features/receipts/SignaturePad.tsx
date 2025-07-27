import React, { useRef } from 'react';
import SignatureCanvas from 'react-signature-canvas';

interface Props {
  onSave: (base64: string) => void;
}

export const SignaturePad: React.FC<Props> = ({ onSave }) => {
  const sigRef = useRef<SignatureCanvas>(null);

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
    <div className="signature-pad-container">
      <div className="text-center mb-2">
        <small className="text-muted">
          <i className="fas fa-info-circle me-1"></i>
          חתום באזור הלבן למטה
        </small>
      </div>
      <div className="d-flex justify-content-center">
        <SignatureCanvas
          ref={sigRef}
          penColor="black"
          onEnd={handleEnd}
          canvasProps={{
            width: Math.min(450, window.innerWidth - 100),
            height: 120,
            className: 'border border-2 border-primary rounded shadow-sm bg-white',
            style: { cursor: 'crosshair', maxWidth: '100%' }
          }}
        />
      </div>
      <div className="text-center mt-3">
        <button 
          type="button" 
          className="btn btn-outline-warning btn-sm"
          onClick={handleClear}
        >
          <i className="fas fa-eraser me-2"></i>
          נקה חתימה
        </button>
      </div>
    </div>
  );
};
