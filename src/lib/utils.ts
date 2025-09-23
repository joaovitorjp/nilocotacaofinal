import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: string | number): string {
  if (!value || value === '') return '';
  
  const numericValue = typeof value === 'string' ? 
    parseFloat(value.replace(',', '.')) : value;
    
  if (isNaN(numericValue)) return '';
  
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(numericValue);
}

export function parseCurrency(value: string): string {
  return value.replace(/[^\d,]/g, '');
}
