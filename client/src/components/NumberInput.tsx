import React, { useState, useEffect } from 'react';
import { Input } from './styled';

interface NumberInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  onValueChange: (value: number) => void;
  value: number;
}

export const NumberInput = ({ onValueChange, value, onFocus, onBlur, ...props }: NumberInputProps) => {
  const [displayValue, setDisplayValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    // Update display value from props only when not focused
    // This prevents cursor jumping and input glitches (like disappearing decimal point)
    if (!isFocused) {
      setDisplayValue(value === 0 ? '' : value.toString());
    }
  }, [value, isFocused]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/,/g, '.');

    // Allow digits, one dot, and one minus at the start
    if (!/^-?\d*\.?\d*$/.test(val)) {
      return;
    }

    setDisplayValue(val);

    const num = parseFloat(val);
    if (!isNaN(num)) {
      onValueChange(num);
    } else {
      onValueChange(0);
    }
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    if (onFocus) onFocus(e);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(false);
    // On blur, re-sync with the actual numeric value to clean up (e.g. "1." becomes "1")
    setDisplayValue(value === 0 ? '' : value.toString());
    if (onBlur) onBlur(e);
  };

  return (
    <Input
      {...props}
      type="text"
      inputMode="decimal"
      value={displayValue}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
    />
  );
};
