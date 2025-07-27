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
    <div>
      <SignatureCanvas
        ref={sigRef}
        penColor="black"
        onEnd={handleEnd}
        canvasProps={{
          width: 500,
          height: 200,
          className: 'border border-black rounded',
        }}
      />
      <div className="mt-2 flex gap-2">
        <button type="button" onClick={handleClear}>
          Clear
        </button>
      </div>
    </div>
  );
};
