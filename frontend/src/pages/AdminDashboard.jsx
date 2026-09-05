import React, { useState } from 'react';
import { Card, TabGroup, TabList, Tab, TabPanels, TabPanel, Text, Metric, Grid, Table, TableHead, TableRow, TableHeaderCell, TableBody, TableCell, ProgressBar, BarChart } from '@tremor/react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import { Download } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { getBusMarkerIcon } from '@/components/shared/BusMarker';

const adminDrivers = [
  { rank: 1, name: 'Sandeep Singh', busId: 'PB-10-A1', score: 1450, onTimePercent: 98 },
  { rank: 2, name: 'Gurpreet Kaur', busId: 'PB-08-B2', score: 1320, onTimePercent: 94 },
  { rank: 3, name: 'Rajesh Kumar', busId: 'PB-29-M1-101', score: 1150, onTimePercent: 88 },
  { rank: 4, name: 'Amit Sharma', busId: 'PB-04-C3', score: 980, onTimePercent: 75 },
  { rank: 5, name: 'Vikram Jit', busId: 'PB-11-D4', score: 850, onTimePercent: 60 },
  { rank: 6, name: 'Manish Goyal', busId: 'PB-65-E5', score: 800, onTimePercent: 55 },
  { rank: 7, name: 'Harjit Singh', busId: 'PB-21-F6', score: 750, onTimePercent: 50 },
  { rank: 8, name: 'Karanvir Singh', busId: 'PB-07-G7', score: 620, onTimePercent: 42 },
];

const mockBuses = [
  { id: 'b1', lat: 30.505, lng: 76.505, status: 'live', heading: 45 },
  { id: 'b2', lat: 30.495, lng: 76.490, status: 'scheduled', heading: 120 },
  { id: 'b3', lat: 30.510, lng: 76.515, status: 'live', heading: 270 },
  { id: 'b4', lat: 30.500, lng: 76.520, status: 'crowd_restored', heading: 330 },
  { id: 'b5', lat: 30.485, lng: 76.500, status: 'live', heading: 90 },
];

const analyticsData = [
  { route: 'M1', "Avg Delay (min)": 4.2 },
  { route: 'M2', "Avg Delay (min)": 6.8 },
  { route: 'M3', "Avg Delay (min)": 2.1 },
];

export default function AdminDashboard() {
  const getRankBadge = (rank) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  const handleExport = () => {
    toast.success('Export started (mock)');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans sm:px-6 lg:px-8 pb-12">
      <header className="px-4 py-6 bg-white border-b border-gray-200 shadow-sm sm:rounded-b-lg mb-6 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-sm text-gray-500 font-medium">System Overview</p>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-0">
        <TabGroup>
          <TabList className="mt-2 mb-6 bg-white p-1 rounded-lg border border-gray-200 w-max shadow-sm">
            <Tab className="px-6 py-2 hover:bg-gray-50 rounded-md transition-colors ui-selected:bg-gray-100 ui-selected:text-primary ui-selected:font-semibold">Fleet</Tab>
            <Tab className="px-6 py-2 hover:bg-gray-50 rounded-md transition-colors ui-selected:bg-gray-100 ui-selected:text-primary ui-selected:font-semibold">Leaderboard</Tab>
            <Tab className="px-6 py-2 hover:bg-gray-50 rounded-md transition-colors ui-selected:bg-gray-100 ui-selected:text-primary ui-selected:font-semibold">Analytics</Tab>
          </TabList>
          
          <TabPanels>
            {/* Tab 1: Fleet */}
            <TabPanel>
              <div className="flex flex-col gap-6">
                <Card className="p-0 overflow-hidden shadow-sm border-gray-200">
                  <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                    <h2 className="text-lg font-bold text-gray-800">Live Fleet Map</h2>
                  </div>
                  <div className="h-[400px] w-full bg-gray-100 relative z-0">
                    <MapContainer center={[30.5, 76.5]} zoom={13} scrollWheelZoom={false} className="w-full h-full z-0">
                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                      {mockBuses.map((bus) => (
                        <Marker key={bus.id} position={[bus.lat, bus.lng]} icon={getBusMarkerIcon(bus.status, bus.heading)} />
                      ))}
                    </MapContainer>
                  </div>
                </Card>

                <Grid numItemsSm={2} className="gap-6">
                  <Card decoration="top" decorationColor="emerald" className="shadow-sm">
                    <Text className="text-gray-500 font-medium">Buses Online</Text>
                    <Metric className="text-gray-900 font-bold mt-2">12</Metric>
                  </Card>
                  <Card decoration="top" decorationColor="gray" className="shadow-sm">
                    <Text className="text-gray-500 font-medium">Buses Offline</Text>
                    <Metric className="text-gray-900 font-bold mt-2">3</Metric>
                  </Card>
                </Grid>
              </div>
            </TabPanel>

            {/* Tab 2: Leaderboard */}
            <TabPanel>
              <Card className="p-0 overflow-hidden shadow-sm border-gray-200">
                <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                  <h2 className="text-lg font-bold text-gray-800">Driver Leaderboard</h2>
                </div>
                <div className="overflow-x-auto w-full scrollbar-hide">
                  <Table className="min-w-[600px]">
                    <TableHead>
                      <TableRow>
                        <TableHeaderCell className="w-16 text-center text-xs">Rank</TableHeaderCell>
                        <TableHeaderCell className="text-xs">Driver Name</TableHeaderCell>
                        <TableHeaderCell className="text-xs">Bus ID</TableHeaderCell>
                        <TableHeaderCell className="text-xs">Score</TableHeaderCell>
                        <TableHeaderCell className="w-48 text-xs">On-Time %</TableHeaderCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {adminDrivers.map((item) => (
                        <TableRow key={item.name} className="hover:bg-gray-50/50 transition-colors">
                          <TableCell className="text-center font-bold text-lg align-middle">
                            {getRankBadge(item.rank)}
                          </TableCell>
                          <TableCell className="align-middle font-semibold text-gray-800">
                            {item.name}
                          </TableCell>
                          <TableCell className="align-middle">
                            <span className="text-xs text-gray-500 font-mono bg-gray-100 px-2 py-1 rounded">
                              {item.busId}
                            </span>
                          </TableCell>
                          <TableCell className="align-middle">
                            <Text className="font-bold text-gray-700">{item.score}</Text>
                          </TableCell>
                          <TableCell className="align-middle">
                            <div className="flex items-center gap-3">
                              <ProgressBar value={item.onTimePercent} color={item.onTimePercent >= 90 ? 'emerald' : item.onTimePercent >= 75 ? 'amber' : 'red'} className="w-full h-2.5" />
                              <span className="text-sm font-medium w-9 text-gray-600">{item.onTimePercent}%</span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </Card>
            </TabPanel>

            {/* Tab 3: Analytics */}
            <TabPanel>
              <div className="flex flex-col gap-6">
                <Card className="shadow-sm border-gray-200">
                  <h3 className="text-lg font-bold text-gray-800 mb-6">Average Delay per Route</h3>
                  <BarChart
                    className="h-72 mt-4"
                    data={analyticsData}
                    index="route"
                    categories={["Avg Delay (min)"]}
                    colors={["blue"]}
                    valueFormatter={(number) => `${number} min`}
                    yAxisWidth={48}
                  />
                </Card>
                
                <Card className="shadow-sm border-gray-200 flex flex-col sm:flex-row items-center justify-between p-6 gap-4 bg-gray-50/30">
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">System Data Export</h3>
                    <p className="text-sm text-gray-500">Generate a GTFS-RT compliant feed of historical positions.</p>
                  </div>
                  <Button onClick={handleExport} className="w-full sm:w-auto flex items-center gap-2 h-11 px-6 rounded-xl font-semibold">
                    <Download size={20} weight="bold" />
                    Export GTFS-RT Feed
                  </Button>
                </Card>
              </div>
            </TabPanel>
          </TabPanels>
        </TabGroup>
      </main>
    </div>
  );
}
