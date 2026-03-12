/**
 * Helper to format date for display
 */
export const formatDate = (date) => {
  if (!date) return "-";
  const today = new Date();
  const d = new Date(date);
  const day = d.getDate().toString().padStart(2, "0");
  const month = d.toLocaleString("default", { month: "long" });
  
  // Checking if it's today for a friendlier display
  return today.toDateString() === d.toDateString()
    ? `Today | ${month} ${day}, ${d.getFullYear()}`
    : `${month} ${day}, ${d.getFullYear()}`;
};

/**
 * Helper to format time to 12-hour
 */
export const formatTime = (time) => {
  if (!time) return "-";
  const [hourStr, min] = time.split(":");
  let hour = parseInt(hourStr, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  if (hour > 12) hour -= 12;
  if (hour === 0) hour = 12;
  return `${hour.toString().padStart(2, "0")}:${min} ${ampm}`;
};

/**
 * Get pickup and delivery addresses based on collection option
 */
export const getRouteAddresses = (option) => {
  if (option === "pickedUpDelivered") {
    return {
      pickupAddress: "Customer address (pickup)",
      deliveryAddress: "Customer address (delivery)",
    };
  }

  if (option === "dropOffDelivered") {
    return {
      pickupAddress: "Herland Laundry - Main Branch",
      deliveryAddress: "Customer address (delivery)",
    };
  }

  return {
    pickupAddress: "Herland Laundry - Main Branch",
    deliveryAddress: "Herland Laundry - Main Branch",
  };
};

/**
 * Helper to format Add-Ons quantities
 */
export const formatAddonQuantity = (key, value) => {
  if (key === "detergent" || key === "conditioner") {
    return value * 2; // 2pcs per bundle
  }
  return value;
};
