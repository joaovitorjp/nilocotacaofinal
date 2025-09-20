import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Lista, LinkCotacao, Product, CellData } from '@/types/quotation';
import SpreadsheetGrid from '@/components/SpreadsheetGrid';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Send, AlertTriangle } from 'lucide-react';

const QuotationResponse = () => {
  const { linkId } = useParams<{ linkId: string }>();
  const [lista, setLista] = useState<Lista | null>(null);
  const [linkData, setLinkData] = useState<LinkCotacao | null>(null);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (linkId) {
      loadQuotationData();
    }
  }, [linkId]);

  const loadQuotationData = async () => {
    try {
      // First get the link data
      const { data: linkData, error: linkError } = await supabase
        .from('links_cotacao')
        .select('*')
        .eq('link', linkId)
        .single();

      if (linkError) {
        toast.error('Link de cotação não encontrado');
        return;
      }

      if (linkData.status === 'respondido') {
        toast.error('Esta cotação já foi respondida');
        return;
      }

      setLinkData(linkData as LinkCotacao);

      // Then get the list data
      const { data: listaData, error: listaError } = await supabase
        .from('listas')
        .select('*')
        .eq('id', linkData.lista_id)
        .single();

      if (listaError) {
        toast.error('Lista não encontrada');
        return;
      }

      if (listaData.status === 'finalizada') {
        toast.error('Esta cotação já foi finalizada');
        return;
      }

      setLista(listaData as unknown as Lista);

      // Initialize responses for all products
      const initialResponses: Record<string, string> = {};
      const produtos = listaData.produtos as unknown as Product[];
      if (Array.isArray(produtos)) {
        produtos.forEach((produto: Product) => {
          initialResponses[produto.codigo_interno] = '';
        });
      }
      setResponses(initialResponses);

    } catch (error) {
      console.error('Error loading quotation data:', error);
      toast.error('Erro ao carregar dados da cotação');
    } finally {
      setLoading(false);
    }
  };

  const handleCellChange = (row: number, col: number, value: string) => {
    const produtos = lista?.produtos as Product[];
    if (!lista || !Array.isArray(produtos)) return;
    
    // Column 3 is the price column (after codigo_interno, descricao, codigo_barras)
    if (col === 3) {
      const produto = produtos[row];
      if (produto) {
        setResponses(prev => ({
          ...prev,
          [produto.codigo_interno]: value
        }));
      }
    }
  };

  const handleSubmit = async () => {
    if (!lista || !linkData) return;

    // Validate that at least some prices were filled
    const filledResponses = Object.values(responses).filter(price => price.trim() !== '');
    if (filledResponses.length === 0) {
      toast.error('Preencha pelo menos um preço antes de enviar');
      return;
    }

    setSubmitting(true);
    try {
      // Update the list with the new responses
      const updatedRespostas = {
        ...(lista.respostas as Record<string, Record<string, string>>),
        [linkData.empresa]: responses
      };

      const { error: updateError } = await supabase
        .from('listas')
        .update({ respostas: updatedRespostas as any })
        .eq('id', lista.id);

      if (updateError) throw updateError;

      // Mark the link as responded
      const { error: linkError } = await supabase
        .from('links_cotacao')
        .update({ status: 'respondido' })
        .eq('id', linkData.id);

      if (linkError) throw linkError;

      toast.success('Cotação enviada com sucesso!');
      
      // Disable further editing
      setLinkData(prev => prev ? { ...prev, status: 'respondido' } : null);

    } catch (error) {
      console.error('Error submitting quotation:', error);
      toast.error('Erro ao enviar cotação');
    } finally {
      setSubmitting(false);
    }
  };

  const generateGridData = (): CellData[][] => {
    const produtos = lista?.produtos as Product[];
    if (!lista || !Array.isArray(produtos)) return [];

    return produtos.map((produto: Product) => [
      { value: produto.codigo_interno, readOnly: true },
      { value: produto.descricao, readOnly: true },
      { value: produto.codigo_barras, readOnly: true },
      { 
        value: responses[produto.codigo_interno] || '', 
        readOnly: linkData?.status === 'respondido' 
      }
    ]);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg font-medium">Carregando cotação...</div>
        </div>
      </div>
    );
  }

  if (!lista || !linkData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <AlertTriangle className="w-12 h-12 mx-auto text-destructive" />
          <div className="text-lg font-medium">Cotação não encontrada</div>
          <p className="text-muted-foreground">O link pode estar inválido ou expirado</p>
        </div>
      </div>
    );
  }

  const isCompleted = linkData.status === 'respondido';

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-grid-border bg-background px-6 py-4 shadow-toolbar">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-foreground">Cotação - {linkData.empresa}</h1>
            <p className="text-sm text-muted-foreground mt-1">{lista.nome_lista}</p>
          </div>
          {isCompleted && (
            <div className="text-sm text-green-600 font-medium">
              ✓ Cotação enviada com sucesso
            </div>
          )}
        </div>
      </div>

      <div className="p-6">
        <div className="mb-4">
          <div className="grid grid-cols-4 gap-2 text-xs font-medium text-grid-header-text bg-grid-header border border-grid-border">
            <div className="p-2 border-r border-grid-border">Código Interno</div>
            <div className="p-2 border-r border-grid-border">Descrição</div>
            <div className="p-2 border-r border-grid-border">Código de Barras</div>
            <div className="p-2">Preço - {linkData.empresa}</div>
          </div>
        </div>

        <SpreadsheetGrid
          data={generateGridData()}
          onCellChange={handleCellChange}
          className="mb-6"
        />

        {!isCompleted && (
          <div className="flex justify-center">
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              size="lg"
              className="gap-2"
            >
              <Send className="w-4 h-4" />
              {submitting ? 'Enviando...' : 'Enviar Resposta'}
            </Button>
          </div>
        )}

        {isCompleted && (
          <div className="text-center text-muted-foreground">
            Esta cotação já foi enviada e não pode mais ser editada.
          </div>
        )}
      </div>
    </div>
  );
};

export default QuotationResponse;