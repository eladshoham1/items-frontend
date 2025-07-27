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
      reported: item.isReported,
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
            <div className="spinner"></div>
            <span>טוען נתונים...</span>
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
          <table className="table">
            <thead>
              <tr>
                <th>שם פריט</th>
                <th>מספר</th>
                <th>שם החותם</th>
                <th>מספר טלפון</th>
                <th>האם דיווח</th>
              </tr>
            </thead>
            <tbody>
              {reportItems.map(item => (
                <tr key={item.id}>
                  <td>{item.itemName}</td>
                  <td>{item.itemNumberId}</td>
                  <td>{item.userName}</td>
                  <td>{item.phoneNumber}</td>
                  <td>
                    <input
                      type="checkbox"
                      checked={item.isReported}
                      onChange={() => handleCheckboxChange(item.id)}
                      className="form-control"
                      style={{ width: 'auto' }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="btn-group btn-group-end mt-4">
          <button className="btn btn-primary" onClick={handleSubmitReport}>
            עדכן דיווח
          </button>
        </div>
      </div>
    </div>
  );
};

export default DailyReport;
