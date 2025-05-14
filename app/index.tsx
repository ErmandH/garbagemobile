import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Text,
} from "react-native";
import MapView, { Callout, Marker, PROVIDER_GOOGLE } from "react-native-maps";
import axios from "axios";
import ContainerMarker from "./components/ContainerMarker";
import RoutePolyline from "./components/RoutePolyline";
import TruckMarker from "./components/TruckMarker";
import RouteDetails from "./components/RouteDetails";
import {
  Container,
  TRUCK_DEPOT,
  filterFullContainers,
  calculateOptimalRoute,
  calculateTotalDistance,
  formatDistance,
  LatLng,
} from "./utils/tsp";

export default function Index() {
  const [containers, setContainers] = useState<Container[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedContainer, setSelectedContainer] = useState<Container | null>(
    null
  );
  const [routeCoordinates, setRouteCoordinates] = useState<LatLng[]>([]);
  const [routeContainers, setRouteContainers] = useState<Container[]>([]);
  const [routeDistance, setRouteDistance] = useState<string>("");
  const [region, setRegion] = useState({
    latitude: TRUCK_DEPOT.latitude,
    longitude: TRUCK_DEPOT.longitude,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch containers data
        const response = await axios.get(
          "https://kmtgarbage.vercel.app/containers/"
        );
        const containersData = response.data;
        setContainers(containersData);

        // Filter containers that need collection (occupancy >= 70%)
        const fullContainers = filterFullContainers(containersData);
        setRouteContainers(fullContainers);

        // Calculate optimal route
        const route = calculateOptimalRoute(TRUCK_DEPOT, fullContainers);
        setRouteCoordinates(route);

        // Calculate and format total route distance
        const distance = calculateTotalDistance(route);
        setRouteDistance(formatDistance(distance));

        // Calculate the center point and zoom level
        if (containersData.length > 0) {
          let minLat = Math.min(
            ...containersData.map((c: Container) => c.lang),
            TRUCK_DEPOT.latitude
          );
          let maxLat = Math.max(
            ...containersData.map((c: Container) => c.lang),
            TRUCK_DEPOT.latitude
          );
          let minLong = Math.min(
            ...containersData.map((c: Container) => c.long),
            TRUCK_DEPOT.longitude
          );
          let maxLong = Math.max(
            ...containersData.map((c: Container) => c.long),
            TRUCK_DEPOT.longitude
          );

          const centerLat = (minLat + maxLat) / 2;
          const centerLong = (minLong + maxLong) / 2;
          const latDelta = (maxLat - minLat) * 1.2;
          const longDelta = (maxLong - minLong) * 1.2;

          setRegion({
            latitude: centerLat,
            longitude: centerLong,
            latitudeDelta: Math.max(0.01, latDelta),
            longitudeDelta: Math.max(0.01, longDelta),
          });
        }
      } catch (error) {
        console.error("Error:", error);
        setErrorMsg("Veri yüklenirken bir hata oluştu");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleMarkerPress = (container: Container) => {
    setSelectedContainer(container);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={styles.loadingText}>Konteynırlar yükleniyor...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        region={region}
        showsUserLocation={true}
        showsMyLocationButton={true}
        showsCompass={true}
        rotateEnabled={true}
        minZoomLevel={14}
        maxZoomLevel={20}
      >
        {/* Truck/Depot Marker */}
        <TruckMarker position={TRUCK_DEPOT} />

        {/* Container Markers */}
        {containers.map((container) => (
          <ContainerMarker
            key={container.id}
            id={container.id}
            latitude={container.lang}
            longitude={container.long}
            containerCode={container.container_code}
            occupancyRatio={container.occupancy_ratio}
            isFull={container.is_full}
            onPress={() => handleMarkerPress(container)}
          />
        ))}

        {/* Route Polyline */}
        <RoutePolyline coordinates={routeCoordinates} />

        {/* Selected Container Info */}
        {selectedContainer && (
          <Marker
            coordinate={{
              latitude: selectedContainer.lang,
              longitude: selectedContainer.long,
            }}
            opacity={0}
          >
            <Callout tooltip>
              <View style={styles.callout}>
                <Text style={styles.calloutTitle}>
                  {selectedContainer.container_code}
                </Text>
                <View style={styles.calloutRow}>
                  <Text style={styles.calloutLabel}>Doluluk:</Text>
                  <Text
                    style={[
                      styles.calloutValue,
                      {
                        color:
                          selectedContainer.occupancy_ratio >= 0.7
                            ? "#ff0000"
                            : "#00cc00",
                      },
                    ]}
                  >
                    {(selectedContainer.occupancy_ratio * 100).toFixed(0)}%
                  </Text>
                </View>
                <View style={styles.calloutRow}>
                  <Text style={styles.calloutLabel}>Durum:</Text>
                  <Text
                    style={[
                      styles.calloutValue,
                      {
                        color: selectedContainer.is_full
                          ? "#ff0000"
                          : "#00cc00",
                      },
                    ]}
                  >
                    {selectedContainer.is_full ? "Dolu" : "Müsait"}
                  </Text>
                </View>
              </View>
            </Callout>
          </Marker>
        )}
      </MapView>

      {/* Route Details Panel */}
      <RouteDetails
        containers={routeContainers}
        totalDistance={routeDistance}
      />

      {errorMsg && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{errorMsg}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black",
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  callout: {
    width: 200,
    padding: 12,
    backgroundColor: "white",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ccc",
  },
  calloutTitle: {
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 8,
    textAlign: "center",
  },
  calloutRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 2,
  },
  calloutLabel: {
    fontWeight: "500",
  },
  calloutValue: {
    fontWeight: "bold",
  },
  errorContainer: {
    position: "absolute",
    bottom: 20,
    backgroundColor: "rgba(255, 0, 0, 0.7)",
    padding: 10,
    borderRadius: 5,
    alignSelf: "center",
  },
  errorText: {
    color: "white",
    fontWeight: "bold",
  },
});
