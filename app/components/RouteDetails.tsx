import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { Container } from "../utils/tsp";

interface RouteDetailsProps {
  containers: Container[];
  totalDistance: string;
}

const RouteDetails: React.FC<RouteDetailsProps> = ({
  containers,
  totalDistance,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Rota Detayları</Text>
        <Text style={styles.distance}>{totalDistance}</Text>
      </View>
      <ScrollView style={styles.scrollView}>
        <View style={styles.step}>
          <Text style={styles.stepNumber}>1</Text>
          <View style={styles.stepContent}>
            <Text style={styles.stepText}>🚛 Başlangıç (Depo)</Text>
            <Text style={styles.subText}>Araç depoda</Text>
          </View>
        </View>
        {containers.map((container, index) => (
          <View key={container.id} style={styles.step}>
            <Text style={styles.stepNumber}>{index + 2}</Text>
            <View style={styles.stepContent}>
              <Text style={styles.stepText}>{container.container_code}</Text>
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
          <Text style={styles.stepNumber}>{containers.length + 2}</Text>
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
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "white",
    borderRadius: 8,
    padding: 10,
    width: 220,
    maxHeight: "60%",
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
    paddingBottom: 8,
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1976D2",
  },
  distance: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  scrollView: {
    flexGrow: 0,
  },
  step: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#1976D2",
    color: "white",
    textAlign: "center",
    lineHeight: 24,
    fontSize: 12,
    fontWeight: "bold",
    marginRight: 8,
  },
  stepContent: {
    flex: 1,
  },
  stepText: {
    fontSize: 14,
    fontWeight: "500",
  },
  subText: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
});

export default RouteDetails;
