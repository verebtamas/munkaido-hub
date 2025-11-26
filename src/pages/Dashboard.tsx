import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LogOut, Download } from 'lucide-react';
import { SeasonalAnimation } from '@/components/SeasonalAnimation';
import { HackerSignature } from '@/components/HackerSignature';
import { WorkLogForm } from '@/components/WorkLogForm';
import { WorkLogTable } from '@/components/WorkLogTable';
import { MonthlySummary } from '@/components/MonthlySummary';
import { WorkStatistics } from '@/components/WorkStatistics';
import { toast } from 'sonner';

export default function Dashboard() {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [userName, setUserName] = useState('');

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single()
        .then(({ data }) => {
          if (data) {
            setUserName(data.full_name || user.email || '');
          }
        });
    }
  }, [user]);

  const handleExportCSV = async () => {
    if (!user) return;

    const { data: logs, error } = await supabase
      .from('work_logs')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: true });

    if (error) {
      toast.error('Hiba történt az exportálás során');
      return;
    }

    if (!logs || logs.length === 0) {
      toast.error('Nincs exportálható adat');
      return;
    }

    const header = ['Dátum', 'Érkezés', 'Távozás', 'Munkaidő (óra)', 'Nem fizetett szünet (perc)', 'Alkalmazva?'];
    const csv = [header.join(';')].concat(
      logs.map(log => [
        log.date,
        log.arrival_time,
        log.departure_time,
        log.work_hours,
        log.unpaid_break_minutes,
        log.unpaid_applied ? 'Igen' : 'Nem'
      ].join(';'))
    ).join('\n');

    const BOM = "\uFEFF";
    const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `munkaido_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success('CSV exportálva!');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen relative">
      <SeasonalAnimation />
      
      <div className="relative z-10 container mx-auto px-4 py-8 max-w-7xl">
        <Card className="backdrop-blur-sm bg-card/95 border-border shadow-2xl p-6 mb-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-center md:text-left">
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Munkaidő Kalkulátor
              </h1>
              <HackerSignature />
              <p className="text-muted-foreground">Üdv, {userName}!</p>
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportCSV}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                CSV Export
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={signOut}
                className="gap-2"
              >
                <LogOut className="h-4 w-4" />
                Kijelentkezés
              </Button>
            </div>
          </div>
        </Card>

        <Tabs defaultValue="logs" className="space-y-6">
          <Card className="backdrop-blur-sm bg-card/95 border-border shadow-xl p-2">
            <TabsList className="grid w-full grid-cols-3 bg-secondary/50">
              <TabsTrigger value="logs">Napló</TabsTrigger>
              <TabsTrigger value="summary">Összesítés</TabsTrigger>
              <TabsTrigger value="stats">Statisztikák</TabsTrigger>
            </TabsList>
          </Card>

          <TabsContent value="logs" className="space-y-6">
            <Card className="backdrop-blur-sm bg-card/95 border-border shadow-xl p-6">
              <h2 className="text-xl font-semibold mb-4">Napi bejegyzés hozzáadása</h2>
              <WorkLogForm userId={user.id} />
            </Card>

            <Card className="backdrop-blur-sm bg-card/95 border-border shadow-xl p-6">
              <h2 className="text-xl font-semibold mb-4">Munkanapló</h2>
              <WorkLogTable userId={user.id} />
            </Card>
          </TabsContent>

          <TabsContent value="summary">
            <Card className="backdrop-blur-sm bg-card/95 border-border shadow-xl p-6">
              <h2 className="text-xl font-semibold mb-4">Havi összesítés</h2>
              <MonthlySummary userId={user.id} />
            </Card>
          </TabsContent>

          <TabsContent value="stats">
            <Card className="backdrop-blur-sm bg-card/95 border-border shadow-xl p-6">
              <h2 className="text-xl font-semibold mb-4">Statisztikák</h2>
              <WorkStatistics userId={user.id} />
            </Card>
          </TabsContent>
        </Tabs>

        <div className="text-center mt-8 text-sm text-muted-foreground">
          © 2025 verebtamas
        </div>
      </div>
    </div>
  );
}
