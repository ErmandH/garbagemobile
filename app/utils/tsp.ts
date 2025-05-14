export type LatLng = { latitude: number; longitude: number };

export interface Container {
	id: number;
	container_code: string;
	name: string;
	lang: number;
	long: number;
	occupancy_ratio: number;
	is_full: boolean;
}

export const TRUCK_DEPOT: LatLng = {
	latitude: 40.9765,
	longitude: 28.8706,
};

export function filterFullContainers(containers: Container[]): Container[] {
	return containers.filter((container) => container.occupancy_ratio >= 0.7);
}

function haversineDistance(a: LatLng, b: LatLng): number {
	const toRad = (x: number) => (x * Math.PI) / 180;
	const R = 6371; // Earth's radius in km
	const dLat = toRad(b.latitude - a.latitude);
	const dLon = toRad(b.longitude - a.longitude);
	const lat1 = toRad(a.latitude);
	const lat2 = toRad(b.latitude);

	const aVal =
		Math.sin(dLat / 2) * Math.sin(dLat / 2) +
		Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
	const c = 2 * Math.atan2(Math.sqrt(aVal), Math.sqrt(1 - aVal));
	return R * c;
}

// Nearest Neighbor algorithm for TSP
export function calculateOptimalRoute(
	startPoint: LatLng,
	containers: Container[]
): LatLng[] {
	if (containers.length === 0) return [startPoint];

	const points: LatLng[] = containers.map((c) => ({
		latitude: c.lang,
		longitude: c.long,
	}));

	const visited: boolean[] = Array(points.length).fill(false);
	const route: LatLng[] = [startPoint];
	let current = startPoint;

	// Find nearest unvisited point until all points are visited
	for (let i = 0; i < points.length; i++) {
		let minDist = Infinity;
		let minIdx = -1;

		// Find the nearest unvisited point
		for (let j = 0; j < points.length; j++) {
			if (!visited[j]) {
				const dist = haversineDistance(current, points[j]);
				if (dist < minDist) {
					minDist = dist;
					minIdx = j;
				}
			}
		}

		if (minIdx !== -1) {
			visited[minIdx] = true;
			current = points[minIdx];
			route.push(current);
		}
	}

	// Return to depot
	route.push(startPoint);

	return route;
}

// Calculate total route distance in kilometers
export function calculateTotalDistance(route: LatLng[]): number {
	let totalDistance = 0;
	for (let i = 0; i < route.length - 1; i++) {
		totalDistance += haversineDistance(route[i], route[i + 1]);
	}
	return totalDistance;
}

// Format distance to human readable string
export function formatDistance(distance: number): string {
	return `${distance.toFixed(2)} km`;
} 