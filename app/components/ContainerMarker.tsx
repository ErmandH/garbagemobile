import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Marker } from "react-native-maps";

interface ContainerMarkerProps {
  id: number;
  latitude: number;
  longitude: number;
  containerCode: string;
  occupancyRatio: number;
  isFull: boolean;
  onPress?: () => void;
}

const ContainerMarker: React.FC<ContainerMarkerProps> = ({
  id,
  latitude,
  longitude,
  containerCode,
  occupancyRatio,
  isFull,
  onPress,
}) => {
  // Determine background color based on occupancy ratio
  const getBackgroundColor = (): string => {
    if (occupancyRatio >= 0.7) {
      return "rgba(255, 0, 0, 0.9)"; // Red for high occupancy
    } else {
      return "rgba(0, 200, 0, 0.9)"; // Green for low occupancy
    }
  };

  const occupancyPercent = Math.round(occupancyRatio * 100);

  // Extract just the code number from the container code (e.g., "Kon1" -> "1")
  const codeNumber = containerCode.replace(/[^0-9]/g, "");

  return (
    <Marker
      key={id}
      coordinate={{
        latitude,
        longitude,
      }}
      onPress={onPress}
      anchor={{ x: 0.5, y: 0.5 }}
    >
      <View style={{...styles.markerContainer, backgroundColor: getBackgroundColor()}}>
        <Text style={styles.codeText}>{codeNumber}</Text>
        <Text style={styles.percentText}>{occupancyPercent}%</Text>
      </View>
      
    </Marker>
  );
};

const styles = StyleSheet.create({
  markerContainer: {
    padding: 4,
    borderRadius: 999,
  },
  codeText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 12,
    textAlign: "center",
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
  },
  percentText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
  },
});

export default ContainerMarker;
