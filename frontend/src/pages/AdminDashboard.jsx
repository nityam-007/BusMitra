import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, TabGroup, TabList, Tab, TabPanels, TabPanel, Text, Metric, Grid } from '@tremor/react';
import { MapContainer, TileLayer, Marker, Polyline, Popup } from 'react-leaflet';
import L from 'leaflet';
import { ArrowLeft, Download, ArrowsClockwise } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { DEFAULT_STOPS } from '@/data/transitData';
import SimulatorPanel from './SimulatorPanel';
import { io } from 'socket.io-client';

const getBusIcon = (status, heading) => {
  const color = status === 'live' ? '#059669' : status === 'crowd_restored' ? '#d97706' : status === 'off_route' ? '#dc2626' : '#64748b';
  return L.divIcon({
    className: 'custom-bus-marker',
    html: `<div style="transform: rotate(${heading || 0}deg); background: ${color}; width: 32px; height: 32px; border-radius: 50%; border: 2px solid white; box-shadow: 0 3px 8px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white;">
      <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M4 16c0 .88.39 1.67 1 2.22V20c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h8v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4s-8 .5-8 4v10zm3.5 1c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm9 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm1.5-6H6V6h12v5z"/></svg>
    </div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16]
  });
};

const adminDrivers = [
  { rank: 1, name: 'Sandeep Singh', busId: 'M1', score: 1450, onTimePercent: 98 },
  { rank: 2, name: 'Rajesh Kumar', busId: 'M1', score: 1320, onTimePercent: 94 },
  { rank: 3, name: 'Gurpreet Kaur', busId: 'M2', score: 1150, onTimePercent: 88 },
  { rank: 4, name: 'Amit Sharma', busId: 'M3', score: 980, onTimePercent: 75 }
];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [buses, setBuses] = useState([]);
  const [health, setHealth] = useState({ status: 'ok', activeBuses: 0, uptime: 0 });
  const [allRoutes, setAllRoutes] = useState([]);
  const [selectedBus, setSelectedBus] = useState(null);

  const fetchLiveFleet = async () => {
    try {
      const [resBuses, resHealth] = await Promise.all([
        fetch('/api/buses').then((r) => r.json()),
        fetch('/health').then((r) => r.json())
      ]);
      setBuses(resBuses || []);
      setHealth(resHealth || { status: 'ok', activeBuses: 0, uptime: 0 });
    } catch (e) {}
  };

  useEffect(() => {
    fetchLiveFleet();
    
    // Connect to Socket.io for real-time updates
    const socket = io(import.meta.env.VITE_BACKEND_URL || '/', {
      transports: ['websocket', 'polling']
    });

    socket.on('connect', () => {
      console.log('[Admin] Socket connected:', socket.id);
      fetchLiveFleet(); // refresh on reconnect
    });

    socket.on('bus_update', (bus) => {
      setBuses((prev) => {
        const idx = prev.findIndex((b) => b.busId === bus.busId);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = { ...updated[idx], ...bus };
          return updated;
        }
        return [...prev, bus];
      });
      setSelectedBus((prev) => (prev && prev.busId === bus.busId) ? { ...prev, ...bus } : prev);
    });

    socket.on('status_change', (change) => {
      setBuses((prev) =>
        prev.map((b) => b.busId === change.busId ? { ...b, status: change.status } : b)
      );
      setSelectedBus((prev) => (prev && prev.busId === change.busId) ? { ...prev, status: change.status } : prev);
      
      // Show toast alert for status transitions
      if (change.status === 'scheduled' || change.status === 'inactive') {
        toast.warning(`⚠️ Bus ${change.busId} went ${change.status}`);
      } else if (change.status === 'off_route') {
        toast.error(`🚨 Bus ${change.busId} is OFF ROUTE!`);
      } else if (change.status === 'live') {
        toast.success(`✅ Bus ${change.busId} back online!`);
      }
    });

    // Fallback: still poll health every 30s
    const healthInterval = setInterval(async () => {
      try {
        const res = await fetch('/health');
        const data = await res.json();
        setHealth(data);
      } catch (e) {}
    }, 30000);
    
    // Fetch all routes for polylines
    const fetchAllRoutes = async () => {
      try {
        const res = await fetch('/api/routes');
        if (!res.ok) return;
        const routeSummaries = await res.json();
        
        const detailed = await Promise.all(
          routeSummaries.map(async (r) => {
            try {
              const detailRes = await fetch(`/api/routes/${r.id}`);
              if (detailRes.ok) return await detailRes.json();
            } catch (e) {}
            return { ...r, polyline: [] };
          })
        );
        setAllRoutes(detailed);
      } catch (e) {}
    };
    fetchAllRoutes();

    return () => {
      socket.disconnect();
      clearInterval(healthInterval);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const mogaCenter = [30.825, 75.148];

  const activeBusesCount = buses.filter((b) => b.status === 'live' || b.status === 'crowd_restored').length;
  const offlineBusesCount = buses.filter((b) => b.status === 'scheduled' || b.status === 'inactive' || b.status === 'offline').length;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans sm:px-6 lg:px-8 pb-12">
      <header className="px-4 py-5 bg-white border-b border-gray-200 shadow-sm sm:rounded-b-lg mb-6 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/')} className="p-2 -ml-1 rounded-full hover:bg-gray-100">
              <ArrowLeft size={22} className="text-gray-700" />
            </button>
            <div>
              <h1 className="text-xl font-black text-gray-900">Moga Municipal Fleet Dashboard</h1>
              <p className="text-xs text-gray-500 font-medium">Real-Time City Transport Monitoring & Analytics</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={fetchLiveFleet} className="gap-1 text-xs">
              <ArrowsClockwise size={14} /> Refresh
            </Button>
            <Button
              size="sm"
              onClick={() => {
                window.open('/api/gtfs-rt/vehicle-positions', '_blank');
              }}
              className="gap-1 text-xs bg-primary text-white"
            >
              <Download size={14} /> GTFS-RT Feed
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-0">
        <TabGroup>
          <TabList className="mb-6 bg-white p-1 rounded-lg border border-gray-200 w-max shadow-sm">
            <Tab className="px-6 py-2 rounded-md text-xs font-bold ui-selected:bg-primary ui-selected:text-white">Live Fleet</Tab>
            <Tab className="px-6 py-2 rounded-md text-xs font-bold ui-selected:bg-primary ui-selected:text-white">Simulator Bots</Tab>
            <Tab className="px-6 py-2 rounded-md text-xs font-bold ui-selected:bg-primary ui-selected:text-white">Driver Leaderboard</Tab>
            <Tab className="px-6 py-2 rounded-md text-xs font-bold ui-selected:bg-primary ui-selected:text-white">GTFS-RT Feeds</Tab>
          </TabList>

          <TabPanels>
            {/* Tab 1: Live Fleet */}
            <TabPanel>
              <div className="flex flex-col gap-6">
                <Card className="p-0 overflow-hidden shadow-sm border-gray-200 bg-white">
                  <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <h2 className="text-sm font-bold text-gray-800">Live Corridor Map (Moga ⇄ Dagru)</h2>
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                      ● Active Fleet: {buses.length}
                    </span>
                  </div>
                  <div className="h-[420px] w-full bg-gray-100 relative z-0">
                    <MapContainer center={mogaCenter} zoom={13} scrollWheelZoom={false} className="w-full h-full z-0">
                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                      
                      {/* Multi-route polylines */}
                      {allRoutes.map((route) => (
                        route.polyline && route.polyline.length > 0 && (
                          <Polyline
                            key={route.id}
                            positions={route.polyline.map((pt) => [pt.lat, pt.lng])}
                            color={route.color || '#1a56db'}
                            weight={4}
                            opacity={0.7}
                          >
                            <Popup>
                              <b>{route.id}: {route.name}</b>
                              <div>{route.polyline.length} waypoints</div>
                            </Popup>
                          </Polyline>
                        )
                      ))}

                      {/* Stops rendered only if we don't have multiple routes, or could render DEFAULT_STOPS for now */}
                      {DEFAULT_STOPS.map((s) => (
                        <Marker key={s.id} position={[s.lat, s.lng]}>
                          <Popup>
                            <b>{s.name}</b> (Stop #{s.order})
                          </Popup>
                        </Marker>
                      ))}

                      {buses.map((bus) => (
                        <Marker
                          key={bus.busId}
                          position={[bus.lat, bus.lng]}
                          icon={getBusIcon(bus.status, bus.heading)}
                          eventHandlers={{ click: () => setSelectedBus(bus) }}
                        >
                          <Popup>
                            <div className="text-xs font-sans min-w-[180px]">
                              <b className="text-sm">🚌 Bus {bus.busId}</b>
                              <div className="mt-1 space-y-0.5">
                                <div>Route: <b>{bus.routeId || '—'}</b></div>
                                <div>Driver: <b>{bus.driverId || 'Unknown'}</b></div>
                                <div>Status: <b style={{color: bus.status === 'live' ? '#059669' : bus.status === 'off_route' ? '#dc2626' : '#64748b'}}>{bus.status?.toUpperCase()}</b></div>
                                <div>Speed: <b>{bus.speed || 0} km/h</b></div>
                                <div>Occupancy: <b>{bus.occupancy_tier || 'unknown'}</b></div>
                                {bus.startedAt && <div>Trip Duration: <b>{Math.round((Date.now() - bus.startedAt) / 60000)} min</b></div>}
                                {bus.cross_track_km !== undefined && <div>Off-Corridor: <b>{(bus.cross_track_km * 1000).toFixed(0)}m</b></div>}
                              </div>
                            </div>
                          </Popup>
                        </Marker>
                      ))}
                    </MapContainer>
                  </div>
                </Card>

                <Grid numItemsSm={3} className="gap-4">
                  <Card decoration="top" decorationColor="emerald" className="shadow-sm bg-white">
                    <Text className="text-xs text-gray-500 font-bold uppercase">Buses Online</Text>
                    <Metric className="text-gray-900 font-black mt-1 text-2xl">{activeBusesCount}</Metric>
                  </Card>
                  <Card decoration="top" decorationColor="gray" className="shadow-sm bg-white">
                    <Text className="text-xs text-gray-500 font-bold uppercase">Buses Scheduled/Offline</Text>
                    <Metric className="text-gray-900 font-black mt-1 text-2xl">{offlineBusesCount}</Metric>
                  </Card>
                  <Card decoration="top" decorationColor="blue" className="shadow-sm bg-white">
                    <Text className="text-xs text-gray-500 font-bold uppercase">Corridors Monitored</Text>
                    <Metric className="text-gray-900 font-black mt-1 text-2xl">
                      {allRoutes.length || 3} Routes
                    </Metric>
                  </Card>
                </Grid>

                {/* Fleet Status Table */}
                <Card className="shadow-sm border-gray-200 bg-white mt-4 p-0 overflow-hidden">
                  <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                    <h2 className="text-sm font-bold text-gray-800">Fleet Status</h2>
                  </div>
                  <div className="divide-y divide-gray-100 max-h-64 overflow-y-auto">
                    {buses.length === 0 ? (
                      <div className="p-4 text-center text-gray-400 text-sm">No active buses</div>
                    ) : (
                      buses.map((bus) => (
                        <div
                          key={bus.busId}
                          className={`px-4 py-3 flex items-center justify-between cursor-pointer
                            hover:bg-gray-50 transition-colors
                            ${selectedBus?.busId === bus.busId ? 'bg-blue-50' : ''}`}
                          onClick={() => setSelectedBus(bus)}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${
                              bus.status === 'live' ? 'bg-emerald-500' :
                              bus.status === 'crowd_restored' ? 'bg-amber-500' :
                              bus.status === 'off_route' ? 'bg-red-500' :
                              'bg-gray-400'
                            }`} />
                            <div>
                              <div className="font-bold text-sm text-gray-900">{bus.busId}</div>
                              <div className="text-xs text-gray-500">Route: {bus.routeId || '—'}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs font-bold" style={{
                              color: bus.status === 'live' ? '#059669' :
                                     bus.status === 'off_route' ? '#dc2626' : '#64748b'
                            }}>
                              {bus.status?.toUpperCase()}
                            </div>
                            <div className="text-[10px] text-gray-400">{bus.speed || 0} km/h</div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </Card>
                
                {/* Selected Bus Detail Panel */}
                {selectedBus && (
                  <Card className="shadow-sm border-gray-200 bg-white p-0 mt-4 overflow-hidden">
                    <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                      <h2 className="text-sm font-bold text-gray-800">
                        🚌 Bus {selectedBus.busId} — Telemetry
                      </h2>
                      <button onClick={() => setSelectedBus(null)} className="text-xs text-gray-400 hover:text-gray-600">✕ Close</button>
                    </div>
                    <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div><span className="text-gray-500">Route</span><br/><b>{selectedBus.routeId || '—'}</b></div>
                      <div><span className="text-gray-500">Driver</span><br/><b>{selectedBus.driverId || 'Unknown'}</b></div>
                      <div><span className="text-gray-500">Status</span><br/><b style={{color: selectedBus.status === 'live' ? '#059669' : selectedBus.status === 'off_route' ? '#dc2626' : '#64748b'}}>{selectedBus.status?.toUpperCase()}</b></div>
                      <div><span className="text-gray-500">Speed</span><br/><b>{selectedBus.speed || 0} km/h</b></div>
                      <div><span className="text-gray-500">Heading</span><br/><b>{selectedBus.heading || 0}°</b></div>
                      <div><span className="text-gray-500">Occupancy</span><br/><b>{selectedBus.occupancy_tier || 'unknown'}</b></div>
                      <div><span className="text-gray-500">Off-Corridor</span><br/><b>{selectedBus.cross_track_km !== undefined ? `${(selectedBus.cross_track_km * 1000).toFixed(0)}m` : '—'}</b></div>
                      <div><span className="text-gray-500">Corridor Snapped</span><br/><b>{selectedBus.snapped_to_corridor ? '✅ Yes' : '❌ No'}</b></div>
                      <div><span className="text-gray-500">GPS Coordinates</span><br/><b>{selectedBus.lat?.toFixed(5) || '—'}, {selectedBus.lng?.toFixed(5) || '—'}</b></div>
                      <div><span className="text-gray-500">Trip Duration</span><br/><b>{selectedBus.startedAt ? `${Math.round((Date.now() - selectedBus.startedAt) / 60000)} min` : '—'}</b></div>
                      <div><span className="text-gray-500">BLE Devices</span><br/><b>{selectedBus.ble_count ?? '—'}</b></div>
                      <div><span className="text-gray-500">Anomaly Counter</span><br/><b>{selectedBus.anomaly_counter || 0}</b></div>
                    </div>
                  </Card>
                )}

              </div>
            </TabPanel>

            {/* Tab 2: Simulator Bots */}
            <TabPanel>
              <Card className="bg-white shadow-sm border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-gray-900 text-sm">Multi-Bus Edge Simulator</h3>
                    <p className="text-xs text-gray-500">Control synthetic GPS, dead-zones, detours, and BLE beacons.</p>
                  </div>
                </div>
                <SimulatorPanel />
              </Card>
            </TabPanel>

            {/* Tab 3: Driver Leaderboard */}
            <TabPanel>
              <Card className="bg-white shadow-sm border-gray-200">
                <h3 className="font-bold text-gray-900 mb-3 text-sm">Monthly Driver Punctuality & Score</h3>
                <div className="divide-y divide-gray-100">
                  {adminDrivers.map((d) => (
                    <div key={d.rank} className="py-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center font-bold text-xs">
                          {d.rank === 1 ? '🥇' : d.rank === 2 ? '🥈' : `#${d.rank}`}
                        </span>
                        <div>
                          <div className="font-bold text-sm text-gray-900">{d.name}</div>
                          <div className="text-xs text-gray-500">Route: {d.busId}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-black text-sm text-emerald-600">{d.onTimePercent}% On-Time</div>
                        <div className="text-xs text-gray-400">{d.score} pts</div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </TabPanel>

            {/* Tab 4: GTFS-RT Feeds */}
            <TabPanel>
              <Card className="bg-white shadow-sm border-gray-200 flex flex-col gap-4">
                <h3 className="font-bold text-gray-900 text-sm">Open GTFS-Realtime v2.0 Endpoints</h3>
                <p className="text-xs text-gray-500">
                  Standardized feeds consumed by Google Maps, OpenTripPlanner, and municipal command centers.
                </p>
                <div className="space-y-2 text-xs font-mono">
                  <div className="p-3 bg-gray-50 rounded-lg border flex justify-between items-center">
                    <span>GET /api/gtfs-rt/vehicle-positions</span>
                    <a href="/api/gtfs-rt/vehicle-positions" target="_blank" className="text-blue-600 font-bold">Open JSON</a>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg border flex justify-between items-center">
                    <span>GET /api/gtfs-rt/trip-updates</span>
                    <a href="/api/gtfs-rt/trip-updates" target="_blank" className="text-blue-600 font-bold">Open JSON</a>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg border flex justify-between items-center">
                    <span>GET /api/gtfs-rt/alerts</span>
                    <a href="/api/gtfs-rt/alerts" target="_blank" className="text-blue-600 font-bold">Open JSON</a>
                  </div>
                </div>
              </Card>
            </TabPanel>
          </TabPanels>
        </TabGroup>
      </main>
    </div>
  );
}
