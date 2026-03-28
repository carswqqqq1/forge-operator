import { useState } from "react";
import { Search, X, Filter, Save, Clock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SearchFilters {
  query: string;
  dateRange: "all" | "today" | "week" | "month";
  model: "all" | "lite" | "core" | "max";
  status: "all" | "completed" | "running" | "failed";
  type: "all" | "task" | "research" | "skill";
}

interface AdvancedSearchProps {
  onSearch?: (filters: SearchFilters) => void;
  recentSearches?: string[];
}

export default function AdvancedSearch({
  onSearch = () => {},
  recentSearches = ["Create slides", "Build website", "Research AI models"],
}: AdvancedSearchProps) {
  const [open, setOpen] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    query: "",
    dateRange: "all",
    model: "all",
    status: "all",
    type: "all",
  });

  const handleSearch = () => {
    onSearch(filters);
    setOpen(false);
  };

  const handleReset = () => {
    setFilters({
      query: "",
      dateRange: "all",
      model: "all",
      status: "all",
      type: "all",
    });
  };

  const hasActiveFilters =
    filters.query ||
    filters.dateRange !== "all" ||
    filters.model !== "all" ||
    filters.status !== "all" ||
    filters.type !== "all";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted transition-colors border border-border">
          <Search className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground hidden sm:inline">Search...</span>
          <kbd className="hidden sm:inline-block px-2 py-1 text-xs font-semibold text-muted-foreground bg-muted rounded border border-border">
            ⌘K
          </kbd>
        </button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-serif">Advanced Search</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Main Search Input */}
          <div>
            <Label htmlFor="search-query" className="text-sm font-medium mb-2 block">
              Search query
            </Label>
            <Input
              id="search-query"
              placeholder="Search conversations, tasks, research..."
              value={filters.query}
              onChange={(e) =>
                setFilters({ ...filters, query: e.target.value })
              }
              className="text-base"
              autoFocus
            />
          </div>

          {/* Filters Grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* Date Range */}
            <div>
              <Label htmlFor="date-range" className="text-sm font-medium mb-2 block">
                Date range
              </Label>
              <Select value={filters.dateRange} onValueChange={(value: any) =>
                setFilters({ ...filters, dateRange: value })
              }>
                <SelectTrigger id="date-range">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This week</SelectItem>
                  <SelectItem value="month">This month</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Model */}
            <div>
              <Label htmlFor="model" className="text-sm font-medium mb-2 block">
                Model
              </Label>
              <Select value={filters.model} onValueChange={(value: any) =>
                setFilters({ ...filters, model: value })
              }>
                <SelectTrigger id="model">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All models</SelectItem>
                  <SelectItem value="lite">Forge 1.6 Lite</SelectItem>
                  <SelectItem value="core">Forge 1.6</SelectItem>
                  <SelectItem value="max">Forge 1.6 Max</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Status */}
            <div>
              <Label htmlFor="status" className="text-sm font-medium mb-2 block">
                Status
              </Label>
              <Select value={filters.status} onValueChange={(value: any) =>
                setFilters({ ...filters, status: value })
              }>
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="running">Running</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Type */}
            <div>
              <Label htmlFor="type" className="text-sm font-medium mb-2 block">
                Type
              </Label>
              <Select value={filters.type} onValueChange={(value: any) =>
                setFilters({ ...filters, type: value })
              }>
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  <SelectItem value="task">Task</SelectItem>
                  <SelectItem value="research">Research</SelectItem>
                  <SelectItem value="skill">Skill</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Recent Searches */}
          {recentSearches.length > 0 && (
            <div>
              <Label className="text-sm font-medium mb-2 block flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Recent searches
              </Label>
              <div className="flex flex-wrap gap-2">
                {recentSearches.map((search) => (
                  <button
                    key={search}
                    onClick={() =>
                      setFilters({ ...filters, query: search })
                    }
                    className="px-3 py-1 text-sm bg-muted hover:bg-primary/10 text-foreground rounded-full transition-colors"
                  >
                    {search}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 justify-end">
            {hasActiveFilters && (
              <Button
                variant="outline"
                onClick={handleReset}
                className="gap-2"
              >
                <X className="w-4 h-4" />
                Reset
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => {}}
              className="gap-2"
            >
              <Save className="w-4 h-4" />
              Save search
            </Button>
            <Button
              onClick={handleSearch}
              className="bg-primary text-foreground hover:bg-primary/90 gap-2"
            >
              <Search className="w-4 h-4" />
              Search
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
