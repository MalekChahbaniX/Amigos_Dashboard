import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Percent, Zap } from 'lucide-react';
import { apiService } from "@/lib/api";

interface GlobalPromoControlProps {
  onSuccess?: () => void;
}

export function GlobalPromoControl({ onSuccess }: GlobalPromoControlProps) {
  const [percentage, setPercentage] = useState<string>('');
  const [isActive, setIsActive] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  const handleApplyPromo = async () => {
    try {
      // Validation
      if (!percentage || percentage.trim() === '') {
        alert('Erreur: Veuillez entrer un pourcentage valide');
        return;
      }

      const percentageNum = Number(percentage);
      if (isNaN(percentageNum)) {
        alert('Erreur: Le pourcentage doit être un nombre valide');
        return;
      }

      setLoading(true);
      const response = await apiService.applyGlobalPromo(percentageNum, isActive);

      if (response.success) {
        alert(`Succès: ${response.message}`);
        setPercentage('');
        setIsActive(false);
        onSuccess?.();
      } else {
        alert(`Erreur: ${response.message || 'Une erreur est survenue'}`);
      }
    } catch (error) {
      console.error('Error applying global promo:', error);
      alert('Erreur: Impossible d\'appliquer le tarif promo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-l-4 border-l-orange-500">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-orange-500" />
            <CardTitle>Tarif Promo Global</CardTitle>
          </div>
          <Badge variant={isActive ? "default" : "outline"}>
            {isActive ? 'Actif' : 'Inactif'}
          </Badge>
        </div>
        <CardDescription>
          Appliquer un pourcentage d'augmentation ou de réduction à toutes les zones simultanément
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Pourcentage Input */}
        <div className="space-y-2">
          <Label htmlFor="percentage">Pourcentage (%)</Label>
          <div className="flex items-center gap-2">
            <Percent className="h-4 w-4 text-muted-foreground" />
            <Input
              id="percentage"
              type="number"
              step="0.1"
              placeholder="Ex: 10 (augmentation) ou -5 (réduction)"
              value={percentage}
              onChange={(e) => setPercentage(e.target.value)}
              disabled={loading}
            />
          </div>
        </div>

        {/* Switcher Activation */}
        <div className="flex items-center justify-between rounded-lg border p-3">
          <Label htmlFor="activate-promo" className="font-medium cursor-pointer">
            Activer le tarif promo
          </Label>
          <Switch
            id="activate-promo"
            checked={isActive}
            onCheckedChange={setIsActive}
            disabled={loading}
          />
        </div>

        {/* Information sur le calcul */}
        <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-900">
          <p className="font-semibold mb-1">📊 Formule de calcul:</p>
          <p className="font-mono">promoPrice = price × (1 + pourcentage/100)</p>
          {percentage && !isNaN(Number(percentage)) && (
            <div className="mt-2">
              <p>
                {Number(percentage) >= 0 ? '📈' : '📉'} Exemple: 100 TND → {(100 * (1 + Number(percentage) / 100)).toFixed(3)} TND
              </p>
            </div>
          )}
        </div>

        {/* Button */}
        <Button
          onClick={handleApplyPromo}
          disabled={loading || !percentage}
          className="w-full"
        >
          {loading ? 'Application en cours...' : 'Appliquer à toutes les zones'}
        </Button>
      </CardContent>
    </Card>
  );
}
