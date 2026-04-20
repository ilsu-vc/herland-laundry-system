import { useState, useEffect } from 'react';
import { useToast } from './Toast';

// Only 2 time slots per day: Morning and Afternoon
const TIME_SLOTS = [
  { value: '08:30', label: 'Morning (8:30 AM)', period: 'AM' },
  { value: '13:00', label: 'Afternoon (1:00 PM)', period: 'PM' },
];

export default function BookingCalendar({ selectedDate, onDateChange, selectedTime, onTimeChange }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [bookedSlots, setBookedSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    const fetchBookedSlots = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/customer/booked-slots`);
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

  // Parse a YYYY-MM-DD string as local date (avoids UTC-offset shift)
  const parseLocalDate = (dateStr) => {
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d);
  };

  const isSelectedDate = (day) => {
    if (!selectedDate) return false;
    const date = parseLocalDate(selectedDate);
    return (
      date.getDate() === day &&
      date.getMonth() === currentMonth.getMonth() &&
      date.getFullYear() === currentMonth.getFullYear()
    );
  };

  const formatDate = (day) =>
    `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  const getBookingCount = (day, timeValue) => {
    const formattedDate = formatDate(day);
    const slot = bookedSlots.find(s => s.date === formattedDate && s.time === timeValue);
    return slot ? slot.count : 0;
  };

  const isSlotFullyBooked = (day, timeValue) => getBookingCount(day, timeValue) >= 8;

  // A date has *any* bookings (used for the light blue dot indicator)
  const hasBookingsOnDate = (day) => {
    const formattedDate = formatDate(day);
    return bookedSlots.some(slot => slot.date === formattedDate);
  };

  const handleDateClick = (day) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const clicked = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    if (clicked < today) return;
    onDateChange(formatDate(day));
    // Clear time selection when date changes
    onTimeChange('');
  };

  // Check if a time slot is in the past for today
  const isSlotPast = (timeValue) => {
    if (!selectedDate) return false;
    const today = new Date();
    const sel = parseLocalDate(selectedDate);
    const isSameDay =
      sel.getFullYear() === today.getFullYear() &&
      sel.getMonth() === today.getMonth() &&
      sel.getDate() === today.getDate();
    if (!isSameDay) return false;
    const slotHour = parseInt(timeValue.split(':')[0], 10);
    return slotHour <= today.getHours();
  };

  const renderCalendar = () => {
    const totalDays = daysInMonth(currentMonth);
    const startDay = firstDayOfMonth(currentMonth);
    const days = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < startDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-10 w-full" />);
    }

    for (let d = 1; d <= totalDays; d++) {
      const selected = isSelectedDate(d);
      const dateObj = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), d);
      const isPast = dateObj < today;

      days.push(
        <button
          key={d}
          disabled={isPast}
          onClick={() => handleDateClick(d)}
          className={`h-10 w-full rounded-md flex items-center justify-center text-sm font-medium transition-colors ${
            selected
              ? 'bg-[#3878c2] text-white'
              : isPast
              ? 'text-gray-300 cursor-not-allowed'
              : 'hover:bg-gray-100 text-gray-700'
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

      {/* Day headers */}
      <div className="bg-gray-100 grid grid-cols-7 gap-1 px-2 py-2">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
          <div key={day} className="text-center text-[10px] font-bold text-gray-500 uppercase">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1 p-2">
        {renderCalendar()}
      </div>

      {/* Time slot selector */}
      <div className="border-t border-gray-100 p-4">
        {selectedDate ? (
          <div className="space-y-3">
            <label className="block text-xs font-bold text-[#3878c2] uppercase mb-2">
              Select Time Slot
            </label>

            <div className="grid grid-cols-2 gap-3">
              {TIME_SLOTS.map(slot => {
                const fullyBooked = isSlotFullyBooked(
                  parseLocalDate(selectedDate).getDate(),
                  slot.value
                );
                const past = isSlotPast(slot.value);
                const disabled = fullyBooked || past;
                const isSelected = selectedTime === slot.value;

                return (
                  <button
                    key={slot.value}
                    disabled={disabled}
                    onClick={() => onTimeChange(isSelected ? '' : slot.value)}
                    className={`
                      relative flex flex-col items-center justify-center gap-1
                      py-4 px-3 rounded-xl border-2 font-semibold text-sm
                      transition-all duration-150
                      ${
                        disabled
                          ? 'opacity-40 cursor-not-allowed border-gray-200 bg-gray-50 text-gray-400'
                          : isSelected
                          ? 'border-[#3878c2] bg-[#3878c2] text-white shadow-md'
                          : 'border-[#3878c2]/30 bg-white text-[#3878c2] hover:border-[#3878c2] hover:bg-[#3878c2]/5'
                      }
                    `}
                  >
                    {/* Sun / Moon icon */}
                    <span className="text-xl">
                      {slot.period === 'AM' ? '🌤️' : '🌇'}
                    </span>
                    <span className="text-xs font-bold">
                      {slot.period === 'AM' ? 'Morning' : 'Afternoon'}
                    </span>
                    <span className="text-[10px] opacity-75">
                      {slot.period === 'AM' ? '8:30 AM' : '1:00 PM'}
                    </span>
                    {fullyBooked && (
                      <span className="absolute top-1.5 right-2 text-[9px] font-bold text-red-400 uppercase">
                        Full
                      </span>
                    )}
                    {past && !fullyBooked && (
                      <span className="absolute top-1.5 right-2 text-[9px] font-bold text-gray-400 uppercase">
                        Passed
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {selectedTime && (
              <div className="p-3 bg-[#3878c2]/5 rounded-lg border border-[#3878c2]/10 flex items-center justify-between">
                <span className="text-xs font-semibold text-[#3878c2]">
                  Selected: {TIME_SLOTS.find(s => s.value === selectedTime)?.label}
                </span>
                <button
                  onClick={() => onTimeChange('')}
                  className="text-[10px] font-bold text-red-400 uppercase"
                >
                  Clear
                </button>
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
