import type { Metadata, Viewport } from "next"
import { Geist, JetBrains_Mono } from "next/font/google"
import "./globals.css"

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
  display: "swap",
})

const monoCode = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono-code",
  display: "swap",
})

export const metadata: Metadata = {
  title: "LexGen — Generador de analizadores léxicos",
  description:
    "Herramienta para construir expresiones regulares con botones y generar un analizador léxico en C++ mediante AFN, AFD minimizado y maximal munch.",
  applicationName: "LexGen",
  keywords: [
    "analizador léxico",
    "Flex",
    "Lex",
    "compiladores",
    "autómatas",
    "AFD",
    "AFN",
    "generador C++",
  ],
}

export const viewport: Viewport = {
  themeColor: "#1a56db",
  colorScheme: "light",
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={`bg-background ${geistSans.variable} ${monoCode.variable}`}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  )
}
