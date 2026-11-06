import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MindBridge",
  description: "마음을 정리하는 대화",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full bg-[#e9ece9] print:bg-white">
        <div className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col bg-background shadow-sm print:block print:min-h-0 print:max-w-none print:bg-white print:shadow-none">
          {children}
        </div>
      </body>
    </html>
  );
}
