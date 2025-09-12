import React, { useState, useMemo, useEffect } from 'react';
import { useDashboardStats, useUserDashboard } from '../../hooks';
import { useUserProfile } from '../../hooks/useUserProfile';
import { reportService, managementService } from '../../services';
import { TabNavigation } from '../../shared/components';
import { SignUser, UnitEntity, UserDashboardItem } from '../../types';
import { paginate } from '../../utils';
import { UI_CONFIG } from '../../config/app.config';
import {
  DashboardLoadingSpinner,
  DashboardError,
  DashboardSearch,
  DashboardPagination,
  DashboardEmptyState,
  DashboardTableHeader,
  DashboardBadge,
  formatDate,
  getStatusText
} from './DashboardShared';
import '../../shared/styles/components.css';
import './Dashboard.css';

const Dashboard: React.FC = () => {
  const { userProfile } = useUserProfile();

  // If user is not admin, show the user dashboard
  if (userProfile && !userProfile.isAdmin) {
    return <UserDashboard />;
  }

  // Rest of the existing admin dashboard code
  return <AdminDashboard />;
};

// User Dashboard Component
const UserDashboard: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  } | null>({ key: 'createdAt', direction: 'desc' });

  // Fetch all data once without pagination/sorting params
  const { data, loading, error, refetch } = useUserDashboard();

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
    setCurrentPage(1); // Reset to first page when sorting
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setCurrentPage(1); // Reset to first page when searching
  };

  // Filter and sort items on the frontend
  const filteredAndSortedItems = useMemo(() => {
    if (!data?.items) return [];

    const normalizedSearchTerm = searchTerm.toLowerCase().normalize('NFC');
    let filtered = data.items.filter(item =>
      item.itemName.toLowerCase().normalize('NFC').includes(normalizedSearchTerm) ||
      (item.itemIdNumber && item.itemIdNumber.toLowerCase().normalize('NFC').includes(normalizedSearchTerm)) ||
      (item.status === 'signed' && 'חתום'.normalize('NFC').includes(normalizedSearchTerm)) ||
      (item.status === 'pending' && 'ממתין'.normalize('NFC').includes(normalizedSearchTerm)) ||
      item.createdBy.name.toLowerCase().normalize('NFC').includes(normalizedSearchTerm) ||
      item.createdBy.rank.toLowerCase().normalize('NFC').includes(normalizedSearchTerm)
    );

    if (sortConfig) {
      filtered = [...filtered].sort((a, b) => {
        let aValue: any;
        let bValue: any;

        switch (sortConfig.key) {
          case 'itemName':
            aValue = a.itemName;
            bValue = b.itemName;
            break;
          case 'itemIdNumber':
            aValue = a.itemIdNumber || '';
            bValue = b.itemIdNumber || '';
            break;
          case 'status':
            aValue = a.status === 'signed' ? 1 : 0; // Signed first when ascending
            bValue = b.status === 'signed' ? 1 : 0;
            break;
          case 'createdAt':
            aValue = new Date(a.createdAt).getTime();
            bValue = new Date(b.createdAt).getTime();
            break;
          case 'signedAt':
            aValue = a.signedAt ? new Date(a.signedAt).getTime() : 0;
            bValue = b.signedAt ? new Date(b.signedAt).getTime() : 0;
            break;
          case 'createdBy':
            aValue = a.createdBy.name;
            bValue = b.createdBy.name;
            break;
          default:
            return 0;
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

    return filtered;
  }, [data?.items, searchTerm, sortConfig]);

  const { paginatedItems, totalPages } = paginate(
    filteredAndSortedItems,
    currentPage,
    UI_CONFIG.TABLE_PAGE_SIZE
  );

  if (loading) {
    return (
      <DashboardLoadingSpinner message="טוען נתוני לוח בקרה אישי..." />
    );
  }

  if (error) {
    return (
      <DashboardError 
        error={error}
        onRetry={() => refetch()}
        title="שגיאה בטעינת נתוני לוח בקרה אישי"
      />
    );
  }

  if (!data) {
    return (
      <DashboardError 
        error="שגיאה בטעינת נתונים"
        onRetry={() => refetch()}
        title="שגיאה בטעינת נתוני לוח בקרה אישי"
      />
    );
  }

  return (
    <div className="page-container">
      {/* Enhanced Search Input - same style as admin dashboard */}
      <DashboardSearch
        value={searchTerm}
        onChange={handleSearch}
        placeholder="הקלד שם פריט לחיפוש..."
        resultsCount={filteredAndSortedItems.length}
        resultsLabel="פריטים"
        id="userDashboardSearch"
      />

      {/* Items Table - same style as admin dashboard */}
      <div className="unified-table-container">
        <div style={{ overflowX: 'auto' }}>
          <table className="unified-table">
            <thead>
              <tr>
                <DashboardTableHeader
                  label="שם פריט"
                  sortKey="itemName"
                  sortConfig={sortConfig}
                  onSort={handleSort}
                  title="לחץ למיון לפי שם פריט"
                />
                <DashboardTableHeader
                  label="צ'"
                  sortKey="itemIdNumber"
                  sortConfig={sortConfig}
                  onSort={handleSort}
                  title="לחץ למיון לפי צ'"
                />
                <DashboardTableHeader
                  label="סטטוס"
                  sortKey="status"
                  sortConfig={sortConfig}
                  onSort={handleSort}
                  title="לחץ למיון לפי סטטוס"
                />
                <DashboardTableHeader
                  label="תאריך יצירה"
                  sortKey="createdAt"
                  sortConfig={sortConfig}
                  onSort={handleSort}
                  title="לחץ למיון לפי תאריך יצירה"
                />
                <DashboardTableHeader
                  label="תאריך חתימה"
                  sortKey="signedAt"
                  sortConfig={sortConfig}
                  onSort={handleSort}
                  title="לחץ למיון לפי תאריך חתימה"
                />
                <DashboardTableHeader
                  label="מחתים"
                  sortKey="createdBy"
                  sortConfig={sortConfig}
                  onSort={handleSort}
                  title="לחץ למיון לפי מחתים"
                />
              </tr>
            </thead>
            <tbody>
              {paginatedItems && Array.isArray(paginatedItems) ? paginatedItems.map((item: UserDashboardItem) => (
                <tr key={item.id} className="unified-table-row">
                  <td className="unified-table-cell">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: '500' }}>{item.itemName}</span>
                      {item.requiresReporting && (
                        <DashboardBadge
                          type="info"
                          title="פריט זה דורש דיווח"
                          style={{ fontSize: '10px' }}
                        >
                          דיווח נדרש
                        </DashboardBadge>
                      )}
                    </div>
                  </td>
                  <td className="unified-table-cell">
                    <DashboardBadge
                      type={item.itemIdNumber ? 'primary' : 'empty'}
                    >
                      {item.itemIdNumber || 'ללא מספר'}
                    </DashboardBadge>
                  </td>
                  <td className="unified-table-cell">
                    <DashboardBadge
                      type={item.status}
                    >
                      {getStatusText(item.status)}
                    </DashboardBadge>
                  </td>
                  <td className="unified-table-cell">
                    {formatDate(item.createdAt)}
                  </td>
                  <td className="unified-table-cell">
                    {item.signedAt ? formatDate(item.signedAt) : '-'}
                  </td>
                  <td className="unified-table-cell">
                    <div style={{ fontSize: '13px' }}>
                      <div style={{ fontWeight: '500' }}>{item.createdBy.name}</div>
                      <div style={{ color: 'var(--color-text-muted)', fontSize: '11px' }}>
                        {item.createdBy.rank}
                      </div>
                    </div>
                  </td>
                </tr>
              )) : null}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination - same style as admin dashboard */}
      <DashboardPagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />

      {/* Empty state */}
      {filteredAndSortedItems.length === 0 && (
        <DashboardEmptyState
          icon="📝"
          message="אין פריטים רשומים עליך"
          searchTerm={searchTerm}
        />
      )}
    </div>
  );
};

// Rename the existing component to AdminDashboard
const AdminDashboard: React.FC = () => {
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
    if (allUnits.length > 0 && !selectedUnit) {
      setSelectedUnit(allUnits[0].name);
    }
  }, [allUnits, selectedUnit]);

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
      const normalizedSearchTerm = unitsSearchTerm.trim().toLowerCase().normalize('NFC');
      filteredItems = items.filter(item =>
        item.toLowerCase().normalize('NFC').includes(normalizedSearchTerm)
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

  // Locations table helper functions
  const handleLocationsSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (locationsSortConfig && locationsSortConfig.key === key && locationsSortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setLocationsSortConfig({ key, direction });
  };

  const getFilteredAndSortedLocationsData = () => {
    const tableData = getUnifiedLocationsTableData();
    
    // Filter by search term
    let filteredItems = tableData.items;
    if (locationsSearchTerm.trim()) {
      const normalizedSearchTerm = locationsSearchTerm.trim().toLowerCase().normalize('NFC');
      filteredItems = tableData.items.filter(item =>
        item.itemName.toLowerCase().normalize('NFC').includes(normalizedSearchTerm)
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
      <DashboardLoadingSpinner message="טוען נתוני לוח בקרה..." />
    );
  }

  if (error || !stats) {
    return (
      <DashboardError 
        error={error || "שגיאה בטעינת נתונים"}
        onRetry={() => window.location.reload()}
        title="שגיאה בטעינת נתוני לוח בקרה"
      />
    );
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
            <div className="dashboard-select-container">
              <div className="dashboard-select-row">
                <label htmlFor="unitSelect" className="dashboard-select-label">
                  בחר יחידה:
                </label>
                <div className="dashboard-select-wrapper">
                  <select
                    id="unitSelect"
                    className="dashboard-select"
                    value={selectedUnit}
                    onChange={(e) => setSelectedUnit(e.target.value)}
                    disabled={unitsLoading}
                  >
                    <option value="">{unitsLoading ? 'טוען יחידות...' : 'בחר יחידה...'}</option>
                    {allUnits.map(unit => (
                      <option key={unit.id} value={unit.name}>{unit.name}</option>
                    ))}
                  </select>
                </div>
                {selectedUnit && (
                  <div className="dashboard-badge-container">
                    <span className="dashboard-results-badge">
                      {locations.length} מיקומים
                    </span>
                  </div>
                )}
              </div>
            </div>
            )}
        </div>

          {/* Enhanced Search Input for Units Tab */}
          {activeTab === 'units' && (
            <DashboardSearch
              value={unitsSearchTerm}
              onChange={setUnitsSearchTerm}
              placeholder="הקלד שם פריט לחיפוש..."
              resultsCount={filteredAndSortedItems.length}
              resultsLabel="פריטים"
              id="unitsSearch"
            />
          )}          {activeTab === 'units' && (
            <div className="unified-table-container">
              <div style={{ overflowX: 'auto' }}>
                <table className="unified-table">
                  <thead>
                    <tr>
                      <th 
                        className="unified-table-header unified-table-header-regular sortable"
                        onClick={() => handleSort('name')}
                        title="לחץ למיון לפי שם פריט"
                        data-sorted={sortConfig?.key === 'name' ? 'true' : 'false'}
                      >
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <span>פריט</span>
                        </div>
                      </th>
                      {units.map(unit => (
                        <th 
                          key={unit} 
                          className="unified-table-header unified-table-header-regular sortable"
                          onClick={() => handleSort(`unit_${unit}`)}
                          title={`לחץ למיון לפי ${unit}`}
                          data-sorted={sortConfig?.key === `unit_${unit}` ? 'true' : 'false'}
                        >
                          <div style={{ display: 'flex', alignItems: 'center' }}>
                            <span>{unit}</span>
                          </div>
                        </th>
                      ))}
                      <th 
                        className="unified-table-header unified-table-header-regular sortable"
                        onClick={() => handleSort('signed')}
                        title="לחץ למיון לפי חתומים"
                        data-sorted={sortConfig?.key === 'signed' ? 'true' : 'false'}
                      >
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <span>חתומים</span>
                        </div>
                      </th>
                      <th 
                        className="unified-table-header unified-table-header-regular sortable"
                        onClick={() => handleSort('waiting')}
                        title="לחץ למיון לפי ממתינים לחתימה"
                        data-sorted={sortConfig?.key === 'waiting' ? 'true' : 'false'}
                      >
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <span>ממתינים לחתימה</span>
                        </div>
                      </th>
                      <th 
                        className="unified-table-header unified-table-header-regular sortable"
                        onClick={() => handleSort('nonOperational')}
                        title="לחץ למיון לפי תקולים"
                        data-sorted={sortConfig?.key === 'nonOperational' ? 'true' : 'false'}
                      >
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <span>תקולים</span>
                        </div>
                      </th>
                      <th 
                        className="unified-table-header unified-table-header-regular sortable"
                        onClick={() => handleSort('available')}
                        title="לחץ למיון לפי זמינים"
                        data-sorted={sortConfig?.key === 'available' ? 'true' : 'false'}
                      >
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <span>זמינים</span>
                        </div>
                      </th>
                      <th 
                        className="unified-table-header unified-table-header-regular sortable"
                        onClick={() => handleSort('total')}
                        title="לחץ למיון לפי סה'כ"
                        data-sorted={sortConfig?.key === 'total' ? 'true' : 'false'}
                      >
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <span>סה"כ</span>
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedItems && Array.isArray(paginatedItems) ? paginatedItems.map((item, itemIndex) => {
                      if (!item || typeof item !== 'string') return null;
                      
                      return (
                      <tr 
                        key={item} 
                        className="unified-table-row"
                      >
                        <td className="unified-table-cell">
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
                              className="unified-table-cell"
                              onClick={(e) => handleCellClick(e, users || [], item, unit)}
                              title={hasUsers ? 'לחץ לפרטים נוספים' : 'אין משתמשים רשומים'}
                              style={{ cursor: hasUsers ? 'pointer' : 'default' }}
                            >
                              {hasUsers ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center' }}>
                                  {hasSignedUsers && (
                                    <span className="dashboard-badge-signed" title={`חתומים: ${signedQuantity}`}>
                                      ✓ {signedQuantity}
                                    </span>
                                  )}
                                  {hasWaitingUsers && (
                                    <span className="dashboard-badge-waiting" title={`ממתינים: ${waitingQuantity}`}>
                                      ⏳ {waitingQuantity}
                                    </span>
                                  )}
                              </div>
                              ) : (
                                <span className="dashboard-badge-empty">
                                  0
                                </span>
                              )}
                            </td>
                          );
                        }) : null}
                        <td 
                          className="unified-table-cell"
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
                          style={{ cursor: 'pointer' }}
                        >
                          <span className="dashboard-badge-large dashboard-badge-signed-large">
                            {getItemSignedTotal(item)}
                          </span>
                        </td>
                        <td 
                          className="unified-table-cell"
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
                          style={{ cursor: 'pointer' }}
                        >
                          <span className="dashboard-badge-large dashboard-badge-waiting-large">
                            {getItemWaitingTotal(item)}
                          </span>
                        </td>
                        <td 
                          className="unified-table-cell"
                          onClick={(e) => {
                            const nonOpCount = stats && stats[item] && typeof stats[item].nonOperationalQuantity === 'number' ? stats[item].nonOperationalQuantity : 0;
                            if (nonOpCount > 0) {
                              // For non-operational, we'll show a summary info instead of user details
                              // since non-operational items might not have specific users assigned
                              handleCellClick(e, [], item, `תקולים - ${nonOpCount} יחידות`);
                            }
                          }}
                          title={stats && stats[item] && stats[item].nonOperationalQuantity > 0 ? "לחץ לפרטי הפריטים התקולים" : "אין פריטים תקולים"}
                          style={{ cursor: 'pointer' }}
                        >
                          <span className="dashboard-badge-large dashboard-badge-broken-large">
                            {stats && stats[item] && typeof stats[item].nonOperationalQuantity === 'number' ? stats[item].nonOperationalQuantity : 0}
                          </span>
                        </td>
                        <td 
                          className="unified-table-cell"
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
                          style={{ cursor: 'pointer' }}
                        >
                          <span className="dashboard-badge-large dashboard-badge-available-large">
                            {(stats && stats[item] && typeof stats[item].quantity === 'number' ? stats[item].quantity : 0) - (stats && stats[item] && typeof stats[item].nonOperationalQuantity === 'number' ? stats[item].nonOperationalQuantity : 0) - getItemSignedTotal(item) - getItemWaitingTotal(item)}
                          </span>
                        </td>
                        <td 
                          className="unified-table-cell"
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
                          style={{ cursor: 'pointer' }}
                        >
                          <span className="dashboard-badge-large dashboard-badge-total-large">
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
          )}

        {/* Locations Tab Content - Unified Table */}
        {activeTab === 'locations' && selectedUnit && (
          <>
            {dashboardLoading || unitsLoading ? (
              <DashboardLoadingSpinner 
                message={unitsLoading ? 'טוען רשימת יחידות...' : 'טוען נתוני יחידה...'} 
              />
            ) : dashboardError ? (
              <div style={{ 
                padding: '60px 24px',
                textAlign: 'center',
                backgroundColor: 'var(--color-bg, #1a1a1a)',
                color: 'var(--color-danger, #dc3545)',
                fontSize: '18px',
                fontWeight: '500'
              }}>
                <div style={{ marginBottom: '16px', fontSize: '48px' }}>❌</div>
                שגיאה בטעינת נתונים: {dashboardError}
            </div>
            ) : dashboardData && dashboardData.length > 0 ? (
              <>
                {/* Enhanced Search Input */}
                <DashboardSearch
                  value={locationsSearchTerm}
                  onChange={setLocationsSearchTerm}
                  placeholder="הקלד שם פריט לחיפוש..."
                  resultsCount={getFilteredAndSortedLocationsData().items.length}
                  resultsLabel="פריטים"
                  id="locationsSearch"
                />

                <div className="unified-table-container">
                  <div style={{ overflowX: 'auto' }}>
                    <table className="unified-table">
                      <thead>
                        <tr>
                          <th 
                            className="unified-table-header unified-table-header-regular sortable"
                            onClick={() => handleLocationsSort('itemName')}
                            title="לחץ למיון לפי שם פריט"
                            data-sorted={locationsSortConfig?.key === 'itemName' ? 'true' : 'false'}
                          >
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                              <span>פריט</span>
                            </div>
                          </th>
                          {getFilteredAndSortedLocationsData().locations.map(location => (
                            <th 
                              key={location} 
                              className="unified-table-header unified-table-header-regular sortable"
                              onClick={() => handleLocationsSort(`location_${location}`)}
                              title={`לחץ למיון לפי ${location}`}
                              data-sorted={locationsSortConfig?.key === `location_${location}` ? 'true' : 'false'}
                            >
                              <div style={{ display: 'flex', alignItems: 'center' }}>
                                <span>{location}</span>
                              </div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                  <tbody>
                    {getFilteredAndSortedLocationsData().items.map((item, itemIndex) => (
                      <tr 
                        key={`${item.itemName}-locations`} 
                        className="unified-table-row"
                      >
                        <td className="unified-table-cell">
                          {item.itemName}
                        </td>
                        {getFilteredAndSortedLocationsData().locations.map(location => {
                          const locationData = item.locations[location];
                          const hasUserData = locationData && (locationData.signed > 0 || locationData.pending > 0);
                          const hasAnyData = locationData && (locationData.signed > 0 || locationData.pending > 0 || locationData.allocation > 0);
                          
                          return (
                            <td 
                              key={`${item.itemName}-${location}`}
                              className="unified-table-cell"
                              style={{ 
                                cursor: hasUserData ? 'pointer' : 'default'
                              }}
                              onClick={(e) => hasUserData && handleUnifiedLocationsCellClick(e, locationData, item.itemName, location)}
                              title={hasUserData ? `לחץ לפרטים נוספים` : hasAnyData ? 'יש הקצאות אך אין נתוני משתמשים' : 'אין נתונים'}
                            >
                              {hasAnyData ? (
                                <div style={{ display: 'flex', flexDirection: 'row', gap: '6px', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}>
                                  {locationData.signed > 0 && (
                                    <span 
                                      className="dashboard-locations-badge-signed" 
                                      title={`חתומים: ${locationData.signed}`}
                                    >
                                      ✓ {locationData.signed}
                                    </span>
                                  )}
                                  {locationData.pending > 0 && (
                                    <span 
                                      className="dashboard-locations-badge-pending" 
                                      title={`ממתינים: ${locationData.pending}`}
                                    >
                                      ⏳ {locationData.pending}
                                    </span>
                                  )}
                                  {locationData.allocation > 0 && (
                                    <span 
                                      className="dashboard-locations-badge-allocation" 
                                      title={`הקצאה: ${locationData.allocation}`}
                                    >
                                      📋 {locationData.allocation}
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span className="dashboard-locations-badge-empty">
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
            </div>
              </>
            ) : (
              <div style={{ 
                padding: '60px 24px',
                textAlign: 'center',
                backgroundColor: 'var(--color-bg, #1a1a1a)',
                color: 'var(--color-text-muted, #8e8e93)',
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
            backgroundColor: 'var(--color-bg, #1a1a1a)',
            color: 'var(--color-text-muted, #8e8e93)',
            fontSize: '18px',
            fontWeight: '500'
          }}>
            <div style={{ marginBottom: '16px', fontSize: '48px' }}>📍</div>
            אנא בחר יחידה כדי להציג את המיקומים
        </div>
        )}

        {/* Pagination for units tab */}
        {activeTab === 'units' && totalPages > 1 && (
          <DashboardPagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        )}

      {/* User Details Table - Appears below main table when clicked */}
      {tooltipData.show && (
        <div className="dashboard-modal-card">
          <div className="dashboard-modal-header">
            <div className="dashboard-modal-header-content">
              <span className="dashboard-modal-icon">👥</span>
              <h5 className="dashboard-modal-title">
                פרטי משתמשים רשומים ({tooltipData.users.length})
              </h5>
            </div>
            <button 
              type="button" 
              onClick={handleCloseTooltip}
              className="dashboard-modal-close-btn"
            >
              ×
            </button>
          </div>
          <div className="dashboard-modal-body">
            <div className="dashboard-modal-table-container">
              <table className="dashboard-modal-table">
                <thead>
                  <tr>
                    <th className="dashboard-modal-th">שם החותם</th>
                    <th className="dashboard-modal-th">מיקום</th>
                    <th className="dashboard-modal-th">מספר צ'</th>
                    <th className="dashboard-modal-th">האם חתום</th>
                    <th className="dashboard-modal-th">הקצאה</th>
                    <th className="dashboard-modal-th">הערות</th>
                  </tr>
                </thead>
                <tbody>
                  {tooltipData.users.map((user, userIndex) => 
                    user.items && Array.isArray(user.items) ? user.items.map((item: { itemId: string; idNumber: string | null; note: string; allocatedLocationName: string | null }, itemIndex: number) => (
                      <tr 
                        key={`${user.id || userIndex}-${item.itemId || itemIndex}`}
                        className="dashboard-modal-tr"
                      >
                        <td className="dashboard-modal-td dashboard-modal-td-name">
                          {user.name}
                        </td>
                        <td className="dashboard-modal-td dashboard-modal-td-center">
                          {(user as any).location || 'N/A'}
                        </td>
                        <td className="dashboard-modal-td dashboard-modal-td-center">
                          <span className={`dashboard-modal-badge ${item.idNumber ? 'dashboard-modal-badge-primary' : 'dashboard-modal-badge-muted'}`}>
                            {item.idNumber || 'ללא מספר'}
                          </span>
                        </td>
                        <td className="dashboard-modal-td dashboard-modal-td-center">
                          <span className={`dashboard-modal-badge ${user.isSigned ? 'dashboard-modal-badge-success' : 'dashboard-modal-badge-danger'}`}>
                            {user.isSigned ? 'כן' : 'לא'}
                          </span>
                        </td>
                        <td className="dashboard-modal-td dashboard-modal-td-center">
                          <span className={`dashboard-modal-badge ${item.allocatedLocationName ? 'dashboard-modal-badge-primary' : 'dashboard-modal-badge-muted'}`}>
                            {item.allocatedLocationName || 'לא הוקצה'}
                          </span>
                        </td>
                        <td className="dashboard-modal-td dashboard-modal-td-center dashboard-modal-td-note">
                          {item.note || '-'}
                        </td>
                      </tr>
                    )) : (
                      <tr 
                        key={user.id || userIndex}
                        className="dashboard-modal-tr"
                      >
                        <td className="dashboard-modal-td dashboard-modal-td-name">
                          {user.name}
                        </td>
                        <td className="dashboard-modal-td dashboard-modal-td-center">
                          {(user as any).location || 'N/A'}
                        </td>
                        <td className="dashboard-modal-td dashboard-modal-td-center">
                          <span className="dashboard-modal-badge dashboard-modal-badge-muted">
                            ללא מספר
                          </span>
                        </td>
                        <td className="dashboard-modal-td dashboard-modal-td-center">
                          <span className={`dashboard-modal-badge ${user.isSigned ? 'dashboard-modal-badge-success' : 'dashboard-modal-badge-danger'}`}>
                            {user.isSigned ? 'כן' : 'לא'}
                          </span>
                        </td>
                        <td className="dashboard-modal-td dashboard-modal-td-center">
                          <span className="dashboard-modal-badge dashboard-modal-badge-muted">
                            לא הוקצה
                          </span>
                        </td>
                        <td className="dashboard-modal-td dashboard-modal-td-center dashboard-modal-td-note">
                          -
                        </td>
                      </tr>
                    )
                  ).flat()}
                </tbody>
              </table>
            </div>
            <div className="dashboard-modal-footer">
              סה"כ פריטים מוקצים: <span className="dashboard-modal-total">
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
