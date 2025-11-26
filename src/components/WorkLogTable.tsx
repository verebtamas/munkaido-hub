import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';

interface WorkLog {
  id: string;
  date: string;
  arrival_time: string;
  departure_time: string;
  work_hours: number;
  unpaid_break_minutes: number;
  unpaid_applied: boolean;
}

interface WorkLogTableProps {
  userId: string;
}

export const WorkLogTable = ({ userId }: WorkLogTableProps) => {
  const [logs, setLogs] = useState<WorkLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('work_logs')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });

    if (!error && data) {
      setLogs(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLogs();

    // Set up realtime subscription
    const channel = supabase
      .channel('work_logs_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'work_logs',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          fetchLogs();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Betöltés...</div>;
  }

  if (logs.length === 0) {
    return <div className="text-center py-8 text-muted-foreground">Még nincs bejegyzés.</div>;
  }

  return (
    <ScrollArea className="h-[400px] rounded-md border border-border">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-muted/50">
            <TableHead>Dátum</TableHead>
            <TableHead>Érkezés</TableHead>
            <TableHead>Távozás</TableHead>
            <TableHead>Munkaóra</TableHead>
            <TableHead>Nem fiz. szünet</TableHead>
            <TableHead>Alkalmazva?</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.map((log) => (
            <TableRow key={log.id} className="hover:bg-muted/50">
              <TableCell>{log.date}</TableCell>
              <TableCell>{log.arrival_time}</TableCell>
              <TableCell>{log.departure_time}</TableCell>
              <TableCell>{log.work_hours.toFixed(2)} óra</TableCell>
              <TableCell>{log.unpaid_break_minutes} perc</TableCell>
              <TableCell>{log.unpaid_applied ? 'Igen' : 'Nem'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </ScrollArea>
  );
};
