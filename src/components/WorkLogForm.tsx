import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';

interface WorkLogFormProps {
  userId: string;
  onSuccess?: () => void;
}

export const WorkLogForm = ({ userId, onSuccess }: WorkLogFormProps) => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [arrivalTime, setArrivalTime] = useState('07:00');
  const [workHours, setWorkHours] = useState('8');
  const [unpaidBreak, setUnpaidBreak] = useState('20');
  const [unpaidApplied, setUnpaidApplied] = useState('true');
  const [loading, setLoading] = useState(false);

  const calculateDepartureTime = (arrival: string, hours: string, breakMinutes: string, applied: string): string => {
    const [arrivalHour, arrivalMinute] = arrival.split(':').map(Number);
    const totalMinutes = arrivalHour * 60 + arrivalMinute + parseFloat(hours) * 60;
    const adjustedMinutes = applied === 'true' ? totalMinutes + parseInt(breakMinutes) : totalMinutes;
    
    const departureHour = Math.floor(adjustedMinutes / 60) % 24;
    const departureMinute = Math.floor(adjustedMinutes % 60);
    
    return `${String(departureHour).padStart(2, '0')}:${String(departureMinute).padStart(2, '0')}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const departureTime = calculateDepartureTime(arrivalTime, workHours, unpaidBreak, unpaidApplied);

    const { error } = await supabase
      .from('work_logs')
      .upsert({
        user_id: userId,
        date,
        arrival_time: arrivalTime,
        departure_time: departureTime,
        work_hours: parseFloat(workHours),
        unpaid_break_minutes: parseInt(unpaidBreak),
        unpaid_applied: unpaidApplied === 'true',
      }, {
        onConflict: 'user_id,date',
      });

    setLoading(false);

    if (error) {
      toast.error('Hiba történt a mentés során');
      console.error(error);
    } else {
      toast.success('Bejegyzés sikeresen mentve!');
      onSuccess?.();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div className="space-y-2">
        <Label htmlFor="date">Dátum</Label>
        <Input
          id="date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="bg-secondary/50"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="arrival">Érkezés</Label>
        <Input
          id="arrival"
          type="time"
          value={arrivalTime}
          onChange={(e) => setArrivalTime(e.target.value)}
          className="bg-secondary/50"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="workHours">Munkaidő (óra)</Label>
        <Input
          id="workHours"
          type="number"
          step="0.25"
          min="0"
          value={workHours}
          onChange={(e) => setWorkHours(e.target.value)}
          className="bg-secondary/50"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="unpaidBreak">Nem fizetett szünet (perc)</Label>
        <Input
          id="unpaidBreak"
          type="number"
          min="0"
          value={unpaidBreak}
          onChange={(e) => setUnpaidBreak(e.target.value)}
          className="bg-secondary/50"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="unpaidApplied">Nem fizetett szünet alkalmazva?</Label>
        <Select value={unpaidApplied} onValueChange={setUnpaidApplied}>
          <SelectTrigger className="bg-secondary/50">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="true">Igen</SelectItem>
            <SelectItem value="false">Nem</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-end">
        <Button type="submit" disabled={loading} className="w-full gap-2">
          <Plus className="h-4 w-4" />
          {loading ? 'Mentés...' : 'Hozzáadás / Frissítés'}
        </Button>
      </div>
    </form>
  );
};
