import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import AppLayout from "./components/AppLayout";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Billing from "./pages/Billing";
import Logs from "./pages/Logs";
import Skills from "./pages/Skills";
import Connectors from "./pages/Connectors";
import ScheduledTasks from "./pages/ScheduledTasks";
import Memory from "./pages/Memory";
import Prompts from "./pages/Prompts";
import Settings from "./pages/Settings";
import Research from "./pages/Research";
import Login from "./pages/Login";

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route>
        <AppLayout>
          <Switch>
        <Route path="/">{() => <Home />}</Route>
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/billing" component={Billing} />
        <Route path="/logs" component={Logs} />
        <Route path="/research" component={Research} />
        <Route path="/skills" component={Skills} />
        <Route path="/connectors" component={Connectors} />
        <Route path="/scheduled" component={ScheduledTasks} />
        <Route path="/memory" component={Memory} />
        <Route path="/prompts" component={Prompts} />
        <Route path="/settings" component={Settings} />
        <Route path="/chat/:id">{(params: { id: string }) => <Home conversationId={params.id} />}</Route>
            <Route component={NotFound} />
          </Switch>
        </AppLayout>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
