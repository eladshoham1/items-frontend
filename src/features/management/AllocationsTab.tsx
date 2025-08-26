import React, { useEffect, useState, useMemo } from 'react';
import { AllocationEntity, CreateAllocationRequest, UpdateAllocationRequest } from '../../types';
import { managementService } from '../../services';
import { BulkDeleteErrorModal, Modal, LoadingSpinner, NotificationModal } from '../../shared/components';
import type { NotificationType } from '../../shared/components/NotificationModal';

interface EditingCell {
  id: string;
  field: keyof AllocationEntity;
  value: string | boolean;
}

export const AllocationsTab: React.FC = () => {
  const [allocations, setAllocations] = useState<AllocationEntity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newAllocation, setNewAllocation] = useState<CreateAllocationRequest>({
    unit: '',
    secondaryUnit: '',
    owner: '',
    vehicleType: '',
    idNumber: '',
    standard: '',
    isIssued: false,
    form624: '',
    is624Issued: false,
    note: '',
  });
  
  const [bulkDeleteError, setBulkDeleteError] = useState({
    isOpen: false,
    message: '',
    deletedCount: 0,
    totalCount: 0,
    errors: [] as string[],
  });

  const [sortConfig, setSortConfig] = useState<{
    key: keyof AllocationEntity;
    direction: 'asc' | 'desc';
  } | null>(null);

  const [notification, setNotification] = useState<{
    isOpen: boolean;
    type: NotificationType;
    message: string;
    title?: string;
  }>({
    isOpen: false,
    type: 'info',
    message: ''
  });

  const showNotification = (type: NotificationType, message: string, title?: string) => {
    setNotification({
      isOpen: true,
      type,
      message,
      title
    });
  };

  const closeNotification = () => {
    setNotification(prev => ({ ...prev, isOpen: false }));
  };

  useEffect(() => {
    loadAllocations();
  }, []);

  const loadAllocations = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await managementService.getAllAllocations();
      if (result.success && result.data) {
        setAllocations(result.data);
      } else {
        setError(result.error || 'שגיאה בטעינת השבצ"ק');
      }
    } catch (err: any) {
      setError('שגיאה בטעינת השבצ"ק');
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (key: keyof AllocationEntity) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const filteredAndSortedAllocations = useMemo(() => {
    let filtered = allocations.filter(allocation => {
      const searchLower = searchTerm.toLowerCase().normalize('NFC');
      return (
        allocation.unit.toLowerCase().normalize('NFC').includes(searchLower) ||
        allocation.secondaryUnit.toLowerCase().normalize('NFC').includes(searchLower) ||
        allocation.owner.toLowerCase().normalize('NFC').includes(searchLower) ||
        allocation.standard.toLowerCase().normalize('NFC').includes(searchLower) ||
        (allocation.vehicleType && allocation.vehicleType.toLowerCase().normalize('NFC').includes(searchLower)) ||
        (allocation.idNumber && allocation.idNumber.toLowerCase().normalize('NFC').includes(searchLower)) ||
        (allocation.form624 && allocation.form624.toLowerCase().normalize('NFC').includes(searchLower)) ||
        (allocation.note && allocation.note.toLowerCase().normalize('NFC').includes(searchLower))
      );
    });

    if (sortConfig) {
      filtered.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];
        
        // Handle null values
        if (aValue === null) aValue = '';
        if (bValue === null) bValue = '';
        
        // Convert to string for comparison if needed
        if (typeof aValue === 'boolean') aValue = aValue.toString();
        if (typeof bValue === 'boolean') bValue = bValue.toString();
        
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          const result = aValue.localeCompare(bValue, 'he');
          return sortConfig.direction === 'asc' ? result : -result;
        }
        
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [allocations, searchTerm, sortConfig]);

  const handleCellClick = (allocation: AllocationEntity, field: keyof AllocationEntity) => {
    if (field === 'id' || field === 'createdAt' || field === 'updatedAt') return;
    
    setEditingCell({
      id: allocation.id,
      field,
      value: allocation[field] || ''
    });
  };

  const handleCellSave = async () => {
    if (!editingCell) return;

    try {
      const updateData: UpdateAllocationRequest = {
        [editingCell.field]: editingCell.value
      };

      const result = await managementService.updateAllocation(editingCell.id, updateData);
      
      if (result.success) {
        setAllocations(prev => prev.map(allocation => 
          allocation.id === editingCell.id 
            ? { ...allocation, [editingCell.field]: editingCell.value }
            : allocation
        ));
        setEditingCell(null);
      } else {
        showNotification('error', result.error || 'שגיאה בעדכון השבצק');
      }
    } catch (err: any) {
      showNotification('error', 'שגיאה בעדכון השבצק');
    }
  };

  const handleCellCancel = () => {
    setEditingCell(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCellSave();
    } else if (e.key === 'Escape') {
      handleCellCancel();
    }
  };

  const handleCreate = async () => {
    if (!newAllocation.unit || !newAllocation.secondaryUnit || !newAllocation.owner || !newAllocation.standard) {
      showNotification('warning', 'יש למלא את כל השדות הדרושים: מסגרת, מסגרת משנה, בעת, תקן');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await managementService.createAllocation(newAllocation);
      
      if (result.success && result.data) {
        setAllocations(prev => [...prev, result.data!]);
        setNewAllocation({
          unit: '',
          secondaryUnit: '',
          owner: '',
          vehicleType: '',
          idNumber: '',
          standard: '',
          isIssued: false,
          form624: '',
          is624Issued: false,
          note: '',
        });
        setIsAddModalOpen(false);
      } else {
        showNotification('error', result.error || 'שגיאה ביצירת השבצק');
      }
    } catch (err: any) {
      showNotification('error', 'שגיאה ביצירת השבצק');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (selectedIds.length === 0) {
      showNotification('warning', 'יש לבחור פריטים למחיקה');
      return;
    }

    if (!window.confirm(`האם אתה בטוח שברצונך למחוק ${selectedIds.length} שבצק?`)) {
      return;
    }

    try {
      const result = await managementService.deleteAllocations({ ids: selectedIds });
      
      if (result.success && result.data) {
        if (result.data.deleted) {
          setAllocations(prev => prev.filter(allocation => !selectedIds.includes(allocation.id)));
          setSelectedIds([]);
          showNotification('success', `נמחקו בהצלחה ${result.data.deletedCount} שבצק`);
        } else {
          setBulkDeleteError({
            isOpen: true,
            message: result.data.message,
            deletedCount: result.data.deletedCount,
            totalCount: selectedIds.length,
            errors: [],
          });
        }
      } else {
        showNotification('error', result.error || 'שגיאה במחיקת השבצק');
      }
    } catch (err: any) {
      showNotification('error', 'שגיאה במחיקת השבצק');
    }
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filteredAndSortedAllocations.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredAndSortedAllocations.map(allocation => allocation.id));
    }
  };

  const renderCell = (allocation: AllocationEntity, field: keyof AllocationEntity) => {
    const isEditing = editingCell?.id === allocation.id && editingCell?.field === field;
    const value = allocation[field];

    if (field === 'id' || field === 'createdAt' || field === 'updatedAt') {
      return <span>{String(value)}</span>;
    }

    if (isEditing) {
      if (field === 'isIssued' || field === 'is624Issued') {
        return (
          <input
            type="checkbox"
            checked={Boolean(editingCell.value)}
            onChange={(e) => setEditingCell({ ...editingCell, value: e.target.checked })}
            onBlur={handleCellSave}
            onKeyDown={handleKeyDown}
            autoFocus
            className="form-check-input"
          />
        );
      }

      return (
        <input
          type="text"
          value={String(editingCell.value)}
          onChange={(e) => setEditingCell({ ...editingCell, value: e.target.value })}
          onBlur={handleCellSave}
          onKeyDown={handleKeyDown}
          autoFocus
          className="form-control form-control-sm"
          style={{ minWidth: '100px' }}
        />
      );
    }

    if (field === 'isIssued' || field === 'is624Issued') {
      return (
        <span 
          className={`badge ${value ? 'bg-success' : 'bg-secondary'}`}
          onClick={() => handleCellClick(allocation, field)}
          style={{ cursor: 'pointer' }}
        >
          {value ? 'כן' : 'לא'}
        </span>
      );
    }

    return (
      <span 
        onClick={() => handleCellClick(allocation, field)}
        style={{ cursor: 'pointer', minHeight: '20px', display: 'block' }}
        title="לחץ לעריכה"
      >
        {value || '-'}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="management-container">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger">
        <i className="fas fa-exclamation-circle me-2"></i>
        {error}
        <button className="btn btn-outline-danger btn-sm ms-2" onClick={loadAllocations}>
          נסה שוב
        </button>
      </div>
    );
  }

  return (
    <div className="management-container">
      {/* Compact Header with Actions */}
      <div className="management-header-compact">
        <div className="management-search-section">
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="text"
              className="management-search-input"
              placeholder="חפש לפי מסגרת, מסגרת משנה, בעל, סוג הכלי, תקן..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ flex: 1 }}
            />
            {searchTerm && (
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setSearchTerm('')}
                title="נקה חיפוש"
                style={{ 
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  padding: '0 12px',
                  minWidth: 'auto'
                }}
              >
                <i className="fas fa-times" style={{ fontSize: '12px' }}></i>
                <span style={{ fontSize: '12px', fontWeight: '500' }}>נקה</span>
              </button>
            )}
          </div>
        </div>
        
        <div className="management-actions-compact">
          <button
            className="btn btn-primary btn-sm"
            onClick={() => setIsAddModalOpen(true)}
            disabled={loading}
            title="הוסף שבצק חדש"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '0 16px'
            }}
          >
            <i className="fas fa-plus" style={{ fontSize: '13px' }}></i>
            <span style={{ fontSize: '13px', fontWeight: '600' }}>הוסף חדש</span>
          </button>
          
          {selectedIds.length > 0 && (
            <button
              className="btn btn-danger btn-sm"
              onClick={handleDelete}
              disabled={isSubmitting}
              title={`מחק ${selectedIds.length} שבצקים נבחרים`}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                padding: '0 12px'
              }}
            >
              <i className="fas fa-trash" style={{ fontSize: '12px' }}></i>
              <span style={{ fontSize: '12px', fontWeight: '500' }}>מחק ({selectedIds.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="unified-table-container">
        <table className="unified-table">
          <thead>
            <tr>
              <th className="unified-table-header unified-table-header-sticky" style={{ width: '50px' }}>
                <input
                  type="checkbox"
                  className="form-check-input"
                  checked={selectedIds.length === filteredAndSortedAllocations.length && filteredAndSortedAllocations.length > 0}
                  onChange={handleSelectAll}
                />
              </th>
              <th 
                className="unified-table-header unified-table-header-regular sortable" 
                onClick={() => handleSort('unit')}
                style={{ cursor: 'pointer' }}
              >
                מסגרת
              </th>
              <th 
                className="unified-table-header unified-table-header-regular sortable" 
                onClick={() => handleSort('secondaryUnit')}
                style={{ cursor: 'pointer' }}
              >
                מסגרת משנה
              </th>
              <th 
                className="unified-table-header unified-table-header-regular sortable" 
                onClick={() => handleSort('owner')}
                style={{ cursor: 'pointer' }}
              >
                בע"ת
              </th>
              <th 
                className="unified-table-header unified-table-header-regular sortable" 
                onClick={() => handleSort('vehicleType')}
                style={{ cursor: 'pointer' }}
              >
                סוג הכלי
              </th>
              <th 
                className="unified-table-header unified-table-header-regular sortable" 
                onClick={() => handleSort('idNumber')}
                style={{ cursor: 'pointer' }}
              >
                צ'
              </th>
              <th 
                className="unified-table-header unified-table-header-regular sortable" 
                onClick={() => handleSort('standard')}
                style={{ cursor: 'pointer' }}
              >
                תקן
              </th>
              <th 
                className="unified-table-header unified-table-header-regular sortable" 
                onClick={() => handleSort('isIssued')}
                style={{ cursor: 'pointer' }}
              >
                הונפק קשר
              </th>
              <th 
                className="unified-table-header unified-table-header-regular sortable" 
                onClick={() => handleSort('form624')}
                style={{ cursor: 'pointer' }}
              >
                624
              </th>
              <th 
                className="unified-table-header unified-table-header-regular sortable" 
                onClick={() => handleSort('is624Issued')}
                style={{ cursor: 'pointer' }}
              >
                הונפק 624
              </th>
              <th 
                className="unified-table-header unified-table-header-regular sortable" 
                onClick={() => handleSort('note')}
                style={{ cursor: 'pointer' }}
              >
                הערות
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredAndSortedAllocations.map((allocation) => (
              <tr key={allocation.id} className="unified-table-row">
                <td className="unified-table-cell-sticky">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    checked={selectedIds.includes(allocation.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedIds([...selectedIds, allocation.id]);
                      } else {
                        setSelectedIds(selectedIds.filter(id => id !== allocation.id));
                      }
                    }}
                  />
                </td>
                <td className="unified-table-cell">{renderCell(allocation, 'unit')}</td>
                <td className="unified-table-cell">{renderCell(allocation, 'secondaryUnit')}</td>
                <td className="unified-table-cell">{renderCell(allocation, 'owner')}</td>
                <td className="unified-table-cell">{renderCell(allocation, 'vehicleType')}</td>
                <td className="unified-table-cell">{renderCell(allocation, 'idNumber')}</td>
                <td className="unified-table-cell">{renderCell(allocation, 'standard')}</td>
                <td className="unified-table-cell">{renderCell(allocation, 'isIssued')}</td>
                <td className="unified-table-cell">{renderCell(allocation, 'form624')}</td>
                <td className="unified-table-cell">{renderCell(allocation, 'is624Issued')}</td>
                <td className="unified-table-cell">{renderCell(allocation, 'note')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredAndSortedAllocations.length === 0 && (
        <div className="text-center py-4">
          <i className="fas fa-inbox fa-3x text-muted mb-3"></i>
          <h5 className="text-muted">אין שבצ"ק להצגה</h5>
          <p className="text-muted">
            {searchTerm ? 'לא נמצאו תוצאות עבור החיפוש' : 'עדיין לא נוספו שבצ"ק למערכת'}
          </p>
        </div>
      )}

      {/* Add Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setNewAllocation({
            unit: '',
            secondaryUnit: '',
            owner: '',
            vehicleType: '',
            idNumber: '',
            standard: '',
            isIssued: false,
            form624: '',
            is624Issued: false,
            note: '',
          });
        }}
        title="הוסף שבצק חדש"
        size="lg"
      >
        <div className="p-4">
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label">מסגרת <span className="text-danger">*</span></label>
              <input
                type="text"
                className="form-control"
                value={newAllocation.unit}
                onChange={(e) => setNewAllocation({ ...newAllocation, unit: e.target.value })}
                placeholder="הכנס מסגרת"
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">מסגרת משנה <span className="text-danger">*</span></label>
              <input
                type="text"
                className="form-control"
                value={newAllocation.secondaryUnit}
                onChange={(e) => setNewAllocation({ ...newAllocation, secondaryUnit: e.target.value })}
                placeholder="הכנס מסגרת משנה"
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">בע"ת <span className="text-danger">*</span></label>
              <input
                type="text"
                className="form-control"
                value={newAllocation.owner}
                onChange={(e) => setNewAllocation({ ...newAllocation, owner: e.target.value })}
                placeholder="הכנס בעת"
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">סוג הכלי</label>
              <input
                type="text"
                className="form-control"
                value={newAllocation.vehicleType || ''}
                onChange={(e) => setNewAllocation({ ...newAllocation, vehicleType: e.target.value })}
                placeholder="הכנס סוג הכלי"
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">תקן <span className="text-danger">*</span></label>
              <input
                type="text"
                className="form-control"
                value={newAllocation.standard}
                onChange={(e) => setNewAllocation({ ...newAllocation, standard: e.target.value })}
                placeholder="הכנס תקן"
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">צ'</label>
              <input
                type="text"
                className="form-control"
                value={newAllocation.idNumber || ''}
                onChange={(e) => setNewAllocation({ ...newAllocation, idNumber: e.target.value })}
                placeholder="הכנס צ'"
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">624</label>
              <input
                type="text"
                className="form-control"
                value={newAllocation.form624 || ''}
                onChange={(e) => setNewAllocation({ ...newAllocation, form624: e.target.value })}
                placeholder="הכנס 624"
              />
            </div>
            <div className="col-md-12">
              <label className="form-label">הערות</label>
              <textarea
                className="form-control"
                rows={3}
                value={newAllocation.note || ''}
                onChange={(e) => setNewAllocation({ ...newAllocation, note: e.target.value })}
                placeholder="הכנס הערות"
              />
            </div>
            <div className="col-md-6">
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="checkbox"
                  checked={newAllocation.isIssued}
                  onChange={(e) => setNewAllocation({ ...newAllocation, isIssued: e.target.checked })}
                />
                <label className="form-check-label">הונפק קשר</label>
              </div>
            </div>
            <div className="col-md-6">
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="checkbox"
                  checked={newAllocation.is624Issued}
                  onChange={(e) => setNewAllocation({ ...newAllocation, is624Issued: e.target.checked })}
                />
                <label className="form-check-label">הונפק 624</label>
              </div>
            </div>
          </div>
          
          <div className="d-flex justify-content-end gap-2 mt-4">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setIsAddModalOpen(false);
                setNewAllocation({
                  unit: '',
                  secondaryUnit: '',
                  owner: '',
                  vehicleType: '',
                  idNumber: '',
                  standard: '',
                  isIssued: false,
                  form624: '',
                  is624Issued: false,
                  note: '',
                });
              }}
            >
              ביטול
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleCreate}
              disabled={!newAllocation.unit || !newAllocation.secondaryUnit || !newAllocation.owner || !newAllocation.standard || isSubmitting}
            >
              {isSubmitting ? 'שומר...' : 'הוסף'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Bulk Delete Error Modal */}
      <BulkDeleteErrorModal
        isOpen={bulkDeleteError.isOpen}
        onClose={() => setBulkDeleteError({ ...bulkDeleteError, isOpen: false })}
        title="שגיאה במחיקת שבצק"
        message={bulkDeleteError.message}
        deletedCount={bulkDeleteError.deletedCount}
        totalCount={bulkDeleteError.totalCount}
        errors={bulkDeleteError.errors}
        type="item"
      />

      <NotificationModal
        isOpen={notification.isOpen}
        onClose={closeNotification}
        type={notification.type}
        message={notification.message}
        title={notification.title}
      />
    </div>
  );
};
