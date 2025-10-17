import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ZoneList } from "@/components/zones/ZoneList";
import { ZonePricing } from "@/components/zones/ZonePricing";
import { CityZoneManager } from "@/components/zones/CityZoneManager";
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

export function Zones() {
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    fetchZones();
  }, [refreshKey]);

  const fetchZones = async () => {
    try {
      setLoading(true);
      const response = await apiService.getZones();
      setZones(response.zones);
    } catch (error) {
      console.error("Erreur lors du chargement des zones:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  if (loading) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <Tabs defaultValue="list" className="space-y-4">
        <TabsList>
          <TabsTrigger value="list">Liste des Zones</TabsTrigger>
          <TabsTrigger value="pricing">Tarification</TabsTrigger>
          <TabsTrigger value="cities">Villes et Zones</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          <ZoneList key={`list-${refreshKey}`} onSuccess={handleRefresh} />
        </TabsContent>

        <TabsContent value="pricing" className="space-y-4">
          <ZonePricing zones={zones} onUpdate={handleRefresh} />
        </TabsContent>

        <TabsContent value="cities" className="space-y-4">
          <CityZoneManager zones={zones} onUpdate={handleRefresh} />
        </TabsContent>
      </Tabs>
    </div>
  );
}