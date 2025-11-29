import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ThemeToggle } from "@/components/ThemeToggle";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Orders from "@/pages/Orders";
import Clients from "@/pages/Clients";
import Deliverers from "@/pages/Deliverers";
import DelivererInterface from "@/pages/DelivererInterface";
import Providers from "@/pages/Providers";
import Products from "@/pages/Products";
import Analytics from "@/pages/Analytics";
import Settings from "@/pages/Settings";
import { Zones } from "@/pages/Zones";
import { Promotions } from "@/pages/Promotions";
import { Configuration } from "@/pages/Configuration";
import NotFound from "@/pages/not-found";
import AllOptionsPage from "./pages/AllOptions";
import OptionGroupsPage from "./pages/OptionGroups";

function DashboardLayout({ children }: { children: React.ReactNode }) {
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1">
          <header className="flex items-center justify-between p-4 border-b">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <ThemeToggle />
          </header>
          <main className="flex-1 overflow-auto p-6">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={() => <Redirect to="/login" />} />
      <Route path="/login" component={Login} />
      <Route path="/dashboard">
        <DashboardLayout>
          <Dashboard />
        </DashboardLayout>
      </Route>
      <Route path="/orders">
        <DashboardLayout>
          <Orders />
        </DashboardLayout>
      </Route>
      <Route path="/clients">
        <DashboardLayout>
          <Clients />
        </DashboardLayout>
      </Route>
      <Route path="/deliverers">
        <DashboardLayout>
          <Deliverers />
        </DashboardLayout>
      </Route>
      <Route path="/providers">
        <DashboardLayout>
          <Providers />
        </DashboardLayout>
      </Route>
      <Route path="/OptionGroups">
        <DashboardLayout>
          <OptionGroupsPage />
        </DashboardLayout>
      </Route>
      <Route path="/AllOptions">
        <DashboardLayout>
          <AllOptionsPage />
        </DashboardLayout>
      </Route>
      <Route path="/products">
        <DashboardLayout>
          <Products />
        </DashboardLayout>
      </Route>
      <Route path="/analytics">
        <DashboardLayout>
          <Analytics />
        </DashboardLayout>
      </Route>
      <Route path="/settings">
        <DashboardLayout>
          <Settings />
        </DashboardLayout>
      </Route>
      <Route path="/zones">
        <DashboardLayout>
          <Zones />
        </DashboardLayout>
      </Route>
      <Route path="/promotions">
        <DashboardLayout>
          <Promotions />
        </DashboardLayout>
      </Route>
      <Route path="/configuration">
        <DashboardLayout>
          <Configuration />
        </DashboardLayout>
      </Route>
      <Route path="/deliverer-interface">
        <DelivererInterface />
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Router />
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
