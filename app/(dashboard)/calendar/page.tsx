import { createClient } from '@/utils/supabase/server';
import { BookingCalendar } from '@/components/calendar/calendar-view';
import { BookingForm } from '@/components/calendar/booking-modal';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export default async function CalendarPage() {
  const supabase = await createClient();
  
  // Fetch kitchens for the dropdown/filter
  const { data: kitchens } = await supabase
    .from('kitchens')
    .select('*')
    .order('name');

  // Fetch initial bookings
  const { data: bookings } = await supabase
    .from('bookings')
    .select('*, profiles(company_name)');

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Kitchen Schedule</h1>
        
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> New Booking
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reserve Kitchen Space</DialogTitle>
            </DialogHeader>
            {/* We pass the kitchens to the form for the dropdown */}
            <BookingForm kitchens={kitchens || []} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <BookingCalendar 
          initialEvents={bookings || []} 
          kitchens={kitchens || []} 
        />
      </div>
    </div>
  );
}