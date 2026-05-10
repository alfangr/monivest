"use client";

import { motion, HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

export function Skeleton({ className, ...props }: HTMLMotionProps<"div">) {
  return (
    <motion.div
      initial={{ opacity: 0.5 }}
      animate={{ opacity: [0.5, 1, 0.5] }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: "easeInOut",
      }}
      className={cn("rounded-md bg-gray-200", className)}
      {...props}
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="border-0 shadow-lg rounded-xl">
      <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 rounded-t-xl">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-10 rounded-lg" />
        </div>
      </div>
      <div className="p-6">
        <Skeleton className="h-8 w-32" />
      </div>
    </div>
  );
}

export function SkeletonChart() {
  return (
    <div className="border-0 shadow-lg rounded-xl">
      <div className="px-6 py-4 border-b border-gray-100">
        <Skeleton className="h-5 w-32" />
      </div>
      <div className="p-6">
        <Skeleton className="h-80 w-full rounded-lg" />
      </div>
    </div>
  );
}

export function SkeletonInvestmentItem() {
  return (
    <div className="flex items-center justify-between p-5 rounded-xl border border-gray-200 bg-white">
      <div className="flex-1 space-y-2">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-20" />
      </div>
      <div className="text-right space-y-2">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-4 w-16" />
      </div>
    </div>
  );
}

export function SkeletonInvestmentList() {
  return (
    <div className="space-y-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <SkeletonInvestmentItem key={i} />
      ))}
    </div>
  );
}
