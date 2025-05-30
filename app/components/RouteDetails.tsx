import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import {
  Container,
  RouteInfo,
  formatDuration,
  getSegmentColor,
} from "../utils/tsp";

interface RouteDetailsProps {
  containers: Container[];
  totalDistance: string;
  onRouteInfoUpdate?: (info: RouteInfo) => void;
}

const RouteDetails: React.FC<RouteDetailsProps> = ({
  containers,
  totalDistance,
  onRouteInfoUpdate,
}) => {
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);

  // Generate colors for route segments
  const segmentColors = React.useMemo(() => {
    const totalSegments = containers.length + 1; // +1 for return to depot
    return Array.from({ length: totalSegments }, (_, index) =>
      getSegmentColor(index, totalSegments)
    );
  }, [containers.length]);

  // Update route info when received from parent
  React.useEffect(() => {
    if (onRouteInfoUpdate) {
      // This will be called when route info is available
    }
  }, [onRouteInfoUpdate]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Rota Detayları</Text>
        <Text style={styles.distance}>{totalDistance}</Text>
      </View>
      <ScrollView style={styles.scrollView}>
        <View style={styles.step}>
          <View style={[styles.stepNumber, { backgroundColor: "#666" }]}>
            <Text style={styles.stepNumberText}>1</Text>
          </View>
          <View style={styles.stepContent}>
            <Text style={styles.stepText}>🚛 Başlangıç (Depo)</Text>
            <Text style={styles.subText}>Araç depoda</Text>
          </View>
        </View>
        {containers.map((container, index) => (
          <View key={container.id} style={styles.step}>
            <View
              style={[
                styles.stepNumber,
                { backgroundColor: segmentColors[index] },
              ]}
            >
              <Text style={styles.stepNumberText}>{index + 2}</Text>
            </View>
            <View style={styles.stepContent}>
              <View style={styles.stepHeader}>
                <Text style={styles.stepText}>{container.container_code}</Text>
                <View
                  style={[
                    styles.colorIndicator,
                    { backgroundColor: segmentColors[index] },
                  ]}
                />
              </View>
              <Text
                style={[
                  styles.subText,
                  {
                    color:
                      container.occupancy_ratio >= 0.7 ? "#ff0000" : "#00cc00",
                  },
                ]}
              >
                Doluluk: {(container.occupancy_ratio * 100).toFixed(0)}%
              </Text>
            </View>
          </View>
        ))}
        <View style={styles.step}>
          <View
            style={[
              styles.stepNumber,
              { backgroundColor: segmentColors[containers.length] || "#666" },
            ]}
          >
            <Text style={styles.stepNumberText}>{containers.length + 2}</Text>
          </View>
          <View style={styles.stepContent}>
            <Text style={styles.stepText}>🚛 Bitiş (Depo)</Text>
            <Text style={styles.subText}>Araç depoya dönüyor</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "white",
    borderRadius: 8,
    padding: 8,
    width: 220,
    maxHeight: "75%",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingBottom: 6,
    marginBottom: 6,
  },
  title: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#1976D2",
  },
  distance: {
    fontSize: 11,
    color: "#666",
    marginTop: 1,
  },
  scrollView: {
    flexGrow: 0,
  },
  step: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  stepNumber: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 6,
    marginTop: 1,
  },
  stepNumberText: {
    color: "white",
    fontSize: 10,
    fontWeight: "bold",
  },
  stepContent: {
    flex: 1,
  },
  stepHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  stepText: {
    fontSize: 12,
    fontWeight: "500",
    flex: 1,
  },
  colorIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginLeft: 4,
  },
  subText: {
    fontSize: 10,
    color: "#666",
    marginTop: 1,
  },
});

export default RouteDetails;
