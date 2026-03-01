import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Form, InputGroup, ListGroup, Button, Spinner } from 'react-bootstrap';

import { SRI_LANKA_TOWNS, findNearestTown, searchTowns } from '../data/sl-locations';

// Fix for default marker icon missing in React Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Helper Components (Defined outside to prevent re-creation on every render)
const MapClickHandler = ({ onUpdate }) => {
    useMapEvents({
        click(e) {
            const { lat, lng } = e.latlng;
            onUpdate(lat, lng);
        },
    });
    return null;
};

const MapRecenter = ({ center }) => {
    const map = useMapEvents({});
    useEffect(() => {
        if (center && center.lat && center.lng) {
            map.flyTo([center.lat, center.lng], map.getZoom() < 13 ? 13 : map.getZoom(), {
                animate: true,
                duration: 1.5
            });
        }
    }, [center, map]);
    return null;
};

const LocationPicker = ({ onLocationSelect, initialAddress, externalCenter }) => {
    const [position, setPosition] = useState(null); // { lat, lng }
    const [searchText, setSearchText] = useState(initialAddress || '');
    const [suggestions, setSuggestions] = useState([]);
    const [loading, setLoading] = useState(false);
    const mapRef = useRef(null);

    // Initial center (Colombo, Sri Lanka default)
    const [center, setCenter] = useState({ lat: 6.9271, lng: 79.8612 });

    // Auto-detect location on load if no initial address is set
    useEffect(() => {
        if (!initialAddress || initialAddress === '') {
            // Give a tiny delay for browser stability
            const timer = setTimeout(() => {
                handleLiveLocation();
            }, 800);
            return () => clearTimeout(timer);
        }
    }, []);

    // React to external center changes (e.g. when District dropdown changes)
    useEffect(() => {
        if (externalCenter && externalCenter.lat && externalCenter.lng) {
            setCenter({ lat: externalCenter.lat, lng: externalCenter.lng });
        }
    }, [externalCenter?.lat, externalCenter?.lng]);

    const handleLiveLocation = () => {
        if (!navigator.geolocation) {
            alert("Geolocation is not supported by your browser");
            return;
        }

        setLoading(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                // Center map and update location
                setCenter({ lat: latitude, lng: longitude });
                handleLocationUpdate(latitude, longitude);
            },
            (error) => {
                console.error("Error retrieving location:", error);
                setLoading(false);
                let msg = "Unable to retrieve your location.";
                if (error.code === 1) msg = "Locaton permission denied. Please allow location access in your browser settings.";
                else if (error.code === 2) msg = "Location unavailable.";
                else if (error.code === 3) msg = "Location request timed out.";
                alert(msg);
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    };

    const handleLocationUpdate = async (lat, lng) => {
        setPosition({ lat, lng });
        setLoading(true);

        // 1. Instant Local Recovery (Zero Latency, No CORS)
        const nearestTown = findNearestTown(lat, lng);

        // 2. Background Street Detection (Silent)
        let streetAddress = "";
        try {
            const resp = await fetch(`https://photon.komoot.io/reverse?lon=${lng}&lat=${lat}`).catch(() => null);
            if (resp && resp.ok) {
                const data = await resp.json();
                if (data?.features?.[0]?.properties) {
                    const p = data.features[0].properties;
                    streetAddress = [p.name, p.street].filter(Boolean).join(', ');
                }
            }
        } catch (e) { /* background fail */ }

        // 3. Build Result
        const finalAddress = streetAddress
            ? `${streetAddress}, ${nearestTown.name}, ${nearestTown.district}`
            : `${nearestTown.name}, ${nearestTown.district}`;

        setSearchText(finalAddress);
        onLocationSelect(finalAddress, { lat, lng }, nearestTown.district);
        setLoading(false);
    };

    const handleSearchChange = async (e) => {
        const query = e.target.value;
        setSearchText(query);
        onLocationSelect(query, position, null);

        if (query.length > 1) {
            // Local Search (Absolute Reliability)
            const locals = searchTowns(query).map(t => ({
                display_name: `${t.name}, ${t.district} District`,
                lat: t.lat,
                lon: t.lng,
                district: t.district,
                is_local: true
            }));
            setSuggestions(locals);

            // Background External Search
            try {
                const res = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=5&lat=7.8731&lon=80.7718`).catch(() => null);
                if (res && res.ok) {
                    const data = await res.json();
                    const exts = data.features.map(f => ({
                        display_name: [f.properties.name, f.properties.street, f.properties.city, f.properties.country].filter(Boolean).join(', '),
                        lat: f.geometry.coordinates[1],
                        lon: f.geometry.coordinates[0],
                        district: f.properties.county || f.properties.district || f.properties.city
                    }));

                    setSuggestions(prev => {
                        const existingNames = new Set(prev.map(p => p.display_name.toLowerCase()));
                        return [...prev, ...exts.filter(e => !existingNames.has(e.display_name.toLowerCase()))];
                    });
                }
            } catch (e) { /* ignore */ }
        } else {
            setSuggestions([]);
        }
    };

    const selectSuggestion = (item) => {
        const lat = parseFloat(item.lat);
        const lng = parseFloat(item.lon);
        const address = item.display_name;
        const district = (item.district || "").replace(' District', '');

        setPosition({ lat, lng });
        setCenter({ lat, lng });
        setSearchText(address);
        setSuggestions([]);
        onLocationSelect(address, { lat, lng }, district);
    };

    const eventHandlers = React.useMemo(
        () => ({
            dragend(e) {
                const marker = e.target;
                const pos = marker.getLatLng();
                handleLocationUpdate(pos.lat, pos.lng);
            },
        }),
        [],
    );

    return (
        <div className="location-picker-wrapper position-relative">
            {/* Search Input */}
            <div className="location-search-box mb-3 position-relative">
                <InputGroup className="shadow-sm rounded-4 overflow-hidden">
                    <InputGroup.Text className="bg-white border-end-0 ps-3">
                        <i className="bi bi-geo-alt-fill text-danger"></i>
                    </InputGroup.Text>
                    <Form.Control
                        placeholder="Search your location or type address..."
                        value={searchText}
                        onChange={handleSearchChange}
                        className="border-start-0 py-3 fw-medium"
                    />
                    <Button
                        variant="outline-danger"
                        className="border-start-0 border-end-0"
                        title="Use my current location"
                        onClick={handleLiveLocation}
                    >
                        <i className="bi bi-crosshair"></i>
                    </Button>
                    {loading && (
                        <InputGroup.Text className="bg-white border-start-0">
                            <Spinner animation="border" size="sm" variant="danger" />
                        </InputGroup.Text>
                    )}
                </InputGroup>

                {/* Autocomplete Suggestions */}
                {suggestions.length > 0 && (
                    <ListGroup className="position-absolute w-100 shadow-lg mt-1 rounded-4 overflow-hidden" style={{ zIndex: 1000, maxHeight: '200px', overflowY: 'auto' }}>
                        {suggestions.map((item, idx) => (
                            <ListGroup.Item
                                key={idx}
                                action
                                onClick={() => selectSuggestion(item)}
                                className="border-0 border-bottom px-3 py-2"
                            >
                                <small className="fw-bold d-block text-dark">{item.display_name.split(',')[0]}</small>
                                <small className="text-muted text-truncate d-block">{item.display_name}</small>
                            </ListGroup.Item>
                        ))}
                    </ListGroup>
                )}
            </div>

            {/* Map */}
            <div className="map-container rounded-4 overflow-hidden shadow-sm border" style={{ height: '300px', width: '100%', position: 'relative', zIndex: 1 }}>
                <MapContainer
                    center={[center.lat, center.lng]}
                    zoom={13}
                    scrollWheelZoom={false}
                    style={{ height: '100%', width: '100%' }}
                    ref={mapRef}
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <MapClickHandler onUpdate={handleLocationUpdate} />
                    <MapRecenter center={center} />
                    {position && (
                        <Marker
                            position={[position.lat, position.lng]}
                            draggable={true}
                            eventHandlers={eventHandlers}
                        />
                    )}
                </MapContainer>

                {/* Overlay Instruction */}
                <div className="position-absolute bottom-0 start-0 w-100 p-2 bg-white bg-opacity-75 text-center small fw-bold text-secondary backdrop-blur" style={{ zIndex: 500 }}>
                    Click map to pin or drag the marker to your exact door
                </div>
            </div>
        </div>
    );
};

export default LocationPicker;
