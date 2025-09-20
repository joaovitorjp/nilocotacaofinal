import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface CellData {
  value: string;
  readOnly?: boolean;
}

interface SpreadsheetGridProps {
  data: CellData[][];
  headers?: string[];
  onCellChange?: (row: number, col: number, value: string) => void;
  className?: string;
}

const SpreadsheetGrid = ({ data, headers, onCellChange, className }: SpreadsheetGridProps) => {
  const [selectedCell, setSelectedCell] = useState<{row: number, col: number} | null>(null);
  const [editingCell, setEditingCell] = useState<{row: number, col: number} | null>(null);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const getColumnLabel = (index: number): string => {
    let result = '';
    while (index >= 0) {
      result = String.fromCharCode(65 + (index % 26)) + result;
      index = Math.floor(index / 26) - 1;
    }
    return result;
  };

  const handleCellClick = (row: number, col: number) => {
    if (data[row]?.[col]?.readOnly) return;
    
    setSelectedCell({ row, col });
    setEditingCell({ row, col });
    setEditValue(data[row]?.[col]?.value || '');
  };

  const handleCellKeyDown = (e: React.KeyboardEvent, row: number, col: number) => {
    if (e.key === 'Enter') {
      handleCellSubmit();
    } else if (e.key === 'Escape') {
      setEditingCell(null);
      setEditValue('');
    }
  };

  const handleCellSubmit = () => {
    if (editingCell && onCellChange) {
      onCellChange(editingCell.row, editingCell.col, editValue);
    }
    setEditingCell(null);
    setEditValue('');
  };

  useEffect(() => {
    if (editingCell && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingCell]);

  const maxCols = Math.max(...data.map(row => row.length), headers?.length || 3);
  const displayRows = data.length > 0 ? data : [];

  return (
    <div className={cn("flex flex-col h-full bg-background", className)}>
      {/* Fixed Header */}
      <div className="flex-shrink-0 border-b border-grid-border bg-grid-header">
        <div className="flex">
          <div className="w-12 h-10 flex items-center justify-center border-r border-grid-border text-grid-header-text text-xs font-medium">
            #
          </div>
          {headers ? headers.map((header, i) => (
            <div
              key={i}
              className="min-w-[150px] flex-1 h-10 flex items-center px-3 border-r border-grid-border text-grid-header-text text-xs font-medium"
            >
              {header}
            </div>
          )) : Array.from({ length: maxCols }, (_, i) => (
            <div
              key={i}
              className="min-w-[150px] flex-1 h-10 flex items-center px-3 border-r border-grid-border text-grid-header-text text-xs font-medium"
            >
              {getColumnLabel(i)}
            </div>
          ))}
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-auto">
        <div className="min-h-full">
          {displayRows.map((row, rowIndex) => (
            <div key={rowIndex} className="flex border-b border-grid-border hover:bg-accent/50">
              <div className="w-12 h-10 flex items-center justify-center border-r border-grid-border bg-grid-header text-grid-header-text text-xs font-medium">
                {rowIndex + 1}
              </div>
              {Array.from({ length: maxCols }, (_, colIndex) => {
                const cellData = row[colIndex];
                const isSelected = selectedCell?.row === rowIndex && selectedCell?.col === colIndex;
                const isEditing = editingCell?.row === rowIndex && editingCell?.col === colIndex;
                
                return (
                  <div
                    key={colIndex}
                    className={cn(
                      "min-w-[150px] flex-1 h-10 border-r border-grid-border px-2 cursor-cell flex items-center relative",
                      isSelected ? "bg-grid-cell-selected" : "bg-grid-cell hover:bg-grid-cell-hover",
                      cellData?.readOnly && "bg-muted cursor-not-allowed"
                    )}
                    onClick={() => handleCellClick(rowIndex, colIndex)}
                  >
                    {isEditing ? (
                      <input
                        ref={inputRef}
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={handleCellSubmit}
                        onKeyDown={(e) => handleCellKeyDown(e, rowIndex, colIndex)}
                        className="w-full h-full bg-transparent border-0 outline-none text-xs"
                      />
                    ) : (
                      <div className="text-xs truncate w-full">
                        {cellData?.value || ''}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SpreadsheetGrid;