import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { MapPin, Plus, Building } from "lucide-react";
import { apiService } from "@/lib/api";

interface City {
  id: string;
  name: string;
  activeZones: number[];
  isActive: boolean;
  createdAt: string;
}

interface Zone {
  id: string;
  number: number;
  minDistance: number;
  maxDistance: number;
  price: number;
}

interface CityZoneManagerProps {
  zones: Zone[];
  onUpdate?: () => void;
}

export function CityZoneManager({ zones, onUpdate }: CityZoneManagerProps) {
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [selectedZones, setSelectedZones] = useState<number[]>([]);
  const [showDialog, setShowDialog] = useState(false);

  useEffect(() => {
    fetchCities();
  }, []);

  const fetchCities = async () => {
    try {
      setLoading(true);
      const response = await apiService.getCities();
      setCities(response.cities);
    } catch (error) {
      console.error("Erreur lors du chargement des villes:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCity = async (cityData: { name: string; activeZones: number[] }) => {
    try {
      setLoading(true);
      await apiService.createCity(cityData);
      await fetchCities(); // Recharger la liste
      setShowDialog(false);
    } catch (error) {
      console.error("Erreur lors de la création de la ville:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCityZones = async (cityId: string, activeZones: number[]) => {
    try {
      setLoading(true);
      await apiService.updateCityZones(cityId, activeZones);
      await fetchCities(); // Recharger la liste
      onUpdate?.();
    } catch (error) {
      console.error("Erreur lors de la mise à jour des zones:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDistance = (min: number, max: number) => {
    if (max === Infinity) {
      return `${min}km+`;
    }
    return `${min}km - ${max}km`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Gestion Villes et Zones</h2>
          <p className="text-muted-foreground">
            Associez les villes aux zones de livraison
          </p>
        </div>
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nouvelle Ville
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Créer une nouvelle ville</DialogTitle>
              <DialogDescription>
                Ajoutez une nouvelle ville et associez-la aux zones de livraison.
              </DialogDescription>
            </DialogHeader>

            <CityForm
              zones={zones}
              onSubmit={handleCreateCity}
              onCancel={() => setShowDialog(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {cities.map((city) => (
          <Card key={city.id} className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  {city.name}
                </CardTitle>
                <Badge variant={city.isActive ? "default" : "secondary"}>
                  {city.isActive ? "Actif" : "Inactif"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Zones actives:</Label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {city.activeZones.length > 0 ? (
                    city.activeZones.map(zoneNumber => {
                      const zone = zones.find(z => z.number === zoneNumber);
                      return zone ? (
                        <Badge key={zoneNumber} variant="outline">
                          Zone {zoneNumber} ({zone.price} TND)
                        </Badge>
                      ) : (
                        <Badge key={zoneNumber} variant="destructive">
                          Zone {zoneNumber} (introuvable)
                        </Badge>
                      );
                    })
                  ) : (
                    <p className="text-sm text-muted-foreground">Aucune zone active</p>
                  )}
                </div>
              </div>

              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      setSelectedCity(city);
                      setSelectedZones(city.activeZones);
                    }}
                  >
                    Modifier les zones
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Modifier les zones de {city.name}</DialogTitle>
                    <DialogDescription>
                      Sélectionnez les zones actives pour cette ville.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Zones disponibles:</Label>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {zones.map((zone) => (
                          <div key={zone.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`zone-${zone.number}`}
                              checked={selectedZones.includes(zone.number)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedZones(prev => [...prev, zone.number]);
                                } else {
                                  setSelectedZones(prev => prev.filter(z => z !== zone.number));
                                }
                              }}
                            />
                            <Label htmlFor={`zone-${zone.number}`} className="text-sm">
                              Zone {zone.number} - {formatDistance(zone.minDistance, zone.maxDistance)} - {zone.price} TND
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSelectedCity(null);
                        setSelectedZones([]);
                      }}
                    >
                      Annuler
                    </Button>
                    <Button
                      onClick={() => {
                        if (selectedCity) {
                          handleUpdateCityZones(selectedCity.id, selectedZones);
                        }
                        setSelectedCity(null);
                        setSelectedZones([]);
                      }}
                    >
                      Sauvegarder
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        ))}
      </div>

      {cities.length === 0 && (
        <div className="text-center py-12">
          <Building className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">Aucune ville configurée</h3>
          <p className="mt-2 text-muted-foreground">
            Créez votre première ville et associez-la aux zones de livraison.
          </p>
        </div>
      )}
    </div>
  );
}

interface CityFormProps {
  zones: Zone[];
  onSubmit: (data: { name: string; activeZones: number[] }) => void;
  onCancel: () => void;
}

function CityForm({ zones, onSubmit, onCancel }: CityFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    selectedZones: [] as number[]
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name.trim()) {
      onSubmit({
        name: formData.name.trim(),
        activeZones: formData.selectedZones
      });
      setFormData({ name: "", selectedZones: [] });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-2">
        <Label htmlFor="cityName">Nom de la ville</Label>
        <Input
          id="cityName"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          placeholder="Ex: Tunis, Sfax..."
        />
      </div>

      <div className="grid gap-2">
        <Label>Zones à activer:</Label>
        <div className="space-y-2 max-h-32 overflow-y-auto">
          {zones.map((zone) => (
            <div key={zone.id} className="flex items-center space-x-2">
              <Checkbox
                id={`new-zone-${zone.number}`}
                checked={formData.selectedZones.includes(zone.number)}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setFormData(prev => ({
                      ...prev,
                      selectedZones: [...prev.selectedZones, zone.number]
                    }));
                  } else {
                    setFormData(prev => ({
                      ...prev,
                      selectedZones: prev.selectedZones.filter(z => z !== zone.number)
                    }));
                  }
                }}
              />
              <Label htmlFor={`new-zone-${zone.number}`} className="text-sm">
                Zone {zone.number} - {zone.price} TND
              </Label>
            </div>
          ))}
        </div>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit">
          Créer la ville
        </Button>
      </DialogFooter>
    </form>
  );
}