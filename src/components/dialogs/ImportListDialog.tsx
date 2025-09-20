import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ImportListDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (file: File, listName: string) => void;
}

const ImportListDialog = ({ open, onOpenChange, onImport }: ImportListDialogProps) => {
  const [listName, setListName] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleImport = () => {
    if (selectedFile && listName.trim()) {
      onImport(selectedFile, listName.trim());
      onOpenChange(false);
      setListName('');
      setSelectedFile(null);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setListName('');
    setSelectedFile(null);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Importar Lista</DialogTitle>
          <DialogDescription>
            Selecione um arquivo Excel e defina um nome para a lista
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="listName">Nome da Lista</Label>
            <Input
              id="listName"
              placeholder="Digite o nome da lista..."
              value={listName}
              onChange={(e) => setListName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="file">Arquivo Excel</Label>
            <Input
              id="file"
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
            />
          </div>

          {selectedFile && (
            <div className="text-sm text-muted-foreground">
              Arquivo selecionado: {selectedFile.name}
            </div>
          )}

          <div className="bg-muted/50 p-3 rounded-lg">
            <div className="text-sm font-medium mb-2">Formato esperado:</div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="bg-background p-2 rounded text-center">Código Interno</div>
              <div className="bg-background p-2 rounded text-center">Descrição</div>
              <div className="bg-background p-2 rounded text-center">Código de Barras</div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button 
              onClick={handleImport}
              disabled={!selectedFile || !listName.trim()}
            >
              Importar Lista
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImportListDialog;