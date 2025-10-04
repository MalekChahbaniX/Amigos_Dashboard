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

interface Product {
  id: string;
  name: string;
  category: string;
  provider: string;
  price: number;
  stock: number;
  status: "available" | "out_of_stock" | "discontinued";
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
}

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createForm, setCreateForm] = useState<CreateProductForm>({
    name: "",
    description: "",
    price: "",
    category: "",
    stock: "",
    status: "available"
  });

  const fetchProducts = async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "12",
        ...(searchQuery && { search: searchQuery }),
        ...(categoryFilter !== "all" && { category: categoryFilter })
      });

      const response = await fetch(`/api/products?${params}`);
      if (response.ok) {
        const data: ProductsResponse = await response.json();
        setProducts(data.products);
        setTotalPages(data.totalPages);
        setCurrentPage(data.page);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
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
        const response = await fetch(`/api/products/${productId}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          fetchProducts(currentPage);
        }
      } catch (error) {
        console.error('Error deleting product:', error);
      }
    }
  };

  const handleCreateProduct = async () => {
    if (!createForm.name || !createForm.price || !createForm.category) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setIsSubmitting(true);
    try {
      const productData = {
        name: createForm.name,
        description: createForm.description,
        price: parseFloat(createForm.price),
        category: createForm.category,
        stock: parseInt(createForm.stock) || 0,
        status: createForm.status,
        providerId: "1" // TODO: Get from selected provider
      };

      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
      });

      if (response.ok) {
        setIsCreateDialogOpen(false);
        setCreateForm({
          name: "",
          description: "",
          price: "",
          category: "",
          stock: "",
          status: "available"
        });
        fetchProducts(1);
      } else {
        alert('Erreur lors de la création du produit');
      }
    } catch (error) {
      console.error('Error creating product:', error);
      alert('Erreur lors de la création du produit');
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
      status: "available"
    });
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Chargement...</div>;
  }

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
          <DialogContent className="sm:max-w-[425px]">
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
                <div className="h-32 bg-muted flex items-center justify-center">
                  <ImageIcon className="h-12 w-12 text-muted-foreground" />
                </div>
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium">{product.name}</h3>
                        <p className="text-sm text-muted-foreground">{product.provider}</p>
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
    </div>
  );
}
