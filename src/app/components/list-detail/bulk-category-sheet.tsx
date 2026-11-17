import { BottomSheet } from "@/src/app/components/common/bottom-sheet";
import { MenuRow } from "@/src/app/components/common/menu-row";
import type { Category } from "@/src/app/models/category";

/**
 * 選んだ持ち物をまとめて別のカテゴリへ移すシート
 * @param props - プロパティ
 * @returns 一括カテゴリ移動シート
 */
export function BulkCategorySheet(props: {
  /** 選択中の件数 */
  selectedCount: number;
  /** 移動先に選べるカテゴリ（表示順） */
  categories: Category[];
  /** 移動先の選択 */
  onSelect: (category: Category) => void;
  /** 閉じる */
  onClose: () => void;
}) {
  return (
    <BottomSheet
      title={`カテゴリへ移動（${props.selectedCount}件）`}
      onClose={props.onClose}
    >
      <div className="flex flex-col">
        {props.categories.map((category) => (
          <MenuRow key={category.id} onClick={() => props.onSelect(category)}>
            {category.name}
          </MenuRow>
        ))}
      </div>
    </BottomSheet>
  );
}
