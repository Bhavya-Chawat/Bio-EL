/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, GeoJSON, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

function MapFlyTo({ geoData, selectedDistrictId }: { geoData: any, selectedDistrictId: number | null }) {
  const map = useMap();

  useEffect(() => {
    if (selectedDistrictId && geoData) {
      const feature = geoData.features.find((f: any) => f.properties.id === selectedDistrictId);
      if (feature) {
        const layer = L.geoJSON(feature);
        const bounds = layer.getBounds();
        map.flyToBounds(bounds, { duration: 1.5, maxZoom: 8 });
      }
    }
  }, [selectedDistrictId, geoData, map]);

  return null;
}

export default function RiskMap({ 
  selectedDistrictId, 
  onDistrictClick 
}: { 
  selectedDistrictId: number | null, 
  onDistrictClick: (id: number) => void 
}) {
  const [geoData, setGeoData] = useState<any>(null);

  useEffect(() => {
    fetch("http://localhost:8000/api/districts/geojson")
      .then((res) => res.json())
      .then((data) => setGeoData(data));
  }, []);

  const getStyle = (feature: any) => {
    const isSelected = feature.properties.id === selectedDistrictId;
    const zone = feature.properties.zone;
    let color = "#34908B"; // low - green/teal
    if (zone === "high") color = "#ff4444";
    else if (zone === "medium") color = "#facc15";

    return {
      fillColor: color,
      weight: isSelected ? 4 : 2,
      opacity: 1,
      color: isSelected ? "#000" : "white",
      fillOpacity: isSelected ? 0.9 : 0.7,
    };
  };

  const onEachFeature = (feature: any, layer: any) => {
    layer.on({
      mouseover: (e: any) => {
        const layer = e.target;
        layer.setStyle({
          weight: 4,
          color: "#fff",
          fillOpacity: 0.9,
        });
        layer.bringToFront();
      },
      mouseout: (e: any) => {
        const layer = e.target;
        layer.setStyle(getStyle(feature));
      },
      click: () => {
        onDistrictClick(feature.properties.id);
      },
    });
    layer.bindTooltip(`<b>${feature.properties.name}</b><br>Zone: ${feature.properties.zone.toUpperCase()}`);
  };

  if (!geoData) return <div className="flex items-center justify-center h-full">Loading Map Data...</div>;

  return (
    <MapContainer center={[22.0, 80.0]} zoom={4} style={{ height: "100%", width: "100%", borderRadius: "0.5rem" }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
      />
      <GeoJSON data={geoData} style={getStyle} onEachFeature={onEachFeature} />
      <MapFlyTo geoData={geoData} selectedDistrictId={selectedDistrictId} />
    </MapContainer>
  );
}
