import { Plus } from "lucide-react";

import { InlineText } from "@/src/app/components/common/inline-text";

/**
 * 黄色い丸の＋を添えた追加欄。Enter で確定した後もフォーカスを残し、続けて入力できる
 * @param props - プロパティ
 * @returns 追加欄
 */
export function AddField(props: {
  /** 読み上げ用のラベル兼、未入力時の案内 */
  label: string;
  /** 表示時に入力待ちにするか */
  autoFocus?: boolean;
  /** 確定時の保存。保存に成功したら true を返す */
  onCommit: (name: string) => Promise<boolean>;
}) {
  return (
    <div className="flex min-h-11 items-center gap-2">
      <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary text-white">
        <Plus className="size-4" />
      </span>
      <InlineText
        value=""
        ariaLabel={props.label}
        placeholder={props.label}
        clearOnCommit
        keepFocus
        appearance="bare"
        autoFocus={props.autoFocus}
        className="placeholder:text-brand-text"
        onCommit={props.onCommit}
      />
    </div>
  );
}
