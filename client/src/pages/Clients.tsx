import { useState, useEffect } from "react";
import { Search, UserPlus, Eye, Ban, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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

interface Client {
  id: string;
  name: string;
  phone: string;
  email: string;
  totalOrders: number;
  totalSpent: string;
  status: "active" | "inactive";
  joinDate: string;
}

interface Client {
  id: string;
  name: string;
  phone: string;
  email: string;
  totalOrders: number;
  totalSpent: string;
  status: "active" | "inactive";
  joinDate: string;
}

interface CreateClientForm {
  name: string;
  phone: string;
  email: string;
  address: string;
}

export default function Clients() {
  const { toast } = useToast();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createForm, setCreateForm] = useState<CreateClientForm>({
    name: "",
    phone: "",
    email: "",
    address: ""
  });

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const response = await apiService.getClients(searchQuery || undefined);
      setClients(response.clients);
    } catch (error: any) {
      console.error('Error fetching clients:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les clients",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, [searchQuery]);

  const handleCreateClient = async () => {
    if (!createForm.name || !createForm.phone || !createForm.email) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await apiService.createClient({
        name: createForm.name,
        phone: createForm.phone,
        email: createForm.email,
        address: createForm.address || undefined,
      });

      toast({
        title: "Succès",
        description: response.message || "Client créé avec succès",
      });

      setIsCreateDialogOpen(false);
      resetCreateForm();
      fetchClients();
    } catch (error: any) {
      console.error('Error creating client:', error);
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de la création du client",
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
      email: "",
      address: ""
    });
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold">Gestion des clients</h1>
          <p className="text-muted-foreground">Gérez votre base de clients</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-client">
              <UserPlus className="h-4 w-4 mr-2" />
              Nouveau client
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl">Nouveau client</DialogTitle>
              <DialogDescription>
                Ajouter un nouveau client à la base de données
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-3 sm:gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="client-name">Nom complet *</Label>
                <Input
                  id="client-name"
                  value={createForm.name}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: Ahmed Ben Ali"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="client-phone">Téléphone *</Label>
                <Input
                  id="client-phone"
                  value={createForm.phone}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="Ex: +216 98 765 432"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="client-email">Email *</Label>
                <Input
                  id="client-email"
                  type="email"
                  value={createForm.email}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="ahmed.benali@email.com"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="client-address">Adresse</Label>
                <Input
                  id="client-address"
                  value={createForm.address}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="15 Avenue Habib Bourguiba, Tunis"
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
                onClick={handleCreateClient}
                disabled={isSubmitting}
                className="w-full sm:w-auto"
              >
                {isSubmitting ? 'Création...' : 'Créer le client'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par nom, téléphone ou email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
              data-testid="input-search-clients"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {clients.length > 0 ? clients.map((client) => (
              <div
                key={client.id}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 rounded-lg border hover-elevate gap-4"
                data-testid={`client-row-${client.id}`}
              >
                <div className="flex items-center gap-3 sm:gap-4">
                  <Avatar className="flex-shrink-0">
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {client.name.split(' ').map((n: string) => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">{client.name}</p>
                    <p className="text-sm text-muted-foreground truncate">{client.email}</p>
                    <p className="text-sm text-muted-foreground">{client.phone}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-6">
                  <div className="flex items-center gap-4 sm:gap-6">
                    <div className="text-center">
                      <p className="text-xs sm:text-sm text-muted-foreground">Commandes</p>
                      <p className="text-base sm:text-lg font-semibold">{client.totalOrders}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs sm:text-sm text-muted-foreground">Total dépensé</p>
                      <p className="text-base sm:text-lg font-semibold">{client.totalSpent}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs sm:text-sm text-muted-foreground">Statut</p>
                      <Badge
                        variant="secondary"
                        className={`text-xs ${client.status === 'active'
                          ? 'bg-chart-2/10 text-chart-2'
                          : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {client.status === 'active' ? 'Actif' : 'Inactif'}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 sm:h-10 sm:w-10"
                      data-testid={`button-view-${client.id}`}
                    >
                      <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 sm:h-10 sm:w-10"
                      data-testid={`button-toggle-status-${client.id}`}
                    >
                      {client.status === 'active' ? (
                        <Ban className="h-3 w-3 sm:h-4 sm:w-4 text-destructive" />
                      ) : (
                        <Check className="h-3 w-3 sm:h-4 sm:w-4 text-chart-2" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            )) : (
              <p className="text-muted-foreground text-center py-4">Aucun client trouvé</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
