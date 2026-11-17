"use client";

import { Ellipsis, PencilLine } from "lucide-react";
import { useState } from "react";

import { BulkProgressBar } from "@/src/app/components/common/bulk-progress-bar";
import { IconButton } from "@/src/app/components/common/icon-button";
import { TextButton } from "@/src/app/components/common/text-button";
import { UndoToast } from "@/src/app/components/common/undo-toast";
import { BulkCategorySheet } from "@/src/app/components/list-detail/bulk-category-sheet";
import { BulkTagSheet } from "@/src/app/components/list-detail/bulk-tag-sheet";
import { CategorySheet } from "@/src/app/components/list-detail/category-sheet";
import { DetailHeader } from "@/src/app/components/list-detail/detail-header";
import { EditView } from "@/src/app/components/list-detail/edit-view";
import { ItemEditSheet } from "@/src/app/components/list-detail/item-edit-sheet";
import { ListMenuSheet } from "@/src/app/components/list-detail/list-menu-sheet";
import { PrepareView } from "@/src/app/components/list-detail/prepare-view";
import { RenameSheet } from "@/src/app/components/list-detail/rename-sheet";
import { SelectionBar } from "@/src/app/components/list-detail/selection-bar";
import { TagSheet } from "@/src/app/components/list-detail/tag-sheet";
import { APP_PATH, LIST_SECTION } from "@/src/app/enums/app-path";
import { DETAIL_MODE, type DetailMode } from "@/src/app/enums/detail-mode";
import { DETAIL_SHEET, type DetailSheet } from "@/src/app/enums/detail-sheet";
import { useCategory } from "@/src/app/hooks/use-category";
import { useCheckState } from "@/src/app/hooks/use-check-state";
import { useDetailFeedback } from "@/src/app/hooks/use-detail-feedback";
import { useItemEdit } from "@/src/app/hooks/use-item-edit";
import { useTag } from "@/src/app/hooks/use-tag";
import { useTagFilter } from "@/src/app/hooks/use-tag-filter";
import type { CheckListDetail } from "@/src/app/models/check-list-detail";
import { buildListPath } from "@/src/app/utils/list-path-utils";
import { cn } from "@/src/lib/shadcn/utils";

/**
 * チェックリスト詳細画面の本体（S-05）。準備モードと編集モードを切り替える
 * @param props - プロパティ
 * @returns 詳細画面
 */
export function ListDetailBody(props: {
  /** 読み込み済みのチェックリスト詳細 */
  detail: CheckListDetail;
}) {
  const { detail } = props;
  const { checkList, tags, items } = detail;
  const feedback = useDetailFeedback();
  const tagFilter = useTagFilter();
  const state = useCheckState(detail, feedback, tagFilter);
  const edit = useItemEdit(detail, feedback);
  const category = useCategory(detail, feedback);
  const tag = useTag(detail, feedback, tagFilter);
  const [mode, setMode] = useState<DetailMode>(DETAIL_MODE.PREPARE);
  const [sheet, setSheet] = useState<DetailSheet | null>(null);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [autoFocusCategoryId, setAutoFocusCategoryId] = useState<string | null>(
    null,
  );

  const isBusy = feedback.isPending || feedback.bulkProgress !== null;
  const isEditing = mode === DETAIL_MODE.EDIT;
  const hasSelection = isEditing && edit.selectedItemIds.length > 0;
  const editingItem = items.find((item) => item.id === editingItemId) ?? null;

  const startEditing = () => {
    edit.clearSelection();
    setMode(DETAIL_MODE.EDIT);
  };

  const startAdding = () => {
    startEditing();
    setAutoFocusCategoryId(category.sortedCategories[0]?.id ?? null);
  };

  const finishEditing = () => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    setMode(DETAIL_MODE.PREPARE);
    edit.clearSelection();
    setAutoFocusCategoryId(null);
  };

  const closeSheet = () => setSheet(null);

  return (
    <div className="-mx-4 md:mx-0">
      <div className="mx-auto max-w-160">
        {isEditing ? (
          <DetailHeader
            title={checkList.name}
            isTinted
            leading={
              <TextButton onClick={edit.toggleAllSelected}>
                {edit.isAllSelected ? "選択を解除" : "すべて選択"}
              </TextButton>
            }
            center={
              <span className="inline-flex items-center gap-1 text-[13px] font-semibold text-muted-foreground">
                <PencilLine className="size-3.5" />
                編集中
              </span>
            }
            eyebrow={
              <span className="text-[13px] text-muted-foreground tabular-nums">
                {edit.itemCount}件
              </span>
            }
            actions={
              <TextButton isStrong onClick={finishEditing}>
                完了
              </TextButton>
            }
          />
        ) : (
          <DetailHeader
            title={checkList.name}
            backHref={APP_PATH.LISTS}
            center={
              <button
                type="button"
                className={cn(
                  "truncate text-[13px] font-semibold tabular-nums",
                  state.isAllDone ? "text-brand-text" : "text-muted-foreground",
                )}
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              >
                {state.isFiltered &&
                  `${state.selectedTagNames.join("・")}で絞り込み中・`}
                {state.isAllDone ? "準備完了" : `残り${state.remainingCount}件`}
              </button>
            }
            actions={
              <>
                <TextButton onClick={startEditing}>編集</TextButton>
                <IconButton
                  label="チェックリストの操作"
                  onClick={() => setSheet(DETAIL_SHEET.MENU)}
                >
                  <Ellipsis className="text-brand-text" />
                </IconButton>
              </>
            }
          />
        )}

        <div className="flex flex-col gap-5 px-5 pt-1 pb-32">
          {feedback.bulkProgress && (
            <BulkProgressBar
              label={feedback.bulkProgress.label}
              progress={feedback.bulkProgress.progress}
            />
          )}
          {isEditing ? (
            <EditView
              groups={edit.groups}
              selectedItemIds={edit.selectedItemIds}
              highlightedItemId={edit.highlightedItemId}
              autoFocusCategoryId={autoFocusCategoryId}
              getTagLabel={edit.getTagLabel}
              onToggleSelected={edit.toggleSelected}
              onOpenItem={setEditingItemId}
              onOpenCategories={() => setSheet(DETAIL_SHEET.CATEGORIES)}
              onOpenTags={() => setSheet(DETAIL_SHEET.TAGS)}
              onAddItem={edit.addItem}
            />
          ) : (
            <PrepareView
              isFiltered={state.isFiltered}
              isDisabled={isBusy}
              tags={tags}
              selectedTagIds={tagFilter.selectedTagIds}
              selectedTagNames={state.selectedTagNames}
              onToggleTag={tagFilter.toggleTag}
              onClearTags={tagFilter.clearTags}
              durationDays={checkList.durationDays}
              onStepDays={(delta) => void state.stepDurationDays(delta)}
              onCommitDays={state.changeDurationDays}
              groups={state.groups}
              isEmpty={items.length === 0}
              isAllDone={state.isAllDone}
              checkedCount={state.checkedCount}
              resetLabel={state.resetLabel}
              onReset={() => void state.resetAll()}
              onStartAdding={startAdding}
              getRequiredQuantity={state.getRequiredQuantity}
              getTagLabel={state.getTagLabel}
              onToggleChecked={(item) => void state.toggleChecked(item)}
            />
          )}
        </div>
      </div>

      {hasSelection && (
        <SelectionBar
          selectedCount={edit.selectedItemIds.length}
          isDisabled={isBusy}
          onMoveToCategory={() => setSheet(DETAIL_SHEET.BULK_CATEGORY)}
          onEditTags={() => setSheet(DETAIL_SHEET.BULK_TAGS)}
          onDelete={() => void edit.removeItems(edit.selectedItems)}
        />
      )}

      <UndoToast
        toast={feedback.toast}
        errorMessage={feedback.errorMessage}
        onDismissError={feedback.clearError}
        isLifted={hasSelection}
      />

      {sheet === DETAIL_SHEET.MENU && (
        <ListMenuSheet
          resetLabel={state.resetLabel}
          canReset={state.checkedCount > 0}
          csvHref={buildListPath(checkList.id, LIST_SECTION.CSV)}
          onRename={() => setSheet(DETAIL_SHEET.RENAME)}
          onReset={() => {
            closeSheet();
            void state.resetAll();
          }}
          onClose={closeSheet}
        />
      )}
      {sheet === DETAIL_SHEET.RENAME && (
        <RenameSheet
          name={checkList.name}
          isDisabled={isBusy}
          onSave={state.renameList}
          onClose={closeSheet}
        />
      )}
      {editingItem && (
        <ItemEditSheet
          item={editingItem}
          categories={category.sortedCategories}
          tags={tags}
          attachedTagIds={edit.getAttachedTagIds(editingItem)}
          isDisabled={isBusy}
          {...edit.getOrderBounds(editingItem)}
          onRename={(name) => edit.renameItem(editingItem, name)}
          onChangeQuantity={(text) => edit.changeQuantity(editingItem, text)}
          onMoveToCategory={(target) => void edit.moveItem(editingItem, target)}
          onToggleTag={(tagId) => void edit.toggleItemTag(editingItem, tagId)}
          onReorder={(delta) => void edit.reorderItem(editingItem, delta)}
          onDelete={() => {
            setEditingItemId(null);
            void edit.removeItems([editingItem]);
          }}
          onClose={() => setEditingItemId(null)}
        />
      )}
      {sheet === DETAIL_SHEET.CATEGORIES && (
        <CategorySheet
          categories={category.sortedCategories}
          blocked={category.blocked}
          isDisabled={isBusy}
          onRename={category.rename}
          onMove={(target, direction) => void category.move(target, direction)}
          onRemove={(target) => void category.remove(target)}
          onAdd={category.add}
          onCloseBlocked={category.closeBlocked}
          onClose={() => {
            category.closeBlocked();
            closeSheet();
          }}
        />
      )}
      {sheet === DETAIL_SHEET.TAGS && (
        <TagSheet
          tags={tag.tags}
          blocked={tag.blocked}
          isDisabled={isBusy}
          onRename={tag.rename}
          onRemove={(target) => void tag.remove(target)}
          onAdd={tag.add}
          onCloseBlocked={tag.closeBlocked}
          onClose={() => {
            tag.closeBlocked();
            closeSheet();
          }}
        />
      )}
      {sheet === DETAIL_SHEET.BULK_TAGS && (
        <BulkTagSheet
          selectedCount={edit.selectedItemIds.length}
          tags={tags}
          isDisabled={isBusy}
          isAttachedToAll={edit.isTagAttachedToAllSelected}
          onToggle={(target) => void edit.toggleSelectedTag(target)}
          onClose={closeSheet}
        />
      )}
      {sheet === DETAIL_SHEET.BULK_CATEGORY && (
        <BulkCategorySheet
          selectedCount={edit.selectedItemIds.length}
          categories={category.sortedCategories}
          onSelect={(target) => {
            closeSheet();
            void edit.moveSelectedToCategory(target);
          }}
          onClose={closeSheet}
        />
      )}
    </div>
  );
}
