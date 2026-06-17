import { redirect } from "next/navigation";

/**
 * ルートページ（/home にリダイレクト）
 */
export default function RootPage() {
  redirect("/home");
}
