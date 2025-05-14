import React from "react";
import { StyleSheet, View, Text } from "react-native";
import { Polyline, Marker } from "react-native-maps";
import { LatLng } from "../utils/tsp";

interface RoutePolylineProps {
  coordinates: LatLng[];
}

const RoutePolyline: React.FC<RoutePolylineProps> = ({ coordinates }) => {
  if (coordinates.length < 2) return null;

  // Calculate arrow positions (middle point of each segment)
  const arrowPositions = coordinates.slice(0, -1).map((coord, index) => {
    const nextCoord = coordinates[index + 1];
    return {
      latitude: (coord.latitude + nextCoord.latitude) / 2,
      longitude: (coord.longitude + nextCoord.longitude) / 2,
      rotation: calculateRotation(coord, nextCoord),
    };
  });

  return (
    <>
      <Polyline
        coordinates={coordinates}
        strokeWidth={3}
        strokeColor="#2196F3"
        lineDashPattern={[0]}
        lineCap="round"
        geodesic={true}
      />
      {arrowPositions.map((pos, index) => (
        <Marker
          key={index}
          coordinate={pos}
          anchor={{ x: 0.5, y: 0.5 }}
          rotation={pos.rotation}
          flat={true}
        >
          <View style={styles.arrow}>
            <Text style={styles.arrowText}>➤</Text>
          </View>
        </Marker>
      ))}
    </>
  );
};

// Calculate rotation angle between two points
function calculateRotation(start: LatLng, end: LatLng): number {
  const dx = end.longitude - start.longitude;
  const dy = end.latitude - start.latitude;
  return (Math.atan2(dy, dx) * 180) / Math.PI;
}

const styles = StyleSheet.create({
  arrow: {
    backgroundColor: "transparent",
  },
  arrowText: {
    color: "#2196F3",
    fontSize: 20,
    fontWeight: "bold",
    textShadowColor: "white",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
  },
});

export default RoutePolyline;
