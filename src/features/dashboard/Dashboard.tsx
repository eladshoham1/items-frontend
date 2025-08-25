import React, { useState, useMemo, useEffect } from 'react';
import { useDashboardStats } from '../../hooks';
import { useUserProfile } from '../../hooks/useUserProfile';
import { reportService, managementService } from '../../services';
import ServerError from '../../shared/components/ServerError';
import { SmartPagination, TabNavigation, LoadingSpinner } from '../../shared/components';
import { SignUser, UnitEntity } from '../../types';
import { paginate } from '../../utils';
import { UI_CONFIG } from '../../config/app.config';
import '../../shared/styles/components.css';

const Dashboard: React.FC = () => {
  const { userProfile } = useUserProfile();
  const { stats, loading, error } = useDashboardStats();
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState<'units' | 'locations'>('units');
  const [selectedUnit, setSelectedUnit] = useState<string>('');
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

  // State for unified dashboard data  
  const [dashboardData, setDashboardData] = useState<any[]>([]);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [dashboardError, setDashboardError] = useState<string | null>(null);
  
  // State for units mapping
  const [allUnits, setAllUnits] = useState<UnitEntity[]>([]);
  const [unitsLoading, setUnitsLoading] = useState(false);

  // State for locations table sorting and search
  const [locationsSortConfig, setLocationsSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  } | null>(null);
  const [locationsSearchTerm, setLocationsSearchTerm] = useState('');

  // State for units table sorting and search
  const [unitsSearchTerm, setUnitsSearchTerm] = useState('');

  // Dashboard tab configuration
  const dashboardTabs = [
    { id: 'units', label: 'תצוגה לפי יחידות' },
    { id: 'locations', label: 'תצוגה לפי מיקומים' }
  ];

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId as 'units' | 'locations');
  };

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

  // Set default unit selection
  React.useEffect(() => {
    if (units.length > 0 && !selectedUnit) {
      setSelectedUnit(units[0]);
    }
  }, [units, selectedUnit]);

  // Extract unique locations for selected unit
  const locations = useMemo(() => {
    if (!stats || typeof stats !== 'object' || !selectedUnit) return [];
    
    try {
      const locationSet = new Set<string>();
      
      Object.keys(stats).forEach(item => {
        if (stats[item] && stats[item].units && stats[item].units[selectedUnit] && stats[item].units[selectedUnit].locations) {
          Object.keys(stats[item].units[selectedUnit].locations).forEach(location => {
            if (location && typeof location === 'string') {
              locationSet.add(location);
            }
          });
        }
      });
      
      return Array.from(locationSet).sort();
    } catch (error) {
      console.error('Error processing locations:', error);
      return [];
    }
  }, [stats, selectedUnit]);

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

  // Calculate non-operational quantities per item
  const getItemNonOperationalTotal = (itemName: string) => {
    try {
      if (!stats || !stats[itemName]) return 0;
      return stats[itemName].nonOperationalQuantity || 0;
    } catch (error) {
      console.error('Error calculating item non-operational total:', error, { itemName });
      return 0;
    }
  };

  // Calculate available quantities per item (total - non-operational - signed - waiting)
  const getItemAvailableTotal = (itemName: string) => {
    try {
      if (!stats || !stats[itemName]) return 0;
      const total = stats[itemName].quantity || 0;
      const nonOperational = stats[itemName].nonOperationalQuantity || 0;
      const signed = getItemSignedTotal(itemName);
      const waiting = getItemWaitingTotal(itemName);
      return total - nonOperational - signed - waiting;
    } catch (error) {
      console.error('Error calculating item available total:', error, { itemName });
      return 0;
    }
  };

  // Calculate total quantities per item
  const getItemTotal = (itemName: string) => {
    try {
      if (!stats || !stats[itemName]) return 0;
      return stats[itemName].quantity || 0;
    } catch (error) {
      console.error('Error calculating item total:', error, { itemName });
      return 0;
    }
  };

  // Get paginated items for display
  const filteredAndSortedItems = useMemo(() => {
    let filteredItems = items;
    
    // Filter by search term
    if (unitsSearchTerm.trim()) {
      filteredItems = items.filter(item =>
        item.toLowerCase().includes(unitsSearchTerm.toLowerCase())
      );
    }

    // Sort items if sortConfig is set (use existing sortConfig for units table)
    if (sortConfig) {
      filteredItems = [...filteredItems].sort((a, b) => {
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
          case 'nonOperational':
            aValue = getItemNonOperationalTotal(a);
            bValue = getItemNonOperationalTotal(b);
            break;
          case 'available':
            aValue = getItemAvailableTotal(a);
            bValue = getItemAvailableTotal(b);
            break;
          case 'total':
            aValue = getItemTotal(a);
            bValue = getItemTotal(b);
            break;
          default:
            // For unit columns
            if (sortConfig.key.startsWith('unit_')) {
              const unitName = sortConfig.key.replace('unit_', '');
              const { signedQuantity: aSignedQuantity, waitingQuantity: aWaitingQuantity } = getCellData(a, unitName);
              const { signedQuantity: bSignedQuantity, waitingQuantity: bWaitingQuantity } = getCellData(b, unitName);
              
              // Sort by total activity (signed + waiting)
              aValue = aSignedQuantity + aWaitingQuantity;
              bValue = bSignedQuantity + bWaitingQuantity;
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
    }

    return filteredItems;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, unitsSearchTerm, sortConfig, stats]);
  const { paginatedItems, totalPages } = paginate(filteredAndSortedItems || [], currentPage, UI_CONFIG.TABLE_PAGE_SIZE);

  const getSortIcon = (key: string) => {
    if (!sortConfig || sortConfig.key !== key) {
      return <i className="fas fa-sort ms-1" style={{ opacity: 0.5 }}></i>;
    }
    return sortConfig.direction === 'asc' 
      ? <i className="fas fa-sort-up ms-1"></i>
      : <i className="fas fa-sort-down ms-1"></i>;
  };

  // Locations table helper functions
  const handleLocationsSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (locationsSortConfig && locationsSortConfig.key === key && locationsSortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setLocationsSortConfig({ key, direction });
  };

  const getLocationsSortIcon = (key: string) => {
    if (!locationsSortConfig || locationsSortConfig.key !== key) {
      return <i className="fas fa-sort ms-1" style={{ opacity: 0.5 }}></i>;
    }
    return locationsSortConfig.direction === 'asc' 
      ? <i className="fas fa-sort-up ms-1"></i>
      : <i className="fas fa-sort-down ms-1"></i>;
  };

  const getFilteredAndSortedLocationsData = () => {
    const tableData = getUnifiedLocationsTableData();
    
    // Filter by search term
    let filteredItems = tableData.items;
    if (locationsSearchTerm.trim()) {
      filteredItems = tableData.items.filter(item =>
        item.itemName.toLowerCase().includes(locationsSearchTerm.toLowerCase())
      );
    }

    // Sort items
    if (locationsSortConfig) {
      filteredItems = [...filteredItems].sort((a, b) => {
        let aValue: any;
        let bValue: any;

        switch (locationsSortConfig.key) {
          case 'itemName':
            aValue = a.itemName;
            bValue = b.itemName;
            break;
          default:
            // For location columns
            if (locationsSortConfig.key.startsWith('location_')) {
              const locationName = locationsSortConfig.key.replace('location_', '');
              const aLocationData = a.locations[locationName];
              const bLocationData = b.locations[locationName];
              
              // Sort by total activity (signed + pending + allocation)
              aValue = (aLocationData?.signed || 0) + (aLocationData?.pending || 0) + (aLocationData?.allocation || 0);
              bValue = (bLocationData?.signed || 0) + (bLocationData?.pending || 0) + (bLocationData?.allocation || 0);
            } else {
              return 0;
            }
        }

        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return locationsSortConfig.direction === 'asc' 
            ? aValue.localeCompare(bValue, 'he') 
            : bValue.localeCompare(aValue, 'he');
        }

        if (locationsSortConfig.direction === 'asc') {
          return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
        } else {
          return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
        }
      });
    }

    return { ...tableData, items: filteredItems };
  };

  // Unified table helper functions for new API
  const getUnifiedLocationsTableData = () => {
    if (!dashboardData || !Array.isArray(dashboardData)) {
      return { items: [], locations: [] };
    }

    // Extract all unique locations from all items
    const locationSet = new Set<string>();
    dashboardData.forEach(item => {
      if (item.locations && Array.isArray(item.locations)) {
        item.locations.forEach((loc: any) => {
          if (loc.locationName) {
            locationSet.add(loc.locationName);
          }
        });
      }
    });

    const locations = Array.from(locationSet).sort();

    // Transform data to table format
    const items = dashboardData.map(item => {
      const locationData: { [key: string]: any } = {};
      
      if (item.locations && Array.isArray(item.locations)) {
        item.locations.forEach((loc: any) => {
          // Use server allocation value if available, otherwise count all receipts for this location
          let actualAllocation = loc.allocation || 0;
          if (actualAllocation === 0 && loc.receipts && Array.isArray(loc.receipts)) {
            // Fallback: count all receipts in this location
            actualAllocation = loc.receipts.length;
          }

          locationData[loc.locationName] = {
            signed: loc.signed || 0,
            pending: loc.pending || 0,
            allocation: actualAllocation, // Use server value or count all receipts
            receipts: loc.receipts || []
          };
        });
      }

      return {
        itemName: item.itemName,
        locations: locationData
      };
    });

    return { items, locations };
  };

  const handleUnifiedLocationsCellClick = (e: React.MouseEvent, cellData: any, itemName: string, locationName: string) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const allUsers: SignUser[] = [];

    // Process receipts to create user list
    if (cellData.receipts && Array.isArray(cellData.receipts)) {
      cellData.receipts.forEach((receipt: any) => {
        allUsers.push({
          id: receipt.idNumber?.toString() || Math.random().toString(),
          name: receipt.signBy || 'Unknown',
          phoneNumber: '', // Not available in receipt data
          personalNumber: receipt.idNumber || 0,
          quantity: 1, // Default quantity since it's not in the receipt
          isSigned: receipt.isSigned || false,
          location: receipt.allocatedLocation || locationName
        });
      });
    }

    setTooltipData({
      show: true,
      users: allUsers,
      position: { x: rect.left + window.scrollX, y: rect.bottom + window.scrollY }
    });
  };

  // Load all units for ID mapping
  useEffect(() => {
    const loadUnits = async () => {
      if (userProfile?.isAdmin) {
        setUnitsLoading(true);
        try {
          const response = await managementService.getAllUnits();
          if (response.success && response.data) {
            setAllUnits(response.data);
          }
        } catch (error) {
          console.error('Error loading units:', error);
        } finally {
          setUnitsLoading(false);
        }
      }
    };

    loadUnits();
  }, [userProfile?.isAdmin]);

  // Load dashboard data when unit changes
  useEffect(() => {
    const loadDashboardData = async () => {
      if (selectedUnit && userProfile?.isAdmin) {
        // Find unit ID from unit name
        const unit = allUnits.find(u => u.name === selectedUnit);
        const unitId = unit ? unit.id : null;
        
        if (!unitId) {
          setDashboardError(`Unit ID not found for unit: ${selectedUnit}`);
          setDashboardData([]);
          return;
        }

        setDashboardLoading(true);
        setDashboardError(null);
        try {
          const data = await reportService.getDashboardByUnit(unitId);
          // The API returns an array of items directly
          setDashboardData(Array.isArray(data) ? data : []);
        } catch (error) {
          console.error('Error loading dashboard data:', error);
          setDashboardError('Failed to load dashboard data');
          setDashboardData([]);
        } finally {
          setDashboardLoading(false);
        }
      } else {
        setDashboardData([]);
      }
    };

    loadDashboardData();
  }, [selectedUnit, userProfile?.isAdmin, allUnits]); // Added allUnits dependency

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
      <div className="management-container">
        <LoadingSpinner message="טוען נתוני לוח בקרה..." />
      </div>
    );
  }

  if (error || !stats) {
    return <ServerError />;
  }

  return (
    <div className="page-container">
      {/* Tab Navigation */}
      <TabNavigation
        tabs={dashboardTabs}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        variant="primary"
        size="md"
      />

      {/* Content Area */}
      <div className="tab-content">
        <div style={{
          position: 'relative'
        }}>
          {/* Unit Selection for Locations Tab */}
          {activeTab === 'locations' && (
              <div className="card" style={{ 
                margin: '0 0 24px 0',
                direction: 'rtl'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <label htmlFor="unitSelect" style={{ 
                    fontSize: '16px',
                    fontWeight: '600',
                    color: 'var(--color-text)',
                    marginBottom: 0
                  }}>
                    בחר יחידה:
                  </label>
                  <select
                    id="unitSelect"
                    value={selectedUnit}
                    onChange={(e) => setSelectedUnit(e.target.value)}
                    style={{
                      padding: '10px 16px',
                      borderRadius: '8px',
                      border: '2px solid var(--color-border)',
                      fontSize: '14px',
                      fontWeight: '500',
                      backgroundColor: 'var(--color-bg)',
                      color: 'var(--color-text)',
                      minWidth: '200px',
                      direction: 'rtl'
                    }}
                  >
                    <option value="">בחר יחידה...</option>
                    {units.map(unit => (
                      <option key={unit} value={unit}>{unit}</option>
                    ))}
                  </select>
                  {selectedUnit && (
                    <span style={{
                      backgroundColor: 'var(--color-accent)',
                      color: 'var(--color-text)',
                      padding: '8px 16px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: '600'
                    }}>
                      {locations.length} מיקומים
                    </span>
                  )}
              </div>
            </div>
            )}
        </div>

          {/* Search Input for Units Tab */}
          {activeTab === 'units' && (
            <div style={{ 
              padding: '20px 24px',
              backgroundColor: 'var(--color-surface)',
              borderBottom: '1px solid var(--color-border)',
              direction: 'rtl'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <label htmlFor="unitsSearch" style={{ 
                  fontSize: '16px',
                  fontWeight: '600',
                  color: 'var(--color-text)',
                  marginBottom: 0
                }}>
                  חיפוש פריטים:
                </label>
                <input
                  id="unitsSearch"
                  type="text"
                  value={unitsSearchTerm}
                  onChange={(e) => setUnitsSearchTerm(e.target.value)}
                  placeholder="הקלד שם פריט לחיפוש..."
                  style={{
                    padding: '10px 16px',
                    borderRadius: '8px',
                    border: '2px solid var(--color-border)',
                    fontSize: '14px',
                    fontWeight: '500',
                    backgroundColor: 'var(--color-bg)',
                    color: 'var(--color-text)',
                    minWidth: '300px',
                    direction: 'rtl'
                  }}
                />
                {unitsSearchTerm && (
                  <button
                    type="button"
                    onClick={() => setUnitsSearchTerm('')}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--color-text-secondary)',
                      fontSize: '16px',
                      cursor: 'pointer',
                      padding: '5px'
                    }}
                    title="נקה חיפוש"
                  >
                    ×
                  </button>
                )}
                <span style={{
                  backgroundColor: 'var(--color-accent)',
                  color: 'var(--color-text)',
                  padding: '8px 16px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: '600'
                }}>
                  {filteredAndSortedItems.length} פריטים
                </span>
            </div>
          </div>
          )}

          {activeTab === 'units' && (
            <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th 
                    style={{ 
                      position: 'sticky', 
                      right: 0, 
                      background: '#495057', 
                      color: 'white',
                      zIndex: 10, 
                      minWidth: '180px',
                      padding: '16px 12px',
                      fontSize: '14px',
                      fontWeight: '600',
                      borderBottom: '2px solid #6c757d',
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
                        background: '#495057',
                        color: 'white',
                        padding: '16px 8px',
                        fontSize: '13px',
                        fontWeight: '600',
                        borderBottom: '2px solid #6c757d',
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
                      background: '#6c757d',
                      color: 'white',
                      padding: '16px 8px',
                      fontSize: '13px',
                      fontWeight: '600',
                      borderBottom: '2px solid #868e96',
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
                      background: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)',
                      color: 'white',
                      padding: '16px 8px',
                      fontSize: '13px',
                      fontWeight: '600',
                      borderBottom: '3px solid #e74c3c',
                      cursor: 'pointer'
                    }}
                    onClick={() => handleSort('nonOperational')}
                  >
                    תקולים
                    {getSortIcon('nonOperational')}
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
                        borderLeft: '3px solid #3498db',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease'
                      }}
                      onClick={(e) => {
                        // Collect all signed users from all units for this item
                        const allSignedUsers: SignUser[] = [];
                        units.forEach(unit => {
                          const { users } = getCellData(item, unit);
                          if (users && Array.isArray(users)) {
                            const signedUsers = users.filter(user => user.isSigned === true);
                            allSignedUsers.push(...signedUsers);
                          }
                        });
                        handleCellClick(e, allSignedUsers, item, 'כל היחידות - חתומים');
                      }}
                      title="לחץ לפרטי כל המשתמשים החתומים"
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#d4edda';
                        e.currentTarget.style.transform = 'scale(1.05)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(52, 152, 219, 0.3)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#e8f4fd';
                        e.currentTarget.style.transform = 'scale(1)';
                        e.currentTarget.style.boxShadow = 'none';
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
                        borderLeft: '3px solid #f39c12',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease'
                      }}
                      onClick={(e) => {
                        // Collect all waiting users from all units for this item
                        const allWaitingUsers: SignUser[] = [];
                        units.forEach(unit => {
                          const { users } = getCellData(item, unit);
                          if (users && Array.isArray(users)) {
                            const waitingUsers = users.filter(user => user.isSigned !== true);
                            allWaitingUsers.push(...waitingUsers);
                          }
                        });
                        handleCellClick(e, allWaitingUsers, item, 'כל היחידות - ממתינים');
                      }}
                      title="לחץ לפרטי כל המשתמשים הממתינים"
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#f8d7da';
                        e.currentTarget.style.transform = 'scale(1.05)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(243, 156, 18, 0.3)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#fef4e3';
                        e.currentTarget.style.transform = 'scale(1)';
                        e.currentTarget.style.boxShadow = 'none';
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
                        backgroundColor: '#fadbd8',
                        borderLeft: '3px solid #e74c3c',
                        cursor: stats && stats[item] && stats[item].nonOperationalQuantity > 0 ? 'pointer' : 'default',
                        transition: 'all 0.3s ease'
                      }}
                      onClick={(e) => {
                        const nonOpCount = stats && stats[item] && typeof stats[item].nonOperationalQuantity === 'number' ? stats[item].nonOperationalQuantity : 0;
                        if (nonOpCount > 0) {
                          // For non-operational, we'll show a summary info instead of user details
                          // since non-operational items might not have specific users assigned
                          handleCellClick(e, [], item, `תקולים - ${nonOpCount} יחידות`);
                        }
                      }}
                      title={stats && stats[item] && stats[item].nonOperationalQuantity > 0 ? "לחץ לפרטי הפריטים התקולים" : "אין פריטים תקולים"}
                      onMouseEnter={(e) => {
                        if (stats && stats[item] && stats[item].nonOperationalQuantity > 0) {
                          e.currentTarget.style.backgroundColor = '#f5c6cb';
                          e.currentTarget.style.transform = 'scale(1.05)';
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(231, 76, 60, 0.3)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#fadbd8';
                        e.currentTarget.style.transform = 'scale(1)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      <span 
                        className="badge" 
                        style={{ 
                          backgroundColor: '#e74c3c',
                          color: 'white',
                          fontSize: '13px',
                          padding: '8px 12px',
                          borderRadius: '20px',
                          fontWeight: '600',
                          boxShadow: '0 2px 4px rgba(231, 76, 60, 0.3)',
                          border: '2px solid #ec7063'
                        }}
                      >
                        {stats && stats[item] && typeof stats[item].nonOperationalQuantity === 'number' ? stats[item].nonOperationalQuantity : 0}
                      </span>
                    </td>
                    <td 
                      className="text-center" 
                      style={{ 
                        padding: '16px 8px',
                        backgroundColor: '#f3e5f5',
                        borderLeft: '3px solid #9b59b6',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease'
                      }}
                      onClick={(e) => {
                        // For available items, show all users who are not assigned or not signed
                        const allUsers: SignUser[] = [];
                        units.forEach(unit => {
                          const { users } = getCellData(item, unit);
                          if (users && Array.isArray(users)) {
                            allUsers.push(...users);
                          }
                        });
                        handleCellClick(e, allUsers, item, 'כל היחידות - סטטוס זמינות');
                      }}
                      title="לחץ לפרטי זמינות הפריט"
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#e8daef';
                        e.currentTarget.style.transform = 'scale(1.05)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(155, 89, 182, 0.3)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#f3e5f5';
                        e.currentTarget.style.transform = 'scale(1)';
                        e.currentTarget.style.boxShadow = 'none';
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
                        {(stats && stats[item] && typeof stats[item].quantity === 'number' ? stats[item].quantity : 0) - (stats && stats[item] && typeof stats[item].nonOperationalQuantity === 'number' ? stats[item].nonOperationalQuantity : 0) - getItemSignedTotal(item) - getItemWaitingTotal(item)}
                      </span>
                    </td>
                    <td 
                      className="text-center" 
                      style={{ 
                        padding: '16px 8px',
                        backgroundColor: '#fef5e7',
                        borderLeft: '3px solid #f39c12',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease'
                      }}
                      onClick={(e) => {
                        // For total, show all users from all units for this item
                        const allUsers: SignUser[] = [];
                        units.forEach(unit => {
                          const { users } = getCellData(item, unit);
                          if (users && Array.isArray(users)) {
                            allUsers.push(...users);
                          }
                        });
                        handleCellClick(e, allUsers, item, 'כל היחידות - סיכום כללי');
                      }}
                      title="לחץ לפרטי כל המשתמשים הרשומים לפריט"
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#f8e8cd';
                        e.currentTarget.style.transform = 'scale(1.05)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(243, 156, 18, 0.3)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#fef5e7';
                        e.currentTarget.style.transform = 'scale(1)';
                        e.currentTarget.style.boxShadow = 'none';
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
          )}
          
          {totalPages > 1 && (
            <SmartPagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          )}

        {/* Locations Tab Content - Unified Table */}
        {activeTab === 'locations' && selectedUnit && (
          <>
            {dashboardLoading || unitsLoading ? (
              <LoadingSpinner 
                message={unitsLoading ? 'טוען רשימת יחידות...' : 'טוען נתוני יחידה...'} 
                containerStyle={{ backgroundColor: '#f8f9fa' }}
              />
            ) : dashboardError ? (
              <div style={{ 
                padding: '60px 24px',
                textAlign: 'center',
                backgroundColor: '#f8f9fa',
                color: '#dc3545',
                fontSize: '18px',
                fontWeight: '500'
              }}>
                <div style={{ marginBottom: '16px', fontSize: '48px' }}>❌</div>
                שגיאה בטעינת נתונים: {dashboardError}
            </div>
            ) : dashboardData && dashboardData.length > 0 ? (
              <>
                {/* Search Input */}
                <div style={{ 
                  padding: '20px 24px',
                  backgroundColor: 'white',
                  borderBottom: '1px solid #e9ecef',
                  direction: 'rtl'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <label htmlFor="locationsSearch" style={{ 
                      fontSize: '16px',
                      fontWeight: '600',
                      color: '#495057',
                      marginBottom: 0
                    }}>
                      חיפוש פריטים:
                    </label>
                    <input
                      id="locationsSearch"
                      type="text"
                      value={locationsSearchTerm}
                      onChange={(e) => setLocationsSearchTerm(e.target.value)}
                      placeholder="הקלד שם פריט לחיפוש..."
                      style={{
                        padding: '10px 16px',
                        borderRadius: '8px',
                        border: '2px solid #e9ecef',
                        fontSize: '14px',
                        fontWeight: '500',
                        backgroundColor: 'white',
                        color: '#495057',
                        minWidth: '300px',
                        direction: 'rtl'
                      }}
                    />
                    {locationsSearchTerm && (
                      <button
                        type="button"
                        onClick={() => setLocationsSearchTerm('')}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#6c757d',
                          fontSize: '16px',
                          cursor: 'pointer',
                          padding: '5px'
                        }}
                        title="נקה חיפוש"
                      >
                        ×
                      </button>
                    )}
                    <span style={{
                      backgroundColor: '#e3f2fd',
                      color: '#1976d2',
                      padding: '8px 16px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: '600'
                    }}>
                      {getFilteredAndSortedLocationsData().items.length} פריטים
                    </span>
                </div>
              </div>

                <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th 
                        style={{ 
                          position: 'sticky', 
                          right: 0, 
                          background: '#495057', 
                          color: 'white',
                          zIndex: 10, 
                          minWidth: '180px',
                          padding: '16px 12px',
                          fontSize: '14px',
                          fontWeight: '600',
                          borderBottom: '2px solid #6c757d',
                          textAlign: 'center',
                          boxShadow: '2px 0 4px rgba(0,0,0,0.1)',
                          cursor: 'pointer'
                        }}
                        onClick={() => handleLocationsSort('itemName')}
                      >
                        פריט
                        {getLocationsSortIcon('itemName')}
                      </th>
                      {getFilteredAndSortedLocationsData().locations.map(location => (
                        <th 
                          key={location} 
                          className="text-center" 
                          style={{ 
                            minWidth: '150px', 
                            background: '#495057',
                            color: 'white',
                            padding: '16px 8px',
                            fontSize: '13px',
                            fontWeight: '600',
                            borderBottom: '2px solid #6c757d',
                            cursor: 'pointer'
                          }}
                          onClick={() => handleLocationsSort(`location_${location}`)}
                        >
                          {location}
                          {getLocationsSortIcon(`location_${location}`)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {getFilteredAndSortedLocationsData().items.map((item, itemIndex) => (
                      <tr 
                        key={`${item.itemName}-locations`} 
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
                          {item.itemName}
                        </td>
                        {getFilteredAndSortedLocationsData().locations.map(location => {
                          const locationData = item.locations[location];
                          const hasUserData = locationData && (locationData.signed > 0 || locationData.pending > 0);
                          const hasAnyData = locationData && (locationData.signed > 0 || locationData.pending > 0 || locationData.allocation > 0);
                          
                          return (
                            <td 
                              key={`${item.itemName}-${location}`}
                              className="text-center"
                              style={{ 
                                cursor: hasUserData ? 'pointer' : 'default',
                                position: 'relative',
                                padding: '16px 8px',
                                transition: 'all 0.3s ease',
                                backgroundColor: hasAnyData ? '#e8f5e8' : '#f8f9fa',
                                borderLeft: hasAnyData ? '3px solid #27ae60' : '1px solid #dee2e6'
                              }}
                              onClick={(e) => hasUserData && handleUnifiedLocationsCellClick(e, locationData, item.itemName, location)}
                              title={hasUserData ? `לחץ לפרטים נוספים` : hasAnyData ? 'יש הקצאות אך אין נתוני משתמשים' : 'אין נתונים'}
                              onMouseEnter={(e) => {
                                if (hasUserData) {
                                  e.currentTarget.style.backgroundColor = '#d4edda';
                                  e.currentTarget.style.transform = 'scale(1.05)';
                                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(39, 174, 96, 0.3)';
                                }
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = hasAnyData ? '#e8f5e8' : '#f8f9fa';
                                e.currentTarget.style.transform = 'scale(1)';
                                e.currentTarget.style.boxShadow = 'none';
                              }}
                            >
                              {hasAnyData ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center' }}>
                                  {locationData.signed > 0 && (
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
                                      title={`חתומים: ${locationData.signed}`}
                                    >
                                      ✓ {locationData.signed}
                                    </span>
                                  )}
                                  {locationData.pending > 0 && (
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
                                      title={`ממתינים: ${locationData.pending}`}
                                    >
                                      ⏳ {locationData.pending}
                                    </span>
                                  )}
                                  {locationData.allocation > 0 && (
                                    <span 
                                      className="badge" 
                                      style={{ 
                                        backgroundColor: '#3498db',
                                        color: 'white',
                                        fontSize: '11px',
                                        padding: '4px 8px',
                                        borderRadius: '12px',
                                        fontWeight: '600',
                                        boxShadow: '0 1px 3px rgba(52, 152, 219, 0.3)',
                                        border: '1px solid #5dade2'
                                      }}
                                      title={`הקצאה: ${locationData.allocation}`}
                                    >
                                      📋 {locationData.allocation}
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
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
            </div>
              </>
            ) : (
              <div style={{ 
                padding: '60px 24px',
                textAlign: 'center',
                backgroundColor: '#f8f9fa',
                color: '#6c757d',
                fontSize: '18px',
                fontWeight: '500'
              }}>
                <div style={{ marginBottom: '16px', fontSize: '48px' }}>📊</div>
                אין נתונים זמינים עבור יחידה זו
            </div>
            )}
          </>
        )}

        {/* Show message when no unit selected for locations tab */}
        {activeTab === 'locations' && !selectedUnit && (
          <div style={{ 
            padding: '60px 24px',
            textAlign: 'center',
            backgroundColor: '#f8f9fa',
            color: '#6c757d',
            fontSize: '18px',
            fontWeight: '500'
          }}>
            <div style={{ marginBottom: '16px', fontSize: '48px' }}>📍</div>
            אנא בחר יחידה כדי להציג את המיקומים
        </div>
        )}

        {/* Pagination for units tab */}
        {activeTab === 'units' && totalPages > 1 && (
          <SmartPagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        )}

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
            <div className="table-container">
              <table className="table">
                <thead>
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
                      שם החותם
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
                      מספר צ'
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
                      הקצאה
                    </th>
                    <th style={{ 
                      background: 'linear-gradient(135deg, #8e44ad 0%, #9b59b6 100%)', 
                      color: 'white',
                      padding: '16px 20px',
                      fontSize: '14px',
                      fontWeight: '600',
                      border: 'none',
                      borderBottom: '3px solid #af7ac5',
                      textAlign: 'center'
                    }}>
                      הערות
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {tooltipData.users.map((user, userIndex) => 
                    user.items && Array.isArray(user.items) ? user.items.map((item: { itemId: string; idNumber: string | null; note: string; allocatedLocationName: string | null }, itemIndex: number) => (
                      <tr 
                        key={`${user.id || userIndex}-${item.itemId || itemIndex}`}
                        style={{ 
                          backgroundColor: (userIndex * (user.items?.length || 1) + itemIndex) % 2 === 0 ? '#f8fafc' : 'white',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#e3f2fd';
                          e.currentTarget.style.transform = 'scale(1.01)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = (userIndex * (user.items?.length || 1) + itemIndex) % 2 === 0 ? '#f8fafc' : 'white';
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
                          fontWeight: '500'
                        }}>
                          {(user as any).location || 'N/A'}
                        </td>
                        <td style={{ 
                          padding: '16px 20px', 
                          fontSize: '14px', 
                          color: '#495057',
                          textAlign: 'center',
                          fontFamily: 'monospace',
                          fontWeight: '600'
                        }}>
                          <span 
                            className="badge" 
                            style={{ 
                              backgroundColor: item.idNumber ? '#17a2b8' : '#6c757d',
                              color: 'white',
                              fontSize: '12px',
                              padding: '6px 10px',
                              borderRadius: '12px',
                              fontWeight: '600',
                              fontFamily: 'monospace',
                              boxShadow: item.idNumber 
                                ? '0 2px 4px rgba(23, 162, 184, 0.3)' 
                                : '0 2px 4px rgba(108, 117, 125, 0.3)',
                              border: item.idNumber 
                                ? '1px solid #20c997' 
                                : '1px solid #adb5bd'
                            }}
                          >
                            {item.idNumber || 'ללא מספר'}
                          </span>
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
                              backgroundColor: item.allocatedLocationName ? '#3498db' : '#6c757d',
                              color: 'white',
                              fontSize: '12px',
                              padding: '6px 12px',
                              borderRadius: '15px',
                              fontWeight: '600',
                              boxShadow: item.allocatedLocationName 
                                ? '0 2px 4px rgba(52, 152, 219, 0.3)' 
                                : '0 2px 4px rgba(108, 117, 125, 0.3)',
                              border: item.allocatedLocationName 
                                ? '2px solid #5dade2' 
                                : '2px solid #adb5bd'
                            }}
                          >
                            {item.allocatedLocationName || 'לא הוקצה'}
                          </span>
                        </td>
                        <td style={{ 
                          padding: '16px 20px', 
                          fontSize: '14px', 
                          color: '#495057',
                          textAlign: 'center',
                          fontStyle: 'italic'
                        }}>
                          {item.note || '-'}
                        </td>
                      </tr>
                    )) : (
                      <tr 
                        key={user.id || userIndex}
                        style={{ 
                          backgroundColor: userIndex % 2 === 0 ? '#f8fafc' : 'white',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#e3f2fd';
                          e.currentTarget.style.transform = 'scale(1.01)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = userIndex % 2 === 0 ? '#f8fafc' : 'white';
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
                          fontWeight: '500'
                        }}>
                          {(user as any).location || 'N/A'}
                        </td>
                        <td style={{ 
                          padding: '16px 20px', 
                          fontSize: '14px', 
                          color: '#495057',
                          textAlign: 'center',
                          fontFamily: 'monospace'
                        }}>
                          <span 
                            className="badge" 
                            style={{ 
                              backgroundColor: '#6c757d',
                              color: 'white',
                              fontSize: '12px',
                              padding: '6px 10px',
                              borderRadius: '12px',
                              fontWeight: '600',
                              fontFamily: 'monospace',
                              boxShadow: '0 2px 4px rgba(108, 117, 125, 0.3)',
                              border: '1px solid #adb5bd'
                            }}
                          >
                            ללא מספר
                          </span>
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
                              backgroundColor: '#6c757d',
                              color: 'white',
                              fontSize: '12px',
                              padding: '6px 12px',
                              borderRadius: '15px',
                              fontWeight: '600',
                              boxShadow: '0 2px 4px rgba(108, 117, 125, 0.3)',
                              border: '2px solid #adb5bd'
                            }}
                          >
                            לא הוקצה
                          </span>
                        </td>
                        <td style={{ 
                          padding: '16px 20px', 
                          fontSize: '14px', 
                          color: '#495057',
                          textAlign: 'center',
                          fontStyle: 'italic'
                        }}>
                          -
                        </td>
                      </tr>
                    )
                  ).flat()}
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
              סה"כ פריטים מוקצים: <span style={{ fontSize: '18px', fontWeight: '700' }}>
                {tooltipData.users.reduce((sum, user) => sum + (user.items?.length || 1), 0)}
              </span>
          </div>
        </div>
      </div>
      )}
      </div>
    </div>
  );
};

export default Dashboard;
