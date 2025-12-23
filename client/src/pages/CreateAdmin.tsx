import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiService } from "@/lib/api";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Validation schema for admin creation
const createAdminSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
  confirmPassword: z.string(),
  firstName: z.string().min(2, "Le prénom est requis"),
  lastName: z.string().min(2, "Le nom est requis"),
  cityId: z.string().min(1, "Veuillez sélectionner une ville"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
});

type CreateAdminFormData = z.infer<typeof createAdminSchema>;

interface City {
  _id?: string;
  id?: string;
  name: string;
  isActive: boolean;
}

export default function CreateAdmin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [cities, setCities] = useState<City[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingCities, setLoadingCities] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
    setValue,
  } = useForm<CreateAdminFormData>({
    resolver: zodResolver(createAdminSchema),
  });

  // Fetch cities on mount
  useEffect(() => {
    const fetchCities = async () => {
      try {
        setLoadingCities(true);
        const response = await apiService.getCities();
        const citiesData = Array.isArray(response) ? response : (response.cities || []);
        
        // Normalize city data to ensure _id is set
        const normalizedCities = citiesData.map((city: any) => ({
          _id: city._id || city.id,
          id: city.id || city._id,
          name: city.name,
          isActive: city.isActive !== false,
        }));
        
        setCities(normalizedCities);
      } catch (error: any) {
        console.error("Error fetching cities:", error);
        toast({
          title: "Erreur",
          description: "Impossible de charger les villes",
          variant: "destructive",
        });
      } finally {
        setLoadingCities(false);
      }
    };

    fetchCities();
  }, [toast]);

  const onSubmit = async (data: CreateAdminFormData) => {
    try {
      setIsLoading(true);

      // Call the API to register admin
      const response = await apiService.registerAdmin({
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        cityId: data.cityId,
      });

      setSuccessMessage(
        `Admin ${data.firstName} ${data.lastName} créé avec succès!`
      );
      setShowSuccess(true);

      // Reset form
      reset();

      // Redirect after 2 seconds
      setTimeout(() => {
        setLocation("/dashboard");
      }, 2000);

      toast({
        title: "Succès",
        description: "Administrateur créé avec succès",
      });
    } catch (error: any) {
      console.error("Error creating admin:", error);
      toast({
        title: "Erreur",
        description:
          error.message ||
          "Erreur lors de la création de l'administrateur",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");

  // Only superAdmin can create admins
  if (currentUser.role !== "superAdmin") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="w-5 h-5" />
              Accès refusé
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Seul un superAdmin peut créer des administrateurs.
            </p>
            <Button
              onClick={() => setLocation("/dashboard")}
              className="w-full"
            >
              Retour au tableau de bord
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Créer un nouvel administrateur</CardTitle>
          <CardDescription>
            Remplissez le formulaire ci-dessous pour créer un nouvel administrateur
          </CardDescription>
        </CardHeader>
        <CardContent>
          {showSuccess && (
            <Alert className="mb-6 bg-green-50 border-green-200">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                {successMessage}
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Personal Information Section */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Informations personnelles</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Prénom</Label>
                  <Input
                    id="firstName"
                    placeholder="Jean"
                    {...register("firstName")}
                    disabled={isLoading}
                  />
                  {errors.firstName && (
                    <p className="text-sm text-red-500">{errors.firstName.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName">Nom</Label>
                  <Input
                    id="lastName"
                    placeholder="Dupont"
                    {...register("lastName")}
                    disabled={isLoading}
                  />
                  {errors.lastName && (
                    <p className="text-sm text-red-500">{errors.lastName.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* City Selection Section */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Affectation de ville</h3>

              <div className="space-y-2">
                <Label htmlFor="cityId">Ville</Label>
                {loadingCities ? (
                  <div className="flex items-center justify-center p-2 border rounded-md bg-gray-50">
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Chargement des villes...
                  </div>
                ) : cities.length === 0 ? (
                  <div className="flex items-center justify-center p-2 border rounded-md bg-yellow-50">
                    <p className="text-sm text-yellow-700">Aucune ville disponible</p>
                  </div>
                ) : (
                  <Select
                    value={watch("cityId") || ""}
                    onValueChange={(value) => {
                      setValue("cityId", value, { shouldValidate: true });
                    }}
                  >
                    <SelectTrigger id="cityId" disabled={isLoading || cities.length === 0}>
                      <SelectValue placeholder="Sélectionner une ville" />
                    </SelectTrigger>
                    <SelectContent>
                      {cities.map((city) => {
                        const cityId = city._id || city.id || "";
                        return (
                          <SelectItem 
                            key={cityId} 
                            value={cityId}
                          >
                            {city.name}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                )}
                {errors.cityId && (
                  <p className="text-sm text-red-500">{errors.cityId.message}</p>
                )}
              </div>
            </div>

            {/* Login Credentials Section */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Identifiants de connexion</h3>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@example.com"
                  {...register("email")}
                  disabled={isLoading}
                />
                {errors.email && (
                  <p className="text-sm text-red-500">{errors.email.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Mot de passe</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    {...register("password")}
                    disabled={isLoading}
                  />
                  {errors.password && (
                    <p className="text-sm text-red-500">{errors.password.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    {...register("confirmPassword")}
                    disabled={isLoading}
                  />
                  {errors.confirmPassword && (
                    <p className="text-sm text-red-500">
                      {errors.confirmPassword.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex gap-3 justify-end pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setLocation("/dashboard")}
                disabled={isLoading}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Création en cours...
                  </>
                ) : (
                  "Créer l'administrateur"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
