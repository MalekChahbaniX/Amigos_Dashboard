import { useState, useEffect } from "react";
import { Search, Plus, Edit, Trash2, MapPin, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { apiService } from "@/lib/api";
import { ZoneForm } from "./ZoneForm";

interface Zone {
  id: string;
  number: number;
  minDistance: number;
  maxDistance: number;
  price: number;
  createdAt: string;
  updatedAt: string;
}

interface ZoneListProps {
  onSuccess?: () => void;
}

export function ZoneList({ onSuccess }: ZoneListProps) {
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [editingZone, setEditingZone] = useState<Zone | null>(null);

  useEffect(() => {
    fetchZones();
  }, [currentPage, searchTerm, onSuccess]);

  const fetchZones = async () => {
    try {
      setLoading(true);
      const response = await apiService.getZones(searchTerm, currentPage, 10);
      setZones(response.zones);
      setTotalPages(response.pagination.totalPages);
    } catch (error) {
      console.error("Erreur lors du chargement des zones:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleZoneCreated = () => {
    fetchZones();
    onSuccess?.();
  };

  const handleDeleteZone = async (zoneId: string) => {
    try {
      await apiService.deleteZone(zoneId);
      fetchZones(); // Recharger la liste
    } catch (error) {
      console.error("Erreur lors de la suppression de la zone:", error);
    }
  };

  const handleEditZone = (zone: Zone) => {
    setEditingZone(zone);
  };

  const handleCancelEdit = () => {
    setEditingZone(null);
  };

  const handleZoneUpdated = () => {
    fetchZones();
    setEditingZone(null);
    onSuccess?.();
  };

  const formatDistance = (min: number, max: number) => {
    if (max === Infinity) {
      return `${min}km+`;
    }
    return `${min}km - ${max}km`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestion des Zones</h1>
          <p className="text-muted-foreground">
            Gérez les zones de livraison et leurs tarifs
          </p>
        </div>
        <ZoneForm
          onSuccess={editingZone ? handleZoneCreated : handleZoneCreated}
          editingZone={editingZone}
          onCancelEdit={handleCancelEdit}
        />
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher une zone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
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
                {/* <DollarSign className="h-5 w-5" /> */}
                {zone.price} TND
              </div>

              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Créée le {new Date(zone.createdAt).toLocaleDateString()}</span>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleEditZone(zone)}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Modifier
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Supprimer la zone</AlertDialogTitle>
                      <AlertDialogDescription>
                        Êtes-vous sûr de vouloir supprimer la zone {zone.number} ?
                        Cette action est irréversible.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Annuler</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDeleteZone(zone.id)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Supprimer
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {zones.length === 0 && (
        <div className="text-center py-12">
          <MapPin className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">Aucune zone trouvée</h3>
          <p className="mt-2 text-muted-foreground">
            {searchTerm ? "Aucune zone ne correspond à votre recherche." : "Créez votre première zone de livraison."}
          </p>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2">
          <Button
            variant="outline"
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage <= 1}
          >
            Précédent
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {currentPage} sur {totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage >= totalPages}
          >
            Suivant
          </Button>
        </div>
      )}
    </div>
  );
}