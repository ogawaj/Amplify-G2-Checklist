import { Folder, Tag } from "lucide-react";

import { AddField } from "@/src/app/components/common/add-field";
import { SortableList } from "@/src/app/components/common/sortable-list";
import { CategoryGroup } from "@/src/app/components/list-detail/category-group";
import { EditRow } from "@/src/app/components/list-detail/edit-row";
import type { CategoryItemGroup } from "@/src/app/models/category-item-group";
import type { Item } from "@/src/app/models/item";

/** カテゴリ・タグの管理入口ボタンのクラス */
const MANAGE_BUTTON_CLASS =
  "inline-flex h-11 flex-1 items-center justify-center rounded-xl bg-fill text-[15px] font-semibold transition active:opacity-60";

/**
 * 編集モードの内容（カテゴリ・タグの管理入口、選択行、カテゴリごとの追加欄）
 * @param props - プロパティ
 * @returns 編集モードの内容
 */
export function EditView(props: {
  /** タグの絞り込みチップ */
  tagFilter: React.ReactNode;
  /** 空のカテゴリを含む、カテゴリごとの持ち物 */
  groups: CategoryItemGroup[];
  /** 選択中の持ち物のID */
  selectedItemIds: string[];
  /** 追加直後で強調する持ち物のID */
  highlightedItemId: string | null;
  /** 表示時に追加欄へ入力待ちにするカテゴリのID */
  autoFocusCategoryId: string | null;
  /** 行に出すタグ */
  getTagLabel: (item: Item) => string | null;
  /** 非表示（準備モードで表示しない）か */
  isHidden: (item: Item) => boolean;
  /** 操作を受け付けない状態か（処理中） */
  isDisabled: boolean;
  /** 選択の切り替え */
  onToggleSelected: (itemId: string) => void;
  /** 持ち物を同じカテゴリ内の別の持ち物の位置へ動かす */
  onMoveItem: (itemId: string, targetItemId: string) => void;
  /** 持ち物の編集シートを開く */
  onOpenItem: (itemId: string) => void;
  /** カテゴリ管理シートを開く */
  onOpenCategories: () => void;
  /** タグ管理シートを開く */
  onOpenTags: () => void;
  /** 持ち物の追加。保存に成功したら true を返す */
  onAddItem: (categoryId: string, name: string) => Promise<boolean>;
}) {
  return (
    <>
      {props.tagFilter}
      <div className="flex gap-2">
        <button
          type="button"
          className={MANAGE_BUTTON_CLASS}
          onClick={props.onOpenCategories}
        >
          <Folder className="mr-1.5 size-4" />
          カテゴリ
        </button>
        <button
          type="button"
          className={MANAGE_BUTTON_CLASS}
          onClick={props.onOpenTags}
        >
          <Tag className="mr-1.5 size-4" />
          タグ
        </button>
      </div>
      {props.groups.map(({ category, items }) => (
        <CategoryGroup key={category.id} name={category.name}>
          <SortableList items={items} onMove={props.onMoveItem}>
            {items.map((item) => (
              <EditRow
                key={item.id}
                item={item}
                tagLabel={props.getTagLabel(item)}
                isHidden={props.isHidden(item)}
                isSelected={props.selectedItemIds.includes(item.id)}
                isHighlighted={props.highlightedItemId === item.id}
                isDragDisabled={props.isDisabled}
                onToggleSelected={() => props.onToggleSelected(item.id)}
                onOpen={() => props.onOpenItem(item.id)}
              />
            ))}
          </SortableList>
          <AddField
            label={`${category.name}に追加`}
            autoFocus={props.autoFocusCategoryId === category.id}
            onCommit={(name) => props.onAddItem(category.id, name)}
          />
        </CategoryGroup>
      ))}
    </>
  );
}
