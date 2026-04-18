import type { Metadata } from "next";
import type { ReactNode } from "react";
import "antd/dist/reset.css";
import "./globals.css";
import { Providers } from "@/app/providers";

export const metadata: Metadata = {
  title: "Admin Demo",
  description: "Next.js 13 app router demo with mock API",
};

type RootLayoutProps = {
  children: ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="ru">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
