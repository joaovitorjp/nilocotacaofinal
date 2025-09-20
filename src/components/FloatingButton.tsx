import React from 'react';
import { Button } from '@/components/ui/button';
import { Square } from 'lucide-react';

interface FloatingButtonProps {
  onEndQuotation: () => void;
  show: boolean;
}

const FloatingButton = ({ onEndQuotation, show }: FloatingButtonProps) => {
  if (!show) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Button
        variant="floating"
        size="lg"
        onClick={onEndQuotation}
        className="gap-2 px-6"
      >
        <Square className="w-4 h-4" />
        Encerrar Cotação
      </Button>
    </div>
  );
};

export default FloatingButton;