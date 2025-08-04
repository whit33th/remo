import type { Metadata } from "next";
import { Roboto_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
import { ConvexClientProvider } from "./ConvexClientProvider";
import { AppLayout } from "./AppLayout";

const robotoSans = Roboto_Mono({
  subsets: ["latin"],
  variable: "--font-roboto-mono",
});

export const metadata: Metadata = {
  title: "Remo - Content Planning",
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
          <AppLayout>{children}</AppLayout>
          <Toaster />
        </ConvexClientProvider>
      </body>
    </html>
  );
}
