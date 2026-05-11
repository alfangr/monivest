import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function calculateAutoValue(
  initialAmount: number,
  returnRate: number,
  startDate: string,
  returnType: "monthly" | "annual" = "annual",
  taxRate: number = 20
): number {
  const start = new Date(startDate);
  const now = new Date();
  
  const yearsDiff = (now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 365);
  const taxMultiplier = 1 - (taxRate / 100);
  
  if (returnType === "annual") {
    const annualRate = returnRate / 100;
    const netAnnualRate = annualRate * taxMultiplier;
    return initialAmount * Math.pow(1 + netAnnualRate, yearsDiff);
  } else {
    const monthlyRate = returnRate / 100;
    const netMonthlyRate = monthlyRate * taxMultiplier;
    const monthsDiff = yearsDiff * 12;
    return initialAmount * Math.pow(1 + netMonthlyRate, monthsDiff);
  }
}

export function calculateMonthsDiff(startDate: string): number {
  const start = new Date(startDate);
  const now = new Date();
  return (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
}
