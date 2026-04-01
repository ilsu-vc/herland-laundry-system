import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../../lib/supabase";

const API_BASE = `${import.meta.env.VITE_API_URL}/api/v1/customer`;

export default function Profile() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [feedback, setFeedback] = useState({ type: "", message: "" });
  
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    password: "",
    avatar_url: null,
    address: "",
  });

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/login');
        return;
      }

      const response = await fetch(`${API_BASE}/profile`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const names = (data.full_name || "").split(" ");
        setFormData({
          firstName: names[0] || "",
          lastName: names.slice(1).join(" ") || "",
          phone: data.profile_phone || data.phone || "",
          email: data.email || "",
          password: "", 
          avatar_url: data.avatar_url,
          address: data.address || "",
        });
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      setFeedback({ type: "error", message: "Failed to load profile data." });
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'phone') {
        const cleanValue = value.replace(/\D/g, '').slice(0, 11);
        setFormData({ ...formData, [name]: cleanValue });
        return;
    }
    setFormData({ ...formData, [name]: value });
  };

  const [uploading, setUploading] = useState(false);

  const handleAvatarUpload = async (e) => {
    try {
      setUploading(true);
      setFeedback({ type: "", message: "" });

      if (!e.target.files || e.target.files.length === 0) {
        throw new Error('You must select an image to upload.');
      }

      const file = e.target.files[0];
      const fileExt = file.name.split('.').pop();
      const { data: { user } } = await supabase.auth.getUser();
      // Use folder-based path: userId/random-uuid.ext
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      // 1. Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 2. Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // 3. Update Profile via Backend
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(`${API_BASE}/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ avatar_url: publicUrl }),
      });

      if (response.ok) {
        setFormData(prev => ({ ...prev, avatar_url: publicUrl }));
        setFeedback({ type: "success", message: "Profile picture updated!" });
        // Notify other components
        window.dispatchEvent(new Event('profileUpdated'));
      } else {
        throw new Error("Failed to update profile picture in database.");
      }
    } catch (error) {
      console.error("Error uploading avatar:", error);
      setFeedback({ type: "error", message: error.message || "Upload failed." });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaveLoading(true);
      setFeedback({ type: "", message: "" });

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const payload = {
        name: `${formData.firstName} ${formData.lastName}`.trim(),
        phone: formData.phone,
        address: formData.address,
      };

      if (formData.password) {
        payload.password = formData.password;
      }

      const response = await fetch(`${API_BASE}/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (response.ok) {
        setFeedback({ type: "success", message: "Profile updated successfully!" });
        // Notify other components
        window.dispatchEvent(new Event('profileUpdated'));
        setFormData(prev => ({ ...prev, password: "" })); // Clear password field
        setTimeout(() => setFeedback({ type: "", message: "" }), 3000);
      } else {
        setFeedback({ type: "error", message: result.error || "Update failed." });
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      setFeedback({ type: "error", message: "An error occurred during save." });
    } finally {
      setSaveLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3878c2]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white px-4 py-6 sm:py-10">
      <div className="mx-auto w-full max-w-2xl md:max-w-5xl lg:max-w-6xl">
        <div className="mb-4 flex items-center justify-between">
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
            <h1 className="text-2xl font-semibold">My Profile</h1>
          </div>
          <button
            type="button"
            disabled={saveLoading}
            onClick={handleSave}
            className={`rounded-full border border-[#3878c2] px-4 py-1.5 text-xs font-semibold ${
              saveLoading ? "bg-gray-100 text-gray-400" : "text-[#3878c2] hover:bg-[#3878c2] hover:text-white"
            } transition-colors`}
          >
            {saveLoading ? "Saving..." : "Save Changes"}
          </button>
        </div>

        {feedback.message && (
          <div className={`mb-6 p-4 rounded-xl text-sm ${
            feedback.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}>
            {feedback.message}
          </div>
        )}

        <div className="text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="relative group">
              <div className="flex h-32 w-32 items-center justify-center rounded-full bg-[#eaf2fb] text-[#3878c2] overflow-hidden border-4 border-[#eaf2fb] shadow-sm">
                {formData.avatar_url ? (
                  <img src={formData.avatar_url} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="h-16 w-16"
                  >
                    <path
                      fillRule="evenodd"
                      d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
                {uploading && (
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                  </div>
                )}
              </div>
              
              <label 
                className={`absolute bottom-0 right-0 h-10 w-10 flex items-center justify-center rounded-full bg-[#3878c2] text-white cursor-pointer shadow-md hover:bg-[#2d609c] transition-colors ${uploading ? 'pointer-events-none opacity-50' : ''}`}
                title="Change Profile Picture"
              >
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={uploading} />
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
                </svg>
              </label>
            </div>
            <div className="flex flex-col gap-0.5">
              <p className="text-lg font-bold text-[#3878c2]">{formData.firstName} {formData.lastName}</p>
              <p className="text-xs text-gray-500 font-medium">{formData.email}</p>
              {formData.address && (
                <p className="text-xs text-[#3878c2] mt-1 font-semibold break-words max-w-sm mx-auto text-center">
                  📍 {formData.address}
                </p>
              )}
            </div>
          </div>

          <div className="mt-8 grid gap-4 text-left md:grid-cols-2">
            {/* First Name */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500 ml-1">First Name</label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className="w-full rounded-xl bg-[#f5f9fd] px-3 py-3 text-sm font-semibold text-[#3878c2] outline-none border border-transparent focus:border-[#3878c2]/30"
              />
            </div>

            {/* Last Name */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500 ml-1">Last Name</label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className="w-full rounded-xl bg-[#f5f9fd] px-3 py-3 text-sm font-semibold text-[#3878c2] outline-none border border-transparent focus:border-[#3878c2]/30"
              />
            </div>

            {/* Phone */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500 ml-1">Phone Number</label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full rounded-xl bg-[#f5f9fd] px-3 py-3 text-sm font-semibold text-[#3878c2] outline-none border border-transparent focus:border-[#3878c2]/30"
              />
            </div>

            {/* Address */}
            <div className="flex flex-col gap-1 md:col-span-2">
              <label className="text-xs font-medium text-gray-500 ml-1">Address</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="Enter your exact address for delivery"
                className="w-full rounded-xl bg-[#f5f9fd] px-3 py-3 text-sm font-semibold text-[#3878c2] outline-none border border-transparent focus:border-[#3878c2]/30"
              />
            </div>

            {/* Email - Typically immutable or requires verification */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500 ml-1">Email (Read-only)</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                readOnly
                className="w-full rounded-xl bg-[#f5f9fd] px-3 py-3 text-sm font-semibold text-gray-400 outline-none border border-transparent cursor-not-allowed"
              />
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1 md:col-span-2">
              <label className="text-xs font-medium text-gray-500 ml-1">New Password (leave blank to keep current)</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter new password"
                  className="w-full rounded-xl bg-[#f5f9fd] px-3 py-3 text-sm font-semibold text-[#3878c2] outline-none border border-transparent focus:border-[#3878c2]/30"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 cursor-pointer text-[#3878c2]"
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
