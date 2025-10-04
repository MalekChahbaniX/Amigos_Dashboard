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

// TODO: Remove mock data
const clients = [
  { 
    id: "1", 
    name: "Ahmed Ben Ali", 
    phone: "+216 98 765 432",
    email: "ahmed.benali@email.com",
    totalOrders: 45, 
    totalSpent: "1,245.50 DT",
    status: "active" as const,
    joinDate: "15/01/2025"
  },
  { 
    id: "2", 
    name: "Sara Mansour", 
    phone: "+216 22 123 456",
    email: "sara.mansour@email.com",
    totalOrders: 32, 
    totalSpent: "890.00 DT",
    status: "active" as const,
    joinDate: "20/02/2025"
  },
  { 
    id: "3", 
    name: "Mohamed Triki", 
    phone: "+216 55 987 654",
    email: "m.triki@email.com",
    totalOrders: 18, 
    totalSpent: "456.80 DT",
    status: "active" as const,
    joinDate: "05/03/2025"
  },
  { 
    id: "4", 
    name: "Leila Hamdi", 
    phone: "+216 29 456 789",
    email: "leila.h@email.com",
    totalOrders: 8, 
    totalSpent: "234.50 DT",
    status: "inactive" as const,
    joinDate: "12/08/2025"
  },
  { 
    id: "5", 
    name: "Karim Jebali", 
    phone: "+216 97 321 654",
    email: "karim.jebali@email.com",
    totalOrders: 67, 
    totalSpent: "2,345.20 DT",
    status: "active" as const,
    joinDate: "08/12/2024"
  },
];

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
      const params = new URLSearchParams({
        ...(searchQuery && { search: searchQuery })
      });

      const response = await fetch(`/api/clients?${params}`);
      if (response.ok) {
        const data = await response.json();
        setClients(data.clients || []);
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, [searchQuery]);

  const handleCreateClient = async () => {
    if (!createForm.name || !createForm.phone || !createForm.email) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setIsSubmitting(true);
    try {
      const clientData = {
        name: createForm.name,
        phone: createForm.phone,
        email: createForm.email,
        address: createForm.address,
        userId: "1" // TODO: Get from authenticated user
      };

      const response = await fetch('/api/clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(clientData),
      });

      if (response.ok) {
        setIsCreateDialogOpen(false);
        setCreateForm({
          name: "",
          phone: "",
          email: "",
          address: ""
        });
        fetchClients();
      } else {
        alert('Erreur lors de la création du client');
      }
    } catch (error) {
      console.error('Error creating client:', error);
      alert('Erreur lors de la création du client');
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Gestion des clients</h1>
          <p className="text-muted-foreground">Gérez votre base de clients</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-client">
              <UserPlus className="h-4 w-4 mr-2" />
              Nouveau client
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Nouveau client</DialogTitle>
              <DialogDescription>
                Ajouter un nouveau client à la base de données
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
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
              <Button onClick={handleCreateClient} disabled={isSubmitting}>
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
                className="flex items-center justify-between p-4 rounded-lg border hover-elevate"
                data-testid={`client-row-${client.id}`}
              >
                <div className="flex items-center gap-4">
                  <Avatar>
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {client.name.split(' ').map((n: string) => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{client.name}</p>
                    <p className="text-sm text-muted-foreground">{client.email}</p>
                    <p className="text-sm text-muted-foreground">{client.phone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Commandes</p>
                    <p className="text-lg font-semibold">{client.totalOrders}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Total dépensé</p>
                    <p className="text-lg font-semibold">{client.totalSpent}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Statut</p>
                    <Badge
                      variant="secondary"
                      className={client.status === 'active'
                        ? 'bg-chart-2/10 text-chart-2'
                        : 'bg-muted text-muted-foreground'
                      }
                    >
                      {client.status === 'active' ? 'Actif' : 'Inactif'}
                    </Badge>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      data-testid={`button-view-${client.id}`}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      data-testid={`button-toggle-status-${client.id}`}
                    >
                      {client.status === 'active' ? (
                        <Ban className="h-4 w-4 text-destructive" />
                      ) : (
                        <Check className="h-4 w-4 text-chart-2" />
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
