import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useBusStore } from '@/store/useBusStore';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import { ArrowLeft, MapPin, ChatCircleText, PhoneCall } from '@phosphor-icons/react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import LanguageToggle from '@/components/shared/LanguageToggle';
import ETABox from '@/components/shared/ETABox';
import StatusBadge from '@/components/shared/StatusBadge';
import CheckinButton from '@/components/shared/CheckinButton';
import FollowButton from '@/components/shared/FollowButton';
import { getBusMarkerIcon } from '@/components/shared/BusMarker';
import { useTranslation } from 'react-i18next';

// Modals & Banner
import SMSModal from '@/components/shared/SMSModal';
import IVRModal from '@/components/shared/IVRModal';
import FallbackBanner from '@/components/shared/FallbackBanner';

export default function LiveMap() {
  const { routeId } = useParams();
  const navigate = useNavigate();
  const { routes, selectedLanguage, setLanguage } = useBusStore();
  const [following, setFollowing] = useState(true);
  const { t } = useTranslation();
  
  // New States
  const [smsOpen, setSmsOpen] = useState(false);
  const [ivrOpen, setIvrOpen] = useState(false);
  const [fallbackMode, setFallbackMode] = useState(null); // null | "scheduled" | "crowd_restored"
  
  const route = routes.find(r => r.id === routeId) || {
    name: 'Unknown Route',
    code: '??',
    status: 'offline'
  };

  const center = [30.5, 76.5];
  
  // Hardcoded values for ETA simulation
  const mockEta = { min: 8, max: 13 };
  const mockStop = "Bhagwan Chowk";

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 font-sans max-w-md mx-auto sm:border-x sm:border-gray-200 pb-40">
      {/* Top Bar */}
      <header className="px-4 py-3 flex items-center justify-between bg-white shadow-sm z-50 sticky top-0">
        <button onClick={() => navigate('/')} className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors" aria-label="Go back">
          <ArrowLeft size={24} className="text-gray-700" />
        </button>
        <div className="flex flex-col items-center flex-1">
          <h1 className="text-lg font-bold text-gray-900 leading-tight">{route.code}</h1>
          <span className="text-xs font-medium text-gray-500 leading-tight">{route.name}</span>
        </div>
        <LanguageToggle currentLang={selectedLanguage} onChange={setLanguage} />
      </header>
      
      <FallbackBanner visible={fallbackMode !== null} mode={fallbackMode} />

      <main className="flex flex-col flex-1">
        <section className="px-4 py-4 flex flex-col gap-3 bg-white z-10 shadow-sm relative">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-800">{t('current_status')}</h2>
            <StatusBadge status={fallbackMode || route.status} />
          </div>
          <ETABox min={mockEta.min} max={mockEta.max} confidence={fallbackMode === 'scheduled' ? 40 : 92} source="Live GPS" lastUpdateSeconds={12} />
        </section>

        <section className="relative w-full h-[360px] flex-shrink-0 z-0 bg-gray-200">
          <MapContainer center={center} zoom={14} scrollWheelZoom={false} className="w-full h-full z-0" zoomControl={false}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={center} icon={getBusMarkerIcon(fallbackMode || 'live', 180)} />
          </MapContainer>
          
          <div className="absolute bottom-4 right-4 z-[400]">
            <FollowButton active={following} onToggle={() => setFollowing(!following)} />
          </div>
        </section>

        <section className="px-4 py-4 z-10">
          <Card className="shadow-md bg-white border-none rounded-xl overflow-hidden">
            <CardContent className="p-5 flex flex-col gap-5">
              <h3 className="font-bold text-gray-800">{t('upcoming_stops')}</h3>
              
              <div className="flex flex-col gap-4 relative">
                <div className="absolute left-2.5 top-3 bottom-3 w-[2px] bg-gray-200 z-0"></div>
                
                <div className="flex items-start gap-4 relative z-10">
                  <div className="bg-white rounded-full p-0.5 mt-0.5">
                    <MapPin size={20} className="text-primary" weight="fill" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-semibold text-gray-900">{mockStop}</span>
                    <span className="text-sm text-gray-500">({t('min_range', { min: mockEta.min, max: mockEta.max })})</span>
                  </div>
                </div>
                
                <div className="flex items-start gap-4 relative z-10">
                  <div className="bg-white rounded-full p-0.5 mt-0.5">
                    <MapPin size={20} className="text-gray-400" weight="fill" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-semibold text-gray-900">Railway Station</span>
                    <span className="text-sm text-gray-500">({t('min_range', { min: 14, max: 18 })})</span>
                  </div>
                </div>
                
                <div className="flex items-start gap-4 relative z-10">
                  <div className="bg-white rounded-full p-0.5 mt-0.5">
                    <MapPin size={20} className="text-gray-400" weight="fill" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-semibold text-gray-900">Dagru Village</span>
                    <span className="text-sm text-gray-500">({t('min_range', { min: 20, max: 25 })})</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>

      <div className="px-4 py-4 flex flex-col items-center gap-2 mt-4 opacity-50 hover:opacity-100 transition-opacity">
        <span className="text-xs font-bold text-gray-500">DEV CONTROLS (Demo degraded states)</span>
        <div className="flex gap-2 flex-wrap justify-center">
          <button onClick={() => setFallbackMode(null)} className="text-xs px-3 py-1 bg-gray-200 rounded">Simulate: Live</button>
          <button onClick={() => setFallbackMode('scheduled')} className="text-xs px-3 py-1 bg-amber-200 rounded text-amber-800">Simulate: Fallback</button>
          <button onClick={() => setFallbackMode('crowd_restored')} className="text-xs px-3 py-1 bg-blue-200 rounded text-blue-800">Simulate: Crowd-Restored</button>
        </div>
      </div>

      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md px-4 py-4 bg-white border-t border-gray-200 shadow-[0_-4px_12px_rgba(0,0,0,0.05)] z-50 flex items-center justify-between gap-3">
        <CheckinButton busId={routeId} onCheckin={() => console.log('Checked in')} pendingCount={1} />
        
        <div className="flex flex-1 gap-2 h-14">
          <Button onClick={() => setSmsOpen(true)} variant="secondary" className="flex-1 rounded-full flex items-center justify-center gap-2 h-full font-semibold text-[15px]">
            <ChatCircleText size={20} weight="bold" />
            {t('sms_alert')}
          </Button>
          <Button onClick={() => setIvrOpen(true)} variant="secondary" className="w-14 rounded-full flex items-center justify-center h-full px-0" aria-label="Listen to voice ETA">
            <PhoneCall size={22} weight="bold" />
          </Button>
        </div>
      </div>
      
      <SMSModal open={smsOpen} onClose={() => setSmsOpen(false)} eta={mockEta} stopName={mockStop} />
      <IVRModal open={ivrOpen} onClose={() => setIvrOpen(false)} eta={mockEta} language={selectedLanguage} />
    </div>
  );
}
