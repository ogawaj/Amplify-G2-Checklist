"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";

import { cn } from "@/src/lib/shadcn/utils";

/**
 * ドラッグで並べ替えられる1要素。つまみ（≡）を押さえて動かす。SortableList の中に置く
 * @param props - プロパティ
 * @returns 並べ替えられる要素
 */
export function SortableRow(props: {
  /** 要素のID（SortableList の items に含まれるもの） */
  id: string;
  /** 読み上げに使う要素の名前 */
  name: string;
  /** 並べ替えを受け付けない状態か（処理中） */
  isDisabled: boolean;
  /** 要素の外枠に付けるクラス */
  className?: string;
  /** 中身。引数のつまみを好きな位置に置く */
  children: (handle: React.ReactNode) => React.ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: props.id, disabled: props.isDisabled });
  const handle = (
    <button
      type="button"
      ref={setActivatorNodeRef}
      aria-label={`${props.name}を並べ替え`}
      className="grid h-11 w-10 shrink-0 cursor-grab touch-none place-items-center text-subtle disabled:opacity-25"
      disabled={props.isDisabled}
      {...attributes}
      {...listeners}
    >
      <GripVertical className="size-5" />
    </button>
  );
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "relative",
        isDragging && "z-10 rounded-lg bg-background shadow-md",
        props.className,
      )}
    >
      {props.children(handle)}
    </div>
  );
}
