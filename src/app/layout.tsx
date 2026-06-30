import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { ServiceWorkerRegistration } from "@/components/pwa/ServiceWorkerRegistration";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
  weight: ["300", "400", "500"],
});

export const metadata: Metadata = {
  title: "FocusFlow — Deep Work Sessions",
  description: "Beautiful focus timer with session tracking, ambient music, and Telegram reports",
  applicationName: "FocusFlow",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "FocusFlow",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
};

export const viewport = {
  themeColor: "#080f0e",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased`}>
        <TooltipProvider delayDuration={300}>
          <ServiceWorkerRegistration />
          {children}
        </TooltipProvider>
      </body>
    </html>
  );
}
