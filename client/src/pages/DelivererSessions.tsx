import { useEffect, useState } from "react";
import { apiService } from "@/lib/api";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface SessionDeliverer {
  id: string;
  name?: string;
  phone?: string;
}

interface Session {
  id: string;
  deliverer: SessionDeliverer | string | null;
  active: boolean;
  startTime: string;
  endTime?: string | null;
}

export default function DelivererSessions() {
  const { toast } = useToast();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(false);
  const [onlyActive, setOnlyActive] = useState(true);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const res = await apiService.getDelivererSessions({ page: 1, limit: 50, active: onlyActive });
      const items = Array.isArray(res.sessions) ? (res.sessions as Session[]) : [];
      setSessions(items);
    } catch (err: any) {
      console.error('Error fetching sessions', err);
      toast({ title: 'Erreur', description: 'Impossible de charger les sessions', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [onlyActive]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Sessions des livreurs</h1>
          <p className="text-muted-foreground">Voir et filtrer les sessions actives des livreurs</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="text-sm">Actives uniquement</label>
          <input type="checkbox" checked={onlyActive} onChange={(e) => setOnlyActive(e.target.checked)} />
          <Button onClick={fetchSessions} disabled={loading}>{loading ? 'Chargement...' : 'Rafraîchir'}</Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Liste des sessions</p>
            <p className="text-sm text-muted-foreground">{sessions.length} résultats</p>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3">
            {sessions.length === 0 && <div className="text-center text-muted-foreground">Aucune session trouvée</div>}
            {sessions.map((s: Session) => (
              <div key={s.id} className="p-3 border rounded-md flex justify-between items-center">
                <div>
                  <div className="font-medium">{typeof s.deliverer === 'object' ? s.deliverer?.name || '—' : (s.deliverer as string) || '—'}</div>
                  <div className="text-sm text-muted-foreground">{typeof s.deliverer === 'object' ? s.deliverer?.phone || '' : ''}</div>
                </div>
                <div className="text-sm text-muted-foreground">
                  {s.active ? (
                    <span className="text-green-600 font-medium">Active • {new Date(s.startTime).toLocaleString()}</span>
                  ) : (
                    <span>Terminée • {s.endTime ? new Date(s.endTime).toLocaleString() : '—'}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
