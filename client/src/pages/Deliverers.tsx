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

interface Deliverer {
  id: string;
  name: string;
  phone: string;
  vehicle: string;
  currentOrders: number;
  totalDeliveries: number;
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
  const [deliverers, setDeliverers] = useState<Deliverer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [delivererStates, setDelivererStates] = useState<Record<string, boolean>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createForm, setCreateForm] = useState<CreateDelivererForm>({
    name: "",
    phone: "",
    vehicle: "",
    location: ""
  });

  const fetchDeliverers = async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        ...(searchQuery && { search: searchQuery })
      });

      const response = await fetch(`/api/deliverers?${params}`);
      if (response.ok) {
        const data: DeliverersResponse = await response.json();
        setDeliverers(data.deliverers);
        setTotalPages(data.totalPages);
        setCurrentPage(data.page);

        // Initialize deliverer states
        const states: Record<string, boolean> = {};
        data.deliverers.forEach(d => {
          states[d.id] = d.isActive;
        });
        setDelivererStates(states);
      }
    } catch (error) {
      console.error('Error fetching deliverers:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeliverers(1);
  }, [searchQuery]);

  const handleToggleActive = async (id: string) => {
    const newState = !delivererStates[id];
    setDelivererStates(prev => ({ ...prev, [id]: newState }));

    try {
      const response = await fetch(`/api/deliverers/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isAvailable: newState }),
      });

      if (!response.ok) {
        // Revert state if API call fails
        setDelivererStates(prev => ({ ...prev, [id]: !newState }));
      }
    } catch (error) {
      console.error('Error updating deliverer status:', error);
      // Revert state if API call fails
      setDelivererStates(prev => ({ ...prev, [id]: !newState }));
    }
  };

  const handleCreateDeliverer = async () => {
    if (!createForm.name || !createForm.phone || !createForm.vehicle || !createForm.location) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setIsSubmitting(true);
    try {
      const delivererData = {
        name: createForm.name,
        phone: createForm.phone,
        vehicle: createForm.vehicle,
        location: createForm.location,
        userId: "1" // TODO: Get from authenticated user
      };

      const response = await fetch('/api/deliverers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(delivererData),
      });

      if (response.ok) {
        setIsCreateDialogOpen(false);
        setCreateForm({
          name: "",
          phone: "",
          vehicle: "",
          location: ""
        });
        fetchDeliverers(1);
      } else {
        alert('Erreur lors de la création du livreur');
      }
    } catch (error) {
      console.error('Error creating deliverer:', error);
      alert('Erreur lors de la création du livreur');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetCreateForm = () => {
    setCreateForm({
      name: "",
      phone: "",
      vehicle: "",
      location: ""
    });
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Gestion des livreurs</h1>
          <p className="text-muted-foreground">Gérez votre équipe de livraison</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-deliverer">
              <UserPlus className="h-4 w-4 mr-2" />
              Nouveau livreur
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Nouveau livreur</DialogTitle>
              <DialogDescription>
                Ajouter un nouveau livreur à l'équipe
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="deliverer-name">Nom complet *</Label>
                <Input
                  id="deliverer-name"
                  value={createForm.name}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: Ali Bouaziz"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="deliverer-phone">Téléphone *</Label>
                <Input
                  id="deliverer-phone"
                  value={createForm.phone}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="Ex: +216 23 456 789"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="deliverer-vehicle">Véhicule *</Label>
                <Input
                  id="deliverer-vehicle"
                  value={createForm.vehicle}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, vehicle: e.target.value }))}
                  placeholder="Ex: Moto, Voiture"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="deliverer-location">Localisation *</Label>
                <Input
                  id="deliverer-location"
                  value={createForm.location}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="Ex: Centre Ville, Tunis"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsCreateDialogOpen(false);
                  resetCreateForm();
                }}
              >
                Annuler
              </Button>
              <Button onClick={handleCreateDeliverer} disabled={isSubmitting}>
                {isSubmitting ? 'Création...' : 'Créer le livreur'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
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
              {Object.values(delivererStates).filter(Boolean).length} / {deliverers.length}
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
            <p className="text-sm text-muted-foreground">Note moyenne</p>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">
              {(deliverers.reduce((sum, d) => sum + d.rating, 0) / deliverers.length).toFixed(1)} ⭐
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
            {deliverers.length > 0 ? deliverers.map((deliverer) => (
              <div
                key={deliverer.id}
                className="flex items-center justify-between p-4 rounded-lg border hover-elevate"
                data-testid={`deliverer-row-${deliverer.id}`}
              >
                <div className="flex items-center gap-4">
                  <Avatar>
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {deliverer.name.split(' ').map((n: string) => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{deliverer.name}</p>
                    <p className="text-sm text-muted-foreground">{deliverer.phone}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {deliverer.location}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {deliverer.vehicle}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">En cours</p>
                    <div className="flex items-center gap-1">
                      <Package className="h-4 w-4 text-primary" />
                      <p className="text-lg font-semibold">{deliverer.currentOrders}</p>
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Livraisons</p>
                    <p className="text-lg font-semibold">{deliverer.totalDeliveries}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Note</p>
                    <p className="text-lg font-semibold">{deliverer.rating} ⭐</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {delivererStates[deliverer.id] ? 'Actif' : 'Inactif'}
                    </span>
                    <Switch
                      checked={delivererStates[deliverer.id] || false}
                      onCheckedChange={() => handleToggleActive(deliverer.id)}
                      data-testid={`switch-active-${deliverer.id}`}
                    />
                  </div>
                </div>
              </div>
            )) : (
              <p className="text-muted-foreground text-center py-4">Aucun livreur trouvé</p>
            )}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              <Button
                variant="outline"
                onClick={() => fetchDeliverers(currentPage - 1)}
                disabled={currentPage <= 1}
              >
                Précédent
              </Button>
              <span className="flex items-center px-3">
                Page {currentPage} sur {totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => fetchDeliverers(currentPage + 1)}
                disabled={currentPage >= totalPages}
              >
                Suivant
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
