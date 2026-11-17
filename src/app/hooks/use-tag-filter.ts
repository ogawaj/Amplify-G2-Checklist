"use client";

import { useCallback, useState } from "react";

/**
 * 絞り込みに使うタグの選択状態を管理するフック
 * @returns selectedTagIds・toggleTag・clearTags・replaceTags
 */
export const useTagFilter = () => {
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);

  const toggleTag = useCallback((tagId: string) => {
    setSelectedTagIds((current) =>
      current.includes(tagId)
        ? current.filter((id) => id !== tagId)
        : [...current, tagId],
    );
  }, []);

  const clearTags = useCallback(() => setSelectedTagIds([]), []);

  return {
    selectedTagIds,
    toggleTag,
    clearTags,
    replaceTags: setSelectedTagIds,
  };
};
