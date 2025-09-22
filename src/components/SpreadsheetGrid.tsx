import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface CellData {
  value: string;
  readOnly?: boolean;
  isLowestPrice?: boolean;
}

interface SpreadsheetGridProps {
  data: CellData[][];
  headers?: string[];
  onCellChange?: (row: number, col: number, value: string) => void;
  className?: string;
  highlightLowestPrices?: boolean;
}

const SpreadsheetGrid = ({ 
  data, 
  headers, 
  onCellChange, 
  className, 
  highlightLowestPrices = false 
}: SpreadsheetGridProps) => {
  const [selectedCell, setSelectedCell] = useState<{row: number, col: number} | null>(null);
  const [editingCell, setEditingCell] = useState<{row: number, col: number} | null>(null);
  const [editValue, setEditValue] = useState('');
  const [columnWidths, setColumnWidths] = useState<number[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const getColumnLabel = (index: number): string => {
    let result = '';
    while (index >= 0) {
      result = String.fromCharCode(65 + (index % 26)) + result;
      index = Math.floor(index / 26) - 1;
    }
    return result;
  };

  // Calculate optimal column widths based on content
  const calculateColumnWidths = useCallback(() => {
    if (!data.length && !headers?.length) return [];

    const maxCols = Math.max(
      ...data.map(row => row.length),
      headers?.length || 0
    );

    const widths = Array(maxCols + 1).fill(0); // +1 for row numbers column

    // Set minimum width for row numbers column
    widths[0] = 60;

    // Calculate width for each data column
    for (let colIndex = 0; colIndex < maxCols; colIndex++) {
      let maxWidth = 100; // Minimum width

      // Check header width
      if (headers?.[colIndex]) {
        const headerText = typeof headers[colIndex] === 'string' ? headers[colIndex] : getColumnLabel(colIndex);
        maxWidth = Math.max(maxWidth, headerText.length * 8 + 24);
      }

      // Check data width
      for (let rowIndex = 0; rowIndex < data.length; rowIndex++) {
        const cellValue = data[rowIndex]?.[colIndex]?.value || '';
        maxWidth = Math.max(maxWidth, cellValue.length * 8 + 24);
      }

      // Cap maximum width at 300px
      widths[colIndex + 1] = Math.min(maxWidth, 300);
    }

    return widths;
  }, [data, headers]);

  useEffect(() => {
    const newWidths = calculateColumnWidths();
    setColumnWidths(newWidths);
  }, [calculateColumnWidths]);

  // Calculate which cells have the lowest prices for highlighting
  const dataWithLowestPrices = useMemo(() => {
    if (!highlightLowestPrices || data.length === 0) return data;

    const enhancedData = data.map(row => [...row]);
    const numCols = Math.max(...data.map(row => row.length));
    
    // Find price columns (assuming they start from column 3 onwards)
    const priceStartCol = 3;
    
    for (let rowIndex = 0; rowIndex < data.length; rowIndex++) {
      const priceValues: { col: number; value: number }[] = [];
      
      // Collect all price values for this row
      for (let colIndex = priceStartCol; colIndex < numCols; colIndex++) {
        const cellValue = data[rowIndex]?.[colIndex]?.value;
        if (cellValue && cellValue.trim() !== '') {
          const numericValue = parseFloat(cellValue.replace(',', '.'));
          if (!isNaN(numericValue) && numericValue > 0) {
            priceValues.push({ col: colIndex, value: numericValue });
          }
        }
      }
      
      // Find the minimum price
      if (priceValues.length > 1) {
        const minPrice = Math.min(...priceValues.map(p => p.value));
        const lowestPriceCols = priceValues.filter(p => p.value === minPrice).map(p => p.col);
        
        // Mark cells with lowest price
        lowestPriceCols.forEach(col => {
          if (enhancedData[rowIndex]?.[col]) {
            enhancedData[rowIndex][col] = {
              ...enhancedData[rowIndex][col],
              isLowestPrice: true
            };
          }
        });
      }
    }
    
    return enhancedData;
  }, [data, highlightLowestPrices]);

  const handleCellClick = (row: number, col: number) => {
    const cellData = dataWithLowestPrices[row]?.[col];
    if (cellData?.readOnly) return;
    
    setSelectedCell({ row, col });
    setEditingCell({ row, col });
    setEditValue(cellData?.value || '');
  };

  const handleCellKeyDown = (e: React.KeyboardEvent, row: number, col: number) => {
    if (e.key === 'Enter') {
      handleCellSubmit();
    } else if (e.key === 'Escape') {
      setEditingCell(null);
      setEditValue('');
    } else if (e.key === 'Tab') {
      e.preventDefault();
      handleCellSubmit();
      // Move to next cell
      const maxCols = Math.max(...dataWithLowestPrices.map(r => r.length), headers?.length || 0);
      const nextCol = col + 1;
      const nextRow = nextCol >= maxCols ? row + 1 : row;
      const finalCol = nextCol >= maxCols ? 0 : nextCol;
      
      if (nextRow < dataWithLowestPrices.length) {
        setTimeout(() => handleCellClick(nextRow, finalCol), 10);
      }
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

  const maxCols = Math.max(...dataWithLowestPrices.map(row => row.length), headers?.length || 0);
  const displayRows = dataWithLowestPrices.length > 0 ? dataWithLowestPrices : [];

  const handleColumnResize = (colIndex: number, newWidth: number) => {
    const newWidths = [...columnWidths];
    newWidths[colIndex] = Math.max(newWidth, 60);
    setColumnWidths(newWidths);
  };

  return (
    <div className={cn("flex flex-col h-full bg-grid-cell overflow-hidden", className)} ref={gridRef}>
      {/* Fixed Header */}
      <div className="flex-shrink-0 bg-grid-header border-b border-grid-border sticky top-0 z-10">
        <div className="flex">
          {/* Row numbers column */}
          <div 
            className="flex-shrink-0 bg-grid-header border-r border-grid-border relative"
            style={{ width: columnWidths[0] || 60 }}
          >
            <div className="h-9 flex items-center justify-center text-grid-headerText text-xs font-semibold">
              #
            </div>
            <div 
              className="absolute right-0 top-0 w-1 h-full cursor-col-resize hover:bg-primary/30"
              onMouseDown={(e) => {
                const startX = e.clientX;
                const startWidth = columnWidths[0] || 60;
                
                const handleMouseMove = (e: MouseEvent) => {
                  const newWidth = startWidth + (e.clientX - startX);
                  handleColumnResize(0, newWidth);
                };
                
                const handleMouseUp = () => {
                  document.removeEventListener('mousemove', handleMouseMove);
                  document.removeEventListener('mouseup', handleMouseUp);
                };
                
                document.addEventListener('mousemove', handleMouseMove);
                document.addEventListener('mouseup', handleMouseUp);
              }}
            />
          </div>

          {/* Header columns */}
          {Array.from({ length: maxCols }, (_, i) => {
            const headerText = headers?.[i] || getColumnLabel(i);
            return (
              <div 
                key={i}
                className="flex-shrink-0 bg-grid-header border-r border-grid-border relative"
                style={{ width: columnWidths[i + 1] || 120 }}
              >
                <div className="h-9 flex items-center justify-center px-2 text-grid-headerText text-xs font-semibold">
                  <div className="truncate text-center w-full">
                    {typeof headerText === 'string' ? headerText : getColumnLabel(i)}
                  </div>
                </div>
                <div 
                  className="absolute right-0 top-0 w-1 h-full cursor-col-resize hover:bg-primary/30"
                  onMouseDown={(e) => {
                    const startX = e.clientX;
                    const startWidth = columnWidths[i + 1] || 120;
                    
                    const handleMouseMove = (e: MouseEvent) => {
                      const newWidth = startWidth + (e.clientX - startX);
                      handleColumnResize(i + 1, newWidth);
                    };
                    
                    const handleMouseUp = () => {
                      document.removeEventListener('mousemove', handleMouseMove);
                      document.removeEventListener('mouseup', handleMouseUp);
                    };
                    
                    document.addEventListener('mousemove', handleMouseMove);
                    document.addEventListener('mouseup', handleMouseUp);
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-auto">
        {displayRows.map((row, rowIndex) => (
          <div key={rowIndex} className="flex border-b border-grid-border hover:bg-grid-cellHover">
            {/* Row number */}
            <div 
              className="flex-shrink-0 bg-grid-header border-r border-grid-border"
              style={{ width: columnWidths[0] || 60 }}
            >
              <div className="h-8 flex items-center justify-center text-grid-headerText text-xs font-medium">
                {rowIndex + 1}
              </div>
            </div>

            {/* Data columns */}
            {Array.from({ length: maxCols }, (_, colIndex) => {
              const cellData = row[colIndex];
              const isSelected = selectedCell?.row === rowIndex && selectedCell?.col === colIndex;
              const isEditing = editingCell?.row === rowIndex && editingCell?.col === colIndex;
              
              return (
                <div
                  key={colIndex}
                  className={cn(
                    "flex-shrink-0 border-r border-grid-border cursor-cell relative",
                    "bg-grid-cell text-foreground",
                    isSelected && "ring-2 ring-primary ring-inset bg-grid-cellSelected",
                    !isSelected && "hover:bg-grid-cellHover",
                    cellData?.readOnly && "bg-grid-cellReadonly cursor-not-allowed",
                    cellData?.isLowestPrice && !isEditing && "bg-grid-lowestPrice"
                  )}
                  style={{ width: columnWidths[colIndex + 1] || 120 }}
                  onClick={() => handleCellClick(rowIndex, colIndex)}
                >
                  <div className="h-8 flex items-center justify-center px-2 w-full">
                    {isEditing ? (
                      <input
                        ref={inputRef}
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={handleCellSubmit}
                        onKeyDown={(e) => handleCellKeyDown(e, rowIndex, colIndex)}
                        className="w-full h-full bg-transparent border-0 outline-none text-xs text-center ring-2 ring-primary"
                      />
                    ) : (
                      <div className="text-xs text-center w-full truncate">
                        {cellData?.value || ''}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SpreadsheetGrid;