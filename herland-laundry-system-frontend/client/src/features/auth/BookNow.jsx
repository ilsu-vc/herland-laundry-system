import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useLayout } from "../../app/LayoutContext";
import { usePermissions } from "../../shared/permissions/UsePermissions";
import DateTimePicker from "../../shared/components/DateTimePicker";
import { supabase } from "../../lib/supabase";
import { formatDate, formatTime, getRouteAddresses } from "../../shared/utils/formatters";
import BookingCalendar from "../../shared/components/BookingCalendar";
import { GoogleMap, useJsApiLoader, Marker, Autocomplete } from "@react-google-maps/api";

const mapLibraries = ["places", "geocoding"];
const defaultCenter = { lat: 14.537751, lng: 121.001379 }; // Pasay approximate

/* =========================
   Parent Component
========================= */
export default function BookNow() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);

  // Auth Check
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert("Please sign up or log in to create a booking.");
        navigate('/signup?redirect=book');
      }
    };
    checkAuth();
  }, [navigate]);
  const [services, setServices] = useState({});
  const [addons, setAddons] = useState({});
  const [weight, setWeight] = useState(0);
  const [availableServices, setAvailableServices] = useState([]);
  const [availableAddons, setAvailableAddons] = useState([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState("gcash");
  const [numberOfBags, setNumberOfBags] = useState(1);
  const [bagDescription, setBagDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("edit");
  const isEditMode = !!editId;

  const { setHideBottomNav } = useLayout();
  const { requestLocationPermission } = usePermissions();
  const [collectionInfo, setCollectionInfo] = useState({
    option: "dropOffPickUpLater",
    optionLabel: "Drop-off & Pick up later",
    date: "",
    time: "09:00",
  });
  const [deliveryInfo, setDeliveryInfo] = useState({
    date: "",
    time: "09:00",
  });
  const [customerLocation, setCustomerLocation] = useState({
    address: "",
    lat: null,
    lng: null
  });
  const [saveHomeAddress, setSaveHomeAddress] = useState(true);

  const { isLoaded: isMapLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: (import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "").trim(),
    libraries: mapLibraries,
  });

  // Fetch available services and add-ons from backend
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        setLoadingServices(true);
        const response = await fetch("http://localhost:5000/api/v1/customer/services");
        if (response.ok) {
          const data = await response.json();
          setAvailableServices(data.services || []);
          setAvailableAddons(data.addOns || []);
          
          // Initialize state if not in edit mode
          if (!isEditMode) {
            const initialServices = {};
            data.services.forEach(s => initialServices[s.name.toLowerCase()] = 0);
            setServices(initialServices);

            const initialAddons = {};
            data.addOns.forEach(a => initialAddons[a.name.toLowerCase()] = 0);
            setAddons(initialAddons);
          }
        }
      } catch (err) {
        console.error("Error fetching services metadata:", err);
      } finally {
        setLoadingServices(false);
      }
    };
    fetchMetadata();
  }, [isEditMode]);

  useEffect(() => {
    if (!isEditMode) {
      const fetchProfile = async () => {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            const response = await fetch("http://localhost:5000/api/v1/customer/profile", {
              headers: { Authorization: `Bearer ${session.access_token}` },
            });
            if (response.ok) {
              const profile = await response.json();
              if (profile.lat && profile.lng) {
                setCustomerLocation({
                  address: profile.address || "",
                  lat: profile.lat,
                  lng: profile.lng,
                });
              }
            }
          }
        } catch (err) {
          console.error("Failed to load saved profile address:", err);
        }
      };
      fetchProfile();
    }
  }, [isEditMode]);

  useEffect(() => {
    if (isEditMode && !loadingServices) {
      const fetchBooking = async () => {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          const token = session?.access_token;
          const response = await fetch(`http://localhost:5000/api/v1/customer/my-bookings/${editId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (response.ok) {
            const data = await response.json();
            if (data.status.toLowerCase() !== "pending") {
              alert("Only pending bookings can be edited.");
              navigate("/bookings");
              return;
            }
            // Hydrate state
            // Merge with available items to ensure all keys exist
            const mergedServices = {};
            availableServices.forEach(s => {
              const key = s.name.toLowerCase();
              mergedServices[key] = data.serviceDetails.services?.[key] || 0;
            });
            setServices(mergedServices);

            const mergedAddons = {};
            availableAddons.forEach(a => {
              const key = a.name.toLowerCase();
              mergedAddons[key] = data.serviceDetails.addons?.[key] || 0;
            });
            setAddons(mergedAddons);

            setWeight(data.serviceDetails.weight || 0);
            setPaymentMethod(data.paymentDetails.method === "GCash" ? "gcash" : "cash");
            setNotes(data.notes || "");
            setCollectionInfo({
              option: data.collectionDetails.option,
              optionLabel: data.collectionDetails.optionLabel,
              date: data.collectionDetails.collectionDate,
              time: data.collectionDetails.collectionTime,
            });
            setDeliveryInfo({
              date: data.collectionDetails.deliveryDate,
              time: data.collectionDetails.deliveryTime,
            });
            if (data.collectionDetails.lat && data.collectionDetails.lng) {
              setCustomerLocation({
                address: data.collectionDetails.pickupAddress || data.collectionDetails.deliveryAddress,
                lat: data.collectionDetails.lat,
                lng: data.collectionDetails.lng
              });
            }
          }
        } catch (err) {
          console.error("Error fetching booking for edit:", err);
        }
      };
      fetchBooking();
    }
  }, [isEditMode, editId]);

  const steps = [
    "Select Services",
    "Collection & Delivery",
    "Address Details",
    "Review Booking",
  ];

  useEffect(() => {
    setHideBottomNav(step === 3);

    return () => {
      setHideBottomNav(false);
    };
  }, [step, setHideBottomNav]);

  useEffect(() => {
    if (
      collectionInfo.option !== "dropOffPickUpLater" &&
      paymentMethod === "cash"
    ) {
      setPaymentMethod("gcash");
    }
  }, [collectionInfo.option, paymentMethod]);

  const calculateTotalEstimatedHours = () => {
    let total = 0;
    availableServices.forEach(s => {
      if (services[s.name.toLowerCase()]) {
        total += Number(s.estimatedHours) || 0;
      }
    });
    availableAddons.forEach(a => {
      const qty = Number(addons[a.name.toLowerCase()]) || 0;
      if (qty > 0) {
        total += (Number(a.estimatedHours) || 0) * qty;
      }
    });
    return total;
  };

  const handleStepChange = (newStep) => {
    // Check if moving to step 3 (Address) and request location permission
    if (newStep === 3) {
      requestLocationPermission((granted) => {
        if (granted) {
          setStep(newStep);
        }
        // If not granted, just don't navigate to step 3
      });
    } else {
      setStep(newStep);
    }
  };

  return (
    <div className="min-h-screen bg-white px-4 py-6 sm:px-3 md:px-2">
      {/* Stepper Container */}
      <div className="max-w-none lg:max-w-7xl mx-auto mb-4 pt-2 overflow-visible">
        <style>
          {`
            .steps .step:first-child::before {
              background-color: transparent !important;
            }
            .steps .step::before {
              background-color: var(--step-line-color, #b4b4b4);
            }
            .steps .step {
              color: var(--step-label-color, #b4b4b4);
            }
            .steps .step::after {
              background-color: var(--step-circle-color, #b4b4b4);
              border-color: var(--step-circle-color, #b4b4b4);
            }
            .date-input::-webkit-calendar-picker-indicator,
            .time-input::-webkit-calendar-picker-indicator {
              opacity: 0;
              position: absolute;
              right: 0.75rem;
              width: 1.5rem;
              height: 1.5rem;
              cursor: pointer;
            }
          `}
        </style>
        <ul className="steps w-full overflow-visible">
          {steps.map((label, index) => {
            const stepNumber = index + 1;
            const isCompleted = step > stepNumber;
            const isCurrent = step === stepNumber;
            const circleColor = isCompleted || isCurrent ? "#3878c2" : "#b4b4b4";
            const lineColor = isCompleted || isCurrent ? "#3878c2" : "#b4b4b4";
            const labelColor = isCompleted || isCurrent ? "#3878c2" : "#b4b4b4";

            return (
              <li
                key={label}
                className="step"
                style={{
                  "--step-circle-color": circleColor,
                  "--step-line-color": lineColor,
                  "--step-label-color": labelColor,
                }}
              >
                <span className="font-semibold text-[0.6rem] sm:text-[0.65rem] md:text-xs">{label}</span>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Step Content */}
      <div className="max-w-none lg:max-w-7xl mx-auto px-0 sm:px-1">
        {step === 1 && (
          <StepSelectServices
            onNext={() => handleStepChange(2)}
            availableServices={availableServices}
            availableAddons={availableAddons}
            loading={loadingServices}
            services={services}
            setServices={setServices}
            addons={addons}
            setAddons={setAddons}
            weight={weight}
            setWeight={setWeight}
            collectionInfo={collectionInfo}
            paymentMethod={paymentMethod}
            setPaymentMethod={setPaymentMethod}
            numberOfBags={numberOfBags}
            setNumberOfBags={setNumberOfBags}
            bagDescription={bagDescription}
            setBagDescription={setBagDescription}
          />
        )}
        {step === 2 && (
          <StepCollection
            onBack={() => setStep(1)}
            onNext={() => handleStepChange(3)}
            collectionInfo={collectionInfo}
            setCollectionInfo={setCollectionInfo}
            deliveryInfo={deliveryInfo}
            setDeliveryInfo={setDeliveryInfo}
            totalEstimatedHours={calculateTotalEstimatedHours()}
          />
        )}
        {step === 3 && (
          <StepAddress
            onBack={() => setStep(2)}
            onNext={(location) => {
              if (location) setCustomerLocation(location);
              setStep(4);
            }}
            isMapLoaded={isMapLoaded}
            initialLocation={customerLocation}
            saveHomeAddress={saveHomeAddress}
            setSaveHomeAddress={setSaveHomeAddress}
          />
        )}
        {step === 4 && (
          <StepReview
            onBack={() => setStep(3)}
            availableServices={availableServices}
            availableAddons={availableAddons}
            services={services}
            addons={addons}
            weight={weight}
            paymentMethod={paymentMethod}
            collectionInfo={collectionInfo}
            deliveryInfo={deliveryInfo}
            customerLocation={customerLocation}
            notes={notes}
            setNotes={setNotes}
            numberOfBags={numberOfBags}
            bagDescription={bagDescription}
            isEditMode={isEditMode}
            editId={editId}
            saveHomeAddress={saveHomeAddress}
          />
        )}
      </div>
    </div>
  );
}

/* =========================
   Step 1 – Select Services
========================= */
function StepSelectServices({
  onNext,
  availableServices,
  availableAddons,
  loading,
  services,
  setServices,
  addons,
  setAddons,
  weight,
  setWeight,
  collectionInfo,
  paymentMethod,
  setPaymentMethod,
  numberOfBags,
  setNumberOfBags,
  bagDescription,
  setBagDescription,
}) {

  const toggleService = (key) => {
    setServices((prev) => ({ ...prev, [key]: prev[key] === 0 ? 1 : 0 }));
  };

  const ServiceCard = ({ title, price, estimatedHours, value, onToggle }) => {
    const selected = value === 1;
    return (
      <div
        className="border rounded-lg p-4 transition"
        style={{
          borderColor: "#3878c2",
          backgroundColor: selected ? "rgba(99,188,230,0.1)" : "#ffffff",
        }}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0 pr-2">
            <h3 className="font-semibold text-[#3878c2]">{title}</h3>
            <p className="text-xs text-[#3878c2]">₱{price.toFixed(2)} per load</p>
            {estimatedHours > 0 && (
              <p className="text-[10px] text-gray-500 italic mt-0.5">~ {estimatedHours} hours</p>
            )}
          </div>
          <button
            onClick={onToggle}
            className="flex items-center justify-center gap-1 px-3 py-1 border rounded text-sm font-semibold transition whitespace-nowrap"
            style={{
              borderColor: "#4bad40",
              backgroundColor: selected ? "#4bad40" : "transparent",
              color: selected ? "#ffffff" : "#4bad40",
            }}
          >
            {selected ? (
              <>
                <CheckIcon color="#ffffff" /> Added
              </>
            ) : (
              <>
                <PlusIcon color="#4bad40" /> Add
              </>
            )}
          </button>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#3878c2]"></div>
      </div>
    );
  }

  return (
    <>
    <div className="px-0 sm:px-2">
      <h2 className="text-lg font-semibold text-[#3878c2] mb-4 sm:text-xl">
        Select Services
      </h2>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {availableServices.map((s) => (
          <ServiceCard
            key={s.id}
            title={s.name}
            price={s.currentPrice}
            estimatedHours={s.estimatedHours}
            value={services[s.name.toLowerCase()]}
            onToggle={() => toggleService(s.name.toLowerCase())}
          />
        ))}
      </div>

      {/* Add-Ons */}
      <h3 className="text-sm font-semibold text-[#3878c2] mt-6 mb-2">
        Add-Ons
      </h3>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 lg:gap-6">
        <div className="lg:col-span-1">
          {availableAddons.map((a) => (
            <AddonRow
              key={a.id}
              label={a.name}
              estimatedHours={a.estimatedHours}
              value={addons[a.name.toLowerCase()]}
              onChange={(v) =>
                setAddons((prev) => ({ ...prev, [a.name.toLowerCase()]: Math.max(0, Math.floor(v)) }))
              }
              allowDecimal={false}
            />
          ))}
        </div>

        {/* No. of Loads/Bags */}
        <div className="flex items-start justify-between gap-2 mb-3 lg:col-span-1">
          <span className="text-sm font-semibold text-[#3878c2] max-w-[60%] pr-2">
            No. of Loads/Bags
          </span>
          <QuantityInput
            value={numberOfBags}
            onChange={setNumberOfBags}
            allowDecimal={false}
          />
        </div>

        {/* Bag Description */}
        <div className="lg:col-span-1 border rounded-lg p-3 bg-white border-[#3878c2]">
           <label className="block text-xs font-semibold text-[#3878c2] mb-1">Description of bag(s)</label>
           <textarea
             placeholder="e.g., 1 Pink Bag, 1 Blue Bag"
             value={bagDescription}
             onChange={(e) => setBagDescription(e.target.value)}
             className="w-full text-sm p-1 border rounded text-[#3878c2] bg-white border-transparent placeholder-[#b4b4b4] focus:outline-none focus:ring-0"
             rows={2}
           />
        </div>
      </div>

      {/* Payment Method */}
      <h3 className="text-sm font-semibold text-[#3878c2] mt-6 mb-2">
        Payment Method
      </h3>

      <div className="space-y-2 max-w-md text-[#3878c2]">
        <RadioRow
          id="payment-gcash"
          label="GCash"
          checked={paymentMethod === "gcash"}
          onChange={() => setPaymentMethod("gcash")}
          name="paymentMethod"
        />
        <RadioRow
          id="payment-cash"
          label="Cash"
          checked={paymentMethod === "cash"}
          onChange={() => setPaymentMethod("cash")}
          disabled={collectionInfo.option !== "dropOffPickUpLater"}
          name="paymentMethod"
        />
      </div>

      {/* Next Button */}
      <button
        onClick={onNext}
        className="mt-8 mx-auto block w-40 py-2 rounded text-white font-semibold"
        style={{ backgroundColor: "#4bad40" }}
      >
        Next
      </button>
      </div>
    </>
  );
}


/* =========================
   Reusable Components
========================= */
function QuantityInput({ value, onChange, allowDecimal }) {
  const handleChange = (e) => {
    let val = e.target.value;

    // Allow empty input
    if (val === "") {
      onChange("");
      return;
    }

    // Allow only numbers (and 1 decimal if allowDecimal)
    const regex = allowDecimal ? /^(\d+\.?\d{0,1})?$/ : /^\d*$/;
    if (!regex.test(val)) return;

    // Remove leading zero if user types a non-zero number
    if (!allowDecimal && val.length > 1 && val.startsWith("0")) {
      val = val.replace(/^0+/, "");
    }

    onChange(val);
  };

  const handleBlur = () => {
    let num = parseFloat(value);
    if (isNaN(num) || num < 0) num = 0;

    if (allowDecimal) {
      num = Math.round(num * 10) / 10;
    } else {
      num = Math.floor(num);
    }

    onChange(num);
  };

  const handleIncrement = () => {
    let num = parseFloat(value) || 0;
    num += 1;
    if (allowDecimal) num = Math.ceil(num * 10) / 10;
    onChange(num);
  };

  const handleDecrement = () => {
    let num = parseFloat(value) || 0;
    num -= 1;
    if (num < 0) num = 0;
    if (allowDecimal) num = Math.floor(num * 10) / 10;
    onChange(num);
  };

  return (
    <div className="flex items-center max-w-[8rem]">
      <button
        onClick={handleDecrement}
        disabled={parseFloat(value) <= 0 || value === ""}
        className={`px-3 h-10 border rounded-l ${
          parseFloat(value) <= 0 || value === "" ? "opacity-40 cursor-not-allowed" : ""
        }`}
        style={{ borderColor: "#3878c2", color: "#3878c2" }}
      >
        −
      </button>

      <input
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        type="text"
        className="w-full h-10 text-center border-y bg-white outline-none"
        style={{ borderColor: "#3878c2", color: "#3878c2" }}
      />

      <button
        onClick={handleIncrement}
        className="px-3 h-10 border rounded-r"
        style={{ borderColor: "#3878c2", color: "#3878c2" }}
      >
        +
      </button>
    </div>
  );
}

function AddonRow({ label, estimatedHours, value, onChange, allowDecimal }) {
  return (
    <div className="flex items-center justify-between gap-2 mb-3">
      <div className="flex flex-col max-w-[60%] pr-2">
        <span className="text-sm text-[#3878c2]">{label}</span>
        {estimatedHours > 0 && (
          <span className="text-[10px] text-gray-400 italic">~ {estimatedHours} hrs</span>
        )}
      </div>
      <QuantityInput
        value={value}
        onChange={onChange}
        allowDecimal={allowDecimal}
      />
    </div>
  );
}

/* =========================
   Icons
========================= */
function PlusIcon({ color = "currentColor" }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2.5}
      stroke={color}
      className="w-4 h-4"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  );
}

function CheckIcon({ color = "currentColor" }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2.5}
      stroke={color}
      className="w-4 h-4"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
    </svg>
  );
}

function StepCollection({
  onBack,
  onNext,
  collectionInfo,
  setCollectionInfo,
  deliveryInfo,
  setDeliveryInfo,
  totalEstimatedHours,
}) {
  const optionLabels = {
    dropOffPickUpLater: "Drop-off & Pick up later",
    dropOffDelivered: "Drop-off & Delivered",
    pickedUpDelivered: "Picked up & Delivered",
  };
  const option = collectionInfo.option || "dropOffPickUpLater";
  const optionLabel = optionLabels[option] || optionLabels.dropOffPickUpLater;

  useEffect(() => {
    if (collectionInfo.optionLabel !== optionLabel) {
      setCollectionInfo((prev) => ({ ...prev, optionLabel }));
    }
  }, [collectionInfo.optionLabel, optionLabel, setCollectionInfo]);

  // Autofill texts based on selected option
  const autofill = {
    dropOffPickUpLater: {
      collection: "I'll drop off my laundry",
      delivery: "I'll pick up my laundry",
    },
    dropOffDelivered: {
      collection: "I'll drop off my laundry",
      delivery: "Deliver my laundry to me",
    },
    pickedUpDelivered: {
      collection: "Pick up my laundry from me",
      delivery: "Deliver my laundry to me",
    },
  };

  const [isValidTime, setIsValidTime] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (collectionInfo.date && collectionInfo.time && deliveryInfo.date && deliveryInfo.time) {
      const dropOff = new Date(`${collectionInfo.date}T${collectionInfo.time}`);
      const pickUp = new Date(`${deliveryInfo.date}T${deliveryInfo.time}`);
      const diffMs = pickUp - dropOff;
      const diffHrs = diffMs / (1000 * 60 * 60);

      // Add a small buffer of 0.01 to avoid floating point issues
      if (diffHrs < totalEstimatedHours - 0.01) {
        setIsValidTime(false);
        setErrorMessage(`Pick-up time is too early. Selected services need about ${totalEstimatedHours} hours.`);
      } else {
        setIsValidTime(true);
        setErrorMessage("");
      }
    }
  }, [collectionInfo.date, collectionInfo.time, deliveryInfo.date, deliveryInfo.time, totalEstimatedHours]);

  const handleNextSubmit = () => {
    if (!isValidTime) {
      alert(errorMessage);
      return;
    }
    onNext();
  };

  return (
    <div className="text-[#3878c2] space-y-6 px-0 sm:px-2">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">Collection & Delivery</h2>
        {totalEstimatedHours > 0 && (
          <div className="text-xs font-medium text-gray-500 italic">
            Total Estimated Duration: {totalEstimatedHours} hours
          </div>
        )}
      </div>

      {!isValidTime && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm font-medium animate-pulse">
           ⚠️ {errorMessage}
        </div>
      )}

      {/* Options */}
      <div className="space-y-2">
        <RadioRow
          id="option1"
          label="Drop-off & Pick up later"
          checked={option === "dropOffPickUpLater"}
          onChange={() =>
            setCollectionInfo((prev) => ({
              ...prev,
              option: "dropOffPickUpLater",
              optionLabel: optionLabels.dropOffPickUpLater,
            }))
          }
        />
        <RadioRow
          id="option2"
          label="Drop-off & Delivered"
          checked={option === "dropOffDelivered"}
          onChange={() =>
            setCollectionInfo((prev) => ({
              ...prev,
              option: "dropOffDelivered",
              optionLabel: optionLabels.dropOffDelivered,
            }))
          }
        />
        <RadioRow
          id="option3"
          label="Picked up & Delivered"
          checked={option === "pickedUpDelivered"}
          onChange={() =>
            setCollectionInfo((prev) => ({
              ...prev,
              option: "pickedUpDelivered",
              optionLabel: optionLabels.pickedUpDelivered,
            }))
          }
        />
      </div>

      {/* Divider */}
      <hr className="border-t-1 border-[#3878c2] w-11/12 mx-auto md:hidden" />

      {/* Collection & Delivery Section */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Collection Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-[#3878c2]">Collection Schedule</h3>
            <div className="text-[10px] bg-white border border-[#3878c2] px-2 py-1 rounded-full">
              {collectionInfo.date ? formatDate(collectionInfo.date) : 'No date'} @ {collectionInfo.time ? formatTime(collectionInfo.time) : 'No time'}
            </div>
          </div>
          
          <BookingCalendar 
            selectedDate={collectionInfo.date}
            onDateChange={(date) => setCollectionInfo(prev => ({ ...prev, date }))}
            selectedTime={collectionInfo.time}
            onTimeChange={(time) => setCollectionInfo(prev => ({ ...prev, time }))}
          />

          <div className="flex flex-col gap-1">
            <input
              type="text"
              value={autofill[option].collection}
              readOnly
              className="w-full p-2.5 rounded border border-[#3878c2] text-[#3878c2] bg-white text-sm font-medium"
            />
          </div>
        </div>

        {/* Delivery Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-[#3878c2]">Delivery Schedule</h3>
            <div className="text-[10px] bg-white border border-[#3878c2] px-2 py-1 rounded-full">
              {deliveryInfo.date ? formatDate(deliveryInfo.date) : 'No date'} @ {deliveryInfo.time ? formatTime(deliveryInfo.time) : 'No time'}
            </div>
          </div>

          <BookingCalendar 
            selectedDate={deliveryInfo.date}
            onDateChange={(date) => setDeliveryInfo(prev => ({ ...prev, date }))}
            selectedTime={deliveryInfo.time}
            onTimeChange={(time) => setDeliveryInfo(prev => ({ ...prev, time }))}
          />

          <div className="flex flex-col gap-1">
            <input
              type="text"
              value={autofill[option].delivery}
              readOnly
              className="w-full p-2.5 rounded border border-[#3878c2] text-[#3878c2] bg-white text-sm font-medium"
            />
          </div>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between gap-3 mt-6">
        <button
          onClick={onBack}
          className="px-4 py-2 border border-[#4bad40] rounded text-[#4bad40] bg-white"
        >
          Back
        </button>
        <button
          onClick={handleNextSubmit}
          className={`px-4 py-2 rounded text-white ${isValidTime ? 'bg-[#4bad40]' : 'bg-gray-400 cursor-not-allowed'}`}
        >
          Next
        </button>
      </div>
    </div>
  );
}

/* =========================
   Option Row
========================= */
function RadioRow({
  id,
  label,
  checked,
  onChange,
  disabled = false,
  name = "radioGroup",
}) {
  return (
    <label
      htmlFor={id}
      className={`flex items-center p-2 rounded select-none ${
        disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"
      } ${
        checked ? "bg-[#e6f7e6]" : "bg-white"
      }`}
    >
      <span className="relative w-4 h-4 flex-shrink-0 mr-2">
        {/* Outer thin border */}
        <span
          className={`absolute inset-0 rounded-full border border-[#3878c2] bg-white`}
        ></span>
        {/* Inner shaded circle when checked */}
        {checked && (
          <span className="absolute top-1 left-1 w-2 h-2 bg-[#3878c2] rounded-full"></span>
        )}
        <input
          id={id}
          type="radio"
          name={name}
          checked={checked}
          onChange={!disabled ? onChange : undefined}
          disabled={disabled}
          className={`absolute w-full h-full opacity-0 ${
            disabled ? "cursor-not-allowed" : "cursor-pointer"
          }`}
        />
      </span>
      <span className="text-sm font-medium">{label}</span>
    </label>
  );
}

/* =========================
   Step 3 - Address
========================= */
function StepAddress({ onBack, onNext, isMapLoaded, initialLocation, saveHomeAddress, setSaveHomeAddress }) {
  const [autocomplete, setAutocomplete] = useState(null);
  const [location, setLocation] = useState(initialLocation?.lat ? initialLocation : { address: "", lat: null, lng: null });
  const [mapCenter, setMapCenter] = useState(initialLocation?.lat ? { lat: initialLocation.lat, lng: initialLocation.lng } : defaultCenter);
  const [searchValue, setSearchValue] = useState(initialLocation?.address || "");
  const [isGeocoding, setIsGeocoding] = useState(false);

  const onLoad = (autoC) => setAutocomplete(autoC);

  const onPlaceChanged = () => {
    if (autocomplete !== null) {
      const place = autocomplete.getPlace();
      if (place.geometry && place.geometry.location) {
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        const address = place.formatted_address || place.name;
        setLocation({ address, lat, lng });
        setMapCenter({ lat, lng });
        setSearchValue(address);
      }
    }
  };

  const handleMapClick = (e) => {
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();
    setMapCenter({ lat, lng });
    setIsGeocoding(true);

    // Attempt reverse geocoding to get a human-readable address
    try {
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ location: { lat, lng } }, (results, status) => {
        setIsGeocoding(false);
        if (status === "OK" && results && results[0]) {
          const address = results[0].formatted_address;
          setLocation({ address, lat, lng });
          setSearchValue(address);
        } else {
          // Geocoding API not available yet — pin was dropped but address couldn't be resolved.
          // Store a friendly label + coordinates so rider navigation still works.
          setLocation({ address: "", lat, lng });
          setSearchValue("");
          // Prompt the customer to type their address in the search box
          alert(
            "📍 Your pin has been set!\n\nWe couldn't automatically detect your street name. Please type your full address (e.g. '123 Rizal St, Las Piñas') in the search bar above so we can record it correctly."
          );
        }
      });
    } catch {
      setIsGeocoding(false);
      setLocation({ address: "", lat, lng });
      setSearchValue("");
      alert(
        "📍 Your pin has been set!\n\nPlease type your complete address in the search bar above so we can record it."
      );
    }
  };

  // Allow manual address typing when geocoding isn't available
  const handleManualAddressConfirm = () => {
    if (searchValue.trim().length > 3) {
      setLocation((prev) => ({ ...prev, address: searchValue.trim() }));
    }
  };

  const handleNext = () => {
    if (!location.lat) {
      alert("Please pin your location on the map or search for your address first.");
      return;
    }
    if (!location.address || location.address.trim().length < 5) {
      alert("Please confirm your address by searching for it or typing it in the search box above.");
      return;
    }
    onNext(location);
  };


  return (
    <div className="flex flex-col min-h-[70vh] sm:min-h-[72vh] bg-[#ffffff] text-[#3878c2] pb-6 px-0 sm:px-2 relative">
      <div className="z-20 mx-auto w-full max-w-2xl md:max-w-6xl lg:max-w-7xl px-2 sm:px-1 pt-2 pb-4">
        <label htmlFor="simple-search" className="sr-only">Search</label>
        <div className="flex items-center gap-2">
          {/* Back button */}
          <button
            type="button"
            onClick={onBack}
            aria-label="Go back"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#3878c2] bg-white shadow-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5 text-[#3878c2]">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
            </svg>
          </button>

          {/* Autocomplete search */}
          <div className="relative flex-1 bg-white shadow-sm rounded-lg">
            {isMapLoaded ? (
              <Autocomplete onLoad={onLoad} onPlaceChanged={onPlaceChanged}>
                <input
                  type="text"
                  id="simple-search"
                  className="w-full px-3 py-2.5 text-sm rounded-lg border border-[#3878c2] bg-white text-[#3878c2] placeholder:text-[#b4b4b4] focus:outline-none focus:ring-1 focus:ring-[#3878c2]"
                  placeholder="Search for your address or tap the map..."
                  value={searchValue}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSearchValue(val);
                    // If the user is typing manually (pin set but no geocoded address yet), save the typed text as the address
                    if (location.lat) {
                      setLocation((prev) => ({ ...prev, address: val }));
                    }
                  }}
                  onBlur={handleManualAddressConfirm}
                />
              </Autocomplete>
            ) : (
              <input
                type="text"
                disabled
                className="w-full px-3 py-2.5 text-sm rounded-lg border border-[#3878c2] bg-gray-100 text-[#b4b4b4]"
                placeholder="Loading map..."
              />
            )}
          </div>
        </div>
      </div>

      {/* Map area */}
      <div className="relative flex-1 min-h-[40vh] mx-2 sm:mx-0 sm:min-h-[50vh] bg-gray-50 overflow-hidden rounded-xl border border-[#3878c2]/20 shadow-inner mb-28">
        {isMapLoaded ? (
          <GoogleMap
            mapContainerStyle={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}
            center={mapCenter}
            zoom={location.lat ? 17 : 13}
            options={{ disableDefaultUI: false, zoomControl: true, streetViewControl: false, mapTypeControl: false, fullscreenControl: false }}
            onClick={handleMapClick}
          >
            {location.lat && (
              <Marker position={{ lat: location.lat, lng: location.lng }} />
            )}
          </GoogleMap>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3878c2] mb-2"></div>
            <span className="text-sm font-semibold text-[#3878c2]">Loading Maps...</span>
          </div>
        )}

        {/* Geocoding loading overlay */}
        {isGeocoding && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/10 z-10">
            <div className="bg-white px-4 py-2 rounded-lg shadow-md flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#3878c2]"></div>
              <span className="text-xs text-[#3878c2] font-semibold">Getting address...</span>
            </div>
          </div>
        )}

        {/* Tap hint if no location pinned yet */}
        {isMapLoaded && !location.lat && !isGeocoding && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/90 text-[#3878c2] text-xs font-semibold px-4 py-2 rounded-full shadow-md pointer-events-none whitespace-nowrap">
            📍 Tap the map to pin your location
          </div>
        )}
      </div>

      {/* Bottom dock */}
      <div
        className="fixed sm:absolute bottom-0 left-0 right-0 w-full px-4 pt-4 pb-6 sm:px-6 shadow-[0_-8px_15px_-3px_rgba(0,0,0,0.1)] rounded-t-3xl border-t border-[#3878c2]/20 z-30"
        style={{ backgroundColor: "#63bce6" }}
      >
        <div className="mx-auto max-w-2xl text-center">
          <div className="mb-3">
            <p className="text-xs font-semibold text-white uppercase tracking-wider">Selected Location</p>
            <p className="text-sm font-bold text-white truncate">{location.address || "No location selected — tap map or search above"}</p>
          </div>
          {location.lat && (
            <label className="flex items-center justify-center gap-2 mb-3 text-white cursor-pointer select-none">
              <input
                type="checkbox"
                checked={saveHomeAddress}
                onChange={(e) => setSaveHomeAddress(e.target.checked)}
                className="w-4 h-4 rounded border-white text-[#3878c2] focus:ring-[#3878c2]"
              />
              <span className="text-sm font-medium">Save as my home address</span>
            </label>
          )}
          <button
            onClick={handleNext}
            disabled={!location.lat || isGeocoding}
            className={`w-full py-3 rounded-lg font-bold transition-all shadow-md ${!location.lat || isGeocoding ? "bg-white/50 text-[#3878c2]/50 cursor-not-allowed" : "bg-white text-[#3878c2] hover:bg-gray-50 active:scale-[0.98]"}`}
          >
            {isGeocoding ? "Getting address..." : "Confirm this location"}
          </button>
        </div>
      </div>
    </div>
  );
}

function StepReview({
  onBack,
  services = {},
  addons = {},
  weight = 0,
  availableServices = [],
  availableAddons = [],
  paymentMethod = "gcash",
  collectionInfo = { optionLabel: "-", date: "", time: "" },
  deliveryInfo = { date: "", time: "" },
  customerLocation,
  notes,
  setNotes,
  numberOfBags,
  bagDescription,
  isEditMode,
  editId,
  saveHomeAddress,
}) {
  const navigate = useNavigate();
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [bookingStatus, setBookingStatus] = useState("success");
   const [referenceNumber, setReferenceNumber] = useState("");
   const [paymentReference, setPaymentReference] = useState("");

  const calculateTotal = () => {
    let total = 0;
    // Base services - multiplied by no. of loads
    availableServices.forEach(s => {
      if (services[s.name.toLowerCase()]) {
        total += s.currentPrice * (Number(numberOfBags) || 1);
      }
    });
    
    // Add-ons
    availableAddons.forEach(a => {
      const qty = Number(addons[a.name.toLowerCase()]) || 0;
      if (qty > 0) {
        total += a.currentPrice * qty;
      }
    });

    return total; 
  };

  const calculateDownpayment = () => {
    return calculateTotal() * 0.25;
  };

  const generateReferenceNumber = () => {
    const timestamp = Date.now().toString().slice(-6);
    const randomPart = Math.floor(1000 + Math.random() * 9000);
    return `HL-${timestamp}-${randomPart}`;
  };

  return (
    <div className="text-[#3878c2] bg-[#ffffff] min-h-screen px-0 py-4 sm:px-2">
      <h2 className="text-lg font-semibold mb-2 sm:text-xl">Review Booking</h2>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Services Selected */}
        <div className="p-4 border rounded bg-[#ffffff] shadow-sm">
          <h3 className="font-semibold mb-2">Services Selected</h3>
          <ul className="list-disc list-inside text-sm">
            {availableServices.filter(s => services[s.name.toLowerCase()]).map(s => (
              <li key={s.id}>
                {s.name} (₱{s.currentPrice.toFixed(2)} per load)
                {s.estimatedHours > 0 && <span className="ml-1 text-[10px] text-gray-500 italic">- ~{s.estimatedHours} hrs</span>}
              </li>
            ))}
            {availableServices.filter(s => services[s.name.toLowerCase()]).length === 0 && <li>None</li>}
          </ul>

          <h4 className="font-semibold mt-4 mb-1">Price Breakdown</h4>
          <div className="text-sm space-y-1">
            <div className="flex justify-between">
              <span>Total Estimated:</span>
              <span className="font-bold">₱{calculateTotal().toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-[#4bad40]">
              <span>25% Downpayment:</span>
              <span className="font-bold">₱{calculateDownpayment().toFixed(2)}</span>
            </div>
          </div>

          {/* Add-Ons */}
          <h4 className="font-semibold mt-4 mb-1">Add-Ons</h4>
          {availableAddons.filter(a => Number(addons[a.name.toLowerCase()]) > 0).length > 0 ? (
            <ul className="list-disc list-inside text-sm">
              {availableAddons.filter(a => Number(addons[a.name.toLowerCase()]) > 0).map(a => (
                <li key={a.id}>
                  {a.name}: {addons[a.name.toLowerCase()]} pcs (₱{(a.currentPrice * addons[a.name.toLowerCase()]).toFixed(2)})
                  {a.estimatedHours > 0 && <span className="ml-1 text-[10px] text-gray-500 italic">- ~{a.estimatedHours} hrs ea.</span>}
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-sm">None</div>
          )}

          {/* No. of Bags & Description */}
          <h4 className="font-semibold mt-4 mb-1">
            Laundry Details
          </h4>
          <div className="text-sm space-y-1">
            <div className="flex justify-between">
              <span>No. of Bags/Loads:</span>
              <span className="font-bold">{numberOfBags}</span>
            </div>
            {bagDescription && (
              <div className="text-xs italic text-[#3878c2]">
                "{bagDescription}"
              </div>
            )}
          </div>
        </div>

        {/* Collection & Delivery */}
        <div className="p-4 border rounded bg-[#ffffff] shadow-sm">
          <h3 className="font-semibold mb-4">Collection & Delivery</h3>
          <div className="text-s mb-3">
            <span className="font-medium">Mode:</span> {collectionInfo.optionLabel || "-"}
          </div>

          {/* Collection */}
          <div className="mb-3">
            <div className="text-s font-semibold text-[#3878c2] mb-1">
              Collection
            </div>
            <div className="flex items-center gap-2 mb-1 text-sm">
              <CalendarIcon />
              <span>{formatDate(collectionInfo.date)}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <ClockIcon />
              <span>{formatTime(collectionInfo.time)}</span>
            </div>
          </div>

          <hr className="border-t border-[#3878c2] my-3" />

          {/* Delivery */}
          <div className="mb-3">
            <div className="text-s font-semibold text-[#3878c2] mb-1">
              Delivery
            </div>
            <div className="flex items-center gap-2 mb-1 text-sm">
              <CalendarIcon />
              <span>{formatDate(deliveryInfo.date)}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <ClockIcon />
              <span>{formatTime(deliveryInfo.time)}</span>
            </div>
          </div>
        </div>

        {/* Special Instructions */}
        <div className="p-4 border rounded bg-[#ffffff] shadow-sm md:col-span-2">
          <h3 className="font-semibold mb-2">Special Instructions</h3>
          <textarea
            placeholder="Notes or requests for your laundry"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            className="w-full p-2 border rounded text-[#3878c2] bg-white placeholder-[#b4b4b4] focus:outline-none focus:ring-1 focus:ring-[#3878c2]"
            rows={3}
          />
        </div>
      </div>


      {/* Buttons */}
      <div className="flex items-center justify-between gap-3 mt-6">
        <button
          onClick={onBack}
          className="px-4 py-2 border-[0.5px] border-[#4bad40] rounded text-[#4bad40] bg-[#ffffff]"
        >
          Back
        </button>
        <button
          onClick={async () => {
            const nextReference = isEditMode ? editId : generateReferenceNumber();
            const nextPaymentReference = "";

            // Build the booking payload
            const selectedServices = Object.entries(services)
              .filter(([, isSelected]) => Boolean(isSelected))
              .map(([serviceName]) => serviceName);

            const selectedAddons = Object.entries(addons)
              .filter(([, quantity]) => Number(quantity) > 0)
              .map(([addonName, quantity]) => ({ name: addonName, quantity }));

            const routeAddresses = getRouteAddresses(collectionInfo.option);
            
            // Override with precise locations if applicable
            let finalPickup = routeAddresses.pickupAddress;
            let finalDelivery = routeAddresses.deliveryAddress;
            
            if (collectionInfo.option === "pickedUpDelivered") {
               finalPickup = customerLocation?.address || routeAddresses.pickupAddress;
               finalDelivery = customerLocation?.address || routeAddresses.deliveryAddress;
            } else if (collectionInfo.option === "dropOffDelivered") {
               finalDelivery = customerLocation?.address || routeAddresses.deliveryAddress;
            }

            const payload = {
              reference_number: nextReference,
              collection_option: collectionInfo.option || "dropOffPickUpLater",
              service_details: {
                services,
                selectedServices,
                addons,
                selectedAddons,
                weight,
                numberOfBags,
                bagDescription,
                availableServices, // Cache prices for historical accuracy
                availableAddons,
              },
              collection_details: {
                option: collectionInfo.option || "dropOffPickUpLater",
                optionLabel: collectionInfo.optionLabel || "Drop-off & Pick up later",
                collectionDate: collectionInfo.date || "",
                collectionTime: collectionInfo.time || "",
                deliveryDate: deliveryInfo.date || "",
                deliveryTime: deliveryInfo.time || "",
                pickupAddress: finalPickup,
                deliveryAddress: finalDelivery,
                customerAddress: customerLocation?.address || null,
                lat: customerLocation?.lat || null,
                lng: customerLocation?.lng || null,
              },
              payment_details: {
                method: paymentMethod === "gcash" ? "GCash" : "Cash",
                referenceNumber: paymentMethod === "gcash" ? "" : "-",
                status: paymentMethod === "gcash" ? "For confirmation" : "Pay on collection",
                totalAmount: calculateTotal(),
                downpaymentRequired: calculateDownpayment(),
                amountToPay: calculateDownpayment(), // For GCash initial payment
                balance: calculateTotal() - calculateDownpayment(),
              },
              notes: notes || "",
            };

            try {
              const { data: { session } } = await supabase.auth.getSession();
              const token = session?.access_token;

              const url = isEditMode 
                ? `http://localhost:5000/api/v1/customer/my-bookings/${editId}/update` 
                : "http://localhost:5000/api/v1/customer/book";
              
              const method = isEditMode ? "PATCH" : "POST";

              const response = await fetch(url, {
                method,
                headers: {
                  "Content-Type": "application/json",
                  ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify(payload),
              });

              if (response.ok) {
                const result = await response.json();
                const ref = isEditMode ? editId : (result.booking?.reference_number || nextReference);
                
                if (isEditMode) {
                  alert("Booking updated successfully.");
                  navigate(`/bookings/${editId}`);
                  return;
                }

                // If non-edit mode and user wants to save their address, store it in their profile
                if (saveHomeAddress && customerLocation?.lat) {
                  try {
                    await fetch("http://localhost:5000/api/v1/customer/profile", {
                      method: "PUT",
                      headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                      },
                      body: JSON.stringify({
                        address: customerLocation.address,
                        lat: customerLocation.lat,
                        lng: customerLocation.lng,
                      })
                    });
                  } catch (e) {
                    console.error("Failed to save home address to profile:", e);
                  }
                }

                 setBookingStatus("success");
                 setReferenceNumber(ref);
                 setPaymentReference(nextPaymentReference);
               } else {
                const errData = await response.json().catch(() => ({}));
                console.error("Booking request failed:", errData.error || response.statusText);
                setBookingStatus("error");
                setReferenceNumber("");
                setPaymentReference("");
              }
            } catch (err) {
              console.error("Booking request error:", err);
              setBookingStatus("error");
              setReferenceNumber("");
              setPaymentReference("");
            }

            setIsSuccessOpen(true);
          }}
          className="px-4 py-2 rounded text-white bg-[#4bad40]"
        >
          {isEditMode ? "Update Booking" : "Confirm Booking"}
        </button>
      </div>

      {isSuccessOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-lg bg-white p-5 text-center text-[#3878c2] shadow-lg">
            {bookingStatus === "success" ? (
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#e6f7e6]">
                <svg
                  className="h-6 w-6 text-[#4bad40]"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m4.5 12.75 6 6 9-13.5"
                  />
                </svg>
              </div>
            ) : (
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#fde8e8]">
                <svg
                  className="h-6 w-6 text-[#e55353]"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18 18 6M6 6l12 12"
                  />
                </svg>
              </div>
            )}
            <h3 className="text-base font-semibold">
              {bookingStatus === "success"
                ? "Booking successful"
                : "Booking failed"}
            </h3>
            <p className="mt-1 text-sm text-[#3878c2]">
              {bookingStatus === "success"
                ? `Reference number: ${referenceNumber || "-"}`
                : "Please try again."}
            </p>
            {bookingStatus === "success" ? (
              <p className="mt-2 text-xs text-[#3878c2]">
                Our staff will provide your total amount. Kindly settle payment via GCash.
              </p>
            ) : null}
            <button
              onClick={() => {
                 if (bookingStatus === "success") {
                   navigate("/payment", {
                     state: {
                       bookingReference: referenceNumber,
                       paymentReference,
                       amountToPay: calculateDownpayment(), 
                       isDownpayment: true,
                     },
                   });
                   return;
                 }
                setIsSuccessOpen(false);
              }}
              className="mt-4 w-full rounded-lg bg-[#4bad40] py-2 text-white"
            >
              {bookingStatus === "success" ? "Proceed to Payment" : "Try again"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================
   Icons
========================= */
function CalendarIcon() {
  return (
    <svg
      className="w-4 h-4 text-[#3878c2]"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 10h16m-8-3V4M7 7V4m10 3V4M5 20h14a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1Zm3-7h.01v.01H8V13Zm4 0h.01v.01H12V13Zm4 0h.01v.01H16V13Zm-8 4h.01v.01H8V17Zm4 0h.01v.01H12V17Zm4 0h.01v.01H16V17Z"
      />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg
      className="w-4 h-4 text-[#3878c2]"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
      />
    </svg>
  );
}
