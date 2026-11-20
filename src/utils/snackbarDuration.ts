/**
 * Snackbar display durations, shared by every snackbar in the app.
 *
 * Production follows Material Design (4 s for a plain message, longer when the
 * snackbar carries an action such as Undo). Maestro builds keep every snackbar up
 * longer so slow CI devices can still assert and tap it.
 *
 * @module snackbarDuration
 */

import { animationsDisabled } from '@utils/Constants';

/** Display durations in milliseconds, per snackbar kind. */
export interface SnackbarDurations {
  /** Snackbar with a message only */
  message: number;
  /** Snackbar carrying an action button (e.g. Undo) */
  action: number;
}

const productionDurations: SnackbarDurations = { message: 4000, action: 7000 };
const automationDurations: SnackbarDurations = { message: 10000, action: 10000 };

/**
 * Picks the snackbar durations for a build.
 *
 * @param isAutomationBuild - Whether the build is driven by Maestro (every Maestro
 *   profile disables animations, see `animationsDisabled`)
 * @returns Longer durations for Maestro builds, Material Design durations otherwise
 */
export function snackbarDurationsFor(isAutomationBuild: boolean): SnackbarDurations {
  return isAutomationBuild ? automationDurations : productionDurations;
}

const buildDurations = snackbarDurationsFor(animationsDisabled);

/**
 * How long a snackbar stays on screen in the current build.
 *
 * @param hasAction - Whether the snackbar shows an action button
 * @returns Duration in milliseconds
 */
export function snackbarDuration(hasAction: boolean): number {
  return hasAction ? buildDurations.action : buildDurations.message;
}
