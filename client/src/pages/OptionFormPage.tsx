// src/pages/admin/OptionFormPage.tsx
import { useState, useEffect } from 'react';
import { useLocation, useRoute } from 'wouter';
import { ArrowLeft, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

export default function OptionFormPage() {
  const [, navigate] = useLocation();
  const [, params] = useRoute('/admin/options/:id/edit');
  const { toast } = useToast();
  
  const isEditMode = !!params?.id;
  const searchParams = new URLSearchParams(window.location.search);
  const groupId = searchParams.get('groupId');

  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('0');
  const [image, setImage] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [availability, setAvailability] = useState(true);

  useEffect(() => {
    if (isEditMode && params?.id) {
      fetchOptionDetails(params.id);
    }
  }, [params?.id]);

  const fetchOptionDetails = async (id: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/product-options/${id}`);
      const data = await response.json();
      setName(data.name);
      setPrice(data.price?.toString() || '0');
      setImage(data.image || '');
      setAvailability(data.availability !== false);
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de charger l\'option',
        variant: 'destructive',
      });
      navigate('/admin/option-groups');
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast({
        title: 'Erreur',
        description: 'Le nom est requis',
        variant: 'destructive',
      });
      return;
    }

    const optionData = {
      name: name.trim(),
      price: parseFloat(price) || 0,
      image,
      availability,
      groupId: groupId || undefined,
    };

    try {
      setLoading(true);
      const url = isEditMode
        ? `/api/product-options/${params?.id}`
        : '/api/product-options';
      const method = isEditMode ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(optionData),
      });

      if (response.ok) {
        toast({
          title: 'Succès',
          description: isEditMode
            ? 'Option mise à jour avec succès'
            : 'Option créée avec succès',
        });
        navigate(groupId ? '/admin/option-groups' : '/admin/options');
      }
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de sauvegarder l\'option',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container max-w-3xl mx-auto py-6 px-4">
      <Button
        variant="ghost"
        onClick={() => navigate(groupId ? '/admin/option-groups' : '/admin/options')}
        className="mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Retour
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>
            {isEditMode ? 'Modifier l\'option' : 'Ajouter une option'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Nom de l'option *</Label>
              <Input
                id="name"
                placeholder="Ex: COCKTAIL"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            {/* Price */}
            <div className="space-y-2">
              <Label htmlFor="price">Prix</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                placeholder="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                min="0"
              />
            </div>

            {/* Image */}
            <div className="space-y-2">
              <Label>Image</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                {image ? (
                  <div className="relative inline-block">
                    <img
                      src={image}
                      alt="Preview"
                      className="max-h-48 rounded-lg"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute -top-2 -right-2"
                      onClick={() => {
                        setImage('');
                        setImageFile(null);
                      }}
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

            {/* Submit */}
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(groupId ? '/admin/option-groups' : '/admin/options')}
                className="flex-1"
              >
                Annuler
              </Button>
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? 'Enregistrement...' : isEditMode ? 'Mettre à jour' : 'Créer'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
