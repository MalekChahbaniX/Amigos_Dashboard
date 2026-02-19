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
    appFee: 0.00,
    currency: 'TND',
    amigosBonusCourseAmount: 0.00,
    amigosBonusEnabled: true
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
  
  // NOUVEAUX: États pour marges et frais additionnels
  const [marginSettings, setMarginSettings] = useState({
    C1: { marge: 0, minimum: 0, maximum: 0, description: '' },
    C2: { marge: 0, minimum: 0, maximum: 0, description: '' },
    C3: { marge: 0, minimum: 0, maximum: 0, description: '' },
    isActive: true
  });
  const [additionalFees, setAdditionalFees] = useState<{
    FRAIS_1: { amount: number; description: string; appliesTo: string[] };
    FRAIS_2: { amount: number; description: string; appliesTo: string[] };
    FRAIS_3: { amount: number; description: string; appliesTo: string[] };
    FRAIS_4: { amount: number; description: string; appliesTo: string[] };
    FRAIS_5: { amount: number; description: string; appliesTo: string[] };
    isActive: boolean;
  }>({
    FRAIS_1: { amount: 0, description: '', appliesTo: [] },
    FRAIS_2: { amount: 0, description: '', appliesTo: [] },
    FRAIS_3: { amount: 0, description: '', appliesTo: [] },
    FRAIS_4: { amount: 0, description: '', appliesTo: [] },
    FRAIS_5: { amount: 0, description: '', appliesTo: [] },
    isActive: true
  });
  
  // Permission/role states
  const [userRole, setUserRole] = useState<string>("");
  const [canAccessMargins, setCanAccessMargins] = useState(true);
  const [canAccessFees, setCanAccessFees] = useState(true);
  const [marginLoadError, setMarginLoadError] = useState<string>("");
  const [feeLoadError, setFeeLoadError] = useState<string>("");
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [activeTab, setActiveTab] = useState<"general" | "city" | "zone" | "margins" | "fees">("general");

  useEffect(() => {
    // Get user role from localStorage
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setUserRole(user.role || "");
      } catch (error) {
        console.error("Error parsing user data:", error);
      }
    }
    
    fetchAppSettings();
    fetchCities();
    fetchZones();
    fetchMarginSettings();
    fetchAdditionalFees();
  }, []);

  const fetchAppSettings = async () => {
    try {
      setLoading(true);
      const response = await apiService.getAppFee();
      setAppSettings({
        appFee: response.appFee,
        currency: response.currency,
        amigosBonusCourseAmount: response.amigosBonusCourseAmount || 0.00,
        amigosBonusEnabled: response.amigosBonusEnabled !== undefined ? response.amigosBonusEnabled : true
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

  const fetchMarginSettings = async () => {
    try {
      const response = await apiService.getMarginSettings();
      if (response && response.data) {
        setMarginSettings({
          C1: response.data.C1 || { marge: 0, minimum: 0, maximum: 0, description: '' },
          C2: response.data.C2 || { marge: 0, minimum: 0, maximum: 0, description: '' },
          C3: response.data.C3 || { marge: 0, minimum: 0, maximum: 0, description: '' },
          isActive: response.data.isActive !== undefined ? response.data.isActive : true
        });
        setCanAccessMargins(true);
        setMarginLoadError("");
      }
    } catch (error: any) {
      console.error("Erreur lors du chargement des marges:", error);
      // Check if it's a permission error (403)
      if (error.message && (error.message.includes("Accès refusé") || error.message.includes("rôle(s) requis"))) {
        setCanAccessMargins(false);
        setMarginLoadError("Vous n'avez pas les permissions nécessaires pour accéder aux marges. Contactez un administrateur.");
      } else {
        setMarginLoadError("Erreur lors du chargement des marges.");
      }
    }
  };

  const fetchAdditionalFees = async () => {
    try {
      const response = await apiService.getAdditionalFees();
      if (response && response.data) {
        setAdditionalFees({
          FRAIS_1: response.data.FRAIS_1 || { amount: 0, description: '', appliesTo: [] },
          FRAIS_2: response.data.FRAIS_2 || { amount: 0, description: '', appliesTo: [] },
          FRAIS_3: response.data.FRAIS_3 || { amount: 0, description: '', appliesTo: [] },
          FRAIS_4: response.data.FRAIS_4 || { amount: 0, description: '', appliesTo: [] },
          FRAIS_5: response.data.FRAIS_5 || { amount: 0, description: '', appliesTo: [] },
          isActive: response.data.isActive !== undefined ? response.data.isActive : true
        });
        setCanAccessFees(true);
        setFeeLoadError("");
      }
    } catch (error: any) {
      console.error("Erreur lors du chargement des frais additionnels:", error);
      // Check if it's a permission error (403)
      if (error.message && (error.message.includes("Accès refusé") || error.message.includes("rôle(s) requis"))) {
        setCanAccessFees(false);
        setFeeLoadError("Vous n'avez pas les permissions nécessaires pour accéder aux frais. Contactez un administrateur.");
      } else {
        setFeeLoadError("Erreur lors du chargement des frais.");
      }
    }
  };

  const fetchCitySettings = async (cityId: string) => {
    try {
      const response = await apiService.getCitySettings(cityId);
      setCitySettings({ 
        multiplicateur: response.data.multiplicateur || 1 
      });
    } catch (error) {
      console.error("Erreur lors du chargement des paramètres de la ville:", error);
      showError("Erreur lors du chargement des paramètres de la ville");
    }
  };

  const fetchZoneGaranties = async (zoneId: string) => {
    try {
      const response = await apiService.getZoneGaranties(zoneId);
      setZoneGaranties({
        minGarantieA1: response.data.minGarantieA1 || 0,
        minGarantieA2: response.data.minGarantieA2 || 0,
        minGarantieA3: response.data.minGarantieA3 || 0,
        minGarantieA4: response.data.minGarantieA4 || 0
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

  const handleSettingChange = (field: string, value: string | number | boolean) => {
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

  const handleMarginChange = (category: string, field: string, value: number) => {
    setMarginSettings(prev => {
      const newState = { ...prev };
      (newState as any)[category] = {
        ...(newState as any)[category],
        [field]: value
      };
      return newState;
    });
    setHasChanges(true);
  };

  const handleFeeChange = (feeType: string, field: string, value: number | string[]) => {
    setAdditionalFees(prev => {
      const newState = { ...prev };
      (newState as any)[feeType] = {
        ...(newState as any)[feeType],
        [field]: value
      };
      return newState;
    });
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
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
        await apiService.updateCityMultiplicateur(selectedCity, citySettings.multiplicateur);
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
        await apiService.updateZoneGaranties(selectedZone, zoneGaranties);
        showSuccess("Garanties de la zone sauvegardées avec succès");
        fetchZoneGaranties(selectedZone);
      } else if (activeTab === "margins") {
        try {
          await apiService.updateMarginSettings(marginSettings);
          showSuccess("Marges sauvegardées avec succès");
          fetchMarginSettings();
        } catch (error: any) {
          console.error("Erreur lors de la sauvegarde des marges:", error);
          showError(error.message || "Erreur lors de la sauvegarde des marges");
        }
      } else if (activeTab === "fees") {
        try {
          await apiService.updateAdditionalFees(additionalFees);
          showSuccess("Frais additionnels sauvegardés avec succès");
          fetchAdditionalFees();
        } catch (error: any) {
          console.error("Erreur lors de la sauvegarde des frais:", error);
          showError(error.message || "Erreur lors de la sauvegarde des frais");
        }
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
      } else if (activeTab === "margins") {
        await fetchMarginSettings();
      } else if (activeTab === "fees") {
        await fetchAdditionalFees();
      }
      setHasChanges(false);
      showSuccess("Réinitialisation effectuée");
    } catch (error: any) {
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
                <Button
                  variant={activeTab === "margins" ? "default" : "outline"}
                  size="sm"
                  onClick={() => canAccessMargins && setActiveTab("margins")}
                  disabled={!canAccessMargins}
                  title={!canAccessMargins ? "Accès refusé" : ""}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Marges (C1/C2/C3)
                </Button>
                <Button
                  variant={activeTab === "fees" ? "default" : "outline"}
                  size="sm"
                  onClick={() => canAccessFees && setActiveTab("fees")}
                  disabled={!canAccessFees}
                  title={!canAccessFees ? "Accès refusé" : ""}
                >
                  <DollarSign className="h-4 w-4 mr-2" />
                  Frais (FRAIS_1-5)
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
                    placeholder="0.00"
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

                <div className="space-y-2">
                  <Label htmlFor="amigosBonus" className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Bonus AMIGOS Course
                  </Label>
                  <Input
                    id="amigosBonus"
                    type="number"
                    min="0"
                    step="0.1"
                    value={appSettings.amigosBonusCourseAmount}
                    onChange={(e) => handleSettingChange("amigosBonusCourseAmount", parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                  />
                  <p className="text-sm text-muted-foreground">
                    Bonus appliqué par commande
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amigosBonusEnabled">Activer Bonus AMIGOS</Label>
                  <Select
                    value={appSettings.amigosBonusEnabled ? "true" : "false"}
                    onValueChange={(value) => handleSettingChange("amigosBonusEnabled", value === "true")}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Activé</SelectItem>
                      <SelectItem value="false">Désactivé</SelectItem>
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
                      placeholder="0.0"
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

        {/* TAB: Configuration des Marges */}
        {activeTab === "margins" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Configuration des Marges
              </CardTitle>
              <CardDescription>
                Définissez les marges pour les types de commande C1, C2, C3
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {!canAccessMargins ? (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {marginLoadError || "Vous n'avez pas les permissions nécessaires pour accéder à cette section. Contactez un administrateur pour obtenir l'accès."}
                  </AlertDescription>
                </Alert>
              ) : (
                <>
                  <Alert className="border-blue-200 bg-blue-50">
                    <AlertCircle className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-700">
                      <div className="space-y-2">
                        <p><strong>Types de commande:</strong></p>
                        <ul className="list-disc list-inside text-sm">
                          <li><strong>C1:</strong> 1 point de livraison</li>
                          <li><strong>C2:</strong> 2 points de livraison</li>
                          <li><strong>C3:</strong> 3 points de livraison</li>
                        </ul>
                      </div>
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-6">
                    {Object.entries(marginSettings).filter(([key]) => key !== 'isActive').map(([category, settings]) => (
                      <div key={category} className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor={`${category}-marge`} className="flex items-center gap-2">
                              <DollarSign className="h-4 w-4" />
                              Marge {category} (TND)
                            </Label>
                            <Input
                              id={`${category}-marge`}
                              type="number"
                              min="0"
                              step="0.01"
                              value={(settings as any).marge}
                              onChange={(e) => handleMarginChange(category, 'marge', parseFloat(e.target.value) || 0)}
                              placeholder="0.00"
                            />
                            <p className="text-sm text-muted-foreground">
                              {(settings as any).description}
                            </p>
                          </div>
                          <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                              <Label htmlFor={`${category}-minimum`}>Minimum (TND)</Label>
                              <Input
                                id={`${category}-minimum`}
                                type="number"
                                min="0"
                                step="0.01"
                                value={(settings as any).minimum}
                                onChange={(e) => handleMarginChange(category, 'minimum', parseFloat(e.target.value) || 0)}
                                placeholder="0.00"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor={`${category}-maximum`}>Maximum (TND)</Label>
                              <Input
                                id={`${category}-maximum`}
                                type="number"
                                min="0"
                                step="0.01"
                                value={(settings as any).maximum}
                                onChange={(e) => handleMarginChange(category, 'maximum', parseFloat(e.target.value) || 0)}
                                placeholder="0.00"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Separator />

                  <div className="flex gap-2">
                    <Button
                      onClick={handleSave}
                      disabled={saving || !hasChanges}
                      className="flex-1"
                    >
                      <Save className="mr-2 h-4 w-4" />
                      {saving ? "Sauvegarde..." : "Sauvegarder les marges"}
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
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* TAB: Configuration des Frais */}
        {activeTab === "fees" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Configuration des Frais Additionnels
              </CardTitle>
              <CardDescription>
                Définissez les frais additionnels FRAIS_1 à FRAIS_5
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {!canAccessFees ? (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {feeLoadError || "Vous n'avez pas les permissions nécessaires pour accéder à cette section. Contactez un administrateur pour obtenir l'accès."}
                  </AlertDescription>
                </Alert>
              ) : (
                <>
                  <Alert className="border-blue-200 bg-blue-50">
                    <AlertCircle className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-700">
                      <div className="space-y-2">
                        <p><strong>Types de frais:</strong></p>
                        <ul className="list-disc list-inside text-sm">
                          <li><strong>FRAIS_1:</strong> Frais de traitement C1</li>
                          <li><strong>FRAIS_2:</strong> Frais de service (toutes commandes)</li>
                          <li><strong>FRAIS_3:</strong> Frais de plateforme (toutes commandes)</li>
                          <li><strong>FRAIS_4:</strong> Frais additionnels personnalisés</li>
                        </ul>
                      </div>
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-6">
                    {Object.entries(additionalFees).filter(([key]) => key !== 'isActive').map(([feeType, settings]) => (
                      <div key={feeType} className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor={`${feeType}-amount`} className="flex items-center gap-2">
                              <DollarSign className="h-4 w-4" />
                              Montant {feeType} (TND)
                            </Label>
                            <Input
                              id={`${feeType}-amount`}
                              type="number"
                              min="0"
                              step="0.01"
                              value={(settings as any).amount}
                              onChange={(e) => handleFeeChange(feeType, 'amount', parseFloat(e.target.value) || 0)}
                              placeholder="0.00"
                            />
                            <p className="text-sm text-muted-foreground">
                              {(settings as any).description}
                            </p>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`${feeType}-appliesTo`}>S'applique à</Label>
                            <Select
                              value={Array.isArray((settings as any).appliesTo) ? (settings as any).appliesTo.join(',') : ''}
                              onValueChange={(value) => handleFeeChange(feeType, 'appliesTo', value.split(',').filter(v => v.trim()))}
                            >
                              <SelectTrigger id={`${feeType}-appliesTo`}>
                                <SelectValue placeholder="Sélectionner..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="ALL">Toutes les commandes</SelectItem>
                                <SelectItem value="C1">Commandes C1</SelectItem>
                                <SelectItem value="C2">Commandes C2</SelectItem>
                                <SelectItem value="C3">Commandes C3</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Separator />

                  <div className="flex gap-2">
                    <Button
                      onClick={handleSave}
                      disabled={saving || !hasChanges}
                      className="flex-1"
                    >
                      <Save className="mr-2 h-4 w-4" />
                      {saving ? "Sauvegarde..." : "Sauvegarder les frais"}
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
                </>
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