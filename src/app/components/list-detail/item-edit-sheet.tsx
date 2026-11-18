import { ArrowDown, ArrowUp, Check, Trash2 } from "lucide-react";

import { ActionButton } from "@/src/app/components/common/action-button";
import { BottomSheet } from "@/src/app/components/common/bottom-sheet";
import { Chip } from "@/src/app/components/common/chip";
import { InlineText } from "@/src/app/components/common/inline-text";
import { TextButton } from "@/src/app/components/common/text-button";
import type { Category } from "@/src/app/models/category";
import type { Item } from "@/src/app/models/item";
import type { Tag } from "@/src/app/models/tag";

/**
 * シートの1項目（小さな見出しと中身）
 * @param props - プロパティ
 * @returns 項目
 */
function SheetField(props: {
  /** 見出し */
  label: string;
  /** 中身 */
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="mb-2 text-[13px] font-semibold text-muted-foreground">
        {props.label}
      </p>
      {props.children}
    </div>
  );
}

/**
 * 持ち物の編集シート（名前・必要数・カテゴリ・タグ・非表示・並び順・削除）
 * @param props - プロパティ
 * @returns 編集シート
 */
export function ItemEditSheet(props: {
  /** 編集する持ち物 */
  item: Item;
  /** 選べるカテゴリ（表示順） */
  categories: Category[];
  /** 選べるタグ */
  tags: Tag[];
  /** 付いているタグのID */
  attachedTagIds: string[];
  /** 非表示（準備モードで表示しない）か */
  isHidden: boolean;
  /** 操作を受け付けない状態か（処理中） */
  isDisabled: boolean;
  /** カテゴリ内で先頭か */
  isFirst: boolean;
  /** カテゴリ内で末尾か */
  isLast: boolean;
  /** 名前の確定。保存に成功したら true を返す */
  onRename: (name: string) => Promise<boolean>;
  /** 必要数の確定（空文字で未設定）。保存に成功したら true を返す */
  onChangeQuantity: (text: string) => Promise<boolean>;
  /** カテゴリの変更 */
  onMoveToCategory: (category: Category) => void;
  /** タグの付け外し */
  onToggleTag: (tagId: string) => void;
  /** 非表示の切り替え */
  onToggleHidden: () => void;
  /** 同じカテゴリ内で1つ上または下へ動かす */
  onReorder: (delta: -1 | 1) => void;
  /** 削除する */
  onDelete: () => void;
  /** 閉じる */
  onClose: () => void;
}) {
  const { item } = props;
  return (
    <BottomSheet
      title="持ち物を編集"
      action={
        <TextButton isStrong onClick={props.onClose}>
          完了
        </TextButton>
      }
      onClose={props.onClose}
    >
      <div className="flex flex-col gap-5">
        <SheetField label="名前">
          <InlineText
            value={item.name}
            ariaLabel="持ち物名"
            appearance="filled"
            onCommit={props.onRename}
          />
        </SheetField>
        <SheetField label="1日あたりの必要数">
          <div className="flex items-center gap-2">
            <div className="w-24">
              <InlineText
                value={item.quantityPerDay?.toString() ?? ""}
                ariaLabel="1日あたりの必要数"
                placeholder="なし"
                inputMode="numeric"
                appearance="filled"
                allowEmpty
                className="text-center font-semibold tabular-nums"
                onCommit={props.onChangeQuantity}
              />
            </div>
            <span className="text-[15px] text-muted-foreground">/日</span>
          </div>
        </SheetField>
        <SheetField label="カテゴリ">
          <div className="flex flex-wrap gap-2">
            {props.categories.map((category) => (
              <Chip
                key={category.id}
                isOn={item.categoryId === category.id}
                isDisabled={props.isDisabled}
                onClick={() => props.onMoveToCategory(category)}
              >
                {category.name}
              </Chip>
            ))}
          </div>
        </SheetField>
        <SheetField label="タグ">
          <div className="flex flex-wrap gap-2">
            {props.tags.map((tag) => {
              const isOn = props.attachedTagIds.includes(tag.id);
              return (
                <Chip
                  key={tag.id}
                  isOn={isOn}
                  isDisabled={props.isDisabled}
                  onClick={() => props.onToggleTag(tag.id)}
                >
                  {isOn && <Check className="size-3.5" strokeWidth={3} />}
                  {tag.name}
                </Chip>
              );
            })}
          </div>
        </SheetField>
        <SheetField label="準備モード">
          <div className="flex flex-wrap gap-2">
            <Chip
              isOn={props.isHidden}
              isDisabled={props.isDisabled}
              onClick={props.onToggleHidden}
            >
              {props.isHidden && <Check className="size-3.5" strokeWidth={3} />}
              非表示
            </Chip>
          </div>
        </SheetField>
        <SheetField label="並び順">
          <div className="flex gap-2">
            <ActionButton
              variant="outline"
              className="px-4 text-[15px]"
              isDisabled={props.isDisabled || props.isFirst}
              onClick={() => props.onReorder(-1)}
            >
              <ArrowUp className="mr-1 size-4" />
              上へ
            </ActionButton>
            <ActionButton
              variant="outline"
              className="px-4 text-[15px]"
              isDisabled={props.isDisabled || props.isLast}
              onClick={() => props.onReorder(1)}
            >
              <ArrowDown className="mr-1 size-4" />
              下へ
            </ActionButton>
          </div>
        </SheetField>
        <div>
          <ActionButton
            variant="dangerOutline"
            isDisabled={props.isDisabled}
            onClick={props.onDelete}
          >
            <Trash2 className="mr-1.5 size-4" />
            削除
          </ActionButton>
        </div>
      </div>
    </BottomSheet>
  );
}
