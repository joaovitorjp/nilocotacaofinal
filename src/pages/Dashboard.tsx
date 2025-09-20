import React, { useState, useRef } from 'react';
import Toolbar from '@/components/Toolbar';
import SpreadsheetGrid from '@/components/SpreadsheetGrid';
import FloatingButton from '@/components/FloatingButton';
import LoadListDialog from '@/components/dialogs/LoadListDialog';
import GenerateLinkDialog from '@/components/dialogs/GenerateLinkDialog';
import { useQuotation } from '@/hooks/useQuotation';
import { Lista, Product, CellData } from '@/types/quotation';
import { toast } from 'sonner';

const Dashboard = () => {
  const {
    currentList,
    loading,
    importFromExcel,
    loadList,
    generateQuotationLink,
    endQuotation,
    setCurrentList
  } = useQuotation();

  const [loadListOpen, setLoadListOpen] = useState(false);
  const [generateLinkOpen, setGenerateLinkOpen] = useState(false);
  const [finishedQuotesOpen, setFinishedQuotesOpen] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImportList = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        importFromExcel(file);
      } else {
        toast.error('Por favor, selecione um arquivo Excel (.xlsx ou .xls)');
      }
    }
  };

  const handleLoadList = () => {
    setLoadListOpen(true);
  };

  const handleSelectList = (list: Lista) => {
    setCurrentList(list);
  };

  const handleGenerateLink = () => {
    setGenerateLinkOpen(true);
  };

  const handleFinishedQuotes = () => {
    setFinishedQuotesOpen(true);
  };

  const handleLogout = () => {
    // For now, just reload the page
    window.location.reload();
  };

  const handleEndQuotation = () => {
    if (window.confirm('Tem certeza que deseja finalizar esta cotação? Ela não poderá mais ser editada.')) {
      endQuotation();
    }
  };

  const generateGridData = (): CellData[][] => {
    if (!currentList || !Array.isArray(currentList.produtos)) {
      return [];
    }

    // Get all companies that have responded
    const companies = Object.keys(currentList.respostas || {});
    
    return currentList.produtos.map((produto: Product) => {
      const row: CellData[] = [
        { value: produto.codigo_interno, readOnly: true },
        { value: produto.descricao, readOnly: true },
        { value: produto.codigo_barras, readOnly: true },
      ];

      // Add price columns for each company
      companies.forEach(company => {
        const companyResponses = currentList.respostas[company] || {};
        const price = companyResponses[produto.codigo_interno] || '';
        row.push({ 
          value: price, 
          readOnly: currentList.status === 'finalizada' 
        });
      });

      return row;
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls"
        onChange={handleFileChange}
        className="hidden"
      />

      <Toolbar
        onImportList={handleImportList}
        onLoadList={handleLoadList}
        onGenerateLink={handleGenerateLink}
        onFinishedQuotes={handleFinishedQuotes}
        onLogout={handleLogout}
        canGenerateLink={!!currentList && currentList.status === 'aberta'}
      />

      <div className="p-6">
        {currentList ? (
          <>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">{currentList.nome_lista}</h2>
                <p className="text-sm text-muted-foreground">
                  {Array.isArray(currentList.produtos) ? currentList.produtos.length : 0} produtos
                  {currentList.respostas && Object.keys(currentList.respostas).length > 0 && (
                    <span> • {Object.keys(currentList.respostas).length} empresas responderam</span>
                  )}
                </p>
              </div>
              <div className="text-sm">
                Status: <span className={`font-medium ${currentList.status === 'finalizada' ? 'text-destructive' : 'text-primary'}`}>
                  {currentList.status === 'finalizada' ? 'Finalizada' : 'Aberta'}
                </span>
              </div>
            </div>

            <div className="mb-2">
              <div className="grid gap-2 text-xs font-medium text-grid-header-text bg-grid-header border border-grid-border p-2" 
                   style={{ gridTemplateColumns: `repeat(${3 + (currentList.respostas ? Object.keys(currentList.respostas).length : 0)}, minmax(120px, 1fr))` }}>
                <div>Código Interno</div>
                <div>Descrição</div>
                <div>Código de Barras</div>
                {currentList.respostas && Object.keys(currentList.respostas).map(company => (
                  <div key={company}>Preço - {company}</div>
                ))}
              </div>
            </div>

            <SpreadsheetGrid
              data={generateGridData()}
              className="border rounded-lg"
            />
          </>
        ) : (
          <div className="text-center py-12">
            <div className="text-lg font-medium mb-2">Bem-vindo ao Sistema de Cotação</div>
            <p className="text-muted-foreground mb-6">
              Importe uma lista de produtos em Excel ou carregue uma lista existente para começar.
            </p>
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">
                Formato do arquivo Excel:
              </div>
              <div className="text-xs text-muted-foreground max-w-md mx-auto">
                <div className="grid grid-cols-3 gap-2 bg-muted p-2 rounded">
                  <div className="font-medium">Coluna A</div>
                  <div className="font-medium">Coluna B</div>
                  <div className="font-medium">Coluna C</div>
                  <div>Código Interno</div>
                  <div>Descrição</div>
                  <div>Código de Barras</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <FloatingButton
        onEndQuotation={handleEndQuotation}
        show={!!currentList && currentList.status === 'aberta'}
      />

      <LoadListDialog
        open={loadListOpen}
        onOpenChange={setLoadListOpen}
        onSelectList={handleSelectList}
      />

      <LoadListDialog
        open={finishedQuotesOpen}
        onOpenChange={setFinishedQuotesOpen}
        onSelectList={handleSelectList}
        showFinalized={true}
      />

      <GenerateLinkDialog
        open={generateLinkOpen}
        onOpenChange={setGenerateLinkOpen}
        onGenerateLink={generateQuotationLink}
      />
    </div>
  );
};

export default Dashboard;