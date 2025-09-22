import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Lista } from '@/types/quotation';
import { toast } from 'sonner';
import { Eye, Users } from 'lucide-react';

interface OpenQuotesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectList: (list: Lista) => void;
}

const OpenQuotesDialog = ({ open, onOpenChange, onSelectList }: OpenQuotesDialogProps) => {
  const [lists, setLists] = useState<Lista[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchOpenQuotes = async () => {
    setLoading(true);
    try {
      // Buscar listas abertas
      const { data: listsData, error: listsError } = await supabase
        .from('listas')
        .select('*')
        .eq('status', 'aberta')
        .order('created_at', { ascending: false });

      if (listsError) throw listsError;

      // Buscar links para cada lista
      const { data: linksData, error: linksError } = await supabase
        .from('links_cotacao')
        .select('lista_id, empresa, status');

      if (linksError) throw linksError;

      // Filtrar apenas listas que têm pelo menos um link gerado ou uma resposta
      const filteredLists = (listsData || []).filter(lista => {
        const hasLinks = linksData?.some(link => link.lista_id === lista.id);
        const hasResponses = lista.respostas && Object.keys(lista.respostas).length > 0;
        return hasLinks || hasResponses;
      }).map(lista => ({
        ...lista,
        produtos: Array.isArray(lista.produtos) ? lista.produtos : [],
        respostas: typeof lista.respostas === 'object' && lista.respostas !== null ? lista.respostas : {}
      })) as unknown as Lista[];

      setLists(filteredLists);
    } catch (error) {
      console.error('Error fetching open quotes:', error);
      toast.error('Erro ao carregar cotações abertas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchOpenQuotes();
    }
  }, [open]);

  const handleSelectList = (list: Lista) => {
    onSelectList(list);
    onOpenChange(false);
  };

  const getResponseCount = (list: Lista) => {
    if (!list.respostas) return 0;
    return Object.keys(list.respostas).length;
  };

  const getProductCount = (list: Lista) => {
    if (!Array.isArray(list.produtos)) return 0;
    return list.produtos.length;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Cotações Abertas
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-muted-foreground">Carregando cotações...</div>
            </div>
          ) : lists.length === 0 ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-center">
                <div className="text-muted-foreground mb-2">Nenhuma cotação aberta com atividade</div>
                <div className="text-sm text-muted-foreground">
                  Cotações abertas aparecem aqui quando possuem pelo menos uma resposta ou link gerado
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {lists.map((list) => (
                <div
                  key={list.id}
                  className="border rounded-lg p-4 hover:bg-accent/50 transition-colors cursor-pointer"
                  onClick={() => handleSelectList(list)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium truncate pr-4">{list.nome_lista}</h3>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="gap-1">
                        <Users className="w-3 h-3" />
                        {getResponseCount(list)} respostas
                      </Badge>
                      <Badge variant="outline">
                        {getProductCount(list)} produtos
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="text-sm text-muted-foreground mb-3">
                    Criada em: {new Date(list.created_at).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>

                  {list.respostas && Object.keys(list.respostas).length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {Object.keys(list.respostas).map((empresa) => (
                        <Badge key={empresa} variant="default" className="text-xs">
                          {empresa}
                        </Badge>
                      ))}
                    </div>
                  )}

                  <div className="mt-3 flex justify-end">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectList(list);
                      }}
                    >
                      Visualizar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OpenQuotesDialog;