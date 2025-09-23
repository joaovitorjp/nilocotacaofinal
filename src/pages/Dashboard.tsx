import React, { useState, useRef } from 'react';
import Toolbar from '@/components/Toolbar';
import SpreadsheetGrid from '@/components/SpreadsheetGrid';
import FloatingButton from '@/components/FloatingButton';
import LoadListDialog from '@/components/dialogs/LoadListDialog';
import GenerateLinkDialog from '@/components/dialogs/GenerateLinkDialog';
import ImportListDialog from '@/components/dialogs/ImportListDialog';
import OpenQuotesDialog from '@/components/dialogs/OpenQuotesDialog';
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
  const [openQuotesOpen, setOpenQuotesOpen] = useState(false);
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

  const handleOpenQuotes = () => {
    setOpenQuotesOpen(true);
  };

  const handleExportResults = () => {
    if (!currentList) return;

    try {
      // Analisa as respostas para encontrar os menores preços por produto
      const empresasVencedoras: { [empresa: string]: Array<{ codigoBarras: string; menorPreco: string }> } = {};
      
      // Para cada produto, encontra o menor preço
      currentList.produtos.forEach((produto: Product, produtoIndex: number) => {
        const precos: Array<{ empresa: string; preco: number; precoStr: string }> = [];
        
        // Coleta todos os preços para este produto
        Object.entries(currentList.respostas).forEach(([empresa, respostas]) => {
          const resposta = respostas[produto.codigo_interno];
          if (resposta && resposta.trim() !== '') {
            const precoNumerico = parseFloat(resposta.replace(',', '.'));
            if (!isNaN(precoNumerico) && precoNumerico > 0) {
              precos.push({ empresa, preco: precoNumerico, precoStr: resposta });
            }
          }
        });
        
        // Encontra o menor preço
        if (precos.length > 0) {
          const menorPreco = Math.min(...precos.map(p => p.preco));
          const empresasComMenorPreco = precos.filter(p => p.preco === menorPreco);
          
          // Adiciona às empresas vencedoras
          empresasComMenorPreco.forEach(({ empresa, precoStr }) => {
            if (!empresasVencedoras[empresa]) {
              empresasVencedoras[empresa] = [];
            }
            empresasVencedoras[empresa].push({
              codigoBarras: produto.codigo_barras,
              menorPreco: precoStr
            });
          });
        }
      });

      // Gera arquivos CSV para cada empresa vencedora
      Object.entries(empresasVencedoras).forEach(([empresa, produtos]) => {
        if (produtos.length > 0) {
          const csvContent = produtos.map(produto => 
            `${produto.codigoBarras};1;${produto.menorPreco}`
          ).join('\n');
          
          // Cria e faz download do arquivo
          const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
          const link = document.createElement('a');
          const url = URL.createObjectURL(blob);
          link.setAttribute('href', url);
          link.setAttribute('download', `${empresa.toLowerCase().replace(/\s+/g, '')}.csv`);
          link.style.visibility = 'hidden';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        }
      });

      const totalEmpresas = Object.keys(empresasVencedoras).length;
      if (totalEmpresas > 0) {
        toast.success(`Resultados exportados! ${totalEmpresas} arquivo(s) CSV gerado(s).`);
      } else {
        toast.error('Nenhum resultado para exportar. Certifique-se de que há respostas na cotação.');
      }
    } catch (error) {
      console.error('Erro ao exportar resultados:', error);
      toast.error('Erro ao exportar resultados');
    }
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
        onOpenQuotes={handleOpenQuotes}
        onExportResults={handleExportResults}
        canGenerateLink={!!currentList && currentList.status === 'aberta'}
        canExportResults={!!currentList && currentList.status === 'finalizada'}
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
                  ...(currentList.respostas ? Object.keys(currentList.respostas) : [])
                ]}
                onCellChange={(row, col, value) => {
                  // This could be used for live editing if needed in the future
                }}
                highlightLowestPrices={true}
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

      <OpenQuotesDialog
        open={openQuotesOpen}
        onOpenChange={setOpenQuotesOpen}
        onSelectList={handleSelectList}
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