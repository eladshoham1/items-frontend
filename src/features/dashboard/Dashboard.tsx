import React, { useState, useMemo } from 'react';
import { useDashboardStats } from '../../hooks';
import { useUserProfile } from '../../hooks/useUserProfile';
import ServerError from '../../shared/components/ServerError';
import { SmartPagination } from '../../shared/components';
import { SignUser } from '../../types';
import { paginate } from '../../utils';
import { UI_CONFIG } from '../../config/app.config';

const Dashboard: React.FC = () => {
  const { userProfile } = useUserProfile();
  const { stats, loading, error } = useDashboardStats();
  const [currentPage, setCurrentPage] = useState(1);
  const [tooltipData, setTooltipData] = useState<{
    show: boolean;
    users: SignUser[];
    position: { x: number; y: number };
  }>({
    show: false,
    users: [],
    position: { x: 0, y: 0 }
  });
  
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  } | null>(null);

  // Extract unique units and items from the data
  const { items, units } = useMemo(() => {
    if (!stats || typeof stats !== 'object') return { items: [], units: [] };
    
    try {
      const items = Object.keys(stats);
      const unitSet = new Set<string>();
      
      items.forEach(item => {
        if (stats[item] && stats[item].units && typeof stats[item].units === 'object') {
          Object.keys(stats[item].units).forEach(unit => {
            if (unit && typeof unit === 'string') {
              unitSet.add(unit);
            }
          });
        }
      });
      
      return { items, units: Array.from(unitSet).sort() };
    } catch (error) {
      console.error('Error processing dashboard stats:', error);
      return { items: [], units: [] };
    }
  }, [stats]);

  const handleCellClick = (event: React.MouseEvent, users: SignUser[], itemName: string, unitName: string) => {
    if (users.length === 0) return;
    
    const rect = event.currentTarget.getBoundingClientRect();
    setTooltipData({
      show: true,
      users: users.map(user => ({ ...user, itemName, unitName })),
      position: {
        x: rect.left + rect.width / 2,
        y: rect.top
      }
    });
  };

  const handleCloseTooltip = () => {
    setTooltipData(prev => ({ ...prev, show: false }));
  };

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortedItems = () => {
    if (!items || !Array.isArray(items) || !sortConfig) {
      return items;
    }

    return [...items].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortConfig.key) {
        case 'name':
          aValue = a;
          bValue = b;
          break;
        case 'signed':
          aValue = getItemSignedTotal(a);
          bValue = getItemSignedTotal(b);
          break;
        case 'waiting':
          aValue = getItemWaitingTotal(a);
          bValue = getItemWaitingTotal(b);
          break;
        case 'available':
          aValue = (stats && stats[a] && typeof stats[a].quantity === 'number' ? stats[a].quantity : 0) - getItemSignedTotal(a) - getItemWaitingTotal(a);
          bValue = (stats && stats[b] && typeof stats[b].quantity === 'number' ? stats[b].quantity : 0) - getItemSignedTotal(b) - getItemWaitingTotal(b);
          break;
        case 'total':
          aValue = stats && stats[a] && typeof stats[a].quantity === 'number' ? stats[a].quantity : 0;
          bValue = stats && stats[b] && typeof stats[b].quantity === 'number' ? stats[b].quantity : 0;
          break;
        default:
          // For unit columns
          if (sortConfig.key.startsWith('unit_')) {
            const unit = sortConfig.key.replace('unit_', '');
            aValue = getCellData(a, unit).signedQuantity;
            bValue = getCellData(b, unit).signedQuantity;
          } else {
            return 0;
          }
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortConfig.direction === 'asc' 
          ? aValue.localeCompare(bValue, 'he') 
          : bValue.localeCompare(aValue, 'he');
      }

      if (sortConfig.direction === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });
  };

  // Get paginated items for display
  const sortedItems = getSortedItems();
  const { paginatedItems, totalPages } = paginate(sortedItems || [], currentPage, UI_CONFIG.TABLE_PAGE_SIZE);

  const getSortIcon = (key: string) => {
    if (!sortConfig || sortConfig.key !== key) {
      return <i className="fas fa-sort ms-1" style={{ opacity: 0.5 }}></i>;
    }
    return sortConfig.direction === 'asc' 
      ? <i className="fas fa-sort-up ms-1"></i>
      : <i className="fas fa-sort-down ms-1"></i>;
  };

  const getCellData = (itemName: string, unit: string) => {
    try {
      if (!stats || !stats[itemName] || !stats[itemName].units || !stats[itemName].units[unit]) {
        return { signedQuantity: 0, waitingQuantity: 0, totalQuantity: 0, users: [] };
      }
      
      const unitData = stats[itemName].units[unit];
      if (!unitData || !unitData.locations || typeof unitData.locations !== 'object') {
        return { signedQuantity: 0, waitingQuantity: 0, totalQuantity: 0, users: [] };
      }
      
      // Aggregate all users from all locations within this unit
      const allUsers: SignUser[] = [];
      let totalSignedQuantity = 0;
      let totalWaitingQuantity = 0;
      
      Object.keys(unitData.locations).forEach(locationName => {
        const locationData = unitData.locations[locationName];
        if (locationData && locationData.signUsers && Array.isArray(locationData.signUsers)) {
          locationData.signUsers.forEach((user: any) => {
            if (user && typeof user.quantity === 'number') {
              allUsers.push({ ...user, location: locationName });
              
              // Only count as signed if isSigned is true
              if (user.isSigned === true) {
                totalSignedQuantity += user.quantity;
              } else {
                // Count as waiting if isSigned is false or undefined
                totalWaitingQuantity += user.quantity;
              }
            }
          });
        }
      });
      
      const totalQuantity = stats[itemName] && typeof stats[itemName].quantity === 'number' ? stats[itemName].quantity : 0;
      
      return { signedQuantity: totalSignedQuantity, waitingQuantity: totalWaitingQuantity, totalQuantity, users: allUsers };
    } catch (error) {
      console.error('Error getting cell data:', error, { itemName, unit });
      return { signedQuantity: 0, waitingQuantity: 0, totalQuantity: 0, users: [] };
    }
  };

  // Calculate total signed quantities per item (across all units)
  const getItemSignedTotal = (itemName: string) => {
    try {
      if (!units || !Array.isArray(units) || !stats || !stats[itemName]) {
        return 0;
      }
      
      return units.reduce((total: number, unit: string) => {
        if (!unit || typeof unit !== 'string') return total;
        const { signedQuantity } = getCellData(itemName, unit);
        return total + (typeof signedQuantity === 'number' ? signedQuantity : 0);
      }, 0);
    } catch (error) {
      console.error('Error calculating item signed total:', error, { itemName });
      return 0;
    }
  };

  // Calculate total waiting quantities per item (across all units)
  const getItemWaitingTotal = (itemName: string) => {
    try {
      if (!units || !Array.isArray(units) || !stats || !stats[itemName]) {
        return 0;
      }
      
      return units.reduce((total: number, unit: string) => {
        if (!unit || typeof unit !== 'string') return total;
        const { waitingQuantity } = getCellData(itemName, unit);
        return total + (typeof waitingQuantity === 'number' ? waitingQuantity : 0);
      }, 0);
    } catch (error) {
      console.error('Error calculating item waiting total:', error, { itemName });
      return 0;
    }
  };

  // Check if user has a location assigned
  if (userProfile && !userProfile.location) {
    return (
      <div className="card">
        <div className="card-header">
          <h2 className="mb-0">לוח בקרה</h2>
        </div>
        <div className="card-body">
          <div className="alert alert-warning">
            <h4>אין לך גישה למערכת</h4>
            <p>המשתמש שלך לא שוייך למיקום. אנא פנה למנהל המערכת כדי לשייך אותך למיקום.</p>
          </div>
        </div>
      </div>
    );
  }

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
              {(items && Array.isArray(items) ? items.length : 0)} פריטים • {(units && Array.isArray(units) ? units.length : 0)} יחידות
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
                      boxShadow: '2px 0 4px rgba(0,0,0,0.1)',
                      cursor: 'pointer'
                    }}
                    onClick={() => handleSort('name')}
                  >
                    פריט
                    {getSortIcon('name')}
                  </th>
                  {units.map(unit => (
                    <th 
                      key={unit} 
                      className="text-center" 
                      style={{ 
                        minWidth: '120px', 
                        background: 'linear-gradient(135deg, #2c3e50 0%, #34495e 100%)',
                        color: 'white',
                        padding: '16px 8px',
                        fontSize: '13px',
                        fontWeight: '600',
                        borderBottom: '3px solid #3498db',
                        cursor: 'pointer'
                      }}
                      onClick={() => handleSort(`unit_${unit}`)}
                    >
                      {unit}
                      {getSortIcon(`unit_${unit}`)}
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
                      borderBottom: '3px solid #2ecc71',
                      cursor: 'pointer'
                    }}
                    onClick={() => handleSort('signed')}
                  >
                    חתומים
                    {getSortIcon('signed')}
                  </th>
                  <th 
                    className="text-center" 
                    style={{ 
                      minWidth: '120px', 
                      background: 'linear-gradient(135deg, #f39c12 0%, #e67e22 100%)',
                      color: 'white',
                      padding: '16px 8px',
                      fontSize: '13px',
                      fontWeight: '600',
                      borderBottom: '3px solid #f39c12',
                      cursor: 'pointer'
                    }}
                    onClick={() => handleSort('waiting')}
                  >
                    ממתינים לחתימה
                    {getSortIcon('waiting')}
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
                      borderBottom: '3px solid #af7ac5',
                      cursor: 'pointer'
                    }}
                    onClick={() => handleSort('available')}
                  >
                    זמינים
                    {getSortIcon('available')}
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
                      borderBottom: '3px solid #f39c12',
                      cursor: 'pointer'
                    }}
                    onClick={() => handleSort('total')}
                  >
                    סה"כ
                    {getSortIcon('total')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedItems && Array.isArray(paginatedItems) ? paginatedItems.map((item, itemIndex) => {
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
                    {units && Array.isArray(units) ? units.map(unit => {
                      if (!unit || typeof unit !== 'string') return null;
                      
                      const { signedQuantity, waitingQuantity, users } = getCellData(item, unit);
                      const hasUsers = users && Array.isArray(users) && users.length > 0;
                      const hasSignedUsers = signedQuantity > 0;
                      const hasWaitingUsers = waitingQuantity > 0;
                      
                      return (
                        <td 
                          key={`${item}-${unit}`}
                          className="text-center"
                          style={{ 
                            cursor: hasUsers ? 'pointer' : 'default',
                            position: 'relative',
                            padding: '16px 8px',
                            transition: 'all 0.3s ease',
                            backgroundColor: hasUsers ? '#e8f5e8' : '#f8f9fa',
                            borderLeft: hasUsers ? '3px solid #27ae60' : '1px solid #dee2e6'
                          }}
                          onClick={(e) => handleCellClick(e, users || [], item, unit)}
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
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center' }}>
                              {hasSignedUsers && (
                                <span 
                                  className="badge" 
                                  style={{ 
                                    backgroundColor: '#27ae60',
                                    color: 'white',
                                    fontSize: '11px',
                                    padding: '4px 8px',
                                    borderRadius: '12px',
                                    fontWeight: '600',
                                    boxShadow: '0 1px 3px rgba(39, 174, 96, 0.3)',
                                    border: '1px solid #2ecc71'
                                  }}
                                  title={`חתומים: ${signedQuantity}`}
                                >
                                  ✓ {signedQuantity}
                                </span>
                              )}
                              {hasWaitingUsers && (
                                <span 
                                  className="badge" 
                                  style={{ 
                                    backgroundColor: '#f39c12',
                                    color: 'white',
                                    fontSize: '11px',
                                    padding: '4px 8px',
                                    borderRadius: '12px',
                                    fontWeight: '600',
                                    boxShadow: '0 1px 3px rgba(243, 156, 18, 0.3)',
                                    border: '1px solid #f5b041'
                                  }}
                                  title={`ממתינים: ${waitingQuantity}`}
                                >
                                  ⏳ {waitingQuantity}
                                </span>
                              )}
                            </div>
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
                        backgroundColor: '#fef4e3',
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
                        {getItemWaitingTotal(item)}
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
                        {(stats && stats[item] && typeof stats[item].quantity === 'number' ? stats[item].quantity : 0) - getItemSignedTotal(item) - getItemWaitingTotal(item)}
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
          
          {totalPages > 1 && (
            <SmartPagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          )}
        </div>
      </div>

      {/* User Details Table - Appears below main table when clicked */}
      {tooltipData.show && (
        <div className="card shadow-lg border-0 mt-3" style={{ 
          borderRadius: '12px', 
          overflow: 'hidden'
        }}>
          <div 
            className="card-header border-0" 
            style={{ 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              padding: '20px 24px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              direction: 'rtl'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '24px' }}>👥</span>
              <h5 style={{ 
                fontSize: '18px', 
                fontWeight: '700',
                margin: 0,
                color: 'white'
              }}>
                פרטי משתמשים רשומים ({tooltipData.users.length})
              </h5>
            </div>
            <button 
              type="button" 
              onClick={handleCloseTooltip}
              style={{ 
                background: 'rgba(255, 255, 255, 0.2)',
                border: 'none',
                borderRadius: '6px',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'white',
                fontSize: '16px',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
              }}
            >
              ×
            </button>
          </div>
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover mb-0" style={{ borderCollapse: 'separate', borderSpacing: 0 }}>
                <thead style={{ position: 'sticky', top: 0, zIndex: 5 }}>
                  <tr>
                    <th style={{ 
                      background: 'linear-gradient(135deg, #2c3e50 0%, #34495e 100%)', 
                      color: 'white',
                      padding: '16px 20px',
                      fontSize: '14px',
                      fontWeight: '600',
                      border: 'none',
                      borderBottom: '3px solid #3498db',
                      textAlign: 'right'
                    }}>
                      שם
                    </th>
                    <th style={{ 
                      background: 'linear-gradient(135deg, #2c3e50 0%, #34495e 100%)', 
                      color: 'white',
                      padding: '16px 20px',
                      fontSize: '14px',
                      fontWeight: '600',
                      border: 'none',
                      borderBottom: '3px solid #3498db',
                      textAlign: 'center'
                    }}>
                      מספר אישי
                    </th>
                    <th style={{ 
                      background: 'linear-gradient(135deg, #2c3e50 0%, #34495e 100%)', 
                      color: 'white',
                      padding: '16px 20px',
                      fontSize: '14px',
                      fontWeight: '600',
                      border: 'none',
                      borderBottom: '3px solid #3498db',
                      textAlign: 'center'
                    }}>
                      טלפון
                    </th>
                    <th style={{ 
                      background: 'linear-gradient(135deg, #2c3e50 0%, #34495e 100%)', 
                      color: 'white',
                      padding: '16px 20px',
                      fontSize: '14px',
                      fontWeight: '600',
                      border: 'none',
                      borderBottom: '3px solid #3498db',
                      textAlign: 'center'
                    }}>
                      מיקום
                    </th>
                    <th style={{ 
                      background: 'linear-gradient(135deg, #2c3e50 0%, #34495e 100%)', 
                      color: 'white',
                      padding: '16px 20px',
                      fontSize: '14px',
                      fontWeight: '600',
                      border: 'none',
                      borderBottom: '3px solid #3498db',
                      textAlign: 'center'
                    }}>
                      האם חתום
                    </th>
                    <th style={{ 
                      background: 'linear-gradient(135deg, #16a085 0%, #1abc9c 100%)', 
                      color: 'white',
                      padding: '16px 20px',
                      fontSize: '14px',
                      fontWeight: '600',
                      border: 'none',
                      borderBottom: '3px solid #2ecc71',
                      textAlign: 'center'
                    }}>
                      כמות
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {tooltipData.users.map((user, index) => (
                    <tr 
                      key={user.id || index}
                      style={{ 
                        backgroundColor: index % 2 === 0 ? '#f8fafc' : 'white',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#e3f2fd';
                        e.currentTarget.style.transform = 'scale(1.01)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = index % 2 === 0 ? '#f8fafc' : 'white';
                        e.currentTarget.style.transform = 'scale(1)';
                      }}
                    >
                      <td style={{ 
                        padding: '16px 20px', 
                        fontSize: '14px', 
                        color: '#2c3e50',
                        fontWeight: '600',
                        textAlign: 'right'
                      }}>
                        {user.name}
                      </td>
                      <td style={{ 
                        padding: '16px 20px', 
                        fontSize: '14px', 
                        color: '#495057',
                        textAlign: 'center',
                        fontFamily: 'monospace'
                      }}>
                        {user.personalNumber}
                      </td>
                      <td style={{ 
                        padding: '16px 20px', 
                        fontSize: '14px', 
                        color: '#495057',
                        textAlign: 'center',
                        fontFamily: 'monospace'
                      }}>
                        {user.phoneNumber}
                      </td>
                      <td style={{ 
                        padding: '16px 20px', 
                        fontSize: '14px', 
                        color: '#495057',
                        textAlign: 'center',
                        fontWeight: '500'
                      }}>
                        {(user as any).location || 'N/A'}
                      </td>
                      <td style={{ 
                        padding: '16px 20px', 
                        textAlign: 'center'
                      }}>
                        <span 
                          className="badge" 
                          style={{ 
                            backgroundColor: user.isSigned ? '#27ae60' : '#e74c3c',
                            color: 'white',
                            fontSize: '12px',
                            padding: '6px 12px',
                            borderRadius: '15px',
                            fontWeight: '600',
                            boxShadow: user.isSigned 
                              ? '0 2px 4px rgba(39, 174, 96, 0.3)' 
                              : '0 2px 4px rgba(231, 76, 60, 0.3)',
                            border: user.isSigned 
                              ? '2px solid #2ecc71' 
                              : '2px solid #ec7063'
                          }}
                        >
                          {user.isSigned ? 'כן' : 'לא'}
                        </span>
                      </td>
                      <td style={{ 
                        padding: '16px 20px', 
                        textAlign: 'center',
                        backgroundColor: '#e8f5e8'
                      }}>
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
                          {user.quantity}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div 
              className="card-footer border-0"
              style={{ 
                background: 'linear-gradient(135deg, #27ae60 0%, #2ecc71 100%)',
                color: 'white',
                padding: '16px 20px',
                textAlign: 'center',
                fontSize: '15px',
                fontWeight: '600'
              }}
            >
              סה"כ כמות חתומה: <span style={{ fontSize: '18px', fontWeight: '700' }}>{tooltipData.users.reduce((sum, user) => sum + user.quantity, 0)}</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Dashboard;
