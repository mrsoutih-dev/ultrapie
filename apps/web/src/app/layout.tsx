import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { AuthModal } from '@/components/auth/AuthModal';
import { SubscriptionModal } from '@/components/subscription/SubscriptionModal';
import { GoogleCloudGuideModal } from '@/components/auth/GoogleCloudGuideModal';
import { AdminDashboardModal } from '@/components/admin/AdminDashboardModal';

export const metadata: Metadata = {
  title: 'Ultrapie — Natural Language App Builder & Hosting',
  description: 'Describe, build, preview, edit, version, and deploy full-stack apps from natural language.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="antialiased min-h-screen bg-slate-950 text-slate-100 transition-colors duration-200">
        <ThemeProvider>
          <AuthProvider>
            {children}
            <AuthModal />
            <SubscriptionModal />
            <GoogleCloudGuideModal />
            <AdminDashboardModal />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
