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

export interface RouteInfo {
	totalDistance: number;
	totalDuration: number;
	segments: Array<{
		distance: number;
		duration: number;
		from: string;
		to: string;
	}>;
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

// Calculate total route distance in kilometers (fallback for straight line)
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

// Format duration to human readable string
export function formatDuration(duration: number): string {
	const hours = Math.floor(duration / 60);
	const minutes = Math.round(duration % 60);

	if (hours > 0) {
		return `${hours}s ${minutes}dk`;
	}
	return `${minutes}dk`;
}

// Get container names for route display
export function getRouteContainerNames(route: LatLng[], containers: Container[], depot: LatLng): string[] {
	const names = ["Depo"];

	route.slice(1, -1).forEach(coord => {
		const container = containers.find(c =>
			Math.abs(c.lang - coord.latitude) < 0.0001 &&
			Math.abs(c.long - coord.longitude) < 0.0001
		);
		if (container) {
			names.push(container.container_code);
		}
	});

	names.push("Depo");
	return names;
}

// Generate vibrant colors for route segments
export function generateRouteColors(segmentCount: number): string[] {
	const colors: string[] = [];
	const predefinedColors = [
		'#FF6B6B', // Red
		'#4ECDC4', // Teal
		'#45B7D1', // Blue
		'#96CEB4', // Green
		'#FFEAA7', // Yellow
		'#DDA0DD', // Plum
		'#98D8C8', // Mint
		'#F7DC6F', // Light Yellow
		'#BB8FCE', // Light Purple
		'#85C1E9', // Light Blue
		'#F8C471', // Orange
		'#82E0AA', // Light Green
		'#F1948A', // Light Red
		'#85C1E9', // Sky Blue
		'#D7BDE2', // Lavender
	];

	for (let i = 0; i < segmentCount; i++) {
		if (i < predefinedColors.length) {
			colors.push(predefinedColors[i]);
		} else {
			// Generate random vibrant color if we run out of predefined ones
			const hue = (i * 137.508) % 360; // Golden angle approximation
			const saturation = 70 + Math.random() * 30; // 70-100%
			const lightness = 45 + Math.random() * 20; // 45-65%
			colors.push(`hsl(${hue}, ${saturation}%, ${lightness}%)`);
		}
	}

	return colors;
}

// Get color for a specific segment index
export function getSegmentColor(segmentIndex: number, totalSegments: number): string {
	const colors = generateRouteColors(totalSegments);
	return colors[segmentIndex] || '#FF6B6B';
} 