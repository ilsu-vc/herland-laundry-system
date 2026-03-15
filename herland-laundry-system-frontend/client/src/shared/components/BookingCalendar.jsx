import { useState, useEffect } from 'react';
import { useToast } from './Toast';

const TIME_SLOTS = [
  '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', 
  '14:00', '15:00', '16:00'
];

const formatTimeLabel = (timeStr) => {
  const [hours] = timeStr.split(':');
  const h = parseInt(hours);
  const ampm = h >= 12 ? 'pm' : 'am';
  const displayH = h % 12 || 12;
  const endH = (h + 1) % 24;
  const endAmpm = endH >= 12 ? 'pm' : 'am';
  const displayEndH = endH % 12 || 12;
  return `${displayH}:00 ${ampm} - ${displayEndH}:00 ${endAmpm}`;
};

export default function BookingCalendar({ selectedDate, onDateChange, selectedTime, onTimeChange }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [bookedSlots, setBookedSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [customTime, setCustomTime] = useState('');
  const [ampm, setAmpm] = useState('AM');
  const { showToast } = useToast();

  useEffect(() => {
    const fetchBookedSlots = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/v1/customer/booked-slots');
        if (response.ok) {
          const data = await response.json();
          setBookedSlots(data);
        }
      } catch (err) {
        console.error('Error fetching booked slots:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchBookedSlots();
  }, []);

  const daysInMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));

  const isSelectedDate = (day) => {
    if (!selectedDate) return false;
    const date = new Date(selectedDate);
    return date.getDate() === day && date.getMonth() === currentMonth.getMonth() && date.getFullYear() === currentMonth.getFullYear();
  };

  const getBookingCount = (day, time) => {
    const formattedDate = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const slot = bookedSlots.find(s => s.date === formattedDate && s.time === time);
    return slot ? slot.count : 0;
  };

  const isBooked = (day, time) => {
    return getBookingCount(day, time) >= 8;
  };

  const hasBookingsOnDate = (day) => {
    const formattedDate = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return bookedSlots.some(slot => slot.date === formattedDate);
  };

  const handleDateClick = (day) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const clickedDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    if (clickedDate < today) return;

    const formattedDate = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    onDateChange(formattedDate);
  };

  const handleCustomTimeBlur = () => {
    if (!customTime) return;
    
    // Parse input (like "9:30" or "9")
    let [hours, minutes] = customTime.split(':').map(val => parseInt(val) || 0);
    if (isNaN(hours)) return;

    // Convert to 24h format based on AM/PM
    if (ampm === 'PM' && hours < 12) hours += 12;
    if (ampm === 'AM' && hours === 12) hours = 0;

    // Nearest hour logic: if minutes >= 30, round up, else round down
    // But since the shop hours are blocks (e.g., 9:00 - 10:00), we usually snap to the start of the hour.
    // User said: "9:30 --> it will be 9:00 - 10:00"
    // This implies snapping to the HOUR start.
    
    const snapHour = hours;
    const formattedHour = String(snapHour).padStart(2, '0') + ':00';
    
    if (TIME_SLOTS.includes(formattedHour)) {
      onTimeChange(formattedHour);
    } else {
      showToast("Please enter a time within operating hours (8:00 AM - 4:00 PM).", "error");
    }
  };

  const renderCalendar = () => {
    const totalDays = daysInMonth(currentMonth);
    const startDay = firstDayOfMonth(currentMonth);
    const days = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < startDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-10 w-full"></div>);
    }

    for (let d = 1; d <= totalDays; d++) {
      const selected = isSelectedDate(d);
      const booked = hasBookingsOnDate(d);
      const dateObj = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), d);
      const isPast = dateObj < today;
      
      days.push(
        <button
          key={d}
          disabled={isPast}
          onClick={() => handleDateClick(d)}
          className={`h-10 w-full rounded-md flex items-center justify-center text-sm font-medium transition-colors ${
            selected ? 'bg-[#3878c2] text-white' : 
            isPast ? 'text-gray-300 cursor-not-allowed' :
            booked ? 'bg-[#3878c2]/20 text-[#3878c2]' : 
            'hover:bg-gray-100 text-gray-700'
          }`}
        >
          {d}
        </button>
      );
    }

    return days;
  };

  return (
    <div className="w-full max-w-md bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
      {/* Calendar Header */}
      <div className="bg-black text-white px-4 py-3 flex items-center justify-between">
        <button onClick={prevMonth} className="p-1 hover:bg-white/10 rounded transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="size-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
        </button>
        <h3 className="font-bold uppercase tracking-widest text-sm">
          {currentMonth.toLocaleString('default', { month: 'long' })} {currentMonth.getFullYear()}
        </h3>
        <button onClick={nextMonth} className="p-1 hover:bg-white/10 rounded transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="size-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
          </svg>
        </button>
      </div>

      <div className="bg-gray-100 grid grid-cols-7 gap-1 px-2 py-2">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
          <div key={day} className="text-center text-[10px] font-bold text-gray-500 uppercase">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1 p-2">
        {renderCalendar()}
      </div>

      <div className="border-t border-gray-100 p-4 space-y-4">
        {selectedDate ? (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#3878c2] uppercase mb-2">Select Time Slot</label>
              <select 
                value={selectedTime}
                onChange={(e) => onTimeChange(e.target.value)}
                className="w-full p-2.5 text-sm border border-gray-200 rounded-lg text-[#3878c2] bg-white focus:outline-none focus:ring-1 focus:ring-[#3878c2]"
              >
                <option value="">Choose a schedule...</option>
                {TIME_SLOTS.map(time => {
                  const day = new Date(selectedDate).getDate();
                  const count = getBookingCount(day, time);
                  const booked = count >= 8;
                  
                  const today = new Date();
                  const selected = new Date(selectedDate);
                  let past = false;
                  if (
                    selected.getFullYear() === today.getFullYear() &&
                    selected.getMonth() === today.getMonth() &&
                    selected.getDate() === today.getDate()
                  ) {
                    const hour = parseInt(time.split(':')[0], 10);
                    if (hour <= today.getHours()) {
                      past = true;
                    }
                  }
                  
                  const disabled = booked || past;

                  return (
                    <option key={time} value={time} disabled={disabled}>
                      {formatTimeLabel(time)} {booked ? '(Fully Booked)' : past ? '(Unavailable)' : ''}
                    </option>
                  );
                })}
              </select>
            </div>

            {selectedTime && (
              <div className="p-3 bg-[#3878c2]/5 rounded-lg border border-[#3878c2]/10 flex items-center justify-between">
                <span className="text-xs font-semibold text-[#3878c2]">Selected: {formatTimeLabel(selectedTime)}</span>
                <button onClick={() => onTimeChange('')} className="text-[10px] font-bold text-red-400 uppercase">Clear</button>
              </div>
            )}
          </div>
        ) : (
          <div className="py-8 text-center bg-gray-50 rounded-lg text-gray-400 text-sm font-medium">
            Please Pick a Date
          </div>
        )}
      </div>
    </div>
  );
}
