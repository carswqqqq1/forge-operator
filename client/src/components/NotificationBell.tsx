import { useState } from "react";
import { Bell, X, Check, AlertCircle, CheckCircle2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Notification {
  id: string;
  type: "success" | "info" | "warning" | "error";
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface NotificationBellProps {
  notifications?: Notification[];
  onMarkAsRead?: (id: string) => void;
  onDismiss?: (id: string) => void;
}

export default function NotificationBell({
  notifications = [
    {
      id: "1",
      type: "success",
      title: "Task completed",
      message: "Your 'Create slides' task finished successfully",
      timestamp: new Date(Date.now() - 5 * 60000),
      read: false,
    },
    {
      id: "2",
      type: "info",
      title: "New feature available",
      message: "Team collaboration is now available for all users",
      timestamp: new Date(Date.now() - 2 * 60000),
      read: false,
    },
    {
      id: "3",
      type: "warning",
      title: "Low credits",
      message: "You have less than 100 credits remaining",
      timestamp: new Date(Date.now() - 1 * 60000),
      read: true,
    },
  ],
  onMarkAsRead = () => {},
  onDismiss = () => {},
}: NotificationBellProps) {
  const [open, setOpen] = useState(false);
  const unreadCount = notifications.filter((n) => !n.read).length;

  const getIcon = (type: string) => {
    switch (type) {
      case "success":
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case "error":
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      case "warning":
        return <AlertCircle className="w-4 h-4 text-yellow-600" />;
      default:
        return <Bell className="w-4 h-4 text-blue-600" />;
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button className="relative p-2 hover:bg-muted rounded-lg transition-colors">
          <Bell className="w-5 h-5 text-foreground" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-5 h-5 bg-accent text-white text-xs font-bold rounded-full flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-96 p-0">
        {/* Header */}
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <h3 className="font-serif font-bold text-foreground">Notifications</h3>
          {unreadCount > 0 && (
            <span className="text-xs font-medium text-primary">{unreadCount} new</span>
          )}
        </div>

        {/* Notifications List */}
        {notifications.length > 0 ? (
          <ScrollArea className="h-96">
            <div className="divide-y divide-border">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`px-4 py-3 hover:bg-muted transition-colors ${
                    !notification.read ? "bg-primary/5" : ""
                  }`}
                >
                  <div className="flex gap-3">
                    {/* Icon */}
                    <div className="flex-shrink-0 mt-1">
                      {getIcon(notification.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium text-sm text-foreground">
                          {notification.title}
                        </p>
                        <button
                          onClick={() => onDismiss(notification.id)}
                          className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {formatTime(notification.timestamp)}
                      </p>

                      {/* Action Button */}
                      {notification.action && (
                        <button
                          onClick={notification.action.onClick}
                          className="mt-2 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
                        >
                          {notification.action.label} →
                        </button>
                      )}
                    </div>

                    {/* Mark as Read */}
                    {!notification.read && (
                      <button
                        onClick={() => onMarkAsRead(notification.id)}
                        className="flex-shrink-0 text-primary hover:text-primary/80 transition-colors"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="px-4 py-12 text-center">
            <Bell className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
            <p className="text-sm text-muted-foreground">No notifications yet</p>
          </div>
        )}

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="px-4 py-3 border-t border-border">
            <button className="w-full text-xs font-medium text-center text-muted-foreground hover:text-foreground transition-colors py-2">
              View all notifications
            </button>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
