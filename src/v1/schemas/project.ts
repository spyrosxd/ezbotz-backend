import z from "zod";

export const createProjectSchema = z.object({
  token: z
    .string()
    .regex(/^[\w-]{17,}\.[\w-]{6,}\.[\w-]{27,}$/, "Invalid token"),
});

