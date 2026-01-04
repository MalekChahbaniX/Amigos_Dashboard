import { useState, useEffect } from "react";
import { DollarSign, TrendingDown, Wallet, Package, Calendar } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatsCard } from "@/components/StatsCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { apiService } from "@/lib/api";

interface Deliverer {
  id: string;
  name: string;
  phone: string;
}

interface BalanceEntry {
  date: string;
  soldeAmigos: number;
  soldeAnnulation: number;
  paid: boolean;
  paidAt: string | null;
  ordersCount: number;
}

interface BalanceData {
  deliverer: {
    id: string;
    name: string;
    phone: string;
  };
  balance: {
    cashIn: string;
    cashOut: string;
    netBalance: string;
    totalOrders: number;
    entries: BalanceEntry[];
  };
}

export default function CashManagement() {
  const { toast } = useToast();
  const [deliverers, setDeliverers] = useState<Deliverer[]>([]);
  const [selectedDelivererId, setSelectedDelivererId] = useState<string>("");
  const [balanceData, setBalanceData] = useState<BalanceData | null>(null);
  const [loading, setLoading] = useState(false);
  const [deliverersLoading, setDeliverersLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>("");

  // Load deliverers on mount
  useEffect(() => {
    const fetchDeliverers = async () => {
      try {
        setDeliverersLoading(true);
        // Fetch with high limit to get all deliverers
        const response = await apiService.getDeliverers(undefined, 1, 500);
        setDeliverers(response.deliverers);
      } catch (error: any) {
        console.error("Error fetching deliverers:", error);
        toast({
          title: "Erreur",
          description: "Impossible de charger les livreurs",
          variant: "destructive",
        });
      } finally {
        setDeliverersLoading(false);
      }
    };

    fetchDeliverers();
  }, []);

  // Load balance data when deliverer is selected
  const handleDelivererSelect = async (delivererId: string) => {
    setSelectedDelivererId(delivererId);
    setBalanceData(null);
    await fetchBalanceData(delivererId, selectedDate);
  };

  // Fetch balance data
  const fetchBalanceData = async (delivererId: string, date?: string) => {
    if (!delivererId) return;

    try {
      setLoading(true);
      const data = await apiService.getDelivererBalance(delivererId, date || undefined);
      setBalanceData(data);
    } catch (error: any) {
      console.error("Error fetching balance data:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les données de balance",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle date change
  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    if (selectedDelivererId) {
      fetchBalanceData(selectedDelivererId, date);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const formatCurrency = (value: string | number) => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    return `${numValue.toFixed(3)} DH`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Gestion Cash Out/Cash In</h1>
        <p className="text-muted-foreground">
          Consultez les données financières détaillées de chaque livreur
        </p>
      </div>

      {/* Deliverer Selection Section */}
      <Card>
        <CardHeader>
          <CardTitle>Sélectionner un livreur</CardTitle>
          <CardDescription>
            Choisissez un livreur pour afficher ses données de balance
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="deliverer-select">Livreur</Label>
              <Select value={selectedDelivererId} onValueChange={handleDelivererSelect}>
                <SelectTrigger id="deliverer-select" disabled={deliverersLoading}>
                  <SelectValue placeholder="Sélectionner un livreur..." />
                </SelectTrigger>
                <SelectContent>
                  {deliverers.map((deliverer) => (
                    <SelectItem key={deliverer.id} value={deliverer.id}>
                      {deliverer.name} ({deliverer.phone})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date-input">Date (optionnel)</Label>
              <div className="flex gap-2">
                <Input
                  id="date-input"
                  type="date"
                  value={selectedDate}
                  onChange={(e) => handleDateChange(e.target.value)}
                  disabled={!selectedDelivererId}
                />
                {selectedDate && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDateChange("")}
                  >
                    Effacer
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Balance Stats Cards */}
      {balanceData && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard
              title="Cash In"
              value={balanceData.balance.cashIn}
              icon={DollarSign}
            />
            <StatsCard
              title="Cash Out"
              value={balanceData.balance.cashOut}
              icon={TrendingDown}
            />
            <StatsCard
              title="Solde Net"
              value={balanceData.balance.netBalance}
              icon={Wallet}
            />
            <StatsCard
              title="Commandes Totales"
              value={balanceData.balance.totalOrders.toString()}
              icon={Package}
            />
          </div>

          {/* Deliverer Info Card */}
          <Card>
            <CardHeader>
              <CardTitle>Informations du livreur</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Nom</p>
                  <p className="text-lg font-semibold">{balanceData.deliverer.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Téléphone</p>
                  <p className="text-lg font-semibold">{balanceData.deliverer.phone}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">ID</p>
                  <p className="text-lg font-semibold text-xs">{balanceData.deliverer.id}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Balance Entries Table */}
          {balanceData.balance.entries.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Historique des entrées de balance</CardTitle>
                <CardDescription>
                  {selectedDate
                    ? `Données pour le ${formatDate(selectedDate)}`
                    : "Toutes les entrées de balance"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="font-semibold">Date</TableHead>
                        <TableHead className="text-right font-semibold">Cash In</TableHead>
                        <TableHead className="text-right font-semibold">Cash Out</TableHead>
                        <TableHead className="text-right font-semibold">Solde</TableHead>
                        <TableHead className="text-center font-semibold">Commandes</TableHead>
                        <TableHead className="text-center font-semibold">Payé</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {balanceData.balance.entries.map((entry, index) => (
                        <TableRow key={index} className="hover:bg-muted/50 transition-colors">
                          <TableCell className="font-medium">
                            {formatDate(entry.date)}
                          </TableCell>
                          <TableCell className="text-right text-green-600 font-semibold">
                            +{entry.soldeAmigos.toFixed(3)}
                          </TableCell>
                          <TableCell className="text-right text-red-600 font-semibold">
                            -{entry.soldeAnnulation.toFixed(3)}
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            {(entry.soldeAmigos - entry.soldeAnnulation).toFixed(3)}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline">{entry.ordersCount}</Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            {entry.paid ? (
                              <Badge variant="default" className="bg-green-600">
                                Oui
                              </Badge>
                            ) : (
                              <Badge variant="secondary">Non</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center text-muted-foreground">
                  <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Aucune donnée de balance trouvée pour cette période</p>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Empty State */}
      {!balanceData && selectedDelivererId && !loading && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">
              <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Aucune donnée disponible pour ce livreur</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
