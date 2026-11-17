import { Button } from "@/src/lib/shadcn/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/lib/shadcn/ui/dialog";

/**
 * 破壊的操作の確認ダイアログ
 * @param props - プロパティ
 * @returns ダイアログ
 */
export function ConfirmDialog(props: {
  /** 開いているか */
  open: boolean;
  /** 見出し */
  title: string;
  /** 対象の件数や取り消せない旨を伝える説明 */
  description: React.ReactNode;
  /** 実行ボタンの文言 */
  confirmLabel: string;
  /** 実行中は実行ボタンを無効にする */
  isPending?: boolean;
  /** 実行ボタンの押下 */
  onConfirm: () => void;
  /** キャンセル（閉じる操作を含む） */
  onCancel: () => void;
}) {
  return (
    <Dialog
      open={props.open}
      onOpenChange={(open) => {
        if (!open) props.onCancel();
      }}
    >
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>{props.title}</DialogTitle>
          <DialogDescription asChild>
            <div>{props.description}</div>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" size="lg" onClick={props.onCancel}>
            キャンセル
          </Button>
          <Button
            variant="destructive"
            size="lg"
            disabled={props.isPending}
            onClick={props.onConfirm}
          >
            {props.confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
