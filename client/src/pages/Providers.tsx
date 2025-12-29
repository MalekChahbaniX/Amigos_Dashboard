import { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  Store,
  Pill,
  ShoppingCart,
  Eye,
  Pencil,
  Trash2,
  MapPin,
  ImageIcon,
  UserCircle, // Nouvelle icône pour photo de profil
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

// Imports Leaflet
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix icônes Leaflet
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
  image?: string;       // Photo de couverture
  profileImage?: string; // Photo de profil (Logo)
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
}

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

  // État création
  const [createForm, setCreateForm] = useState({
    name: '',
    type: 'restaurant' as 'restaurant' | 'course' | 'pharmacy',
    phone: '',
    address: '',
    email: '',
    password: '', // Mot de passe (requis)
    description: '',
    image: '', // Couverture (URL)
    imageFile: undefined as File | undefined, // Couverture (Fichier)
    profileImage: '', // Profil (URL)
    profileImageFile: undefined as File | undefined, // Profil (Fichier)
    latitude: 36.8065,
    longitude: 10.1815,
  });

  // État édition
  const [editForm, setEditForm] = useState({
    id: '', // Ajouter l'ID du prestataire en cours d'édition
    name: '',
    type: 'restaurant' as 'restaurant' | 'course' | 'pharmacy',
    phone: '',
    address: '',
    email: '',
    password: '', // Mot de passe (optionnel)
    description: '',
    image: '', // Couverture (URL)
    imageFile: undefined as File | undefined, // Couverture (Fichier)
    profileImage: '', // Profil (URL)
    profileImageFile: undefined as File | undefined, // Profil (Fichier)
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
        activeTab !== 'all' ? activeTab : undefined,
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
    if (!createForm.name || !createForm.phone || !createForm.email || !createForm.address || !createForm.password) {
      toast({
        title: 'Erreur',
        description: 'Veuillez remplir tous les champs obligatoires (nom, téléphone, email, adresse, mot de passe)',
        variant: 'destructive',
      });
      return;
    }

    if (createForm.password.length < 6) {
      toast({
        title: 'Erreur',
        description: 'Le mot de passe doit contenir au moins 6 caractères',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Préparer les données du prestataire
      const providerData: any = {
        name: createForm.name,
        type: createForm.type,
        phone: createForm.phone,
        address: createForm.address,
        email: createForm.email || undefined,
        password: createForm.password, // Inclure le mot de passe
        description: createForm.description || undefined,
        location: {
          latitude: createForm.latitude,
          longitude: createForm.longitude,
          address: createForm.address
        }
      };

      // Gérer l'image de couverture : URL ou fichier
      if (createForm.imageFile) {
        // Si un fichier est sélectionné, on l'uploadera via imageFile
        providerData.imageFile = createForm.imageFile;
      } else if (createForm.image) {
        // Sinon, on utilise l'URL
        providerData.image = createForm.image;
      }

      // Gérer l'image de profil : URL ou fichier
      if (createForm.profileImageFile) {
        // Si un fichier est sélectionné, on l'uploadera via profileImageFile
        providerData.profileImageFile = createForm.profileImageFile;
      } else if (createForm.profileImage) {
        // Sinon, on utilise l'URL
        providerData.profileImage = createForm.profileImage;
      }

      const response = await apiService.createProvider(providerData);

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
      type: 'restaurant',
      phone: '',
      address: '',
      email: '',
      password: '', // Réinitialiser le mot de passe
      description: '',
      image: '',
      imageFile: undefined,
      profileImage: '',
      profileImageFile: undefined,
      latitude: 36.8065,
      longitude: 10.1815,
    });
  };

  const handleViewProvider = async (provider: Provider) => {
    try {
        const fullProviderData = await apiService.getProviderById(provider.id);
        setSelectedProvider(fullProviderData.provider || provider);
    } catch(e) {
        setSelectedProvider(provider);
    }
    setIsViewDialogOpen(true);
  };

  const handleEditProvider = async (provider: Provider) => {
    let currentProvider = provider;
    try {
        const data = await apiService.getProviderById(provider.id);
        currentProvider = data.provider || provider;
    } catch (e) {
        console.error("Could not fetch full provider details", e);
    }

    // DEBUG: Log l'ID du provider pour vérifier
    console.log('🔍 DEBUG handleEditProvider - provider.id:', provider.id);
    console.log('🔍 DEBUG handleEditProvider - currentProvider.id:', currentProvider.id);
    console.log('🔍 DEBUG handleEditProvider - currentProvider._id:', (currentProvider as any)._id);
    console.log('🔍 DEBUG handleEditProvider - currentProvider:', currentProvider);

    setSelectedProvider(currentProvider);
    
    // Déterminer l'ID correct (vérifier id, _id, ou utiliser provider.id)
    const providerId = currentProvider.id || (currentProvider as any)._id || provider.id;
    console.log('🔍 DEBUG handleEditProvider - providerId final:', providerId);

    setEditForm({
      id: providerId || '', // Utiliser le meilleur ID trouvé
      name: currentProvider.name,
      type: currentProvider.type as any,
      phone: currentProvider.phone,
      address: currentProvider.address,
      email: (currentProvider as any).email || '',
      password: '', // Laisser vide par défaut (optionnel)
      description: (currentProvider as any).description || '',
      image: currentProvider.image || '',
      imageFile: undefined,
      profileImage: currentProvider.profileImage || '', // Charger profil existant
      profileImageFile: undefined,
      latitude: currentProvider.location?.latitude || 36.8065,
      longitude: currentProvider.location?.longitude || 10.1815,
    });
    
    setIsEditDialogOpen(true);
  };

  const handleUpdateProvider = async () => {
    // DEBUG: Log tous les champs pour vérifier
    console.log('🔍 DEBUG handleUpdateProvider - editForm:', {
      id: editForm.id,
      name: editForm.name,
      phone: editForm.phone,
      address: editForm.address,
    });

    if (!editForm.id || !editForm.name || !editForm.phone || !editForm.address) {
      toast({
        title: 'Erreur',
        description: `Veuillez remplir tous les champs obligatoires. ID: ${editForm.id ? '✓' : '✗'}, Nom: ${editForm.name ? '✓' : '✗'}, Tél: ${editForm.phone ? '✓' : '✗'}, Adresse: ${editForm.address ? '✓' : '✗'}`,
        variant: 'destructive',
      });
      return;
    }

    // Valider le mot de passe si fourni
    if (editForm.password && editForm.password.length < 6) {
      toast({
        title: 'Erreur',
        description: 'Le mot de passe doit contenir au moins 6 caractères',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Préparer les données du prestataire
      const providerData: any = {
        name: editForm.name,
        type: editForm.type,
        phone: editForm.phone,
        address: editForm.address,
        email: editForm.email || undefined,
        ...(editForm.password && { password: editForm.password }), // Inclure le mot de passe seulement s'il est fourni
        description: editForm.description || undefined,
        location: {
            latitude: editForm.latitude,
            longitude: editForm.longitude,
            address: editForm.address
        }
      };

      // Gérer l'image de couverture : URL ou fichier
      if (editForm.imageFile) {
        // Si un fichier est sélectionné, on l'uploadera via imageFile
        providerData.imageFile = editForm.imageFile;
      } else if (editForm.image) {
        // Sinon, on utilise l'URL
        providerData.image = editForm.image;
      }

      // Gérer l'image de profil : URL ou fichier
      if (editForm.profileImageFile) {
        // Si un fichier est sélectionné, on l'uploadera via profileImageFile
        providerData.profileImageFile = editForm.profileImageFile;
      } else if (editForm.profileImage) {
        // Sinon, on utilise l'URL
        providerData.profileImage = editForm.profileImage;
      }

      const response = await apiService.updateProvider(editForm.id, providerData);
      
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

  if (loading && providers.length === 0) {
    return <div className="p-8 text-center">Chargement...</div>;
  }

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      {/* En-tête et Bouton Nouveau */}
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
              <DialogDescription>Ajouter un nouveau prestataire partenaire</DialogDescription>
            </DialogHeader>
            <div className="grid gap-6 py-4">
              {/* ... Champs existants (Nom, Type, Tel, Email, Adresse, Carte, Description) ... */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nom du prestataire *</Label>
                  <Input id="name" value={createForm.name} onChange={(e) => setCreateForm((prev) => ({ ...prev, name: e.target.value }))} placeholder="Ex: Pizza House" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Type *</Label>
                  <Select value={createForm.type} onValueChange={(value: any) => setCreateForm((prev) => ({ ...prev, type: value }))}>
                    <SelectTrigger><SelectValue placeholder="Sélectionner un type" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="restaurant">Restaurant</SelectItem>
                      <SelectItem value="course">Supermarché</SelectItem>
                      <SelectItem value="pharmacy">Pharmacie</SelectItem>
                      <SelectItem value="store">Store</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Téléphone *</Label>
                  <Input id="phone" value={createForm.phone} onChange={(e) => setCreateForm((prev) => ({ ...prev, phone: e.target.value }))} placeholder="Ex: +216 71 123 456" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input id="email" value={createForm.email} onChange={(e) => setCreateForm((prev) => ({ ...prev, email: e.target.value }))} placeholder="contact@pizzahouse.tn" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Mot de passe *</Label>
                  <Input id="password" type="password" value={createForm.password} onChange={(e) => setCreateForm((prev) => ({ ...prev, password: e.target.value }))} placeholder="Min. 6 caractères" />
                  {createForm.password && createForm.password.length < 6 && (
                    <p className="text-xs text-red-500">Le mot de passe doit contenir au moins 6 caractères</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Adresse *</Label>
                <Input id="address" value={createForm.address} onChange={(e) => setCreateForm((prev) => ({ ...prev, address: e.target.value }))} placeholder="Ex: 25 Avenue Habib Bourguiba, Tunis" />
              </div>
              
              <div className="space-y-2">
                <Label>Emplacement sur la carte</Label>
                <div className="h-[200px] w-full rounded-md border overflow-hidden relative z-0">
                   <MapContainer center={[createForm.latitude, createForm.longitude]} zoom={13} style={{ height: '100%', width: '100%' }}>
                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                        <LocationPicker position={[createForm.latitude, createForm.longitude]} onLocationSelect={(lat, lng) => { setCreateForm(prev => ({ ...prev, latitude: lat, longitude: lng })); }} />
                    </MapContainer>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" value={createForm.description} onChange={(e) => setCreateForm((prev) => ({ ...prev, description: e.target.value }))} placeholder="Description du prestataire..." className="resize-none" />
              </div>

              {/* Gestion des Images (Cover + Profil) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2"><ImageIcon className="w-4 h-4"/> Photo de couverture</Label>
                    <div className="space-y-2">
                      <Input
                          placeholder="https://example.com/cover.jpg"
                          value={createForm.image}
                          onChange={(e) => setCreateForm(prev => ({...prev, image: e.target.value}))}
                          disabled={!!createForm.imageFile}
                      />
                      <div className="flex items-center gap-2">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            setCreateForm(prev => ({...prev, imageFile: file, image: file ? '' : prev.image}));
                          }}
                          className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        />
                        {createForm.imageFile && (
                          <span className="text-sm text-gray-500">{createForm.imageFile.name}</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400">Choisissez une URL ou téléchargez un fichier. Le fichier a priorité.</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2"><UserCircle className="w-4 h-4"/> Photo de profil</Label>
                    <div className="space-y-2">
                      <Input
                          placeholder="https://example.com/logo.jpg"
                          value={createForm.profileImage}
                          onChange={(e) => setCreateForm(prev => ({...prev, profileImage: e.target.value}))}
                          disabled={!!createForm.profileImageFile}
                      />
                      <div className="flex items-center gap-2">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            setCreateForm(prev => ({...prev, profileImageFile: file, profileImage: file ? '' : prev.profileImage}));
                          }}
                          className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        />
                        {createForm.profileImageFile && (
                          <span className="text-sm text-gray-500">{createForm.profileImageFile.name}</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400">Choisissez une URL ou téléchargez un fichier. Le fichier a priorité.</p>
                    </div>
                  </div>
              </div>

            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)} disabled={isSubmitting}>Annuler</Button>
              <Button onClick={handleCreateProvider} disabled={isSubmitting}>{isSubmitting ? 'Création...' : 'Créer le prestataire'}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Barre de recherche */}
      <div className="flex flex-col sm:flex-row gap-4 items-center bg-white p-4 rounded-lg shadow-sm border border-gray-100">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input placeholder="Rechercher un prestataire..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
        </div>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
          <TabsList>
            <TabsTrigger value="all">Tous</TabsTrigger>
            <TabsTrigger value="restaurant">Restaurants</TabsTrigger>
            <TabsTrigger value="course">Supermarchés</TabsTrigger>
            <TabsTrigger value="pharmacy">Pharmacies</TabsTrigger>
            <TabsTrigger value="store">Stores</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Liste des cartes Providers */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {providers && providers.length > 0 ? (
          providers.map((provider) => {
            const Icon = typeIcons[provider.type as keyof typeof typeIcons] || Store;
            return (
              <Card key={provider.id} className="group hover:shadow-lg transition-all duration-200 border-gray-100 overflow-hidden">
                {/* Zone Image de couverture */}
                <div className="relative h-48 bg-gray-100">
                  {provider.image ? (
                    <img
                      src={provider.image}
                      alt={provider.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-50 text-gray-300">
                      <ImageIcon className="w-12 h-12" />
                    </div>
                  )}
                  <div className="absolute top-4 right-4">
                    <Badge className={`${provider.status === 'active' ? 'bg-green-500' : 'bg-gray-500'} text-white border-0 shadow-sm`}>
                      {provider.status === 'active' ? 'Actif' : 'Inactif'}
                    </Badge>
                  </div>
                </div>

                {/* Header avec Avatar (Profil) chevauchant */}
                <CardHeader className="pb-2 pt-0 relative">
                   <div className="flex justify-between items-start -mt-10 px-2">
                        {/* Avatar (Photo de profil) */}
                        <div className="relative">
                            <div className="w-20 h-20 rounded-full border-4 border-white bg-white shadow-md overflow-hidden flex items-center justify-center">
                                {provider.profileImage ? (
                                    <img src={provider.profileImage} alt="Profil" className="w-full h-full object-cover" />
                                ) : (
                                    <Icon className="w-10 h-10 text-gray-400" />
                                )}
                            </div>
                        </div>
                   </div>

                  <div className="mt-2">
                    <h3 className="font-bold text-lg text-gray-900 group-hover:text-primary transition-colors">
                      {provider.name}
                    </h3>
                    <p className="text-sm text-gray-500 flex items-center mt-1">
                      <MapPin className="w-3 h-3 mr-1" />
                      {provider.address}
                    </p>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <span className="text-xs text-gray-500 uppercase font-medium">Type</span>
                      <p className="font-semibold text-gray-900 mt-0.5">{typeLabels[provider.type as keyof typeof typeLabels]}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <span className="text-xs text-gray-500 uppercase font-medium">Commandes</span>
                      <p className="font-semibold text-gray-900 mt-0.5">{provider.totalOrders || 0}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1 hover:bg-gray-50" onClick={() => handleViewProvider(provider)}>
                      <Eye className="w-4 h-4 mr-2" /> Détails
                    </Button>
                    <Button variant="outline" className="flex-1 hover:bg-gray-50 text-blue-600" onClick={() => handleEditProvider(provider)}>
                      <Pencil className="w-4 h-4 mr-2" /> Modifier
                    </Button>
                    <Button variant="outline" className="flex-1 hover:bg-red-50 text-red-600" onClick={() => handleDeleteProvider(provider)}>
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
            <h3 className="text-lg font-medium text-gray-900">Aucun prestataire trouvé</h3>
            <p className="text-gray-500">Commencez par ajouter votre premier prestataire partenaire.</p>
          </div>
        )}
      </div>

      {/* Dialog Détails */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Détails du prestataire</DialogTitle>
            <DialogDescription>Informations complètes du prestataire</DialogDescription>
          </DialogHeader>
          {selectedProvider && (
            <div className="space-y-6">
              {/* Cover & Profil dans les détails */}
              <div className="relative h-48 bg-gray-100 rounded-t-lg overflow-hidden">
                {selectedProvider.image ? (
                  <img src={selectedProvider.image} alt="Cover" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center"><ImageIcon className="w-12 h-12 text-gray-300" /></div>
                )}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4 pt-10">
                    <h2 className="text-2xl font-bold text-white ml-24">{selectedProvider.name}</h2> {/* Marge à gauche pour l'avatar */}
                </div>
                {/* Avatar positionné en absolu */}
                <div className="absolute bottom-4 left-4 w-20 h-20 rounded-full border-4 border-white bg-white shadow-lg overflow-hidden">
                    {selectedProvider.profileImage ? (
                        <img src={selectedProvider.profileImage} alt="Profil" className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-100"><Store className="w-8 h-8 text-gray-400"/></div>
                    )}
                </div>
              </div>
              
              {selectedProvider.location && (
                <div className="h-[150px] w-full rounded-md border overflow-hidden relative z-0">
                   <MapContainer center={[selectedProvider.location.latitude, selectedProvider.location.longitude]} zoom={13} style={{ height: '100%', width: '100%' }} zoomControl={false} dragging={false} scrollWheelZoom={false}>
                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                        <Marker position={[selectedProvider.location.latitude, selectedProvider.location.longitude]} />
                    </MapContainer>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1"><span className="text-xs text-gray-500 uppercase font-medium">Type</span><p className="font-medium text-gray-900">{typeLabels[selectedProvider.type as keyof typeof typeLabels]}</p></div>
                <div className="space-y-1"><span className="text-xs text-gray-500 uppercase font-medium">Statut</span><Badge className={selectedProvider.status === 'active' ? 'bg-green-500' : 'bg-gray-500'}>{selectedProvider.status === 'active' ? 'Actif' : 'Inactif'}</Badge></div>
                <div className="space-y-1"><span className="text-xs text-gray-500 uppercase font-medium">Téléphone</span><p className="font-medium text-gray-900">{selectedProvider.phone}</p></div>
                <div className="space-y-1"><span className="text-xs text-gray-500 uppercase font-medium">Adresse</span><p className="font-medium text-gray-900">{selectedProvider.address}</p></div>
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
            <DialogDescription>Modifier les informations du prestataire</DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Nom *</Label><Input value={editForm.name} onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))} /></div>
              <div className="space-y-2">
                  <Label>Type *</Label>
                  <Select value={editForm.type} onValueChange={(v: any) => setEditForm(prev => ({ ...prev, type: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="restaurant">Restaurant</SelectItem><SelectItem value="course">Supermarché</SelectItem><SelectItem value="pharmacy">Pharmacie</SelectItem><SelectItem value="store">Store</SelectItem></SelectContent>
                  </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Téléphone *</Label><Input value={editForm.phone} onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Email</Label><Input value={editForm.email} onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))} /></div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Mot de passe (optionnel)</Label>
                <Input type="password" value={editForm.password} onChange={(e) => setEditForm(prev => ({ ...prev, password: e.target.value }))} placeholder="Min. 6 caractères pour modifier" />
                {editForm.password && editForm.password.length < 6 && (
                  <p className="text-xs text-red-500">Le mot de passe doit contenir au moins 6 caractères</p>
                )}
                {editForm.password && (
                  <p className="text-xs text-blue-500">Laissez vide pour ne pas modifier le mot de passe</p>
                )}
              </div>
            </div>

            <div className="space-y-2"><Label>Adresse *</Label><Input value={editForm.address} onChange={(e) => setEditForm(prev => ({ ...prev, address: e.target.value }))} /></div>

            <div className="space-y-2">
                <Label>Modifier l'emplacement</Label>
                <div className="h-[200px] w-full rounded-md border overflow-hidden relative z-0">
                   <MapContainer center={[editForm.latitude, editForm.longitude]} zoom={13} style={{ height: '100%', width: '100%' }}>
                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                        <LocationPicker position={[editForm.latitude, editForm.longitude]} onLocationSelect={(lat, lng) => { setEditForm(prev => ({ ...prev, latitude: lat, longitude: lng })); }} />
                    </MapContainer>
                </div>
            </div>

            <div className="space-y-2"><Label>Description</Label><Textarea value={editForm.description} onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))} className="resize-none" /></div>

            {/* Images Edit */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2"><ImageIcon className="w-4 h-4"/> Photo de couverture</Label>
                    <div className="space-y-2">
                      <Input
                          value={editForm.image}
                          onChange={(e) => setEditForm(prev => ({...prev, image: e.target.value}))}
                          disabled={!!editForm.imageFile}
                          placeholder="https://example.com/cover.jpg"
                      />
                      <div className="flex items-center gap-2">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            setEditForm(prev => ({...prev, imageFile: file, image: file ? '' : prev.image}));
                          }}
                          className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        />
                        {editForm.imageFile && (
                          <span className="text-sm text-gray-500">{editForm.imageFile.name}</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400">Choisissez une URL ou téléchargez un fichier. Le fichier a priorité.</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2"><UserCircle className="w-4 h-4"/> Photo de profil</Label>
                    <div className="space-y-2">
                      <Input
                          value={editForm.profileImage}
                          onChange={(e) => setEditForm(prev => ({...prev, profileImage: e.target.value}))}
                          disabled={!!editForm.profileImageFile}
                          placeholder="https://example.com/logo.jpg"
                      />
                      <div className="flex items-center gap-2">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            setEditForm(prev => ({...prev, profileImageFile: file, profileImage: file ? '' : prev.profileImage}));
                          }}
                          className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        />
                        {editForm.profileImageFile && (
                          <span className="text-sm text-gray-500">{editForm.profileImageFile.name}</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400">Choisissez une URL ou téléchargez un fichier. Le fichier a priorité.</p>
                    </div>
                  </div>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={isSubmitting}>Annuler</Button>
            <Button onClick={handleUpdateProvider} disabled={isSubmitting}>{isSubmitting ? 'Modification...' : 'Modifier le prestataire'}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
