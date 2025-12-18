import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiService } from "@/lib/api";
import { useAuthContext } from "@/context/AuthContext";

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { login } = useAuthContext();
  
  // Super Admin state
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminLoading, setAdminLoading] = useState(false);
  
  // Deliverer state
  const [delivererPhone, setDelivererPhone] = useState("");
  const [delivererLoading, setDelivererLoading] = useState(false);

  // Provider state
  const [providerEmail, setProviderEmail] = useState("");
  const [providerPassword, setProviderPassword] = useState("");
  const [providerLoading, setProviderLoading] = useState(false);
  
  // Global state
  const [activeTab, setActiveTab] = useState("admin");

  // Handle Super Admin login
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!adminEmail || !adminPassword) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs",
        variant: "destructive",
      });
      return;
    }

    setAdminLoading(true);

    try {
      const response = await apiService.loginSuperAdmin({
        email: adminEmail,
        password: adminPassword,
      });

      // Use AuthContext to login
      login(
        {
          _id: response._id,
          firstName: response.firstName,
          lastName: response.lastName,
          email: response.email,
          role: response.role,
        },
        response.token
      );

      toast({
        title: "Succès",
        description: response.message || "Connexion administrateur réussie",
      });

      // Navigate to dashboard
      setLocation("/dashboard");

    } catch (error: any) {
      console.error('Admin login error:', error);
      toast({
        title: "Erreur de connexion",
        description: error.message || "Identifiants invalides",
        variant: "destructive",
      });
    } finally {
      setAdminLoading(false);
    }
  };

  // Handle Deliverer login
  const handleDelivererLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!delivererPhone) {
      toast({
        title: "Erreur",
        description: "Veuillez saisir votre numéro de téléphone",
        variant: "destructive",
      });
      return;
    }

    setDelivererLoading(true);

    try {
      const response = await apiService.loginDeliverer({
        phoneNumber: delivererPhone,
      });

      // Use AuthContext to login
      login(
        {
          _id: response._id,
          firstName: response.firstName,
          lastName: response.lastName,
          phoneNumber: response.phoneNumber,
          email: response.email,
          role: response.role,
        },
        response.token
      );

      toast({
        title: "Succès",
        description: response.message || "Connexion livreur réussie",
      });

      // Navigate to deliverer interface
      setLocation("/deliverer-interface");

    } catch (error: any) {
      console.error('Deliverer login error:', error);
      toast({
        title: "Erreur de connexion",
        description: error.message || "Numéro de téléphone invalide",
        variant: "destructive",
      });
    } finally {
      setDelivererLoading(false);
    }
  };

  // Handle Provider login
  const handleProviderLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!providerEmail || !providerPassword) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs",
        variant: "destructive",
      });
      return;
    }

    setProviderLoading(true);

    try {
      const response = await apiService.loginProvider({
        email: providerEmail,
        password: providerPassword,
      });

      // Use AuthContext to login
      login(
        {
          _id: response._id,
          name: response.name,
          email: response.email,
          role: response.role,
        },
        response.token
      );

      toast({
        title: "Succès",
        description: response.message || "Connexion fournisseur réussie",
      });

      // Navigate to provider dashboard
      setLocation("/provider-dashboard");

    } catch (error: any) {
      console.error('Provider login error:', error);
      toast({
        title: "Erreur de connexion",
        description: error.message || "Email ou mot de passe invalide",
        variant: "destructive",
      });
    } finally {
      setProviderLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-10 w-10 rounded-md bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-xl">A</span>
            </div>
            <div>
              <CardTitle className="text-2xl">AMIGOS Delivery</CardTitle>
              <CardDescription>Connexion au tableau de bord</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="admin">
                <span className="flex items-center gap-2">
                  👨‍💼 Administrateur
                </span>
              </TabsTrigger>
              <TabsTrigger value="deliverer">
                <span className="flex items-center gap-2">
                  🚚 Livreur
                </span>
              </TabsTrigger>
              <TabsTrigger value="provider">
                <span className="flex items-center gap-2">
                  🏪 Prestataire
                </span>
              </TabsTrigger>
            </TabsList>

            {/* Admin Login Tab */}
            <TabsContent value="admin">
              <form onSubmit={handleAdminLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="adminEmail">Email Administrateur</Label>
                  <Input
                    id="adminEmail"
                    type="email"
                    placeholder="admin@amigos.com"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    required
                    data-testid="input-admin-email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="adminPassword">Mot de passe</Label>
                  <Input
                    id="adminPassword"
                    type="password"
                    placeholder="••••••••"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    required
                    data-testid="input-admin-password"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={adminLoading}
                  data-testid="button-admin-login"
                >
                  {adminLoading ? "Connexion..." : "Se connecter en tant qu'administrateur"}
                </Button>
              </form>
            </TabsContent>

            {/* Deliverer Login Tab */}
            <TabsContent value="deliverer">
              <form onSubmit={handleDelivererLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="delivererPhone">Numéro de téléphone</Label>
                  <Input
                    id="delivererPhone"
                    type="tel"
                    placeholder="12345678"
                    value={delivererPhone}
                    onChange={(e) => setDelivererPhone(e.target.value)}
                    required
                    data-testid="input-deliverer-phone"
                  />
                  <p className="text-xs text-muted-foreground">
                    Format requis: +216 suivi de 8 chiffres
                  </p>
                </div>
                <Button
                  type="submit"
                  className="w-full bg-green-600 hover:bg-green-700"
                  disabled={delivererLoading}
                  data-testid="button-deliverer-login"
                >
                  {delivererLoading ? "Connexion..." : "Se connecter en tant que livreur"}
                </Button>
              </form>
            </TabsContent>

            {/* Provider Login Tab */}
            <TabsContent value="provider">
              <form onSubmit={handleProviderLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="providerEmail">Email Fournisseur</Label>
                  <Input
                    id="providerEmail"
                    type="email"
                    placeholder="fournisseur@restaurant.com"
                    value={providerEmail}
                    onChange={(e) => setProviderEmail(e.target.value)}
                    required
                    data-testid="input-provider-email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="providerPassword">Mot de passe</Label>
                  <Input
                    id="providerPassword"
                    type="password"
                    placeholder="••••••••"
                    value={providerPassword}
                    onChange={(e) => setProviderPassword(e.target.value)}
                    required
                    data-testid="input-provider-password"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  disabled={providerLoading}
                  data-testid="button-provider-login"
                >
                  {providerLoading ? "Connexion..." : "Se connecter en tant que fournisseur"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
