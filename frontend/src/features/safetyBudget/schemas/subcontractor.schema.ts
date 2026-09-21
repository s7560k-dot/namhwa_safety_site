import { z } from 'zod';

export const SubcontractorSchema = z.object({
    id: z.string().min(1),
    projectId: z.string().min(1),
    name: z.string().min(1),
    allocatedSafetyBudget: z.number().nonnegative(),
});

export type Subcontractor = z.infer<typeof SubcontractorSchema>;
