import { useState, useEffect } from 'react';
import { Search, Plus, ImageIcon, Pencil, Trash2, Upload } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { useToast } from '@/hooks/use-toast';
import { apiService } from '@/lib/api';

interface Product {
  id: string;
  name: string;
  category: string;
  provider: string;
  price: number;
  p1: number;
  p2: number;
  csR: number;
  csC: number;
  deliveryCategory: string;
  stock: number;
  status: 'available' | 'out_of_stock' | 'discontinued';
  image?: string;
  options?: Array<{
    name: string;
    required: boolean;
    price?: number;
    maxSelections: number;
    subOptions: Array<{
      name: string;
      price?: number;
    }>;
  }>;
  availability?: boolean;
}

interface ProductsResponse {
  products: Product[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface CreateProductForm {
  name: string;
  description: string;
  price: string;
  category: string;
  stock: string;
  status: 'available' | 'out_of_stock' | 'discontinued';
  image: string;
  imageFile?: File;
  imageType: 'url' | 'file';
  providerId?: string;
  csR?: number;
  csC?: number;
  deliveryCategory?: string;
  availability?: boolean;
}

export default function Products() {
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editForm, setEditForm] = useState<CreateProductForm>({
    name: '',
    description: '',
    price: '',
    category: '',
    stock: '',
    status: 'available',
    image: '',
    imageFile: undefined,
    imageType: 'url',
    providerId: '',
  });
  const [createForm, setCreateForm] = useState<CreateProductForm>({
    name: '',
    description: '',
    price: '',
    category: '',
    stock: '',
    status: 'available',
    image: '',
    imageFile: undefined,
    imageType: 'url',
    providerId: '',
  });

  const [providers, setProviders] = useState<
    Array<{ id: string; name: string; type: string }>
  >([]);
  const [selectedProviderId, setSelectedProviderId] = useState<string>('');
  const [selectedEditProviderId, setSelectedEditProviderId] = useState<string>('');

  const fetchProducts = async (page = 1) => {
    try {
      setLoading(true);
      const response = await apiService.getProducts(
        searchQuery || undefined,
        categoryFilter !== 'all' ? categoryFilter : undefined,
        page,
        12,
      );

      // Type assertion to handle the new fields
      const typedProducts = response.products.map(p => ({
        ...p,
        p1: (p as any).p1 || 0,
        p2: (p as any).p2 || 0,
        csR: (p as any).csR || 0,
        csC: (p as any).csC || 0,
        deliveryCategory: (p as any).deliveryCategory || 'restaurant',
        availability: (p as any).availability !== false
      })) as Product[];
      setProducts(typedProducts);
      setTotalPages(response.totalPages);
      setCurrentPage(response.page);
    } catch (error: any) {
      console.error('Error fetching products:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les produits',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts(1);
    fetchProviders();
  }, [searchQuery, categoryFilter]);

  const handleDeleteProduct = async (productId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) {
      try {
        await apiService.deleteProduct(productId);
        toast({
          title: 'Succès',
          description: 'Produit supprimé avec succès',
        });
        fetchProducts(currentPage);
      } catch (error: any) {
        console.error('Error deleting product:', error);
        toast({
          title: 'Erreur',
          description: 'Impossible de supprimer le produit',
          variant: 'destructive',
        });
      }
    }
  };

  const handleCreateProduct = async () => {
    if (!createForm.name || !createForm.price || !createForm.category) {
      toast({
        title: 'Erreur',
        description: 'Veuillez remplir tous les champs obligatoires',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await apiService.createProduct({
        name: createForm.name,
        description: createForm.description || undefined,
        price: parseFloat(createForm.price),
        category: createForm.category,
        stock: parseInt(createForm.stock) || 0,
        status: createForm.status,
        providerId: selectedProviderId,
        image: createForm.image || undefined,
        imageFile: createForm.imageFile,
      });

      toast({
        title: 'Succès',
        description: response.message || 'Produit créé avec succès',
      });

      setIsCreateDialogOpen(false);
      resetCreateForm();
      fetchProducts(1);
    } catch (error: any) {
      console.error('Error creating product:', error);
      
      let errorMessage = 'Erreur lors de la création du produit';
      if (error.message) {
        if (error.message.includes('Prestataire non trouvé')) {
          errorMessage = "Veuillez d'abord créer un prestataire";
        } else if (error.message.includes('required')) {
          errorMessage = 'Veuillez remplir tous les champs obligatoires';
        } else {
          errorMessage = error.message;
        }
      }

      toast({
        title: 'Erreur',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetCreateForm = () => {
    setCreateForm({
      name: '',
      description: '',
      price: '',
      category: '',
      stock: '',
      status: 'available',
      image: '',
      imageFile: undefined,
      imageType: 'url',
      providerId: '',
      csR: 5,
      csC: 0,
      deliveryCategory: 'restaurant',
      availability: true,
    });
    setSelectedProviderId('');
  };

  const fetchProviders = async () => {
    try {
      const response = await apiService.getProviders();
      setProviders(
        response.providers.map((p: any) => ({
          id: p.id,
          name: p.name,
          type: p.type,
        })),
      );
    } catch (error) {
      console.error('Error fetching providers:', error);
    }
  };

  const handleImageFileChange = (file: File, isEdit: boolean = false) => {
    if (isEdit) {
      setEditForm(prev => ({
        ...prev,
        imageFile: file,
        image: file.name,
      }));
    } else {
      setCreateForm(prev => ({
        ...prev,
        imageFile: file,
        image: file.name,
      }));
    }
  };

  const handleImageTypeChange = (type: 'url' | 'file', isEdit: boolean = false) => {
    if (isEdit) {
      setEditForm(prev => ({
        ...prev,
        imageType: type,
        image: '',
        imageFile: undefined,
      }));
    } else {
      setCreateForm(prev => ({
        ...prev,
        imageType: type,
        image: '',
        imageFile: undefined,
      }));
    }
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setEditForm({
      name: product.name,
      description: '',
      price: product.price.toString(),
      category: product.category,
      stock: product.stock.toString(),
      status: product.status,
      image: product.image || '',
      imageFile: undefined,
      imageType: 'url',
      providerId: '',
    });
    setIsEditDialogOpen(true);
    const providerMatch = providers.find(p => p.name === product.provider);
    setSelectedEditProviderId(providerMatch?.id || '');
  };

  const handleUpdateProduct = async () => {
    if (
      !editingProduct ||
      !editForm.name ||
      !editForm.price ||
      !editForm.category
    ) {
      toast({
        title: 'Erreur',
        description: 'Veuillez remplir tous les champs obligatoires',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await apiService.updateProduct(editingProduct.id, {
        name: editForm.name,
        description: editForm.description || undefined,
        price: parseFloat(editForm.price),
        category: editForm.category,
        stock: parseInt(editForm.stock) || 0,
        status: editForm.status,
        providerId: selectedEditProviderId,
        image: editForm.image || undefined,
        imageFile: editForm.imageFile,
      });

      toast({
        title: 'Succès',
        description: 'Produit mis à jour avec succès',
      });

      setIsEditDialogOpen(false);
      setEditingProduct(null);
      fetchProducts(currentPage);
    } catch (error: any) {
      console.error('Error updating product:', error);
      toast({
        title: 'Erreur',
        description:
          error.message || 'Erreur lors de la mise à jour du produit',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        Chargement...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Gestion des produits</h1>
          <p className="text-muted-foreground">
            Gérez le catalogue de produits
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-product">
              <Plus className="h-4 w-4 mr-2" />
              Nouveau produit
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Nouveau produit</DialogTitle>
              <DialogDescription>
                Ajouter un nouveau produit au catalogue
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Nom du produit *</Label>
                <Input
                  id="name"
                  value={createForm.name}
                  onChange={e =>
                    setCreateForm(prev => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="Ex: Pizza Margherita"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={createForm.description}
                  onChange={e =>
                    setCreateForm(prev => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="Description du produit..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="price">Prix (DT) *</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={createForm.price}
                    onChange={e =>
                      setCreateForm(prev => ({
                        ...prev,
                        price: e.target.value,
                      }))
                    }
                    placeholder="0.00"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="stock">Stock</Label>
                  <Input
                    id="stock"
                    type="number"
                    value={createForm.stock}
                    onChange={e =>
                      setCreateForm(prev => ({
                        ...prev,
                        stock: e.target.value,
                      }))
                    }
                    placeholder="0"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="category">Catégorie *</Label>
                <Select
                  value={createForm.category}
                  onValueChange={value =>
                    setCreateForm(prev => ({ ...prev, category: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Restaurant">Restaurant</SelectItem>
                    <SelectItem value="Supermarché">Supermarché</SelectItem>
                    <SelectItem value="Pharmacie">Pharmacie</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Commission Settings */}
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="csR">Commission Restaurant (CsR) %</Label>
                  <Select
                    value={createForm.csR?.toString() || '5'}
                    onValueChange={value =>
                      setCreateForm(prev => ({ ...prev, csR: parseInt(value) }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">0%</SelectItem>
                      <SelectItem value="5">5%</SelectItem>
                      <SelectItem value="10">10%</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="csC">Commission Client (CsC) %</Label>
                  <Select
                    value={createForm.csC?.toString() || '0'}
                    onValueChange={value =>
                      setCreateForm(prev => ({ ...prev, csC: parseInt(value) }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">0%</SelectItem>
                      <SelectItem value="5">5%</SelectItem>
                      <SelectItem value="10">10%</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="deliveryCategory">Catégorie de Livraison</Label>
                <Select
                  value={createForm.deliveryCategory || 'restaurant'}
                  onValueChange={value =>
                    setCreateForm(prev => ({ ...prev, deliveryCategory: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="restaurant">Restaurant</SelectItem>
                    <SelectItem value="course">Course</SelectItem>
                    <SelectItem value="pharmacy">Pharmacie</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="availability">Disponibilité</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="availability"
                    checked={createForm.availability !== false}
                    onChange={e =>
                      setCreateForm(prev => ({ ...prev, availability: e.target.checked }))
                    }
                  />
                  <Label htmlFor="availability">Produit actif</Label>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="provider">Prestataire *</Label>
                <Select
                  value={selectedProviderId}
                  onValueChange={setSelectedProviderId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un prestataire" />
                  </SelectTrigger>
                  <SelectContent>
                    {providers.map(provider => (
                      <SelectItem key={provider.id} value={provider.id}>
                        {provider.name} ({provider.type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="status">Statut</Label>
                <Select
                  value={createForm.status}
                  onValueChange={(value: any) =>
                    setCreateForm(prev => ({ ...prev, status: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Disponible</SelectItem>
                    <SelectItem value="out_of_stock">
                      Rupture de stock
                    </SelectItem>
                    <SelectItem value="discontinued">Discontinué</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Image du produit</Label>
                <div className="space-y-3">
                  <div className="flex gap-4">
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="url-type"
                        checked={createForm.imageType === 'url'}
                        onChange={() => handleImageTypeChange('url')}
                      />
                      <Label htmlFor="url-type">URL</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="file-type"
                        checked={createForm.imageType === 'file'}
                        onChange={() => handleImageTypeChange('file')}
                      />
                      <Label htmlFor="file-type">Fichier</Label>
                    </div>
                  </div>

                  {createForm.imageType === 'url' && (
                    <Input
                      id="image"
                      value={createForm.image}
                      onChange={e =>
                        setCreateForm(prev => ({ ...prev, image: e.target.value }))
                      }
                      placeholder="https://example.com/image.jpg"
                    />
                  )}

                  {createForm.imageType === 'file' && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={e => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handleImageFileChange(file);
                            }
                          }}
                        />
                        <Upload className="h-4 w-4 text-muted-foreground" />
                      </div>
                      {createForm.imageFile && (
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <ImageIcon className="h-3 w-3" />
                          Fichier sélectionné: {createForm.imageFile.name}
                        </p>
                      )}
                    </div>
                  )}
                </div>
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
              <Button onClick={handleCreateProduct} disabled={isSubmitting}>
                {isSubmitting ? 'Création...' : 'Créer le produit'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[425px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Modifier le produit</DialogTitle>
              <DialogDescription>
                Modifier les informations du produit
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-name">Nom du produit *</Label>
                <Input
                  id="edit-name"
                  value={editForm.name}
                  onChange={e =>
                    setEditForm(prev => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="Ex: Pizza Margherita"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={editForm.description}
                  onChange={e =>
                    setEditForm(prev => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="Description du produit..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-price">Prix (DT) *</Label>
                  <Input
                    id="edit-price"
                    type="number"
                    step="0.01"
                    value={editForm.price}
                    onChange={e =>
                      setEditForm(prev => ({ ...prev, price: e.target.value }))
                    }
                    placeholder="0.00"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-stock">Stock</Label>
                  <Input
                    id="edit-stock"
                    type="number"
                    value={editForm.stock}
                    onChange={e =>
                      setEditForm(prev => ({ ...prev, stock: e.target.value }))
                    }
                    placeholder="0"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-category">Catégorie *</Label>
                <Select
                  value={editForm.category}
                  onValueChange={value =>
                    setEditForm(prev => ({ ...prev, category: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Restaurant">Restaurant</SelectItem>
                    <SelectItem value="Supermarché">Supermarché</SelectItem>
                    <SelectItem value="Pharmacie">Pharmacie</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Commission Settings */}
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-csR">Commission Restaurant (CsR) %</Label>
                  <Select
                    value={editForm.csR?.toString() || '5'}
                    onValueChange={value =>
                      setEditForm(prev => ({ ...prev, csR: parseInt(value) }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">0%</SelectItem>
                      <SelectItem value="5">5%</SelectItem>
                      <SelectItem value="10">10%</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="edit-csC">Commission Client (CsC) %</Label>
                  <Select
                    value={editForm.csC?.toString() || '0'}
                    onValueChange={value =>
                      setEditForm(prev => ({ ...prev, csC: parseInt(value) }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">0%</SelectItem>
                      <SelectItem value="5">5%</SelectItem>
                      <SelectItem value="10">10%</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-deliveryCategory">Catégorie de Livraison</Label>
                <Select
                  value={editForm.deliveryCategory || 'restaurant'}
                  onValueChange={value =>
                    setEditForm(prev => ({ ...prev, deliveryCategory: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="restaurant">Restaurant</SelectItem>
                    <SelectItem value="course">Course</SelectItem>
                    <SelectItem value="pharmacy">Pharmacie</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-availability">Disponibilité</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="edit-availability"
                    checked={editForm.availability !== false}
                    onChange={e =>
                      setEditForm(prev => ({ ...prev, availability: e.target.checked }))
                    }
                  />
                  <Label htmlFor="edit-availability">Produit actif</Label>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-provider">Prestataire *</Label>
                <Select
                  value={selectedEditProviderId}
                  onValueChange={setSelectedEditProviderId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un prestataire" />
                  </SelectTrigger>
                  <SelectContent>
                    {providers.map(provider => (
                      <SelectItem key={provider.id} value={provider.id}>
                        {provider.name} ({provider.type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-status">Statut</Label>
                <Select
                  value={editForm.status}
                  onValueChange={(value: any) =>
                    setEditForm(prev => ({ ...prev, status: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Disponible</SelectItem>
                    <SelectItem value="out_of_stock">
                      Rupture de stock
                    </SelectItem>
                    <SelectItem value="discontinued">Discontinué</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Image du produit</Label>
                <div className="space-y-3">
                  <div className="flex gap-4">
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="edit-url-type"
                        checked={editForm.imageType === 'url'}
                        onChange={() => handleImageTypeChange('url', true)}
                      />
                      <Label htmlFor="edit-url-type">URL</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="edit-file-type"
                        checked={editForm.imageType === 'file'}
                        onChange={() => handleImageTypeChange('file', true)}
                      />
                      <Label htmlFor="edit-file-type">Fichier</Label>
                    </div>
                  </div>

                  {editForm.imageType === 'url' && (
                    <Input
                      id="edit-image"
                      value={editForm.image}
                      onChange={e =>
                        setEditForm(prev => ({ ...prev, image: e.target.value }))
                      }
                      placeholder="https://example.com/image.jpg"
                    />
                  )}

                  {editForm.imageType === 'file' && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={e => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handleImageFileChange(file, true);
                            }
                          }}
                        />
                        <Upload className="h-4 w-4 text-muted-foreground" />
                      </div>
                      {editForm.imageFile && (
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <ImageIcon className="h-3 w-3" />
                          Fichier sélectionné: {editForm.imageFile.name}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditDialogOpen(false);
                  setEditingProduct(null);
                }}
              >
                Annuler
              </Button>
              <Button onClick={handleUpdateProduct} disabled={isSubmitting}>
                {isSubmitting ? 'Modification...' : 'Modifier le produit'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un produit..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9"
                data-testid="input-search-products"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger
                className="w-full md:w-[200px]"
                data-testid="select-category-filter"
              >
                <SelectValue placeholder="Catégorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes catégories</SelectItem>
                <SelectItem value="Restaurant">Restaurant</SelectItem>
                <SelectItem value="Supermarché">Supermarché</SelectItem>
                <SelectItem value="Pharmacie">Pharmacie</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {products.length > 0 ? (
              products.map(product => (
                <Card
                  key={product.id}
                  className="overflow-hidden"
                  data-testid={`product-card-${product.id}`}
                >
                  <div className="h-32 bg-muted flex items-center justify-center overflow-hidden">
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.name}
                        className="h-full w-full object-cover"
                        onError={e => {
                          const target = e.target as HTMLImageElement;
                          const container = target.parentElement;
                          const fallback =
                            container?.querySelector('.fallback-icon');
                          if (target && container && fallback) {
                            target.style.display = 'none';
                            (fallback as HTMLElement).style.display = 'flex';
                          }
                        }}
                      />
                    ) : null}
                    <div
                      className={`fallback-icon h-12 w-12 text-muted-foreground ${
                        product.image ? 'hidden' : 'flex'
                      } items-center justify-center`}
                    >
                      <ImageIcon className="h-12 w-12" />
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium">{product.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {product.provider}
                          </p>
                          {product.options && product.options.length > 0 && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Options:{' '}
                              {product.options
                                .map(
                                  opt =>
                                    `${opt.name} (${
                                      opt.required ? 'Requis' : 'Optionnel'
                                    })`,
                                )
                                .join(', ')}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <Badge variant="secondary" className="text-xs">
                            {product.category}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {product.deliveryCategory}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="bg-muted/50 rounded p-2">
                          <span className="text-xs text-muted-foreground">Prix: </span>
                          <span className="font-semibold">{product.price} DT</span>
                        </div>
                        <div className="bg-muted/50 rounded p-2">
                          <span className="text-xs text-muted-foreground">Payout: </span>
                          <span className="font-semibold">{product.p1} DT</span>
                        </div>
                        <div className="bg-muted/50 rounded p-2">
                          <span className="text-xs text-muted-foreground">Client: </span>
                          <span className="font-semibold">{product.p2} DT</span>
                        </div>
                        <div className="bg-muted/50 rounded p-2">
                          <span className="text-xs text-muted-foreground">Stock: </span>
                          <span className={product.stock === 0 ? 'text-destructive font-medium' : 'font-medium'}>
                            {product.stock}
                          </span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-muted/50 rounded p-2">
                          <span className="text-muted-foreground">CsR: </span>
                          <span className="font-semibold">{product.csR}%</span>
                        </div>
                        <div className="bg-muted/50 rounded p-2">
                          <span className="text-muted-foreground">CsC: </span>
                          <span className="font-semibold">{product.csC}%</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between pt-2">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="secondary"
                            className={
                              product.status === 'available'
                                ? 'bg-chart-2/10 text-chart-2'
                                : 'bg-destructive/10 text-destructive'
                            }
                          >
                            {product.status === 'available'
                              ? 'Disponible'
                              : 'Rupture'}
                          </Badge>
                          <Badge variant={product.availability ? "secondary" : "destructive"} className="text-xs">
                            {product.availability ? 'Actif' : 'Inactif'}
                          </Badge>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleEditProduct(product)}
                            data-testid={`button-edit-${product.id}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleDeleteProduct(product.id)}
                            data-testid={`button-delete-${product.id}`}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <p className="text-muted-foreground text-center py-8 col-span-full">
                Aucun produit trouvé
              </p>
            )}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              <Button
                variant="outline"
                onClick={() => fetchProducts(currentPage - 1)}
                disabled={currentPage <= 1}
              >
                Précédent
              </Button>
              <span className="flex items-center px-3">
                Page {currentPage} sur {totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => fetchProducts(currentPage + 1)}
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
