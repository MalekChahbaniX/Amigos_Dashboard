// src/components/admin/OptionForm.tsx
import { useState, useEffect } from 'react';
import { Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { apiService } from '@/lib/api';

interface OptionFormProps {
  option?: {
    _id: string;
    name: string;
    price: number;
    image?: string;
  } | null;
  groupId?: string | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function OptionForm({ option, groupId, onSuccess, onCancel }: OptionFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    price: '0',
    image: '',
    availability: true,
    dineIn: true,
    delivery: true,
    takeaway: true,
  });

  useEffect(() => {
    if (option) {
      setFormData({
        name: option.name,
        price: option.price?.toString() || '0',
        image: option.image || '',
        availability: true,
        dineIn: true,
        delivery: true,
        takeaway: true,
      });
    }
  }, [option]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast({
        title: 'Erreur',
        description: 'Le nom est requis',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);
      const optionData = {
        name: formData.name.trim(),
        price: parseFloat(formData.price) || 0,
        image: formData.image,
        availability: formData.availability,
        dineIn: formData.dineIn,
        delivery: formData.delivery,
        takeaway: formData.takeaway,
        groupId: groupId || undefined,
      };

      if (option) {
        await apiService.updateProductOption(option._id, optionData);
        toast({
          title: 'Succès',
          description: 'Option mise à jour avec succès',
        });
      } else {
        await apiService.createProductOption(optionData);
        toast({
          title: 'Succès',
          description: 'Option créée avec succès',
        });
      }
      onSuccess();
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de sauvegarder l\'option',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">Nom de l'option *</Label>
        <Input
          id="name"
          placeholder="Ex: COCKTAIL"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="price">Prix</Label>
        <Input
          id="price"
          type="number"
          step="0.01"
          placeholder="0"
          value={formData.price}
          onChange={(e) => setFormData({ ...formData, price: e.target.value })}
          min="0"
        />
      </div>

      <div className="space-y-2">
        <Label>Image</Label>
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
      </div>

      <Card className="bg-gray-50">
        <CardHeader>
          <CardTitle className="text-base">Disponibilité</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="availability">Disponible</Label>
            <Switch
              id="availability"
              checked={formData.availability}
              onCheckedChange={(checked) => setFormData({ ...formData, availability: checked })}
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

      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          Annuler
        </Button>
        <Button type="submit" disabled={loading} className="flex-1">
          {loading ? 'Enregistrement...' : option ? 'Mettre à jour' : 'Créer'}
        </Button>
      </div>
    </form>
  );
}
