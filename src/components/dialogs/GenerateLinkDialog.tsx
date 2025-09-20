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
import { Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

interface GenerateLinkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerateLink: (empresa: string) => Promise<string | null>;
}

const GenerateLinkDialog = ({ open, onOpenChange, onGenerateLink }: GenerateLinkDialogProps) => {
  const [empresa, setEmpresa] = useState('');
  const [generatedLink, setGeneratedLink] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    if (!empresa.trim()) {
      toast.error('Digite o nome da empresa');
      return;
    }

    setLoading(true);
    try {
      const link = await onGenerateLink(empresa.trim());
      if (link) {
        setGeneratedLink(link);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    toast.success('Link copiado para a área de transferência!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    setEmpresa('');
    setGeneratedLink('');
    setCopied(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Gerar Link de Cotação</DialogTitle>
          <DialogDescription>
            Informe o nome da empresa que responderá esta cotação
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="empresa">Nome da Empresa</Label>
            <Input
              id="empresa"
              placeholder="Digite o nome da empresa"
              value={empresa}
              onChange={(e) => setEmpresa(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !generatedLink && handleGenerate()}
            />
          </div>

          {!generatedLink ? (
            <Button 
              onClick={handleGenerate} 
              disabled={loading || !empresa.trim()}
              className="w-full"
            >
              {loading ? 'Gerando...' : 'Gerar Link'}
            </Button>
          ) : (
            <div className="space-y-3">
              <Label>Link Gerado</Label>
              <div className="flex gap-2">
                <Input
                  value={generatedLink}
                  readOnly
                  className="flex-1 text-sm"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopy}
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Envie este link para <strong>{empresa}</strong> responder a cotação.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GenerateLinkDialog;