import * as React from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
  DrawerTrigger,
  DrawerClose,
} from "@/components/ui/drawer";
import { cn } from "@/lib/utils";

interface ResponsiveDialogProps {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

interface ResponsiveDialogContentProps {
  children: React.ReactNode;
  className?: string;
}

interface ResponsiveDialogHeaderProps {
  children: React.ReactNode;
  className?: string;
}

interface ResponsiveDialogTitleProps {
  children: React.ReactNode;
  className?: string;
}

interface ResponsiveDialogDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

interface ResponsiveDialogFooterProps {
  children: React.ReactNode;
  className?: string;
}

interface ResponsiveDialogTriggerProps {
  children: React.ReactNode;
  asChild?: boolean;
  className?: string;
}

interface ResponsiveDialogCloseProps {
  children: React.ReactNode;
  asChild?: boolean;
  className?: string;
}

/**
 * ResponsiveDialog - Uses Drawer on mobile, Dialog on desktop
 * 
 * This provides a more native-feeling experience on mobile devices
 * by using a bottom sheet (Drawer) instead of a centered modal (Dialog).
 */
export function ResponsiveDialog({ 
  children, 
  open, 
  onOpenChange 
}: ResponsiveDialogProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        {children}
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {children}
    </Dialog>
  );
}

export function ResponsiveDialogTrigger({ 
  children, 
  asChild = true,
  className 
}: ResponsiveDialogTriggerProps) {
  const isMobile = useIsMobile();
  
  if (isMobile) {
    return (
      <DrawerTrigger asChild={asChild} className={className}>
        {children}
      </DrawerTrigger>
    );
  }

  return (
    <DialogTrigger asChild={asChild} className={className}>
      {children}
    </DialogTrigger>
  );
}

export function ResponsiveDialogContent({ 
  children, 
  className 
}: ResponsiveDialogContentProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <DrawerContent className={cn("px-4 pb-safe-bottom", className)}>
        {children}
      </DrawerContent>
    );
  }

  return (
    <DialogContent className={className}>
      {children}
    </DialogContent>
  );
}

export function ResponsiveDialogHeader({ 
  children, 
  className 
}: ResponsiveDialogHeaderProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return <DrawerHeader className={className}>{children}</DrawerHeader>;
  }

  return <DialogHeader className={className}>{children}</DialogHeader>;
}

export function ResponsiveDialogTitle({ 
  children, 
  className 
}: ResponsiveDialogTitleProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return <DrawerTitle className={className}>{children}</DrawerTitle>;
  }

  return <DialogTitle className={className}>{children}</DialogTitle>;
}

export function ResponsiveDialogDescription({ 
  children, 
  className 
}: ResponsiveDialogDescriptionProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return <DrawerDescription className={className}>{children}</DrawerDescription>;
  }

  return <DialogDescription className={className}>{children}</DialogDescription>;
}

export function ResponsiveDialogFooter({ 
  children, 
  className 
}: ResponsiveDialogFooterProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return <DrawerFooter className={className}>{children}</DrawerFooter>;
  }

  return <DialogFooter className={className}>{children}</DialogFooter>;
}

export function ResponsiveDialogClose({ 
  children, 
  asChild = true,
  className 
}: ResponsiveDialogCloseProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <DrawerClose asChild={asChild} className={className}>
        {children}
      </DrawerClose>
    );
  }

  return (
    <DialogClose asChild={asChild} className={className}>
      {children}
    </DialogClose>
  );
}
