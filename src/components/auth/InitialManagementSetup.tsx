import React, { useState } from 'react';
import { useManagement } from '../../contexts';
import { validateRequired, sanitizeInput } from '../../utils';

interface InitialManagementSetupProps {
  onComplete: (unitId: string, locationId: string) => void;
  onSkip: () => void;
  isLoading?: boolean;
}

interface SetupErrors {
  unitName?: string;
  locationName?: string;
}

const InitialManagementSetup: React.FC<InitialManagementSetupProps> = ({ 
  onComplete, 
  onSkip,
  isLoading = false 
}) => {
  const { createUnit, createLocation, loadAllData } = useManagement();
  
  const [setupData, setSetupData] = useState({
    unitName: '',
    locationName: ''
  });
  const [errors, setErrors] = useState<SetupErrors>({});
  const [isCreating, setIsCreating] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: SetupErrors = {};

    if (!validateRequired(setupData.unitName)) {
      newErrors.unitName = 'שם יחידה חובה';
    }

    if (!validateRequired(setupData.locationName)) {
      newErrors.locationName = 'שם מיקום חובה';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof typeof setupData, value: string) => {
    setSetupData(prev => ({
      ...prev,
      [field]: sanitizeInput(value)
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsCreating(true);
    try {
      // First create the unit
      const unitResult = await createUnit({ name: setupData.unitName });
      
      if (!unitResult.success) {
        alert('שגיאה ביצירת היחידה: ' + unitResult.error);
        return;
      }

      // Then create the location
      const locationResult = await createLocation({ 
        name: setupData.locationName, 
        unitId: unitResult.data!.id 
      });
      
      if (!locationResult.success) {
        alert('שגיאה ביצירת המיקום: ' + locationResult.error);
        return;
      }

      // Refresh management data
      await loadAllData();
      
      // Call completion handler with the created IDs
      onComplete(unitResult.data!.id, locationResult.data!.id);

    } catch (error) {
      console.error('Error creating initial management data:', error);
      alert('שגיאה ביצירת נתוני המערכת הראשוניים');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: '#f8f9fa',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      margin: 0,
      padding: '20px',
      zIndex: 1000,
      direction: 'rtl'
    }}>
      <div className="card shadow-lg" style={{ 
        maxWidth: '600px', 
        width: '100%', 
        maxHeight: '90vh',
        overflowY: 'auto'
      }}>
        <div className="card-header text-center bg-success text-white">
          <h2 className="mb-0">ברוך הבא למערכת!</h2>
          <p className="mb-0 mt-2">כמנהל ראשון, צור את הנתונים הראשוניים</p>
        </div>
        
        <div className="card-body p-4">
          <div className="alert alert-info mb-4">
            <i className="fas fa-info-circle me-2"></i>
            <strong>הגדרה ראשונית:</strong> יש ליצור לפחות יחידה אחת ומיקום אחד כדי שהמערכת תוכל לפעול.
            ניתן להוסיף יחידות ומיקומים נוספים מאוחר יותר בעמוד הניהול.
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="form-group mb-3">
              <label className="form-label required">
                <i className="fas fa-users me-2"></i>
                שם היחידה הראשונה
              </label>
              <input 
                className={`form-control ${errors.unitName ? 'is-invalid' : ''}`}
                value={setupData.unitName} 
                onChange={e => handleInputChange('unitName', e.target.value)}
                placeholder="למשל: יחידה 8200, חיל המודיעין, חטיבת תקשוב"
                required 
                disabled={isCreating || isLoading}
              />
              {errors.unitName && <div className="form-error">{errors.unitName}</div>}
            </div>
            
            <div className="form-group mb-4">
              <label className="form-label required">
                <i className="fas fa-map-marker-alt me-2"></i>
                שם המיקום הראשון
              </label>
              <input 
                className={`form-control ${errors.locationName ? 'is-invalid' : ''}`}
                value={setupData.locationName} 
                onChange={e => handleInputChange('locationName', e.target.value)}
                placeholder="למשל: בסיס צריפין, מחנה שלום, מחנה בהד 1"
                required 
                disabled={isCreating || isLoading}
              />
              {errors.locationName && <div className="form-error">{errors.locationName}</div>}
            </div>
            
            <div className="d-flex gap-2">
              <button 
                type="button" 
                className="btn btn-outline-secondary flex-fill"
                onClick={onSkip}
                disabled={isCreating || isLoading}
              >
                דלג לעת עתה
              </button>
              <button 
                type="submit" 
                className="btn btn-success flex-fill" 
                disabled={isCreating || isLoading}
              >
                {isCreating ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    יוצר נתונים...
                  </>
                ) : (
                  <>
                    <i className="fas fa-check me-2"></i>
                    צור וכנס למערכת
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default InitialManagementSetup;
