import { useState } from 'react';

export default function ScoreInput({ value, onChange, disabled = false, label }) {
  const handleDecrement = () => {
    if (disabled) return;
    const newVal = Math.max(0, (value || 0) - 1);
    onChange(newVal);
  };

  const handleIncrement = () => {
    if (disabled) return;
    const newVal = Math.min(20, (value || 0) + 1);
    onChange(newVal);
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    if (val === '') {
      onChange('');
      return;
    }
    const num = parseInt(val, 10);
    if (!isNaN(num) && num >= 0 && num <= 20) {
      onChange(num);
    }
  };

  return (
    <div className={`score-input-wrapper ${disabled ? 'score-input-disabled' : ''}`}>
      {label && <span className="score-input-label">{label}</span>}
      <div className="score-input-group">
        <button
          type="button"
          className="score-btn score-btn-minus"
          onClick={handleDecrement}
          disabled={disabled || (value || 0) <= 0}
          aria-label="Decrease score"
        >
          −
        </button>
        <input
          type="number"
          className="score-input"
          value={value === '' || value === undefined || value === null ? '' : value}
          onChange={handleInputChange}
          disabled={disabled}
          min="0"
          max="20"
          placeholder="–"
        />
        <button
          type="button"
          className="score-btn score-btn-plus"
          onClick={handleIncrement}
          disabled={disabled}
          aria-label="Increase score"
        >
          +
        </button>
      </div>
    </div>
  );
}
