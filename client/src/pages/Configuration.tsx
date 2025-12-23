import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DollarSign, Settings, Save, RotateCcw, AlertCircle, CheckCircle2 } from "lucide-react";
import { apiService } from "@/lib/api";

export function Configuration() {
  const [appSettings, setAppSettings] = useState({
    appFee: 1.0,
    currency: 'TND'
  });
  const [cities, setCities] = useState<any[]>([]);
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [citySettings, setCitySettings] = useState({ multiplicateur: 1 });
  const [zones, setZones] = useState<any[]>([]);
  const [selectedZone, setSelectedZone] = useState<string>("");
  const [zoneGaranties, setZoneGaranties] = useState({
    minGarantieA1: 0,
    minGarantieA2: 0,
    minGarantieA3: 0,
    minGarantieA4: 0
  });
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [activeTab, setActiveTab] = useState<"general" | "city" | "zone">("general");

  useEffect(() => {
    fetchAppSettings();
    fetchCities();
    fetchZones();
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
      showError("Erreur lors du chargement des paramètres");
    } finally {
      setLoading(false);
    }
  };

  const fetchCities = async () => {
    try {
      const response = await apiService.getCities?.() || [];
      setCities(Array.isArray(response) ? response : response.cities || []);
    } catch (error) {
      console.error("Erreur lors du chargement des villes:", error);
    }
  };

  const fetchZones = async () => {
    try {
      const response = await apiService.getZones?.() || [];
      setZones(Array.isArray(response) ? response : response.zones || []);
    } catch (error) {
      console.error("Erreur lors du chargement des zones:", error);
    }
  };

  const fetchCitySettings = async (cityId: string) => {
    try {
      const response = await fetch(`/api/cities/${cityId}/settings`);
      if (!response.ok) throw new Error("Erreur lors du chargement");
      const data = await response.json();
      setCitySettings({ 
        multiplicateur: data.data.multiplicateur || 1 
      });
    } catch (error) {
      console.error("Erreur lors du chargement des paramètres de la ville:", error);
      showError("Erreur lors du chargement des paramètres de la ville");
    }
  };

  const fetchZoneGaranties = async (zoneId: string) => {
    try {
      const response = await fetch(`/api/zones/${zoneId}/garanties`);
      if (!response.ok) throw new Error("Erreur lors du chargement");
      const data = await response.json();
      setZoneGaranties({
        minGarantieA1: data.data.minGarantieA1 || 0,
        minGarantieA2: data.data.minGarantieA2 || 0,
        minGarantieA3: data.data.minGarantieA3 || 0,
        minGarantieA4: data.data.minGarantieA4 || 0
      });
    } catch (error) {
      console.error("Erreur lors du chargement des garanties de la zone:", error);
      showError("Erreur lors du chargement des garanties");
    }
  };

  const handleCitySelect = (cityId: string) => {
    setSelectedCity(cityId);
    if (cityId) {
      fetchCitySettings(cityId);
    }
  };

  const handleZoneSelect = (zoneId: string) => {
    setSelectedZone(zoneId);
    if (zoneId) {
      fetchZoneGaranties(zoneId);
    }
  };

  const showError = (message: string) => {
    setErrorMessage(message);
    setTimeout(() => setErrorMessage(""), 5000);
  };

  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(""), 5000);
  };

  const handleSettingChange = (field: string, value: string | number) => {
    setAppSettings(prev => ({
      ...prev,
      [field]: value
    }));
    setHasChanges(true);
  };

  const handleCitySettingChange = (field: string, value: number) => {
    setCitySettings(prev => ({
      ...prev,
      [field]: value
    }));
    setHasChanges(true);
  };

  const handleZoneGarantieChange = (field: string, value: number) => {
    setZoneGaranties(prev => ({
      ...prev,
      [field]: value
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      // Get authentication token for protected endpoints
      const token = localStorage.getItem('authToken');
      
      // Validate inputs
      if (activeTab === "general") {
        if (appSettings.appFee < 0) {
          showError("Les frais d'application doivent être positifs");
          setSaving(false);
          return;
        }
        await apiService.updateAppSettings(appSettings);
        showSuccess("Paramètres généraux sauvegardés avec succès");
      } else if (activeTab === "city") {
        if (!selectedCity) {
          showError("Veuillez sélectionner une ville");
          setSaving(false);
          return;
        }
        if (citySettings.multiplicateur <= 0) {
          showError("Le multiplicateur doit être positif (> 0)");
          setSaving(false);
          return;
        }
        if (!token) {
          showError("Session expirée. Veuillez vous reconnecter.");
          setSaving(false);
          return;
        }
        const response = await fetch(`/api/cities/${selectedCity}/multiplicateur`, {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ multiplicateur: citySettings.multiplicateur })
        });
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || "Erreur lors de la sauvegarde");
        }
        showSuccess("Multiplicateur de la ville sauvegardé avec succès");
        fetchCitySettings(selectedCity);
      } else if (activeTab === "zone") {
        if (!selectedZone) {
          showError("Veuillez sélectionner une zone");
          setSaving(false);
          return;
        }
        // Validate all values are >= 0
        Object.entries(zoneGaranties).forEach(([key, value]) => {
          if (typeof value === 'number' && value < 0) {
            throw new Error(`${key} ne peut pas être négatif`);
          }
        });
        if (!token) {
          showError("Session expirée. Veuillez vous reconnecter.");
          setSaving(false);
          return;
        }
        const response = await fetch(`/api/zones/${selectedZone}/garanties`, {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(zoneGaranties)
        });
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || "Erreur lors de la sauvegarde");
        }
        showSuccess("Garanties de la zone sauvegardées avec succès");
        fetchZoneGaranties(selectedZone);
      }
      
      setHasChanges(false);
    } catch (error: any) {
      console.error("Erreur lors de la sauvegarde:", error);
      showError(error.message || "Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    try {
      setSaving(true);
      if (activeTab === "general") {
        await apiService.resetAppSettings?.();
        await fetchAppSettings();
      } else if (activeTab === "city" && selectedCity) {
        await fetchCitySettings(selectedCity);
      } else if (activeTab === "zone" && selectedZone) {
        await fetchZoneGaranties(selectedZone);
      }
      setHasChanges(false);
      showSuccess("Réinitialisation effectuée");
    } catch (error) {
      console.error("Erreur lors de la réinitialisation:", error);
      showError("Erreur lors de la réinitialisation");
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
            Gérez les paramètres du système AMIGOS
          </p>
        </div>
        {hasChanges && (
          <Badge variant="outline" className="text-orange-600 border-orange-600">
            Modifications non sauvegardées
          </Badge>
        )}
      </div>

      {/* Messages de notification */}
      {errorMessage && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}
      {successMessage && (
        <Alert className="border-green-600 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-600">{successMessage}</AlertDescription>
        </Alert>
      )}

      {/* Onglets de configuration */}
      <div className="grid gap-6">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col space-y-4">
              <div>
                <CardTitle>Configuration du Système</CardTitle>
                <CardDescription>
                  Sélectionnez l'option à configurer
                </CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={activeTab === "general" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveTab("general")}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Paramètres Généraux
                </Button>
                <Button
                  variant={activeTab === "city" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveTab("city")}
                >
                  <DollarSign className="h-4 w-4 mr-2" />
                  Villes (Multiplicateur)
                </Button>
                <Button
                  variant={activeTab === "zone" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveTab("zone")}
                >
                  <DollarSign className="h-4 w-4 mr-2" />
                  Zones (Garanties)
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* TAB: Paramètres Généraux */}
        {activeTab === "general" && (
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
        )}

        {/* TAB: Configuration des Villes */}
        {activeTab === "city" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Configuration des Villes
              </CardTitle>
              <CardDescription>
                Modifiez le multiplicateur de revenus par ville (Multi_G/P)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert className="border-blue-200 bg-blue-50">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-700">
                  Le multiplicateur est utilisé dans la formule : <strong>Montant Course = Multiplicateur × Garantie Minimale</strong>
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label htmlFor="citySelect">Sélectionnez une ville</Label>
                <Select value={selectedCity} onValueChange={handleCitySelect}>
                  <SelectTrigger id="citySelect">
                    <SelectValue placeholder="Choisir une ville..." />
                  </SelectTrigger>
                  <SelectContent>
                    {cities.map((city: any) => (
                      <SelectItem key={city._id || city.id} value={city._id || city.id}>
                        {city.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedCity && (
                <div className="space-y-4">
                  <Separator />
                  <div className="space-y-2">
                    <Label htmlFor="multiplicateur" className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Multiplicateur (Multi_G/P)
                    </Label>
                    <Input
                      id="multiplicateur"
                      type="number"
                      min="0.1"
                      step="0.01"
                      value={citySettings.multiplicateur}
                      onChange={(e) => handleCitySettingChange("multiplicateur", parseFloat(e.target.value) || 1)}
                      placeholder="1.0"
                    />
                    <p className="text-sm text-muted-foreground">
                      Doit être supérieur à 0. Valeurs usuelles : 0.5 à 3.0
                    </p>
                  </div>

                  <Separator />

                  <div className="flex gap-2">
                    <Button
                      onClick={handleSave}
                      disabled={saving || !hasChanges}
                      className="flex-1"
                    >
                      <Save className="mr-2 h-4 w-4" />
                      {saving ? "Sauvegarde..." : "Sauvegarder le multiplicateur"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleReset}
                      disabled={saving}
                    >
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Annuler
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* TAB: Configuration des Zones */}
        {activeTab === "zone" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Configuration des Zones
              </CardTitle>
              <CardDescription>
                Modifiez les garanties minimales par type de commande (A1, A2, A3, A4)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert className="border-blue-200 bg-blue-50">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-700">
                  <div className="space-y-2">
                    <p><strong>Types de commande:</strong></p>
                    <ul className="list-disc list-inside text-sm">
                      <li><strong>A1:</strong> Commande simple (0 commandes actives)</li>
                      <li><strong>A2:</strong> Commande duale (1 commande active)</li>
                      <li><strong>A3:</strong> Commande triple (2 commandes actives)</li>
                      <li><strong>A4:</strong> Commande urgente/prioritaire</li>
                    </ul>
                  </div>
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label htmlFor="zoneSelect">Sélectionnez une zone</Label>
                <Select value={selectedZone} onValueChange={handleZoneSelect}>
                  <SelectTrigger id="zoneSelect">
                    <SelectValue placeholder="Choisir une zone..." />
                  </SelectTrigger>
                  <SelectContent>
                    {zones.map((zone: any) => (
                      <SelectItem key={zone._id || zone.id} value={zone._id || zone.id}>
                        Zone {zone.number || zone.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedZone && (
                <div className="space-y-4">
                  <Separator />
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="minA1" className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        Garantie Minimale A1 (TND)
                      </Label>
                      <Input
                        id="minA1"
                        type="number"
                        min="0"
                        step="0.1"
                        value={zoneGaranties.minGarantieA1}
                        onChange={(e) => handleZoneGarantieChange("minGarantieA1", parseFloat(e.target.value) || 0)}
                        placeholder="0"
                      />
                      <p className="text-sm text-muted-foreground">Commandes simples</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="minA2" className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        Garantie Minimale A2 (TND)
                      </Label>
                      <Input
                        id="minA2"
                        type="number"
                        min="0"
                        step="0.1"
                        value={zoneGaranties.minGarantieA2}
                        onChange={(e) => handleZoneGarantieChange("minGarantieA2", parseFloat(e.target.value) || 0)}
                        placeholder="0"
                      />
                      <p className="text-sm text-muted-foreground">Commandes duales</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="minA3" className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        Garantie Minimale A3 (TND)
                      </Label>
                      <Input
                        id="minA3"
                        type="number"
                        min="0"
                        step="0.1"
                        value={zoneGaranties.minGarantieA3}
                        onChange={(e) => handleZoneGarantieChange("minGarantieA3", parseFloat(e.target.value) || 0)}
                        placeholder="0"
                      />
                      <p className="text-sm text-muted-foreground">Commandes triples</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="minA4" className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        Garantie Minimale A4 (TND)
                      </Label>
                      <Input
                        id="minA4"
                        type="number"
                        min="0"
                        step="0.1"
                        value={zoneGaranties.minGarantieA4}
                        onChange={(e) => handleZoneGarantieChange("minGarantieA4", parseFloat(e.target.value) || 0)}
                        placeholder="0"
                      />
                      <p className="text-sm text-muted-foreground">Commandes urgentes</p>
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground mt-4">
                    Tous les montants doivent être positifs ou zéro (≥ 0)
                  </p>

                  <Separator />

                  <div className="flex gap-2">
                    <Button
                      onClick={handleSave}
                      disabled={saving || !hasChanges}
                      className="flex-1"
                    >
                      <Save className="mr-2 h-4 w-4" />
                      {saving ? "Sauvegarde..." : "Sauvegarder les garanties"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleReset}
                      disabled={saving}
                    >
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Annuler
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Information Cards */}
        <Card>
          <CardHeader>
            <CardTitle>📚 Guide d'Utilisation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div>
              <h4 className="font-semibold mb-2">🏙️ Multiplicateurs de Ville</h4>
              <p className="text-muted-foreground">
                Le multiplicateur ajuste les revenus des livreurs par ville. Une augmentation du multiplicateur
                augmente le montant de la course pour les livreurs.
              </p>
            </div>
            <Separator />
            <div>
              <h4 className="font-semibold mb-2">🎯 Garanties de Zone</h4>
              <p className="text-muted-foreground">
                Les garanties minimales définissent le revenu minimum que les livreurs reçoivent selon le type
                de commande. Ces valeurs sont multiplié par le multiplicateur de la ville.
              </p>
            </div>
            <Separator />
            <div>
              <h4 className="font-semibold mb-2">⚙️ Formule de Calcul</h4>
              <p className="text-muted-foreground font-mono bg-muted p-2 rounded">
                Montant Course = Multiplicateur × Garantie Minimale
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}