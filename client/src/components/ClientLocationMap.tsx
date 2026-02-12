import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Icon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Navigation } from 'lucide-react';

// Fix for default markers in react-leaflet
delete (Icon.Default.prototype as any)._getIconUrl;
Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface ClientLocationMapProps {
  clientLocation: {
    lat?: number;
    lng?: number;
    address?: string;
  };
  clientName: string;
  className?: string;
}

export default function ClientLocationMap({ clientLocation, clientName, className = "h-48 w-full" }: ClientLocationMapProps) {
  const [position, setPosition] = useState<[number, number] | null>(null);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [delivererLocation, setDelivererLocation] = useState<[number, number] | null>(null);

  // Get deliverer's current location using GPS
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = [position.coords.latitude, position.coords.longitude] as [number, number];
          setDelivererLocation(coords);
          console.log('📍 Localisation GPS du livreur:', coords);
        },
        (error) => {
          console.warn('📍 Erreur de géolocalisation GPS:', error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    } else {
      console.warn('📍 Géolocalisation non supportée par ce navigateur');
    }
  }, []);

  // Function to open Google Maps with navigation from deliverer to client
  const openGoogleMapsNavigation = () => {
    if (position && position[0] && position[1]) {
      const [clientLat, clientLng] = position;
      
      let googleMapsUrl: string;
      
      if (delivererLocation && delivererLocation[0] && delivererLocation[1]) {
        // Navigation from deliverer's current location to client
        const [delivererLat, delivererLng] = delivererLocation;
        googleMapsUrl = `https://www.google.com/maps/dir/${delivererLat},${delivererLng}/${clientLat},${clientLng}/data=!4m2!3m1!1s0x0x0:0e0?hl=fr`;
        console.log('🗺️ Navigation GPS - Du livreur au client:', {
          from: delivererLocation,
          to: [clientLat, clientLng],
          url: googleMapsUrl
        });
      } else {
        // Fallback: Navigation to client location only
        googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${clientLat},${clientLng}`;
        console.log('🗺️ Navigation simple - Position client uniquement:', {
          to: [clientLat, clientLng],
          url: googleMapsUrl
        });
      }
      
      window.open(googleMapsUrl, '_blank');
    } else {
      console.warn('🗺️ Coordonnées du client non disponibles pour la navigation');
    }
  };

  useEffect(() => {
    const getPosition = async () => {
      console.log('🗺️ ClientLocationMap - Données reçues:', clientLocation);
      
      // If we have coordinates, use them directly
      if (clientLocation.lat && clientLocation.lng) {
        const coords = [clientLocation.lat, clientLocation.lng] as [number, number];
        console.log('🗺️ Utilisation des coordonnées directes:', coords);
        setPosition(coords);
        return;
      }

      // If we have an address, try to geocode it
      if (clientLocation.address) {
        setIsGeocoding(true);
        try {
          console.log('🗺️ Géocodage de l\'adresse:', clientLocation.address);
          // Using Nominatim API for geocoding (free and no API key required)
          const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(clientLocation.address)}&limit=1&countrycodes=tn`
          );
          const data = await response.json();
          
          console.log('🗺️ Résultat du géocodage:', data);
          
          if (data && data.length > 0) {
            const { lat, lon, display_name } = data[0];
            const coords = [parseFloat(lat), parseFloat(lon)] as [number, number];
            console.log('🗺️ Coordonnées trouvées:', coords, 'Adresse:', display_name);
            setPosition(coords);
          } else {
            console.warn('🗺️ Aucun résultat trouvé pour l\'adresse:', clientLocation.address);
            // Fallback to Tunis coordinates if geocoding fails
            setPosition([36.8065, 10.1815]);
          }
        } catch (error) {
          console.error('🗺️ Erreur de géocodage:', error);
          // Fallback to Tunis coordinates
          setPosition([36.8065, 10.1815]);
        } finally {
          setIsGeocoding(false);
        }
      } else {
        console.warn('🗺️ Aucune donnée de localisation disponible');
        // Fallback to Tunis coordinates if no location data
        setPosition([36.8065, 10.1815]);
      }
    };

    getPosition();
  }, [clientLocation]);

  if (!position) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 rounded-lg ${className}`}>
        <div className="text-center">
          {isGeocoding ? (
            <div className="space-y-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-sm text-gray-600">Recherche de l'adresse...</p>
            </div>
          ) : (
            <p className="text-sm text-gray-600">Localisation non disponible</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`relative rounded-lg overflow-hidden border ${className}`}>
      <MapContainer
        center={position}
        zoom={15}
        style={{ height: '100%', width: '100%' }}
        attributionControl={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <Marker position={position}>
          <Popup>
            <div className="text-sm">
              <strong>{clientName}</strong>
              <br />
              {clientLocation.address || 'Adresse non spécifiée'}
            </div>
          </Popup>
        </Marker>
      </MapContainer>
      
      {/* Navigation Button */}
      <button
        onClick={openGoogleMapsNavigation}
        className="absolute top-2 right-2 bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg shadow-lg transition-colors z-[1000] flex items-center gap-2"
        title={delivererLocation ? "Naviguer du livreur au client (GPS)" : "Naviguer vers le client (GPS non disponible)"}
      >
        <Navigation className="h-4 w-4" />
        <span className="text-xs font-medium">
          {delivererLocation ? "GPS" : "Maps"}
        </span>
      </button>
      
      {/* GPS Status Indicator */}
      {delivererLocation && (
        <div className="absolute bottom-2 left-2 bg-green-500 text-white px-2 py-1 rounded-md text-xs font-medium z-[1000] flex items-center gap-1">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
          GPS Actif
        </div>
      )}
    </div>
  );
}
