import { useEffect, useRef, useState } from 'react';
import { useToast } from './use-toast';
import io, { Socket } from 'socket.io-client';

interface AdminOrderNotification {
  orderId: string;
  orderNumber: string;
  client: {
    name: string;
    phone: string;
  };
  provider: {
    name: string;
    type: string;
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
  createdAt: string;
  status: string;
  orderType?: string;
  finalAmount?: number;
  platformSolde?: number;
  distance?: number;
  zone?: any;
}

export const useAdminWebSocket = () => {
  const { toast } = useToast();
  const [isConnected, setIsConnected] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [newOrders, setNewOrders] = useState<AdminOrderNotification[]>([]);
  const [serverStatus, setServerStatus] = useState<any>(null);
  const socketRef = useRef<Socket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const adminIdRef = useRef<string | null>(null);
  const maxReconnectAttempts = 10;

  // Play notification sound using Web Audio API as fallback or HTML5 Audio
  const playNotificationSound = () => {
    try {
      // Try to load from public folder first
      const audio = new Audio('/notification.mp3');
      audio.volume = 0.5;
      audio.play().catch((e) => {
        console.log('Audio play failed, attempting Web Audio API fallback:', e);
        playWebAudioBeep();
      });
    } catch (error) {
      console.log('Could not create audio element, attempting Web Audio API fallback:', error);
      playWebAudioBeep();
    }
  };

  // Generate a simple beep using Web Audio API as fallback
  const playWebAudioBeep = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800; // Hz
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
      console.log('Web Audio API not available:', error);
    }
  };

  // Calculate exponential backoff delay
  const calculateBackoffDelay = (attempt: number): number => {
    const baseDelay = 1000; // 1 second
    const maxDelay = 60000; // 60 seconds
    const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
    return delay;
  };

  // Attempt reconnection with backoff
  const attemptReconnect = (adminId: string) => {
    if (reconnectAttempts >= maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
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
      connectSocket(adminId);
    }, delay);
  };

  const connectSocket = (adminId: string) => {
    try {
      // Validate admin ID
      if (!adminId || adminId === 'undefined' || adminId === 'null') {
        console.error('Invalid admin ID provided to connectSocket:', adminId);
        return;
      }

      // Save admin ID for reconnection
      adminIdRef.current = adminId;

      // Guard: if socket already exists, don't create a new one
      if (socketRef.current) {
        console.log('Socket instance already exists. Skipping creation.');
        if (!socketRef.current.connected) {
          console.log('Reconnecting existing socket...');
          socketRef.current.connect();
        }
        return;
      }

      console.log('🔌 Connecting to Socket.IO server...');
      
      // Determine the socket server URL from environment or fallback to dev URL
      const socketUrl = import.meta.env.VITE_API_URL 
        ? import.meta.env.VITE_API_URL.replace('/api', '') 
        : (import.meta.env.VITE_DEV_API_URL?.replace('/api', '') || 'https://amigosdelivery25.com/api');
      //  : (import.meta.env.VITE_DEV_API_URL?.replace('/api', '') || 'http://192.168.1.104:5000/api');
      
      const socket: Socket = io(socketUrl, {
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

        // Join the admin channel
        socket.emit('join-admin', { adminId });
      });

      // Disconnection event
      socket.on('disconnect', (reason) => {
        console.log('🔴 Socket disconnected. Reason:', reason);
        setIsConnected(false);

        if (reason !== 'io client disconnect') {
          toast({
            title: 'Connexion perdue',
            description: 'Vous êtes hors ligne. Reconnexion en cours...',
            variant: 'destructive',
          });
        }

        if (adminIdRef.current && reason !== 'io client disconnect') {
          attemptReconnect(adminIdRef.current);
        }
      });

      // New order notification
      socket.on('new-order-admin', (orderData: AdminOrderNotification) => {
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
        playNotificationSound();
      });

      // Status update
      socket.on('status', (data: any) => {
        console.log('Status update:', data);
        setServerStatus(data);
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
