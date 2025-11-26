import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface DaySummary {
  date: string;
  arrival: string;
  departure: string;
  unpaidBreak: number;
  workedHours: number;
  workedMinutes: number;
  plusMinusHours: number;
  plusMinusMinutes: number;
  isHoliday: boolean;
  holidayName?: string;
}

interface MonthlySummaryProps {
  userId: string;
}

export const MonthlySummary = ({ userId }: MonthlySummaryProps) => {
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [summary, setSummary] = useState<DaySummary[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSummary = async () => {
    setLoading(true);
    
    const [year, monthNum] = month.split('-').map(Number);
    const daysInMonth = new Date(year, monthNum, 0).getDate();

    // Fetch work logs for the month
    const { data: logs, error: logsError } = await supabase
      .from('work_logs')
      .select('*')
      .eq('user_id', userId)
      .gte('date', `${year}-${String(monthNum).padStart(2, '0')}-01`)
      .lte('date', `${year}-${String(monthNum).padStart(2, '0')}-${daysInMonth}`)
      .order('date', { ascending: true });

    // Fetch holidays
    const { data: holidays } = await supabase
      .from('hungarian_holidays')
      .select('date, name')
      .gte('date', `${year}-${String(monthNum).padStart(2, '0')}-01`)
      .lte('date', `${year}-${String(monthNum).padStart(2, '0')}-${daysInMonth}`);

    if (logsError) {
      setLoading(false);
      return;
    }

    const holidayMap = new Map(holidays?.map(h => [h.date, h.name]) || []);
    const logMap = new Map(logs?.map(log => [log.date, log]) || []);
    
    const summaryData: DaySummary[] = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, monthNum - 1, day);
      const dayOfWeek = date.getDay();
      const dateStr = `${year}-${String(monthNum).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

      // Skip weekends
      if (dayOfWeek === 0 || dayOfWeek === 6) continue;

      const isHoliday = holidayMap.has(dateStr);
      const log = logMap.get(dateStr);

      if (log) {
        const arrival = parseTime(log.arrival_time);
        const departure = parseTime(log.departure_time);
        const diff = departure - arrival - (log.unpaid_break_minutes || 0);
        
        const workedHours = Math.floor(diff / 60);
        const workedMinutes = Math.abs(diff % 60);
        
        const plusMinus = diff - (8 * 60);
        const pmSign = plusMinus < 0 ? -1 : 1;
        const pmAbs = Math.abs(plusMinus);
        const plusMinusHours = Math.floor(pmAbs / 60) * pmSign;
        const plusMinusMinutes = pmAbs % 60;

        summaryData.push({
          date: dateStr,
          arrival: log.arrival_time,
          departure: log.departure_time,
          unpaidBreak: log.unpaid_break_minutes || 0,
          workedHours,
          workedMinutes,
          plusMinusHours,
          plusMinusMinutes,
          isHoliday,
          holidayName: holidayMap.get(dateStr),
        });
      } else if (!isHoliday) {
        // Workday without log entry
        summaryData.push({
          date: dateStr,
          arrival: '07:00',
          departure: '15:00',
          unpaidBreak: 20,
          workedHours: 7,
          workedMinutes: 40,
          plusMinusHours: 0,
          plusMinusMinutes: -20,
          isHoliday: false,
        });
      }
    }

    setSummary(summaryData);
    setLoading(false);
  };

  const parseTime = (timeStr: string): number => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  };

  useEffect(() => {
    fetchSummary();
  }, [month, userId]);

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Betöltés...</div>;
  }

  const totalPlusMinusMinutes = summary.reduce((acc, day) => {
    return acc + (day.plusMinusHours * 60 + (day.plusMinusHours < 0 ? -day.plusMinusMinutes : day.plusMinusMinutes));
  }, 0);

  const totalHours = Math.floor(Math.abs(totalPlusMinusMinutes) / 60);
  const totalMinutes = Math.abs(totalPlusMinusMinutes) % 60;
  const totalSign = totalPlusMinusMinutes < 0 ? '-' : '+';

  return (
    <div className="space-y-4">
      <div className="flex items-end gap-4">
        <div className="flex-1">
          <Label htmlFor="month">Hónap</Label>
          <Input
            id="month"
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="bg-secondary/50"
          />
        </div>
        <div className="text-right">
          <div className="text-sm text-muted-foreground">Összesen:</div>
          <div className={`text-lg font-bold ${totalPlusMinusMinutes >= 0 ? 'text-success' : 'text-destructive'}`}>
            {totalSign}{totalHours} óra {totalMinutes} perc
          </div>
        </div>
      </div>

      <ScrollArea className="h-[500px] rounded-md border border-border">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-muted/50">
              <TableHead>Dátum</TableHead>
              <TableHead>Érkezés</TableHead>
              <TableHead>Távozás</TableHead>
              <TableHead>Nem fiz. szünet</TableHead>
              <TableHead>Munkaóra</TableHead>
              <TableHead>Plusz/Mínusz</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {summary.map((day) => (
              <TableRow 
                key={day.date} 
                className={`hover:bg-muted/50 ${day.isHoliday ? 'bg-warning/10' : ''}`}
              >
                <TableCell>
                  {day.date}
                  {day.isHoliday && (
                    <div className="text-xs text-warning">{day.holidayName}</div>
                  )}
                </TableCell>
                <TableCell>{day.arrival}</TableCell>
                <TableCell>{day.departure}</TableCell>
                <TableCell>{day.unpaidBreak} perc</TableCell>
                <TableCell>{day.workedHours} óra {day.workedMinutes} perc</TableCell>
                <TableCell className={day.plusMinusHours < 0 || (day.plusMinusHours === 0 && day.plusMinusMinutes < 0) ? 'text-destructive' : 'text-success'}>
                  {day.plusMinusHours < 0 || (day.plusMinusHours === 0 && day.plusMinusMinutes < 0) ? '-' : ''}
                  {Math.abs(day.plusMinusHours)} óra {day.plusMinusMinutes} perc
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ScrollArea>
    </div>
  );
};
