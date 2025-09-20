import React from 'react';
import { Button } from '@/components/ui/button';
import { Upload, FolderOpen, Link, Archive, LogOut } from 'lucide-react';

interface ToolbarProps {
  onImportList: () => void;
  onLoadList: () => void;
  onGenerateLink: () => void;
  onFinishedQuotes: () => void;
  onLogout: () => void;
  canGenerateLink: boolean;
}

const Toolbar = ({
  onImportList,
  onLoadList,
  onGenerateLink,
  onFinishedQuotes,
  onLogout,
  canGenerateLink
}: ToolbarProps) => {
  return (
    <div className="bg-background border-b border-grid-border px-6 py-4 flex items-center justify-between shadow-toolbar">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-semibold text-foreground mr-8">Nilo Atacadista</h1>
        
        <div className="flex items-center gap-2">
          <Button
            variant="toolbar"
            size="sm"
            onClick={onImportList}
            className="gap-2"
          >
            <Upload className="w-4 h-4" />
            Importar Lista
          </Button>
          
          <Button
            variant="toolbar"
            size="sm"
            onClick={onLoadList}
            className="gap-2"
          >
            <FolderOpen className="w-4 h-4" />
            Carregar Lista
          </Button>
          
          <Button
            variant="toolbar"
            size="sm"
            onClick={onGenerateLink}
            disabled={!canGenerateLink}
            className="gap-2"
          >
            <Link className="w-4 h-4" />
            Gerar Link Cotação
          </Button>
          
          <Button
            variant="toolbar"
            size="sm"
            onClick={onFinishedQuotes}
            className="gap-2"
          >
            <Archive className="w-4 h-4" />
            Cotações Finalizadas
          </Button>
        </div>
      </div>
      
      <Button
        variant="outline"
        size="sm"
        onClick={onLogout}
        className="gap-2"
      >
        <LogOut className="w-4 h-4" />
        Sair
      </Button>
    </div>
  );
};

export default Toolbar;