import type * as React from "react";

import { cn } from "@/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex min-h-[80px] w-full rounded-[11px] border-none bg-light-gray/50 px-4 py-2 text-base transition-all outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-apple-blue/50 aria-invalid:ring-destructive/50 aria-invalid:ring-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:bg-near-black/50",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
