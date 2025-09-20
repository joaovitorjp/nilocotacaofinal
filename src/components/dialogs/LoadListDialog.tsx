import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Lista } from '@/types/quotation';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, Package } from 'lucide-react';

interface LoadListDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectList: (list: Lista) => void;
  showFinalized?: boolean;
}

const LoadListDialog = ({ open, onOpenChange, onSelectList, showFinalized = false }: LoadListDialogProps) => {
  const [lists, setLists] = useState<Lista[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      loadLists();
    }
  }, [open, showFinalized]);

  const loadLists = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('listas')
        .select('*')
        .order('created_at', { ascending: false });

      // Se showFinalized for true, mostrar apenas finalizadas
      // Caso contrário, mostrar todas (para reutilizar listas)
      if (showFinalized) {
        query = query.eq('status', 'finalizada');
      }

      const { data, error } = await query;

      if (error) throw error;
      setLists((data || []) as unknown as Lista[]);
    } catch (error) {
      console.error('Error loading lists:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectList = (list: Lista) => {
    // Se não for visualização de finalizadas, criar nova instância sem respostas
    if (!showFinalized) {
      const listWithoutResponses = {
        ...list,
        respostas: {},
        status: 'aberta' as const
      };
      onSelectList(listWithoutResponses);
    } else {
      onSelectList(list);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {showFinalized ? 'Cotações Finalizadas' : 'Carregar Lista'}
          </DialogTitle>
          <DialogDescription>
            {showFinalized 
              ? 'Selecione uma cotação finalizada para visualizar'
              : 'Selecione uma lista para carregar na planilha'
            }
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Carregando listas...
            </div>
          ) : lists.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {showFinalized 
                ? 'Nenhuma cotação finalizada encontrada'
                : 'Nenhuma lista encontrada'
              }
            </div>
          ) : (
            lists.map((list) => (
              <div
                key={list.id}
                className="border border-border rounded-lg p-4 hover:bg-accent cursor-pointer transition-colors"
                onClick={() => handleSelectList(list)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium text-sm">{list.nome_lista}</h3>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Package className="w-3 h-3" />
                        {Array.isArray(list.produtos) ? list.produtos.length : 0} produtos
                      </div>
                      <div className="flex items-center gap-1">
                        <CalendarDays className="w-3 h-3" />
                        {new Date(list.created_at).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                  </div>
                  <Badge variant={list.status === 'finalizada' ? 'destructive' : 'default'}>
                    {list.status === 'finalizada' ? 'Finalizada' : 'Aberta'}
                  </Badge>
                </div>
                
                {list.respostas && Object.keys(list.respostas).length > 0 && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    Respostas de: {Object.keys(list.respostas).join(', ')}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LoadListDialog;