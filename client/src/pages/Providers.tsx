import { useState, useEffect } from "react";
import { Search, Plus, Store, Pill, ShoppingCart, Eye, Pencil } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiService } from "@/lib/api";

// TODO: Remove mock data
const providers = [
  { 
    id: "1", 
    name: "Pizza House", 
    type: "restaurant" as const,
    category: "Fast Food",
    phone: "+216 71 123 456",
    address: "25 Avenue Habib Bourguiba, Tunis",
    totalOrders: 234, 
    rating: 4.5,
    status: "active" as const
  },
  { 
    id: "2", 
    name: "Carrefour Express", 
    type: "grocery" as const,
    category: "Supermarché",
    phone: "+216 71 234 567",
    address: "10 Rue de Marseille, Tunis",
    totalOrders: 567, 
    rating: 4.2,
    status: "active" as const
  },
  { 
    id: "3", 
    name: "Pharmacie Centrale", 
    type: "pharmacy" as const,
    category: "Pharmacie",
    phone: "+216 71 345 678",
    address: "5 Avenue de Paris, Tunis",
    totalOrders: 123, 
    rating: 4.8,
    status: "active" as const
  },
  { 
    id: "4", 
    name: "Burger King", 
    type: "restaurant" as const,
    category: "Fast Food",
    phone: "+216 71 456 789",
    address: "15 Avenue Mohamed V, Tunis",
    totalOrders: 445, 
    rating: 4.3,
    status: "active" as const
  },
  { 
    id: "5", 
    name: "Monoprix", 
    type: "grocery" as const,
    category: "Supermarché",
    phone: "+216 71 567 890",
    address: "20 Rue de Rome, Tunis",
    totalOrders: 389, 
    rating: 4.1,
    status: "inactive" as const
  },
];

const typeIcons = {
  restaurant: Store,
  grocery: ShoppingCart,
  pharmacy: Pill,
};

const typeLabels = {
  restaurant: "Restaurants",
  grocery: "Supermarchés",
  pharmacy: "Pharmacies",
};

interface Provider {
  id: string;
  name: string;
  type: "restaurant" | "grocery" | "pharmacy";
  category: string;
  phone: string;
  address: string;
  totalOrders: number;
  rating: number;
  status: "active" | "inactive";
}

interface CreateProviderForm {
  name: string;
  type: "restaurant" | "grocery" | "pharmacy";
  phone: string;
  address: string;
  email: string;
  description: string;
}

export default function Providers() {
  const { toast } = useToast();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createForm, setCreateForm] = useState<CreateProviderForm>({
    name: "",
    type: "restaurant",
    phone: "",
    address: "",
    email: "",
    description: ""
  });

  useEffect(() => {
    fetchProviders();
  }, []);

  const fetchProviders = async () => {
    try {
      setLoading(true);
      const response = await apiService.getProviders(
        activeTab !== "all" ? activeTab : undefined,
        searchQuery || undefined
      );
      setProviders(response.providers);
    } catch (error: any) {
      console.error('Error fetching providers:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les prestataires",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProviders();
  }, [activeTab, searchQuery]);

  const handleCreateProvider = async () => {
    if (!createForm.name || !createForm.phone || !createForm.address) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await apiService.createProvider({
        name: createForm.name,
        type: createForm.type,
        phone: createForm.phone,
        address: createForm.address,
        email: createForm.email || undefined,
        description: createForm.description || undefined,
      });

      toast({
        title: "Succès",
        description: response.message || "Prestataire créé avec succès",
      });

      setIsCreateDialogOpen(false);
      resetCreateForm();
      fetchProviders();
    } catch (error: any) {
      console.error('Error creating provider:', error);
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de la création du prestataire",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetCreateForm = () => {
    setCreateForm({
      name: "",
      type: "restaurant",
      phone: "",
      address: "",
      email: "",
      description: ""
    });
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Gestion des prestataires</h1>
          <p className="text-muted-foreground">Gérez vos partenaires commerciaux</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-provider">
              <Plus className="h-4 w-4 mr-2" />
              Nouveau prestataire
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Nouveau prestataire</DialogTitle>
              <DialogDescription>
                Ajouter un nouveau prestataire partenaire
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="provider-name">Nom du prestataire *</Label>
                <Input
                  id="provider-name"
                  value={createForm.name}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: Pizza House"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="provider-type">Type *</Label>
                <Select value={createForm.type} onValueChange={(value: any) => setCreateForm(prev => ({ ...prev, type: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="restaurant">Restaurant</SelectItem>
                    <SelectItem value="grocery">Supermarché</SelectItem>
                    <SelectItem value="pharmacy">Pharmacie</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="provider-phone">Téléphone *</Label>
                <Input
                  id="provider-phone"
                  value={createForm.phone}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="Ex: +216 71 123 456"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="provider-address">Adresse *</Label>
                <Input
                  id="provider-address"
                  value={createForm.address}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Ex: 25 Avenue Habib Bourguiba, Tunis"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="provider-email">Email</Label>
                <Input
                  id="provider-email"
                  type="email"
                  value={createForm.email}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="contact@pizzahouse.tn"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="provider-description">Description</Label>
                <Textarea
                  id="provider-description"
                  value={createForm.description}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Description du prestataire..."
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
              <Button onClick={handleCreateProvider} disabled={isSubmitting}>
                {isSubmitting ? 'Création...' : 'Créer le prestataire'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full md:w-auto grid-cols-4 gap-2">
          <TabsTrigger value="all" data-testid="tab-all">Tous</TabsTrigger>
          <TabsTrigger value="restaurant" data-testid="tab-restaurant">Restaurants</TabsTrigger>
          <TabsTrigger value="grocery" data-testid="tab-grocery">Supermarchés</TabsTrigger>
          <TabsTrigger value="pharmacy" data-testid="tab-pharmacy">Pharmacies</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          <Card>
            <CardHeader>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un prestataire..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                  data-testid="input-search-providers"
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(providers && providers.length > 0) ? providers.map((provider) => {
                  const Icon = typeIcons[provider.type as keyof typeof typeIcons];
                  return (
                    <div
                      key={provider.id}
                      className="flex items-center justify-between p-4 rounded-lg border hover-elevate"
                      data-testid={`provider-row-${provider.id}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Icon className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{provider.name}</p>
                          <p className="text-sm text-muted-foreground">{provider.category}</p>
                          <p className="text-sm text-muted-foreground">{provider.address}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground">Type</p>
                          <Badge variant="secondary">
                            {typeLabels[provider.type as keyof typeof typeLabels]}
                          </Badge>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground">Commandes</p>
                          <p className="text-lg font-semibold">{provider.totalOrders}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground">Note</p>
                          <p className="text-lg font-semibold">{provider.rating} ⭐</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground">Statut</p>
                          <Badge
                            variant="secondary"
                            className={provider.status === 'active'
                              ? 'bg-chart-2/10 text-chart-2'
                              : 'bg-muted text-muted-foreground'
                            }
                          >
                            {provider.status === 'active' ? 'Actif' : 'Inactif'}
                          </Badge>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            data-testid={`button-view-${provider.id}`}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            data-testid={`button-edit-${provider.id}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                }) : (
                  <p className="text-muted-foreground text-center py-4">Aucun prestataire trouvé</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
