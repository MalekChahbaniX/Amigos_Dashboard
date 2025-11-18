// src/components/admin/OptionGroupForm.tsx
import { useState, useEffect } from 'react';
import { Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { apiService } from '@/lib/api';

interface OptionGroupFormProps {
  group?: {
    _id: string;
    name: string;
    description?: string;
    min?: number;
    max?: number;
    image?: string;
  } | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function OptionGroupForm({ group, onSuccess, onCancel }: OptionGroupFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    min: '0',
    max: '2',
    image: '',
  });

  useEffect(() => {
    if (group) {
      setFormData({
        name: group.name,
        description: group.description || '',
        min: group.min?.toString() || '0',
        max: group.max?.toString() || '2',
        image: group.image || '',
      });
    }
  }, [group]);

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
      const groupData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        min: parseInt(formData.min) || 0,
        max: parseInt(formData.max) || 2,
        image: formData.image,
      };

      if (group) {
        await apiService.updateOptionGroup(group._id, groupData);
        toast({
          title: 'Succès',
          description: 'Groupe mis à jour avec succès',
        });
      } else {
        await apiService.createOptionGroup(groupData);
        toast({
          title: 'Succès',
          description: 'Groupe créé avec succès',
        });
      }
      onSuccess();
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de sauvegarder le groupe',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">Nom du groupe *</Label>
        <Input
          id="name"
          placeholder="Ex: SAUCES BOX"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          placeholder="Description du groupe"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="min">Minimum</Label>
          <Input
            id="min"
            type="number"
            placeholder="0"
            value={formData.min}
            onChange={(e) => setFormData({ ...formData, min: e.target.value })}
            min="0"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="max">Maximum</Label>
          <Input
            id="max"
            type="number"
            placeholder="2"
            value={formData.max}
            onChange={(e) => setFormData({ ...formData, max: e.target.value })}
            min="1"
          />
        </div>
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

      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          Annuler
        </Button>
        <Button type="submit" disabled={loading} className="flex-1">
          {loading ? 'Enregistrement...' : group ? 'Mettre à jour' : 'Créer'}
        </Button>
      </div>
    </form>
  );
}
