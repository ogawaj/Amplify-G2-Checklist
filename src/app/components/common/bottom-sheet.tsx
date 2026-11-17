"use client";

import { useEffect } from "react";

/**
 * 下から出るシート。背景を押すか Escape キーで閉じる
 * @param props - プロパティ
 * @returns シート
 */
export function BottomSheet(props: {
  /** 見出し */
  title?: string;
  /** 見出しの右に置く文字ボタン（完了など） */
  action?: React.ReactNode;
  /** 閉じるとき */
  onClose: () => void;
  /** 中身 */
  children: React.ReactNode;
}) {
  const { onClose } = props;
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-30 flex flex-col justify-end bg-black/30"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={props.title ?? "メニュー"}
        className="mx-auto max-h-[85dvh] w-full max-w-160 overflow-y-auto rounded-t-[14px] bg-background px-5 pt-2 pb-[max(1.5rem,env(safe-area-inset-bottom))]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mx-auto mb-3 h-[5px] w-9 rounded-full bg-grabber" />
        {(props.title || props.action) && (
          <div className="mb-4 grid grid-cols-[1fr_auto_1fr] items-center">
            <span />
            <h2 className="text-center text-[17px] font-semibold">
              {props.title}
            </h2>
            <span className="flex justify-end">{props.action}</span>
          </div>
        )}
        {props.children}
      </div>
    </div>
  );
}
