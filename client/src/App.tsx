import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ThemeToggle } from "@/components/ThemeToggle";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AuthProvider } from "@/context/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Orders from "@/pages/Orders";
import Clients from "@/pages/Clients";
import Deliverers from "@/pages/Deliverers";
import DelivererInterface from "@/pages/DelivererInterface";
import DelivererSessions from "@/pages/DelivererSessions";
import ProviderDashboard from "@/pages/ProviderDashboard";
import Providers from "@/pages/Providers";
import Products from "@/pages/Products";
import Analytics from "@/pages/Analytics";
import Settings from "@/pages/Settings";
import CreateAdmin from "@/pages/CreateAdmin";
import { Zones } from "@/pages/Zones";
import { Promotions } from "@/pages/Promotions";
import { Configuration } from "@/pages/Configuration";
import CashManagement from "@/pages/CashManagement";
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
      <Route path="/" component={() => <Redirect to="/dashboard" />} />
      <Route path="/login" component={Login} />
      <Route path="/dashboard">
        <ProtectedRoute requiredRoles={['superAdmin', 'admin']}>
          <DashboardLayout>
            <Dashboard />
          </DashboardLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/orders">
        <ProtectedRoute requiredRoles={['superAdmin', 'admin']}>
          <DashboardLayout>
            <Orders />
          </DashboardLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/clients">
        <ProtectedRoute requiredRoles={['superAdmin', 'admin']}>
          <DashboardLayout>
            <Clients />
          </DashboardLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/deliverers">
        <ProtectedRoute requiredRoles={['superAdmin', 'admin']}>
          <DashboardLayout>
            <Deliverers />
          </DashboardLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/create-admin">
        <ProtectedRoute requiredRoles={['superAdmin']}>
          <DashboardLayout>
            <CreateAdmin />
          </DashboardLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/deliverer-sessions">
        <ProtectedRoute requiredRoles={['superAdmin', 'admin']}>
          <DashboardLayout>
            <DelivererSessions />
          </DashboardLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/providers">
        <ProtectedRoute requiredRoles={['superAdmin', 'admin']}>
          <DashboardLayout>
            <Providers />
          </DashboardLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/OptionGroups">
        <ProtectedRoute requiredRoles={['superAdmin', 'admin']}>
          <DashboardLayout>
            <OptionGroupsPage />
          </DashboardLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/AllOptions">
        <ProtectedRoute requiredRoles={['superAdmin', 'admin']}>
          <DashboardLayout>
            <AllOptionsPage />
          </DashboardLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/products">
        <ProtectedRoute requiredRoles={['superAdmin', 'admin']}>
          <DashboardLayout>
            <Products />
          </DashboardLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/analytics">
        <ProtectedRoute requiredRoles={['superAdmin', 'admin']}>
          <DashboardLayout>
            <Analytics />
          </DashboardLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/settings">
        <ProtectedRoute requiredRoles={['superAdmin', 'admin']}>
          <DashboardLayout>
            <Settings />
          </DashboardLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/zones">
        <ProtectedRoute requiredRoles={['superAdmin', 'admin']}>
          <DashboardLayout>
            <Zones />
          </DashboardLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/promotions">
        <ProtectedRoute requiredRoles={['superAdmin', 'admin']}>
          <DashboardLayout>
            <Promotions />
          </DashboardLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/cash-management">
        <ProtectedRoute requiredRoles={['superAdmin', 'admin']}>
          <DashboardLayout>
            <CashManagement />
          </DashboardLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/configuration">
        <ProtectedRoute requiredRoles={['superAdmin']}>
          <DashboardLayout>
            <Configuration />
          </DashboardLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/deliverer-interface">
        <ProtectedRoute requiredRoles={['deliverer']}>
          <DelivererInterface />
        </ProtectedRoute>
      </Route>
      <Route path="/provider-dashboard">
        <ProtectedRoute requiredRoles={['provider']}>
          <ProviderDashboard />
        </ProtectedRoute>
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
          <AuthProvider>
            <Router />
            <Toaster />
          </AuthProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
