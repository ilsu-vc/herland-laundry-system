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

  const getServicePrice = (serviceName) => {
    const service = booking.serviceDetails?.availableServices?.find(
      (s) => s.name.toLowerCase() === serviceName.toLowerCase()
    );
    return service ? service.currentPrice : null;
  };

  const getAddonPrice = (addonName) => {
    // Check in availableAddons for the price
    const addon = booking.serviceDetails?.availableAddons?.find(
      (a) => a.name.toLowerCase() === addonName.toLowerCase()
    );
    return addon ? addon.currentPrice : null;
  };

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
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          /* Hide EVERYTHING except the receipt container */
          body * { visibility: hidden !important; }
          .receipt-container, .receipt-container * { visibility: visible !important; }
          .receipt-container { 
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            box-shadow: none !important; 
            padding: 1rem !important;
            margin: 0 !important;
            max-width: 100% !important;
          }
          
          /* Remove large margins/paddings that cause overflow */
          @page { margin: 1cm; size: auto; }
          .receipt-header { margin-bottom: 0.5rem !important; }
          .receipt-section { margin-bottom: 1rem !important; margin-top: 0.5rem !important; }
          .line-items-table tr { break-inside: avoid; }
          .totals-section { padding-top: 0.5rem !important; margin-top: 1rem !important; }
          .footer-note { margin-top: 1.5rem !important; }
          
          /* Ensure text colors are dark for printer */
          .text-[#3878c2] { color: #1e4b8a !important; }
          .text-[#b4b4b4] { color: #666 !important; }
        }
      `}} />
      <div className="mx-auto max-w-2xl bg-white p-8 shadow-xl print:shadow-none sm:p-12 receipt-container">
        {/* Header Branding */}
        <div className="mb-10 text-center receipt-header">
          <h1 className="text-3xl font-black tracking-tighter text-[#3878c2]">HERLAND LAUNDRY</h1>
          <p className="text-xs font-semibold uppercase tracking-widest text-[#b4b4b4]">Professional Wash • Dry • Fold</p>
          <div className="mt-4 text-sm text-[#4b5563]">
            <p>72 Balite Street Brgy 44, Pasay City</p>
            <p>Philippines</p>
          </div>
        </div>

        <div className="mb-8 border-b-2 border-dashed border-[#f0f0f0] receipt-section" />

        {/* Transaction Meta */}
        <div className="mb-10 grid grid-cols-2 gap-8 text-sm receipt-section">
          <div>
            <h3 className="mb-1 font-bold text-[#3878c2]">Billed To:</h3>
            <p className="font-medium text-[#1f2937]">{booking.profiles?.full_name || "Valued Customer"}</p>
            <p className="text-[#6b7280]">{booking.collectionDetails?.customerAddress || booking.collectionDetails?.pickupAddress}</p>
          </div>
          <div className="text-right">
            <h3 className="mb-1 font-bold text-[#3878c2]">Receipt Info:</h3>
            <p><span className="text-[#b4b4b4]">Ref:</span> <span className="font-mono font-medium">{booking.id}</span></p>
            <p><span className="text-[#b4b4b4]">Date:</span> {formatDate(booking.created_at || booking.date)}</p>
          </div>
        </div>

        {/* Line Items Table */}
        <table className="mb-8 w-full border-collapse text-left text-sm line-items-table">
          <thead>
            <tr className="border-b-2 border-[#3878c2] text-[#3878c2]">
              <th className="pb-3 pr-4 font-bold uppercase tracking-wider">Service Description</th>
              <th className="pb-3 text-right font-bold uppercase tracking-wider">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f3f4f6]">
            {services.map((s) => {
              const price = getServicePrice(s);
              return (
                <tr key={s}>
                  <td className="py-4 pr-4 capitalize text-[#374151]">
                    <div className="font-semibold">{s} Service</div>
                    <div className="text-xs text-[#9ca3af]">Professional cleaning & processing</div>
                  </td>
                  <td className="py-4 text-right font-medium text-[#1f2937]">
                    {price ? `₱${price}` : "---"}
                  </td>
                </tr>
              );
            })}
            {addons.map((a) => {
              const name = a.name || a;
              const qty = a.quantity || 1;
              const price = getAddonPrice(name);
              return (
                <tr key={name}>
                  <td className="py-4 pr-4 capitalize text-[#374151]">
                    <div className="font-semibold">{name}</div>
                    <div className="text-xs text-[#9ca3af]">Quantity: {qty}</div>
                  </td>
                  <td className="py-4 text-right font-medium text-[#1f2937]">
                    {price ? `₱${price * qty}` : "---"}
                  </td>
                </tr>
              );
            })}
            {booking.serviceDetails?.numberOfBags && (
              <tr>
                <td className="py-4 pr-4 capitalize text-[#374151]">
                  <div className="font-semibold">Total Loads/Bags</div>
                  {booking.serviceDetails.bagDescription && (
                    <div className="text-xs text-[#9ca3af]">Description: {booking.serviceDetails.bagDescription}</div>
                  )}
                </td>
                <td className="py-4 text-right font-bold text-[#1f2937]">{booking.serviceDetails.numberOfBags}</td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Totals Section */}
        <div className="ml-auto w-full max-w-xs space-y-3 pt-6 text-sm totals-section">
          <div className="flex justify-between text-[#6b7280]">
            <span>Payment Method:</span>
            <span className="font-medium text-[#1f2937]">{booking.paymentDetails?.method}</span>
          </div>
          <div className="flex justify-between text-[#6b7280]">
            <span>Payment Status:</span>
            <span className="font-medium text-[#4bad40]">{booking.paymentDetails?.status}</span>
          </div>
          <div className="border-t-2 border-[#f3f4f6] pt-4 flex justify-between text-[#6b7280]">
            <span>Subtotal:</span>
            <span className="font-medium text-[#1f2937]">₱{(booking.paymentDetails?.totalAmount || 0).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-lg font-bold">
            <div className="flex flex-col">
              <span className="text-[#3878c2]">TOTAL PAID</span>
              {booking.paymentDetails?.balance > 0 && (
                <span className="text-[10px] text-[#3878c2] uppercase tracking-wide opacity-80">(Downpayment 25%)</span>
              )}
            </div>
            <span className="text-[#1f2937]">₱{(booking.paymentDetails?.amountToPay || 0).toFixed(2)}</span>
          </div>
          {booking.paymentDetails?.balance > 0 && (
            <div className="flex justify-between text-[#e55353] font-semibold border-t border-[#f3f4f6] pt-2">
              <span>BALANCE DUE:</span>
              <span>₱{(booking.paymentDetails.balance).toFixed(2)}</span>
            </div>
          )}
        </div>

        {/* Footer Note */}
        <div className="mt-20 text-center footer-note">
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
