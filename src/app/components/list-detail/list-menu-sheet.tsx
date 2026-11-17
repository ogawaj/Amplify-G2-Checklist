import { FileSpreadsheet, PencilLine, RotateCcw } from "lucide-react";

import { BottomSheet } from "@/src/app/components/common/bottom-sheet";
import { MenuRow } from "@/src/app/components/common/menu-row";

/**
 * 準備モードの「⋯」から開くメニューシート
 * @param props - プロパティ
 * @returns メニューシート
 */
export function ListMenuSheet(props: {
  /** チェックを外すメニューの文言 */
  resetLabel: string;
  /** チェックを外せる持ち物があるか */
  canReset: boolean;
  /** CSV入出力画面のパス */
  csvHref: string;
  /** 名前の変更を始める */
  onRename: () => void;
  /** チェックを外す */
  onReset: () => void;
  /** 閉じる */
  onClose: () => void;
}) {
  return (
    <BottomSheet onClose={props.onClose}>
      <div className="flex flex-col">
        <MenuRow icon={<PencilLine />} onClick={props.onRename}>
          名前を変更
        </MenuRow>
        <MenuRow
          icon={<RotateCcw />}
          isDisabled={!props.canReset}
          onClick={props.onReset}
        >
          {props.resetLabel}
        </MenuRow>
        <MenuRow
          icon={<FileSpreadsheet />}
          href={props.csvHref}
          className="max-md:hidden"
        >
          CSV入出力
        </MenuRow>
      </div>
    </BottomSheet>
  );
}
