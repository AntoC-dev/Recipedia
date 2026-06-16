/**
 * Tutorial - Step ordering helpers for the guided tour
 *
 * Single source of truth for tutorial step sequencing. The tour screens and
 * the tooltip navigation both derive next/previous/first/last from these
 * helpers (backed by {@link TUTORIAL_STEPS}) instead of the copilot library's
 * registered-step calculations, which only reflect steps already mounted.
 */

import { TUTORIAL_STEPS } from '@utils/Constants';

/** Configuration of a single tutorial step (order + screen name) */
export type TutorialStepConfig = (typeof TUTORIAL_STEPS)[keyof typeof TUTORIAL_STEPS];

/** Screen name of a tutorial step */
export type TutorialScreenName = TutorialStepConfig['name'];

/**
 * Tutorial screen whose spotlight target is measured at runtime and is only
 * correct once the screen is focused. It advances the copilot step itself once
 * its target is ready, so the tooltip must not advance the step when navigating
 * to it. Every other screen uses a stable proxy and is advanced by the tooltip.
 */
export const SELF_ADVANCING_TUTORIAL_SCREEN: TutorialScreenName = 'Search';

const orderedTutorialSteps: readonly TutorialStepConfig[] = Object.values(TUTORIAL_STEPS)
  .slice()
  .sort((a, b) => a.order - b.order);

/**
 * Whether the given order is the first tutorial step.
 *
 * @param order - Step order to check
 * @returns True when order matches the first step
 */
export function isFirstTutorialStep(order: number): boolean {
  return order === orderedTutorialSteps[0].order;
}

/**
 * Whether the given order is the last tutorial step.
 *
 * @param order - Step order to check
 * @returns True when order matches the last step
 */
export function isLastTutorialStep(order: number): boolean {
  return order === orderedTutorialSteps[orderedTutorialSteps.length - 1].order;
}

/**
 * Screen name of the tutorial step at the given order.
 *
 * @param order - Step order to resolve
 * @returns Screen name, or undefined when no step has that order
 */
export function getTutorialScreenByOrder(order: number): TutorialScreenName | undefined {
  return orderedTutorialSteps.find(step => step.order === order)?.name;
}

/**
 * Screen name of the step following the given order.
 *
 * @param order - Current step order
 * @returns Next screen name, or undefined when already on the last step
 */
export function getNextTutorialScreen(order: number): TutorialScreenName | undefined {
  return getTutorialScreenByOrder(order + 1);
}

/**
 * Screen name of the step preceding the given order.
 *
 * @param order - Current step order
 * @returns Previous screen name, or undefined when already on the first step
 */
export function getPreviousTutorialScreen(order: number): TutorialScreenName | undefined {
  return getTutorialScreenByOrder(order - 1);
}
