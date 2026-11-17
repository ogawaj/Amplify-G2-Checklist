"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { UndoToastContent } from "@/src/app/models/undo-toast-content";

/** ［元に戻す］付きの通知を出しておく時間（ミリ秒）。慌ただしい場面でも押せるよう長めにする */
const UNDO_TOAST_MS = 7000;

/** 通常の通知を出しておく時間（ミリ秒） */
const NOTICE_TOAST_MS = 1600;

/**
 * 画面下部の通知を管理するフック
 *
 * ［元に戻す］付きの通知が出ている間は、通常の通知で上書きしない。
 * 新しい［元に戻す］付きの通知を出すと、それまでの取り消しは確定して押せなくなる。
 * @returns toast・notify・notifyUndoable
 */
export const useUndoToast = () => {
  const [toast, setToast] = useState<UndoToastContent | null>(null);
  const isUndoShownRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback((content: UndoToastContent, durationMs: number) => {
    if (timerRef.current !== null) clearTimeout(timerRef.current);
    isUndoShownRef.current = content.undo !== undefined;
    setToast(content);
    timerRef.current = setTimeout(() => {
      isUndoShownRef.current = false;
      setToast(null);
    }, durationMs);
  }, []);

  useEffect(
    () => () => {
      if (timerRef.current !== null) clearTimeout(timerRef.current);
    },
    [],
  );

  const notify = useCallback(
    (message: string) => {
      if (isUndoShownRef.current) return;
      show({ message }, NOTICE_TOAST_MS);
    },
    [show],
  );

  const notifyUndoable = useCallback(
    (message: string, undo: () => void) => {
      show(
        {
          message,
          undo: () => {
            if (timerRef.current !== null) clearTimeout(timerRef.current);
            isUndoShownRef.current = false;
            setToast(null);
            undo();
          },
        },
        UNDO_TOAST_MS,
      );
    },
    [show],
  );

  return { toast, notify, notifyUndoable };
};
