import type { Metadata } from "next";
// Temporarily disabled Google Fonts due to network restrictions
// import { Poppins, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProviderWrapper, ThemeProvider, SWRProvider, AuthProviderWrapper } from '../shared/providers';
import { ToastProvider } from '../shared/providers/toast-provider';

// const poppins = Poppins({
//   weight: ['300', '400', '500', '600', '700', '800'],
//   variable: "--font-poppins",
//   subsets: ["latin"],
//   display: "swap",
// });

// const jetbrainsMono = JetBrains_Mono({
//   variable: "--font-jetbrains-mono",
//   subsets: ["latin"],
//   display: "swap",
// });

export const metadata: Metadata = {
  title: "Experts Front Core",
  description: "Experts Front Core - Next.js app with Material UI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="format-detection" content="telephone=no" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body
        className="antialiased"
      >
        <ThemeProvider>
          <ThemeProviderWrapper>
            <ToastProvider>
              <SWRProvider>
                <AuthProviderWrapper>
                  {children}
                </AuthProviderWrapper>
              </SWRProvider>
            </ToastProvider>
          </ThemeProviderWrapper>
        </ThemeProvider>
      </body>
    </html>
  );
}
