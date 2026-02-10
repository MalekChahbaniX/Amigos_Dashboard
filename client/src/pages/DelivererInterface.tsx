import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { MapPin, Phone, Truck, Clock, DollarSign, Eye, LogOut, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useDelivererWebSocket } from "@/hooks/useDelivererWebSocket";
import { useAuth } from "@/hooks/useAuth";
import { apiService } from "@/lib/api";

interface OrderNotification {
  orderId: string;
  orderNumber: string;
  client: {
    name: string;
    phone: string;
    location: any;
  };
  provider: {
    name: string;
    type: string;
    phone: string;
    address: string;
  };
  items: any[];
  total: number;
  solde: number;
  deliveryAddress: any;
  paymentMethod: string;
  finalAmount: number;
  createdAt: string;
  platformSolde: number;
  distance?: number;
  zone?: any;
  orderType?: string;
  groupSize?: number;
  isGrouped?: boolean;
  status?: string;
}

interface DelivererOrder {
  id: string;
  orderNumber: string;
  orderType?: 'A1' | 'A2' | 'A3' | 'A4' | string;
  client: {
    name: string;
    phone: string;
    location: any;
  };
  provider: {
    name: string;
    type: string;
    phone: string;
    address: string;
  };
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  total: number;
  solde: string | number;
  soldeSimple?: number;
  soldeDual?: number;
  soldeTriple?: number;
  status: string;
  deliveryAddress: any;
  paymentMethod: string;
  finalAmount: number;
  createdAt: string;
  platformSolde: number;
  isGrouped?: boolean;
  groupedOrders?: any[];
  providerPaymentMode?: string | any[];
}

interface DelivererProfile {
  id: string;
  _id?: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email?: string;
  vehicle?: string;
  location?: any;
  status: string;
  isVerified: boolean;
  statistics: {
    totalOrders: number;
    deliveredOrders: number;
    cancelledOrders: number;
    rating: number;
    createdAt: string;
  };
}

interface DelivererEarnings {
  total: number;
  average: number;
  orderCount: number;
  deliveredCount: number;
  cancelledCount: number;
  dailySoldeAmigos?: number;
  monthly: Array<{
    month: string;
    total: number;
    orders: number;
    delivered: number;
    cancelled: number;
  }>;
}

// Admin support contact configuration
const ADMIN_SUPPORT_CONTACT = {
  phone: "+216 25 123 456",
  email: "support@amigos.tn",
  hours: "Lun-Ven 08h-18h"
};

export default function DelivererInterface() {
  const [activeTab, setActiveTab] = useState<'orders' | 'profile' | 'earnings'>('orders');
  const [availableOrders, setAvailableOrders] = useState<DelivererOrder[]>([]);
  const [assignedOrders, setAssignedOrders] = useState<DelivererOrder[]>([]);
  const [delivererProfile, setDelivererProfile] = useState<DelivererProfile | null>(null);
  const [earnings, setEarnings] = useState<DelivererEarnings | null>(null);
  const [statistics, setStatistics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Session state
  const [isSessionActive, setIsSessionActive] = useState<boolean>(false);
  const [sessionStartTime, setSessionStartTime] = useState<string | null>(null); // ISO timestamp
  const [clockTick, setClockTick] = useState<number>(Date.now()); // used to refresh duration display

  // Collection modal state
  const [collectionModalOpen, setCollectionModalOpen] = useState(false);
  const [selectedOrderForCollection, setSelectedOrderForCollection] = useState<DelivererOrder | null>(null);
  const [paymentModes, setPaymentModes] = useState<{ [key: string]: 'especes' | 'facture' }>({});

  // Delivery confirmation modal state
  const [deliveryModalOpen, setDeliveryModalOpen] = useState(false);
  const [selectedOrderForDelivery, setSelectedOrderForDelivery] = useState<DelivererOrder | null>(null);
  const [deliverySecurityCode, setDeliverySecurityCode] = useState("");

  // Security code for collection
  const [collectionSecurityCode, setCollectionSecurityCode] = useState("");

  // Session security code modal state
  const [sessionSecurityModalOpen, setSessionSecurityModalOpen] = useState(false);
  const [sessionSecurityCode, setSessionSecurityCode] = useState("");

  // Network error state
  const [networkError, setNetworkError] = useState<string | null>(null);

  // WebSocket state
  const { isConnected, isReconnecting, reconnectAttempts, newOrders, connectSocket, disconnectSocket, socketRef } = useDelivererWebSocket();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  // Auth state
  const { user, token, isLoading: authLoading, isAuthenticated, logout } = useAuth();

  // Session persistence and restoration
  useEffect(() => {
    const restoreSession = () => {
      const savedSessionStartTime = localStorage.getItem('sessionStartTime');
      const delivererSessionState = localStorage.getItem('delivererSessionState');
      const savedProfile = localStorage.getItem('delivererProfile');
      
      // Restore profile if available
      if (savedProfile) {
        try {
          const profile = JSON.parse(savedProfile);
          setDelivererProfile(profile);
        } catch (error) {
          console.error('Error restoring profile:', error);
        }
      }
      
      if (savedSessionStartTime && delivererSessionState) {
        try {
          const state = JSON.parse(delivererSessionState);
          setIsSessionActive(state.isSessionActive || false);
          setSessionStartTime(savedSessionStartTime);
          
          // Check if session is still valid (not older than 24 hours)
          const sessionStart = new Date(savedSessionStartTime).getTime();
          const now = Date.now();
          const sessionAge = now - sessionStart;
          const maxSessionAge = 24 * 60 * 60 * 1000; // 24 hours
          
          if (sessionAge > maxSessionAge) {
            // Session expired
            localStorage.removeItem('sessionStartTime');
            localStorage.removeItem('delivererSessionState');
            setSessionStartTime(null);
            setIsSessionActive(false);
          }
        } catch (error) {
          console.error('Error restoring session:', error);
        }
      }
    };
    
    restoreSession();
  }, []);

  useEffect(() => {
    console.log('🔐 Auth state changed:', {
      authLoading,
      isAuthenticated,
      hasToken: !!token,
      hasUser: !!user,
      userId: user?._id
    });
    
    // Wait for AuthContext to initialize
    if (authLoading) return;
    
    // Check authentication
    if (!isAuthenticated || !token || !user) {
      console.warn('Not authenticated');
      return;
    }

    // Fetch data only when authenticated
    fetchDelivererData();
  }, [authLoading, user, token, isAuthenticated]);

  // WebSocket initialization on mount
  useEffect(() => {
    // Wait for auth to be ready
    if (authLoading) return;
    
    // Check authentication
    if (!isAuthenticated || !token || !user) {
      console.warn('Not authenticated, skipping WebSocket connection');
      return;
    }
    
    // Try to restore deliverer ID from localStorage
    const savedDelivererId = localStorage.getItem('deliverId');
    
    if (savedDelivererId) {
      console.log('Restoring WebSocket connection with saved deliverer ID:', savedDelivererId);
      connectSocket(savedDelivererId);
    } else {
      console.log('No saved deliverer ID, will connect after fetching profile');
    }
    
    return () => {
      disconnectSocket();
    };
  }, [authLoading, isAuthenticated, token, user]);

  useEffect(() => {
    let interval: number | undefined;
    if (isSessionActive) {
      // Save session state to localStorage
      const sessionStartTime = localStorage.getItem('sessionStartTime') || new Date().toISOString();
      localStorage.setItem('sessionStartTime', sessionStartTime);
      localStorage.setItem('delivererSessionState', JSON.stringify({ isSessionActive: true }));
      
      interval = window.setInterval(() => setClockTick(Date.now()), 60_000);
    } else {
      // Clear session state from localStorage when inactive
      localStorage.removeItem('sessionStartTime');
      localStorage.removeItem('delivererSessionState');
    }
    return () => {
      if (interval) window.clearInterval(interval);
    };
  }, [isSessionActive]);

  // Handle new orders from WebSocket
  useEffect(() => {
    if (newOrders.length > 0) {
      console.log('📦 New orders received via WebSocket:', newOrders.length);
      
      // Ajouter les nouvelles commandes à la liste des commandes disponibles
      setAvailableOrders(prev => {
        const existingIds = new Set(prev.map(o => o.id));
        const newUniqueOrders = newOrders.map((order: any) => ({
          id: order.orderId, // S'assurer que l'ID est correct pour l'affichage
          orderNumber: order.orderNumber,
          orderType: (order as any).orderType || 'A1',
          client: order.client,
          provider: order.provider,
          items: order.items,
          total: order.total,
          solde: order.solde,
          deliveryAddress: order.deliveryAddress,
          paymentMethod: order.paymentMethod,
          finalAmount: order.finalAmount,
          createdAt: order.createdAt,
          platformSolde: order.platformSolde,
          distance: order.distance,
          zone: order.zone,
          groupSize: (order as any).groupSize,
          isGrouped: (order as any).isGrouped,
          status: (order as any).status || 'pending'
        } as DelivererOrder)).filter((order: any) => !existingIds.has(order.orderId));
        
        console.log('📦 Adding orders to available list:', newUniqueOrders.length);
        return [...newUniqueOrders, ...prev];
      });
    }
  }, [newOrders]);

  const fetchDelivererData = async () => {
    console.log('🔄 Fetching deliverer data...', {
      isAuthenticated,
      hasToken: !!token,
      hasUser: !!user,
      userId: user?._id
    });
    
    try {
      // Check authentication first
      if (!isAuthenticated || !token || !user) {
        console.warn('Not authenticated');
        return;
      }

      setLoading(true);
      setNetworkError(null);
      
      // Vérifier d'abord si une session est active
      let sessionActive = false;
      try {
        const sessionData = await apiService.getDelivererSession();
        sessionActive = sessionData.active;
        setIsSessionActive(sessionActive);
        if (sessionData.active && sessionData.startedAt) {
          setSessionStartTime(sessionData.startedAt);
        }
      } catch (error) {
        console.warn('Error checking session:', error);
        setIsSessionActive(false);
      }
      
      // Ne récupérer les données que si la session est active
      if (!sessionActive) {
        console.log('No active session - skipping data fetch');
        setLoading(false);
        return;
      }
      
      // Fetch all data in parallel
      const [availableOrdersData, assignedOrdersData, profileData, earningsData, statisticsData] = await Promise.all([
        apiService.getDelivererAvailableOrders(),
        apiService.getDelivererOrders(),
        apiService.getDelivererProfile(),
        apiService.getDelivererEarnings(),
        apiService.getDelivererStatistics()
      ]);

      setAvailableOrders(availableOrdersData.orders || []);
      setAssignedOrders(assignedOrdersData.orders || []);
      setDelivererProfile(profileData.profile);
      setEarnings(earningsData.earnings || earningsData);
      setStatistics(statisticsData);
      
      // WebSocket connection
      const delivererId = profileData.profile?.id;
      if (delivererId) {
        const savedDelivererId = localStorage.getItem('deliverId');
        
        // Save deliverer ID to localStorage
        localStorage.setItem('deliverId', delivererId);
        
        // Save profile to localStorage for persistence
        if (profileData.profile) {
          localStorage.setItem('delivererProfile', JSON.stringify(profileData.profile));
        }
        
        // Connect or reconnect WebSocket if needed
        if (!isConnected || savedDelivererId !== delivererId) {
          console.log('Connecting WebSocket with deliverer ID:', delivererId);
          if (socketRef.current) {
            disconnectSocket();
          }
          connectSocket(delivererId);
        }
      }
    } catch (error) {
      console.error('Error fetching deliverer data:', error);
      
      // Check if it's a network error
      if (error instanceof TypeError && error.message.includes('fetch')) {
        setNetworkError('Problème de connexion réseau. Veuillez vérifier votre connexion.');
      } else {
        setNetworkError('Erreur lors du chargement des données. Veuillez réessayer.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStartSession = () => {
    // Show security code modal instead of starting directly
    setSessionSecurityModalOpen(true);
    setSessionSecurityCode("");
  };

  const handleConfirmSessionStart = async () => {
    try {
      // Validate security code before submission
      if (!sessionSecurityCode || sessionSecurityCode.length !== 6) {
        toast({
          title: "Erreur",
          description: "Veuillez saisir votre code de sécurité à 6 chiffres",
          variant: "destructive",
        });
        return;
      }

      if ((apiService as any).startDelivererSession) {
        await (apiService as any).startDelivererSession({ securityCode: sessionSecurityCode });
      } else if ((apiService as any).startSession) {
        await (apiService as any).startSession({ securityCode: sessionSecurityCode });
      } else {
        console.warn('No API method found to start session');
      }
      
      setSessionSecurityModalOpen(false);
      setSessionSecurityCode("");
      await fetchDelivererData();
      
      toast({
        title: "Succès",
        description: "Session démarrée avec succès",
      });
    } catch (error: any) {
      console.error('Error starting session:', error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de démarrer la session. Veuillez vérifier votre code de sécurité.",
        variant: "destructive",
      });
    }
  };

  const handleEndSession = async () => {
    try {
      if ((apiService as any).endDelivererSession) {
        await (apiService as any).endDelivererSession();
      } else if ((apiService as any).endSession) {
        await (apiService as any).endSession();
      } else {
        console.warn('No API method found to end session');
      }
      // After ending session, just clear session state locally
      // Don't refetch protected endpoints as session is now inactive
      setIsSessionActive(false);
      setSessionStartTime(null);
      setAvailableOrders([]);
      setAssignedOrders([]);
    } catch (error) {
      console.error('Error ending session:', error);
    }
  };

  const handlePauseSession = async () => {
    try {
      if ((apiService as any).pauseDelivererSession) {
        await (apiService as any).pauseDelivererSession();
      } else {
        console.warn('No API method found to pause session');
      }
      await fetchDelivererData();
      toast({
        title: "Succès",
        description: "Session mise en pause",
      });
    } catch (error: any) {
      console.error('Error pausing session:', error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de mettre la session en pause.",
        variant: "destructive",
      });
    }
  };

  const handleResumeSession = async () => {
    try {
      if ((apiService as any).resumeDelivererSession) {
        await (apiService as any).resumeDelivererSession();
      } else {
        console.warn('No API method found to resume session');
      }
      await fetchDelivererData();
      toast({
        title: "Succès",
        description: "Session reprise",
      });
    } catch (error: any) {
      console.error('Error resuming session:', error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de reprendre la session.",
        variant: "destructive",
      });
    }
  };

  const getOrderSolde = (order: DelivererOrder) => {
    const t = (order.orderType || (order as any).type || '').toString();
    if (t === 'A1' && typeof order.soldeSimple === 'number') return `${order.soldeSimple} DT`;
    if (t === 'A2' && typeof order.soldeDual === 'number') return `${order.soldeDual} DT`;
    if (t === 'A3' && typeof order.soldeTriple === 'number') return `${order.soldeTriple} DT`;
    // fallback to generic solde
    return typeof order.solde === 'number' ? `${order.solde} DT` : String(order.solde || '');
  };

  const formatDuration = (iso?: string | null) => {
    if (!iso) return '';
    const start = new Date(iso).getTime();
    const now = Date.now();
    const diff = Math.max(0, now - start);
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(mins / 60);
    const minutes = mins % 60;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const handleAcceptOrder = async (orderId: string) => {
    console.log('🎯 Accepting order with ID:', orderId);
    try {
      const result = await apiService.acceptOrder(orderId);
      if (result.success) {
        fetchDelivererData();
      }
    } catch (error) {
      console.error('Error accepting order:', error);
    }
  };

  const handleRejectOrder = async (orderId: string) => {
    try {
      const result = await apiService.rejectOrder(orderId);
      if (result.success) {
        fetchDelivererData();
      }
    } catch (error) {
      console.error('Error rejecting order:', error);
    }
  };

  const handleUpdateStatus = async (orderId: string, status: string) => {
    try {
      const result = await apiService.updateOrderStatus(orderId, status);
      if (result.success) {
        fetchDelivererData();
      }
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  const handleOpenCollectionModal = (order: DelivererOrder) => {
    setSelectedOrderForCollection(order);
    // Initialize payment modes for each provider
    const initialModes: { [key: string]: 'especes' | 'facture' } = {};
    if (order.isGrouped && order.groupedOrders && order.groupedOrders.length > 0) {
      order.groupedOrders.forEach((grouped: any, idx: number) => {
        initialModes[`order_${idx}`] = 'especes';
      });
    } else {
      initialModes['main'] = 'especes';
    }
    setPaymentModes(initialModes);
    setCollectionSecurityCode("");
    setCollectionModalOpen(true);
  };

  const handleConfirmCollection = async () => {
    if (!selectedOrderForCollection) return;

    // Validate security code
    if (!collectionSecurityCode || collectionSecurityCode.length !== 6) {
      toast({
        title: "Erreur",
        description: "Veuillez saisir votre code de sécurité à 6 chiffres",
        variant: "destructive",
      });
      return;
    }

    try {
      let paymentModeData;
      if (selectedOrderForCollection.isGrouped && selectedOrderForCollection.groupedOrders?.length) {
        paymentModeData = selectedOrderForCollection.groupedOrders.map((grouped: any, idx: number) => ({
          provider: grouped.provider?.id || `provider_${idx}`,
          mode: paymentModes[`order_${idx}`] || 'especes'
        }));
      } else {
        paymentModeData = paymentModes['main'] || 'especes';
      }

      const result = await apiService.updateOrderStatus(selectedOrderForCollection.id, 'collected', {
        providerPaymentMode: paymentModeData,
        securityCode: collectionSecurityCode
      });

      if (result.success) {
        toast({
          title: "Succès",
          description: "Collecte confirmée avec succès",
        });
        setCollectionModalOpen(false);
        setSelectedOrderForCollection(null);
        setPaymentModes({});
        setCollectionSecurityCode("");
        fetchDelivererData();
      }
    } catch (error: any) {
      console.error('Error confirming collection:', error);
      toast({
        title: "Erreur",
        description: error.message || "Code de sécurité invalide ou erreur lors de la confirmation",
        variant: "destructive",
      });
    }
  };

  const handleOpenDeliveryModal = (order: DelivererOrder) => {
    setSelectedOrderForDelivery(order);
    setDeliverySecurityCode("");
    setDeliveryModalOpen(true);
  };

  const handleConfirmDelivery = async () => {
    if (!selectedOrderForDelivery) return;

    // Validate security code
    if (!deliverySecurityCode || deliverySecurityCode.length !== 6) {
      toast({
        title: "Erreur",
        description: "Veuillez saisir votre code de sécurité à 6 chiffres",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await apiService.updateOrderStatus(
        selectedOrderForDelivery.id, 
        'delivered',
        { securityCode: deliverySecurityCode }
      );

      if (result.success) {
        toast({
          title: "Succès",
          description: "Livraison confirmée avec succès",
        });
        setDeliveryModalOpen(false);
        setSelectedOrderForDelivery(null);
        setDeliverySecurityCode("");
        fetchDelivererData();
      }
    } catch (error: any) {
      console.error('Error confirming delivery:', error);
      toast({
        title: "Erreur",
        description: error.message || "Code de sécurité invalide ou erreur lors de la confirmation",
        variant: "destructive",
      });
    }
  };

  const handleLogout = async () => {
    try {
      // Disconnect WebSocket before logout
      disconnectSocket();
      
      // Clear session state before logout
      localStorage.removeItem('sessionStartTime');
      localStorage.removeItem('delivererSessionState');
      localStorage.removeItem('deliverId');
      localStorage.removeItem('delivererProfile');
      setSessionStartTime(null);
      setIsSessionActive(false);
      
      // Call logout from AuthContext
      if (logout) {
        await logout();
      }
      
      // Navigate to login page
      setLocation('/login');
    } catch (error) {
      console.error('Logout error:', error);
      // Force logout on error - clear all session data
      localStorage.removeItem('sessionStartTime');
      localStorage.removeItem('delivererSessionState');
      localStorage.removeItem('deliverId');
      localStorage.removeItem('delivererProfile');
      setSessionStartTime(null);
      setIsSessionActive(false);
      
      // Still navigate to login page even on error
      setLocation('/login');
    }
  };

  if (loading && !delivererProfile) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Chargement de votre profil...</p>
              {isReconnecting && (
                <p className="text-xs text-yellow-600">
                  Reconnexion en cours... ({reconnectAttempts}/10)
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <div>
                  <h1 className="text-2xl xs:text-3xl font-semibold">
                    Interface Livreur
                  </h1>
                  <p className="text-sm xs:text-base text-muted-foreground">
                    {delivererProfile ? `${delivererProfile.firstName} ${delivererProfile.lastName}` : 'Chargement...'}
                  </p>
                </div>
                {/* Connection status badge */}
                <div className="flex flex-col items-start gap-1">
                  {isConnected && isSessionActive ? (
                    <Badge className="bg-green-500 text-white">🟢 En ligne</Badge>
                  ) : isReconnecting && isSessionActive ? (
                    <Badge className="bg-yellow-500 text-white animate-pulse">
                      🔄 Reconnexion ({reconnectAttempts}/10)
                    </Badge>
                  ) : isSessionActive ? (
                    <Badge className="bg-orange-500 text-white">🟠 Hors ligne</Badge>
                  ) : (
                    <Badge variant="secondary">⚪ Session inactive</Badge>
                  )}
                  {isReconnecting && isSessionActive && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-yellow-600">
                        Tentative {reconnectAttempts} sur 10
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const delivererId = localStorage.getItem('deliverId');
                          if (delivererId) {
                            disconnectSocket();
                            connectSocket(delivererId);
                          }
                        }}
                        className="text-xs"
                      >
                        Forcer reconnexion
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Session status line */}
              <div className="text-sm text-muted-foreground">
                {isSessionActive ? (
                  delivererProfile?.status === 'paused' ? (
                    <div>
                      <span className="text-orange-600 font-medium">Session en pause depuis {formatDuration(sessionStartTime)}</span>
                      <div className="text-xs mt-1">Reprenez la session pour recevoir des commandes</div>
                    </div>
                  ) : (
                    <span>Session active depuis {formatDuration(sessionStartTime)}</span>
                  )
                ) : (
                  <span>Session inactive</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={handleLogout}
                className="flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                Se déconnecter
              </Button>

              {/* Start/End session button */}
              {isSessionActive ? (
                <div className="flex gap-2">
                  {delivererProfile?.status === 'paused' ? (
                    <Button variant="secondary" onClick={handleResumeSession}>
                      Reprendre la session
                    </Button>
                  ) : (
                    <Button variant="secondary" onClick={handlePauseSession}>
                      Mettre en pause
                    </Button>
                  )}
                  <Button variant="destructive" onClick={handleEndSession}>
                    Terminer la session
                  </Button>
                </div>
              ) : (
                <Button variant="secondary" onClick={handleStartSession}>
                  Démarrer la session
                </Button>
              )}
            </div>
          </div>

          {/* New orders notification banner */}
          {newOrders.length > 0 && (
            <Alert className="border-blue-500 bg-blue-50">
              <AlertDescription className="text-blue-900">
                🔔 Vous avez {newOrders.length} nouvelle{newOrders.length > 1 ? 's' : ''} commande{newOrders.length > 1 ? 's' : ''} disponible{newOrders.length > 1 ? 's' : ''}
              </AlertDescription>
            </Alert>
          )}

          {/* Network error alert */}
          {networkError && (
            <Alert className="border-red-500 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-900 flex items-center justify-between gap-4">
                <span>{networkError}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchDelivererData}
                  className="border-red-300 hover:bg-red-100"
                >
                  Réessayer
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* Tabs */}
          <div className="flex flex-wrap gap-2 xs:gap-0 xs:border-b">
            <Button
              variant={activeTab === 'orders' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('orders')}
              className="flex items-center gap-2"
            >
              <Truck className="h-4 w-4" />
              Commandes
            </Button>
            <Button
              variant={activeTab === 'profile' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('profile')}
              className="flex items-center gap-2"
            >
              <Eye className="h-4 w-4" />
              Profil
            </Button>
            <Button
              variant={activeTab === 'earnings' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('earnings')}
              className="flex items-center gap-2"
            >
              <DollarSign className="h-4 w-4" />
              Gains
            </Button>
          </div>

          {/* Orders Tab */}
          {activeTab === 'orders' && (
            <div className="space-y-6">
              {/* Statistics Badges */}
              {statistics && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  {/* Badge #1: Amigos CASH */}
                  <Card className="p-4">
                    <div className="text-center space-y-2">
                      <div className="text-2xl font-bold text-blue-600">
                        {statistics.amigosCashToday || 0} DT
                      </div>
                      <div className="text-xs font-medium text-muted-foreground">Amigos CASH</div>
                    </div>
                  </Card>

                  {/* Badge #2: Vos CASH */}
                  <Card className="p-4">
                    <div className="text-center space-y-2">
                      <div className="text-2xl font-bold text-green-600">
                        {statistics.yourCashToday || 0} DT
                      </div>
                      <div className="text-xs font-medium text-muted-foreground">Vos CASH</div>
                    </div>
                  </Card>

                  {/* Badge #3: Commandes réalisées */}
                  <Card className="p-4">
                    <div className="text-center space-y-2">
                      <div className="text-2xl font-bold text-purple-600">
                        {statistics.ordersCompletedToday || 0}
                      </div>
                      <div className="text-xs font-medium text-muted-foreground">Commandes réalisées</div>
                    </div>
                  </Card>

                  {/* Badge #4: Commandes refusées */}
                  <Card className="p-4">
                    <div className="text-center space-y-2">
                      <div className="text-2xl font-bold text-red-600">
                        {statistics.ordersRejectedToday || 0}
                      </div>
                      <div className="text-xs font-medium text-muted-foreground">Commandes refusées</div>
                    </div>
                  </Card>

                  {/* Badge #5: Solde annulation */}
                  <Card className="p-4">
                    <div className="text-center space-y-2">
                      <div className="text-2xl font-bold text-orange-600">
                        {statistics.cancellationSoldeToday || 0} DT
                      </div>
                      <div className="text-xs font-medium text-muted-foreground">Solde annulation</div>
                    </div>
                  </Card>

                  {/* Badge #6: Total stats */}
                  <Card className="p-4">
                    <div className="text-center space-y-2">
                      <div className="text-sm font-semibold text-muted-foreground">
                        <div>{statistics.totalDelivered || 0}</div>
                        <div className="text-xs text-muted-foreground">livrées</div>
                      </div>
                      <div className="text-sm font-semibold text-muted-foreground">
                        <div>{statistics.totalCancelled || 0}</div>
                        <div className="text-xs text-muted-foreground">annulées</div>
                      </div>
                    </div>
                  </Card>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Available Orders */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Commandes Disponibles
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {availableOrders.length > 0 ? availableOrders.map((order) => (
                      <div key={order.id} className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Badge variant="secondary">{order.orderNumber}</Badge>
                            <Badge>{order.paymentMethod}</Badge>
                            {order.orderType && (
                              <Badge variant={order.orderType === 'A4' ? 'destructive' : 'default'}>
                                {order.orderType}
                              </Badge>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="font-semibold">{order.total} DT</div>
                            <div className="text-xs text-muted-foreground">Solde: {getOrderSolde(order)}</div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 xs:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <div className="font-medium">{order.client.name}</div>
                            <div className="text-sm text-muted-foreground flex items-center gap-2">
                              <Phone className="h-3 w-3" />
                              {order.client.phone}
                            </div>
                          </div>
                          <div className="space-y-1">
                            <div className="font-medium">{order.provider.name}</div>
                            <div className="text-sm text-muted-foreground">{order.provider.type}</div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="text-sm">
                            <span className="font-medium">Adresse:</span> {order.deliveryAddress?.street}, {order.deliveryAddress?.city}
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">
                              {order.items.length} article(s)
                            </span>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => {
                              console.log('🎯 Clicking accept for order:', order);
                              handleAcceptOrder(order.id);
                            }}
                            disabled={!isSessionActive}
                            title={!isSessionActive ? 'Démarrer la session pour accepter des commandes' : undefined}
                            className="flex-1"
                          >
                            Accepter
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRejectOrder(order.id)}
                            disabled={!isSessionActive}
                          >
                            Refuser
                          </Button>
                        </div>
                      </div>
                    )) : (
                      <div className="text-center py-8 text-muted-foreground">
                        Aucune commande disponible pour le moment
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Assigned Orders */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="h-5 w-5" />
                    Commandes Assignées
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {assignedOrders.length > 0 ? assignedOrders.map((order) => (
                      <div key={order.id} className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Badge variant="default">{order.orderNumber}</Badge>
                            {order.orderType && (
                              <Badge variant={order.orderType === 'A4' ? 'destructive' : 'default'}>
                                {order.orderType}
                              </Badge>
                            )}
                            <Badge variant={order.status === 'delivered' ? 'default' : 'secondary'}>
                              {order.status}
                            </Badge>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold">{order.total} DT</div>
-                            <div className="text-xs text-muted-foreground">Solde: {order.solde}</div>
+                            <div className="text-xs text-muted-foreground">Solde: {getOrderSolde(order)}</div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 xs:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <div className="font-medium">{order.client.name}</div>
                            <div className="text-sm text-muted-foreground flex items-center gap-2">
                              <Phone className="h-3 w-3" />
                              {order.client.phone}
                            </div>
                          </div>
                          <div className="space-y-1">
                            <div className="font-medium">{order.provider.name}</div>
                            <div className="text-sm text-muted-foreground">{order.provider.type}</div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="text-sm">
                            <span className="font-medium">Adresse:</span> {order.deliveryAddress?.street}, {order.deliveryAddress?.city}
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">
                              {order.items.length} article(s)
                            </span>
                          </div>
                        </div>

                        {order.status === 'accepted' && (
                          <Button
                            size="sm"
                            onClick={() => handleOpenCollectionModal(order)}
                            disabled={!isSessionActive}
                            className="w-full"
                          >
                            Étape 1: Collecte (#11)
                          </Button>
                        )}

                        {order.status === 'collected' && (
                          <Button
                            size="sm"
                            onClick={() => handleUpdateStatus(order.id, 'in_delivery')}
                            disabled={!isSessionActive}
                            className="w-full"
                          >
                            Étape 2: En livraison (#15)
                          </Button>
                        )}
                        
                        {order.status === 'in_delivery' && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleOpenDeliveryModal(order)}
                              disabled={!isSessionActive}
                              className="flex-1"
                            >
                              Livrée
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUpdateStatus(order.id, 'cancelled')}
                              disabled={!isSessionActive}
                            >
                              Annulée
                            </Button>
                          </div>
                        )}
                      </div>
                    )) : (
                      <div className="text-center py-8 text-muted-foreground">
                        Aucune commande assignée pour le moment
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
              </div>
            </div>
          )}

          {/* Profile Tab */}
          {activeTab === 'profile' && delivererProfile && (
            <div className="space-y-6">
              {/* Today's Metrics Card */}
              {statistics && (
                <Card>
                  <CardHeader>
                    <CardTitle>Métriques d'Aujourd'hui</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center space-y-2">
                        <div className="text-lg font-bold text-blue-600">
                          {statistics.amigosCashToday || 0} DT
                        </div>
                        <div className="text-xs font-medium text-muted-foreground">Amigos CASH</div>
                      </div>
                      <div className="text-center space-y-2">
                        <div className="text-lg font-bold text-green-600">
                          {statistics.yourCashToday || 0} DT
                        </div>
                        <div className="text-xs font-medium text-muted-foreground">Vos CASH</div>
                      </div>
                      <div className="text-center space-y-2">
                        <div className="text-lg font-bold text-purple-600">
                          {statistics.ordersCompletedToday || 0}
                        </div>
                        <div className="text-xs font-medium text-muted-foreground">Réalisées</div>
                      </div>
                      <div className="text-center space-y-2">
                        <div className="text-lg font-bold text-red-600">
                          {statistics.ordersRejectedToday || 0}
                        </div>
                        <div className="text-xs font-medium text-muted-foreground">Refusées</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card>
              <CardHeader>
                <CardTitle>Profil Livreur</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 xs:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold">Informations Personnelles</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Nom:</span>
                          <span>{delivererProfile.firstName} {delivererProfile.lastName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Téléphone:</span>
                          <span>{delivererProfile.phoneNumber}</span>
                        </div>
                        {delivererProfile.email && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Email:</span>
                            <span>{delivererProfile.email}</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Véhicule:</span>
                          <span>{delivererProfile.vehicle || 'Non spécifié'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Statut:</span>
                          <Badge variant={delivererProfile.status === 'active' ? 'default' : 'secondary'}>
                            {delivererProfile.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold">Statistiques</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Total Commandes:</span>
                          <span>{delivererProfile.statistics.totalOrders}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Commandes Livrées:</span>
                          <span className="text-green-600">{delivererProfile.statistics.deliveredOrders}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Commandes Annulées:</span>
                          <span className="text-red-600">{delivererProfile.statistics.cancelledOrders}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Note:</span>
                          <span>{delivererProfile.statistics.rating || 'Non évalué'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Inscrit le:</span>
                          <span>{new Date(delivererProfile.statistics.createdAt).toLocaleDateString('fr-FR')}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
              </Card>
            </div>
          )}

          {/* Earnings Tab */}
          {activeTab === 'earnings' && earnings && (
            <div className="space-y-6">
              {/* Today's Statistics */}
              {statistics && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card className="p-4">
                    <div className="text-center space-y-2">
                      <div className="text-xl font-bold text-blue-600">
                        {statistics.amigosCashToday || 0} DT
                      </div>
                      <div className="text-xs font-medium text-muted-foreground">Amigos CASH (Auj.)</div>
                    </div>
                  </Card>

                  <Card className="p-4">
                    <div className="text-center space-y-2">
                      <div className="text-xl font-bold text-green-600">
                        {statistics.yourCashToday || 0} DT
                      </div>
                      <div className="text-xs font-medium text-muted-foreground">Vos CASH (Auj.)</div>
                    </div>
                  </Card>

                  <Card className="p-4">
                    <div className="text-center space-y-2">
                      <div className="text-xl font-bold text-purple-600">
                        {statistics.ordersCompletedToday || 0}
                      </div>
                      <div className="text-xs font-medium text-muted-foreground">Réalisées (Auj.)</div>
                    </div>
                  </Card>

                  <Card className="p-4">
                    <div className="text-center space-y-2">
                      <div className="text-xl font-bold text-orange-600">
                        {statistics.cancellationSoldeToday || 0} DT
                      </div>
                      <div className="text-xs font-medium text-muted-foreground">Solde annulation</div>
                    </div>
                  </Card>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Gains Globaux</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Total</span>
                      <span className="text-2xl font-bold">{earnings.total} DT</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Moyenne</span>
                      <span className="font-semibold">{earnings.average} DT</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Commandes</span>
                      <span>{earnings.orderCount}</span>
                    </div>
                    {earnings.dailySoldeAmigos !== undefined && (
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Solde Amigos (aujourd'hui)</span>
                        <span className="font-semibold">{earnings.dailySoldeAmigos} DT</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Livrées</span>
                      <span className="text-green-600 font-semibold">{earnings.deliveredCount}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Annulées</span>
                      <span className="text-red-600 font-semibold">{earnings.cancelledCount}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Taux de réussite</span>
                      <span className="font-semibold">
                        {earnings.orderCount > 0 ? Math.round((earnings.deliveredCount / earnings.orderCount) * 100) : 0}%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Détails Mensuels</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {earnings.monthly.slice(0, 3).map((month) => (
                      <div key={month.month} className="border rounded-lg p-3">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{month.month}</span>
                          <span className="font-semibold">{month.total} DT</span>
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{month.orders} commandes</span>
                          <span>{month.delivered} livrées</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
            </div>
          )}
        </div>

        {/* Collection Modal */}
        {collectionModalOpen && selectedOrderForCollection && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md max-h-96 overflow-y-auto">
              <CardHeader>
                <CardTitle>Collecte - {selectedOrderForCollection.orderNumber}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="font-semibold text-lg">Prestataire(s)</p>
                  {selectedOrderForCollection.isGrouped && selectedOrderForCollection.groupedOrders?.length ? (
                    <div className="space-y-3 mt-2">
                      {selectedOrderForCollection.groupedOrders.map((grouped: any, idx: number) => (
                        <div key={idx} className="border rounded p-3">
                          <p className="font-medium">{grouped.provider?.name || 'Prestataire'}</p>
                          <p className="text-sm text-muted-foreground">{grouped.provider?.address}</p>
                          <div className="mt-3 flex gap-2">
                            <Button
                              size="sm"
                              variant={paymentModes[`order_${idx}`] === 'especes' ? 'default' : 'outline'}
                              onClick={() => setPaymentModes({...paymentModes, [`order_${idx}`]: 'especes'})}
                            >
                              Espèces
                            </Button>
                            <Button
                              size="sm"
                              variant={paymentModes[`order_${idx}`] === 'facture' ? 'default' : 'outline'}
                              onClick={() => setPaymentModes({...paymentModes, [`order_${idx}`]: 'facture'})}
                            >
                              Facture
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="border rounded p-3 mt-2">
                      <p className="font-medium">{selectedOrderForCollection.provider?.name}</p>
                      <p className="text-sm text-muted-foreground">{selectedOrderForCollection.provider?.address}</p>
                      <div className="mt-3 flex gap-2">
                        <Button
                          size="sm"
                          variant={paymentModes['main'] === 'especes' ? 'default' : 'outline'}
                          onClick={() => setPaymentModes({...paymentModes, 'main': 'especes'})}
                        >
                          Espèces
                        </Button>
                        <Button
                          size="sm"
                          variant={paymentModes['main'] === 'facture' ? 'default' : 'outline'}
                          onClick={() => setPaymentModes({...paymentModes, 'main': 'facture'})}
                        >
                          Facture
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2 border-t pt-4">
                  <Label htmlFor="collectionCode" className="text-base font-semibold">
                    Code de sécurité
                  </Label>
                  <Input
                    id="collectionCode"
                    type="password"
                    placeholder="••••••"
                    value={collectionSecurityCode}
                    onChange={(e) => {
                      const cleaned = e.target.value.replace(/\D/g, "");
                      setCollectionSecurityCode(cleaned.slice(0, 6));
                    }}
                    maxLength={6}
                    className="h-11 text-base font-mono tracking-widest text-center"
                    required
                    aria-label="Code de sécurité à 6 chiffres"
                    autoComplete="off"
                  />
                  <p className="text-xs text-gray-500">
                    Saisissez votre code de sécurité à 6 chiffres pour confirmer la collecte
                  </p>
                  <p className="text-xs text-blue-600">
                    Code oublié ? Contactez le support: <strong>{ADMIN_SUPPORT_CONTACT.phone}</strong> ou <strong>{ADMIN_SUPPORT_CONTACT.email}</strong> ({ADMIN_SUPPORT_CONTACT.hours})
                  </p>
                </div>

                <div className="bg-muted p-3 rounded">
                  <p className="text-sm font-medium">Montant total prestataire</p>
                  <p className="text-lg font-bold">{selectedOrderForCollection.total} DT</p>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setCollectionModalOpen(false);
                      setSelectedOrderForCollection(null);
                      setCollectionSecurityCode("");
                    }}
                    className="flex-1"
                  >
                    Annuler
                  </Button>
                  <Button
                    onClick={handleConfirmCollection}
                    className="flex-1"
                  >
                    Confirmer collecte
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Session Security Code Modal */}
        <Dialog open={sessionSecurityModalOpen} onOpenChange={setSessionSecurityModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Confirmer le démarrage de session</DialogTitle>
              <DialogDescription>
                Veuillez saisir votre code de sécurité à 6 chiffres pour démarrer votre session de livraison.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="sessionCode" className="text-base font-semibold">
                  Code de sécurité
                </Label>
                <Input
                  id="sessionCode"
                  type="text"
                  placeholder="123456"
                  value={sessionSecurityCode}
                  onChange={(e) => {
                    const cleaned = e.target.value.replace(/\D/g, "");
                    setSessionSecurityCode(cleaned.slice(0, 6));
                  }}
                  maxLength={6}
                  className="h-11 text-base font-mono tracking-widest text-center"
                  required
                  aria-label="Code de sécurité à 6 chiffres"
                  aria-required="true"
                  autoComplete="off"
                />
                <p className="text-xs text-gray-500">
                  Code à 6 chiffres fourni par l'administrateur
                </p>
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSessionSecurityModalOpen(false);
                    setSessionSecurityCode("");
                  }}
                >
                  Annuler
                </Button>
                <Button
                  onClick={handleConfirmSessionStart}
                >
                  Démarrer la session
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delivery Confirmation Modal */}
        <Dialog open={deliveryModalOpen} onOpenChange={setDeliveryModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Confirmer la livraison</DialogTitle>
              <DialogDescription>
                Veuillez saisir votre code de sécurité à 6 chiffres pour confirmer que la commande a été livrée au client.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {selectedOrderForDelivery && (
                <div className="bg-muted p-3 rounded space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Commande:</span>
                    <Badge>{selectedOrderForDelivery.orderNumber}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Client:</span>
                    <span className="text-sm">{selectedOrderForDelivery.client.name}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Montant:</span>
                    <span className="text-sm font-bold">{selectedOrderForDelivery.total} DT</span>
                  </div>
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="deliveryCode" className="text-base font-semibold">
                  Code de sécurité
                </Label>
                <Input
                  id="deliveryCode"
                  type="password"
                  placeholder="••••••"
                  value={deliverySecurityCode}
                  onChange={(e) => {
                    const cleaned = e.target.value.replace(/\D/g, "");
                    setDeliverySecurityCode(cleaned.slice(0, 6));
                  }}
                  maxLength={6}
                  className="h-11 text-base font-mono tracking-widest text-center"
                  required
                  aria-label="Code de sécurité à 6 chiffres"
                  autoComplete="off"
                />
                <p className="text-xs text-gray-500">
                  Saisissez votre code de sécurité pour confirmer la livraison
                </p>
                <p className="text-xs text-blue-600">
                  Code oublié ? Contactez le support: <strong>{ADMIN_SUPPORT_CONTACT.phone}</strong> ou <strong>{ADMIN_SUPPORT_CONTACT.email}</strong> ({ADMIN_SUPPORT_CONTACT.hours})
                </p>
              </div>
              
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setDeliveryModalOpen(false);
                    setSelectedOrderForDelivery(null);
                    setDeliverySecurityCode("");
                  }}
                >
                  Annuler
                </Button>
                <Button onClick={handleConfirmDelivery}>
                  Confirmer la livraison
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
