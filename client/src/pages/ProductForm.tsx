// src/components/admin/ProductForm.tsx
import { useState, useEffect } from 'react';
import { Upload, X, Check } from 'lucide-react';
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
   price: number;
   category: string;
   image?: string;
   status: "available" | "out_of_stock" | "discontinued";
   stock?: number;
   provider?: string;
   providerId?: string;
   optionGroups?: string[];
   availability?: boolean;
   dineIn?: boolean;
   delivery?: boolean;
   takeaway?: boolean;
 }

interface ProductFormProps {
  product?: Product | null;
  onSuccess: () => void;
  onCancel: () => void;
}

interface FormDataType {
  name: string;
  description: string;
  price: string;
  category: string;
  stock: string;
  image: string;
  status: "available" | "out_of_stock" | "discontinued";
  providerId: string;
  selectedOptionGroups: string[];
  availability: boolean;
  dineIn: boolean;
  delivery: boolean;
  takeaway: boolean;
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
    dineIn: true,
    delivery: true,
    takeaway: true,
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
        dineIn: product.dineIn !== false,
        delivery: product.delivery !== false,
        takeaway: product.takeaway !== false,
      });
    }
  }, [product]);

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
        dineIn: formData.dineIn,
        delivery: formData.delivery,
        takeaway: formData.takeaway,
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
                  <Label htmlFor="price">Prix *</Label>
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
                </div>

                <div className="space-y-2">
                  <Label htmlFor="stock">Stock</Label>
                  <Input
                    id="stock"
                    type="number"
                    placeholder="0"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    min="0"
                  />
                </div>
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

          {/* Availability Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Disponibilité</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="availability">Disponible</Label>
                <Switch
                  id="availability"
                  checked={formData.availability}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, availability: checked })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="dineIn">Dine-in</Label>
                <Switch
                  id="dineIn"
                  checked={formData.dineIn}
                  onCheckedChange={(checked) => setFormData({ ...formData, dineIn: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="delivery">Delivery</Label>
                <Switch
                  id="delivery"
                  checked={formData.delivery}
                  onCheckedChange={(checked) => setFormData({ ...formData, delivery: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="takeaway">Takeaway</Label>
                <Switch
                  id="takeaway"
                  checked={formData.takeaway}
                  onCheckedChange={(checked) => setFormData({ ...formData, takeaway: checked })}
                />
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
