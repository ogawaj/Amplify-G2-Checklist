/**
 * 操作できない理由の表示
 * @param props - プロパティ
 * @returns 理由の表示
 */
export function BlockedReason(props: {
  /** 閉じるとき */
  onClose: () => void;
  /** 理由 */
  children: React.ReactNode;
}) {
  return (
    <div
      role="alert"
      className="my-2 flex gap-3 rounded-xl bg-brand-tint px-3.5 py-3 text-[15px] leading-relaxed text-brand-text"
    >
      <span className="flex-1">{props.children}</span>
      <button
        type="button"
        className="shrink-0 self-start font-semibold"
        onClick={props.onClose}
      >
        閉じる
      </button>
    </div>
  );
}
