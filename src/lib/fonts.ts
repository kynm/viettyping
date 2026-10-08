import localFont from 'next/font/local';

// Preserve the existing design font without network fetches during builds.
export const plusJakartaSans = localFont({
  src: '../../public/fonts/PlusJakartaSans-variable.ttf',
  weight: '400 800',
  variable: '--font-plus-jakarta-sans',
  display: 'swap',
});
