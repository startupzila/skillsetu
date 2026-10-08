import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { CustomCodeInjector } from "@/components/seo/custom-code-injector";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "SkillSetu — Learn practical skills in your language",
    template: "%s | SkillSetu",
  },
  description:
    "SkillSetu is a structured, multilingual, practical skills learning platform. Learn Excel, Word, Tally, Digital Marketing, AI tools and more — in English and Hindi.",
  keywords: [
    "SkillSetu",
    "learn skills",
    "Excel",
    "Tally",
    "Digital Marketing",
    "AI tools",
    "Hindi tutorials",
    "practical skills",
  ],
  authors: [{ name: "SkillSetu" }],
  openGraph: {
    title: "SkillSetu — Learn practical skills in your language",
    description:
      "Structured tutorials, examples, practice, quizzes and resources in English and Hindi.",
    siteName: "SkillSetu",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "SkillSetu — Learn practical skills in your language",
    description:
      "Structured tutorials, examples, practice, quizzes and resources in English and Hindi.",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <CustomCodeInjector location="body_start" />
          {children}
          <CustomCodeInjector location="body_end" />
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
