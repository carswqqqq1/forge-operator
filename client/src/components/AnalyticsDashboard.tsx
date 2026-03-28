import { TrendingUp, Zap, Clock, Target } from "lucide-react";
import { Card } from "@/components/ui/card";

interface AnalyticsMetrics {
  tasksToday: number;
  tasksWeek: number;
  creditsUsedToday: number;
  creditsUsedWeek: number;
  avgTaskTime: number;
  successRate: number;
  modelBreakdown: {
    lite: number;
    core: number;
    max: number;
  };
}

interface AnalyticsDashboardProps {
  metrics?: AnalyticsMetrics;
}

export default function AnalyticsDashboard({
  metrics = {
    tasksToday: 12,
    tasksWeek: 67,
    creditsUsedToday: 245,
    creditsUsedWeek: 1240,
    avgTaskTime: 2.3,
    successRate: 98,
    modelBreakdown: {
      lite: 15,
      core: 45,
      max: 7,
    },
  },
}: AnalyticsDashboardProps) {
  const totalTasksWeek = metrics.tasksWeek;
  const litePercent = (metrics.modelBreakdown.lite / totalTasksWeek) * 100;
  const corePercent = (metrics.modelBreakdown.core / totalTasksWeek) * 100;
  const maxPercent = (metrics.modelBreakdown.max / totalTasksWeek) * 100;

  const StatCard = ({
    icon: Icon,
    label,
    value,
    unit,
    trend,
  }: {
    icon: any;
    label: string;
    value: number;
    unit: string;
    trend?: number;
  }) => (
    <Card className="p-4 border-2 border-dashed border-primary/20">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-muted-foreground font-medium">{label}</p>
          <p className="text-2xl font-bold text-foreground mt-1">
            {value}
            <span className="text-sm text-muted-foreground ml-1">{unit}</span>
          </p>
          {trend !== undefined && (
            <p className={`text-xs mt-2 ${trend > 0 ? "text-green-600" : "text-red-600"}`}>
              {trend > 0 ? "↑" : "↓"} {Math.abs(trend)}% from last week
            </p>
          )}
        </div>
        <div className="p-3 bg-primary/10 rounded-lg">
          <Icon className="w-6 h-6 text-primary" />
        </div>
      </div>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Target}
          label="Tasks Today"
          value={metrics.tasksToday}
          unit="tasks"
          trend={8}
        />
        <StatCard
          icon={Zap}
          label="Credits Used Today"
          value={metrics.creditsUsedToday}
          unit="credits"
          trend={-5}
        />
        <StatCard
          icon={Clock}
          label="Avg Task Time"
          value={metrics.avgTaskTime}
          unit="min"
          trend={-12}
        />
        <StatCard
          icon={TrendingUp}
          label="Success Rate"
          value={metrics.successRate}
          unit="%"
          trend={2}
        />
      </div>

      {/* Model Usage Breakdown */}
      <Card className="p-6 border-2 border-dashed border-primary/20">
        <h3 className="font-serif font-bold text-foreground mb-4">Model Usage (This Week)</h3>

        <div className="space-y-4">
          {/* Lite */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-foreground">Forge 1.6 Lite</span>
              <span className="text-sm font-bold text-primary">
                {metrics.modelBreakdown.lite} tasks ({litePercent.toFixed(1)}%)
              </span>
            </div>
            <div className="w-full h-2 bg-border rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 transition-all"
                style={{ width: `${litePercent}%` }}
              />
            </div>
          </div>

          {/* Core */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-foreground">Forge 1.6</span>
              <span className="text-sm font-bold text-primary">
                {metrics.modelBreakdown.core} tasks ({corePercent.toFixed(1)}%)
              </span>
            </div>
            <div className="w-full h-2 bg-border rounded-full overflow-hidden">
              <div
                className="h-full bg-purple-500 transition-all"
                style={{ width: `${corePercent}%` }}
              />
            </div>
          </div>

          {/* Max */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-foreground">Forge 1.6 Max</span>
              <span className="text-sm font-bold text-primary">
                {metrics.modelBreakdown.max} tasks ({maxPercent.toFixed(1)}%)
              </span>
            </div>
            <div className="w-full h-2 bg-border rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 transition-all"
                style={{ width: `${maxPercent}%` }}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Weekly Summary */}
      <Card className="p-6 border-2 border-dashed border-primary/20">
        <h3 className="font-serif font-bold text-foreground mb-4">Weekly Summary</h3>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">Total Tasks</p>
            <p className="text-2xl font-bold text-foreground">{metrics.tasksWeek}</p>
          </div>
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">Total Credits</p>
            <p className="text-2xl font-bold text-foreground">{metrics.creditsUsedWeek}</p>
          </div>
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">Avg Cost/Task</p>
            <p className="text-2xl font-bold text-foreground">
              {(metrics.creditsUsedWeek / metrics.tasksWeek).toFixed(1)}
            </p>
          </div>
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">Efficiency</p>
            <p className="text-2xl font-bold text-primary">{metrics.successRate}%</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
