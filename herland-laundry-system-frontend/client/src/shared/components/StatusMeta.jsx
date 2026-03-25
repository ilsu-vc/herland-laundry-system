export const STATUS_META = {
  BookingReceived: { label: "Booking Received", color: "#b4b4b4" },
  BookingAccepted: { label: "Booking Accepted", color: "#ffde59" },
  BookingEdited: { label: "Booking Edited", color: "#ffde59" },
  PaymentConfirmed: { label: "Payment Confirmed", color: "#ffde59" },
  RiderDispatchedForPickup: { label: "Rider Dispatched for Pickup", color: "#3878c2" },
  PickedUpFromCustomer: { label: "Picked Up from Customer", color: "#3878c2" },
  InProgress: { label: "In Progress", color: "#ffde59" },
  OutForDelivery: { label: "Out for Delivery", color: "#63bce6" },
  ReadyForPickup: { label: "Ready for Pick-up", color: "#63bce6" },
  BookingCompleted: { label: "Booking Completed", color: "#4bad40" },
  BookingCancelled: { label: "Booking Cancelled", color: "#ff0000" },
  PaymentFlagged: { label: "Payment Flagged", color: "#ff0000" },
};

export const STATUS_ORDER = [
  "BookingReceived",
  "BookingAccepted",
  "BookingEdited",
  "PaymentConfirmed",
  "RiderDispatchedForPickup",
  "PickedUpFromCustomer",
  "InProgress",
  "ReadyForPickup",
  "OutForDelivery",
  "BookingCompleted",
  "BookingCancelled",
  "PaymentFlagged",
];

export const ACTIVE_STATUSES = [
  "BookingReceived",
  "BookingAccepted",
  "BookingEdited",
  "PaymentConfirmed",
  "RiderDispatchedForPickup",
  "PickedUpFromCustomer",
  "InProgress",
  "ReadyForPickup",
  "OutForDelivery",
];

export const PAST_STATUSES = [
  "BookingCompleted",
  "BookingCancelled",
  "PaymentFlagged",
];

export const getStatusKey = (status = "") => {
  const lower = status.toLowerCase();
  if (
    lower === "pending" ||
    lower === "received" ||
    lower.includes("booking received") ||
    lower.includes("placed")
  )
    return "BookingReceived";
  if (lower === "accepted" || lower.includes("booking accepted"))
    return "BookingAccepted";
  if (lower === "edited" || lower.includes("edited")) return "BookingEdited";
  if (lower.includes("payment confirmed") || lower === "confirmed")
    return "PaymentConfirmed";
  if (lower.includes("dispatched for pickup") || lower.includes("rider dispatched"))
    return "RiderDispatchedForPickup";
  if (lower.includes("picked up from customer") || lower === "picked_up")
    return "PickedUpFromCustomer";
  if (lower === "flagged" || lower.includes("flagged")) return "PaymentFlagged";
  if (lower.includes("in progress") || lower === "progress")
    return "InProgress";
  if (lower.includes("ready for pick") || lower === "ready")
    return "ReadyForPickup";
  if (lower.includes("out for delivery") || lower === "out" || lower === "ready_for_delivery")
    return "OutForDelivery";
  if (lower === "cancelled" || lower.includes("cancelled"))
    return "BookingCancelled";
  if (
    lower === "completed" ||
    lower.includes("completed") ||
    lower === "delivered"
  )
    return "BookingCompleted";
  return "BookingReceived";
};

export const getStatusMeta = (status) => {
  if (!status) return STATUS_META.BookingReceived;
  return (
    STATUS_META[status] ||
    STATUS_META[getStatusKey(status)] ||
    STATUS_META.BookingReceived
  );
};
