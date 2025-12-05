import { useState, useEffect, useRef } from 'react';
import {
  Search,
  Plus,
  Store,
  Pill,
  ShoppingCart,
  Eye,
  Pencil,
  Trash2,
  MapPin, // Nouvelle icône pour la localisation
  ImageIcon,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
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

// Imports pour la carte (Leaflet)
// Assurez-vous d'avoir installé react-leaflet et leaflet
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Correction pour les icônes Leaflet par défaut qui peuvent ne pas s'afficher
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

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
  image?: string;
  location?: { // Ajout de la localisation dans l'interface
    latitude: number;
    longitude: number;
    address?: string;
  };
}

// Composant interne pour sélectionner la position sur la carte
function LocationPicker({ position, onLocationSelect }: { position: [number, number] | null, onLocationSelect: (lat: number, lng: number) => void }) {
  const map = useMapEvents({
    click(e) {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });

  useEffect(() => {
    if (position) {
      map.flyTo(position, map.getZoom());
    }
  }, [position, map]);

  return position === null ? null : (
    <Marker position={position} />
  );
}

export default function Providers() {
  const { toast } = useToast();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);

  // État pour le formulaire de création
  const [createForm, setCreateForm] = useState({
    name: '',
    type: 'restaurant' as 'restaurant' | 'course' | 'pharmacy',
    phone: '',
    address: '',
    email: '',
    description: '',
    image: '',
    imageFile: undefined as File | undefined,
    imageType: 'url' as 'url' | 'file',
    latitude: 36.8065, // Tunis par défaut
    longitude: 10.1815,
  });

  // État pour le formulaire d'édition
  const [editForm, setEditForm] = useState({
    name: '',
    type: 'restaurant' as 'restaurant' | 'course' | 'pharmacy',
    phone: '',
    address: '',
    email: '',
    description: '',
    image: '',
    imageFile: undefined as File | undefined,
    imageType: 'url' as 'url' | 'file',
    latitude: 36.8065,
    longitude: 10.1815,
  });

  useEffect(() => {
    fetchProviders();
  }, []);

  useEffect(() => {
    fetchProviders();
  }, [activeTab, searchQuery]);

  const fetchProviders = async () => {
    try {
      setLoading(true);
      const response = await apiService.getProviders(
        activeTab !== 'all' ? activeTab as 'restaurant' | 'course' | 'pharmacy' | undefined : undefined,
        searchQuery || undefined
      );
      setProviders(response?.providers || []);
    } catch (error: any) {
      console.error('Error fetching providers:', error);
      setProviders([]);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les prestataires',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

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
        image: createForm.image || undefined,
        imageFile: createForm.imageFile,
        location: {
          latitude: createForm.latitude,
          longitude: createForm.longitude,
          address: createForm.address
        }
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
        description: error.message || 'Erreur lors de la création du prestataire',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetCreateForm = () => {
    setCreateForm({
      name: '',
      type: 'restaurant' as 'restaurant' | 'course' | 'pharmacy',
      phone: '',
      address: '',
      email: '',
      description: '',
      image: '',
      imageFile: undefined,
      imageType: 'url' as 'url' | 'file',
      latitude: 36.8065,
      longitude: 10.1815,
    });
  };

  const handleViewProvider = async (provider: Provider) => {
    // On récupère les détails complets pour avoir la location si elle n'est pas dans la liste
    try {
        const fullProviderData = await apiService.getProviderById(provider.id);
        // Si l'API renvoie { provider: {...}, menu: [...] }
        setSelectedProvider(fullProviderData.provider || provider);
    } catch(e) {
        // Fallback sur les données de la liste
        setSelectedProvider(provider);
    }
    setIsViewDialogOpen(true);
  };

  const handleEditProvider = async (provider: Provider) => {
    // Charger les détails complets pour avoir la localisation actuelle
    let currentProvider = provider;
    try {
        const data = await apiService.getProviderById(provider.id);
        currentProvider = data.provider || provider;
    } catch (e) {
        console.error("Could not fetch full provider details", e);
    }

    setSelectedProvider(currentProvider);
    
    setEditForm({
      name: currentProvider.name,
      type: currentProvider.type as 'restaurant' | 'course' | 'pharmacy',
      phone: currentProvider.phone,
      address: currentProvider.address,
      email: (currentProvider as any).email || '',
      description: (currentProvider as any).description || '',
      image: currentProvider.image || '',
      imageFile: undefined,
      imageType: 'url',
      // Pré-remplir avec la localisation existante ou Tunis par défaut
      latitude: currentProvider.location?.latitude || 36.8065,
      longitude: currentProvider.location?.longitude || 10.1815,
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateProvider = async () => {
    console.log('handleUpdateProvider - Debug:', {
      selectedProvider,
      selectedProviderId: selectedProvider?.id,
      editFormName: editForm.name,
      editFormPhone: editForm.phone,
      editFormAddress: editForm.address
    });
    
    if (!selectedProvider || !selectedProvider.id || !editForm.name || !editForm.phone || !editForm.address) {
      toast({
        title: 'Erreur',
        description: 'Veuillez remplir tous les champs obligatoires',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await apiService.updateProvider(selectedProvider.id, {
        name: editForm.name,
        type: editForm.type,
        phone: editForm.phone,
        address: editForm.address,
        email: editForm.email || undefined,
        description: editForm.description || undefined,
        image: editForm.image || undefined,
        imageFile: editForm.imageFile,
        location: {
          latitude: editForm.latitude,
          longitude: editForm.longitude,
          address: editForm.address
        }
      });
      
      toast({
        title: 'Succès',
        description: response.message || 'Prestataire modifié avec succès',
      });
      setIsEditDialogOpen(false);
      fetchProviders();
    } catch (error: any) {
      console.error('Error updating provider:', error);
      toast({
        title: 'Erreur',
        description: error.message || 'Erreur lors de la modification du prestataire',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProvider = async (provider: Provider) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer le prestataire "${provider.name}" ?`)) {
      return;
    }

    try {
      const response = await apiService.deleteProvider(provider.id);
      toast({
        title: 'Succès',
        description: response.message || 'Prestataire supprimé avec succès',
      });
      fetchProviders();
    } catch (error: any) {
      console.error('Error deleting provider:', error);
      toast({
        title: 'Erreur',
        description: error.message || 'Erreur lors de la suppression du prestataire',
        variant: 'destructive',
      });
    }
  };

  const handleImageFileChange = (file: File, isEdit: boolean = false) => {
    const updater = isEdit ? setEditForm : setCreateForm;
    updater(prev => ({
      ...prev,
      imageFile: file,
      image: file.name,
    }));
  };

  const handleImageTypeChange = (type: 'url' | 'file', isEdit: boolean = false) => {
    const updater = isEdit ? setEditForm : setCreateForm;
    updater(prev => ({
      ...prev,
      imageType: type,
      image: '',
      imageFile: undefined,
    }));
  };

  if (loading && providers.length === 0) {
    return <div className="p-8 text-center">Chargement...</div>;
  }

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
            Gestion des prestataires
          </h1>
          <p className="text-gray-500 mt-2">
            Gérez vos partenaires commerciaux et leurs informations.
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-white shadow-lg hover:shadow-xl transition-all duration-200">
              <Plus className="w-4 h-4 mr-2" />
              Nouveau prestataire
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Nouveau prestataire</DialogTitle>
              <DialogDescription>
                Ajouter un nouveau prestataire partenaire
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-6 py-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nom du prestataire *</Label>
                  <Input
                    id="name"
                    value={createForm.name}
                    onChange={(e) =>
                      setCreateForm((prev) => ({ ...prev, name: e.target.value }))
                    }
                    placeholder="Ex: Pizza House"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Type *</Label>
                  <Select
                    value={createForm.type}
                    onValueChange={(value: 'restaurant' | 'course' | 'pharmacy') =>
                      setCreateForm((prev) => ({ ...prev, type: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="restaurant">Restaurant</SelectItem>
                      <SelectItem value="course">Supermarché</SelectItem>
                      <SelectItem value="pharmacy">Pharmacie</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Téléphone *</Label>
                  <Input
                    id="phone"
                    value={createForm.phone}
                    onChange={(e) =>
                      setCreateForm((prev) => ({ ...prev, phone: e.target.value }))
                    }
                    placeholder="Ex: +216 71 123 456"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    value={createForm.email}
                    onChange={(e) =>
                      setCreateForm((prev) => ({ ...prev, email: e.target.value }))
                    }
                    placeholder="contact@pizzahouse.tn"
                  />
                </div>
              </div>

              {/* Section Localisation */}
              <div className="space-y-2">
                <Label htmlFor="address">Adresse *</Label>
                <Input
                  id="address"
                  value={createForm.address}
                  onChange={(e) =>
                    setCreateForm((prev) => ({ ...prev, address: e.target.value }))
                  }
                  placeholder="Ex: 25 Avenue Habib Bourguiba, Tunis"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Emplacement sur la carte (Cliquer pour définir)</Label>
                <div className="h-[200px] w-full rounded-md border overflow-hidden relative z-0">
                   <MapContainer 
                        center={[createForm.latitude, createForm.longitude]} 
                        zoom={13} 
                        style={{ height: '100%', width: '100%' }}
                    >
                        <TileLayer
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        />
                        <LocationPicker 
                            position={[createForm.latitude, createForm.longitude]}
                            onLocationSelect={(lat, lng) => {
                                setCreateForm(prev => ({
                                    ...prev,
                                    latitude: lat,
                                    longitude: lng
                                }));
                            }}
                        />
                    </MapContainer>
                </div>
                <p className="text-xs text-gray-500">
                    Lat: {createForm.latitude.toFixed(6)}, Lng: {createForm.longitude.toFixed(6)}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={createForm.description}
                  onChange={(e) =>
                    setCreateForm((prev) => ({ ...prev, description: e.target.value }))
                  }
                  placeholder="Description du prestataire..."
                  className="resize-none"
                />
              </div>

              {/* Image Upload Section (Simplifiée pour l'exemple) */}
              <div className="space-y-2">
                <Label>Image du prestataire</Label>
                <Tabs
                    defaultValue="url"
                    onValueChange={(v) => handleImageTypeChange(v as 'url' | 'file')}
                    className="w-full"
                  >
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="url">URL</TabsTrigger>
                      <TabsTrigger value="file">Fichier</TabsTrigger>
                    </TabsList>
                    <div className="mt-2">
                        {createForm.imageType === 'url' ? (
                             <Input
                                placeholder="https://example.com/image.jpg"
                                value={createForm.image}
                                onChange={(e) => setCreateForm(prev => ({...prev, image: e.target.value}))}
                             />
                        ) : (
                            <Input
                                type="file"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if(file) handleImageFileChange(file);
                                }}
                            />
                        )}
                    </div>
                </Tabs>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
                disabled={isSubmitting}
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

      {/* Barre de recherche et Filtres */}
      <div className="flex flex-col sm:flex-row gap-4 items-center bg-white p-4 rounded-lg shadow-sm border border-gray-100">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Rechercher un prestataire..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full sm:w-auto"
        >
          <TabsList>
            <TabsTrigger value="all">Tous</TabsTrigger>
            <TabsTrigger value="restaurant">Restaurants</TabsTrigger>
            <TabsTrigger value="course">Supermarchés</TabsTrigger>
            <TabsTrigger value="pharmacy">Pharmacies</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Liste des prestataires */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {providers && providers.length > 0 ? (
          providers.map((provider) => {
            const Icon =
              typeIcons[provider.type as keyof typeof typeIcons] || Store;
            return (
              <Card
                key={provider.id}
                className="group hover:shadow-lg transition-all duration-200 border-gray-100 overflow-hidden"
              >
                <div className="relative h-48 bg-gray-100">
                  {provider.image ? (
                    <img
                      src={provider.image}
                      alt={provider.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-50 text-gray-300">
                      <ImageIcon className="w-12 h-12" />
                    </div>
                  )}
                  <div className="absolute top-4 right-4">
                    <Badge
                      className={`${
                        provider.status === 'active'
                          ? 'bg-green-500'
                          : 'bg-gray-500'
                      } text-white border-0 shadow-sm`}
                    >
                      {provider.status === 'active' ? 'Actif' : 'Inactif'}
                    </Badge>
                  </div>
                  <div className="absolute top-4 left-4">
                    <div className="bg-white/90 backdrop-blur-sm p-2 rounded-lg shadow-sm">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                  </div>
                </div>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-lg text-gray-900 group-hover:text-primary transition-colors">
                        {provider.name}
                      </h3>
                      <p className="text-sm text-gray-500 flex items-center mt-1">
                        <MapPin className="w-3 h-3 mr-1" />
                        {provider.address}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <span className="text-xs text-gray-500 uppercase font-medium">
                        Type
                      </span>
                      <p className="font-semibold text-gray-900 mt-0.5">
                        {typeLabels[provider.type as keyof typeof typeLabels]}
                      </p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <span className="text-xs text-gray-500 uppercase font-medium">
                        Commandes
                      </span>
                      <p className="font-semibold text-gray-900 mt-0.5">
                        {provider.totalOrders || 0}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1 hover:bg-gray-50 hover:text-primary hover:border-primary/20"
                      onClick={() => handleViewProvider(provider)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Détails
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 hover:bg-gray-50 hover:text-blue-600 hover:border-blue-200"
                      onClick={() => handleEditProvider(provider)}
                    >
                      <Pencil className="w-4 h-4 mr-2" />
                      Modifier
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                      onClick={() => handleDeleteProvider(provider)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <div className="col-span-full text-center py-12 bg-white rounded-lg border border-dashed border-gray-200">
            <Store className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">
              Aucun prestataire trouvé
            </h3>
            <p className="text-gray-500">
              Commencez par ajouter votre premier prestataire partenaire.
            </p>
          </div>
        )}
      </div>

      {/* Dialog Détails */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Détails du prestataire</DialogTitle>
            <DialogDescription>
              Informations complètes du prestataire
            </DialogDescription>
          </DialogHeader>
          {selectedProvider && (
            <div className="space-y-6">
              <div className="relative h-48 bg-gray-100 rounded-lg overflow-hidden">
                {selectedProvider.image ? (
                  <img
                    src={selectedProvider.image}
                    alt={selectedProvider.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="w-12 h-12 text-gray-300" />
                  </div>
                )}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                  <h2 className="text-2xl font-bold text-white">
                    {selectedProvider.name}
                  </h2>
                  <p className="text-white/80 flex items-center text-sm">
                    <MapPin className="w-4 h-4 mr-1" />
                    {selectedProvider.address}
                  </p>
                </div>
              </div>
              
              {/* Affichage de la carte en lecture seule */}
              {selectedProvider.location && (
                <div className="h-[150px] w-full rounded-md border overflow-hidden relative z-0">
                   <MapContainer 
                        center={[selectedProvider.location.latitude, selectedProvider.location.longitude]} 
                        zoom={13} 
                        style={{ height: '100%', width: '100%' }}
                        zoomControl={false}
                        dragging={false}
                        scrollWheelZoom={false}
                    >
                        <TileLayer
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <Marker position={[selectedProvider.location.latitude, selectedProvider.location.longitude]} />
                    </MapContainer>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-xs text-gray-500 uppercase font-medium">
                    Type
                  </span>
                  <p className="font-medium text-gray-900">
                    {
                      typeLabels[
                        selectedProvider.type as keyof typeof typeLabels
                      ]
                    }
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-gray-500 uppercase font-medium">
                    Statut
                  </span>
                  <Badge
                    className={
                      selectedProvider.status === 'active'
                        ? 'bg-green-500'
                        : 'bg-gray-500'
                    }
                  >
                    {selectedProvider.status === 'active' ? 'Actif' : 'Inactif'}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-gray-500 uppercase font-medium">
                    Téléphone
                  </span>
                  <p className="font-medium text-gray-900">
                    {selectedProvider.phone}
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-gray-500 uppercase font-medium">
                    Note moyenne
                  </span>
                  <p className="font-medium text-gray-900">
                    {selectedProvider.rating
                      ? `${selectedProvider.rating} ⭐`
                      : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          )}
          <div className="flex justify-end mt-4">
            <Button onClick={() => setIsViewDialogOpen(false)}>Fermer</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Édition */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modifier le prestataire</DialogTitle>
            <DialogDescription>
              Modifier les informations du prestataire
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Nom du prestataire *</Label>
                <Input
                  id="edit-name"
                  value={editForm.name}
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-type">Type *</Label>
                <Select
                  value={editForm.type}
                  onValueChange={(value: 'restaurant' | 'course' | 'pharmacy') =>
                    setEditForm((prev) => ({ ...prev, type: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="restaurant">Restaurant</SelectItem>
                    <SelectItem value="course">Supermarché</SelectItem>
                    <SelectItem value="pharmacy">Pharmacie</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-phone">Téléphone *</Label>
                <Input
                  id="edit-phone"
                  value={editForm.phone}
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, phone: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  value={editForm.email}
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, email: e.target.value }))
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-address">Adresse *</Label>
              <Input
                id="edit-address"
                value={editForm.address}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, address: e.target.value }))
                }
              />
            </div>

            {/* Carte d'édition */}
            <div className="space-y-2">
                <Label>Modifier l'emplacement</Label>
                <div className="h-[200px] w-full rounded-md border overflow-hidden relative z-0">
                   <MapContainer 
                        center={[editForm.latitude, editForm.longitude]} 
                        zoom={13} 
                        style={{ height: '100%', width: '100%' }}
                    >
                        <TileLayer
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <LocationPicker 
                            position={[editForm.latitude, editForm.longitude]}
                            onLocationSelect={(lat, lng) => {
                                setEditForm(prev => ({
                                    ...prev,
                                    latitude: lat,
                                    longitude: lng
                                }));
                            }}
                        />
                    </MapContainer>
                </div>
                <p className="text-xs text-gray-500">
                    Lat: {editForm.latitude.toFixed(6)}, Lng: {editForm.longitude.toFixed(6)}
                </p>
              </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={editForm.description}
                onChange={(e) =>
                  setEditForm((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                className="resize-none"
              />
            </div>

            {/* Image Edit */}
            <div className="space-y-2">
                <Label>Image</Label>
                <Tabs
                    defaultValue="url"
                    onValueChange={(v) => handleImageTypeChange(v as 'url' | 'file', true)}
                    className="w-full"
                  >
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="url">URL</TabsTrigger>
                      <TabsTrigger value="file">Fichier</TabsTrigger>
                    </TabsList>
                    <div className="mt-2">
                         {editForm.imageType === 'url' ? (
                             <Input
                                value={editForm.image}
                                onChange={(e) => setEditForm(prev => ({...prev, image: e.target.value}))}
                             />
                        ) : (
                            <Input
                                type="file"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if(file) handleImageFileChange(file, true);
                                }}
                            />
                        )}
                    </div>
                </Tabs>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              disabled={isSubmitting}
            >
              Annuler
            </Button>
            <Button onClick={handleUpdateProvider} disabled={isSubmitting}>
              {isSubmitting ? 'Modification...' : 'Modifier le prestataire'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
