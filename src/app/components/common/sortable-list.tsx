"use client";

import {
  type Announcements,
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  type Modifier,
  PointerSensor,
  type ScreenReaderInstructions,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

/**
 * ドラッグ中の要素を縦方向にだけ動かす
 * @param args - ドラッグ中の移動量を含む引数
 * @returns 横方向の移動を0にした移動量
 */
const restrictToVerticalAxis: Modifier = (args) => ({
  ...args.transform,
  x: 0,
});

/** キーボードで並べ替えるときの操作説明（読み上げ用） */
const SCREEN_READER_INSTRUCTIONS: ScreenReaderInstructions = {
  draggable:
    "並べ替えるには、スペースキーでつかみ、矢印キーで動かし、もう一度スペースキーで置きます。Escapeキーで取り消します。",
};

/**
 * ドラッグで並べ替えられる縦1列の並び（縦方向にだけ動かせる）。子の要素は SortableRow で items の各IDを登録する
 * @param props - プロパティ
 * @returns 並べ替えられる並び
 */
export function SortableList(props: {
  /** 並んでいる要素のIDと名前（表示順。名前は読み上げに使う） */
  items: { id: string; name: string }[];
  /** 要素を別の要素の位置へ動かしたとき */
  onMove: (id: string, targetId: string) => void;
  /** 要素 */
  children: React.ReactNode;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );
  const nameOf = (id: string | number): string =>
    props.items.find((item) => item.id === String(id))?.name ?? "";
  const announcements: Announcements = {
    onDragStart: ({ active }) => `${nameOf(active.id)}をつかみました。`,
    onDragOver: ({ active, over }) =>
      over && over.id !== active.id
        ? `${nameOf(active.id)}を${nameOf(over.id)}の位置へ動かしています。`
        : undefined,
    onDragEnd: ({ active, over }) =>
      over && over.id !== active.id
        ? `${nameOf(active.id)}を${nameOf(over.id)}の位置へ動かしました。`
        : `${nameOf(active.id)}を元の位置に置きました。`,
    onDragCancel: ({ active }) =>
      `${nameOf(active.id)}の並べ替えを取り消しました。`,
  };
  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (over && active.id !== over.id) {
      props.onMove(String(active.id), String(over.id));
    }
  };
  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      accessibility={{
        announcements,
        screenReaderInstructions: SCREEN_READER_INSTRUCTIONS,
      }}
      modifiers={[restrictToVerticalAxis]}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={props.items.map((item) => item.id)}
        strategy={verticalListSortingStrategy}
      >
        {props.children}
      </SortableContext>
    </DndContext>
  );
}
