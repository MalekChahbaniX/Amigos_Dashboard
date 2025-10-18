import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { apiService } from "@/lib/api";
import { Plus, Edit, Calendar, Users, DollarSign } from "lucide-react";

interface Promotion {
  id: string;
  name: string;
  status: 'active' | 'closed';
  targetServices: string[];
  maxOrders: number;
  ordersUsed: number;
  maxAmount: number;
  deliveryOnly: boolean;
  startDate: string;
  endDate?: string;
  createdAt: string;
  isActive: boolean;
}

interface PromoFormProps {
  onSuccess?: () => void;
  trigger?: React.ReactNode;
  editingPromo?: Promotion | null;
  onCancelEdit?: () => void;
}

interface PromoFormData {
  name: string;
  status: 'active' | 'closed';
  targetServices: string[];
  maxOrders: string;
  maxAmount: string;
  deliveryOnly: boolean;
  startDate: string;
  endDate: string;
}
type PromoFormErrors = {
  [K in keyof PromoFormData]?: string;
};
const serviceOptions = [
  { value: 'restaurant', label: 'Restaurant' },
  { value: 'pharmacy', label: 'Pharmacie' },
  { value: 'course', label: 'Course' }
];

export function PromoForm({ onSuccess, trigger, editingPromo, onCancelEdit }: PromoFormProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<PromoFormData>({
    name: "",
    status: 'active',
    targetServices: [],
    maxOrders: "50",
    maxAmount: "10",
    deliveryOnly: true,
    startDate: new Date().toISOString().split('T')[0],
    endDate: "",
  });
  const [errors, setErrors] = useState<PromoFormErrors>({});

  const isEditing = !!editingPromo;

  useEffect(() => {
    if (editingPromo) {
      setFormData({
        name: editingPromo.name,
        status: editingPromo.status,
        targetServices: editingPromo.targetServices,
        maxOrders: editingPromo.maxOrders.toString(),
        maxAmount: editingPromo.maxAmount.toString(),
        deliveryOnly: editingPromo.deliveryOnly,
        startDate: new Date(editingPromo.startDate).toISOString().split('T')[0],
        endDate: editingPromo.endDate ? new Date(editingPromo.endDate).toISOString().split('T')[0] : "",
      });
      setOpen(true);
    }
  }, [editingPromo]);

  useEffect(() => {
    if (!open && !editingPromo) {
      // Reset form when dialog closes and not editing
      setFormData({
        name: "",
        status: 'active',
        targetServices: [],
        maxOrders: "50",
        maxAmount: "10",
        deliveryOnly: true,
        startDate: new Date().toISOString().split('T')[0],
        endDate: "",
      });
      setErrors({});
    }
  }, [open, editingPromo]);

  const validateForm = (): boolean => {
    const newErrors: PromoFormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Le nom de la promotion est obligatoire";
    }

    if (formData.targetServices.length === 0) {
      newErrors.targetServices = "Sélectionnez au moins un service";
    }

    if (!formData.maxOrders || isNaN(Number(formData.maxOrders)) || Number(formData.maxOrders) <= 0) {
      newErrors.maxOrders = "Nombre maximum de commandes invalide";
    }

    if (!formData.maxAmount || isNaN(Number(formData.maxAmount)) || Number(formData.maxAmount) <= 0) {
      newErrors.maxAmount = "Montant maximum invalide";
    }

    if (formData.endDate && new Date(formData.endDate) <= new Date(formData.startDate)) {
      newErrors.endDate = "La date de fin doit être après la date de début";
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

      const promoData = {
        name: formData.name.trim(),
        status: formData.status,
        targetServices: formData.targetServices,
        maxOrders: Number(formData.maxOrders),
        maxAmount: Number(formData.maxAmount),
        deliveryOnly: formData.deliveryOnly,
        startDate: new Date(formData.startDate).toISOString(),
        ...(formData.endDate && { endDate: new Date(formData.endDate).toISOString() }),
      };

      if (isEditing && editingPromo) {
        // Update existing promotion
        await apiService.updatePromo(editingPromo.id, promoData);
      } else {
        // Create new promotion
        await apiService.createPromo(promoData);
      }

      // Reset form
      setFormData({
        name: "",
        status: 'active',
        targetServices: [],
        maxOrders: "50",
        maxAmount: "10",
        deliveryOnly: true,
        startDate: new Date().toISOString().split('T')[0],
        endDate: "",
      });
      setErrors({});
      setOpen(false);
      onSuccess?.();
    } catch (error) {
      console.error(`Erreur lors de ${isEditing ? 'la modification' : 'la création'} de la promotion:`, error);
    } finally {
      setLoading(false);
    }
  };

  const handleServiceChange = (service: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      targetServices: checked
        ? [...prev.targetServices, service]
        : prev.targetServices.filter(s => s !== service)
    }));
    if (errors.targetServices) {
      setErrors((prev: any) => ({ ...prev, targetServices: undefined }));
    }
  };

  const handleInputChange = (field: keyof PromoFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev: any) => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nouvelle Promotion
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "Modifier la promotion" : "Créer une nouvelle promotion"}
            </DialogTitle>
            <DialogDescription>
              {isEditing
                ? "Modifiez les paramètres de cette promotion."
                : "Configurez les paramètres de votre promotion."
              }
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nom de la promotion</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Ex: Livraison gratuite été 2024"
                className={errors.name ? "border-destructive" : ""}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="status">Statut</Label>
              <Select value={formData.status} onValueChange={(value: 'active' | 'closed') => handleInputChange("status", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="closed">Fermée</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Services concernés</Label>
              <div className="space-y-2">
                {serviceOptions.map((service) => (
                  <div key={service.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={service.value}
                      checked={formData.targetServices.includes(service.value)}
                      onCheckedChange={(checked) => handleServiceChange(service.value, checked as boolean)}
                    />
                    <Label htmlFor={service.value} className="text-sm font-normal">
                      {service.label}
                    </Label>
                  </div>
                ))}
              </div>
              {errors.targetServices && (
                <p className="text-sm text-destructive">{errors.targetServices}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="maxOrders" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Nombre max de commandes
                </Label>
                <Input
                  id="maxOrders"
                  type="number"
                  min="1"
                  value={formData.maxOrders}
                  onChange={(e) => handleInputChange("maxOrders", e.target.value)}
                  placeholder="50"
                  className={errors.maxOrders ? "border-destructive" : ""}
                />
                {errors.maxOrders && (
                  <p className="text-sm text-destructive">{errors.maxOrders}</p>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="maxAmount" className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Montant max (TND)
                </Label>
                <Input
                  id="maxAmount"
                  type="number"
                  min="0"
                  step="0.1"
                  value={formData.maxAmount}
                  onChange={(e) => handleInputChange("maxAmount", e.target.value)}
                  placeholder="10"
                  className={errors.maxAmount ? "border-destructive" : ""}
                />
                {errors.maxAmount && (
                  <p className="text-sm text-destructive">{errors.maxAmount}</p>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="deliveryOnly"
                checked={formData.deliveryOnly}
                onCheckedChange={(checked) => handleInputChange("deliveryOnly", checked)}
              />
              <Label htmlFor="deliveryOnly">Livraison uniquement (le client ne paie que la livraison)</Label>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="startDate" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Date de début
                </Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => handleInputChange("startDate", e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="endDate">Date de fin (optionnelle)</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => handleInputChange("endDate", e.target.value)}
                  className={errors.endDate ? "border-destructive" : ""}
                />
                {errors.endDate && (
                  <p className="text-sm text-destructive">{errors.endDate}</p>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setOpen(false);
                onCancelEdit?.();
              }}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading
                ? (isEditing ? "Modification..." : "Création...")
                : (isEditing ? "Modifier la promotion" : "Créer la promotion")
              }
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}