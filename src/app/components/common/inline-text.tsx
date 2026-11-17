"use client";

import { useRef, useState } from "react";

import { Input } from "@/src/lib/shadcn/ui/input";
import { cn } from "@/src/lib/shadcn/utils";

/**
 * 直接入力欄。フォーカスが外れた時点で確定し、値が変わっていれば onCommit を呼ぶ
 *
 * 空のまま確定した場合は変更を取り消す（allowEmpty が true のときは空の値を確定する）。
 * 表示は value に追従するため、保存に失敗したら呼び出し側が value を元に戻すと入力欄も戻る。
 * clearOnCommit のときは保存が終わるまで入力欄を無効にし、追加中の名前を案内に表示する（keepFocus のときを除く）。
 * keepFocus のときは Enter で確定した後もフォーカスを残し、保存中も続けて入力できる。
 * ［戻す］で編集前の値に戻せるのは、appearance が standard 以外で、clearOnCommit でなく、inputMode 未指定のときの入力中だけ。
 * @param props - プロパティ
 * @returns 入力欄
 */
export function InlineText(props: {
  /** 現在の値 */
  value: string;
  /** 確定時の保存。保存に成功したら true を返す */
  onCommit: (next: string) => Promise<boolean>;
  /** 読み上げ用のラベル */
  ariaLabel: string;
  /** 未入力時の案内 */
  placeholder?: string;
  /** 空の値の確定を許すか */
  allowEmpty?: boolean;
  /** 確定後に入力欄を空に戻すか（追加行用）。保存に失敗した場合は入力を残す */
  clearOnCommit?: boolean;
  /** Enter で確定した後もフォーカスを残すか（追加欄で続けて入力する） */
  keepFocus?: boolean;
  /** 見た目。bare は枠のない見た目（行に溶け込ませる）、filled は灰色の塗り。既定は standard（枠付き） */
  appearance?: "standard" | "bare" | "filled";
  /** 先頭から入力待ちにするか */
  autoFocus?: boolean;
  /** 確定せずに編集を終えたとき */
  onCancel?: () => void;
  /** input 要素の inputMode */
  inputMode?: "numeric" | "text";
  /** 追加のクラス */
  className?: string;
}) {
  const { value, onCommit, allowEmpty, clearOnCommit, keepFocus, onCancel } =
    props;
  const [draft, setDraft] = useState(value);
  const [syncedValue, setSyncedValue] = useState(value);
  if (value !== syncedValue) {
    setSyncedValue(value);
    setDraft(value);
  }

  const appearance = props.appearance ?? "standard";
  const [pendingText, setPendingText] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const isCancelledRef = useRef(false);
  const canRevert =
    appearance !== "standard" &&
    isFocused &&
    !clearOnCommit &&
    props.inputMode === undefined &&
    draft !== value;

  const commit = async () => {
    if (isCancelledRef.current) {
      isCancelledRef.current = false;
      return;
    }
    const next = draft.trim();
    if (next === value || (next === "" && !allowEmpty)) {
      setDraft(value);
      onCancel?.();
      return;
    }
    if (clearOnCommit) {
      setDraft("");
      if (!keepFocus) setPendingText(next);
      const isSaved = await onCommit(next);
      setPendingText(null);
      if (!isSaved) setDraft((current) => (current === "" ? next : current));
      return;
    }
    setDraft(next);
    if (!(await onCommit(next))) setDraft(value);
  };

  const inputProps = {
    value: draft,
    "aria-label": props.ariaLabel,
    placeholder:
      pendingText === null
        ? props.placeholder
        : `「${pendingText}」を追加しています…`,
    disabled: pendingText !== null,
    "aria-busy": pendingText !== null,
    inputMode: props.inputMode,
    autoFocus: props.autoFocus,
    enterKeyHint: keepFocus ? ("next" as const) : ("done" as const),
    onChange: (event: React.ChangeEvent<HTMLInputElement>) =>
      setDraft(event.target.value),
    onFocus: () => setIsFocused(true),
    onBlur: () => {
      setIsFocused(false);
      void commit();
    },
    onKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.nativeEvent.isComposing) return;
      if (event.key === "Enter") {
        if (keepFocus) {
          void commit();
        } else {
          event.currentTarget.blur();
        }
      } else if (event.key === "Escape") {
        isCancelledRef.current = true;
        setDraft(value);
        onCancel?.();
        event.currentTarget.blur();
      }
    },
  };

  if (appearance === "standard") {
    return (
      <Input
        {...inputProps}
        className={cn("h-11 bg-background md:h-9", props.className)}
      />
    );
  }

  return (
    <div className="relative w-full min-w-0">
      <input
        {...inputProps}
        className={cn(
          "h-9 w-full min-w-0 rounded-lg text-[17px] caret-primary outline-none placeholder:text-subtle",
          appearance === "bare"
            ? "bg-transparent px-1 focus:bg-fill focus:px-2"
            : "bg-fill px-3",
          canRevert && "pr-14",
          props.className,
        )}
      />
      {canRevert && (
        <button
          type="button"
          className="absolute inset-y-0 right-1 my-auto h-7 rounded-md px-2 text-[13px] font-semibold text-brand-text"
          // 入力欄のフォーカスが外れて確定される前に、編集前の値へ戻す
          onPointerDown={(event) => {
            event.preventDefault();
            isCancelledRef.current = true;
            setDraft(value);
            if (document.activeElement instanceof HTMLElement) {
              document.activeElement.blur();
            }
          }}
        >
          戻す
        </button>
      )}
    </div>
  );
}
