import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Stop, Warning, Trophy } from '@phosphor-icons/react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

export default function DriverDashboard() {
  const navigate = useNavigate();
  const [busId, setBusId] = useState('');
  const [tripActive, setTripActive] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [issueText, setIssueText] = useState('');

  useEffect(() => {
    const id = localStorage.getItem('busmitra_bus_id');
    if (!id) {
      navigate('/driver');
    } else {
      setBusId(id);
    }
  }, [navigate]);

  if (!busId) return null;

  const handleReportSubmit = () => {
    toast.success('Issue reported successfully.');
    setReportOpen(false);
    setIssueText('');
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 font-sans max-w-md mx-auto sm:border-x sm:border-gray-200">
      <header className="px-5 py-5 bg-white border-b border-gray-100 shadow-sm flex flex-col gap-1 sticky top-0 z-10">
        <h1 className="text-xl font-bold text-gray-900">Driver Dashboard</h1>
        <div className="flex justify-between items-center text-sm font-medium text-gray-500">
          <span>Rajesh Kumar</span>
          <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-700">{busId}</span>
        </div>
      </header>

      <main className="flex-1 p-5 flex flex-col gap-6">
        <Card className="shadow-sm">
          <CardContent className="p-5 flex flex-col gap-5">
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Select Route</label>
              <Select disabled={tripActive} defaultValue="m1">
                <SelectTrigger className="w-full h-[44px] text-base">
                  <SelectValue placeholder="Select a route" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="m1">M1: Moga → Dagru</SelectItem>
                  <SelectItem value="m2">M2: Railway → Civil Lines</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-3">
              <Button 
                onClick={() => setTripActive(true)}
                disabled={tripActive}
                className={`flex-1 min-h-[44px] h-12 text-base font-bold rounded-xl flex items-center justify-center gap-2 transition-all ${!tripActive ? 'bg-success hover:bg-success/90 text-white shadow-md' : 'bg-gray-100 text-gray-400'}`}
              >
                <Play weight="fill" size={20} />
                START TRIP
              </Button>
              <Button 
                onClick={() => setTripActive(false)}
                disabled={!tripActive}
                className={`flex-1 min-h-[44px] h-12 text-base font-bold rounded-xl flex items-center justify-center gap-2 transition-all ${tripActive ? 'bg-[#dc2626] hover:bg-[#dc2626]/90 text-white shadow-md' : 'bg-gray-100 text-gray-400'}`}
              >
                <Stop weight="fill" size={20} />
                END TRIP
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-amber-100 bg-amber-50/50">
          <CardContent className="p-5 flex flex-col items-center gap-3 text-center">
            <div className="bg-amber-100 p-3 rounded-full text-amber-600">
              <Trophy size={32} weight="fill" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">🏆 Your Score: 85 pts</h2>
              <p className="text-sm text-gray-600 font-medium">Rank: #3 of 12 drivers</p>
            </div>
            <Button variant="outline" className="mt-2 w-full border-amber-200 hover:bg-amber-100 hover:text-amber-800" onClick={() => navigate('/driver/leaderboard')}>
              View Leaderboard
            </Button>
          </CardContent>
        </Card>
      </main>

      <footer className="p-5 sticky bottom-0 z-10 bg-gray-50 pb-8">
        <Button variant="outline" className="w-full min-h-[44px] h-12 rounded-xl flex items-center justify-center gap-2 text-gray-600 border-gray-300 bg-white shadow-sm" onClick={() => setReportOpen(true)}>
          <Warning size={20} weight="bold" />
          Report Issue
        </Button>
      </footer>

      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent className="sm:max-w-md bg-white">
          <DialogHeader>
            <DialogTitle>Report an Issue</DialogTitle>
            <DialogDescription className="sr-only">Submit a driver issue report.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <Textarea 
              placeholder="Describe the issue (e.g. breakdown, traffic, etc.)" 
              className="min-h-[120px] resize-none"
              value={issueText}
              onChange={(e) => setIssueText(e.target.value)}
            />
            <Button onClick={handleReportSubmit} className="w-full h-[44px]">Submit</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
