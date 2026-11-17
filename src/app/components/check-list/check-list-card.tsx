"use client";

import Link from "next/link";

import { ActionMenu } from "@/src/app/components/common/action-menu";
import { InlineText } from "@/src/app/components/common/inline-text";
import { LIST_SECTION } from "@/src/app/enums/app-path";
import type { CheckList } from "@/src/app/models/check-list";
import { buildListPath } from "@/src/app/utils/list-path-utils";
import { Card } from "@/src/lib/shadcn/ui/card";

/**
 * チェックリスト1件のカード（名前・日数・最終更新日と操作メニュー）
 * @param props - プロパティ
 * @returns カード
 */
export function CheckListCard(props: {
  /** 表示するチェックリスト */
  checkList: CheckList;
  /** 名前を直接編集中か */
  isRenaming: boolean;
  /** 操作を受け付けない状態か */
  isBusy: boolean;
  /** 名前の保存 */
  onRename: (name: string) => Promise<boolean>;
  /** 名前の編集を始める */
  onStartRename: () => void;
  /** 名前の編集を終える */
  onEndRename: () => void;
  /** 複製の要求 */
  onDuplicate: () => void;
  /** 削除の要求 */
  onDelete: () => void;
}) {
  const { checkList } = props;
  const updatedAt = new Date(checkList.updatedAt).toLocaleDateString("ja-JP", {
    month: "numeric",
    day: "numeric",
  });
  return (
    <Card className="flex-row items-center gap-2 px-4 py-2">
      <div className="min-w-0 flex-1">
        {props.isRenaming ? (
          <InlineText
            value={checkList.name}
            ariaLabel="チェックリスト名"
            autoFocus
            onCommit={async (name) => {
              const isSaved = await props.onRename(name);
              props.onEndRename();
              return isSaved;
            }}
            onCancel={props.onEndRename}
          />
        ) : (
          <Link
            href={buildListPath(checkList.id)}
            className="flex min-h-11 flex-col justify-center"
          >
            <span className="truncate font-medium">{checkList.name}</span>
            <span className="text-sm text-muted-foreground">
              {checkList.durationDays}日 ・ 最終更新 {updatedAt}
            </span>
          </Link>
        )}
      </div>
      <ActionMenu
        ariaLabel={`${checkList.name}の操作`}
        items={[
          { label: "名前を変更", onSelect: props.onStartRename },
          {
            label: "複製する",
            onSelect: props.onDuplicate,
            isDisabled: props.isBusy,
          },
          {
            label: "CSV入出力",
            href: buildListPath(checkList.id, LIST_SECTION.CSV),
            isDesktopOnly: true,
          },
          {
            label: "削除する",
            onSelect: props.onDelete,
            isDestructive: true,
            isDisabled: props.isBusy,
          },
        ]}
      />
    </Card>
  );
}
