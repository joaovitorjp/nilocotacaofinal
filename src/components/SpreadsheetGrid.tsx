import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface CellData {
  value: string;
  readOnly?: boolean;
}

interface SpreadsheetGridProps {
  data: CellData[][];
  onCellChange?: (row: number, col: number, value: string) => void;
  className?: string;
}

const SpreadsheetGrid = ({ data, onCellChange, className }: SpreadsheetGridProps) => {
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

  const maxCols = Math.max(...data.map(row => row.length), 16);
  const maxRows = Math.max(data.length, 20);

  return (
    <div className={cn("border border-grid-border bg-grid-cell overflow-auto", className)}>
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="w-12 h-8 bg-grid-header border-r border-b border-grid-border text-grid-header-text text-xs font-medium"></th>
            {Array.from({ length: maxCols }, (_, i) => (
              <th
                key={i}
                className="min-w-[100px] h-8 bg-grid-header border-r border-b border-grid-border text-grid-header-text text-xs font-medium px-2"
              >
                {getColumnLabel(i)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: maxRows }, (_, rowIndex) => (
            <tr key={rowIndex}>
              <td className="w-12 h-8 bg-grid-header border-r border-b border-grid-border text-grid-header-text text-xs font-medium text-center">
                {rowIndex + 1}
              </td>
              {Array.from({ length: maxCols }, (_, colIndex) => {
                const cellData = data[rowIndex]?.[colIndex];
                const isSelected = selectedCell?.row === rowIndex && selectedCell?.col === colIndex;
                const isEditing = editingCell?.row === rowIndex && editingCell?.col === colIndex;
                
                return (
                  <td
                    key={colIndex}
                    className={cn(
                      "min-w-[100px] h-8 border-r border-b border-grid-border px-1 cursor-cell relative",
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
                        className="w-full h-full bg-transparent border-0 outline-none text-xs px-1"
                      />
                    ) : (
                      <div className="text-xs px-1 truncate">
                        {cellData?.value || ''}
                      </div>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default SpreadsheetGrid;