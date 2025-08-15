import React, { useState } from 'react';
import { ItemSelectorProps } from '../types/receipt-form.types';

const ItemSelector: React.FC<ItemSelectorProps> = ({
  availableItems,
  selectedItems,
  onAddItem,
  loading = false,
  error
}) => {
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Filter items based on search term
  const filteredItems = availableItems.filter(item => {
    if (!searchTerm.trim()) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      item.displayName.toLowerCase().includes(searchLower) ||
      item.idNumber?.toLowerCase().includes(searchLower) ||
      item.allocatedLocation?.name?.toLowerCase().includes(searchLower)
    );
  });

  // Get selected item details
  const selectedItem = filteredItems.find(item => item.id === selectedItemId);
  const maxQuantity = selectedItem?.maxQuantity || 1;
  const isCipherItem = selectedItem?.requiresReporting || false;

  // Handle adding item
  const handleAddItem = () => {
    if (!selectedItem) return;

    onAddItem(selectedItem, quantity);
    
    // Reset form
    setSelectedItemId('');
    setQuantity(1);
    setSearchTerm('');
  };

  // Reset quantity when item changes
  React.useEffect(() => {
    if (selectedItem) {
      setQuantity(prevQuantity => Math.min(prevQuantity, maxQuantity));
    }
  }, [selectedItem, maxQuantity]);

  return (
    <div className="form-group mb-4">
      <label className="form-label required">
        <i className="fas fa-box me-2"></i>
        הוסף פריטים לקבלה:
      </label>

      {error && (
        <div className="alert alert-danger">
          <i className="fas fa-exclamation-triangle me-2"></i>
          {error}
        </div>
      )}

      {/* Search input */}
      <div className="mb-3">
        <div className="input-group">
          <span className="input-group-text">
            <i className="fas fa-search"></i>
          </span>
          <input
            type="text"
            className="form-control"
            placeholder="חפש פריטים לפי שם, מספר צ' או מיקום..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            disabled={loading}
          />
          {searchTerm && (
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={() => setSearchTerm('')}
              title="נקה חיפוש"
            >
              <i className="fas fa-times"></i>
            </button>
          )}
        </div>
        
        {searchTerm && (
          <small className="text-muted mt-1 d-block">
            נמצאו {filteredItems.length} פריטים מתוך {availableItems.length}
          </small>
        )}
      </div>

      {/* Item selection */}
      <div className="row g-3">
        <div className="col-md-6">
          <label htmlFor="item-select" className="form-label">בחר פריט:</label>
          <select
            id="item-select"
            className="form-control"
            value={selectedItemId}
            onChange={(e) => setSelectedItemId(e.target.value)}
            disabled={loading}
          >
            <option value="">
              {loading ? 'טוען פריטים...' : 
               searchTerm ? `בחר מתוך ${filteredItems.length} פריטים...` :
               'בחר פריט...'}
            </option>
            
            {!loading && filteredItems.length === 0 && searchTerm && (
              <option value="" disabled>לא נמצאו פריטים התואמים לחיפוש</option>
            )}
            
            {!loading && availableItems.length === 0 && (
              <option value="" disabled>אין פריטים זמינים</option>
            )}
            
            {filteredItems.map(item => (
              <option key={item.id} value={item.id}>
                {item.itemName?.name || 'פריט לא ידוע'}
                {item.allocatedLocation && ` (${item.allocatedLocation.name})`}
                {item.requiresReporting ? ' - צופן' : ''}
                {item.idNumber && ` - צ': ${item.idNumber}`}
              </option>
            ))}
          </select>
        </div>

        {/* Quantity selection for non-cipher items */}
        {selectedItem && !isCipherItem && maxQuantity > 1 && (
          <div className="col-md-3">
            <label htmlFor="quantity-select" className="form-label">
              כמות (מקסימום {maxQuantity}):
            </label>
            <select
              id="quantity-select"
              className="form-control"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value))}
            >
              {Array.from({ length: maxQuantity }, (_, i) => i + 1).map(num => (
                <option key={num} value={num}>{num}</option>
              ))}
            </select>
          </div>
        )}

        <div className="col-md-3 d-flex align-items-end">
          <button
            type="button"
            className="btn btn-primary w-100"
            onClick={handleAddItem}
            disabled={!selectedItem || loading}
          >
            <i className="fas fa-plus me-2"></i>
            הוסף פריט
          </button>
        </div>
      </div>

      {/* Item details */}
      {selectedItem && (
        <div className="mt-3 p-3 bg-light rounded">
          <h6 className="mb-2">
            <i className="fas fa-info-circle me-2"></i>
            פרטי הפריט:
          </h6>
          <div className="row">
            <div className="col-md-4">
              <small className="text-muted">שם הפריט:</small>
              <div className="fw-bold">{selectedItem.itemName?.name}</div>
            </div>
            {selectedItem.allocatedLocation && (
              <div className="col-md-4">
                <small className="text-muted">מיקום מוקצה:</small>
                <div className="fw-bold text-primary">
                  <i className="fas fa-map-marker-alt me-1"></i>
                  {selectedItem.allocatedLocation.name}
                  {selectedItem.allocatedLocation.unit?.name && (
                    <small className="text-muted d-block">
                      יחידה: {selectedItem.allocatedLocation.unit.name}
                    </small>
                  )}
                </div>
              </div>
            )}
            {selectedItem.idNumber && (
              <div className="col-md-4">
                <small className="text-muted">מספר צ':</small>
                <div className="font-monospace fw-bold">{selectedItem.idNumber}</div>
              </div>
            )}
            <div className="col-md-4">
              <small className="text-muted">סוג פריט:</small>
              <div>
                <span className={`badge ${selectedItem.requiresReporting ? 'bg-warning text-dark' : 'bg-success'}`}>
                  <i className={`fas ${selectedItem.requiresReporting ? 'fa-shield-alt' : 'fa-box'} me-1`}></i>
                  {selectedItem.requiresReporting ? 'צופן' : 'רגיל'}
                </span>
              </div>
            </div>
          </div>
          
          {selectedItem.requiresReporting && (
            <div className="alert alert-warning mt-2 mb-0">
              <i className="fas fa-exclamation-triangle me-2"></i>
              <small>פריטי צופן מוגבלים לכמות 1 בלבד</small>
            </div>
          )}
        </div>
      )}

      {/* Available items summary */}
      {!loading && (
        <div className="mt-3">
          <small className="text-muted">
            <i className="fas fa-info-circle me-1"></i>
            זמינים {availableItems.length} פריטים סה"כ
            {searchTerm && ` (${filteredItems.length} מתאימים לחיפוש)`}
          </small>
        </div>
      )}
    </div>
  );
};

export default ItemSelector;
