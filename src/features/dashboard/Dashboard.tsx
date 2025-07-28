import React, { useState, useMemo } from 'react';
import { useDashboardStats } from '../../hooks';
import ServerError from '../../shared/components/ServerError';
import { SignUser } from '../../types';

const Dashboard: React.FC = () => {
  const { stats, loading, error } = useDashboardStats();
  const [tooltipData, setTooltipData] = useState<{
    show: boolean;
    users: SignUser[];
    position: { x: number; y: number };
  }>({
    show: false,
    users: [],
    position: { x: 0, y: 0 }
  });

  // Extract unique locations and items from the data
  const { items, locations } = useMemo(() => {
    if (!stats || typeof stats !== 'object') return { items: [], locations: [] };
    
    try {
      const items = Object.keys(stats);
      const locationSet = new Set<string>();
      
      items.forEach(item => {
        if (stats[item] && stats[item].locations && typeof stats[item].locations === 'object') {
          Object.keys(stats[item].locations).forEach(location => {
            if (location && typeof location === 'string') {
              locationSet.add(location);
            }
          });
        }
      });
      
      return { items, locations: Array.from(locationSet).sort() };
    } catch (error) {
      console.error('Error processing dashboard stats:', error);
      return { items: [], locations: [] };
    }
  }, [stats]);

  const handleCellClick = (event: React.MouseEvent, users: SignUser[]) => {
    if (users.length === 0) return;
    
    const rect = event.currentTarget.getBoundingClientRect();
    setTooltipData({
      show: true,
      users,
      position: {
        x: rect.left + rect.width / 2,
        y: rect.top
      }
    });
  };

  const handleCloseTooltip = () => {
    setTooltipData(prev => ({ ...prev, show: false }));
  };

  const getCellData = (itemName: string, location: string) => {
    try {
      if (!stats || !stats[itemName] || !stats[itemName].locations || !stats[itemName].locations[location]) {
        return { signedQuantity: 0, totalQuantity: 0, users: [] };
      }
      
      const locationData = stats[itemName].locations[location];
      if (!locationData || !locationData.signUsers || !Array.isArray(locationData.signUsers)) {
        return { signedQuantity: 0, totalQuantity: 0, users: [] };
      }
      
      const users = locationData.signUsers;
      const signedQuantity = users.reduce((sum, user) => {
        return sum + (user && typeof user.quantity === 'number' ? user.quantity : 0);
      }, 0);
      const totalQuantity = stats[itemName] && typeof stats[itemName].quantity === 'number' ? stats[itemName].quantity : 0;
      
      return { signedQuantity, totalQuantity, users };
    } catch (error) {
      console.error('Error getting cell data:', error, { itemName, location });
      return { signedQuantity: 0, totalQuantity: 0, users: [] };
    }
  };

  // Calculate total signed quantities per item (across all locations)
  const getItemSignedTotal = (itemName: string) => {
    try {
      if (!locations || !Array.isArray(locations) || !stats || !stats[itemName]) {
        return 0;
      }
      
      return locations.reduce((total, location) => {
        if (!location || typeof location !== 'string') return total;
        const { signedQuantity } = getCellData(itemName, location);
        return total + (typeof signedQuantity === 'number' ? signedQuantity : 0);
      }, 0);
    } catch (error) {
      console.error('Error calculating item signed total:', error, { itemName });
      return 0;
    }
  };

  if (loading) {
    return (
      <div className="card">
        <div className="card-header">
          <h2 className="mb-0">לוח בקרה</h2>
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

  if (error || !stats) {
    return <ServerError />;
  }

  return (
    <>
      <div className="card shadow-lg border-0" style={{ borderRadius: '12px', overflow: 'hidden' }}>
        <div 
          className="card-header border-0" 
          style={{ 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            padding: '20px 24px',
            display: 'block',
            textAlign: 'right',
            direction: 'rtl'
          }}
        >
          <div style={{ display: 'inline-block', verticalAlign: 'middle' }}>
            <span style={{ fontSize: '28px', display: 'inline-block', verticalAlign: 'middle', marginLeft: '12px' }}>📊</span>
            <h2 style={{ 
              fontSize: '24px', 
              fontWeight: '700', 
              margin: 0, 
              display: 'inline-block', 
              verticalAlign: 'middle',
              marginLeft: '16px'
            }}>
              לוח בקרה
            </h2>
            <span 
              style={{ 
                backgroundColor: 'rgba(255,255,255,0.2)',
                color: 'white',
                padding: '8px 16px',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: '500',
                display: 'inline-block',
                verticalAlign: 'middle',
                marginLeft: '16px'
              }}
            >
              {(items && Array.isArray(items) ? items.length : 0)} פריטים • {(locations && Array.isArray(locations) ? locations.length : 0)} מיקומים
            </span>
          </div>
        </div>

        <div className="card-body p-0">
          <div className="table-responsive" style={{ maxHeight: '75vh', overflowY: 'auto', borderRadius: '0 0 8px 8px' }}>
            <table className="table table-hover mb-0" style={{ borderCollapse: 'separate', borderSpacing: 0 }}>
              <thead style={{ position: 'sticky', top: 0, zIndex: 5 }}>
                <tr>
                  <th 
                    style={{ 
                      position: 'sticky', 
                      right: 0, 
                      background: 'linear-gradient(135deg, #2c3e50 0%, #34495e 100%)', 
                      color: 'white',
                      zIndex: 10, 
                      minWidth: '180px',
                      padding: '16px 12px',
                      fontSize: '14px',
                      fontWeight: '600',
                      borderBottom: '3px solid #3498db',
                      textAlign: 'center',
                      boxShadow: '2px 0 4px rgba(0,0,0,0.1)'
                    }}
                  >
                    פריט
                  </th>
                  {locations.map(location => (
                    <th 
                      key={location} 
                      className="text-center" 
                      style={{ 
                        minWidth: '120px', 
                        background: 'linear-gradient(135deg, #2c3e50 0%, #34495e 100%)',
                        color: 'white',
                        padding: '16px 8px',
                        fontSize: '13px',
                        fontWeight: '600',
                        borderBottom: '3px solid #3498db'
                      }}
                    >
                      {location}
                    </th>
                  ))}
                  <th 
                    className="text-center" 
                    style={{ 
                      minWidth: '120px', 
                      background: 'linear-gradient(135deg, #16a085 0%, #1abc9c 100%)',
                      color: 'white',
                      padding: '16px 8px',
                      fontSize: '13px',
                      fontWeight: '600',
                      borderBottom: '3px solid #2ecc71'
                    }}
                  >
                    חתומים
                  </th>
                  <th 
                    className="text-center" 
                    style={{ 
                      minWidth: '120px', 
                      background: 'linear-gradient(135deg, #8e44ad 0%, #9b59b6 100%)',
                      color: 'white',
                      padding: '16px 8px',
                      fontSize: '13px',
                      fontWeight: '600',
                      borderBottom: '3px solid #af7ac5'
                    }}
                  >
                    זמינים
                  </th>
                  <th 
                    className="text-center" 
                    style={{ 
                      minWidth: '120px', 
                      background: 'linear-gradient(135deg, #d35400 0%, #e67e22 100%)',
                      color: 'white',
                      padding: '16px 8px',
                      fontSize: '13px',
                      fontWeight: '600',
                      borderBottom: '3px solid #f39c12'
                    }}
                  >
                    סה"כ
                  </th>
                </tr>
              </thead>
              <tbody>
                {items && Array.isArray(items) ? items.map((item, itemIndex) => {
                  if (!item || typeof item !== 'string') return null;
                  
                  return (
                  <tr 
                    key={item} 
                    style={{
                      backgroundColor: itemIndex % 2 === 0 ? '#f8fafc' : 'white',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#e3f2fd';
                      e.currentTarget.style.transform = 'scale(1.01)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = itemIndex % 2 === 0 ? '#f8fafc' : 'white';
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  >
                    <td 
                      style={{ 
                        position: 'sticky', 
                        right: 0, 
                        background: itemIndex % 2 === 0 ? 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)' : 'linear-gradient(135deg, white 0%, #f1f5f9 100%)',
                        fontWeight: '700',
                        borderRight: '3px solid #3498db',
                        padding: '16px 12px',
                        fontSize: '14px',
                        color: '#2c3e50',
                        boxShadow: '2px 0 4px rgba(0,0,0,0.05)',
                        textAlign: 'center'
                      }}
                    >
                      {item}
                    </td>
                    {locations && Array.isArray(locations) ? locations.map(location => {
                      if (!location || typeof location !== 'string') return null;
                      
                      const { signedQuantity, users } = getCellData(item, location);
                      const hasUsers = users && Array.isArray(users) && users.length > 0;
                      
                      return (
                        <td 
                          key={`${item}-${location}`}
                          className="text-center"
                          style={{ 
                            cursor: hasUsers ? 'pointer' : 'default',
                            position: 'relative',
                            padding: '16px 8px',
                            transition: 'all 0.3s ease',
                            backgroundColor: hasUsers ? '#e8f5e8' : '#f8f9fa',
                            borderLeft: hasUsers ? '3px solid #27ae60' : '1px solid #dee2e6'
                          }}
                          onClick={(e) => handleCellClick(e, users || [])}
                          title={hasUsers ? 'לחץ לפרטים נוספים' : 'אין משתמשים רשומים'}
                          onMouseEnter={(e) => {
                            if (hasUsers) {
                              e.currentTarget.style.backgroundColor = '#d4edda';
                              e.currentTarget.style.transform = 'scale(1.05)';
                              e.currentTarget.style.boxShadow = '0 4px 12px rgba(39, 174, 96, 0.3)';
                            }
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = hasUsers ? '#e8f5e8' : '#f8f9fa';
                            e.currentTarget.style.transform = 'scale(1)';
                            e.currentTarget.style.boxShadow = 'none';
                          }}
                        >
                          {hasUsers ? (
                            <span 
                              className="badge" 
                              style={{ 
                                backgroundColor: '#27ae60',
                                color: 'white',
                                fontSize: '13px',
                                padding: '8px 12px',
                                borderRadius: '20px',
                                fontWeight: '600',
                                boxShadow: '0 2px 4px rgba(39, 174, 96, 0.3)',
                                border: '2px solid #2ecc71'
                              }}
                            >
                              {signedQuantity}
                            </span>
                          ) : (
                            <span 
                              className="badge" 
                              style={{ 
                                backgroundColor: '#e9ecef',
                                color: '#6c757d',
                                fontSize: '12px',
                                padding: '6px 10px',
                                borderRadius: '15px',
                                fontWeight: '500',
                                border: '1px solid #dee2e6'
                              }}
                            >
                              0
                            </span>
                          )}
                        </td>
                      );
                    }) : null}
                    <td 
                      className="text-center" 
                      style={{ 
                        padding: '16px 8px',
                        backgroundColor: '#e8f4fd',
                        borderLeft: '3px solid #3498db'
                      }}
                    >
                      <span 
                        className="badge" 
                        style={{ 
                          backgroundColor: '#3498db',
                          color: 'white',
                          fontSize: '13px',
                          padding: '8px 12px',
                          borderRadius: '20px',
                          fontWeight: '600',
                          boxShadow: '0 2px 4px rgba(52, 152, 219, 0.3)',
                          border: '2px solid #5dade2'
                        }}
                      >
                        {getItemSignedTotal(item)}
                      </span>
                    </td>
                    <td 
                      className="text-center" 
                      style={{ 
                        padding: '16px 8px',
                        backgroundColor: '#f3e5f5',
                        borderLeft: '3px solid #9b59b6'
                      }}
                    >
                      <span 
                        className="badge" 
                        style={{ 
                          backgroundColor: '#9b59b6',
                          color: 'white',
                          fontSize: '13px',
                          padding: '8px 12px',
                          borderRadius: '20px',
                          fontWeight: '600',
                          boxShadow: '0 2px 4px rgba(155, 89, 182, 0.3)',
                          border: '2px solid #af7ac5'
                        }}
                      >
                        {(stats && stats[item] && typeof stats[item].quantity === 'number' ? stats[item].quantity : 0) - getItemSignedTotal(item)}
                      </span>
                    </td>
                    <td 
                      className="text-center" 
                      style={{ 
                        padding: '16px 8px',
                        backgroundColor: '#fef5e7',
                        borderLeft: '3px solid #f39c12'
                      }}
                    >
                      <span 
                        className="badge" 
                        style={{ 
                          backgroundColor: '#f39c12',
                          color: 'white',
                          fontSize: '13px',
                          padding: '8px 12px',
                          borderRadius: '20px',
                          fontWeight: '600',
                          boxShadow: '0 2px 4px rgba(243, 156, 18, 0.3)',
                          border: '2px solid #f5b041'
                        }}
                      >
                        {stats && stats[item] && typeof stats[item].quantity === 'number' ? stats[item].quantity : 0}
                      </span>
                    </td>
                  </tr>
                  );
                }).filter(Boolean) : null}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Tooltip Modal */}
      {tooltipData.show && (
        <>
          <div 
            className="modal-backdrop fade show" 
            onClick={handleCloseTooltip}
            style={{ zIndex: 1040 }}
          ></div>
          <div 
            className="modal fade show d-block" 
            style={{ zIndex: 1050 }}
            onClick={handleCloseTooltip}
          >
            <div 
              className="modal-dialog modal-dialog-centered"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-content shadow-lg" style={{ borderRadius: '12px', border: 'none' }}>
                <div 
                  className="modal-header border-0" 
                  style={{ 
                    background: 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)',
                    color: 'white',
                    borderRadius: '12px 12px 0 0',
                    padding: '20px 24px',
                    display: 'block',
                    textAlign: 'right',
                    direction: 'rtl'
                  }}
                >
                  <div style={{ display: 'inline-block', verticalAlign: 'middle' }}>
                    <span style={{ fontSize: '24px', display: 'inline-block', verticalAlign: 'middle', marginLeft: '12px' }}>👥</span>
                    <h5 style={{ 
                      fontSize: '18px', 
                      fontWeight: '600',
                      margin: 0,
                      display: 'inline-block',
                      verticalAlign: 'middle'
                    }}>
                      פרטי משתמשים רשומים
                    </h5>
                  </div>
                  <button 
                    type="button" 
                    className="btn-close btn-close-white" 
                    onClick={handleCloseTooltip}
                    style={{ 
                      filter: 'brightness(0) invert(1)',
                      opacity: 1,
                      position: 'absolute',
                      left: '24px',
                      top: '20px'
                    }}
                  ></button>
                </div>
                <div className="modal-body" style={{ padding: '24px' }}>
                  <div className="table-responsive">
                    <table className="table table-hover" style={{ marginBottom: '20px' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#f8fafc' }}>
                          <th style={{ padding: '12px 16px', fontSize: '14px', fontWeight: '600', color: '#2c3e50', border: 'none' }}>שם</th>
                          <th style={{ padding: '12px 16px', fontSize: '14px', fontWeight: '600', color: '#2c3e50', border: 'none' }}>מספר אישי</th>
                          <th style={{ padding: '12px 16px', fontSize: '14px', fontWeight: '600', color: '#2c3e50', border: 'none' }}>טלפון</th>
                          <th style={{ padding: '12px 16px', fontSize: '14px', fontWeight: '600', color: '#2c3e50', border: 'none' }}>כמות</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tooltipData.users.map((user, index) => (
                          <tr 
                            key={user.id || index}
                            style={{ 
                              borderBottom: '1px solid #e2e8f0',
                              transition: 'background-color 0.2s ease'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                          >
                            <td style={{ padding: '12px 16px', fontSize: '13px', color: '#34495e' }}>{user.name}</td>
                            <td style={{ padding: '12px 16px', fontSize: '13px', color: '#34495e' }}>{user.personalNumber}</td>
                            <td style={{ padding: '12px 16px', fontSize: '13px', color: '#34495e' }}>{user.phoneNumber}</td>
                            <td style={{ padding: '12px 16px' }}>
                              <span 
                                className="badge" 
                                style={{ 
                                  backgroundColor: '#3498db',
                                  color: 'white',
                                  padding: '6px 12px',
                                  borderRadius: '15px',
                                  fontSize: '12px',
                                  fontWeight: '600'
                                }}
                              >
                                {user.quantity}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div 
                    style={{ 
                      background: 'linear-gradient(135deg, #27ae60 0%, #2ecc71 100%)',
                      color: 'white',
                      padding: '16px 20px',
                      borderRadius: '10px',
                      textAlign: 'center'
                    }}
                  >
                    <div style={{ fontSize: '14px', marginBottom: '4px', opacity: 0.9 }}>
                      סה"כ כמות חתומה
                    </div>
                    <div style={{ fontSize: '24px', fontWeight: '700' }}>
                      {tooltipData.users.reduce((sum, user) => sum + user.quantity, 0)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default Dashboard;
