import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Marker } from "react-native-maps";
import { LatLng } from "../utils/tsp";

interface TruckMarkerProps {
  position: LatLng;
}

const TruckMarker: React.FC<TruckMarkerProps> = ({ position }) => {
  return (
    <Marker coordinate={position} anchor={{ x: 0.5, y: 0.5 }}>
      <View style={styles.markerContainer}>
        <Text style={styles.markerText}>🚛</Text>
      </View>
    </Marker>
  );
};

const styles = StyleSheet.create({
  markerContainer: {
    backgroundColor: "#fff",
    padding: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#1976D2",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  markerText: {
    fontSize: 20,
  },
});

export default TruckMarker;
