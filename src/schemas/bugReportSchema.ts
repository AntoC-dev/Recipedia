/**
 * bugReportSchema - Zod validation schema for the bug report form
 */

import { z } from 'zod';

export const bugReportSchema = z.object({
  description: z.string().trim().min(1, 'bugReport.descriptionRequired'),
  screenshots: z.array(z.string()).default([]),
});

/**
 * Output type inferred from the bug report schema (post-transform).
 * Use for the validated submit handler — `screenshots` is always `string[]`.
 */
export type BugReportFormData = z.infer<typeof bugReportSchema>;

/**
 * Input type inferred from the bug report schema (pre-transform).
 * Use for `useForm` field values — `screenshots` is `string[] | undefined`
 * because the schema supplies a default.
 */
export type BugReportFormInput = z.input<typeof bugReportSchema>;
