import React, { useState, useEffect } from "react";
import { StyleSheet, View, Text } from "react-native";
import { Polyline, Marker } from "react-native-maps";
import { LatLng, getSegmentColor } from "../utils/tsp";

interface RoutePolylineProps {
  coordinates: LatLng[];
}

interface RouteSegment {
  coordinates: LatLng[];
  distance?: string;
  duration?: string;
  color: string;
}

const RoutePolyline: React.FC<RoutePolylineProps> = ({ coordinates }) => {
  const [routeSegments, setRouteSegments] = useState<RouteSegment[]>([]);
  const [failedSegments, setFailedSegments] = useState<Set<number>>(new Set());
  const [apiDisabled, setApiDisabled] = useState(false);

  // Google Routes API Key
  const GOOGLE_MAPS_APIKEY = "AIzaSyDirGn0mYGt6ws1pBsHCnWzLv-FcgFnq4g";

  // Generate colors for all segments
  const segmentColors = React.useMemo(() => {
    if (coordinates.length < 2) return [];
    return Array.from({ length: coordinates.length - 1 }, (_, index) =>
      getSegmentColor(index, coordinates.length - 1)
    );
  }, [coordinates]);

  // Decode polyline from Google Routes API
  const decodePolyline = (encoded: string): LatLng[] => {
    const poly = [];
    let index = 0;
    const len = encoded.length;
    let lat = 0;
    let lng = 0;

    while (index < len) {
      let b,
        shift = 0,
        result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dlat = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
      lat += dlat;

      shift = 0;
      result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dlng = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
      lng += dlng;

      poly.push({
        latitude: lat / 1e5,
        longitude: lng / 1e5,
      });
    }
    return poly;
  };

  // Fetch route using Google Routes API
  const fetchRouteSegment = async (
    origin: LatLng,
    destination: LatLng,
    segmentIndex: number
  ) => {
    try {
      const requestBody = {
        origin: {
          location: {
            latLng: {
              latitude: origin.latitude,
              longitude: origin.longitude,
            },
          },
        },
        destination: {
          location: {
            latLng: {
              latitude: destination.latitude,
              longitude: destination.longitude,
            },
          },
        },
        travelMode: "DRIVE",
        routingPreference: "TRAFFIC_AWARE",
        computeAlternativeRoutes: false,
        routeModifiers: {
          avoidTolls: false,
          avoidHighways: false,
          avoidFerries: false,
        },
        languageCode: "en-US",
        units: "METRIC",
      };

      const response = await fetch(
        `https://routes.googleapis.com/directions/v2:computeRoutes?key=${GOOGLE_MAPS_APIKEY}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Goog-FieldMask":
              "routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline",
          },
          body: JSON.stringify(requestBody),
        }
      );

      if (!response.ok) {
        if (response.status === 403) {
          console.log("⚠️ Google Routes API access denied. Please check:");
          console.log("1. Routes API is enabled in Google Cloud Console");
          console.log("2. API key has Routes API permissions");
          console.log("3. Billing is enabled for the project");
          setApiDisabled(true);
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const polylineCoords = decodePolyline(route.polyline.encodedPolyline);

        console.log(
          `✅ Segment ${segmentIndex + 1}: ${(
            route.distanceMeters / 1000
          ).toFixed(2)} km, ${route.duration}`
        );

        return {
          coordinates: polylineCoords,
          distance: `${(route.distanceMeters / 1000).toFixed(2)} km`,
          duration: route.duration,
          color: segmentColors[segmentIndex],
        };
      } else {
        throw new Error("No routes found");
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.log(
        `❌ Route error for segment ${segmentIndex + 1}:`,
        errorMessage
      );
      setFailedSegments((prev) => new Set(prev).add(segmentIndex));
      return null;
    }
  };

  // Fetch all route segments
  useEffect(() => {
    const fetchAllRoutes = async () => {
      if (coordinates.length < 2 || apiDisabled) return;

      const segments: RouteSegment[] = [];

      for (let i = 0; i < coordinates.length - 1; i++) {
        if (!failedSegments.has(i)) {
          console.log(`Calculating route for segment ${i + 1}`);
          const segment = await fetchRouteSegment(
            coordinates[i],
            coordinates[i + 1],
            i
          );
          if (segment) {
            segments[i] = segment;
          }

          // If API is disabled, break out of the loop
          if (apiDisabled) {
            console.log("🔄 Switching to fallback routing for all segments");
            break;
          }
        }
      }

      setRouteSegments(segments);
    };

    fetchAllRoutes();
  }, [coordinates, apiDisabled]);

  // Reset failed segments when coordinates change
  useEffect(() => {
    setFailedSegments(new Set());
    setApiDisabled(false);
  }, [coordinates]);

  if (coordinates.length < 2) return null;

  // Calculate arrow positions for fallback polyline
  const calculateArrowPosition = (start: LatLng, end: LatLng) => {
    return {
      latitude: (start.latitude + end.latitude) / 2,
      longitude: (start.longitude + end.longitude) / 2,
      rotation:
        (Math.atan2(
          end.longitude - start.longitude,
          end.latitude - start.latitude
        ) *
          180) /
        Math.PI,
    };
  };

  // If API is disabled, show complete fallback route with colors
  if (apiDisabled) {
    return (
      <>
        {coordinates.map((coord, index) => {
          if (index === coordinates.length - 1) return null;

          const origin = coordinates[index];
          const destination = coordinates[index + 1];
          const arrowPos = calculateArrowPosition(origin, destination);
          const segmentColor = segmentColors[index];

          return (
            <React.Fragment key={`fallback-complete-${index}`}>
              <Polyline
                coordinates={[origin, destination]}
                strokeWidth={4}
                strokeColor={segmentColor}
                lineDashPattern={[10, 5]}
                lineCap="round"
                geodesic={true}
              />
              <Marker
                coordinate={arrowPos}
                anchor={{ x: 0.5, y: 0.5 }}
                rotation={arrowPos.rotation}
                flat={true}
              >
                <View style={styles.arrow}>
                  <Text style={[styles.arrowText, { color: segmentColor }]}>
                    ➤
                  </Text>
                </View>
              </Marker>
            </React.Fragment>
          );
        })}
      </>
    );
  }

  return (
    <>
      {/* Render successful route segments with real road data */}
      {routeSegments.map((segment, index) => {
        if (!segment || failedSegments.has(index)) return null;

        return (
          <Polyline
            key={`route-${index}`}
            coordinates={segment.coordinates}
            strokeWidth={4}
            strokeColor={segment.color}
            lineCap="round"
            geodesic={true}
          />
        );
      })}

      {/* Fallback polylines for failed segments */}
      {coordinates.map((coord, index) => {
        if (index === coordinates.length - 1) return null;
        if (!failedSegments.has(index)) return null;

        const origin = coordinates[index];
        const destination = coordinates[index + 1];
        const arrowPos = calculateArrowPosition(origin, destination);
        const segmentColor = segmentColors[index];

        return (
          <React.Fragment key={`fallback-${index}`}>
            <Polyline
              coordinates={[origin, destination]}
              strokeWidth={4}
              strokeColor={segmentColor}
              lineDashPattern={[10, 5]}
              lineCap="round"
              geodesic={true}
            />
            <Marker
              coordinate={arrowPos}
              anchor={{ x: 0.5, y: 0.5 }}
              rotation={arrowPos.rotation}
              flat={true}
            >
              <View style={styles.arrow}>
                <Text style={[styles.arrowText, { color: segmentColor }]}>
                  ➤
                </Text>
              </View>
            </Marker>
          </React.Fragment>
        );
      })}
    </>
  );
};

const styles = StyleSheet.create({
  arrow: {
    backgroundColor: "transparent",
  },
  arrowText: {
    fontSize: 16,
    fontWeight: "bold",
    textShadowColor: "white",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
  },
});

export default RoutePolyline;
