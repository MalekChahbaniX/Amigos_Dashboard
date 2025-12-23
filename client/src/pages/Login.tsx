import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiService } from "@/lib/api";
import { useAuthContext } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";

type LoginRole = "superadmin" | "admin" | "deliverer" | "provider";

interface RoleConfig {
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  fields: "email" | "phone";
}

const roleConfigs: Record<LoginRole, RoleConfig> = {
  superadmin: {
    title: "👑 Super Administrateur",
    subtitle: "Accès administrateur complet",
    icon: "👑",
    color: "purple",
    fields: "email",
  },
  admin: {
    title: "👨‍💼 Administrateur",
    subtitle: "Gestion de ville",
    icon: "👨‍💼",
    color: "blue",
    fields: "email",
  },
  deliverer: {
    title: "🚚 Livreur",
    subtitle: "Interface de livraison",
    icon: "🚚",
    color: "green",
    fields: "phone",
  },
  provider: {
    title: "🏪 Prestataire",
    subtitle: "Gestion de prestataire",
    icon: "🏪",
    color: "amber",
    fields: "email",
  },
};

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { login } = useAuthContext();

  const [currentRole, setCurrentRole] = useState<LoginRole>("superadmin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const config = roleConfigs[currentRole];
  const isEmailField = config.fields === "email";

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isEmailField && (!email || !password)) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs",
        variant: "destructive",
      });
      return;
    }

    if (!isEmailField && !phoneNumber) {
      toast({
        title: "Erreur",
        description: "Veuillez saisir votre numéro de téléphone",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      let response;
      let userData: any;
      let redirectPath = "/dashboard";

      if (currentRole === "superadmin") {
        response = await apiService.loginSuperAdmin({
          email,
          password,
        });
        userData = {
          _id: response._id,
          firstName: response.firstName,
          lastName: response.lastName,
          email: response.email,
          role: response.role,
        };
      } else if (currentRole === "admin") {
        response = await apiService.loginAdmin({
          email,
          password,
        });
        userData = {
          _id: response._id,
          firstName: response.firstName,
          lastName: response.lastName,
          email: response.email,
          role: response.role,
        };
      } else if (currentRole === "deliverer") {
        response = await apiService.loginDeliverer({
          phoneNumber: `+216${phoneNumber.replace(/\D/g, "")}`,
        });
        userData = {
          _id: response._id,
          firstName: response.firstName,
          lastName: response.lastName,
          phoneNumber: response.phoneNumber,
          role: response.role,
        };
        redirectPath = "/deliverer-interface";
      } else if (currentRole === "provider") {
        response = await apiService.loginProvider({
          email,
          password,
        });
        userData = {
          _id: response._id,
          name: response.name,
          email: response.email,
          role: response.role,
        };
        redirectPath = "/provider-dashboard";
      }

      if (response && response.token) {
        console.log('Login success, user data:', userData);
        console.log('Token:', response.token);
        console.log('LocalStorage before login:', localStorage.getItem('authToken'), localStorage.getItem('user'));
        
        login(userData, response.token);

        console.log('LocalStorage after login:', localStorage.getItem('authToken'), localStorage.getItem('user'));

        toast({
          title: "Succès",
          description: response.message || "Connexion réussie",
        });

        // Navigate after a longer delay to ensure context is updated
        setTimeout(() => {
          console.log('Redirecting to:', redirectPath);
          setLocation(redirectPath);
        }, 1000);
      }
    } catch (error: any) {
      console.error(`${currentRole} login error:`, error);
      toast({
        title: "Erreur de connexion",
        description:
          error.message ||
          "Identifiants invalides. Veuillez vérifier vos informations.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleChange = (role: LoginRole) => {
    setCurrentRole(role);
    setEmail("");
    setPassword("");
    setPhoneNumber("");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-blue-50 p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-2xl">A</span>
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900">AMIGOS Delivery</h1>
              <p className="text-gray-600">Connexion au tableau de bord</p>
            </div>
          </div>
        </div>

        {/* Role Selection */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-8">
          {(Object.keys(roleConfigs) as LoginRole[]).map((role) => {
            const roleConfig = roleConfigs[role];
            const isActive = currentRole === role;
            const colorClass =
              role === "superadmin"
                ? "purple"
                : role === "admin"
                  ? "blue"
                  : role === "deliverer"
                    ? "green"
                    : "amber";

            return (
              <button
                key={role}
                onClick={() => handleRoleChange(role)}
                className={`p-4 rounded-lg border-2 transition-all ${
                  isActive
                    ? `border-${colorClass}-500 bg-${colorClass}-50 shadow-lg`
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}
              >
                <div className="text-3xl mb-2">{roleConfig.icon}</div>
                <div className="text-sm font-semibold text-gray-900">
                  {role === "superadmin"
                    ? "Super Admin"
                    : role === "admin"
                      ? "Admin"
                      : role === "deliverer"
                        ? "Livreur"
                        : "Prestataire"}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {roleConfig.subtitle}
                </div>
              </button>
            );
          })}
        </div>

        {/* Login Card */}
        <Card className="shadow-2xl border-0">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b">
            <CardTitle className="text-2xl">{config.title}</CardTitle>
            <CardDescription className="text-base">
              {config.subtitle}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-8">
            <form onSubmit={handleLogin} className="space-y-5">
              {isEmailField ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-base font-semibold">
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="votre.email@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isLoading}
                      className="h-11 text-base"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-base font-semibold">
                      Mot de passe
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isLoading}
                      className="h-11 text-base"
                      required
                    />
                  </div>
                </>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-base font-semibold">
                    Numéro de téléphone
                  </Label>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-medium text-gray-600">
                      +216
                    </span>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="12345678"
                      value={phoneNumber}
                      onChange={(e) => {
                        const cleaned = e.target.value.replace(/\D/g, "");
                        setPhoneNumber(cleaned.slice(0, 8));
                      }}
                      disabled={isLoading}
                      className="h-11 text-base"
                      maxLength={8}
                      required
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Format: 8 chiffres (ex: 12345678)
                  </p>
                </div>
              )}

              <Button
                type="submit"
                disabled={isLoading}
                className={`w-full h-12 text-base font-semibold mt-8 ${
                  config.color === "purple"
                    ? "bg-purple-600 hover:bg-purple-700"
                    : config.color === "blue"
                      ? "bg-blue-600 hover:bg-blue-700"
                      : config.color === "green"
                        ? "bg-green-600 hover:bg-green-700"
                        : "bg-amber-600 hover:bg-amber-700"
                }`}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Connexion en cours...
                  </>
                ) : (
                  `Se connecter en tant que ${
                    currentRole === "superadmin"
                      ? "super admin"
                      : currentRole === "admin"
                        ? "admin"
                        : currentRole === "deliverer"
                          ? "livreur"
                          : "prestataire"
                  }`
                )}
              </Button>
            </form>

            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <span className="font-semibold">Astuce:</span> Assurez-vous
                d'avoir selectionné le bon rôle avant de vous connecter.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-6 text-gray-600 text-sm">
          <p>© 2025 AMIGOS Delivery. Tous droits réservés.</p>
        </div>
      </div>
    </div>
  );
}
