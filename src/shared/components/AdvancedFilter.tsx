import React, { useState, useEffect } from 'react';
import { Item } from '../../types';
import './AdvancedFilter.css';

export interface AdvancedFilterCriteria {
  itemNameId?: string;
  allocatedLocationId?: string;
  receiptLocationName?: string;
  status?: 'operational' | 'non-operational' | 'available' | 'not-available';
  hasIdNumber?: boolean;
  noteText?: string;
}

interface AdvancedFilterProps {
  /** Available items to extract filter options from */
  items: Item[];
  /** Current filter criteria */
  filters: AdvancedFilterCriteria;
  /** Handler for filter changes */
  onFiltersChange: (filters: AdvancedFilterCriteria) => void;
  /** Whether the filter panel is open */
  isOpen: boolean;
  /** Handler for toggling filter panel */
  onToggle: () => void;
  /** Whether user is admin (affects available options) */
  isAdmin?: boolean;
}

const AdvancedFilter: React.FC<AdvancedFilterProps> = ({
  items,
  filters,
  onFiltersChange,
  isOpen,
  onToggle,
  isAdmin = false
}) => {
  // Extract unique options from items
  const uniqueItemNames = Array.from(
    new Map(
      items
        .filter(item => item.itemName?.name && item.nameId)
        .map(item => [item.nameId, { id: item.nameId, name: item.itemName!.name }])
    ).values()
  ).sort((a, b) => a.name.localeCompare(b.name, 'he'));

  const uniqueAllocatedLocations = Array.from(
    new Map(
      items
        .filter(item => item.allocatedLocation?.name && item.allocatedLocationId)
        .map(item => [
          item.allocatedLocationId,
          {
            id: item.allocatedLocationId!,
            name: item.allocatedLocation!.name,
            unit: item.allocatedLocation!.unit?.name
          }
        ])
    ).values()
  ).sort((a, b) => a.name.localeCompare(b.name, 'he'));

  const uniqueReceiptLocations = Array.from(
    new Set(
      items
        .filter(item => item.receiptInfo?.signedBy?.location?.name)
        .map(item => item.receiptInfo!.signedBy.location.name)
    )
  ).sort((a, b) => a.localeCompare(b, 'he'));

  // Status options
  const statusOptions = [
    { value: 'operational', label: 'תקין', color: 'success' },
    { value: 'non-operational', label: 'תקול', color: 'warning' },
    { value: 'available', label: 'זמין', color: 'success' },
    { value: 'not-available', label: 'לא זמין', color: 'danger' }
  ];

  // ID Number options
  const idNumberOptions = [
    { value: true, label: 'עם מספר צ\'', color: 'primary' },
    { value: false, label: 'ללא מספר צ\'', color: 'secondary' }
  ];



  const handleFilterChange = (key: keyof AdvancedFilterCriteria, value: any) => {
    const newFilters = { ...filters };
    if (value === '' || value === null || value === undefined) {
      delete newFilters[key];
    } else {
      newFilters[key] = value;
    }
    onFiltersChange(newFilters);
  };

  const clearAllFilters = () => {
    onFiltersChange({});
  };

  const hasActiveFilters = Object.keys(filters).length > 0;
  const activeFiltersCount = Object.keys(filters).length;

  return (
    <div className="advanced-filter-container">
      {/* Filter Toggle Button */}
      <button
        className={`advanced-filter-toggle ${isOpen ? 'active' : ''} ${hasActiveFilters ? 'has-filters' : ''}`}
        onClick={onToggle}
        title="חיפוש מתקדם"
      >
        <i className="fas fa-filter"></i>
        <span>חיפוש מתקדם</span>
        {hasActiveFilters && (
          <span className="filter-count-badge">{activeFiltersCount}</span>
        )}
        <i className={`fas fa-chevron-${isOpen ? 'up' : 'down'} toggle-icon`}></i>
      </button>

      {/* Filter Panel */}
      <div className={`advanced-filter-panel ${isOpen ? 'open' : ''}`}>
        <div className="filter-panel-content">
          {/* Panel Header */}
          <div className="filter-panel-header">
            <h4>
              <i className="fas fa-sliders-h"></i>
              פילטרים מתקדמים
            </h4>
            {hasActiveFilters && (
              <button
                className="btn btn-outline-secondary btn-sm clear-filters-btn"
                onClick={clearAllFilters}
                title="נקה את כל הפילטרים"
              >
                <i className="fas fa-times"></i>
                נקה הכל
              </button>
            )}
          </div>

          {/* Filter Grid */}
          <div className="filter-grid">
            {/* Item Name Filter */}
            <div className="filter-group">
              <label className="filter-label">
                <i className="fas fa-tag"></i>
                שם פריט
              </label>
              <select
                className="form-select filter-select"
                value={filters.itemNameId || ''}
                onChange={(e) => handleFilterChange('itemNameId', e.target.value)}
              >
                <option value="">כל הפריטים</option>
                {uniqueItemNames.map(item => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Allocated Location Filter */}
            <div className="filter-group">
              <label className="filter-label">
                <i className="fas fa-map-marker-alt"></i>
                הקצאה
              </label>
              <select
                className="form-select filter-select"
                value={filters.allocatedLocationId || ''}
                onChange={(e) => handleFilterChange('allocatedLocationId', e.target.value)}
              >
                <option value="">כל ההקצאות</option>
                {uniqueAllocatedLocations.map(location => (
                  <option key={location.id} value={location.id}>
                    {location.name} {location.unit && `(${location.unit})`}
                  </option>
                ))}
              </select>
            </div>

            {/* Receipt Location Filter */}
            <div className="filter-group">
              <label className="filter-label">
                <i className="fas fa-location-arrow"></i>
                מיקום
              </label>
              <select
                className="form-select filter-select"
                value={filters.receiptLocationName || ''}
                onChange={(e) => handleFilterChange('receiptLocationName', e.target.value)}
              >
                <option value="">כל המיקומים</option>
                {uniqueReceiptLocations.map(location => (
                  <option key={location} value={location}>
                    {location}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="filter-group">
              <label className="filter-label">
                <i className="fas fa-info-circle"></i>
                סטטוס
              </label>
              <select
                className="form-select filter-select"
                value={filters.status || ''}
                onChange={(e) => handleFilterChange('status', e.target.value)}
              >
                <option value="">כל הסטטוסים</option>
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* ID Number Filter */}
            <div className="filter-group">
              <label className="filter-label">
                <i className="fas fa-hashtag"></i>
                מספר צ'
              </label>
              <select
                className="form-select filter-select"
                value={filters.hasIdNumber !== undefined ? filters.hasIdNumber.toString() : ''}
                onChange={(e) => handleFilterChange('hasIdNumber', e.target.value === '' ? undefined : e.target.value === 'true')}
              >
                <option value="">הכל</option>
                {idNumberOptions.map(option => (
                  <option key={option.value.toString()} value={option.value.toString()}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Note Filter */}
            <div className="filter-group">
              <label className="filter-label">
                <i className="fas fa-sticky-note"></i>
                חיפוש בהערות
              </label>
              <input
                type="text"
                className="form-control filter-select"
                placeholder="הקלד טקסט לחיפוש בהערות..."
                value={filters.noteText || ''}
                onChange={(e) => handleFilterChange('noteText', e.target.value)}
              />
            </div>
          </div>

          {/* Active Filters Summary */}
          {hasActiveFilters && (
            <div className="active-filters-summary">
              <div className="active-filters-header">
                <span>פילטרים פעילים:</span>
              </div>
              <div className="active-filters-list">
                {filters.itemNameId && (
                  <span className="filter-tag">
                    <i className="fas fa-tag"></i>
                    {uniqueItemNames.find(item => item.id === filters.itemNameId)?.name}
                    <button
                      className="remove-filter"
                      onClick={() => handleFilterChange('itemNameId', '')}
                      title="הסר פילטר"
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  </span>
                )}
                {filters.allocatedLocationId && (
                  <span className="filter-tag">
                    <i className="fas fa-map-marker-alt"></i>
                    {uniqueAllocatedLocations.find(loc => loc.id === filters.allocatedLocationId)?.name}
                    <button
                      className="remove-filter"
                      onClick={() => handleFilterChange('allocatedLocationId', '')}
                      title="הסר פילטר"
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  </span>
                )}
                {filters.receiptLocationName && (
                  <span className="filter-tag">
                    <i className="fas fa-location-arrow"></i>
                    {filters.receiptLocationName}
                    <button
                      className="remove-filter"
                      onClick={() => handleFilterChange('receiptLocationName', '')}
                      title="הסר פילטר"
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  </span>
                )}
                {filters.status && (
                  <span className="filter-tag">
                    <i className="fas fa-info-circle"></i>
                    {statusOptions.find(opt => opt.value === filters.status)?.label}
                    <button
                      className="remove-filter"
                      onClick={() => handleFilterChange('status', '')}
                      title="הסר פילטר"
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  </span>
                )}
                {filters.hasIdNumber !== undefined && (
                  <span className="filter-tag">
                    <i className="fas fa-hashtag"></i>
                    {filters.hasIdNumber ? 'עם מספר צ\'' : 'ללא מספר צ\''}
                    <button
                      className="remove-filter"
                      onClick={() => handleFilterChange('hasIdNumber', undefined)}
                      title="הסר פילטר"
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  </span>
                )}
                {filters.noteText && (
                  <span className="filter-tag">
                    <i className="fas fa-sticky-note"></i>
                    הערה: "{filters.noteText}"
                    <button
                      className="remove-filter"
                      onClick={() => handleFilterChange('noteText', '')}
                      title="הסר פילטר"
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdvancedFilter;