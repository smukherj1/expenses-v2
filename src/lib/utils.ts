import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { ZodIssue } from "zod-validation-error";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
