import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from '@/contexts/AuthContext';
import { ToastProvider } from '@/contexts/ToastContext';
import GlobalNavigation from '@/components/GlobalNavigation';
import HideOnQbank from '@/components/HideOnQbank';
import Footer from '@/components/Footer';
import PageAccessController from '@/components/PageAccessController';

const inter = Inter({ 
  subsets: ["latin"],
  display: 'swap',
});

export const metadata: Metadata = {
  title: "모고",
  description: "모의고사 학습과 해설, 코칭을 한 곳에서",
  icons: {
    icon: '/mogo_icon.png',
    shortcut: '/mogo_icon.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className={inter.className}>
        <AuthProvider>
          <ToastProvider>
            <HideOnQbank>
              <GlobalNavigation />
            </HideOnQbank>
            <main className="min-h-[calc(100vh-4rem)]">
              <PageAccessController>
                {children}
              </PageAccessController>
            </main>
            <HideOnQbank>
              <Footer />
            </HideOnQbank>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
