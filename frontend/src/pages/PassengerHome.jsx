import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBusStore } from '@/store/useBusStore';
import { Bus, MagnifyingGlass, ChatCircleText } from '@phosphor-icons/react';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import StatusBadge from '@/components/shared/StatusBadge';
import LanguageToggle from '@/components/shared/LanguageToggle';
import { useTranslation } from 'react-i18next';

export default function PassengerHome() {
  const navigate = useNavigate();
  const { routes, selectedLanguage, setLanguage } = useBusStore();
  const [searchQuery, setSearchQuery] = useState('');
  const { t } = useTranslation();

  const filteredRoutes = routes.filter((r) => {
    const q = searchQuery.toLowerCase();
    return r.name.toLowerCase().includes(q) || r.code.toLowerCase().includes(q);
  });

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 text-gray-900 font-sans mx-auto max-w-md sm:border-x sm:border-gray-200">
      <header className="px-4 py-5 flex items-center gap-2 bg-white shadow-sm z-10 sticky top-0">
        <Bus size={28} weight="fill" className="text-primary" />
        <h1 className="text-[24px] font-[700] tracking-tight">{t('app_title')}</h1>
      </header>

      <main className="flex-1 px-4 py-6 flex flex-col gap-6">
        <div className="relative">
          <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <Input 
            type="text"
            placeholder={t('search_placeholder')}
            className="pl-10 h-12 rounded-xl text-base bg-white shadow-sm border-gray-200"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-3">
          {filteredRoutes.map((route) => (
            <Card 
              key={route.id} 
              className="cursor-pointer hover:border-primary/50 transition-colors shadow-sm bg-white"
              onClick={() => navigate(`/map/${route.id}`)}
            >
              <CardContent className="p-4 flex flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-lg">{route.code}</span>
                    <span className="text-gray-700 font-medium">{route.name}</span>
                  </div>
                  <StatusBadge status={route.status} />
                </div>
                
                <div className="flex flex-col">
                  <span className="text-xl font-extrabold">{t('min_range', { min: route.etaMin, max: route.etaMax })}</span>
                  <span className="text-sm text-gray-500">{t('confidence_label', { confidence: route.confidence })}</span>
                </div>
              </CardContent>
            </Card>
          ))}
          {filteredRoutes.length === 0 && (
            <div className="text-center text-gray-500 py-8">
              {t('no_routes_found')}
            </div>
          )}
        </div>
      </main>

      <footer className="px-4 py-4 bg-white border-t border-gray-200 flex items-center justify-between sticky bottom-0 z-10">
        <Button variant="secondary" className="rounded-full flex items-center gap-2">
          <ChatCircleText size={20} />
          {t('get_sms_alert')}
        </Button>
        <LanguageToggle currentLang={selectedLanguage} onChange={setLanguage} />
      </footer>
    </div>
  );
}
