import React, { useState, useEffect } from 'react';

export function ImeInput({ value, onChange, className, placeholder, type = 'text', onKeyDown }: {
  value: string;
  onChange: (val: string) => void;
  className?: string;
  placeholder?: string;
  type?: string;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}) {
  const [composing, setComposing] = useState(false);
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    if (!composing) {
      setLocalValue(value);
    }
  }, [value, composing]);

  return (
    <input
      type={type}
      className={className}
      placeholder={placeholder}
      value={localValue}
      onCompositionStart={() => setComposing(true)}
      onCompositionEnd={(e) => {
        setComposing(false);
        const v = (e.target as HTMLInputElement).value;
        setLocalValue(v);
        onChange(v);
      }}
      onChange={(e) => {
        const v = e.target.value;
        setLocalValue(v);
        if (!composing) onChange(v);
      }}
      onKeyDown={onKeyDown}
    />
  );
}

export function ImeTextarea({ value, onChange, className, placeholder, rows }: {
  value: string;
  onChange: (val: string) => void;
  className?: string;
  placeholder?: string;
  rows?: number;
}) {
  const [composing, setComposing] = useState(false);
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    if (!composing) {
      setLocalValue(value);
    }
  }, [value, composing]);

  return (
    <textarea
      className={className}
      placeholder={placeholder}
      rows={rows}
      value={localValue}
      onCompositionStart={() => setComposing(true)}
      onCompositionEnd={(e) => {
        setComposing(false);
        const v = (e.target as HTMLTextAreaElement).value;
        setLocalValue(v);
        onChange(v);
      }}
      onChange={(e) => {
        const v = e.target.value;
        setLocalValue(v);
        if (!composing) onChange(v);
      }}
    />
  );
}
