import { createContext, useContext, useState, useCallback } from "react";

const PermissionsContext = createContext();

export function PermissionsProvider({ children }) {
  // Always show for testing
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [locationCallback, setLocationCallback] = useState(null);

  // Always trigger modal
  const requestNotificationPermission = useCallback(() => {
    setShowNotificationModal(true);
  }, []);

  const requestLocationPermission = useCallback((callback) => {
    setShowLocationModal(true);
    if (callback) {
      setLocationCallback(() => callback);
    }
  }, []);

  const handleAllowNotifications = () => {
    setShowNotificationModal(false);
  };

  const handleDenyNotifications = () => {
    setShowNotificationModal(false);
  };

  const handleAllowLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setShowLocationModal(false);
          if (locationCallback) {
            locationCallback(true, coords);
            setLocationCallback(null);
          }
        },
        (error) => {
          console.error("Error getting location:", error);
          setShowLocationModal(false);
          if (locationCallback) {
            locationCallback(false, null);
            setLocationCallback(null);
          }
        }
      );
    } else {
      setShowLocationModal(false);
      if (locationCallback) {
        locationCallback(false, null);
        setLocationCallback(null);
      }
    }
  };

  const handleDenyLocation = () => {
    setShowLocationModal(false);
    if (locationCallback) {
      locationCallback(false, null);
      setLocationCallback(null);
    }
  };

  return (
    <PermissionsContext.Provider
      value={{
        requestNotificationPermission,
        requestLocationPermission,
      }}
    >
      {children}

      {/* Notification Permission Modal */}
      {showNotificationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-lg bg-white p-6 text-center shadow-lg">
            
            <div className="mb-4 flex justify-center">
              <img
                src="/images/NotificationPermission.png"
                alt="Notification Permission"
                className="h-20 w-auto"
              />
            </div>

            <h3 className="mb-2 text-lg font-semibold text-[#3878c2]">
              Allow Notifications?
            </h3>
            <p className="mb-6 text-sm text-[#374151]">
              This will help you stay updated on your laundry status
            </p>

            <div className="flex flex-col gap-3">
              <button
                onClick={handleAllowNotifications}
                className="w-full rounded-lg bg-[#4bad40] py-2.5 font-semibold text-white"
              >
                Allow
              </button>
              <button
                onClick={handleDenyNotifications}
                className="w-full rounded-lg border border-[#3878c2] py-2.5 font-semibold text-[#3878c2]"
              >
                Not Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Location Permission Modal */}
      {showLocationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-lg bg-white p-6 text-center shadow-lg">
            
            <div className="mb-4 flex justify-center">
              <img
                src="/images/LocationPermission.png"
                alt="Location Permission"
                className="h-20 w-auto"
              />
            </div>

            <h3 className="mb-2 text-lg font-semibold text-[#3878c2]">
              Allow Location Access?
            </h3>
            <p className="mb-6 text-sm text-[#374151]">
              Help us bring laundry services straight to your doorstep
            </p>

            <div className="flex flex-col gap-3">
              <button
                onClick={handleAllowLocation}
                className="w-full rounded-lg bg-[#4bad40] py-2.5 font-semibold text-white"
              >
                Allow
              </button>
              <button
                onClick={handleDenyLocation}
                className="w-full rounded-lg border border-[#3878c2] py-2.5 font-semibold text-[#3878c2]"
              >
                Not Now
              </button>
            </div>
          </div>
        </div>
      )}
    </PermissionsContext.Provider>
  );
}

export function usePermissions() {
  const context = useContext(PermissionsContext);
  if (!context) {
    throw new Error("usePermissions must be used within a PermissionsProvider");
  }
  return context;
}
