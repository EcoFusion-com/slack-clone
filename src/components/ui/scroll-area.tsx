import * as React from "react";
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area";

import { cn } from "@/lib/utils";

const ScrollArea = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Root>
>(({ className, children, ...props }, ref) => (
  <ScrollAreaPrimitive.Root ref={ref} className={cn("relative overflow-hidden", className)} {...props}>
    <ScrollAreaPrimitive.Viewport 
      className="h-full w-full rounded-[inherit] overscroll-contain"
      style={{ scrollbarWidth: 'thin' }}
    >
      {children}
    </ScrollAreaPrimitive.Viewport>
    <ScrollBar />
    <ScrollAreaPrimitive.Corner />
  </ScrollAreaPrimitive.Root>
));
ScrollArea.displayName = ScrollAreaPrimitive.Root.displayName;

const ScrollBar = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>,
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>
>(({ className, orientation = "vertical", ...props }, ref) => (
  <ScrollAreaPrimitive.ScrollAreaScrollbar
    ref={ref}
    orientation={orientation}
    className={cn(
      "flex touch-none select-none transition-colors duration-200",
      orientation === "vertical" && "h-full w-2.5 border-l border-l-transparent p-[1px]",
      orientation === "horizontal" && "h-2.5 flex-col border-t border-t-transparent p-[1px]",
      className,
    )}
    {...props}
  >
    <ScrollAreaPrimitive.ScrollAreaThumb className="relative flex-1 rounded-full bg-border hover:bg-border/80 transition-colors duration-200" />
  </ScrollAreaPrimitive.ScrollAreaScrollbar>
));
ScrollBar.displayName = ScrollAreaPrimitive.ScrollAreaScrollbar.displayName;

// Enhanced ScrollArea with auto-scroll functionality
interface AutoScrollAreaProps extends React.ComponentPropsWithoutRef<typeof ScrollArea> {
  autoScroll?: boolean;
  scrollToBottom?: boolean;
}

const AutoScrollArea = React.forwardRef<
  React.ElementRef<typeof ScrollArea>,
  AutoScrollAreaProps
>(({ className, children, autoScroll = false, scrollToBottom = false, ...props }, ref) => {
  const scrollToBottomFn = React.useCallback(() => {
    // Simple scroll to bottom using window.scrollTo
    requestAnimationFrame(() => {
      window.scrollTo({
        top: document.documentElement.scrollHeight,
        behavior: 'smooth'
      });
    });
  }, []);

  React.useEffect(() => {
    if (scrollToBottom) {
      scrollToBottomFn();
    }
  }, [scrollToBottom, scrollToBottomFn]);

  // Expose scrollToBottom function via ref
  React.useImperativeHandle(ref, () => ({
    scrollToBottom: scrollToBottomFn,
  }));

  return (
    <ScrollArea ref={ref} className={cn(className)} {...props}>
      {children}
    </ScrollArea>
  );
});
AutoScrollArea.displayName = "AutoScrollArea";

export { ScrollArea, ScrollBar, AutoScrollArea };
