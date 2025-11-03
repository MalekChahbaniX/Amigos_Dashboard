import { useState, useEffect } from "react";
import { Search, Plus, ImageIcon, Pencil, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { useToast } from "@/hooks/use-toast";
import { apiService } from "@/lib/api";

interface ProductSize {
  name: string;
  price: number;
  optionGroups?: string[];
}

interface ProductOption {
  name: string;
  required: boolean;
  price?: number;
  maxSelections: number;
  image?: string;
  subOptions: Array<{
    name: string;
    price?: number;
    image?: string;
  }>;
}

interface Product {
  id: string;
  name: string;
  category: string;
  provider: string;
  price: number;
  stock: number;
  status: "available" | "out_of_stock" | "discontinued";
  image?: string;
  sizes?: ProductSize[];
  options?: ProductOption[];
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
  status: "available" | "out_of_stock" | "discontinued";
  image: string;
  sizes?: ProductSize[];
  options: ProductOption[];
}

interface OptionGroup {
  _id: string;
  name: string;
  description?: string;
  image?: string;
  options: Array<{
    _id: string;
    name: string;
    price: number;
    image?: string;
  }>;
}

export default function Products() {
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editForm, setEditForm] = useState<CreateProductForm>({
    name: "",
    description: "",
    price: "",
    category: "",
    stock: "",
    status: "available",
    image: "",
    options: []
  });
  const [createForm, setCreateForm] = useState<CreateProductForm>({
    name: "",
    description: "",
    price: "",
    category: "",
    stock: "",
    status: "available",
    image: "",
    sizes: [],
    options: []
  });

  const [currentOption, setCurrentOption] = useState<string>("");
  const [currentSubOptions, setCurrentSubOptions] = useState<string>("");
  const [currentOptionRequired, setCurrentOptionRequired] = useState<boolean>(false);
  const [currentOptionPrice, setCurrentOptionPrice] = useState<number>(0);
  const [currentOptionMaxSelections, setCurrentOptionMaxSelections] = useState<number>(1);

  // Options dialog state - moved to top to fix hooks order
  const [isOptionsDialogOpen, setIsOptionsDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [optionGroups, setOptionGroups] = useState<OptionGroup[]>([]);
  const [newGroup, setNewGroup] = useState({ name: "", description: "", image: "" });
  const [newOption, setNewOption] = useState({ name: "", price: "", image: "" });

  const fetchProducts = async (page = 1) => {
    try {
      setLoading(true);
      const response = await apiService.getProducts(
        searchQuery || undefined,
        categoryFilter !== "all" ? categoryFilter : undefined,
        page,
        12
      );

      setProducts(response.products);
      setTotalPages(response.totalPages);
      setCurrentPage(response.page);
    } catch (error: any) {
      console.error('Error fetching products:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les produits",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts(1);
  }, [searchQuery, categoryFilter]);

  const handleDeleteProduct = async (productId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) {
      try {
        await apiService.deleteProduct(productId);
        toast({
          title: "Succès",
          description: "Produit supprimé avec succès",
        });
        fetchProducts(currentPage);
      } catch (error: any) {
        console.error('Error deleting product:', error);
        toast({
          title: "Erreur",
          description: "Impossible de supprimer le produit",
          variant: "destructive",
        });
      }
    }
  };

  const handleCreateProduct = async () => {
    if (!createForm.name || !createForm.price || !createForm.category) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // For now, use a default provider ID - in a real app, this would come from a provider selection
      // First, let's check if any providers exist
      const providersResponse = await apiService.getProviders();
      if (providersResponse.providers.length === 0) {
        toast({
          title: "Erreur",
          description: "Veuillez d'abord créer un prestataire avant d'ajouter des produits",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      const defaultProviderId = providersResponse.providers[0].id;
      console.log('Creating product for provider ID:', defaultProviderId);

      const response = await apiService.createProduct({
        name: createForm.name,
        description: createForm.description || undefined,
        price: parseFloat(createForm.price),
        category: createForm.category,
        stock: parseInt(createForm.stock) || 0,
        status: createForm.status,
        providerId: defaultProviderId,
        image: createForm.image || undefined,
        sizes: createForm.sizes || undefined,
        options: createForm.options || undefined,
      });

      console.log('Product created successfully:', response);

      console.log('Product created successfully:', response);

      toast({
        title: "Succès",
        description: response.message || "Produit créé avec succès",
      });

      setIsCreateDialogOpen(false);
      resetCreateForm();
      fetchProducts(1);
    } catch (error: any) {
      console.error('Error creating product:', error);
      console.error('Error details:', error.response || error);

      let errorMessage = "Erreur lors de la création du produit";

      if (error.message) {
        if (error.message.includes('Prestataire non trouvé')) {
          errorMessage = "Veuillez d'abord créer un prestataire";
        } else if (error.message.includes('required')) {
          errorMessage = "Veuillez remplir tous les champs obligatoires";
        } else {
          errorMessage = error.message;
        }
      }

      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetCreateForm = () => {
    setCreateForm({
      name: "",
      description: "",
      price: "",
      category: "",
      stock: "",
      status: "available",
      image: "",
      sizes: [],
      options: []
    });
    setCurrentOption("");
    setCurrentSubOptions("");
    setCurrentOptionRequired(false);
    setCurrentOptionPrice(0);
    setCurrentOptionMaxSelections(1);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setEditForm({
      name: product.name,
      description: "", // TODO: Get from API when available
      price: product.price.toString(),
      category: product.category,
      stock: product.stock.toString(),
      status: product.status,
      image: "", // TODO: Get from API when available
      sizes: product.sizes || [],
      options: product.options || []
    });
    setCurrentOption("");
    setCurrentSubOptions("");
    setCurrentOptionRequired(false);
    setCurrentOptionPrice(0);
    setCurrentOptionMaxSelections(1);
    setIsEditDialogOpen(true);
  };

  const handleUpdateProduct = async () => {
    if (!editingProduct || !editForm.name || !editForm.price || !editForm.category) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive",
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
        image: editForm.image || undefined,
        sizes: editForm.sizes || undefined,
        options: editForm.options || undefined,
      });

      toast({
        title: "Succès",
        description: "Produit mis à jour avec succès",
      });

      setIsEditDialogOpen(false);
      setEditingProduct(null);
      fetchProducts(currentPage);
    } catch (error: any) {
      console.error('Error updating product:', error);
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de la mise à jour du produit",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Chargement...</div>;
  }

  // 🔹 Ouvrir le dialog pour un produit
  const openOptionsDialog = async (productId: string) => {
    setSelectedProduct(products.find((p) => p.id === productId) || null);
    setIsOptionsDialogOpen(true);
    await fetchOptionGroups(productId);
  };

  // 🔹 Charger les groupes d’options du produit
  const fetchOptionGroups = async (productId: string) => {
    try {
      const res = await apiService.getOptionGroupsByProduct(productId);
      setOptionGroups(res || []);
    } catch (error) {
      console.error('Error fetching option groups:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les options du produit",
        variant: "destructive",
      });
    }
  };

  // 🔹 Créer un nouveau groupe
  const createOptionGroup = async () => {
    if (!newGroup.name || !selectedProduct) return;
    try {
      await apiService.createOptionGroup({
        name: newGroup.name,
        description: newGroup.description || undefined,
        image: newGroup.image || undefined,
        productId: selectedProduct.id,
      });
      toast({ title: "Succès", description: "Groupe ajouté" });
      setNewGroup({ name: "", description: "", image: "" });
      fetchOptionGroups(selectedProduct.id);
    } catch (err) {
      toast({ title: "Erreur", description: "Échec de création", variant: "destructive" });
    }
  };

  // 🔹 Ajouter une option dans un groupe
  const addOptionToGroup = async (groupId: string) => {
    if (!newOption.name || !selectedProduct) return;
    try {
      await apiService.addOptionToGroup(groupId, {
        name: newOption.name,
        price: parseFloat(newOption.price) || 0,
        image: newOption.image || undefined,
      });
      toast({ title: "Succès", description: "Option ajoutée" });
      setNewOption({ name: "", price: "", image: "" });
      fetchOptionGroups(selectedProduct.id);
    } catch (err) {
      toast({ title: "Erreur", description: "Échec d’ajout d’option", variant: "destructive" });
    }
  };

  // 🔹 Supprimer un groupe
  const deleteOptionGroup = async (groupId: string) => {
    if (!confirm("Supprimer ce groupe ?") || !selectedProduct) return;
    try {
      await apiService.deleteOptionGroup(groupId);
      toast({ title: "Supprimé", description: "Groupe supprimé" });
      fetchOptionGroups(selectedProduct.id);
    } catch {
      toast({ title: "Erreur", description: "Suppression échouée", variant: "destructive" });
    }
  };

  // 🔹 Supprimer une option
  const deleteOption = async (optionId: string) => {
    if (!selectedProduct) return;
    try {
      await apiService.deleteProductOption(optionId);
      toast({ title: "Supprimé", description: "Option supprimée" });
      fetchOptionGroups(selectedProduct.id);
    } catch {
      toast({ title: "Erreur", description: "Échec suppression", variant: "destructive" });
    }
  };

  const handleAddSubGroup = async (groupId: string) => {
   const subGroupName = prompt("Nom du sous-groupe ?");
   if (!subGroupName || !selectedProduct) return;

   try {
     // Crée d'abord un nouveau groupe
     const newGroup = await apiService.createOptionGroup({
       name: subGroupName,
       productId: selectedProduct.id,
     });

     // Puis lie ce nouveau groupe comme sous-groupe
     await apiService.addSubGroup(groupId, newGroup.group._id);

     toast({ title: "Sous-groupe ajouté avec succès" });
     fetchOptionGroups(selectedProduct.id);
   } catch (err) {
     toast({
       title: "Erreur",
       description: "Impossible d’ajouter le sous-groupe",
       variant: "destructive",
     });
   }
 };


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Gestion des produits</h1>
          <p className="text-muted-foreground">Gérez le catalogue de produits</p>
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
                  onChange={(e) => setCreateForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: Pizza Margherita"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={createForm.description}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
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
                    onChange={(e) => setCreateForm(prev => ({ ...prev, price: e.target.value }))}
                    placeholder="0.00"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="stock">Stock</Label>
                  <Input
                    id="stock"
                    type="number"
                    value={createForm.stock}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, stock: e.target.value }))}
                    placeholder="0"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="category">Catégorie *</Label>
                <Select value={createForm.category} onValueChange={(value) => setCreateForm(prev => ({ ...prev, category: value }))}>
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
              <div className="grid gap-2">
                <Label htmlFor="status">Statut</Label>
                <Select value={createForm.status} onValueChange={(value: any) => setCreateForm(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Disponible</SelectItem>
                    <SelectItem value="out_of_stock">Rupture de stock</SelectItem>
                    <SelectItem value="discontinued">Discontinué</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="image">Image URL</Label>
                <Input
                  id="image"
                  value={createForm.image}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, image: e.target.value }))}
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              {/* Options Section */}
              <div className="grid gap-4">
                <Label>Options (optionnel)</Label>
                <div className="space-y-2">
                  {createForm.options.map((option, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 border rounded">
                      <span className="font-medium">{option.name}:</span>
                      <span className="text-sm text-muted-foreground">
                        {option.required ? 'Requis' : 'Optionnel'} - Prix: €{option.price || 0} - Max: {option.maxSelections} - {option.subOptions.map(sub => sub.name + (sub.price ? ` (+€${sub.price})` : '')).join(', ')}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setCreateForm(prev => ({
                            ...prev,
                            options: prev.options.filter((_, i) => i !== index)
                          }));
                        }}
                        className="ml-auto"
                      >
                        ✕
                      </Button>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="Nom de l'option (ex: Frites)"
                    value={currentOption}
                    onChange={(e) => setCurrentOption(e.target.value)}
                  />
                  <Input
                    placeholder="Sous-options (ex: Frites Classiques, Frites Cheddar (+2.50))"
                    value={currentSubOptions}
                    onChange={(e) => setCurrentSubOptions(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="required"
                      checked={currentOptionRequired}
                      onChange={(e) => setCurrentOptionRequired(e.target.checked)}
                    />
                    <Label htmlFor="required">Requis</Label>
                  </div>
                  <Input
                    type="number"
                    placeholder="Prix option (€)"
                    value={currentOptionPrice || ""}
                    onChange={(e) => setCurrentOptionPrice(parseFloat(e.target.value) || 0)}
                  />
                  <Input
                    type="number"
                    placeholder="Max sélections (1)"
                    value={currentOptionMaxSelections}
                    onChange={(e) => setCurrentOptionMaxSelections(parseInt(e.target.value) || 1)}
                    min="1"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="required"
                      checked={currentOptionRequired}
                      onChange={(e) => setCurrentOptionRequired(e.target.checked)}
                    />
                    <Label htmlFor="required">Requis</Label>
                  </div>
                  <Input
                    type="number"
                    placeholder="Max sélections (1)"
                    value={currentOptionMaxSelections}
                    onChange={(e) => setCurrentOptionMaxSelections(parseInt(e.target.value) || 1)}
                    min="1"
                  />
                </div>
                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
                  onClick={() => {
                    console.log('Adding option to create form');
                    if (currentOption.trim() && currentSubOptions.trim()) {
                      const subOptions = currentSubOptions.split(',').map(s => {
                        const trimmed = s.trim();
                        const priceMatch = trimmed.match(/(.+)\s*\(\+([\d.]+)\)$/);
                        if (priceMatch) {
                          return { name: priceMatch[1].trim(), price: parseFloat(priceMatch[2]) };
                        }
                        return { name: trimmed };
                      }).filter(sub => sub.name);
                      if (subOptions.length > 0) {
                        setCreateForm(prev => ({
                          ...prev,
                          options: [...prev.options, {
                            name: currentOption.trim(),
                            required: currentOptionRequired,
                            price: currentOptionPrice,
                            maxSelections: currentOptionMaxSelections,
                            subOptions
                          }]
                        }));
                        setCurrentOption("");
                        setCurrentSubOptions("");
                        setCurrentOptionRequired(false);
                        setCurrentOptionPrice(0);
                        setCurrentOptionMaxSelections(1);
                      }
                    }
                  }}
                >
                  Ajouter Option
                </button>
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

        {/* Edit Product Dialog */}
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
                  onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: Pizza Margherita"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={editForm.description}
                  onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
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
                    onChange={(e) => setEditForm(prev => ({ ...prev, price: e.target.value }))}
                    placeholder="0.00"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-stock">Stock</Label>
                  <Input
                    id="edit-stock"
                    type="number"
                    value={editForm.stock}
                    onChange={(e) => setEditForm(prev => ({ ...prev, stock: e.target.value }))}
                    placeholder="0"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-category">Catégorie *</Label>
                <Select value={editForm.category} onValueChange={(value) => setEditForm(prev => ({ ...prev, category: value }))}>
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
              <div className="grid gap-2">
                <Label htmlFor="edit-status">Statut</Label>
                <Select value={editForm.status} onValueChange={(value: any) => setEditForm(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Disponible</SelectItem>
                    <SelectItem value="out_of_stock">Rupture de stock</SelectItem>
                    <SelectItem value="discontinued">Discontinué</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-image">Image URL</Label>
                <Input
                  id="edit-image"
                  value={editForm.image}
                  onChange={(e) => setEditForm(prev => ({ ...prev, image: e.target.value }))}
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              {/* Edit Options Section */}
              <div className="grid gap-4">
                <Label>Options (optionnel)</Label>
                <div className="space-y-2">
                  {editForm.options.map((option, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 border rounded">
                      <span className="font-medium">{option.name}:</span>
                      <span className="text-sm text-muted-foreground">
                        {option.required ? 'Requis' : 'Optionnel'} - Prix: €{option.price || 0} - Max: {option.maxSelections} - {option.subOptions.map(sub => sub.name + (sub.price ? ` (+€${sub.price})` : '')).join(', ')}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditForm(prev => ({
                            ...prev,
                            options: prev.options.filter((_, i) => i !== index)
                          }));
                        }}
                        className="ml-auto"
                      >
                        ✕
                      </Button>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="Nom de l'option (ex: Frites)"
                    value={currentOption}
                    onChange={(e) => setCurrentOption(e.target.value)}
                  />
                  <Input
                    placeholder="Sous-options (ex: Frites Classiques, Frites Cheddar (+2.50))"
                    value={currentSubOptions}
                    onChange={(e) => setCurrentSubOptions(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="edit-required"
                      checked={currentOptionRequired}
                      onChange={(e) => setCurrentOptionRequired(e.target.checked)}
                    />
                    <Label htmlFor="edit-required">Requis</Label>
                  </div>
                  <Input
                    type="number"
                    placeholder="Prix option (€)"
                    value={currentOptionPrice || ""}
                    onChange={(e) => setCurrentOptionPrice(parseFloat(e.target.value) || 0)}
                  />
                  <Input
                    type="number"
                    placeholder="Max sélections (1)"
                    value={currentOptionMaxSelections}
                    onChange={(e) => setCurrentOptionMaxSelections(parseInt(e.target.value) || 1)}
                    min="1"
                  />
                </div>
                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
                  onClick={() => {
                    console.log('Adding option to edit form');
                    if (currentOption.trim() && currentSubOptions.trim()) {
                      const subOptions = currentSubOptions.split(',').map(s => {
                        const trimmed = s.trim();
                        const priceMatch = trimmed.match(/(.+)\s*\(\+([\d.]+)\)$/);
                        if (priceMatch) {
                          return { name: priceMatch[1].trim(), price: parseFloat(priceMatch[2]) };
                        }
                        return { name: trimmed };
                      }).filter(sub => sub.name);
                      if (subOptions.length > 0) {
                        setEditForm(prev => ({
                          ...prev,
                          options: [...prev.options, {
                            name: currentOption.trim(),
                            required: currentOptionRequired,
                            price: currentOptionPrice,
                            maxSelections: currentOptionMaxSelections,
                            subOptions
                          }]
                        }));
                        setCurrentOption("");
                        setCurrentSubOptions("");
                        setCurrentOptionRequired(false);
                        setCurrentOptionPrice(0);
                        setCurrentOptionMaxSelections(1);
                      }
                    }
                  }}
                >
                  Ajouter Option
                </button>
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
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                data-testid="input-search-products"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full md:w-[200px]" data-testid="select-category-filter">
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
            {products.length > 0 ? products.map((product) => (
              <Card key={product.id} className="overflow-hidden" data-testid={`product-card-${product.id}`}>
                <div className="h-32 bg-muted flex items-center justify-center overflow-hidden">
                  {product.image ? (
                    <img
                      src={product.image}
                      alt={product.name}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        const container = target.parentElement;
                        const fallback = container?.querySelector('.fallback-icon');
                        if (target && container && fallback) {
                          target.style.display = 'none';
                          (fallback as HTMLElement).style.display = 'flex';
                        }
                      }}
                    />
                  ) : null}
                  <div className={`fallback-icon h-12 w-12 text-muted-foreground ${product.image ? 'hidden' : 'flex'} items-center justify-center`}>
                    <ImageIcon className="h-12 w-12" />
                  </div>
                </div>
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium">{product.name}</h3>
                        <p className="text-sm text-muted-foreground">{product.provider}</p>
                        {product.options && product.options.length > 0 && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Options: {product.options.map(opt => `${opt.name} (${opt.required ? 'Requis' : 'Optionnel'})`).join(', ')}
                          </p>
                        )}
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {product.category}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-lg font-semibold text-primary">{product.price} DT</p>
                      <div className="text-sm">
                        <span className="text-muted-foreground">Stock: </span>
                        <span className={product.stock === 0 ? 'text-destructive font-medium' : 'font-medium'}>
                          {product.stock}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-2">
                      <Badge
                        variant="secondary"
                        className={product.status === 'available'
                          ? 'bg-chart-2/10 text-chart-2'
                          : 'bg-destructive/10 text-destructive'
                        }
                      >
                        {product.status === 'available' ? 'Disponible' : 'Rupture'}
                      </Badge>
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
            )) : (
              <p className="text-muted-foreground text-center py-8 col-span-full">Aucun produit trouvé</p>
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

      <Dialog open={isOptionsDialogOpen} onOpenChange={setIsOptionsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Gérer les options du produit</DialogTitle>
            <DialogDescription>
              Ajoutez ou modifiez les groupes d’options (ex: Taille, Sauce, Suppléments)
            </DialogDescription>
          </DialogHeader>

          {selectedProduct && (
            <div className="space-y-4">
              {optionGroups.length > 0 ? (
                optionGroups.map((group) => (
                  <Card key={group._id}>
                    <CardHeader className="flex justify-between items-center">
                      <h4 className="font-medium">{group.name}</h4>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteOptionGroup(group._id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {group.options.map((opt: { _id: string; name: string; price: number }) => (
                          <Badge key={opt._id} className="flex items-center gap-1">
                            {opt.name} ({opt.price} DT)
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteOption(opt._id)}
                            >
                              <Trash2 className="h-3 w-3 text-destructive" />
                            </Button>
                          </Badge>
                        ))}
                      </div>
                      <div className="flex gap-2 mt-3">
                        <Input
                          placeholder="Nom de l’option"
                          value={newOption.name}
                          onChange={(e) =>
                            setNewOption({ ...newOption, name: e.target.value })
                          }
                        />
                        <Input
                          placeholder="Prix"
                          type="number"
                          value={newOption.price}
                          onChange={(e) =>
                            setNewOption({ ...newOption, price: e.target.value })
                          }
                        />
                        <Button onClick={() => addOptionToGroup(group._id)}>
                          Ajouter
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <p className="text-muted-foreground text-center py-6">
                  Aucun groupe d’options trouvé
                </p>
              )}

              <div className="border-t pt-4">
                <h4 className="font-medium mb-2">Nouveau groupe</h4>
                <div className="flex gap-2">
                  <Input
                    placeholder="Nom du groupe (ex: Taille)"
                    value={newGroup.name}
                    onChange={(e) =>
                      setNewGroup({ ...newGroup, name: e.target.value })
                    }
                  />
                  <Button onClick={createOptionGroup}>Créer le groupe</Button>
                </div>
              </div>
            </div>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleAddSubGroup(optionGroups[0]?._id || '')}
          >
            + Ajouter un sous-groupe
          </Button>

        </DialogContent>
      </Dialog>

    </div>
  );
}
