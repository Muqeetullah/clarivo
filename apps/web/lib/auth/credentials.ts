import { z } from "zod";
export const emailSchema = z
  .string()
  .trim()
  .pipe(z.email("Enter a valid email address."));
export const loginSchema = z.object({
  name: z.string(),
  email: emailSchema,
  password: z.string().min(1, "Enter your password."),
});
export const signupSchema = loginSchema.extend({
  name: z
    .string()
    .trim()
    .min(1, "Enter your name.")
    .max(100, "Use 100 characters or fewer."),
  password: z
    .string()
    .min(8, "Use between 8 and 128 characters.")
    .max(128, "Use between 8 and 128 characters."),
});
export type Credentials = z.infer<typeof loginSchema>;
