import { useState, useEffect } from "react";
import { Search, UserPlus, MapPin, Package } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiService } from "@/lib/api";

interface Deliverer {
  id: string;
  name: string;
  phone: string;
  vehicle: string;
  currentOrders: number;
  totalDeliveries: number;
  totalSolde: number;
  rating: number;
  isActive: boolean;
  location: string;
}

interface DeliverersResponse {
  deliverers: Deliverer[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface CreateDelivererForm {
  name: string;
  phone: string;
  vehicle: string;
  location: string;
}

export default function Deliverers() {
  const { toast } = useToast();
  const [deliverers, setDeliverers] = useState<Deliverer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [delivererStates, setDelivererStates] = useState<
    Record<string, boolean>
  >({});
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createForm, setCreateForm] = useState<CreateDelivererForm>({
    name: "",
    phone: "",
    vehicle: "",
    location: "",
  });

  const fetchDeliverers = async (page = 1) => {
    try {
      setLoading(true);
      const response = await apiService.getDeliverers(
        searchQuery || undefined,
        page,
        10
      );

      setDeliverers(response.deliverers);
      setTotalPages(response.totalPages);
      setCurrentPage(response.page);

      // Initialize deliverer states
      const states: Record<string, boolean> = {};
      response.deliverers.forEach((d) => {
        states[d.id] = d.isActive;
      });
      setDelivererStates(states);
    } catch (error: any) {
      console.error("Error fetching deliverers:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les livreurs",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeliverers(1);
  }, [searchQuery]);

  const handleToggleActive = async (id: string) => {
    const newState = !delivererStates[id];
    setDelivererStates((prev) => ({ ...prev, [id]: newState }));

    try {
      await apiService.updateDelivererStatus(id, newState);
    } catch (error: any) {
      console.error("Error updating deliverer status:", error);
      // Revert state if API call fails
      setDelivererStates((prev) => ({ ...prev, [id]: !newState }));

      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le statut du livreur",
        variant: "destructive",
      });
    }
  };

  const handleCreateDeliverer = async () => {
    if (
      !createForm.name ||
      !createForm.phone ||
      !createForm.vehicle ||
      !createForm.location
    ) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await apiService.createDeliverer({
        name: createForm.name,
        phone: createForm.phone,
        vehicle: createForm.vehicle,
        location: createForm.location,
      });

      toast({
        title: "Succès",
        description: response.message || "Livreur créé avec succès",
      });

      setIsCreateDialogOpen(false);
      resetCreateForm();
      fetchDeliverers(1);
    } catch (error: any) {
      console.error("Error creating deliverer:", error);
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de la création du livreur",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetCreateForm = () => {
    setCreateForm({
      name: "",
      phone: "",
      vehicle: "",
      location: "",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">Chargement...</div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold">
            Gestion des livreurs
          </h1>
          <p className="text-muted-foreground">
            Gérez votre équipe de livraison
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-deliverer">
              <UserPlus className="h-4 w-4 mr-2" />
              Nouveau livreur
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl">
                Nouveau livreur
              </DialogTitle>
              <DialogDescription>
                Ajouter un nouveau livreur à l'équipe
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-3 sm:gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="deliverer-name">Nom complet *</Label>
                <Input
                  id="deliverer-name"
                  value={createForm.name}
                  onChange={(e) =>
                    setCreateForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="Ex: Ali Bouaziz"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="deliverer-phone">Téléphone *</Label>
                <Input
                  id="deliverer-phone"
                  value={createForm.phone}
                  onChange={(e) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      phone: e.target.value,
                    }))
                  }
                  placeholder="Ex: +216 23 456 789"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="deliverer-vehicle">Véhicule *</Label>
                <Input
                  id="deliverer-vehicle"
                  value={createForm.vehicle}
                  onChange={(e) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      vehicle: e.target.value,
                    }))
                  }
                  placeholder="Ex: Moto, Voiture"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="deliverer-location">Localisation *</Label>
                <Input
                  id="deliverer-location"
                  value={createForm.location}
                  onChange={(e) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      location: e.target.value,
                    }))
                  }
                  placeholder="Ex: Centre Ville, Tunis"
                />
              </div>
            </div>
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsCreateDialogOpen(false);
                  resetCreateForm();
                }}
                className="w-full sm:w-auto"
              >
                Annuler
              </Button>
              <Button
                onClick={handleCreateDeliverer}
                disabled={isSubmitting}
                className="w-full sm:w-auto"
              >
                {isSubmitting ? "Création..." : "Créer le livreur"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Livreurs actifs</p>
              <Badge variant="secondary" className="bg-chart-2/10 text-chart-2">
                {Object.values(delivererStates).filter(Boolean).length}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">
              {Object.values(delivererStates).filter(Boolean).length} /{" "}
              {deliverers.length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <p className="text-sm text-muted-foreground">Commandes en cours</p>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">
              {deliverers.reduce((sum, d) => sum + d.currentOrders, 0)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Solde total des livreurs
              </p>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-chart-2">
              {deliverers
                .reduce((sum, d) => sum + (Number(d.totalSolde) || 0), 0)
                .toFixed(3)}{" "}
              DT
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <p className="text-sm text-muted-foreground">Note moyenne</p>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">
              {(
                deliverers.reduce((sum, d) => sum + d.rating, 0) /
                deliverers.length
              ).toFixed(1)}{" "}
              ⭐
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par nom, téléphone ou localisation..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
              data-testid="input-search-deliverers"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {deliverers.length > 0 ? (
              deliverers.map((deliverer) => (
                <div
                  key={deliverer.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 rounded-lg border hover-elevate gap-4"
                  data-testid={`deliverer-row-${deliverer.id}`}
                >
                  <div className="flex items-center gap-3 sm:gap-4">
                    <Avatar className="flex-shrink-0">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {deliverer.name
                          .split(" ")
                          .map((n: string) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{deliverer.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {deliverer.phone}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-1">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{deliverer.location}</span>
                        </span>
                        <span className="text-xs text-muted-foreground truncate">
                          {deliverer.vehicle}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-6">
                    <div className="flex items-center gap-4 sm:gap-6">
                      <div className="text-center">
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          En cours
                        </p>
                        <div className="flex items-center gap-1 justify-center">
                          <Package className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                          <p className="text-base sm:text-lg font-semibold">
                            {deliverer.currentOrders}
                          </p>
                        </div>
                      </div>
                      <div className="text-center">
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          Livraisons
                        </p>
                        <p className="text-base sm:text-lg font-semibold">
                          {deliverer.totalDeliveries}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          Solde
                        </p>
                        <p className="text-base sm:text-lg font-semibold text-chart-2">
                          {deliverer.totalSolde || "0.000 DT"}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          Note
                        </p>
                        <p className="text-base sm:text-lg font-semibold">
                          {deliverer.rating} ⭐
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 justify-center sm:justify-start">
                      <span className="text-xs sm:text-sm text-muted-foreground">
                        {delivererStates[deliverer.id] ? "Actif" : "Inactif"}
                      </span>
                      <Switch
                        checked={delivererStates[deliverer.id] || false}
                        onCheckedChange={() => handleToggleActive(deliverer.id)}
                        data-testid={`switch-active-${deliverer.id}`}
                      />
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-center py-4">
                Aucun livreur trouvé
              </p>
            )}
          </div>

          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row justify-center items-center gap-2 sm:gap-4 mt-4">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchDeliverers(currentPage - 1)}
                  disabled={currentPage <= 1}
                  className="px-3 py-2"
                >
                  Précédent
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchDeliverers(currentPage + 1)}
                  disabled={currentPage >= totalPages}
                  className="px-3 py-2"
                >
                  Suivant
                </Button>
              </div>
              <span className="flex items-center px-3 text-sm text-muted-foreground">
                Page {currentPage} sur {totalPages}
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
