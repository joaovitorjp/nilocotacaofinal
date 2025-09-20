import React, { useState, useRef } from 'react';
import Toolbar from '@/components/Toolbar';
import SpreadsheetGrid from '@/components/SpreadsheetGrid';
import FloatingButton from '@/components/FloatingButton';
import LoadListDialog from '@/components/dialogs/LoadListDialog';
import GenerateLinkDialog from '@/components/dialogs/GenerateLinkDialog';
import ImportListDialog from '@/components/dialogs/ImportListDialog';
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
  const [importDialogOpen, setImportDialogOpen] = useState(false);

  const handleImportList = () => {
    setImportDialogOpen(true);
  };

  const handleImportWithName = (file: File, listName: string) => {
    if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      importFromExcel(file, listName);
    } else {
      toast.error('Por favor, selecione um arquivo Excel (.xlsx ou .xls)');
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
    <div className="flex flex-col h-screen bg-background">

      <Toolbar
        onImportList={handleImportList}
        onLoadList={handleLoadList}
        onGenerateLink={handleGenerateLink}
        onFinishedQuotes={handleFinishedQuotes}
        canGenerateLink={!!currentList && currentList.status === 'aberta'}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        {currentList ? (
          <>
            <div className="px-6 py-3 border-b border-grid-border bg-background">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <h2 className="text-lg font-medium">{currentList.nome_lista}</h2>
                  <span className="text-sm text-muted-foreground">
                    {Array.isArray(currentList.produtos) ? currentList.produtos.length : 0} produtos
                  </span>
                  {currentList.respostas && Object.keys(currentList.respostas).length > 0 && (
                    <span className="text-sm text-muted-foreground">
                      {Object.keys(currentList.respostas).length} empresas
                    </span>
                  )}
                </div>
                <span className={`text-sm font-medium px-2 py-1 rounded ${currentList.status === 'finalizada' ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'}`}>
                  {currentList.status === 'finalizada' ? 'Finalizada' : 'Aberta'}
                </span>
              </div>
            </div>

            <div className="flex-1 overflow-hidden">
              <SpreadsheetGrid
                data={generateGridData()}
                headers={[
                  'Código Interno',
                  'Descrição', 
                  'Código de Barras',
                  ...(currentList.respostas ? Object.keys(currentList.respostas).map(company => `Preço - ${company}`) : [])
                ]}
                className="h-full"
              />
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-2xl font-semibold mb-4">Sistema de Cotação</h2>
              <p className="text-muted-foreground mb-8 max-w-md">
                Importe uma lista de produtos ou carregue uma lista existente para começar
              </p>
              <div className="bg-muted/50 p-4 rounded-lg max-w-sm mx-auto">
                <div className="text-sm font-medium mb-2">Formato Excel:</div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="bg-background p-2 rounded">Código Interno</div>
                  <div className="bg-background p-2 rounded">Descrição</div>
                  <div className="bg-background p-2 rounded">Código de Barras</div>
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

      <ImportListDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        onImport={handleImportWithName}
      />
    </div>
  );
};

export default Dashboard;