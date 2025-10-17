import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Edit, MapPin } from "lucide-react";
import { apiService } from "@/lib/api";

interface Zone {
  id: string;
  number: number;
  minDistance: number;
  maxDistance: number;
  price: number;
  createdAt: string;
  updatedAt: string;
}

interface ZonePricingProps {
  zones: Zone[];
  onUpdate?: () => void;
}

export function ZonePricing({ zones, onUpdate }: ZonePricingProps) {
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);
  const [newPrice, setNewPrice] = useState("");
  const [loading, setLoading] = useState(false);

  const handleUpdatePrice = async () => {
    if (!selectedZone || !newPrice || isNaN(Number(newPrice))) {
      return;
    }

    try {
      setLoading(true);
      await apiService.updateZonePrice(selectedZone.number, Number(newPrice));
      onUpdate?.();
      setSelectedZone(null);
      setNewPrice("");
    } catch (error) {
      console.error("Erreur lors de la mise à jour du prix:", error);
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
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Tarification par Zone</h2>
        <p className="text-muted-foreground">
          Modifiez les tarifs de livraison pour chaque zone
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {zones.map((zone) => (
          <Card key={zone.id} className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Zone {zone.number}
                </CardTitle>
                <Badge variant="outline">
                  #{zone.number}
                </Badge>
              </div>
              <CardDescription>
                Distance: {formatDistance(zone.minDistance, zone.maxDistance)}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2 text-2xl font-bold text-primary">
                <DollarSign className="h-5 w-5" />
                {zone.price} TND
              </div>

              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => setSelectedZone(zone)}
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Modifier le prix
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Modifier le prix de la zone {selectedZone?.number}</DialogTitle>
                    <DialogDescription>
                      Modifiez le tarif de livraison pour cette zone.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="newPrice">Nouveau prix (TND)</Label>
                      <Input
                        id="newPrice"
                        type="number"
                        min="0"
                        step="0.1"
                        value={newPrice}
                        onChange={(e) => setNewPrice(e.target.value)}
                        placeholder={`Prix actuel: ${selectedZone?.price} TND`}
                      />
                    </div>

                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground">
                        <strong>Zone {selectedZone?.number}:</strong> {formatDistance(selectedZone?.minDistance || 0, selectedZone?.maxDistance || 0)}
                      </p>
                    </div>
                  </div>

                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setSelectedZone(null);
                        setNewPrice("");
                      }}
                      disabled={loading}
                    >
                      Annuler
                    </Button>
                    <Button
                      onClick={handleUpdatePrice}
                      disabled={loading || !newPrice || isNaN(Number(newPrice))}
                    >
                      {loading ? "Modification..." : "Modifier le prix"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        ))}
      </div>

      {zones.length === 0 && (
        <div className="text-center py-12">
          <DollarSign className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">Aucune zone trouvée</h3>
          <p className="mt-2 text-muted-foreground">
            Créez d'abord des zones pour pouvoir gérer leurs tarifs.
          </p>
        </div>
      )}
    </div>
  );
}