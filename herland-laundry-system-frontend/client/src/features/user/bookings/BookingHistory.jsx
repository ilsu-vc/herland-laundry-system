import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ACTIVE_STATUSES, PAST_STATUSES, getStatusMeta, getStatusKey } from "../../../shared/components/StatusMeta";
import { supabase } from "../../../lib/supabase";

const API_BASE = `${import.meta.env.VITE_API_URL}/api/v1/customer`;

const FILTERS = ["All", "Active", "Past"];

const COLLECTION_LABELS = {
  dropOffPickUpLater: "Drop-off & Pick up later",
  dropOffDelivered: "Drop-off & Delivered",
  pickedUpDelivered: "Picked up & Delivered",
};

const ROUTE_INFO = {
  dropOffPickUpLater: {
    from: { type: "Drop-off", address: "Herland Laundry" },
    to: { type: "Pick up later", address: "Herland Laundry" },
  },
  dropOffDelivered: {
    from: { type: "Drop-off", address: "Herland Laundry" },
    to: { type: "Delivered", address: "Customer address" },
  },
  pickedUpDelivered: {
    from: { type: "Picked up", address: "Customer address" },
    to: { type: "Delivered", address: "Customer address" },
  },
};

function mapBookingToCard(booking) {
  const option = booking.collectionOption || "dropOffPickUpLater";
  const routeInfo = ROUTE_INFO[option] || ROUTE_INFO.dropOffPickUpLater;
  const routeLabel = COLLECTION_LABELS[option] || "Drop-off & Pick up later";

  // Derive the status key from the latest timeline entry
  const latestStatus =
    booking.timeline && booking.timeline.length > 0
      ? booking.timeline[booking.timeline.length - 1].status
      : "Booking Received";

  return {
    id: booking.id,
    dbId: booking.dbId,
    status: getStatusKey(latestStatus),
    route: routeLabel,
    from: routeInfo.from,
    to: routeInfo.to,
    date: booking.date || "-",
  };
}

function getMonthYear(dateString) {
  if (!dateString || dateString === "-") return null;
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

export default function BookingHistory() {
  const [selectedFilter, setSelectedFilter] = useState("All");
  const [selectedMonth, setSelectedMonth] = useState("All Time");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const fetchBookings = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        setError("Please log in to view your bookings.");
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_BASE}/my-bookings`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setBookings(data.map(mapBookingToCard));
      } else {
        console.error("Failed to fetch bookings");
        setError("Could not load bookings.");
      }
    } catch (err) {
      console.error("Error fetching bookings:", err);
      setError("Could not connect to the server.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  // Extract unique months for the dropdown
  const availableMonths = useMemo(() => {
    const months = new Set();
    bookings.forEach(b => {
      const my = getMonthYear(b.date);
      if (my) months.add(my);
    });
    return ["All Time", ...Array.from(months).sort((a, b) => new Date(b) - new Date(a))];
  }, [bookings]);

  // Filter bookings based on selected filter and month
  const filteredBookings = useMemo(() => {
    return bookings.filter((booking) => {
      // 1. Status Filter
      if (selectedFilter === "Active" && !ACTIVE_STATUSES.includes(booking.status)) return false;
      if (selectedFilter === "Past" && !PAST_STATUSES.includes(booking.status)) return false;

      // 2. Month Filter
      if (selectedMonth !== "All Time") {
        const my = getMonthYear(booking.date);
        if (my !== selectedMonth) return false;
      }

      return true;
    });
  }, [bookings, selectedFilter, selectedMonth]);

  // Reset to page 1 if filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedFilter, selectedMonth]);

  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);
  const paginatedBookings = filteredBookings.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="min-h-screen bg-white px-4 py-6 sm:py-10">
      <div className="mx-auto w-full max-w-2xl md:max-w-5xl lg:max-w-6xl">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-[#3878c2]">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="inline-flex items-center"
              aria-label="Go back"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
              </svg>
            </button>
            <h1 className="text-2xl font-semibold">Booking History</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="rounded-full px-3 py-1.5 text-xs sm:px-4 sm:text-sm font-semibold border border-[#3878c2] text-[#3878c2] bg-white outline-none cursor-pointer"
            >
              {availableMonths.map(month => (
                <option key={month} value={month}>{month}</option>
              ))}
            </select>
            {FILTERS.map((filter) => {
              const isActive = filter === selectedFilter;
              return (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setSelectedFilter(filter)}
                  className={`rounded-full px-3 py-1.5 text-xs sm:px-4 sm:text-sm font-semibold transition ${
                    isActive
                      ? "bg-[#63bce6] text-white"
                      : "border border-[#3878c2] text-[#3878c2] hover:bg-[#63bce6]/20"
                  }`}
                >
                  {filter}
                </button>
              );
            })}
          </div>
        </header>

        {loading ? (
          <div className="flex min-h-[60vh] items-center justify-center">
            <p className="text-lg text-[#b4b4b4]">Loading bookings...</p>
          </div>
        ) : error ? (
          <div className="flex min-h-[60vh] flex-col items-center justify-center text-center space-y-6">
            <p className="text-lg text-[#e55353]">{error}</p>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="flex min-h-[60vh] flex-col items-center justify-center text-center space-y-6">
            <img
              src="/images/WashingMachine.png"
              alt="Washing Machine"
              className="h-48 w-auto"
            />
            <p className="text-lg text-[#b4b4b4]">
              No bookings yet. Your completed and upcoming bookings will appear here.
            </p>
          </div>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {paginatedBookings.map((booking, index) => {
                const statusMeta = getStatusMeta(booking.status);
                return (
                  <button
                    key={`${booking.id}-${index}`}
                    type="button"
                    onClick={() => navigate(`/bookings/${encodeURIComponent(booking.id)}`)}
                    className="relative w-full rounded-2xl border border-[#3878c2] bg-white text-left shadow-sm overflow-hidden transition hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#63bce6]/60"
                  >
                    <div
                      className="absolute left-0 top-0 bottom-0 w-2"
                      style={{ backgroundColor: statusMeta.color }}
                    />

                    <div className="relative p-5 flex flex-col gap-3">
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

                      <div className="mt-5 flex flex-col gap-4">
                        <div className="rounded-xl p-0.5">
                          <p className="text-sm font-semibold text-[#3878c2]">
                            {booking.from.type}
                          </p>
                          <p className="mt-1 text-sm text-[#374151]">
                            {booking.from.address}
                          </p>
                        </div>

                        <hr className="border-t-1 border-[#3878c2] w-11/12 mx-auto" />

                        <div className="rounded-xl p-0.5">
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

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-4">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="rounded-lg border border-[#3878c2] px-4 py-2 text-sm font-semibold text-[#3878c2] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#3878c2]/5 transition"
                >
                  Previous
                </button>
                <span className="text-sm font-medium text-[#374151]">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="rounded-lg bg-[#3878c2] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#2d62a3] shadow-sm transition"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
