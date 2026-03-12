import { useState, useEffect } from 'react';

const TIME_SLOTS = [
  '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', 
  '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', 
  '20:00', '21:00', '22:00', '23:00'
];

const formatTimeLabel = (timeStr) => {
  const [hours, minutes] = timeStr.split(':');
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
    const formattedDate = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    onDateChange(formattedDate);
  };

  const renderCalendar = () => {
    const totalDays = daysInMonth(currentMonth);
    const startDay = firstDayOfMonth(currentMonth);
    const days = [];

    // Empty slots for previous month days
    for (let i = 0; i < startDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-10 w-full"></div>);
    }

    // Actual days
    for (let d = 1; d <= totalDays; d++) {
      const selected = isSelectedDate(d);
      const booked = hasBookingsOnDate(d);
      
      days.push(
        <button
          key={d}
          onClick={() => handleDateClick(d)}
          className={`h-10 w-full rounded-md flex items-center justify-center text-sm font-medium transition-colors ${
            selected ? 'bg-[#3878c2] text-white' : 
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

      {/* Week Header */}
      <div className="bg-gray-100 grid grid-cols-7 gap-1 px-2 py-2">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
          <div key={day} className="text-center text-[10px] font-bold text-gray-500 uppercase">
            {day}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-1 p-2">
        {renderCalendar()}
      </div>

      {/* Time Slots Section */}
      <div className="border-t border-gray-100 p-4 space-y-4">
        {selectedDate ? (
          <>
            <div className="grid grid-cols-2 gap-2">
              {TIME_SLOTS.map(time => {
                const day = new Date(selectedDate).getDate();
                const count = getBookingCount(day, time);
                const booked = count >= 8;
                const active = selectedTime === time;
                const remaining = 8 - count;
                
                return (
                  <button
                    key={time}
                    disabled={booked}
                    onClick={() => onTimeChange(time)}
                    className={`px-3 py-2 text-[10px] font-medium border rounded-md transition-all ${
                      active ? 'bg-[#3878c2] border-[#3878c2] text-white shadow-sm' : 
                      booked ? 'bg-gray-100 text-gray-300 border-gray-200 cursor-not-allowed' :
                      'bg-white border-gray-200 text-gray-600 hover:border-[#3878c2] hover:text-[#3878c2]'
                    }`}
                  >
                    <div className="flex flex-col items-center">
                      <span>{formatTimeLabel(time)}</span>
                      {booked ? (
                        <span className="text-[8px] font-bold text-red-500">FULLY BOOKED</span>
                      ) : count >= 5 ? (
                        <span className="text-[8px] font-bold text-orange-500">{remaining} SLOTS LEFT</span>
                      ) : null}
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        ) : (
          <div className="py-8 text-center bg-gray-50 rounded-lg text-gray-400 text-sm font-medium">
            Please Pick a Date
          </div>
        )}
      </div>
    </div>
  );
}
