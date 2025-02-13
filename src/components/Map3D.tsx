import maplibregl, { MapLayerMouseEvent } from "maplibre-gl";
import Map, { MapRef, NavigationControl } from "react-map-gl/maplibre";
import { useState, useRef, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

import "maplibre-gl/dist/maplibre-gl.css";

interface BuildingProperties {
  name?: string;
  height?: number;
  levels?: number;
  type?: string;
  address?: string;
  amenity?: string;
  [key: string]: unknown;
}

interface PopupInfo {
  coordinates: {
    lng: number;
    lat: number;
  };
  properties: BuildingProperties;
}

const INITIAL_VIEW_STATE = {
  latitude: 45.815,
  longitude: 15.9819,
  zoom: 15,
  pitch: 60,
};

export default function Map3D() {
  const [popupInfo, setPopupInfo] = useState<PopupInfo | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedBuildingId, setSelectedBuildingId] = useState<string | null>(
    null
  );
  const mapRef = useRef<MapRef>(null);

  const resetSelectedBuilding = useCallback(() => {
    if (selectedBuildingId && mapRef.current) {
      mapRef.current.setFeatureState(
        {
          source: "osm-buildings",
          sourceLayer: "building",
          id: selectedBuildingId,
        },
        { selected: false }
      );
    }
  }, [selectedBuildingId]);

  const displayBuildingInfo = (event: MapLayerMouseEvent) => {
    const feature = event.features && event.features[0];

    if (feature && feature.layer.id === "buildings-3d") {
      // Reset previous selection
      resetSelectedBuilding();

      const coordinates = event.lngLat;
      const buildingId = feature.id as string;

      // Set feature state for the new selection
      if (mapRef.current?.getMap()) {
        mapRef.current.getMap().setFeatureState(
          {
            source: "osm-buildings",
            sourceLayer: "building",
            id: buildingId,
          },
          { selected: true }
        );
      }

      const popupContent: PopupInfo = {
        coordinates: coordinates,
        properties: feature.properties as BuildingProperties,
      };

      setSelectedBuildingId(buildingId);
      setPopupInfo(popupContent);
      setIsDialogOpen(true);
    }
  };

  return (
    <div className="relative">
      <Map
        ref={mapRef}
        mapLib={maplibregl}
        onLoad={(event) => {
          const map = event.target;
          console.log(map);
          // No need to set mapRef here as it's handled by the ref prop
        }}
        initialViewState={INITIAL_VIEW_STATE}
        style={{ width: 1200, height: 800 }}
        mapStyle={{
          version: 8,
          sources: {
            osm: {
              type: "raster",
              tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
              tileSize: 256,
              attribution: "&copy; OpenStreetMap Contributors",
              maxzoom: 19,
            },
            "osm-buildings": {
              type: "vector",
              tiles: [
                "https://tiles.stadiamaps.com/data/openmaptiles/{z}/{x}/{y}.pbf",
              ],
              maxzoom: 14,
            },
          },
          layers: [
            {
              id: "osm",
              type: "raster",
              source: "osm",
              minzoom: 0,
            },
            {
              id: "buildings-3d",
              type: "fill-extrusion",
              source: "osm-buildings",
              "source-layer": "building",
              paint: {
                "fill-extrusion-color": [
                  "case",
                  ["boolean", ["feature-state", "selected"], false],
                  "#FFA500", // Highlight color for selected building
                  [
                    "match",
                    ["get", "type"],
                    "residential",
                    "#e8dacd",
                    "commercial",
                    "#c9b6a3",
                    "industrial",
                    "#a69989",
                    "office",
                    "#998b7d",
                    "#a1907f", // default color
                  ],
                ],
                "fill-extrusion-opacity": 0.85,
                "fill-extrusion-vertical-gradient": true,
                "fill-extrusion-height": [
                  "case",
                  ["has", "height"],
                  ["get", "height"],
                  ["has", "levels"],
                  ["*", ["get", "levels"], 3],
                  15,
                ],
                "fill-extrusion-base": 0,
              },
              filter: ["==", "$type", "Polygon"],
            },
          ],
        }}
        interactiveLayerIds={["buildings-3d"]}
        onClick={displayBuildingInfo}
      >
        <NavigationControl position="top-right" />
      </Map>

      <Dialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open);

          if (!open) {
            resetSelectedBuilding();
            setSelectedBuildingId(null);
          }
        }}
      >
        <DialogContent className="max-w-md !duration-0 !translate-y-0">
          <DialogHeader>
            <DialogTitle>Building Information</DialogTitle>
            <DialogDescription>
              Details about the selected building and its properties
            </DialogDescription>
          </DialogHeader>

          {popupInfo && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <span className="text-sm text-gray-500">Coordinates</span>
                  <p className="font-medium">
                    {popupInfo.coordinates.lng.toFixed(4)},{" "}
                    {popupInfo.coordinates.lat.toFixed(4)}
                  </p>
                </div>

                {Object.entries(popupInfo.properties)
                  .filter(
                    ([, value]) =>
                      value !== null && value !== undefined && value !== ""
                  )
                  .map(([key, value]) => (
                    <div key={key} className="col-span-2">
                      <span className="text-sm text-gray-500 capitalize">
                        {key.replace(/_/g, " ")}
                      </span>
                      <p className="font-medium">{String(value)}</p>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
