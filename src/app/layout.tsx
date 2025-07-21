import type { Metadata } from "next";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { ToastContainer } from "react-toastify";
import "@fontsource/inter/400.css";
import "@fontsource/inter/700.css";
import "react-toastify/dist/ReactToastify.css";
import NProgressProvider from "@/components/ui/NProgressProvider";

export const metadata: Metadata = {
  title: "Edir System DashBoard",
  description: "Next.js Edir Management System",
};
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>
          <NProgressProvider />
          {children}
          <ToastContainer position="bottom-right" theme="dark" />
        </body>
      </html>
    </ClerkProvider>
  );
}
