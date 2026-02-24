import { useMemo, useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Carousel from "../../shared/navigation/Carousel";
import { ACTIVE_STATUSES, getStatusMeta } from "../../shared/components/StatusMeta";
import { supabase } from "../../lib/supabase";

const API_BASE = 'http://localhost:5000/api/v1/customer';

const carouselSlides = [
  {
    title: "WASH",
    description: "Fresh, clean, handled with care.",
    image:
      "https://images.unsplash.com/photo-1545173168-9f1947eebb7f?w=800&h=400&fit=crop",
    overlay: "#63bce6",
  },
  {
    title: "DRY",
    description: "Quick and gentle drying.",
    image:
      "https://images.unsplash.com/photo-1582735689369-4fe89db7114c?w=800&h=400&fit=crop",
    overlay: "#ffb850",
  },
  {
    title: "FOLD",
    description: "Neat, organized, ready to wear.",
    image:
      "https://images.unsplash.com/photo-1517677208171-0bc6725a3e60?w=800&h=400&fit=crop",
    overlay: "#ffde59",
  },
];

const mapBookingForUI = (b) => {
  const collection = b.collectionDetails || {};
  const option = b.collectionOption;
  
  // Decide what labels to show for "From" and "To" based on option
  let fromLabel = "Herland Laundry";
  let fromType = "Drop-off";
  let toLabel = "Herland Laundry";
  let toType = "Pick-up";

  if (option === 'dropOffDelivered') {
    fromType = "Drop-off";
    fromLabel = "Herland Laundry";
    toType = "Delivered";
    toLabel = collection.deliveryAddress || "Customer Address";
  } else if (option === 'pickedUpDelivered') {
    fromType = "Picked up";
    fromLabel = collection.pickupAddress || "Customer Address";
    toType = "Delivered";
    toLabel = collection.deliveryAddress || "Customer Address";
  }

  return {
    id: b.id,
    status: b.status || "BookingReceived",
    route: b.collectionOption || "Wash & Dry",
    from: { type: fromType, address: fromLabel },
    to: { type: toType, address: toLabel },
    date: b.date,
  };
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [userName, setUserName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setLoading(false);
        return;
      }

      const token = session.access_token;
      const user = session.user;

      // 1. Fetch Profile Name
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .maybeSingle();
      
      if (profile?.full_name) {
        setUserName(profile.full_name.split(' ')[0]); // Use first name
      } else if (user.email) {
        setUserName(user.email.split('@')[0]);
      }

      // 2. Fetch Bookings from API
      const response = await fetch(`${API_BASE}/my-bookings`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const mappedBookings = (data || []).map(mapBookingForUI);
        setBookings(mappedBookings);
      } else {
        console.error('Failed to fetch user bookings');
        setError("Could not load your bookings.");
      }
    } catch (err) {
      console.error('Error in dashboard fetch:', err);
      setError("An error occurred while loading content.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const activeBookings = useMemo(
    () => bookings.filter((b) => ACTIVE_STATUSES.includes(getStatusMeta(b.status).label.replace(/\s/g, ""))) || bookings,
    [bookings]
  );

  // Better approach for filtering based on ACTIVE_STATUSES - let's use the actual keys from StatusMeta
  const filteredActiveBookings = useMemo(() => {
    return bookings.filter(b => {
      const statusKey = b.status.replace(/\s+/g, '');
      return ACTIVE_STATUSES.includes(statusKey) || 
             ACTIVE_STATUSES.includes(b.status) || 
             ACTIVE_STATUSES.some(s => s.toLowerCase() === statusKey.toLowerCase());
    });
  }, [bookings]);

  return (
    <div className="min-h-screen bg-[#ffffff] px-4 py-6 sm:py-10">

      {/* Greeting + Carousel */}
      <div className="mx-auto w-full max-w-none">
        <h1 className="text-2xl font-semibold text-[#3878c2] mb-2">
          Hello {userName || 'User'} !
        </h1>
        <Carousel slides={carouselSlides} />
      </div>

      {/* Active Bookings Section */}
      <div className="mx-auto mt-8 w-full max-w-none">

        {/* Active Bookings Heading */}
        {!loading && filteredActiveBookings.length > 0 && (
          <h3 className="font-semibold text-[#3878c2] mb-2">
            Active Bookings ({filteredActiveBookings.length})
          </h3>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3878c2]"></div>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <p className="text-center text-amber-600 py-10">{error}</p>
        )}

        {/* No Active Bookings */}
        {!loading && !error && filteredActiveBookings.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center space-y-6 bg-white rounded-2xl py-10 px-6 shadow-sm border border-dashed border-gray-200">
            <img
              src="/images/WashingMachine.png"
              alt="Washing Machine"
              className="h-40 w-auto opacity-50"
              onError={(e) => { e.target.src = "https://cdn-icons-png.flaticon.com/512/2972/2972418.png"; }}
            />
            <p className="text-lg text-[#b4b4b4]">
              No active bookings at the moment.
            </p>
            <button 
              onClick={() => navigate('/book')}
              className="px-6 py-2 bg-[#3878c2] text-white rounded-full text-sm font-semibold hover:bg-[#2d609c] transition"
            >
              Book Now
            </button>
          </div>
        ) : !loading && !error && (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {filteredActiveBookings.map((booking) => {
              const statusMeta = getStatusMeta(booking.status);

              return (
                <button
                  key={booking.id}
                  type="button"
                  onClick={() =>
                    navigate(`/bookings/${encodeURIComponent(booking.id)}`)
                  }
                  className="relative w-full rounded-2xl border border-[#3878c2] bg-white text-left shadow-sm overflow-hidden transition hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#63bce6]/60 active:scale-[0.98]"
                >
                  {/* Left Status Color Strip */}
                  <div
                    className="absolute left-0 top-0 bottom-0 w-2"
                    style={{ backgroundColor: statusMeta.color }}
                  />

                  <div className="relative p-5 flex flex-col gap-3">

                    {/* Booking ID + Status */}
                    <div className="flex items-center justify-between gap-4">
                      <h2 className="text-sm font-semibold text-[#3878c2] break-all">
                        {booking.id}
                      </h2>
                      <span
                        className="flex-shrink-0 rounded-full px-3 py-1 text-xs font-semibold md:hidden"
                        style={{
                          color: statusMeta.color,
                          backgroundColor: `${statusMeta.color}22`,
                        }}
                      >
                        {statusMeta.label}
                      </span>
                    </div>

                    {/* Date + Status (tablet/desktop) */}
                    <div className="flex flex-col gap-4">
                      <p className="text-xs text-[#374151]">
                        Booking received on {booking.date}
                      </p>
                      <span
                        className="hidden w-fit rounded-full px-3 py-1 text-xs font-semibold md:inline-flex"
                        style={{
                          color: statusMeta.color,
                          backgroundColor: `${statusMeta.color}22`,
                        }}
                      >
                        {statusMeta.label}
                      </span>
                    </div>

                    {/* From / To */}
                    <div className="mt-5 flex flex-col gap-4">
                      <div>
                        <p className="text-sm font-semibold text-[#3878c2]">
                          {booking.from.type}
                        </p>
                        <p className="mt-1 text-sm text-[#374151]">
                          {booking.from.address}
                        </p>
                      </div>

                      <hr className="border-t border-[#3878c2] w-11/12 mx-auto" />

                      <div>
                        <p className="text-sm font-semibold text-[#3878c2]">
                          {booking.to.type}
                        </p>
                        <p className="mt-1 text-sm text-[#374151]">
                          {booking.to.address}
                        </p>
                      </div>
                    </div>

                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
