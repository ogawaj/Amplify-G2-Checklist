import { Check, CircleAlert, X } from "lucide-react";

import type { UndoToastContent } from "@/src/app/models/undo-toast-content";
import { cn } from "@/src/lib/shadcn/utils";

/**
 * 画面下部の通知。エラーと、［元に戻す］付きの場合がある通知を重ねて出す
 * @param props - プロパティ
 * @returns 通知。出す内容がなければ何も描画しない
 */
export function UndoToast(props: {
  /** 通知の内容 */
  toast: UndoToastContent | null;
  /** エラーの文言。ないときは null */
  errorMessage: string | null;
  /** エラーを閉じる */
  onDismissError: () => void;
  /** 下部の操作バーが出ているため、その上に持ち上げるか */
  isLifted: boolean;
}) {
  const { toast, errorMessage } = props;
  if (toast === null && errorMessage === null) return null;
  return (
    <div
      className={cn(
        "pointer-events-none fixed inset-x-0 z-40 flex flex-col items-center gap-2 px-5",
        props.isLifted
          ? "bottom-[calc(max(0.75rem,env(safe-area-inset-bottom))+6rem)]"
          : "bottom-[max(1.75rem,env(safe-area-inset-bottom))]",
      )}
    >
      {errorMessage !== null && (
        <div
          role="alert"
          className="pointer-events-auto flex items-center gap-2 rounded-2xl bg-destructive py-2 pr-1 pl-3 text-[15px] text-white shadow-xl"
        >
          <CircleAlert className="size-5 shrink-0" />
          <span className="pr-1">{errorMessage}</span>
          <button
            type="button"
            aria-label="閉じる"
            className="grid size-9 shrink-0 place-items-center rounded-full"
            onClick={props.onDismissError}
          >
            <X className="size-4" />
          </button>
        </div>
      )}
      {toast !== null && (
        <div
          role="status"
          className="pointer-events-auto flex items-center gap-2 rounded-full bg-foreground/90 py-2 pr-2 pl-3 text-[15px] text-background shadow-xl backdrop-blur"
        >
          <span className="grid size-5 shrink-0 place-items-center rounded-full bg-primary text-white">
            <Check className="size-3.5" strokeWidth={3} />
          </span>
          <span className="pr-2">{toast.message}</span>
          {toast.undo && (
            <button
              type="button"
              className="h-9 shrink-0 rounded-full bg-background/15 px-3.5 font-semibold text-primary-on-dark"
              onClick={toast.undo}
            >
              元に戻す
            </button>
          )}
        </div>
      )}
    </div>
  );
}
