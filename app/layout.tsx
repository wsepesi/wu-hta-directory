import type { Metadata, Viewport } from "next";
import { Crimson_Text } from "next/font/google";
import "./globals.css";
import SessionProvider from "@/components/providers/session-provider";
import { ToastContainer } from "@/components/ui/EnhancedToast";
import { ResourceHints } from "@/components/layout/ResourceHints";
import { NavigationWrapper } from "@/components/navigation/NavigationWrapper";
import { NavigationProgress } from "@/components/navigation/NavigationProgress";

const crimsonText = Crimson_Text({
  variable: "--font-crimson-text",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "Head TA Directory",
  description: "Washington University Head TA Directory",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "WU Head TAs",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#2C2C2C",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={crimsonText.variable}>
      <head>
        <ResourceHints />
      </head>
      <body
        className="font-serif antialiased"
      >
        <NavigationProgress />
        <SessionProvider>
          <NavigationWrapper>
            {children}
          </NavigationWrapper>
          <ToastContainer />
        </SessionProvider>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js');
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
