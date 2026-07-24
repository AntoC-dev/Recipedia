/**
 * Minimal ambient typings for React's `scheduler` package.
 *
 * `scheduler` ships no types and no `@types/scheduler` is installed; only the
 * idle-priority scheduling surface consumed by `src/utils/idle.ts` is declared
 * here. See https://github.com/facebook/react/tree/main/packages/scheduler.
 */
declare module 'scheduler' {
  export type PriorityLevel = number;

  export const unstable_ImmediatePriority: PriorityLevel;
  export const unstable_UserBlockingPriority: PriorityLevel;
  export const unstable_NormalPriority: PriorityLevel;
  export const unstable_LowPriority: PriorityLevel;
  export const unstable_IdlePriority: PriorityLevel;

  export interface CallbackNode {
    readonly __brand: 'SchedulerCallbackNode';
  }

  export function unstable_scheduleCallback(
    priorityLevel: PriorityLevel,
    callback: (didTimeout: boolean) => void,
    options?: { delay?: number }
  ): CallbackNode;

  export function unstable_cancelCallback(node: CallbackNode): void;
}
