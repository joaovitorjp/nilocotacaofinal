import React, { useState, useRef, useEffect, useMemo } from 'react';
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
  const [columnSizes, setColumnSizes] = useState<number[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const getColumnLabel = (index: number): string => {
    let result = '';
    while (index >= 0) {
      result = String.fromCharCode(65 + (index % 26)) + result;
      index = Math.floor(index / 26) - 1;
    }
    return result;
  };

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
      const nextCol = col + 1;
      const nextRow = nextCol >= (headers?.length || dataWithLowestPrices[0]?.length || 0) ? row + 1 : row;
      const finalCol = nextCol >= (headers?.length || dataWithLowestPrices[0]?.length || 0) ? 0 : nextCol;
      
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

  const maxCols = Math.max(...dataWithLowestPrices.map(row => row.length), headers?.length || 3);
  const displayRows = dataWithLowestPrices.length > 0 ? dataWithLowestPrices : [];

  // Initialize column sizes if not set
  useEffect(() => {
    if (columnSizes.length === 0) {
      const initialSizes = Array(maxCols + 1).fill(100 / (maxCols + 1)); // +1 for row numbers
      setColumnSizes(initialSizes);
    }
  }, [maxCols, columnSizes.length]);

  return (
    <div className={cn("flex flex-col h-full bg-grid-cell border border-grid-border", className)}>
      {/* Fixed Header */}
      <div className="flex-shrink-0 bg-grid-header border-b-2 border-grid-border sticky top-0 z-10 shadow-sm">
        <ResizablePanelGroup direction="horizontal" className="h-9">
          {/* Row numbers column */}
          <ResizablePanel defaultSize={8} minSize={5} maxSize={15}>
            <div className="h-full flex items-center justify-center bg-grid-header text-grid-headerText text-xs font-semibold border-r border-grid-border">
              #
            </div>
          </ResizablePanel>
          <ResizableHandle />

          {/* Header columns */}
          {(headers || Array.from({ length: maxCols }, (_, i) => getColumnLabel(i))).map((header, i) => (
            <React.Fragment key={i}>
              <ResizablePanel defaultSize={92 / maxCols} minSize={10}>
                <div className="h-full flex items-center px-3 bg-grid-header text-grid-headerText text-xs font-semibold border-r border-grid-border truncate">
                  {typeof header === 'string' ? header : getColumnLabel(i)}
                </div>
              </ResizablePanel>
              {i < maxCols - 1 && <ResizableHandle />}
            </React.Fragment>
          ))}
        </ResizablePanelGroup>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-auto">
        <div className="min-h-full">
          {displayRows.map((row, rowIndex) => (
            <div key={rowIndex} className="border-b border-grid-border hover:bg-grid-cellHover">
              <ResizablePanelGroup direction="horizontal" className="h-8">
                {/* Row number */}
                <ResizablePanel defaultSize={8} minSize={5} maxSize={15}>
                  <div className="h-full flex items-center justify-center bg-grid-header text-grid-headerText text-xs font-medium border-r border-grid-border">
                    {rowIndex + 1}
                  </div>
                </ResizablePanel>
                <ResizableHandle />

                {/* Data columns */}
                {Array.from({ length: maxCols }, (_, colIndex) => {
                  const cellData = row[colIndex];
                  const isSelected = selectedCell?.row === rowIndex && selectedCell?.col === colIndex;
                  const isEditing = editingCell?.row === rowIndex && editingCell?.col === colIndex;
                  
                  return (
                    <React.Fragment key={colIndex}>
                      <ResizablePanel defaultSize={92 / maxCols} minSize={10}>
                        <div
                          className={cn(
                            "h-full border-r border-grid-border px-2 cursor-cell flex items-center relative",
                            "bg-grid-cell text-foreground text-xs",
                            isSelected && "ring-2 ring-primary ring-inset bg-grid-cellSelected",
                            !isSelected && "hover:bg-grid-cellHover",
                            cellData?.readOnly && "bg-grid-cellReadonly cursor-not-allowed",
                            cellData?.isLowestPrice && !isEditing && "bg-grid-lowestPrice border-l-2 border-l-grid-lowestPriceBorder"
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
                              className="w-full h-full bg-grid-cell border-0 outline-none text-xs px-0 ring-2 ring-primary"
                            />
                          ) : (
                            <div className="text-xs truncate w-full">
                              {cellData?.value || ''}
                            </div>
                          )}
                        </div>
                      </ResizablePanel>
                      {colIndex < maxCols - 1 && <ResizableHandle />}
                    </React.Fragment>
                  );
                })}
              </ResizablePanelGroup>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SpreadsheetGrid;