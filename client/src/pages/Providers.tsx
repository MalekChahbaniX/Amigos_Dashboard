import { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  Store,
  Pill,
  ShoppingCart,
  Eye,
  Pencil,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { apiService } from '@/lib/api';

const typeIcons = {
  restaurant: Store,
  course: ShoppingCart,
  pharmacy: Pill,
};

const typeLabels = {
  restaurant: 'Restaurants',
  course: 'Supermarchés',
  pharmacy: 'Pharmacies',
};

interface Provider {
  id: string;
  name: string;
  type: 'restaurant' | 'course' | 'pharmacy';
  category: string;
  phone: string;
  address: string;
  totalOrders: number;
  rating: number;
  status: 'active' | 'inactive';
}

interface CreateProviderForm {
  name: string;
  type: 'restaurant' | 'course' | 'pharmacy';
  phone: string;
  address: string;
  email: string;
  description: string;
}

export default function Providers() {
  const { toast } = useToast();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createForm, setCreateForm] = useState<CreateProviderForm>({
    name: '',
    type: 'restaurant',
    phone: '',
    address: '',
    email: '',
    description: '',
  });

  useEffect(() => {
    fetchProviders();
  }, []);

  const fetchProviders = async () => {
    try {
      setLoading(true);
      const response = await apiService.getProviders(
        activeTab !== 'all' ? activeTab : undefined,
        searchQuery || undefined,
      );
      // Ensure we have a valid response with providers array
      setProviders(response?.providers || []);
    } catch (error: any) {
      console.error('Error fetching providers:', error);
      setProviders([]); // Set empty array on error
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les prestataires',
        variant: 'destructive',
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
        title: 'Erreur',
        description: 'Veuillez remplir tous les champs obligatoires',
        variant: 'destructive',
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
        title: 'Succès',
        description: response.message || 'Prestataire créé avec succès',
      });

      setIsCreateDialogOpen(false);
      resetCreateForm();
      fetchProviders();
    } catch (error: any) {
      console.error('Error creating provider:', error);
      toast({
        title: 'Erreur',
        description:
          error.message || 'Erreur lors de la création du prestataire',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetCreateForm = () => {
    setCreateForm({
      name: '',
      type: 'restaurant',
      phone: '',
      address: '',
      email: '',
      description: '',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">Chargement...</div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 xs:px-6 sm:px-8 py-4 xs:py-6 sm:py-8">
        <div className="space-y-4 xs:space-y-6 sm:space-y-8">
          <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-3 xs:gap-4 sm:gap-6">
            <div className="min-w-0 flex-1">
              <h1 className="text-xl xs:text-2xl sm:text-3xl lg:text-4xl font-semibold leading-tight">
                Gestion des prestataires
              </h1>
              <p className="text-sm xs:text-base text-muted-foreground mt-1">
                Gérez vos partenaires commerciaux
              </p>
            </div>
            <Dialog
              open={isCreateDialogOpen}
              onOpenChange={setIsCreateDialogOpen}
            >
              <DialogTrigger asChild>
                <Button data-testid="button-add-provider">
                  <Plus className="h-4 w-4 mr-2" />
                  Nouveau prestataire
                </Button>
              </DialogTrigger>
              <DialogContent className="w-[95vw] xs:w-[90vw] sm:max-w-[425px] max-h-[85vh] xs:max-h-[90vh] overflow-y-auto mx-4 xs:mx-auto">
                <DialogHeader className="space-y-2 xs:space-y-3 pb-2">
                  <DialogTitle className="text-lg xs:text-xl sm:text-2xl leading-tight">
                    Nouveau prestataire
                  </DialogTitle>
                  <DialogDescription className="text-sm xs:text-base">
                    Ajouter un nouveau prestataire partenaire
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-3 xs:gap-4 py-2 xs:py-4 space-y-4">
                  <div className="grid gap-2 xs:gap-3">
                    <Label
                      htmlFor="provider-name"
                      className="text-sm xs:text-base font-medium"
                    >
                      Nom du prestataire *
                    </Label>
                    <Input
                      id="provider-name"
                      value={createForm.name}
                      onChange={e =>
                        setCreateForm(prev => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      placeholder="Ex: Pizza House"
                      className="min-h-[44px] xs:min-h-[40px] text-sm xs:text-base"
                    />
                  </div>
                  <div className="grid gap-2 xs:gap-3">
                    <Label
                      htmlFor="provider-type"
                      className="text-sm xs:text-base font-medium"
                    >
                      Type *
                    </Label>
                    <Select
                      value={createForm.type}
                      onValueChange={(value: any) =>
                        setCreateForm(prev => ({ ...prev, type: value }))
                      }
                    >
                      <SelectTrigger className="min-h-[44px] xs:min-h-[40px] text-sm xs:text-base">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="restaurant">Restaurant</SelectItem>
                        <SelectItem value="course">Supermarché</SelectItem>
                        <SelectItem value="pharmacy">Pharmacie</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2 xs:gap-3">
                    <Label
                      htmlFor="provider-phone"
                      className="text-sm xs:text-base font-medium"
                    >
                      Téléphone *
                    </Label>
                    <Input
                      id="provider-phone"
                      value={createForm.phone}
                      onChange={e =>
                        setCreateForm(prev => ({
                          ...prev,
                          phone: e.target.value,
                        }))
                      }
                      placeholder="Ex: +216 71 123 456"
                      className="min-h-[44px] xs:min-h-[40px] text-sm xs:text-base"
                    />
                  </div>
                  <div className="grid gap-2 xs:gap-3">
                    <Label
                      htmlFor="provider-address"
                      className="text-sm xs:text-base font-medium"
                    >
                      Adresse *
                    </Label>
                    <Input
                      id="provider-address"
                      value={createForm.address}
                      onChange={e =>
                        setCreateForm(prev => ({
                          ...prev,
                          address: e.target.value,
                        }))
                      }
                      placeholder="Ex: 25 Avenue Habib Bourguiba, Tunis"
                      className="min-h-[44px] xs:min-h-[40px] text-sm xs:text-base"
                    />
                  </div>
                  <div className="grid gap-2 xs:gap-3">
                    <Label
                      htmlFor="provider-email"
                      className="text-sm xs:text-base font-medium"
                    >
                      Email
                    </Label>
                    <Input
                      id="provider-email"
                      type="email"
                      value={createForm.email}
                      onChange={e =>
                        setCreateForm(prev => ({
                          ...prev,
                          email: e.target.value,
                        }))
                      }
                      placeholder="contact@pizzahouse.tn"
                      className="min-h-[44px] xs:min-h-[40px] text-sm xs:text-base"
                    />
                  </div>
                  <div className="grid gap-2 xs:gap-3">
                    <Label
                      htmlFor="provider-description"
                      className="text-sm xs:text-base font-medium"
                    >
                      Description
                    </Label>
                    <Textarea
                      id="provider-description"
                      value={createForm.description}
                      onChange={e =>
                        setCreateForm(prev => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                      placeholder="Description du prestataire..."
                      className="min-h-[100px] xs:min-h-[120px] text-sm xs:text-base resize-none"
                    />
                  </div>
                </div>
                <div className="flex flex-col-reverse xs:flex-row justify-end gap-2 xs:gap-3 pt-4 xs:pt-6">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsCreateDialogOpen(false);
                      resetCreateForm();
                    }}
                    className="w-full xs:w-auto min-h-[44px] xs:min-h-[40px] sm:min-h-[36px] text-sm xs:text-base px-4 xs:px-6"
                    disabled={isSubmitting}
                  >
                    Annuler
                  </Button>
                  <Button
                    onClick={handleCreateProvider}
                    disabled={isSubmitting}
                    className="w-full xs:w-auto min-h-[44px] xs:min-h-[40px] sm:min-h-[36px] text-sm xs:text-base px-4 xs:px-6 touch-manipulation"
                  >
                    {isSubmitting ? 'Création...' : 'Créer le prestataire'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList
                className="
      flex flex-wrap justify-center gap-2 sm:gap-3 bg-muted/40 
      rounded-xl p-2 sm:p-3 w-full
    "
              >
                {[
                  { value: 'all', label: 'Tous' },
                  { value: 'restaurant', label: 'Restaurants' },
                  { value: 'course', label: 'Supermarchés' },
                  { value: 'pharmacy', label: 'Pharmacies' },
                ].map(tab => (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className={`
          text-sm sm:text-base font-medium transition-all 
          px-4 py-2 sm:px-5 sm:py-2.5 rounded-lg border border-transparent
          data-[state=active]:bg-primary data-[state=active]:text-white 
          data-[state=active]:shadow-sm hover:bg-primary/10 hover:text-primary
        `}
                  >
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>

              <TabsContent value={activeTab} className="mt-6">
                {/* ton contenu de prestataires ici */}
              </TabsContent>
            </Tabs>

            <TabsContent value={activeTab} className="mt-6">
              <Card>
                <CardHeader>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Rechercher un prestataire..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="pl-9"
                      data-testid="input-search-providers"
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  {/* <div className="flex justify-center mb-6">
    <div className="relative w-full sm:max-w-md">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder="Rechercher un prestataire..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="pl-9 w-full"
      />
    </div>
  </div> */}

                  {providers && providers.length > 0 ? (
                    <div className="grid gap-4 sm:gap-5 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                      {providers.map(provider => {
                        const Icon =
                          typeIcons[provider.type as keyof typeof typeIcons] ||
                          Store;
                        return (
                          <Card
                            key={provider.id}
                            className="p-4 sm:p-5 flex flex-col justify-between border hover:shadow-md transition-shadow"
                          >
                            <div className="flex items-center gap-3 sm:gap-4 mb-3">
                              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                                <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                              </div>
                              <div className="min-w-0">
                                <h3 className="font-semibold text-base sm:text-lg truncate">
                                  {provider.name}
                                </h3>
                                <p className="text-xs sm:text-sm text-muted-foreground truncate">
                                  {provider.address}
                                </p>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center mb-4">
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">
                                  Type
                                </p>
                                <Badge
                                  variant="secondary"
                                  className="text-xs px-2 py-0.5"
                                >
                                  {
                                    typeLabels[
                                      provider.type as keyof typeof typeLabels
                                    ]
                                  }
                                </Badge>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">
                                  Commandes
                                </p>
                                <p className="font-semibold">
                                  {provider.totalOrders || 0}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">
                                  Note
                                </p>
                                <p className="font-semibold">
                                  {provider.rating
                                    ? `${provider.rating} ⭐`
                                    : 'N/A'}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">
                                  Statut
                                </p>
                                <Badge
                                  className={`text-xs px-2 py-0.5 ${
                                    provider.status === 'active'
                                      ? 'bg-green-100 text-green-700'
                                      : 'bg-gray-200 text-gray-600'
                                  }`}
                                >
                                  {provider.status === 'active'
                                    ? 'Actif'
                                    : 'Inactif'}
                                </Badge>
                              </div>
                            </div>

                            <div className="flex justify-center sm:justify-end gap-2">
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 sm:h-9 sm:w-9"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 sm:h-9 sm:w-9"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-8 text-sm sm:text-base">
                      Aucun prestataire trouvé
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
