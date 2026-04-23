import * as React from "react";

import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-10 w-full min-w-0 rounded-[11px] border-none bg-light-gray/50 px-4 py-2 text-base transition-all outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-apple-blue/50 aria-invalid:ring-destructive/50 aria-invalid:ring-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:bg-near-black/50",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
