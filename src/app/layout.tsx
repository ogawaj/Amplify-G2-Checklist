import "./globals.css";

import { Inter } from "next/font/google";

import { AmplifyProvider } from "./providers/amplify-provider";

const inter = Inter({ subsets: ["latin"] });

/**
 * ルートレイアウト
 * @param root0 - レイアウトプロパティ
 * @param root0.children - 子コンポーネント
 * @returns ルートレイアウト
 */
export default function RootLayout({
  children,
}: {
  /** 子コンポーネント */
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className={inter.className}>
        <AmplifyProvider>{children}</AmplifyProvider>
      </body>
    </html>
  );
}
