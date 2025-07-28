import React from 'react';
import { ServerError } from '../../shared/components';
import { useReports } from '../../hooks';
import { getCurrentDate } from '../../utils';
import { ReportStatusUpdate } from '../../types';

const DailyReport: React.FC = () => {
  const { reportItems, loading, error, updateReportStatus, toggleReportStatus } = useReports();

  const handleCheckboxChange = (id: string) => {
    toggleReportStatus(id);
  };

  const handleSubmitReport = async () => {
    const reportUpdates: ReportStatusUpdate[] = reportItems.map(item => ({
      id: item.id,
      status: item.isReported || false,
    }));

    const success = await updateReportStatus(reportUpdates);
    
    if (success) {
      alert('דיווח נשלח בהצלחה');
    } else {
      alert('שגיאה בשליחת הדיווח');
    }
  };

  if (loading) {
    return (
      <div className="card">
        <div className="card-header">
          <h2 className="mb-0">דוח יומי - {getCurrentDate()}</h2>
        </div>
        <div className="card-body">
          <div className="alert alert-info">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">טוען...</span>
            </div>
            <span className="ms-2">טוען נתונים...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return <ServerError />;
  }

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="mb-0">דוח יומי - {getCurrentDate()}</h2>
      </div>
      <div className="card-body">
        <div className="table-responsive">
          <table className="table table-striped">
            <thead>
              <tr>
                <th>שם פריט</th>
                <th>מספר צ'</th>
                <th>שם החותם</th>
                <th>מספר טלפון</th>
                <th>האם דיווח</th>
              </tr>
            </thead>
            <tbody>
              {reportItems.map(item => (
                <tr key={item.id}>
                  <td>{item.name}</td>
                  <td>{item.idNumber}</td>
                  <td>{item.userName}</td>
                  <td>{item.phoneNumber}</td>
                  <td>
                    <input
                      type="checkbox"
                      checked={item.isReported || false}
                      onChange={() => handleCheckboxChange(item.id)}
                      className="form-check-input"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {reportItems.length > 0 && (
          <div className="d-flex justify-content-end mt-4">
            <button className="btn btn-primary" onClick={handleSubmitReport}>
              עדכן דיווח
            </button>
          </div>
        )}
        {reportItems.length === 0 && (
          <div className="alert alert-info text-center">
            אין פריטים לדיווח
          </div>
        )}
      </div>
    </div>
  );
};

export default DailyReport;
