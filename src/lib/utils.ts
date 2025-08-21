import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { $ZodIssue, $ZodError } from "zod/v4/core";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function formatZodIssue(i: $ZodIssue): string {
  return `${i.code} for field '${i.path.join(".")}', got '${i.input}'`;
}

export function formatZodError(e: $ZodError) {
  const issues = e.issues.length > 5 ? e.issues.slice(0, 5) : e.issues;
  return issues.map((i) => formatZodIssue(i)).join(", ");
}
