import { WorkItem, WorkItemState } from './types';
import { ConfirmOptions } from '@/components/ui/ConfirmDialog';

export const isWorkItemClosed = (w: WorkItem): boolean =>
  w.state === 'Closed' || w.state === 'Resolved';

export interface WorkflowSyncOptions {
  updatedItem: WorkItem;
  allWorkItems: WorkItem[];
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  saveWorkItem: (item: WorkItem) => Promise<void>;
  onItemUpdated?: (updatedItem: WorkItem) => void;
}

// Alias for backwards-compatibility
export type PromptAndCascadeOptions = WorkflowSyncOptions & {
  itemJustClosed?: WorkItem;
};

/**
 * Manages the hierarchical workflow state (Task -> User Story -> Feature -> Epic):
 * - If all tasks stay in New, the story moves to New.
 * - If any task moves to Active, make the status Active.
 * - If any task moves to Review, change the status to In Review.
 * - If all tasks move to Closed, prompt user to close the parent and cascade upwards.
 */
export async function syncParentWorkflowHierarchy({
  updatedItem,
  allWorkItems,
  confirm,
  saveWorkItem,
  onItemUpdated,
}: WorkflowSyncOptions): Promise<void> {
  let currentChild = updatedItem;
  let currentItems = allWorkItems.map((w) => (w.id === updatedItem.id ? updatedItem : w));
  if (!currentItems.some((w) => w.id === updatedItem.id)) {
    currentItems = [updatedItem, ...currentItems];
  }

  while (currentChild.parentId) {
    const parent = currentItems.find((w) => w.id === currentChild.parentId);
    if (!parent) break;

    const children = currentItems.filter((w) => w.parentId === parent.id);
    if (children.length === 0) break;

    const allNew = children.every((c) => c.state === 'New');
    const allClosed = children.every((c) => isWorkItemClosed(c));
    const anyActive = children.some((c) => c.state === 'Active');
    const anyReview = children.some((c) => c.state === 'In Review');

    // Rule 1: If all the tasks stay in New, then the story has to be in New.
    if (allNew) {
      if (parent.state !== 'New') {
        const now = new Date().toISOString();
        const updatedParent: WorkItem = {
          ...parent,
          state: 'New',
          updatedAt: now,
        };
        await saveWorkItem(updatedParent);
        onItemUpdated?.(updatedParent);
        currentItems = currentItems.map((w) => (w.id === updatedParent.id ? updatedParent : w));
        currentChild = updatedParent;
        continue;
      }
      break;
    }

    // Rule 4: If all of them move to Close, then prompt to Close the parent.
    if (allClosed) {
      if (!isWorkItemClosed(parent)) {
        let promptTitle = `Close ${parent.type}?`;
        let promptMessage = `All ${children[0]?.type || 'child'}s are closed. Can we mark the ${parent.type.toLowerCase()} as closed?`;
        let confirmLabel = `Close ${parent.type}`;

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

        if (userConfirmed) {
          const now = new Date().toISOString();
          const updatedParent: WorkItem = {
            ...parent,
            state: 'Closed',
            completedDate: parent.completedDate || now.slice(0, 10),
            updatedAt: now,
          };
          await saveWorkItem(updatedParent);
          onItemUpdated?.(updatedParent);
          currentItems = currentItems.map((w) => (w.id === updatedParent.id ? updatedParent : w));
          currentChild = updatedParent;
          continue;
        }
      }
      break;
    }

    // Rule 3: If any one moves to Review, then change it to Review.
    if (currentChild.state === 'In Review' || (anyReview && !anyActive && parent.state !== 'In Review')) {
      if (parent.state !== 'In Review' && !isWorkItemClosed(parent)) {
        const now = new Date().toISOString();
        const updatedParent: WorkItem = {
          ...parent,
          state: 'In Review',
          assignee: parent.assignee || currentChild.assignee,
          updatedAt: now,
        };
        await saveWorkItem(updatedParent);
        onItemUpdated?.(updatedParent);
        currentItems = currentItems.map((w) => (w.id === updatedParent.id ? updatedParent : w));
        currentChild = updatedParent;
        continue;
      }
    }

    // Rule 2: If any task moves to Active, then make the status Active.
    if (currentChild.state === 'Active' || anyActive) {
      if (parent.state !== 'Active' && !isWorkItemClosed(parent)) {
        const now = new Date().toISOString();
        const updatedParent: WorkItem = {
          ...parent,
          state: 'Active',
          assignee: parent.assignee || currentChild.assignee,
          updatedAt: now,
        };
        await saveWorkItem(updatedParent);
        onItemUpdated?.(updatedParent);
        currentItems = currentItems.map((w) => (w.id === updatedParent.id ? updatedParent : w));
        currentChild = updatedParent;
        continue;
      }
    }

    break;
  }
}

/**
 * Backward compatibility alias so existing calls work seamlessly.
 */
export async function promptAndCascadeParentClosure(options: {
  itemJustClosed?: WorkItem;
  updatedItem?: WorkItem;
  allWorkItems: WorkItem[];
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  saveWorkItem: (item: WorkItem) => Promise<void>;
  onItemUpdated?: (updatedItem: WorkItem) => void;
}): Promise<void> {
  const target = options.updatedItem || options.itemJustClosed;
  if (!target) return;
  return syncParentWorkflowHierarchy({
    ...options,
    updatedItem: target,
  });
}
