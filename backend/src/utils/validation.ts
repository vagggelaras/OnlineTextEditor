import { z } from "zod/v4";

export const registerSchema = z.object({
  email: z.email(),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().min(1, "Name is required"),
});

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1, "Password is required"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

// Chart schemas
const chartTypes = ["bar", "line", "pie", "doughnut", "radar", "polarArea"] as const;

export const createChartSchema = z.object({
  type: z.enum(chartTypes),
  config: z.record(z.string(), z.unknown()).default({}),
  data: z.object({
    labels: z.array(z.string()),
    datasets: z.array(
      z.object({
        label: z.string(),
        data: z.array(z.number()),
        backgroundColor: z.union([z.string(), z.array(z.string())]).optional(),
        borderColor: z.union([z.string(), z.array(z.string())]).optional(),
        borderWidth: z.number().optional(),
      })
    ),
  }),
});

export const updateChartSchema = z.object({
  type: z.enum(chartTypes).optional(),
  config: z.record(z.string(), z.unknown()).optional(),
  data: z
    .object({
      labels: z.array(z.string()),
      datasets: z.array(
        z.object({
          label: z.string(),
          data: z.array(z.number()),
          backgroundColor: z.union([z.string(), z.array(z.string())]).optional(),
          borderColor: z.union([z.string(), z.array(z.string())]).optional(),
          borderWidth: z.number().optional(),
        })
      ),
    })
    .optional(),
});

export type CreateChartInput = z.infer<typeof createChartSchema>;
export type UpdateChartInput = z.infer<typeof updateChartSchema>;
