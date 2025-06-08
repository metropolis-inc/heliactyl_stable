import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority";

import { cn } from "~/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 relative",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-t from-[#0369a1] to-[#0284c7] text-[#eceaff] ring-2 ring-[#080a0b] ring-opacity-0 ring-offset-2 hover:ring-opacity-100 hover:ring-[#0369a1] ",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90 ring-2 ring-[#080a0b] ring-opacity-0 ring-offset-2 hover:ring-opacity-100 hover:ring-[#ef4444] ",
        outline:
          "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground ring-2 ring-[#080a0b] ring-opacity-0 ring-offset-2 hover:ring-opacity-100 hover:ring-[#373c47] ",
        secondary:
          "bg-[#373c47] text-white shadow-sm hover:bg-[#2d303b] ring-2 ring-[#080a0b] ring-opacity-0 ring-offset-2 hover:ring-opacity-100 hover:ring-[#373c47] ",
        ghost: 
          "hover:bg-accent hover:text-accent-foreground ring-2 ring-[#080a0b] ring-opacity-0 ring-offset-2 hover:ring-opacity-100 hover:ring-[#373c47] ",
        link: 
          "text-primary underline-offset-4 hover:underline ring-2 ring-[#080a0b] ring-opacity-0 ring-offset-2 hover:ring-opacity-100 hover:ring-[#373c47] ",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

// Hook to detect background color behind element
const useBackgroundColor = (ref) => {
  const [bgColor, setBgColor] = React.useState('#080a0b');

  React.useEffect(() => {
    if (!ref.current) return;

    const detectBackgroundColor = () => {
      const element = ref.current;
      const rect = element.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      // Temporarily hide the button to detect what's behind it
      const originalVisibility = element.style.visibility;
      element.style.visibility = 'hidden';

      // Get the element behind the button
      const elementBehind = document.elementFromPoint(centerX, centerY);
      
      // Restore button visibility
      element.style.visibility = originalVisibility;

      if (elementBehind) {
        const computedStyle = window.getComputedStyle(elementBehind);
        const backgroundColor = computedStyle.backgroundColor;
        
        // Convert to hex or use a default
        if (backgroundColor && backgroundColor !== 'rgba(0, 0, 0, 0)' && backgroundColor !== 'transparent') {
          setBgColor(backgroundColor);
        } else {
          // Walk up the DOM tree to find a background color
          let parent = elementBehind.parentElement;
          while (parent) {
            const parentStyle = window.getComputedStyle(parent);
            const parentBg = parentStyle.backgroundColor;
            if (parentBg && parentBg !== 'rgba(0, 0, 0, 0)' && parentBg !== 'transparent') {
              setBgColor(parentBg);
              break;
            }
            parent = parent.parentElement;
          }
        }
      }
    };

    // Detect on mount and when scrolling/resizing
    detectBackgroundColor();
    window.addEventListener('scroll', detectBackgroundColor);
    window.addEventListener('resize', detectBackgroundColor);

    return () => {
      window.removeEventListener('scroll', detectBackgroundColor);
      window.removeEventListener('resize', detectBackgroundColor);
    };
  }, []);

  return bgColor;
};

const Button = React.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
  const buttonRef = React.useRef(null);
  const bgColor = useBackgroundColor(buttonRef);
  
  const Comp = asChild ? Slot : "button"
  
  return (
    <Comp
      ref={(node) => {
        buttonRef.current = node;
        if (typeof ref === 'function') {
          ref(node);
        } else if (ref) {
          ref.current = node;
        }
      }}
      className={cn(buttonVariants({ variant, size, className }))}
      style={{
        '--tw-ring-offset-color': bgColor,
        ...props.style
      }}
      {...props}
    />
  );
})
Button.displayName = "Button"

export { Button, buttonVariants }