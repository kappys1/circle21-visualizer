"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { X } from "lucide-react";
import * as React from "react";
import { Drawer as DrawerPrimitive } from "vaul";

import { cn } from "@/lib/utils";

function Drawer({
  shouldScaleBackground = true,
  direction = "right",
  ...props
}: Readonly<React.ComponentProps<typeof DrawerPrimitive.Root>>) {
  return (
    <DrawerPrimitive.Root
      shouldScaleBackground={shouldScaleBackground}
      direction={direction}
      {...props}
    />
  );
}

const DrawerTrigger = DrawerPrimitive.Trigger;
const DrawerPortal = DrawerPrimitive.Portal;
const DrawerClose = DrawerPrimitive.Close;

function DrawerOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Overlay>) {
  return (
    <DrawerPrimitive.Overlay
      className={cn(
        "fixed inset-0 z-70 bg-black/70 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        className,
      )}
      {...props}
    />
  );
}

const drawerVariants = cva(
  "fixed z-80 flex h-auto max-h-dvh touch-pan-y flex-col gap-4 overflow-x-hidden overflow-y-auto overscroll-contain border border-slate-700 bg-slate-950 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] text-slate-100 shadow-2xl duration-300 [-webkit-overflow-scrolling:touch] sm:p-6 sm:pb-[calc(1.5rem+env(safe-area-inset-bottom))]",
  {
    variants: {
      side: {
        top: "inset-x-0 top-0 border-b data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top data-[state=open]:animate-in data-[state=closed]:animate-out",
        bottom:
          "inset-x-0 bottom-0 border-t data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom data-[state=open]:animate-in data-[state=closed]:animate-out",
        left: "inset-y-0 left-0 h-dvh w-[92vw] max-w-[640px] border-r data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left data-[state=open]:animate-in data-[state=closed]:animate-out",
        right:
          "inset-y-0 right-0 h-dvh w-[92vw] max-w-[640px] border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right data-[state=open]:animate-in data-[state=closed]:animate-out",
      },
    },
    defaultVariants: {
      side: "right",
    },
  },
);

type DrawerContentProps = React.ComponentProps<typeof DrawerPrimitive.Content> &
  VariantProps<typeof drawerVariants>;

function DrawerContent({
  side = "right",
  className,
  children,
  ...props
}: Readonly<DrawerContentProps>) {
  return (
    <DrawerPortal>
      <DrawerOverlay />
      <DrawerPrimitive.Content
        data-vaul-no-drag
        className={cn(drawerVariants({ side }), className)}
        {...props}
      >
        <div
          className={cn(
            "mx-auto mt-1 hidden h-2 w-25 rounded-full bg-slate-700",
            side === "bottom" ? "block" : "hidden",
          )}
        />

        {children}

        <DrawerPrimitive.Close className="absolute right-3 top-3 rounded-sm opacity-80 transition hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-sky-400 sm:right-4 sm:top-4">
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </DrawerPrimitive.Close>
      </DrawerPrimitive.Content>
    </DrawerPortal>
  );
}

function DrawerHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("flex flex-col gap-1.5", className)} {...props} />;
}

function DrawerFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "mt-auto flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
        className,
      )}
      {...props}
    />
  );
}

function DrawerTitle({
  className,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Title>) {
  return (
    <DrawerPrimitive.Title
      className={cn("text-lg font-semibold", className)}
      {...props}
    />
  );
}

function DrawerDescription({
  className,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Description>) {
  return (
    <DrawerPrimitive.Description
      className={cn("text-sm text-slate-400", className)}
      {...props}
    />
  );
}

export {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  DrawerPortal,
  DrawerTitle,
  DrawerTrigger,
};
