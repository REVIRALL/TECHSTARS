import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'VIBECODING - AI時代のエンジニア育成',
  description: 'AIツールが生成したコードを理解し、実務で活用できるエンジニアを7日間で育成',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
