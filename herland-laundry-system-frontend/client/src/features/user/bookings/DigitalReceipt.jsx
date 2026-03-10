import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../../../lib/supabase";
import { formatDate, formatTime } from "../../../shared/utils/formatters";

const API_BASE = "http://localhost:5000/api/v1/customer";

export default function DigitalReceipt() {
  const navigate = useNavigate();
  const { bookingId } = useParams();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchBooking = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        setError("Please log in to view receipt.");
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
      } else {
        setError("Could not load receipt data.");
      }
    } catch (err) {
      console.error("Error fetching booking for receipt:", err);
      setError("Could not connect to server.");
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    fetchBooking();
  }, [fetchBooking]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) return <div className="p-8 text-center text-[#b4b4b4]">Generating Receipt...</div>;
  if (error) return <div className="p-8 text-center text-[#e55353]">{error}</div>;
  if (!booking) return null;

  const services = booking.serviceDetails?.selectedServices || [];
  const addons = booking.serviceDetails?.selectedAddons || [];
  const total = booking.paymentDetails?.amountToPay || 0;

  return (
    <div className="min-h-screen bg-neutral-100 p-4 sm:p-8 print:bg-white print:p-0">
      {/* Action Bar - Hidden on Print */}
      <div className="mx-auto mb-6 flex max-w-2xl justify-between print:hidden">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm font-medium text-[#3878c2] hover:underline"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="size-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
          Back to Details
        </button>
        <button
          onClick={handlePrint}
          className="rounded-lg bg-[#3878c2] px-4 py-2 text-sm font-semibold text-white shadow-md hover:bg-[#2d62a3] transition-colors"
        >
          Print Receipt
        </button>
      </div>

      {/* Receipt Content */}
      <div className="mx-auto max-w-2xl bg-white p-8 shadow-xl print:shadow-none sm:p-12">
        {/* Header Branding */}
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-black tracking-tighter text-[#3878c2]">HERLAND LAUNDRY</h1>
          <p className="text-xs font-semibold uppercase tracking-widest text-[#b4b4b4]">Professional Wash • Dry • Fold</p>
          <div className="mt-4 text-sm text-[#4b5563]">
            <p>72 Balite Street Brgy 44, Pasay City</p>
            <p>Philippines</p>
          </div>
        </div>

        <div className="mb-8 border-b-2 border-dashed border-[#f0f0f0]" />

        {/* Transaction Meta */}
        <div className="mb-10 grid grid-cols-2 gap-8 text-sm">
          <div>
            <h3 className="mb-1 font-bold text-[#3878c2]">Billed To:</h3>
            <p className="font-medium text-[#1f2937]">{booking.profiles?.full_name || "Valued Customer"}</p>
            <p className="text-[#6b7280]">{booking.collectionDetails?.pickupAddress}</p>
          </div>
          <div className="text-right">
            <h3 className="mb-1 font-bold text-[#3878c2]">Receipt Info:</h3>
            <p><span className="text-[#b4b4b4]">Ref:</span> <span className="font-mono font-medium">{booking.id}</span></p>
            <p><span className="text-[#b4b4b4]">Date:</span> {formatDate(booking.created_at)}</p>
          </div>
        </div>

        {/* Line Items Table */}
        <table className="mb-8 w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b-2 border-[#3878c2] text-[#3878c2]">
              <th className="pb-3 pr-4 font-bold uppercase tracking-wider">Service Description</th>
              <th className="pb-3 text-right font-bold uppercase tracking-wider">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f3f4f6]">
            {services.map((s) => (
              <tr key={s}>
                <td className="py-4 pr-4 capitalize text-[#374151]">
                  <div className="font-semibold">{s} Service</div>
                  <div className="text-xs text-[#9ca3af]">Professional cleaning & processing</div>
                </td>
                <td className="py-4 text-right font-medium text-[#1f2937]">---</td>
              </tr>
            ))}
            {addons.map((a) => (
              <tr key={a.name}>
                <td className="py-4 pr-4 capitalize text-[#374151]">
                  <div className="font-semibold">{a.name}</div>
                  <div className="text-xs text-[#9ca3af]">Quantity: {a.quantity}</div>
                </td>
                <td className="py-4 text-right font-medium text-[#1f2937]">---</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals Section */}
        <div className="ml-auto w-full max-w-xs space-y-3 pt-6 text-sm">
          <div className="flex justify-between text-[#6b7280]">
            <span>Payment Method:</span>
            <span className="font-medium text-[#1f2937]">{booking.paymentDetails?.method}</span>
          </div>
          <div className="flex justify-between text-[#6b7280]">
            <span>Payment Status:</span>
            <span className="font-medium text-[#4bad40]">{booking.paymentDetails?.status}</span>
          </div>
          <div className="border-t-2 border-[#3878c2] pt-4 flex justify-between text-lg font-bold">
            <span className="text-[#3878c2]">TOTAL PAID</span>
            <span className="text-[#1f2937]">₱{total.toFixed(2)}</span>
          </div>
        </div>

        {/* Footer Note */}
        <div className="mt-20 text-center">
          <div className="inline-block rounded-full bg-[#f0f7ff] px-6 py-2 text-xs font-bold text-[#3878c2]">
            THANK YOU FOR YOUR BUSINESS
          </div>
          <p className="mt-4 text-[10px] text-[#b4b4b4]">
            This is an electronically generated receipt. No signature is required.
          </p>
        </div>
      </div>
    </div>
  );
}
