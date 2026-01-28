'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, X } from 'lucide-react';

interface SearchableSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: Array<{ id: string; nome: string }>;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export default function SearchableSelect({
  value,
  onChange,
  options,
  placeholder = '(não categorizado)',
  disabled = false,
  className = '',
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filtrar opções baseado na busca
  const filteredOptions = options.filter((option) =>
    option.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Encontrar o item selecionado
  const selectedOption = options.find((opt) => opt.nome === value);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focar input quando abrir
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Resetar índice destacado quando filtrar
  useEffect(() => {
    setHighlightedIndex(0);
  }, [searchTerm]);

  // Scroll automático para item destacado
  useEffect(() => {
    if (isOpen && dropdownRef.current) {
      const highlightedElement = dropdownRef.current.children[highlightedIndex] as HTMLElement;
      if (highlightedElement) {
        highlightedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [highlightedIndex, isOpen]);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setSearchTerm('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < filteredOptions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredOptions[highlightedIndex]) {
          handleSelect(filteredOptions[highlightedIndex].nome);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setSearchTerm('');
        break;
    }
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Campo de busca / Display */}
      <div
        className={`
          w-full px-2 py-1 bg-slate-800 border border-slate-600 rounded 
          text-white text-xs focus-within:border-blue-500
          flex items-center justify-between cursor-pointer
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <input
          ref={inputRef}
          type="text"
          value={isOpen ? searchTerm : selectedOption?.nome || ''}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className="flex-1 bg-transparent outline-none cursor-pointer"
          readOnly={!isOpen}
        />
        <div className="flex items-center gap-1">
          {value && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-0.5 hover:bg-slate-700 rounded"
            >
              <X className="w-3 h-3" />
            </button>
          )}
          <ChevronDown
            className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
        </div>
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-slate-800 border border-slate-600 rounded shadow-lg max-h-60 overflow-y-auto"
          style={{ top: '100%' }} // Garantir que apareça abaixo
        >
          {/* Opção vazia */}
          <div
            className={`
              px-2 py-1.5 text-xs cursor-pointer
              ${
                highlightedIndex === -1 && !value
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:bg-slate-700'
              }
            `}
            onClick={() => handleSelect('')}
            onMouseEnter={() => setHighlightedIndex(-1)}
          >
            {placeholder}
          </div>

          {/* Opções filtradas */}
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option, index) => (
              <div
                key={option.id}
                className={`
                  px-2 py-1.5 text-xs cursor-pointer
                  ${
                    index === highlightedIndex
                      ? 'bg-blue-600 text-white'
                      : option.nome === value
                      ? 'bg-slate-700 text-white'
                      : 'text-white hover:bg-slate-700'
                  }
                `}
                onClick={() => handleSelect(option.nome)}
                onMouseEnter={() => setHighlightedIndex(index)}
              >
                {option.nome}
              </div>
            ))
          ) : (
            <div className="px-2 py-1.5 text-xs text-slate-400 italic">
              Nenhum resultado encontrado
            </div>
          )}
        </div>
      )}
    </div>
  );
}
