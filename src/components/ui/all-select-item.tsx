import * as React from "react";
import { SelectItem } from "@/components/ui/select";

interface AllSelectItemProps {
  label?: string;
}

export const AllSelectItem = React.forwardRef<
  React.ElementRef<typeof SelectItem>,
  AllSelectItemProps
>(({ label = "Todos" }, ref) => {
  return <SelectItem ref={ref} value="all">{label}</SelectItem>;
});

AllSelectItem.displayName = "AllSelectItem";
