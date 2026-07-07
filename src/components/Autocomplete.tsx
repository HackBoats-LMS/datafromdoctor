"use client";

import React, { useState, useEffect, useRef, KeyboardEvent } from "react";

interface AutocompleteProps {
  field: "symptom" | "healthIssues" | "tablet";
  label?: string;
  value: string | string[];
  onChange: (val: any) => void;
  isMulti?: boolean;
  required?: boolean;
  placeholder?: string;
  noMargin?: boolean;
}

export default function Autocomplete({
  field,
  label = "",
  value,
  onChange,
  isMulti = false,
  required = false,
  placeholder = "",
  noMargin = false,
}: AutocompleteProps) {
  const [inputValue, setInputValue] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [loading, setLoading] = useState(false);
  
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Sync single select value from props
  useEffect(() => {
    if (!isMulti && typeof value === "string") {
      setInputValue(value);
    }
  }, [value, isMulti]);

  // Click outside listener to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchSuggestions = async (query: string) => {
    if (!query.trim()) {
      setSuggestions([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/suggest?field=${field}&query=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        setSuggestions(data.suggestions || []);
      }
    } catch (err) {
      console.error("Autocomplete fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);
    setIsOpen(true);
    setActiveIndex(-1);

    if (!isMulti) {
      onChange(val);
    }

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      fetchSuggestions(val);
    }, 100);
  };

  const selectSuggestion = (suggestion: string) => {
    if (isMulti) {
      const currentValues = Array.isArray(value) ? value : [];
      if (!currentValues.includes(suggestion)) {
        onChange([...currentValues, suggestion]);
      }
      setInputValue("");
    } else {
      setInputValue(suggestion);
      onChange(suggestion);
    }
    setSuggestions([]);
    setIsOpen(false);
    setActiveIndex(-1);
  };

  const addCustomValue = () => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;

    if (isMulti) {
      const currentValues = Array.isArray(value) ? value : [];
      if (!currentValues.includes(trimmed)) {
        onChange([...currentValues, trimmed]);
      }
      setInputValue("");
    } else {
      onChange(trimmed);
    }
    setSuggestions([]);
    setIsOpen(false);
    setActiveIndex(-1);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (suggestions.length > 0) {
        setIsOpen(true);
        setActiveIndex((prev) => (prev + 1) % suggestions.length);
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (suggestions.length > 0) {
        setIsOpen(true);
        setActiveIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
      }
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (isOpen && activeIndex >= 0 && activeIndex < suggestions.length) {
        selectSuggestion(suggestions[activeIndex]);
      } else if (inputValue.trim()) {
        addCustomValue();
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  const removePill = (indexToRemove: number) => {
    const currentValues = Array.isArray(value) ? value : [];
    const updated = currentValues.filter((_, idx) => idx !== indexToRemove);
    onChange(updated);
  };

  return (
    <div className={noMargin ? "" : "form-group"} style={noMargin ? { position: "relative" } : undefined} ref={wrapperRef}>
      {label && label.trim() !== "" && (
        <label className="form-label">
          {label}
          {required && <span className="required">*</span>}
        </label>
      )}
      
      <div className="autocomplete-wrapper">
        <input
          type="text"
          className="form-control"
          placeholder={placeholder}
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            setIsOpen(true);
            if (inputValue) fetchSuggestions(inputValue);
          }}
        />

        {isOpen && (suggestions.length > 0 || loading) && (
          <div className="autocomplete-dropdown">
            {loading && <div className="autocomplete-no-results">Searching...</div>}
            {!loading &&
              suggestions.map((suggestion, idx) => (
                <div
                  key={suggestion}
                  className={`autocomplete-item ${idx === activeIndex ? "active" : ""}`}
                  onClick={() => selectSuggestion(suggestion)}
                >
                  {suggestion}
                </div>
              ))}
          </div>
        )}
      </div>

      {isMulti && Array.isArray(value) && value.length > 0 && (
        <div className="pill-container">
          {value.map((item, idx) => (
            <span key={`${item}-${idx}`} className="pill">
              {item}
              <button
                type="button"
                className="pill-remove"
                onClick={() => removePill(idx)}
                aria-label={`Remove ${item}`}
              >
                ✕
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
