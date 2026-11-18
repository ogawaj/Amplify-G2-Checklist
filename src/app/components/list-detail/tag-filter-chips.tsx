import { Check } from "lucide-react";

import { Chip } from "@/src/app/components/common/chip";
import type { Tag } from "@/src/app/models/tag";
import type { TagVisibility } from "@/src/app/models/tag-visibility";

/**
 * タグの絞り込みチップ（［タグなし］と各タグ。選択中は✓付き、画面幅に収まらない分は折り返す）
 * @param props - プロパティ
 * @returns 絞り込みチップの並び
 */
export function TagFilterChips(props: {
  /** 絞り込みに選べるタグ */
  tags: Tag[];
  /** 表示から外しているタグとタグなし */
  visibility: TagVisibility;
  /** タグの選択・解除 */
  onToggleTag: (tagId: string) => void;
  /** タグなしの選択・解除 */
  onToggleUntagged: () => void;
}) {
  const isUntaggedOn = !props.visibility.isUntaggedHidden;
  return (
    <div className="flex flex-wrap items-center gap-x-1.5 gap-y-4 py-1">
      <Chip isSmall isOn={isUntaggedOn} onClick={props.onToggleUntagged}>
        {isUntaggedOn && <Check className="size-3" strokeWidth={3} />}
        タグなし
      </Chip>
      {props.tags.map((tag) => {
        const isOn = !props.visibility.hiddenTagIds.includes(tag.id);
        return (
          <Chip
            key={tag.id}
            isSmall
            isOn={isOn}
            onClick={() => props.onToggleTag(tag.id)}
          >
            {isOn && <Check className="size-3" strokeWidth={3} />}
            {tag.name}
          </Chip>
        );
      })}
    </div>
  );
}
