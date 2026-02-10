import { useEffect, useRef, useState } from 'react';
import { useToast } from './use-toast';
import io, { Socket } from 'socket.io-client';

interface OrderNotification {
  id: string;
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
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  total: number;
  solde: number;
  deliveryAddress: any;
  paymentMethod: string;
  finalAmount: number;
  createdAt: string;
  platformSolde: number;
  distance: number;
  zone: any;
}

export const useDelivererWebSocket = () => {
  const { toast } = useToast();
  const [isConnected, setIsConnected] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [newOrders, setNewOrders] = useState<OrderNotification[]>([]);
  const [serverStatus, setServerStatus] = useState<any>(null);
  const socketRef = useRef<Socket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const delivererIdRef = useRef<string | null>(null);
  const maxReconnectAttempts = 10;

  // Calculate exponential backoff delay
  const calculateBackoffDelay = (attempt: number): number => {
    const baseDelay = 1000; // 1 second
    const maxDelay = 60000; // 60 seconds
    const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
    return delay;
  };

  // Attempt reconnection with backoff
  const attemptReconnect = (delivererId: string) => {
    if (reconnectAttempts >= maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      // Set isReconnecting to false and clear timeout when max attempts exceeded
      setIsReconnecting(false);
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      toast({
        title: 'Connexion impossible',
        description: 'Impossible de se reconnecter. Veuillez rafraîchir la page.',
        variant: 'destructive',
      });
      return;
    }

    setIsReconnecting(true);
    const delay = calculateBackoffDelay(reconnectAttempts);
    
    console.log(`Reconnecting in ${delay}ms (attempt ${reconnectAttempts + 1}/${maxReconnectAttempts})`);
    
    reconnectTimeoutRef.current = window.setTimeout(() => {
      setReconnectAttempts(prev => prev + 1);
      connectSocket(delivererId);
    }, delay);
  };

  const connectSocket = (delivererId: string) => {
    try {
      // Validate deliverer ID
      if (!delivererId || delivererId === 'undefined' || delivererId === 'null') {
        console.error('Invalid deliverer ID provided to connectSocket:', delivererId);
        return;
      }
      
      // Save deliverer ID for reconnection
      delivererIdRef.current = delivererId;

      // Guard: if socket already exists, don't create a new one
      if (socketRef.current) {
        console.log('Socket instance already exists. Skipping creation.');
        // Attempt to reconnect if disconnected
        if (!socketRef.current.connected) {
          console.log('Reconnecting existing socket...');
          socketRef.current.connect();
        }
        return;
      }

      console.log('🔌 Connecting to Socket.IO server...');
    // Create socket connection
    //const socket: Socket = io('https://amigosdelivery25.com', {
      const socket: Socket = io('http://192.168.1.104:5000', {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5,
      });

      socketRef.current = socket;

      // Connection successful
      socket.on('connect', () => {
        console.log('✅ Socket connected successfully');
        setIsConnected(true);

        // Join the deliverer channel
        socket.emit('join-deliverer', { delivererId });
      });

      // Disconnection event
      socket.on('disconnect', (reason) => {
        console.log('🔴 Socket disconnected. Reason:', reason);
        setIsConnected(false);
        
        // Only show toast if it's not an intentional disconnect
        if (reason !== 'io client disconnect') {
          toast({
            title: 'Connexion perdue',
            description: 'Vous êtes hors ligne. Reconnexion en cours...',
            variant: 'destructive',
          });
        }
        
        // Attempt reconnection with backoff if delivererId is available
        // and it's not an intentional disconnect
        if (delivererIdRef.current && reason !== 'io client disconnect') {
          attemptReconnect(delivererIdRef.current);
        }
      });

      // New order notification
      socket.on('new-order', (orderData: OrderNotification) => {
        console.log('🎉 New order received:', orderData);

        // Add to orders list
        setNewOrders((prev) => [...prev, orderData]);

        // Show toast notification
        toast({
          title: '🔔 Nouvelle Commande',
          description: `${orderData.orderNumber} - ${orderData.total} DT`,
          duration: 5000,
        });

        // Optional: Play notification sound
        try {
          const audio = new Audio('/notification.mp3');
          audio.play().catch((e) => {
            console.log('Audio play failed, attempting Web Audio API fallback:', e);
            // Fallback: simple beep using Web Audio API
            try {
              const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
              const oscillator = audioContext.createOscillator();
              const gainNode = audioContext.createGain();
              
              oscillator.connect(gainNode);
              gainNode.connect(audioContext.destination);
              
              oscillator.frequency.value = 800;
              oscillator.type = 'sine';
              
              gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
              gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
              
              oscillator.start(audioContext.currentTime);
              oscillator.stop(audioContext.currentTime + 0.5);
            } catch (fallbackError) {
              console.log('Web Audio API not available:', fallbackError);
            }
          });
        } catch (error) {
          console.log('Could not play sound:', error);
        }
      });

      // Order accepted by another deliverer
      socket.on('order-accepted', (data: { orderId: string }) => {
        console.log('Order accepted:', data.orderId);
        setNewOrders((prev) =>
          prev.filter((order) => order.orderId !== data.orderId)
        );
      });

      // Order rejected by another deliverer
      socket.on('order-rejected', (data: { orderId: string }) => {
        console.log('Order rejected:', data.orderId);
        setNewOrders((prev) =>
          prev.filter((order) => order.orderId !== data.orderId)
        );
      });

      // Status update
      socket.on('status', (data: any) => {
        console.log('Status update:', data);
        setServerStatus(data);
        // Sync isConnected if status payload provides connectivity info
        if (data?.online !== undefined) {
          setIsConnected(data.online);
        }
      });

      // Connection error
      socket.on('connect_error', (error: any) => {
        console.error('Connection error:', error);
        toast({
          title: 'Erreur de connexion',
          description: 'Impossible de se connecter au serveur',
          variant: 'destructive',
        });
      });

      // Reconnection attempt
      socket.on('reconnect_attempt', () => {
        console.log('Attempting to reconnect...');
      });

      // Successful reconnection
      socket.on('reconnect', () => {
        console.log('✅ Reconnected successfully');
        setIsConnected(true);
        setIsReconnecting(false);
        setReconnectAttempts(0);
        
        // Clear pending reconnection timeout
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
        
        toast({
          title: 'Reconnecté',
          description: 'Vous êtes à nouveau en ligne',
          duration: 3000,
        });
      });
    } catch (error) {
      console.error('Error in connectSocket:', error);
      toast({
        title: 'Erreur',
        description: 'Erreur lors de la connexion WebSocket',
        variant: 'destructive',
      });
    }
  };

  const disconnectSocket = () => {
    try {
      if (socketRef.current) {
        console.log('🔌 Disconnecting socket...');
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      
      // Clear pending reconnection timeout
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      
      setIsConnected(false);
      setIsReconnecting(false);
      setReconnectAttempts(0);
      setNewOrders([]);
    } catch (error) {
      console.error('Error in disconnectSocket:', error);
    }
  };

  return {
    isConnected,
    isReconnecting,
    reconnectAttempts,
    newOrders,
    serverStatus,
    connectSocket,
    disconnectSocket,
    socketRef,
  };
};
