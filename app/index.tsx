import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Text,
  TouchableOpacity,
  Alert,
} from "react-native";
import MapView, { Callout, Marker, PROVIDER_GOOGLE } from "react-native-maps";
import {
  SafeAreaProvider,
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
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

function MapScreen() {
  const [containers, setContainers] = useState<Container[]>([]);
  const [loading, setLoading] = useState(true);
  const [routeLoading, setRouteLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
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

  const insets = useSafeAreaInsets();

  const fetchData = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
        setErrorMsg(null);
      }

      console.log("🔄 Fetching containers data...");

      // Fetch containers data with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await axios.get(
        "https://kmtgarbage.vercel.app/containers/",
        {
          timeout: 10000,
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);

      console.log(
        "✅ Containers data received:",
        response.data?.length || 0,
        "containers"
      );

      const containersData = response.data;

      if (!Array.isArray(containersData)) {
        throw new Error("Invalid data format received from server");
      }

      setContainers(containersData);

      // Filter containers that need collection (occupancy >= 70%)
      const fullContainers = filterFullContainers(containersData);
      setRouteContainers(fullContainers);

      console.log("📍 Full containers:", fullContainers.length);

      // Calculate optimal route
      if (!isRefresh) setRouteLoading(true);

      try {
        const route = calculateOptimalRoute(TRUCK_DEPOT, fullContainers);
        setRouteCoordinates(route);

        // Calculate and format total route distance
        const distance = calculateTotalDistance(route);
        setRouteDistance(formatDistance(distance));

        console.log("🗺️ Route calculated successfully");
      } catch (routeError) {
        console.error("Route calculation error:", routeError);
        setErrorMsg("Rota hesaplanırken hata oluştu");
      }

      if (!isRefresh) setRouteLoading(false);

      // Calculate the center point and zoom level (only on initial load)
      if (containersData.length > 0 && !isRefresh) {
        try {
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

          console.log("🎯 Map region set successfully");
        } catch (regionError) {
          console.error("Region calculation error:", regionError);
          // Use default region if calculation fails
        }
      }

      console.log(
        `✅ ${isRefresh ? "Refreshed" : "Loaded"} ${
          containersData.length
        } containers, ${fullContainers.length} need collection`
      );
    } catch (error) {
      console.error("❌ Fetch error:", error);

      let errorMessage = "Veri yüklenirken bir hata oluştu";

      if (error instanceof Error) {
        if (error.name === "AbortError") {
          errorMessage = "Bağlantı zaman aşımına uğradı";
        }
      } else if (axios.isAxiosError(error)) {
        if (error.code === "ECONNABORTED") {
          errorMessage = "Bağlantı zaman aşımına uğradı";
        } else if (error.code === "NETWORK_ERROR" || !error.response) {
          errorMessage = "İnternet bağlantısını kontrol edin";
        } else if (error.response?.status === 404) {
          errorMessage = "Sunucu bulunamadı";
        } else if (error.response?.status >= 500) {
          errorMessage = "Sunucu hatası";
        }
      }

      setErrorMsg(errorMessage);

      // Show alert in production builds
      if (__DEV__ === false) {
        Alert.alert(
          "Bağlantı Hatası",
          errorMessage +
            "\n\nLütfen internet bağlantınızı kontrol edin ve tekrar deneyin.",
          [
            { text: "Tamam", style: "default" },
            { text: "Tekrar Dene", onPress: () => fetchData(isRefresh) },
          ]
        );
      }

      if (!isRefresh) setRouteLoading(false);
    } finally {
      if (isRefresh) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    console.log("🚀 App started, initializing...");
    fetchData();
  }, []);

  const handleRefresh = () => {
    console.log("🔄 Manual refresh triggered");
    fetchData(true);
  };

  const handleMarkerPress = (container: Container) => {
    setSelectedContainer(container);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={styles.loadingText}>Konteynırlar yükleniyor...</Text>
        <Text style={styles.loadingSubText}>
          İnternet bağlantınızı kontrol edin
        </Text>
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
        {routeCoordinates.length > 0 && (
          <RoutePolyline coordinates={routeCoordinates} />
        )}

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

      {/* Refresh Button */}
      <TouchableOpacity
        style={[styles.refreshButton, { top: insets.top + 10 }]}
        onPress={handleRefresh}
        disabled={refreshing}
      >
        <View style={styles.refreshButtonContent}>
          {refreshing ? (
            <ActivityIndicator size="small" color="#1976D2" />
          ) : (
            <Text style={styles.refreshIcon}>🔄</Text>
          )}
          <Text style={styles.refreshText}>
            {refreshing ? "Güncelleniyor..." : "Yenile"}
          </Text>
        </View>
      </TouchableOpacity>

      {/* Route Loading Indicator */}
      {routeLoading && (
        <View style={[styles.routeLoadingContainer, { top: insets.top + 60 }]}>
          <View style={styles.routeLoadingBox}>
            <ActivityIndicator size="small" color="#1976D2" />
            <Text style={styles.routeLoadingText}>Rota hesaplanıyor...</Text>
          </View>
        </View>
      )}

      {/* Route Details Panel */}
      <View style={[styles.routeDetailsContainer, { top: insets.top + 10 }]}>
        <RouteDetails
          containers={routeContainers}
          totalDistance={routeDistance}
        />
      </View>

      {errorMsg && (
        <View style={[styles.errorContainer, { bottom: insets.bottom + 20 }]}>
          <Text style={styles.errorText}>{errorMsg}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              setErrorMsg(null);
              fetchData();
            }}
          >
            <Text style={styles.retryText}>Tekrar Dene</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

export default function Index() {
  return (
    <SafeAreaProvider>
      <MapScreen />
    </SafeAreaProvider>
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
    backgroundColor: "#f5f5f5",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  loadingSubText: {
    marginTop: 5,
    fontSize: 12,
    color: "#999",
  },
  refreshButton: {
    position: "absolute",
    left: 10,
    zIndex: 1000,
  },
  refreshButtonContent: {
    backgroundColor: "white",
    borderRadius: 8,
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    minWidth: 100,
  },
  refreshIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  refreshText: {
    fontSize: 12,
    color: "#1976D2",
    fontWeight: "500",
  },
  routeLoadingContainer: {
    position: "absolute",
    left: 10,
    zIndex: 1000,
  },
  routeLoadingBox: {
    backgroundColor: "white",
    borderRadius: 8,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  routeLoadingText: {
    marginLeft: 8,
    fontSize: 12,
    color: "#1976D2",
    fontWeight: "500",
  },
  routeDetailsContainer: {
    position: "absolute",
    right: 10,
    zIndex: 1000,
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
    backgroundColor: "rgba(255, 0, 0, 0.9)",
    padding: 15,
    borderRadius: 8,
    alignSelf: "center",
    maxWidth: "90%",
  },
  errorText: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
  },
  retryButton: {
    backgroundColor: "white",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
    alignSelf: "center",
  },
  retryText: {
    color: "#ff0000",
    fontWeight: "bold",
    fontSize: 12,
  },
});
