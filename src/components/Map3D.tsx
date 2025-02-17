import { Map } from "react-map-gl/maplibre";
import DeckGL from "@deck.gl/react";
import { Layer, MapViewState, PickingInfo } from "deck.gl";
import { I3SLoader } from "@loaders.gl/i3s";
import { Tile3DLayer } from "@deck.gl/geo-layers";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { useState } from "react";

const TILESET_URL =
  "https://services1.arcgis.com/srGsjgmVH7sYUOi4/ArcGIS/rest/services/ZG3D_LOD2_2024/SceneServer/layers/0?f=pjson";

const INITIAL_VIEW_STATE: MapViewState = {
  latitude: 45.815399,
  longitude: 15.966568,
  zoom: 15.5,
  pitch: 45, // Add pitch to see building heights better
};

export default function App({
  data = TILESET_URL,
  mapStyle = "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
}) {
  const [popupInfo, setPopupInfo] = useState<PickingInfo | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const layers: Layer[] = [
    new Tile3DLayer({
      id: "tile-3d-layer",
      data,
      loader: I3SLoader,
      pickable: true,
      onTilesetLoad: (tileset) => {
        console.log("Tileset loaded:", tileset);
      },
    }),
  ];

  const onClickHandler = (info: PickingInfo) => {
    if (info.picked && info.object) {
      setIsDialogOpen(true);
      setPopupInfo(info);

      console.log("Clicked building data:", {
        coordinates: info.coordinate,
        object: info.object,
        properties: info.object.properties,
        layer: info.layer,
        tileIndex: info.index,
      });
    }
  };

  return (
    <div className="relative w-full h-screen">
      <DeckGL
        initialViewState={INITIAL_VIEW_STATE}
        controller={true}
        layers={layers}
        onClick={(info) => onClickHandler(info)}
        pickingRadius={5}
        getTooltip={({ object }) => object && object?.properties?.name}
      >
        <Map reuseMaps mapStyle={mapStyle} />
      </DeckGL>

      <Dialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open);
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
                    {popupInfo.coordinate
                      ?.map((coordinate) => coordinate.toFixed(4))
                      .join(", ")}
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
