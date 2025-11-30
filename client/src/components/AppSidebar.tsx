import {
  LayoutDashboard,
  Users,
  ShoppingBag,
  Truck,
  Store,
  Package,
  BarChart3,
  Settings,
  MapPin,
  Gift,
  Sliders
} from "lucide-react";
import { Link, useLocation } from "wouter";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
} from "@/components/ui/sidebar";

const menuItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Commandes",
    url: "/orders",
    icon: ShoppingBag,
  },
  {
    title: "Clients",
    url: "/clients",
    icon: Users,
  },
  {
    title: "Livreurs",
    url: "/deliverers",
    icon: Truck,
  },
  {
    title: "Interface Livreur",
    url: "/deliverer-interface",
    icon: Truck,
  },
  {
    title: "Prestataires",
    url: "/providers",
    icon: Store,
  },
  {
    title: "Produits",
    url: "/products",
    icon: Package,
  },
  {
    title: "Option Groups",
    url: "/OptionGroups",
    icon: Package,
  },
  {
    title: "All Options",
    url: "/AllOptions",
    icon: Package,
  },
  {
    title: "Zones",
    url: "/zones",
    icon: MapPin,
  },
  {
    title: "Promotions",
    url: "/promotions",
    icon: Gift,
  },
];

const secondaryItems = [
  {
    title: "Analytiques",
    url: "/analytics",
    icon: BarChart3,
  },
  {
    title: "Configuration",
    url: "/configuration",
    icon: Sliders,
  },
  {
    title: "Paramètres",
    url: "/settings",
    icon: Settings,
  },
];

export function AppSidebar() {
  const [location] = useLocation();

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-lg">A</span>
          </div>
          <div>
            <h2 className="font-semibold text-base">AMIGOS Delivery</h2>
            <p className="text-xs text-muted-foreground">Dashboard Admin</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Gestion</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={location === item.url}>
                    <Link href={item.url} data-testid={`link-${item.title.toLowerCase()}`}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Autres</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {secondaryItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={location === item.url}>
                    <Link href={item.url} data-testid={`link-${item.title.toLowerCase()}`}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
