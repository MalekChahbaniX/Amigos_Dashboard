import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Clock } from 'lucide-react';

interface OrderCountdownProps {
  createdAt: string | Date;
  status: string;
}

export function OrderCountdown({ createdAt, status }: OrderCountdownProps) {
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  
  useEffect(() => {
    // Only show countdown for pending orders
    if (status !== 'pending') {
      return;
    }
    
    const calculateTimeRemaining = () => {
      const created = new Date(createdAt).getTime();
      const now = Date.now();
      const elapsed = now - created;
      const tenMinutes = 10 * 60 * 1000; // 10 minutes in ms
      const remaining = Math.max(0, tenMinutes - elapsed);
      return remaining;
    };
    
    // Initial calculation
    setTimeRemaining(calculateTimeRemaining());
    
    // Update every second
    const interval = setInterval(() => {
      const remaining = calculateTimeRemaining();
      setTimeRemaining(remaining);
      
      // Stop when time is up
      if (remaining === 0) {
        clearInterval(interval);
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [createdAt, status]);
  
  if (status !== 'pending' || timeRemaining === 0) {
    return null;
  }
  
  const minutes = Math.floor(timeRemaining / 60000);
  const seconds = Math.floor((timeRemaining % 60000) / 1000);
  
  const isUrgent = timeRemaining < 120000; // Less than 2 minutes
  
  return (
    <Badge 
      variant={isUrgent ? "destructive" : "secondary"}
      className="flex items-center gap-1 font-mono"
    >
      <Clock className="h-3 w-3" />
      {minutes}:{seconds.toString().padStart(2, '0')}
    </Badge>
  );
}
