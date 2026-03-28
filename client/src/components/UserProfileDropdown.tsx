import { useState } from "react";
import { useLocation } from "wouter";
import { ChevronDown, Settings, LogOut, CreditCard, HelpCircle } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface UserProfileDropdownProps {
  userName?: string;
  userEmail?: string;
  userAvatar?: string;
  subscriptionTier?: "lite" | "core" | "max";
  creditsRemaining?: number;
}

export default function UserProfileDropdown({
  userName = "Carson Wesolowski",
  userEmail = "carson@arroyo.marketing",
  userAvatar,
  subscriptionTier = "max",
  creditsRemaining = 851,
}: UserProfileDropdownProps) {
  const [, setLocation] = useLocation();
  const [open, setOpen] = useState(false);

  const tierColors = {
    lite: "bg-blue-100 text-blue-800",
    core: "bg-purple-100 text-purple-800",
    max: "bg-green-100 text-green-800",
  };

  const tierLabels = {
    lite: "Forge 1.6 Lite",
    core: "Forge 1.6",
    max: "Forge 1.6 Max",
  };

  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted transition-colors">
          <Avatar className="w-8 h-8">
            <AvatarImage src={userAvatar} alt={userName} />
            <AvatarFallback className="bg-primary text-foreground font-bold text-xs">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="hidden sm:flex flex-col items-start">
            <span className="text-sm font-medium text-foreground">{userName}</span>
            <span className="text-xs text-muted-foreground">{creditsRemaining} credits</span>
          </div>
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-64">
        {/* Profile Header */}
        <div className="px-4 py-3 border-b border-border">
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10">
              <AvatarImage src={userAvatar} alt={userName} />
              <AvatarFallback className="bg-primary text-foreground font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{userName}</p>
              <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
            </div>
          </div>

          {/* Subscription Tier Badge */}
          <div className={`mt-3 px-2 py-1 rounded-md text-xs font-medium text-center ${tierColors[subscriptionTier]}`}>
            {tierLabels[subscriptionTier]}
          </div>

          {/* Credits Info */}
          <div className="mt-3 p-2 bg-muted rounded-md">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-medium text-foreground">Credits</span>
              <span className="text-xs font-bold text-primary">{creditsRemaining}</span>
            </div>
            <div className="w-full h-2 bg-border rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${Math.min((creditsRemaining / 1000) * 100, 100)}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {creditsRemaining < 100 ? "⚠️ Running low" : "Plenty available"}
            </p>
          </div>
        </div>

        {/* Menu Items */}
        <DropdownMenuItem onClick={() => setLocation("/settings")} className="cursor-pointer">
          <Settings className="w-4 h-4 mr-2" />
          <span>Settings</span>
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => setLocation("/billing")} className="cursor-pointer">
          <CreditCard className="w-4 h-4 mr-2" />
          <span>Billing & Credits</span>
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => setLocation("/help")} className="cursor-pointer">
          <HelpCircle className="w-4 h-4 mr-2" />
          <span>Help & Support</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Logout */}
        <DropdownMenuItem
          onClick={() => {
            // TODO: Implement logout
            setLocation("/login");
          }}
          className="cursor-pointer text-destructive focus:text-destructive"
        >
          <LogOut className="w-4 h-4 mr-2" />
          <span>Sign out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
