import { MessageCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { useSiteSettings } from '@/hooks/useSiteSettings';

function whatsappNumber(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('0')) return `256${digits.slice(1)}`;
  if (digits.startsWith('256')) return digits;
  return digits;
}

export default function WhatsAppFloatingButton() {
  const { settings } = useSiteSettings();
  const number = whatsappNumber(settings.whatsapp_number || settings.phone || '');
  if (settings.whatsapp_float_enabled !== 'true' || number.length < 9) return null;

  const isLeft = settings.whatsapp_float_position === 'left';
  return (
    <motion.a
      href={`https://wa.me/${number}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Contact us on WhatsApp"
      className={`fixed bottom-5 z-40 flex h-14 w-14 items-center justify-center rounded-full text-white shadow-lg ${isLeft ? 'left-5' : 'right-5'}`}
      style={{ background: '#25D366' }}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.06 }}
      transition={{ duration: 0.2 }}
    >
      <MessageCircle size={26} aria-hidden="true" />
    </motion.a>
  );
}
