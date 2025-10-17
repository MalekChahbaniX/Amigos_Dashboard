import { useState, useEffect } from "react";
import { Search, Plus, Edit, Trash2, Gift, Calendar, Users, DollarSign, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { apiService } from "@/lib/api";
import { PromoForm } from "./PromoForm";

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

export function PromoList() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchPromotions();
  }, [currentPage, searchTerm, statusFilter]);

  const fetchPromotions = async () => {
    try {
      setLoading(true);
      const response = await apiService.getPromos(
        statusFilter === "all" ? undefined : statusFilter,
        currentPage,
        10
      );
      setPromotions(response.data);
      setTotalPages(response.pagination.totalPages);
    } catch (error) {
      console.error("Erreur lors du chargement des promotions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePromotion = async (promotionId: string) => {
    try {
      await apiService.deletePromo(promotionId);
      fetchPromotions(); // Recharger la liste
    } catch (error) {
      console.error("Erreur lors de la suppression de la promotion:", error);
    }
  };

  const getStatusBadge = (status: string, isActive: boolean) => {
    if (status === 'active' && isActive) {
      return <Badge className="bg-green-100 text-green-800">Actif</Badge>;
    } else if (status === 'active' && !isActive) {
      return <Badge className="bg-yellow-100 text-yellow-800">Expiré</Badge>;
    } else {
      return <Badge variant="secondary">Fermé</Badge>;
    }
  };

  const getServiceBadges = (services: string[]) => {
    const serviceLabels: { [key: string]: string } = {
      restaurant: "Restaurant",
      pharmacy: "Pharmacie",
      course: "Cours"
    };

    return services.map(service => (
      <Badge key={service} variant="outline" className="mr-1">
        {serviceLabels[service] || service}
      </Badge>
    ));
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
          <h1 className="text-3xl font-bold tracking-tight">Gestion des Promotions</h1>
          <p className="text-muted-foreground">
            Créez et gérez vos promotions et offres spéciales
          </p>
        </div>
        <PromoForm onSuccess={fetchPromotions} />
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher une promotion..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrer par statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="active">Actives</SelectItem>
            <SelectItem value="closed">Fermées</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {promotions.map((promo) => (
          <Card key={promo.id} className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Gift className="h-5 w-5" />
                  {promo.name}
                </CardTitle>
                {getStatusBadge(promo.status, promo.isActive)}
              </div>
              <CardDescription className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {new Date(promo.startDate).toLocaleDateString()}
                {promo.endDate && ` - ${new Date(promo.endDate).toLocaleDateString()}`}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4" />
                  <span>{promo.ordersUsed}/{promo.maxOrders} commandes utilisées</span>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <DollarSign className="h-4 w-4" />
                  <span>Montant max: {promo.maxAmount} TND</span>
                </div>

                {promo.deliveryOnly && (
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4" />
                    <span>Livraison uniquement</span>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap">
                {getServiceBadges(promo.targetServices)}
              </div>

              <div className="flex gap-2 pt-2">
                <Button variant="outline" size="sm" className="flex-1">
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
                      <AlertDialogTitle>Supprimer la promotion</AlertDialogTitle>
                      <AlertDialogDescription>
                        Êtes-vous sûr de vouloir supprimer la promotion "{promo.name}" ?
                        Cette action est irréversible.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Annuler</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDeletePromotion(promo.id)}
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

      {promotions.length === 0 && (
        <div className="text-center py-12">
          <Gift className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">Aucune promotion trouvée</h3>
          <p className="mt-2 text-muted-foreground">
            {searchTerm || statusFilter !== "all"
              ? "Aucune promotion ne correspond à vos critères."
              : "Créez votre première promotion."}
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