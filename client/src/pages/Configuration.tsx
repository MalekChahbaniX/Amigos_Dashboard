import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Settings, Save, RotateCcw } from "lucide-react";
import { apiService } from "@/lib/api";

export function Configuration() {
  const [appSettings, setAppSettings] = useState({
    appFee: 1.0,
    currency: 'TND'
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    fetchAppSettings();
  }, []);

  const fetchAppSettings = async () => {
    try {
      setLoading(true);
      const response = await apiService.getAppFee();
      setAppSettings({
        appFee: response.appFee,
        currency: response.currency
      });
    } catch (error) {
      console.error("Erreur lors du chargement des paramètres:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSettingChange = (field: string, value: string | number) => {
    setAppSettings(prev => ({
      ...prev,
      [field]: value
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await apiService.updateAppSettings(appSettings);
      setHasChanges(false);
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    try {
      setSaving(true);
      await apiService.resetAppSettings();
      await fetchAppSettings(); // Recharger les paramètres
      setHasChanges(false);
    } catch (error) {
      console.error("Erreur lors de la réinitialisation:", error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Configuration</h1>
          <p className="text-muted-foreground">
            Gérez les paramètres généraux de l'application
          </p>
        </div>
        {hasChanges && (
          <Badge variant="outline" className="text-orange-600 border-orange-600">
            Modifications non sauvegardées
          </Badge>
        )}
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Paramètres de l'Application
            </CardTitle>
            <CardDescription>
              Configuration des frais de service et paramètres globaux
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="appFee" className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Frais d'application (TND)
                </Label>
                <Input
                  id="appFee"
                  type="number"
                  min="0"
                  step="0.1"
                  value={appSettings.appFee}
                  onChange={(e) => handleSettingChange("appFee", parseFloat(e.target.value) || 0)}
                  placeholder="1.0"
                />
                <p className="text-sm text-muted-foreground">
                  Frais facturés à chaque commande
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency">Devise</Label>
                <Select
                  value={appSettings.currency}
                  onValueChange={(value) => handleSettingChange("currency", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TND">Dinar Tunisien (TND)</SelectItem>
                    <SelectItem value="EUR">Euro (EUR)</SelectItem>
                    <SelectItem value="USD">Dollar US (USD)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator />

            <div className="flex gap-2">
              <Button
                onClick={handleSave}
                disabled={saving || !hasChanges}
                className="flex-1"
              >
                <Save className="mr-2 h-4 w-4" />
                {saving ? "Sauvegarde..." : "Sauvegarder les modifications"}
              </Button>
              <Button
                variant="outline"
                onClick={handleReset}
                disabled={saving}
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Réinitialiser
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Informations sur les Zones</CardTitle>
            <CardDescription>
              Configuration des zones de livraison disponibles
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Les zones de livraison sont gérées dans la section "Zones" du menu principal.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Configuration des Promotions</CardTitle>
            <CardDescription>
              Paramètres globaux pour les promotions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Les promotions sont gérées dans la section "Promotions" du menu principal.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}