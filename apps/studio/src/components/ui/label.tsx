import * as LabelPrimitive from "@radix-ui/react-label";
import React from "react";

import { cn } from "@/lib/utils";

export const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn("text-sm font-medium text-studio-text", className)}
    {...props}
  />
));
Label.displayName = "Label";
