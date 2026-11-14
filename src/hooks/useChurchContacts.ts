import { useMemo } from 'react';
import { useCmsList } from '@/hooks/useCmsList';

export interface ChurchContact {
  id: number;
  kind: 'phone' | 'email' | 'address' | 'website' | 'whatsapp' | 'other';
  label: string;
  value: string;
  primary: boolean;
}

export function churchContactHref(contact: Pick<ChurchContact, 'kind' | 'value'>): string | null {
  if (contact.kind === 'phone') return `tel:${contact.value}`;
  if (contact.kind === 'email') return `mailto:${contact.value}`;
  if (contact.kind === 'website') {
    try {
      const url = new URL(/^https?:\/\//i.test(contact.value) ? contact.value : `https://${contact.value}`);
      return url.protocol === 'https:' ? url.toString() : null;
    } catch {
      return null;
    }
  }
  if (contact.kind === 'whatsapp') {
    const digits = contact.value.replace(/\D/g, '');
    return digits.length >= 8 ? `https://wa.me/${digits}` : null;
  }
  return null;
}

interface LegacyContactSettings {
  phone?: string;
  email?: string;
  address?: string;
}

export function useChurchContacts(settings: LegacyContactSettings) {
  const { items, usingFallback, loading } = useCmsList<ChurchContact>('/api/church-contacts', []);
  const contacts = useMemo(() => {
    if (!usingFallback) return items;
    return [
      ...(settings.phone ? [{ id: -1, kind: 'phone' as const, label: 'Main phone', value: settings.phone, primary: true }] : []),
      ...(settings.email ? [{ id: -2, kind: 'email' as const, label: 'Main email', value: settings.email, primary: true }] : []),
      ...(settings.address ? [{ id: -3, kind: 'address' as const, label: 'Church location', value: settings.address, primary: true }] : []),
    ];
  }, [items, settings.address, settings.email, settings.phone, usingFallback]);
  return { contacts, loading };
}
