import * as Location from 'expo-location';

export const requestLocationPermission = async (): Promise<boolean> => {
	try {
		const { status } = await Location.requestForegroundPermissionsAsync();
		return status === 'granted';
	} catch (error) {
		console.error('Error requesting location permission:', error);
		return false;
	}
};

export const getCurrentLocation = async (): Promise<{
	latitude: number;
	longitude: number;
} | null> => {
	try {
		const hasPermission = await requestLocationPermission();
		if (!hasPermission) {
			return null;
		}

		const location = await Location.getCurrentPositionAsync({
			accuracy: Location.Accuracy.Balanced,
		});

		return {
			latitude: location.coords.latitude,
			longitude: location.coords.longitude,
		};
	} catch (error) {
		console.error('Error getting current location:', error);
		return null;
	}
};

export const getMapRegion = async (defaultCenter: { latitude: number; longitude: number }) => {
	const userLocation = await getCurrentLocation();

	return {
		latitude: userLocation?.latitude || defaultCenter.latitude,
		longitude: userLocation?.longitude || defaultCenter.longitude,
		latitudeDelta: 0.01,
		longitudeDelta: 0.01,
	};
}; 