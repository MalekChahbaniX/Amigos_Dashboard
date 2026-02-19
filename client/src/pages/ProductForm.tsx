// src/components/admin/ProductForm.tsx
import { useState, useEffect } from 'react';
import { Upload, X, Check, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { apiService } from '@/lib/api';

interface OptionGroup {
  _id: string;
  name: string;
  description?: string;
  min?: number;
  max?: number;
  image?: string;
  options: Array<{
    _id: string;
    name: string;
    price: number;
  }>;
}

interface Product {
   id: string;
   name: string;
   description?: string;
   price?: number;
   p1?: number;
   p2?: number;
   category: string;
   image?: string;
   status: "available" | "out_of_stock" | "discontinued";
   stock?: number;
   provider?: string;
   providerId?: string;
   optionGroups?: string[];
   availability?: boolean;
   csR?: number;
   csC?: number;
   deliveryCategory?: string;
   variants?: Array<{
    name: string;
    quantity?: number;
    unit?: string;
    price?: number;
    stock?: number;
    csR?: number;
    csC?: number;
    p1?: number;
    p2?: number;
  }>;
 }

interface ProductFormProps {
  product?: Product | null;
  onSuccess: () => void;
  onCancel: () => void;
}

interface ProductSize {
  name: string;
  price: string;
  p1?: string;
  p2?: string;
  stock?: string;
  csR?: string;
  csC?: string;
}

interface FormDataType {
  name: string;
  description: string;
  price: string;
  p1?: string;
  p2?: string;
  category: string;
  stock: string;
  image: string;
  status: "available" | "out_of_stock" | "discontinued";
  providerId: string;
  selectedOptionGroups: string[];
  availability: boolean;
  csR: string;
  csC: string;
  deliveryCategory: string;
  unitType: 'piece' | 'weight' | 'volume' | 'variable';
  unit: 'piece' | 'kg' | 'g' | 'L' | 'ml' | 'unit';
  baseQuantity: string;
  variants: ProductSize[];
}

const categories = [
  'NOS BOXES',
  'BURGERS',
  'TACOS',
  'SANDWICHES',
  'SALADES',
  'DESSERTS',
  'BOISSONS',
  'SAUCES',
];

const statusOptions = [
  { value: 'available', label: 'Disponible' },
  { value: 'out_of_stock', label: 'Rupture de stock' },
  { value: 'discontinued', label: 'Discontinué' },
];

export default function ProductForm({ product, onSuccess, onCancel }: ProductFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [optionGroups, setOptionGroups] = useState<OptionGroup[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(true);

  const [formData, setFormData] = useState<FormDataType>({
    name: '',
    description: '',
    price: '0',
    category: '',
    stock: '0',
    image: '',
    status: 'available',
    providerId: '',
    selectedOptionGroups: [] as string[],
    availability: true,
    csR: '0',
    csC: '0',
    deliveryCategory: 'restaurant',
    unitType: 'piece',
    unit: 'piece',
    baseQuantity: '1',
    variants: [],
  });

  useEffect(() => {
    fetchOptionGroups();
  }, []);

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        description: product.description || '',
        price: product.price?.toString() || '0',
        category: product.category,
        stock: product.stock?.toString() || '0',
        image: product.image || '',
        status: product.status || 'available',
        providerId: product.providerId || '',
        selectedOptionGroups: product.optionGroups || [],
        availability: product.availability !== false,
        csR: (product as any).csR?.toString() || '0',
        csC: (product as any).csC?.toString() || '0',
        deliveryCategory: (product as any).deliveryCategory || 'restaurant',
        unitType: (product as any).unitType || 'piece',
        unit: (product as any).unit || 'piece',
        baseQuantity: (product as any).baseQuantity?.toString() || '1',
        variants: product.variants?.map(v => ({
          name: v.name,
          price: v.price?.toString() || '0',
          stock: v.stock?.toString() || '0',
          csR: (v as any).csR?.toString() || '0',
          csC: (v as any).csC?.toString() || '0'
        })) || [],
      });
    }
  }, [product]);

  const addSize = () => {
    setFormData(prev => ({
      ...prev,
      variants: [...prev.variants, { name: '', price: '0', stock: '0', csR: '0', csC: '0' }]
    }));
  };

  const removeSize = (index: number) => {
    setFormData(prev => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== index)
    }));
  };

  const updateSize = (index: number, field: keyof ProductSize, value: string) => {
    const newVariants = [...formData.variants];
    newVariants[index] = { ...newVariants[index], [field]: value };
    setFormData(prev => ({ ...prev, variants: newVariants }));
  };

  const fetchOptionGroups = async () => {
    try {
      setLoadingGroups(true);
      const response = await apiService.getOptionGroups();
      setOptionGroups(response.data);
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les groupes d\'options',
        variant: 'destructive',
      });
    } finally {
      setLoadingGroups(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, image: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleOptionGroup = (groupId: string) => {
    setFormData((prev) => ({
      ...prev,
      selectedOptionGroups: prev.selectedOptionGroups.includes(groupId)
        ? prev.selectedOptionGroups.filter((id) => id !== groupId)
        : [...prev.selectedOptionGroups, groupId],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast({
        title: 'Erreur',
        description: 'Le nom du produit est requis',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.category) {
      toast({
        title: 'Erreur',
        description: 'La catégorie est requise',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);
      const formattedVariants = formData.variants
        .filter(v => v.name.trim() !== '')
        .map(v => ({
          name: v.name,
          price: parseFloat(v.price) || 0,
          stock: parseInt(v.stock || '0') || 0,
          csR: parseInt(v.csR || '0') || 0,
          csC: parseInt(v.csC || '0') || 0
        }));

      const productData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        price: parseFloat(formData.price) || 0,
        category: formData.category,
        stock: parseInt(formData.stock) || 0,
        status: formData.status,
        image: formData.image,
        providerId: formData.providerId,
        optionGroups: formData.selectedOptionGroups,
        availability: formData.availability,
        csR: parseInt(formData.csR) || 0,
        csC: parseInt(formData.csC) || 0,
        deliveryCategory: formData.deliveryCategory,
        unitType: formData.unitType,
        unit: formData.unit,
        baseQuantity: parseFloat(formData.baseQuantity) || 1,
        variants: formattedVariants,
      };

      if (product) {
        await apiService.updateProduct(product.id, productData);
        toast({
          title: 'Succès',
          description: 'Produit mis à jour avec succès',
        });
      } else {
        await apiService.createProduct(productData);
        toast({
          title: 'Succès',
          description: 'Produit créé avec succès',
        });
      }
      onSuccess();
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de sauvegarder le produit',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Informations de base</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nom du produit *</Label>
                <Input
                  id="name"
                  placeholder="Ex: YUMMY BOX"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Description du produit"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="unitType">Type d'unité *</Label>
                  <Select
                    value={formData.unitType}
                    onValueChange={(value) => setFormData({ ...formData, unitType: value as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="piece">Pièce (unités fixes)</SelectItem>
                      <SelectItem value="weight">Poids (kg, g)</SelectItem>
                      <SelectItem value="volume">Volume (L, ml)</SelectItem>
                      <SelectItem value="variable">Variantes</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Le type d'unité du produit
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="unit">Unité *</Label>
                  <Select
                    value={formData.unit}
                    onValueChange={(value) => setFormData({ ...formData, unit: value as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="piece">Pièce</SelectItem>
                      <SelectItem value="kg">Kilogramme (kg)</SelectItem>
                      <SelectItem value="g">Gramme (g)</SelectItem>
                      <SelectItem value="L">Litre (L)</SelectItem>
                      <SelectItem value="ml">Millilitre (ml)</SelectItem>
                      <SelectItem value="unit">Unité</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    L'unité de base du produit
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="baseQuantity">Quantité de base</Label>
                <Input
                  id="baseQuantity"
                  type="number"
                  step="0.01"
                  placeholder="1"
                  value={formData.baseQuantity}
                  onChange={(e) => setFormData({ ...formData, baseQuantity: e.target.value })}
                  min="0"
                />
                <p className="text-xs text-muted-foreground">
                  Ex: 1 pour 1 kg, 0.5 pour 500g, 0.25 pour 250ml
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Prix de base *</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    placeholder="0"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    min="0"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    {formData.variants.length > 0 ? 'Prix de référence (les variantes auront leurs propres prix)' : 'Prix du produit'}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="stock">Stock global</Label>
                  <Input
                    id="stock"
                    type="number"
                    placeholder="0"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    min="0"
                    disabled={formData.variants.length > 0}
                  />
                  <p className="text-xs text-muted-foreground">
                    {formData.variants.length > 0 ? 'Géré par variante' : 'Stock total disponible'}
                  </p>
                </div>
              </div>



              {/* Commission Settings */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="csR">Commission Restaurant (CsR) %</Label>
                  <Input
                    id="csR"
                    type="number"
                    step="0.1"
                    placeholder="Ex: 3.5"
                    value={formData.csR}
                    onChange={(e) => setFormData({ ...formData, csR: e.target.value })}
                    min="0"
                    max="100"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="csC">Commission Client (CsC) %</Label>
                  <Input
                    id="csC"
                    type="number"
                    step="0.1"
                    placeholder="Ex: 2.5"
                    value={formData.csC}
                    onChange={(e) => setFormData({ ...formData, csC: e.target.value })}
                    min="0"
                    max="100"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="deliveryCategory">Catégorie de Livraison</Label>
                <Select
                  value={formData.deliveryCategory}
                  onValueChange={(value) => setFormData({ ...formData, deliveryCategory: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="restaurant">Restaurant</SelectItem>
                    <SelectItem value="course">Course</SelectItem>
                    <SelectItem value="pharmacy">Pharmacie</SelectItem>
                    <SelectItem value="store">Store</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Catégorie *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Statut</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value as "available" | "out_of_stock" | "discontinued" })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Variants Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Variantes</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Optionnel - Pour les produits avec plusieurs variantes
                  </p>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={addSize}>
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter une variante
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {formData.variants.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed rounded-lg bg-muted/20">
                  <p className="text-sm text-muted-foreground">
                    Aucune variante définie
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Le prix de base sera utilisé pour ce produit
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {formData.variants.map((variant, index) => (
                    <div
                      key={index}
                      className="space-y-3 p-4 border-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                    >
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs font-medium text-muted-foreground">
                            Nom de la variante
                          </Label>
                          <Input
                            value={variant.name}
                            onChange={(e) => updateSize(index, "name", e.target.value)}
                            placeholder="Ex: S, M, L, XL"
                            className="h-10"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs font-medium text-muted-foreground">
                            Prix (TND)
                          </Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={variant.price}
                            onChange={(e) => updateSize(index, "price", e.target.value)}
                            min="0"
                            placeholder="0.00"
                            className="h-10"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs font-medium text-muted-foreground">
                            Stock
                          </Label>
                          <Input
                            type="number"
                            value={variant.stock}
                            onChange={(e) => updateSize(index, "stock", e.target.value)}
                            min="0"
                            placeholder="0"
                            className="h-10"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs font-medium text-muted-foreground">
                            CsR %
                          </Label>
                          <Input
                            type="number"
                            step="0.1"
                            value={variant.csR || '5'}
                            onChange={(e) => updateSize(index, "csR", e.target.value)}
                            min="0"
                            max="100"
                            placeholder="5"
                            className="h-10"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs font-medium text-muted-foreground">
                            CsC %
                          </Label>
                          <Input
                            type="number"
                            step="0.1"
                            value={variant.csC || '0'}
                            onChange={(e) => updateSize(index, "csC", e.target.value)}
                            min="0"
                            max="100"
                            placeholder="0"
                            className="h-10"
                          />
                        </div>
                        <div className="flex items-end">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-destructive w-full"
                            onClick={() => removeSize(index)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Supprimer
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Image Upload */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Image du produit</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                {formData.image ? (
                  <div className="relative inline-block">
                    <img src={formData.image} alt="Preview" className="max-h-48 rounded-lg" />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute -top-2 -right-2"
                      onClick={() => setFormData({ ...formData, image: '' })}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <label htmlFor="image-upload" className="cursor-pointer">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Télécharger une image</p>
                    <input
                      id="image-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageChange}
                    />
                  </label>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Option Groups */}
        <div className="space-y-4">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-base">Groupes d'options</CardTitle>
              <p className="text-sm text-gray-500">
                Sélectionnez les groupes d'options pour ce produit
              </p>
            </CardHeader>
            <CardContent>
              {loadingGroups ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                </div>
              ) : optionGroups.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>Aucun groupe d'options disponible</p>
                </div>
              ) : (
                <ScrollArea className="h-[600px] pr-4">
                  <div className="space-y-3">
                    {optionGroups.map((group) => {
                      const isSelected = formData.selectedOptionGroups.includes(group._id);
                      return (
                        <div
                          key={group._id}
                          onClick={() => toggleOptionGroup(group._id)}
                          className={`
                            relative cursor-pointer rounded-lg border-2 p-4 transition-all
                            ${
                              isSelected
                                ? 'border-orange-500 bg-orange-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }
                          `}
                        >
                          <div className="flex items-start gap-3">
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => toggleOptionGroup(group._id)}
                              className="mt-1"
                            />
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <h4 className="font-semibold text-sm uppercase">{group.name}</h4>
                                {isSelected && (
                                  <Badge variant="secondary" className="bg-orange-500 text-white">
                                    <Check className="w-3 h-3 mr-1" />
                                    Sélectionné
                                  </Badge>
                                )}
                              </div>
                              {group.description && (
                                <p className="text-xs text-gray-600 mt-1">{group.description}</p>
                              )}
                              <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                                <span>Min: {group.min || 0}</span>
                                <span>•</span>
                                <span>Max: {group.max || 0}</span>
                                <span>•</span>
                                <span>{group.options?.length || 0} options</span>
                              </div>
                              {group.options && group.options.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-1">
                                  {group.options.slice(0, 3).map((opt) => (
                                    <Badge
                                      key={opt._id}
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      {opt.name}
                                    </Badge>
                                  ))}
                                  {group.options.length > 3 && (
                                    <Badge variant="outline" className="text-xs">
                                      +{group.options.length - 3} plus
                                    </Badge>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          Annuler
        </Button>
        <Button type="submit" disabled={loading} className="flex-1">
          {loading ? 'Enregistrement...' : product ? 'Mettre à jour' : 'Créer le produit'}
        </Button>
      </div>
    </form>
  );
}