import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiService } from "@/lib/api";
import { Plus } from "lucide-react";

interface ZoneFormProps {
  onSuccess?: () => void;
  trigger?: React.ReactNode;
}

interface ZoneFormData {
  number: string;
  minDistance: string;
  maxDistance: string;
  price: string;
}

export function ZoneForm({ onSuccess, trigger }: ZoneFormProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<ZoneFormData>({
    number: "",
    minDistance: "",
    maxDistance: "",
    price: "",
  });
  const [errors, setErrors] = useState<Partial<ZoneFormData>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<ZoneFormData> = {};

    if (!formData.number || isNaN(Number(formData.number)) || Number(formData.number) <= 0) {
      newErrors.number = "Numéro de zone invalide";
    }

    if (!formData.minDistance || isNaN(Number(formData.minDistance)) || Number(formData.minDistance) < 0) {
      newErrors.minDistance = "Distance minimale invalide";
    }

    if (!formData.maxDistance || isNaN(Number(formData.maxDistance)) || Number(formData.maxDistance) <= Number(formData.minDistance)) {
      newErrors.maxDistance = "Distance maximale invalide";
    }

    if (!formData.price || isNaN(Number(formData.price)) || Number(formData.price) < 0) {
      newErrors.price = "Prix invalide";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      await apiService.createZone({
        number: Number(formData.number),
        minDistance: Number(formData.minDistance),
        maxDistance: Number(formData.maxDistance),
        price: Number(formData.price),
      });

      setFormData({
        number: "",
        minDistance: "",
        maxDistance: "",
        price: "",
      });
      setErrors({});
      setOpen(false);
      onSuccess?.();
    } catch (error) {
      console.error("Erreur lors de la création de la zone:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof ZoneFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nouvelle Zone
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Créer une nouvelle zone</DialogTitle>
            <DialogDescription>
              Ajoutez une nouvelle zone de livraison avec ses tarifs.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="number">Numéro de zone</Label>
              <Input
                id="number"
                type="number"
                min="1"
                value={formData.number}
                onChange={(e) => handleInputChange("number", e.target.value)}
                placeholder="Ex: 1, 2, 3..."
                className={errors.number ? "border-destructive" : ""}
              />
              {errors.number && (
                <p className="text-sm text-destructive">{errors.number}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="minDistance">Distance minimale (km)</Label>
              <Input
                id="minDistance"
                type="number"
                min="0"
                step="0.1"
                value={formData.minDistance}
                onChange={(e) => handleInputChange("minDistance", e.target.value)}
                placeholder="Ex: 0"
                className={errors.minDistance ? "border-destructive" : ""}
              />
              {errors.minDistance && (
                <p className="text-sm text-destructive">{errors.minDistance}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="maxDistance">Distance maximale (km)</Label>
              <Input
                id="maxDistance"
                type="number"
                min="0"
                step="0.1"
                value={formData.maxDistance}
                onChange={(e) => handleInputChange("maxDistance", e.target.value)}
                placeholder="Ex: 5 (ou laissez vide pour illimité)"
                className={errors.maxDistance ? "border-destructive" : ""}
              />
              {errors.maxDistance && (
                <p className="text-sm text-destructive">{errors.maxDistance}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="price">Prix de livraison (TND)</Label>
              <Input
                id="price"
                type="number"
                min="0"
                step="0.1"
                value={formData.price}
                onChange={(e) => handleInputChange("price", e.target.value)}
                placeholder="Ex: 2.5"
                className={errors.price ? "border-destructive" : ""}
              />
              {errors.price && (
                <p className="text-sm text-destructive">{errors.price}</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Création..." : "Créer la zone"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}