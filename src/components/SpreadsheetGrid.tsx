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
    <div className={cn("flex flex-col h-full bg-white border border-border", className)}>
      {/* Fixed Header */}
      <div className="flex-shrink-0 bg-slate-50 border-b-2 border-slate-300 sticky top-0 z-10">
        <div className="flex">
          <div className="w-12 h-8 flex items-center justify-center border-r border-slate-300 text-slate-600 text-xs font-semibold bg-slate-100">
            
          </div>
          {headers ? headers.map((header, i) => (
            <div
              key={i}
              className="min-w-[140px] h-8 flex items-center px-2 border-r border-slate-300 text-slate-700 text-xs font-semibold bg-slate-50 truncate"
              title={header}
            >
              {header}
            </div>
          )) : Array.from({ length: maxCols }, (_, i) => (
            <div
              key={i}
              className="min-w-[140px] h-8 flex items-center justify-center border-r border-slate-300 text-slate-700 text-xs font-semibold bg-slate-50"
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
            <div key={rowIndex} className="flex border-b border-slate-200 hover:bg-blue-50/50">
              <div className="w-12 h-7 flex items-center justify-center border-r border-slate-300 bg-slate-50 text-slate-600 text-xs font-medium">
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
                      "min-w-[140px] h-7 border-r border-slate-200 px-1 cursor-cell flex items-center relative bg-white",
                      isSelected && "ring-2 ring-blue-500 ring-inset bg-blue-50",
                      !isSelected && "hover:bg-slate-50",
                      cellData?.readOnly && "bg-slate-100 cursor-not-allowed"
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
                        className="w-full h-full bg-white border-0 outline-none text-xs px-1 ring-2 ring-blue-500"
                      />
                    ) : (
                      <div className="text-xs truncate w-full px-1">
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