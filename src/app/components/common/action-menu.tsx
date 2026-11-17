"use client";

import { MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { DropdownMenu } from "radix-ui";

import { cn } from "@/src/lib/shadcn/utils";

/** メニュー項目 */
type ActionMenuItem = {
  /** 項目の文言 */
  label: string;
  /** 遷移先。指定するとリンクになる */
  href?: string;
  /** 選択時の処理（href 未指定の項目で使う） */
  onSelect?: () => void;
  /** 削除など破壊的な操作として赤く表示するか */
  isDestructive?: boolean;
  /** パソコン幅（md以上）でだけ表示するか */
  isDesktopOnly?: boolean;
  /** 無効にするか */
  isDisabled?: boolean;
};

/**
 * 「⋯」ボタンで開く操作メニュー
 * @param props - プロパティ
 * @returns メニュー
 */
export function ActionMenu(props: {
  /** ボタンの読み上げ用ラベル */
  ariaLabel: string;
  /** メニュー項目 */
  items: ActionMenuItem[];
}) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          aria-label={props.ariaLabel}
          className="inline-flex size-11 items-center justify-center rounded-md hover:bg-accent md:size-9"
        >
          <MoreHorizontal className="size-5" />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={4}
          className="z-50 min-w-48 rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
        >
          {props.items.map((item) => {
            const className = cn(
              "flex min-h-11 cursor-pointer items-center rounded-sm px-3 text-sm outline-none select-none data-[disabled]:opacity-50 data-[highlighted]:bg-accent md:min-h-9",
              item.isDestructive && "text-destructive",
              item.isDesktopOnly && "hidden md:flex",
            );
            return (
              <DropdownMenu.Item
                key={item.label}
                asChild={item.href !== undefined}
                disabled={item.isDisabled}
                className={className}
                onSelect={item.onSelect}
              >
                {item.href !== undefined ? (
                  <Link href={item.href}>{item.label}</Link>
                ) : (
                  item.label
                )}
              </DropdownMenu.Item>
            );
          })}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
