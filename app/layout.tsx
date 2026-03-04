import type { Metadata } from "next";
import {
  Alex_Brush,
  Cormorant_Garamond,
  Montserrat,
  Playball,
  Simonetta,
} from "next/font/google";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-cormorant",
});

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-montserrat",
});

const playball = Playball({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-playball",
});

const simonetta = Simonetta({
  subsets: ["latin"],
  weight: ["400", "900"],
  variable: "--font-simonetta",
});

const alexBrush = Alex_Brush({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-alex-brush",
});

export const metadata: Metadata = {
  title: "Letícia & Júnior",
  description:
    "Bem-vindos ao nosso casamento! O dia que Deus preparou para nós.",
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/favicon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="pt-BR"
      className={`${cormorant.variable} ${montserrat.variable} ${playball.variable} ${simonetta.variable} ${alexBrush.variable}`}
    >
      <body
        className="bg-cream text-navy font-sans antialiased selection:bg-navy selection:text-cream"
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
