import React, { useState } from 'react';
import { Modal, ConflictErrorModal, SmartPagination } from '../../shared/components';
import { paginate } from '../../utils';
import { UI_CONFIG } from '../../config/app.config';
import { LocationEntity, UnitEntity } from '../../types';

interface LocationsTableProps {
  locations: LocationEntity[];
  units: UnitEntity[];
  loading: boolean;
  error: string | null;
  onAdd: (data: { name: string; unitId: string }) => Promise<{ success: boolean; error?: string; isConflict?: boolean }>;
  onEdit: (id: string, data: { name?: string; unitId?: string }) => Promise<{ success: boolean; error?: string; isConflict?: boolean }>;
  onDelete: (ids: string[]) => Promise<{ success: boolean; error?: string }>;
  onRefresh: () => void;
}

export const LocationsTable: React.FC<LocationsTableProps> = ({
  locations,
  units,
  loading,
  error,
  onAdd,
  onEdit,
  onDelete,
  onRefresh,
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<LocationEntity | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [newLocationData, setNewLocationData] = useState({ name: '', unitId: '' });
  const [editLocationData, setEditLocationData] = useState({ name: '', unitId: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sortConfig, setSortConfig] = useState<{
    key: keyof LocationEntity | 'unitName';
    direction: 'asc' | 'desc';
  } | null>(null);
  const [conflictError, setConflictError] = useState({
    isOpen: false,
    message: '',
    itemName: '',
  });

  // Helper function to get unit name
  const getUnitName = (unitId: string) => {
    const unit = units.find(u => u.id === unitId);
    return unit ? unit.name : 'יחידה לא נמצאה';
  };

  // Filter locations
  const filteredLocations = locations.filter(location =>
    location.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    getUnitName(location.unitId).toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Sort locations
  const sortedLocations = [...filteredLocations].sort((a, b) => {
    if (!sortConfig) return 0;

    const { key, direction } = sortConfig;
    let aValue: any;
    let bValue: any;

    if (key === 'unitName') {
      aValue = getUnitName(a.unitId);
      bValue = getUnitName(b.unitId);
    } else if (key === 'createdAt' || key === 'updatedAt') {
      aValue = new Date(a[key]).getTime();
      bValue = new Date(b[key]).getTime();
    } else {
      aValue = a[key];
      bValue = b[key];
    }

    // Handle string sorting
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return direction === 'asc' 
        ? aValue.localeCompare(bValue, 'he') 
        : bValue.localeCompare(aValue, 'he');
    }

    // Handle number sorting
    if (direction === 'asc') {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    }
  });

  const { paginatedItems, totalPages } = paginate(
    sortedLocations,
    currentPage,
    UI_CONFIG.TABLE_PAGE_SIZE
  );

  const handleSort = (key: keyof LocationEntity | 'unitName') => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
    setCurrentPage(1); // Reset to first page when sorting
  };

  const getSortIcon = (key: keyof LocationEntity | 'unitName') => {
    if (!sortConfig || sortConfig.key !== key) {
      return <i className="fas fa-sort ms-1" style={{ opacity: 0.5 }}></i>;
    }
    return sortConfig.direction === 'asc' 
      ? <i className="fas fa-sort-up ms-1"></i>
      : <i className="fas fa-sort-down ms-1"></i>;
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectedIds(checked ? paginatedItems.map(location => location.id) : []);
  };

  const handleSelectItem = (id: string, checked: boolean) => {
    setSelectedIds(prev =>
      checked ? [...prev, id] : prev.filter(selectedId => selectedId !== id)
    );
  };

  const resetAddForm = () => {
    setNewLocationData({ name: '', unitId: '' });
    setIsAddModalOpen(false);
  };

  const resetEditForm = () => {
    setEditLocationData({ name: '', unitId: '' });
    setEditingLocation(null);
  };

  const handleAdd = async () => {
    if (!newLocationData.name.trim() || !newLocationData.unitId) return;

    setIsSubmitting(true);
    try {
      const result = await onAdd(newLocationData);
      if (result.success) {
        resetAddForm();
      } else if (result.isConflict) {
        setConflictError({
          isOpen: true,
          message: result.error || 'מיקום עם שם זה כבר קיים ביחידה זו',
          itemName: newLocationData.name,
        });
      } else {
        alert(result.error || 'שגיאה ביצירת מיקום');
      }
    } catch (error) {
      alert('שגיאה ביצירת מיקום');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async () => {
    if (!editingLocation || (!editLocationData.name.trim() && !editLocationData.unitId)) return;

    setIsSubmitting(true);
    try {
      const updateData: { name?: string; unitId?: string } = {};
      if (editLocationData.name.trim()) updateData.name = editLocationData.name.trim();
      if (editLocationData.unitId) updateData.unitId = editLocationData.unitId;

      const result = await onEdit(editingLocation.id, updateData);
      if (result.success) {
        resetEditForm();
      } else if (result.isConflict) {
        setConflictError({
          isOpen: true,
          message: result.error || 'מיקום עם שם זה כבר קיים ביחידה זו',
          itemName: editLocationData.name || editingLocation.name,
        });
      } else {
        alert(result.error || 'שגיאה בעדכון מיקום');
      }
    } catch (error) {
      alert('שגיאה בעדכון מיקום');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;

    const confirmMessage = `האם אתה בטוח שברצונך למחוק ${selectedIds.length} מיקומים?`;
    if (!window.confirm(confirmMessage)) return;

    setIsSubmitting(true);
    try {
      const result = await onDelete(selectedIds);
      if (result.success) {
        setSelectedIds([]);
      } else {
        alert(result.error || 'שגיאה במחיקת מיקומים');
      }
    } catch (error) {
      alert('שגיאה במחיקת מיקומים');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (location: LocationEntity) => {
    setEditingLocation(location);
    setEditLocationData({ name: location.name, unitId: location.unitId });
  };

  if (error) {
    return (
      <div className="error-container">
        <p className="error-message">{error}</p>
        <button className="btn btn-primary" onClick={onRefresh}>
          נסה שוב
        </button>
      </div>
    );
  }

  return (
    <div className="management-container">
      <div className="management-header">
        <h2>ניהול מיקומים</h2>
        <div className="management-actions">
          <button 
            className="btn btn-primary" 
            onClick={() => setIsAddModalOpen(true)}
            disabled={loading}
          >
            הוסף מיקום
          </button>
          {selectedIds.length > 0 && (
            <button 
              className="btn btn-danger" 
              onClick={handleBulkDelete}
              disabled={isSubmitting}
            >
              מחק נבחרים ({selectedIds.length})
            </button>
          )}
          <button 
            className="btn btn-ghost" 
            onClick={onRefresh}
            disabled={loading}
          >
            רענן
          </button>
        </div>
      </div>

      <div className="management-controls">
        <input
          type="text"
          className="form-control search-input"
          placeholder="חיפוש מיקומים או יחידות..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="loading-container">
          <p>טוען מיקומים...</p>
        </div>
      ) : (
        <>
          <div className="table-container">
            <table className="management-table">
              <thead>
                <tr>
                  <th>
                    <input
                      type="checkbox"
                      checked={paginatedItems.length > 0 && selectedIds.length === paginatedItems.length}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                    />
                  </th>
                  <th 
                    className="sortable-header"
                    onClick={() => handleSort('name')}
                    title="לחץ למיון לפי שם המיקום"
                    data-sorted={sortConfig?.key === 'name' ? 'true' : 'false'}
                  >
                    <div className="d-flex align-items-center justify-content-between">
                      <span>שם המיקום</span>
                      <div className="sort-indicator">
                        {getSortIcon('name')}
                      </div>
                    </div>
                  </th>
                  <th 
                    className="sortable-header"
                    onClick={() => handleSort('unitName')}
                    title="לחץ למיון לפי יחידה"
                    data-sorted={sortConfig?.key === 'unitName' ? 'true' : 'false'}
                  >
                    <div className="d-flex align-items-center justify-content-between">
                      <span>יחידה</span>
                      <div className="sort-indicator">
                        {getSortIcon('unitName')}
                      </div>
                    </div>
                  </th>
                  <th 
                    className="sortable-header"
                    onClick={() => handleSort('createdAt')}
                    title="לחץ למיון לפי תאריך יצירה"
                    data-sorted={sortConfig?.key === 'createdAt' ? 'true' : 'false'}
                  >
                    <div className="d-flex align-items-center justify-content-between">
                      <span>תאריך יצירה</span>
                      <div className="sort-indicator">
                        {getSortIcon('createdAt')}
                      </div>
                    </div>
                  </th>
                  <th 
                    className="sortable-header"
                    onClick={() => handleSort('updatedAt')}
                    title="לחץ למיון לפי תאריך עדכון"
                    data-sorted={sortConfig?.key === 'updatedAt' ? 'true' : 'false'}
                  >
                    <div className="d-flex align-items-center justify-content-between">
                      <span>תאריך עדכון</span>
                      <div className="sort-indicator">
                        {getSortIcon('updatedAt')}
                      </div>
                    </div>
                  </th>
                  <th>פעולות</th>
                </tr>
              </thead>
              <tbody>
                {paginatedItems.map((location) => (
                  <tr key={location.id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(location.id)}
                        onChange={(e) => handleSelectItem(location.id, e.target.checked)}
                      />
                    </td>
                    <td>{location.name}</td>
                    <td>{getUnitName(location.unitId)}</td>
                    <td>{new Date(location.createdAt).toLocaleDateString('he-IL')}</td>
                    <td>{new Date(location.updatedAt).toLocaleDateString('he-IL')}</td>
                    <td>
                      <button
                        className="btn btn-sm btn-ghost"
                        onClick={() => openEditModal(location)}
                      >
                        עדכן
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="pagination-container">
              <SmartPagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </>
      )}

      {/* Add Location Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={resetAddForm}
        title="הוסף מיקום חדש"
      >
        <div className="form-group">
          <label className="form-label">שם המיקום</label>
          <input
            type="text"
            className="form-control"
            value={newLocationData.name}
            onChange={(e) => setNewLocationData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="הכנס שם מיקום"
          />
        </div>
        <div className="form-group">
          <label className="form-label">יחידה</label>
          <select
            className="form-control"
            value={newLocationData.unitId}
            onChange={(e) => setNewLocationData(prev => ({ ...prev, unitId: e.target.value }))}
          >
            <option value="">בחר יחידה</option>
            {units.map(unit => (
              <option key={unit.id} value={unit.id}>{unit.name}</option>
            ))}
          </select>
        </div>
        <div className="btn-group btn-group-end">
          <button className="btn btn-ghost" onClick={resetAddForm}>
            ביטול
          </button>
          <button 
            className="btn btn-primary" 
            onClick={handleAdd}
            disabled={isSubmitting || !newLocationData.name.trim() || !newLocationData.unitId}
          >
            {isSubmitting ? 'יוצר...' : 'צור'}
          </button>
        </div>
      </Modal>

      {/* Edit Location Modal */}
      <Modal
        isOpen={!!editingLocation}
        onClose={resetEditForm}
        title="ערוך מיקום"
      >
        <div className="form-group">
          <label className="form-label">שם המיקום</label>
          <input
            type="text"
            className="form-control"
            value={editLocationData.name}
            onChange={(e) => setEditLocationData(prev => ({ ...prev, name: e.target.value }))}
            placeholder={editingLocation?.name}
          />
        </div>
        <div className="form-group">
          <label className="form-label">יחידה</label>
          <select
            className="form-control"
            value={editLocationData.unitId}
            onChange={(e) => setEditLocationData(prev => ({ ...prev, unitId: e.target.value }))}
          >
            <option value="">השאר ללא שינוי</option>
            {units.map(unit => (
              <option key={unit.id} value={unit.id}>{unit.name}</option>
            ))}
          </select>
        </div>
        <div className="btn-group btn-group-end">
          <button className="btn btn-ghost" onClick={resetEditForm}>
            ביטול
          </button>
          <button 
            className="btn btn-primary" 
            onClick={handleEdit}
            disabled={isSubmitting || (!editLocationData.name.trim() && !editLocationData.unitId)}
          >
            {isSubmitting ? 'מעדכן...' : 'עדכן'}
          </button>
        </div>
      </Modal>

      {/* Conflict Error Modal */}
      <ConflictErrorModal
        isOpen={conflictError.isOpen}
        onClose={() => setConflictError({ isOpen: false, message: '', itemName: '' })}
        title="מיקום כבר קיים"
        message={conflictError.message}
        resolutionMessage="אנא בחר שם אחר למיקום או יחידה אחרת."
        type="item"
      />
    </div>
  );
};
