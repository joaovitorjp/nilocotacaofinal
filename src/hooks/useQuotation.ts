import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Lista, Product } from '@/types/quotation';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

export const useQuotation = () => {
  const [currentList, setCurrentList] = useState<Lista | null>(null);
  const [loading, setLoading] = useState(false);

  const importFromExcel = useCallback(async (file: File) => {
    setLoading(true);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      const produtos: Product[] = jsonData
        .slice(1) // Skip header row
        .filter(row => row[0] && row[1] && row[2]) // Filter rows with all required data
        .map(row => ({
          codigo_interno: String(row[0] || ''),
          descricao: String(row[1] || ''),
          codigo_barras: String(row[2] || ''),
        }));

      if (produtos.length === 0) {
        toast.error('Nenhum produto válido encontrado no arquivo');
        return;
      }

      const listName = `Lista ${new Date().toLocaleDateString('pt-BR')} - ${new Date().toLocaleTimeString('pt-BR')}`;

      const { data: newList, error } = await supabase
        .from('listas')
        .insert({
          nome_lista: listName,
          produtos: produtos as any,
          respostas: {},
          status: 'aberta'
        })
        .select()
        .single();

      if (error) throw error;

      setCurrentList(newList as unknown as Lista);
      toast.success(`Lista importada com sucesso! ${produtos.length} produtos adicionados.`);
    } catch (error) {
      console.error('Error importing Excel file:', error);
      toast.error('Erro ao importar arquivo Excel');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadList = useCallback(async (listId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('listas')
        .select('*')
        .eq('id', listId)
        .single();

      if (error) throw error;

      setCurrentList(data as unknown as Lista);
      toast.success('Lista carregada com sucesso!');
    } catch (error) {
      console.error('Error loading list:', error);
      toast.error('Erro ao carregar lista');
    } finally {
      setLoading(false);
    }
  }, []);

  const generateQuotationLink = useCallback(async (empresa: string) => {
    if (!currentList) return null;

    setLoading(true);
    try {
      const linkId = crypto.randomUUID();
      
      const { data, error } = await supabase
        .from('links_cotacao')
        .insert({
          lista_id: currentList.id,
          empresa,
          link: linkId,
          status: 'pendente'
        })
        .select()
        .single();

      if (error) throw error;

      const fullLink = `${window.location.origin}/cotacao/${linkId}`;
      toast.success(`Link gerado para ${empresa}!`);
      
      return fullLink;
    } catch (error) {
      console.error('Error generating link:', error);
      toast.error('Erro ao gerar link de cotação');
      return null;
    } finally {
      setLoading(false);
    }
  }, [currentList]);

  const endQuotation = useCallback(async () => {
    if (!currentList) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('listas')
        .update({ status: 'finalizada' })
        .eq('id', currentList.id);

      if (error) throw error;

      setCurrentList({ ...currentList, status: 'finalizada' });
      toast.success('Cotação finalizada com sucesso!');
    } catch (error) {
      console.error('Error ending quotation:', error);
      toast.error('Erro ao finalizar cotação');
    } finally {
      setLoading(false);
    }
  }, [currentList]);

  return {
    currentList,
    loading,
    importFromExcel,
    loadList,
    generateQuotationLink,
    endQuotation,
    setCurrentList
  };
};