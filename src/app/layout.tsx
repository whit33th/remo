import type { Metadata } from "next";
import { Roboto_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "../globals.css";
import { ConvexClientProvider } from "./ConvexClientProvider";

const robotoSans = Roboto_Mono({
  subsets: ["latin"],
  variable: "--font-roboto-mono",
});

export const metadata: Metadata = {
  title: "Tretch - Content Creator Platform",
  description: "Plan and manage your content across all platforms",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${robotoSans.variable} antialiased`}>
        <ConvexClientProvider>
          {children}
          <Toaster />
        </ConvexClientProvider>
      </body>
    </html>
  );
}
