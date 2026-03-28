import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

interface MobileNavProps {
  children?: React.ReactNode;
}

export default function MobileNav({ children }: MobileNavProps) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button className="md:hidden p-2 hover:bg-muted rounded-lg transition-colors">
          <Menu className="w-6 h-6 text-foreground" />
        </button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-0">
        <div className="h-full overflow-y-auto">
          {children}
        </div>
      </SheetContent>
    </Sheet>
  );
}
