import React from 'react';
import './SearchInput.css';

interface SearchInputProps {
  /** Search term value */
  value: string;
  /** Handler for search term changes */
  onChange: (value: string) => void;
  /** Placeholder text for the input */
  placeholder?: string;
  /** Results count to display in badge */
  resultsCount?: number;
  /** Results label (e.g., "פריטים", "משתמשים") */
  resultsLabel?: string;
  /** Whether to show the clear button when there's a search term */
  showClearButton?: boolean;
  /** Additional CSS class names */
  className?: string;
  /** Whether the input is disabled */
  disabled?: boolean;
  /** Custom ID for the input element */
  id?: string;
}

const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChange,
  placeholder = "הקלד לחיפוש...",
  resultsCount,
  resultsLabel = "תוצאות",
  showClearButton = true,
  className = "",
  disabled = false,
  id
}) => {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  const handleClear = () => {
    onChange('');
  };

  const hasResults = resultsCount !== undefined && value;
  const showClear = showClearButton && value;

  return (
    <div className={`modern-search-container ${className}`}>
      <div 
        className={`modern-search-input-group ${hasResults ? 'has-results' : ''} ${showClear ? 'has-clear' : ''}`}
      >
        <i className="fas fa-search modern-search-icon"></i>
        <input
          id={id}
          type="text"
          value={value}
          onChange={handleInputChange}
          placeholder={placeholder}
          disabled={disabled}
          className="modern-search-input"
          style={{
            paddingLeft: hasResults && showClear ? '220px' : 
                         hasResults ? '160px' : 
                         showClear ? '70px' : '24px'
          }}
        />
        
        {hasResults && (
          <div className="modern-search-results-inline">
            <span className="modern-search-results-badge">
              {resultsCount} {resultsLabel}
            </span>
          </div>
        )}
        
        {showClear && (
          <button
            type="button"
            onClick={handleClear}
            className="modern-search-clear"
            title="נקה חיפוש"
          >
            נקה
          </button>
        )}
      </div>
    </div>
  );
};

export default SearchInput;
