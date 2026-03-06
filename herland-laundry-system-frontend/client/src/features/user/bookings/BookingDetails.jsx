import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import VerticalStepper from "../../../shared/components/VerticalStepper";
import { supabase } from "../../../lib/supabase";
import { formatDate, formatTime } from "../../../shared/utils/formatters";

const API_BASE = "http://localhost:5000/api/v1/customer";

export default function BookingDetails() {
  const navigate = useNavigate();
  const { bookingId } = useParams();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackComment, setFeedbackComment] = useState("");

  const fetchBooking = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        setError("Please log in to view booking details.");
        setLoading(false);
        return;
      }

      const response = await fetch(
        `${API_BASE}/my-bookings/${encodeURIComponent(bookingId)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setBooking(data);
      } else if (response.status === 404) {
        setError("Booking not found.");
      } else {
        setError("Could not load booking details.");
      }
    } catch (err) {
      console.error("Error fetching booking:", err);
      setError("Could not connect to the server.");
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    fetchBooking();
  }, [fetchBooking]);

  const handleCancel = async () => {
    if (!window.confirm("Are you sure you want to cancel this booking?")) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        alert("Session expired. Please log in again.");
        return;
      }

      const response = await fetch(`${API_BASE}/my-bookings/${bookingId}/cancel`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        alert("Booking cancelled successfully.");
        fetchBooking();
      } else {
        const data = await response.json();
        alert(data.error || "Failed to cancel booking.");
      }
    } catch (err) {
      console.error("Error cancelling booking:", err);
      alert("An error occurred. Please try again.");
    }
  };

  const handleEdit = () => {
    navigate(`/book?edit=${bookingId}`);
  };

  const handleSubmitFeedback = async () => {
    if (feedbackRating === 0) {
      alert("Please select a rating.");
      return;
    }

    try {
      setSubmittingFeedback(true);
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        alert("Session expired. Please log in again.");
        return;
      }

      const response = await fetch(`${API_BASE}/my-bookings/${bookingId}/feedback`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          rating: feedbackRating,
          comment: feedbackComment,
        }),
      });

      if (response.ok) {
        alert("Feedback submitted successfully. Thank you!");
        fetchBooking();
      } else {
        const data = await response.json();
        alert(data.error || "Failed to submit feedback.");
      }
    } catch (err) {
      console.error("Error submitting feedback:", err);
      alert("An error occurred. Please try again.");
    } finally {
      setSubmittingFeedback(false);
    }
  };

  // Derive timeline — if the booking has a delivery option, add the appropriate pending steps
  const buildFullTimeline = (bk) => {
    if (!bk) return [];

    const timeline = bk.timeline || [
      { status: "Booking Received", timestamp: new Date().toISOString() },
    ];

    // Check if terminal statuses exist
    const hasCompleted = timeline.some((s) => s.status === "Booking Completed");
    const hasCancelled = timeline.some((s) => s.status === "Booking Cancelled");
    const hasFlagged = timeline.some((s) => s.status === "Payment Flagged");
    if (hasCompleted || hasCancelled || hasFlagged) return timeline;

    // Determine which future steps to show
    const allStatuses = timeline.map((s) => s.status);
    const isDelivery =
      bk.collectionOption === "dropOffDelivered" ||
      bk.collectionOption === "pickedUpDelivered";

    const futureSteps = [
      "Booking Received",
      "Booking Accepted",
      "Payment Confirmed",
      "In Progress",
      isDelivery ? "Out for Delivery" : "Ready for Pick-up",
      "Booking Completed",
    ];

    // Add any future steps that haven't been reached yet (with null timestamp)
    const result = [...timeline];
    for (const step of futureSteps) {
      if (!allStatuses.includes(step)) {
        result.push({ status: step, timestamp: null });
      }
    }

    return result;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white px-4 py-6 sm:py-10">
        <div className="mx-auto w-full max-w-2xl md:max-w-5xl lg:max-w-6xl">
          <p className="text-lg text-[#b4b4b4]">Loading booking details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white px-4 py-6 sm:py-10">
        <div className="mx-auto w-full max-w-2xl md:max-w-5xl lg:max-w-6xl">
          <header className="mb-6 flex items-center gap-2 text-[#3878c2]">
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
            <h1 className="text-2xl font-semibold">Booking Details</h1>
          </header>
          <p className="text-lg text-[#e55353]">{error}</p>
        </div>
      </div>
    );
  }

  const referenceNumber = booking?.id || bookingId;
  const fullTimeline = buildFullTimeline(booking);


  return (
    <div className="min-h-screen bg-white px-4 py-6 sm:py-10">
      <div className="mx-auto w-full max-w-2xl md:max-w-5xl lg:max-w-6xl">
        {/* Header */}
        <header className="mb-6 flex items-center gap-2 text-[#3878c2]">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center"
            aria-label="Go back"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="size-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"
              />
            </svg>
          </button>
          <h1 className="text-2xl font-semibold">Booking Details</h1>
          <div className="ml-auto flex gap-2">
            {booking?.status?.toLowerCase() !== "cancelled" && (
              <button
                onClick={() => navigate(`/bookings/${bookingId}/receipt`)}
                className="rounded-lg border border-[#4bad40] px-3 py-1.5 text-sm font-medium text-[#4bad40] hover:bg-[#4bad40]/5 transition"
              >
                View Receipt
              </button>
            )}
            {booking?.status?.toLowerCase() === "pending" && (
              <>
                <button
                  onClick={handleEdit}
                  className="rounded-lg border border-[#3878c2] px-3 py-1.5 text-sm font-medium text-[#3878c2] hover:bg-[#3878c2]/5 transition"
                >
                  Edit
                </button>
                <button
                  onClick={handleCancel}
                  className="rounded-lg border border-[#e55353] px-3 py-1.5 text-sm font-medium text-[#e55353] hover:bg-[#e55353]/5 transition"
                >
                  Cancel
                </button>
              </>
            )}
          </div>
        </header>

        {/* Reference Number */}
        <div className="mb-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[#b4b4b4]">
            Reference number
          </h2>
          <p className="text-xl font-bold break-all text-[#3878c2]">
            {referenceNumber}
          </p>
        </div>

        <div className="mb-8 border-t border-[#f0f0f0]" />

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left Column: Timeline */}
          <div className="lg:col-span-1">
            <h3 className="mb-4 text-lg font-semibold text-[#3878c2]">Tracking</h3>
            <div className="rounded-2xl border border-[#3878c2]/20 bg-[#f9fbff] p-6 shadow-sm">
              <VerticalStepper steps={fullTimeline} />
            </div>
          </div>

          {/* Right Column: Booking Info */}
          <div className="space-y-6 lg:col-span-2">
            {/* Service Summary Card */}
            <div className="rounded-2xl border border-[#3878c2]/20 bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-lg font-semibold text-[#3878c2]">
                Service Summary
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold uppercase text-[#b4b4b4]">
                    Selected Services
                  </p>
                  <ul className="mt-1 space-y-1 text-sm text-[#374151]">
                    {booking?.serviceDetails?.selectedServices?.length > 0 ? (
                      booking.serviceDetails.selectedServices.map((s) => (
                        <li key={s} className="capitalize">{s}</li>
                      ))
                    ) : (
                      <li>-</li>
                    )}
                  </ul>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase text-[#b4b4b4]">
                    Add-Ons
                  </p>
                  <ul className="mt-1 space-y-1 text-sm text-[#374151]">
                    {booking?.serviceDetails?.selectedAddons?.length > 0 ? (
                      booking.serviceDetails.selectedAddons.map((addon) => (
                        <li key={addon.name}>
                          {addon.name}: {addon.quantity} pcs
                        </li>
                      ))
                    ) : (
                      <li>None</li>
                    )}
                  </ul>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-xs font-semibold uppercase text-[#b4b4b4]">
                    Total Weight
                  </p>
                  <p className="mt-1 text-sm text-[#374151]">
                    {booking?.serviceDetails?.weight || 0} kg
                  </p>
                </div>
              </div>
            </div>

            {/* Collection & Delivery Card */}
            <div className="rounded-2xl border border-[#3878c2]/20 bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-lg font-semibold text-[#3878c2]">
                Collection & Delivery
              </h3>
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase text-[#b4b4b4]">
                      Collection
                    </p>
                    <div className="text-sm text-[#374151]">
                      <p className="font-medium">
                        {formatDate(booking?.collectionDetails?.collectionDate)}
                      </p>
                      <p>{formatTime(booking?.collectionDetails?.collectionTime)}</p>
                      <p className="mt-1 text-xs text-[#b4b4b4]">
                        {booking?.collectionDetails?.pickupAddress}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase text-[#b4b4b4]">
                      Delivery
                    </p>
                    <div className="text-sm text-[#374151]">
                      <p className="font-medium">
                        {formatDate(booking?.collectionDetails?.deliveryDate)}
                      </p>
                      <p>{formatTime(booking?.collectionDetails?.deliveryTime)}</p>
                      <p className="mt-1 text-xs text-[#b4b4b4]">
                        {booking?.collectionDetails?.deliveryAddress}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="rounded-lg bg-[#eef6ff] p-3 text-sm text-[#3878c2]">
                  <span className="font-semibold">Mode:</span>{" "}
                  {booking?.collectionDetails?.optionLabel || "-"}
                </div>
              </div>
            </div>

            {/* Payment Card */}
            <div className="rounded-2xl border border-[#3878c2]/20 bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-lg font-semibold text-[#3878c2]">
                Payment Details
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold uppercase text-[#b4b4b4]">
                    Method
                  </p>
                  <p className="mt-1 text-sm font-medium text-[#374151]">
                    {booking?.paymentDetails?.method || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase text-[#b4b4b4]">
                    Status
                  </p>
                  <span className="mt-1 inline-flex items-center rounded-full bg-[#fdf2f2] px-2.5 py-0.5 text-xs font-medium text-[#e55353] capitalize">
                    {booking?.paymentDetails?.status || "Pending"}
                  </span>
                </div>
                <div className="sm:col-span-2 space-y-3 mt-2 border-t border-[#f0f0f0] pt-4">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-[#b4b4b4] font-semibold uppercase text-xs">Total Amount</span>
                    <span className="font-bold text-[#374151]">₱{booking?.paymentDetails?.totalAmount?.toFixed(2) || "0.00"}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-[#b4b4b4] font-semibold uppercase text-xs">Downpayment Paid</span>
                    <span className="font-bold text-[#4bad40]">₱{booking?.paymentDetails?.downpaymentRequired?.toFixed(2) || "0.00"}</span>
                  </div>
                  <div className="flex justify-between items-center border-t border-dashed border-[#d9e8fb] pt-2">
                    <span className="text-[#3878c2] font-bold uppercase text-xs">Remaining Balance</span>
                    <span className="text-2xl font-black text-[#3878c2]">
                      ₱{(booking?.paymentDetails?.balance || 0).toFixed(2)}
                    </span>
                  </div>
                  {booking?.paymentDetails?.method === "GCash" && (
                    <p className="mt-1 text-xs text-[#b4b4b4]">
                      Balance to be settled upon collection.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Notes Section */}
            {booking?.notes && (
              <div className="rounded-2xl border border-[#3878c2]/20 bg-white p-6 shadow-sm">
                <h3 className="mb-2 text-lg font-semibold text-[#3878c2]">
                  Special Instructions
                </h3>
                <p className="text-sm text-[#374151] italic">
                  "{booking.notes}"
                </p>
              </div>
            )}

            {/* Feedback Section */}
            {(booking?.status?.toLowerCase() === "delivered" || booking?.status?.toLowerCase() === "completed" || booking?.status === "Booking Completed") && (
              <div className="rounded-2xl border border-[#3878c2]/20 bg-white p-6 shadow-sm">
                <h3 className="mb-4 text-lg font-semibold text-[#3878c2]">
                  Your Experience
                </h3>
                
                {booking.feedback ? (
                  <div className="space-y-2">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <svg
                          key={star}
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill={star <= booking.feedback.rating ? "#facc15" : "#e5e7eb"}
                          className="size-5"
                        >
                          <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
                        </svg>
                      ))}
                    </div>
                    {booking.feedback.comment && (
                      <p className="text-sm text-[#374151] italic">
                        "{booking.feedback.comment}"
                      </p>
                    )}
                    <p className="text-[10px] text-[#b4b4b4] uppercase font-bold mt-1">
                      Submitted on {formatDate(booking.feedback.submitted_at)}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-sm text-[#374151]">
                      How was our service? Your feedback helps us improve!
                    </p>
                    
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setFeedbackRating(star)}
                          className="focus:outline-none transition-transform hover:scale-110"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill={star <= feedbackRating ? "#facc15" : "#e5e7eb"}
                            className="size-8"
                          >
                            <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
                          </svg>
                        </button>
                      ))}
                    </div>

                    <textarea
                      value={feedbackComment}
                      onChange={(e) => setFeedbackComment(e.target.value)}
                      placeholder="Share your thoughts (optional)..."
                      className="w-full rounded-xl border border-[#d9e8fb] p-3 text-sm focus:border-[#3878c2] focus:ring-1 focus:ring-[#3878c2] outline-none min-h-[100px]"
                    />

                    <button
                      onClick={handleSubmitFeedback}
                      disabled={submittingFeedback || feedbackRating === 0}
                      className="w-full rounded-xl bg-[#3878c2] py-3 text-sm font-bold text-white shadow-md hover:bg-[#2d62a3] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      {submittingFeedback ? "Submitting..." : "Submit Review"}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
