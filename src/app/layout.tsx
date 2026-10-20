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
  title: "Experts Handling Cargo",
  description: "Coordinación de carga, guías y cobro de Experts Handling Cargo",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="format-detection" content="telephone=no" />
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
