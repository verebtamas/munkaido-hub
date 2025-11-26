import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface WorkStatisticsProps {
  userId: string;
}

interface MonthlyStats {
  month: string;
  totalHours: number;
  averageHours: number;
  workDays: number;
}

export const WorkStatistics = ({ userId }: WorkStatisticsProps) => {
  const [stats, setStats] = useState<MonthlyStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);

      // Fetch last 6 months of data
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const { data: logs, error } = await supabase
        .from('work_logs')
        .select('date, work_hours')
        .eq('user_id', userId)
        .gte('date', sixMonthsAgo.toISOString().split('T')[0])
        .order('date', { ascending: true });

      if (error || !logs) {
        setLoading(false);
        return;
      }

      // Group by month
      const monthlyData = new Map<string, { total: number; count: number }>();

      logs.forEach(log => {
        const month = log.date.substring(0, 7); // YYYY-MM
        const current = monthlyData.get(month) || { total: 0, count: 0 };
        monthlyData.set(month, {
          total: current.total + log.work_hours,
          count: current.count + 1,
        });
      });

      const statsData: MonthlyStats[] = Array.from(monthlyData.entries())
        .map(([month, data]) => ({
          month: formatMonth(month),
          totalHours: Math.round(data.total * 10) / 10,
          averageHours: Math.round((data.total / data.count) * 10) / 10,
          workDays: data.count,
        }))
        .sort((a, b) => a.month.localeCompare(b.month));

      setStats(statsData);
      setLoading(false);
    };

    fetchStats();
  }, [userId]);

  const formatMonth = (monthStr: string): string => {
    const [year, month] = monthStr.split('-');
    const monthNames = ['Jan', 'Feb', 'Már', 'Ápr', 'Máj', 'Jún', 'Júl', 'Aug', 'Szep', 'Okt', 'Nov', 'Dec'];
    return `${year} ${monthNames[parseInt(month) - 1]}`;
  };

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Betöltés...</div>;
  }

  if (stats.length === 0) {
    return <div className="text-center py-8 text-muted-foreground">Még nincs elegendő adat a statisztikákhoz.</div>;
  }

  const totalWorkDays = stats.reduce((sum, s) => sum + s.workDays, 0);
  const totalHours = stats.reduce((sum, s) => sum + s.totalHours, 0);
  const overallAverage = Math.round((totalHours / totalWorkDays) * 10) / 10;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 bg-secondary/30">
          <div className="text-sm text-muted-foreground">Összes munkanap</div>
          <div className="text-2xl font-bold text-foreground">{totalWorkDays}</div>
        </Card>
        <Card className="p-4 bg-secondary/30">
          <div className="text-sm text-muted-foreground">Összes munkaóra</div>
          <div className="text-2xl font-bold text-foreground">{Math.round(totalHours)} óra</div>
        </Card>
        <Card className="p-4 bg-secondary/30">
          <div className="text-sm text-muted-foreground">Átlagos napi munkaóra</div>
          <div className="text-2xl font-bold text-foreground">{overallAverage} óra</div>
        </Card>
      </div>

      <Card className="p-6 bg-secondary/20">
        <h3 className="text-lg font-semibold mb-4">Havi munkaórák</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={stats}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="month" 
              stroke="hsl(var(--muted-foreground))"
              style={{ fontSize: '0.875rem' }}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))"
              style={{ fontSize: '0.875rem' }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))', 
                border: '1px solid hsl(var(--border))',
                borderRadius: '0.5rem',
              }}
              labelStyle={{ color: 'hsl(var(--foreground))' }}
            />
            <Legend />
            <Bar 
              dataKey="totalHours" 
              fill="hsl(var(--primary))" 
              name="Összes óra"
              radius={[8, 8, 0, 0]}
            />
            <Bar 
              dataKey="averageHours" 
              fill="hsl(var(--success))" 
              name="Átlag óra/nap"
              radius={[8, 8, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
};
