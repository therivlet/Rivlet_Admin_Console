import { WorkItem, WorkItemState } from './types';
import { ConfirmOptions } from '@/components/ui/ConfirmDialog';

export const isWorkItemClosed = (w: WorkItem): boolean =>
  w.state === 'Closed' || w.state === 'Resolved';

export interface PromptAndCascadeOptions {
  itemJustClosed: WorkItem;
  allWorkItems: WorkItem[];
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  saveWorkItem: (item: WorkItem) => Promise<void>;
  onItemUpdated?: (updatedItem: WorkItem) => void;
}

/**
 * Checks whether closing `itemJustClosed` causes all child items of its parent
 * to now be closed. If so, asks the user for confirmation to close the parent,
 * and if confirmed, cascades upwards through the hierarchy (Task -> Story -> Feature -> Epic).
 */
export async function promptAndCascadeParentClosure({
  itemJustClosed,
  allWorkItems,
  confirm,
  saveWorkItem,
  onItemUpdated,
}: PromptAndCascadeOptions): Promise<void> {
  if (!isWorkItemClosed(itemJustClosed)) return;

  let currentChild = itemJustClosed;
  // Maintain a live list copy so each level of cascade sees newly closed ancestors/siblings
  let currentItems = allWorkItems.map((w) => (w.id === itemJustClosed.id ? itemJustClosed : w));
  if (!currentItems.some((w) => w.id === itemJustClosed.id)) {
    currentItems = [itemJustClosed, ...currentItems];
  }

  while (currentChild.parentId) {
    const parent = currentItems.find((w) => w.id === currentChild.parentId);
    if (!parent) break;

    // If the parent is already closed, no need to ask or close it again
    if (isWorkItemClosed(parent)) break;

    // Find all children of this parent
    const siblings = currentItems.filter((w) => w.parentId === parent.id);
    if (siblings.length === 0) break;

    // Check if ALL children of this parent are now closed
    const allChildrenClosed = siblings.every((c) => isWorkItemClosed(c));
    if (!allChildrenClosed) {
      // Still some open siblings, do not prompt parent closure
      break;
    }

    // Determine specific prompt wording requested by user
    let promptTitle = 'Close Work Item?';
    let promptMessage = 'All child items are closed. Can we mark this item as closed?';
    let confirmLabel = 'Close';

    if (parent.type === 'User Story') {
      promptTitle = `Close Story "${parent.title}"?`;
      promptMessage = 'You have closed all the tasks inside the story. Can we mark the story as closed?';
      confirmLabel = 'Close Story';
    } else if (parent.type === 'Feature') {
      promptTitle = `Close Feature "${parent.title}"?`;
      promptMessage = 'All the user stories are closed. Can we move this feature to closed?';
      confirmLabel = 'Close Feature';
    } else if (parent.type === 'Epic') {
      promptTitle = `Close Epic "${parent.title}"?`;
      promptMessage = 'All features are closed. Can we move this epic to closed?';
      confirmLabel = 'Close Epic';
    }

    const userConfirmed = await confirm({
      title: promptTitle,
      message: promptMessage,
      confirmLabel,
      cancelLabel: 'Keep Open',
      danger: false,
    });

    if (!userConfirmed) {
      // User declined to close the parent, stop cascading
      break;
    }

    const now = new Date().toISOString();
    const updatedParent: WorkItem = {
      ...parent,
      state: 'Closed',
      completedDate: parent.completedDate || now.slice(0, 10),
      updatedAt: now,
    };

    await saveWorkItem(updatedParent);
    if (onItemUpdated) {
      onItemUpdated(updatedParent);
    }

    // Update currentItems for the next level up
    currentItems = currentItems.map((w) => (w.id === updatedParent.id ? updatedParent : w));
    currentChild = updatedParent;
  }
}
