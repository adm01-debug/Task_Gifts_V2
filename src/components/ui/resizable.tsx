import { createContext, useContext } from "react";
import { GripVertical } from "lucide-react";
import * as ResizablePrimitive from "react-resizable-panels";

import { cn } from "@/lib/utils";

const ResizableOrientation = createContext<"horizontal" | "vertical">("horizontal");

type ResizablePanelGroupProps = React.ComponentProps<typeof ResizablePrimitive.Group> & {
  direction?: "horizontal" | "vertical";
};

const ResizablePanelGroup = ({ className, direction = "horizontal", orientation = direction, ...props }: ResizablePanelGroupProps) => (
  <ResizableOrientation.Provider value={orientation}>
    <ResizablePrimitive.Group
      orientation={orientation}
      data-panel-group-direction={orientation}
      className={cn("flex h-full w-full data-[panel-group-direction=vertical]:flex-col", className)}
      {...props}
    />
  </ResizableOrientation.Provider>
);

// A API anterior expressava tamanhos numéricos em porcentagem; a v4 usa pixels.
const percentageSize = (size: number | string | undefined) => typeof size === "number" ? `${size}%` : size;
const ResizablePanel = ({ defaultSize, minSize, maxSize, collapsedSize, ...props }: React.ComponentProps<typeof ResizablePrimitive.Panel>) => (
  <ResizablePrimitive.Panel defaultSize={percentageSize(defaultSize)} minSize={percentageSize(minSize)} maxSize={percentageSize(maxSize)} collapsedSize={percentageSize(collapsedSize)} {...props} />
);

const ResizableHandle = ({
  withHandle,
  className,
  ...props
}: React.ComponentProps<typeof ResizablePrimitive.Separator> & {
  withHandle?: boolean;
}) => {
  const direction = useContext(ResizableOrientation);
  return (
  <ResizablePrimitive.Separator
    data-panel-group-direction={direction}
    className={cn(
      "relative flex w-px items-center justify-center bg-border after:absolute after:inset-y-0 after:left-1/2 after:w-1 after:-translate-x-1/2 data-[panel-group-direction=vertical]:h-px data-[panel-group-direction=vertical]:w-full data-[panel-group-direction=vertical]:after:left-0 data-[panel-group-direction=vertical]:after:h-1 data-[panel-group-direction=vertical]:after:w-full data-[panel-group-direction=vertical]:after:-translate-y-1/2 data-[panel-group-direction=vertical]:after:translate-x-0 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1 [&[data-panel-group-direction=vertical]>div]:rotate-90",
      className,
    )}
    {...props}
  >
    {withHandle && (
      <div className="z-10 flex h-4 w-3 items-center justify-center rounded-sm border bg-border">
        <GripVertical className="h-2.5 w-2.5" />
      </div>
    )}
  </ResizablePrimitive.Separator>
  );
};

export { ResizablePanelGroup, ResizablePanel, ResizableHandle };
