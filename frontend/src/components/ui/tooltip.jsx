import * as React from "react"
import * as TooltipPrimitive from "@radix-ui/react-tooltip"

import { cn } from "@/lib/utils"

const TooltipProvider = TooltipPrimitive.Provider

const Tooltip = TooltipPrimitive.Root

const TooltipTrigger = TooltipPrimitive.Trigger

const TooltipArrow = React.forwardRef(({ className, ...props }, ref) => (
    <TooltipPrimitive.Arrow
        ref={ref}
        className={cn("fill-zinc-950", className)}
        {...props}
    />
))
TooltipArrow.displayName = "TooltipArrow"

const TooltipContent = React.forwardRef(({ className, sideOffset = 4, children, ...props }, ref) => (
    <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content
            ref={ref}
            sideOffset={sideOffset}
            className={cn(
                "z-[9999] overflow-visible rounded-md border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-sm text-zinc-50 shadow-md",
                "data-[state=delayed-open]:animate-in data-[state=delayed-open]:fade-in-0 data-[state=delayed-open]:zoom-in-95",
                "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
                "data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
                "duration-75",
                className
            )}
            {...props}
        >
            {children}
            <TooltipPrimitive.Arrow className="fill-zinc-950" />
        </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
))
TooltipContent.displayName = TooltipPrimitive.Content.displayName

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider, TooltipArrow }
