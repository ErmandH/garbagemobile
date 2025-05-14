import React, { useState, useEffect } from "react";
import {
  Text,
  View,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import MapView, { Marker, Callout, PROVIDER_GOOGLE } from "react-native-maps";
import axios from "axios";
import ContainerMarker from "./components/ContainerMarker";

interface Container {
  container_code: string;
  name: string;
  lang: number;
  long: number;
  occupancy_ratio: number;
  is_full: boolean;
  id: number;
}

export default function Index() {
  const [containers, setContainers] = useState<Container[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedContainer, setSelectedContainer] = useState<Container | null>(
    null
  );
  const [region, setRegion] = useState({
    latitude: 40.9741, // Default container area center
    longitude: 28.8754,
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

        // Calculate the center point of all containers
        if (containersData.length > 0) {
          let totalLat = 0;
          let totalLong = 0;
          let minLat = Number.MAX_VALUE;
          let maxLat = Number.MIN_VALUE;
          let minLong = Number.MAX_VALUE;
          let maxLong = Number.MIN_VALUE;

          containersData.forEach((container: Container) => {
            totalLat += container.lang;
            totalLong += container.long;

            // Track min and max values to calculate zoom
            minLat = Math.min(minLat, container.lang);
            maxLat = Math.max(maxLat, container.lang);
            minLong = Math.min(minLong, container.long);
            maxLong = Math.max(maxLong, container.long);
          });

          const centerLat = totalLat / containersData.length;
          const centerLong = totalLong / containersData.length;

          // Calculate appropriate zoom level to fit all containers
          const latDelta = (maxLat - minLat) * 1.2; // 20% padding
          const longDelta = (maxLong - minLong) * 1.2; // 20% padding

          // Set the map region to center on containers with appropriate zoom
          setRegion({
            latitude: centerLat,
            longitude: centerLong,
            latitudeDelta: Math.max(0.008, latDelta),
            longitudeDelta: Math.max(0.008, longDelta),
          });
        }
      } catch (error) {
        console.error("Error:", error);
        setErrorMsg("Failed to load data");
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
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text>Konteynırlar yükleniyor...</Text>
      </View>
    );
  }

  // Function to get marker color based on occupancy
  const getOccupancyStatusColor = (ratio: number) => {
    return ratio >= 0.7 ? "#ff0000" : "#00cc00";
  };

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
                  <Text style={styles.calloutLabel}>Occupancy:</Text>
                  <Text
                    style={[
                      styles.calloutValue,
                      {
                        color: getOccupancyStatusColor(
                          selectedContainer.occupancy_ratio
                        ),
                      },
                    ]}
                  >
                    {(selectedContainer.occupancy_ratio * 100).toFixed(0)}%
                  </Text>
                </View>
                <View style={styles.calloutRow}>
                  <Text style={styles.calloutLabel}>Status:</Text>
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
                    {selectedContainer.is_full ? "Full" : "Available"}
                  </Text>
                </View>
              </View>
            </Callout>
          </Marker>
        )}
      </MapView>

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
    justifyContent: "center",
    alignItems: "center",
  },
  map: {
    width: Dimensions.get("window").width,
    height: Dimensions.get("window").height,
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
  },
  errorText: {
    color: "white",
    fontWeight: "bold",
  },
});
