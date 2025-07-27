import React from 'react';
import ServerError from '../ServerError';
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
      <div className="daily-report-container">
        <h2>דוח צ' יומי - {getCurrentDate()}</h2>
        <p>טוען נתונים...</p>
      </div>
    );
  }

  if (error) {
    return <ServerError />;
  }

  return (
    <div className="daily-report-container">
      <h2>דוח צ' יומי - {getCurrentDate()}</h2>
      <table className="report-table">
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
              <td>{item.itemName}</td>
              <td>{item.itemNumberId}</td>
              <td>{item.userName}</td>
              <td>{item.phoneNumber}</td>
              <td>
                <input
                  type="checkbox"
                  checked={item.isReported}
                  onChange={() => handleCheckboxChange(item.id)}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button className="submit-btn" onClick={handleSubmitReport}>
        עדכן דיווח
      </button>
    </div>
  );
};

export default DailyReport;
