import { MapContainer, TileLayer, CircleMarker, useMap, Popup, Marker } from 'react-leaflet';
import L from 'leaflet';
import { useEffect } from 'react';

// Fix for default Leaflet icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function MapController({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, 13, { duration: 1.5 });
  }, [center, map]);
  return null;
}

interface MapUIProps {
  center: [number, number];
  dangerZones: { lat: number; lng: number }[];
  liveReports: { lat: number; lng: number; description: string }[];
}

export default function MapUI({ center, dangerZones, liveReports }: MapUIProps) {
  return (
    <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%' }} zoomControl={false}>
      {/* Esri World Imagery Base Map */}
      <TileLayer
        url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
        attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
      />
      
      <MapController center={center} />
      
      {/* Center Marker */}
      <Marker position={center}>
        <Popup>Current Focus</Popup>
      </Marker>

      {/* Historical Danger Zones */}
      {dangerZones.map((zone, idx) => (
        <CircleMarker
          key={`danger-${idx}`}
          center={[zone.lat, zone.lng]}
          radius={6}
          pathOptions={{ color: 'red', fillColor: '#ef4444', fillOpacity: 0.7, weight: 2 }}
        >
          <Popup>
            <strong className="text-red-600">Historical Danger Zone</strong>
          </Popup>
        </CircleMarker>
      ))}

      {/* Live Crowdsourced Reports */}
      {liveReports.map((report, idx) => (
        <CircleMarker
          key={`report-${idx}`}
          center={[report.lat, report.lng]}
          radius={8}
          pathOptions={{ color: 'orange', fillColor: '#f97316', fillOpacity: 0.9, weight: 2 }}
        >
          <Popup>
            <strong className="text-orange-600">Live Hazard Report</strong>
            <br />
            {report.description}
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
