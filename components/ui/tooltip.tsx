"use client"

import * as React from "react"
import * as TooltipPrimitive from "@radix-ui/react-tooltip"

const TooltipProvider = TooltipPrimitive.Provider
const Tooltip = TooltipPrimitive.Root
const TooltipTrigger = TooltipPrimitive.Trigger

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 6, ...props }, ref) => (
  <TooltipPrimitive.Portal>
    <TooltipPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={className}
      style={{
        zIndex: 50,
        maxWidth: 260,
        borderRadius: 10,
        background: "rgba(18,16,13,0.95)",
        border: "1px solid rgba(201,146,42,0.25)",
        backdropFilter: "blur(8px)",
        padding: "10px 14px",
        fontSize: 13,
        lineHeight: 1.5,
        color: "rgba(240,222,180,0.92)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
        pointerEvents: "none",
      }}
      {...props}
    />
  </TooltipPrimitive.Portal>
))
TooltipContent.displayName = TooltipPrimitive.Content.displayName

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }
