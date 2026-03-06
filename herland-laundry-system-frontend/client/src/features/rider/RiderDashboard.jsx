import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { formatDate, formatTime, getRouteAddresses } from '../../shared/utils/formatters'
import { supabase } from '../../lib/supabase'



export default function RiderDashboard() {
	const navigate = useNavigate()
	const [bookings, setBookings] = useState([])
	const [availableBookings, setAvailableBookings] = useState([])
	const [activeTab, setActiveTab] = useState('available') // 'available' or 'assigned'
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState(null)
	const [expandedId, setExpandedId] = useState(null)

	const fetchAll = async () => {
		try {
			setLoading(true)
			const { data: { session } } = await supabase.auth.getSession()
			const token = session?.access_token

			if (!token) {
				setError('Please log in to view assigned bookings.')
				setLoading(false)
				return
			}

			// Fetch Available
			const resAvailable = await fetch('http://localhost:5000/api/v1/rider/available-bookings', {
				headers: { Authorization: `Bearer ${token}` },
			})
			const dataAvailable = resAvailable.ok ? await resAvailable.json() : []

			// Fetch Assigned
			const resAssigned = await fetch('http://localhost:5000/api/v1/rider/assigned-bookings', {
				headers: { Authorization: `Bearer ${token}` },
			})
			const dataAssigned = resAssigned.ok ? await resAssigned.json() : []

			setAvailableBookings(dataAvailable)
			setBookings(dataAssigned)
			setError(null)
		} catch (err) {
			console.error('Error fetching rider bookings:', err)
			setError('Could not load bookings. Please try again later.')
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		fetchAll()
	}, [])

	const handleAccept = async (id) => {
		try {
			const { data: { session } } = await supabase.auth.getSession()
			const token = session?.access_token
			const response = await fetch(`http://localhost:5000/api/v1/rider/accept/${id}`, {
				method: 'PATCH',
				headers: { Authorization: `Bearer ${token}` },
			})
			if (response.ok) {
				await fetchAll()
				setActiveTab('assigned')
			} else {
				const err = await response.json()
				alert(err.error || 'Failed to accept booking')
			}
		} catch (err) {
			console.error('Accept error:', err)
		}
	}

	const handleDecline = async (id) => {
		if (!window.confirm('Are you sure you want to decline this assignment? It will be hidden from your pool.')) return
		try {
			const { data: { session } } = await supabase.auth.getSession()
			const token = session?.access_token
			const response = await fetch(`http://localhost:5000/api/v1/rider/decline/${id}`, {
				method: 'PATCH',
				headers: { Authorization: `Bearer ${token}` },
			})
			if (response.ok) {
				await fetchAll()
			} else {
				alert('Failed to decline booking')
			}
		} catch (err) {
			console.error('Decline error:', err)
		}
	}

	const mapBookingData = (dataList) => {
		return dataList.map((booking, index) => {
			const collectionDetails = booking.collection_details || {}
			const fallbackRoute = getRouteAddresses(collectionDetails.option)

			return {
				id: booking.reference_number || booking.id,
				dbId: booking.id,
				customerName: booking.customerName || 'Customer',
				pickupAddress: collectionDetails.pickupAddress || fallbackRoute.pickupAddress,
				pickupDate: collectionDetails.collectionDate || '',
				pickupTime: collectionDetails.collectionTime || '',
				deliveryAddress: booking.customerAddress || collectionDetails.deliveryAddress || fallbackRoute.deliveryAddress,
				deliveryDate: collectionDetails.deliveryDate || '',
				deliveryTime: collectionDetails.deliveryTime || '',
			}
		})
	}

	const currentBookings = activeTab === 'available' 
		? mapBookingData(availableBookings) 
		: mapBookingData(bookings)

	const selectedBooking = useMemo(
		() => currentBookings.find((booking) => booking.id === expandedId) || null,
		[currentBookings, expandedId]
	)

	const toggleExpand = (id) => setExpandedId((prev) => (prev === id ? null : id))

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
					<h1 className="text-2xl font-semibold">Manage Tasks</h1>
				</header>

				{/* Tabs */}
				<div className="mb-6 flex border-b border-[#3878c2]/20">
					<button
						onClick={() => setActiveTab('available')}
						className={`px-4 py-2 text-sm font-semibold transition ${activeTab === 'available' ? 'border-b-2 border-[#3878c2] text-[#3878c2]' : 'text-[#b4b4b4]'}`}
					>
						Available Tasks ({availableBookings.length})
					</button>
					<button
						onClick={() => setActiveTab('assigned')}
						className={`px-4 py-2 text-sm font-semibold transition ${activeTab === 'assigned' ? 'border-b-2 border-[#3878c2] text-[#3878c2]' : 'text-[#b4b4b4]'}`}
					>
						My Assignments ({bookings.length})
					</button>
				</div>

				<div className="grid gap-4 md:grid-cols-2">
					{loading && <p className="col-span-full text-sm text-[#3878c2]">Updating tasks...</p>}
					{error && <p className="col-span-full text-sm text-[#e55353]">{error}</p>}
					{!loading && !error && currentBookings.length === 0 && (
						<p className="col-span-full text-sm text-[#374151]">No tasks found in this category.</p>
					)}

					{currentBookings.map((booking) => (
						<section key={booking.id} className="rounded-2xl border border-[#3878c2] bg-white p-4 shadow-sm flex flex-col">
							<button type="button" onClick={() => toggleExpand(booking.id)} className="w-full text-left">
								<h2 className="text-base font-semibold text-[#3878c2]">{booking.customerName}</h2>
							</button>

							<div className="mt-4 grid gap-4 sm:grid-cols-2 flex-grow">
								<div>
									<p className="text-xs font-semibold text-[#3878c2]">Pickup From</p>
									<p className="mt-1 text-sm text-[#374151] line-clamp-2">{booking.pickupAddress || '-'}</p>
									<p className="mt-1 text-xs text-[#374151]">
										{formatDate(booking.pickupDate)} • {formatTime(booking.pickupTime)}
									</p>
								</div>

								<div>
									<p className="text-xs font-semibold text-[#3878c2]">Deliver To</p>
									<p className="mt-1 text-sm text-[#374151] line-clamp-2">{booking.deliveryAddress || '-'}</p>
									<p className="mt-1 text-xs text-[#374151]">
										{formatDate(booking.deliveryDate)} • {formatTime(booking.deliveryTime)}
									</p>
								</div>
							</div>

							{activeTab === 'available' ? (
								<div className="mt-4 flex gap-2">
									<button
										onClick={() => handleAccept(booking.dbId)}
										className="flex-1 rounded-lg bg-[#4bad40] px-3 py-2 text-xs font-bold text-white shadow-sm hover:opacity-90 transition"
									>
										Accept Assignment
									</button>
									<button
										onClick={() => handleDecline(booking.dbId)}
										className="rounded-lg border border-[#e55353] px-3 py-2 text-xs font-bold text-[#e55353] hover:bg-[#e55353]/5 transition"
									>
										Decline
									</button>
								</div>
							) : (
								<button
									onClick={() => toggleExpand(booking.id)}
									className="mt-4 w-full rounded-lg border border-[#3878c2] px-3 py-2 text-xs font-bold text-[#3878c2] hover:bg-[#3878c2]/5 transition"
								>
									View Details & Map
								</button>
							)}
						</section>
					))}
				</div>
			</div>

			{selectedBooking && (
				<div className="fixed inset-0 z-50 overflow-y-auto bg-white px-4 py-6 sm:py-10">
					<div className="mx-auto w-full max-w-2xl md:max-w-5xl lg:max-w-6xl">
						<header className="mb-6 flex items-center gap-2 text-[#3878c2]">
							<button
								type="button"
								onClick={() => setExpandedId(null)}
								className="inline-flex items-center"
								aria-label="Back to bookings"
							>
								<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
									<path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
								</svg>
							</button>
							<h1 className="text-2xl font-semibold">Booking Details</h1>
						</header>

						<div className="bg-white">
							<div className="flex justify-between items-start mb-6">
								<div>
									<h2 className="text-xl font-bold text-[#3878c2]">{selectedBooking.customerName}</h2>
									<p className="text-sm text-[#b4b4b4]">Ref: {selectedBooking.id}</p>
								</div>
								{activeTab === 'assigned' && (
									<div className="flex flex-col gap-2">
										<button
											onClick={() => navigate(`/bookings/${selectedBooking.dbId}/receipt`)}
											className="rounded-lg border border-[#4bad40] px-4 py-2 text-sm font-bold text-[#4bad40] hover:bg-[#4bad40]/5 transition"
										>
											View Receipt
										</button>
									</div>
								)}
							</div>

							<div className="grid gap-6 md:grid-cols-2">
								<div className="rounded-2xl border border-[#3878c2]/20 p-6">
									<p className="text-xs font-semibold uppercase tracking-wider text-[#b4b4b4] mb-3">Pickup Information</p>
									<p className="text-base text-[#374151] font-medium mb-2">{selectedBooking.pickupAddress || '-'}</p>
									<div className="flex items-center gap-4 text-sm text-[#3878c2]">
										<span>{formatDate(selectedBooking.pickupDate)}</span>
										<span>{formatTime(selectedBooking.pickupTime)}</span>
									</div>
								</div>

								<div className="rounded-2xl border border-[#3878c2]/20 p-6">
									<p className="text-xs font-semibold uppercase tracking-wider text-[#b4b4b4] mb-3">Delivery Information</p>
									<p className="text-base text-[#374151] font-medium mb-2">{selectedBooking.deliveryAddress || '-'}</p>
									<div className="flex items-center gap-4 text-sm text-[#3878c2]">
										<span>{formatDate(selectedBooking.deliveryDate)}</span>
										<span>{formatTime(selectedBooking.deliveryTime)}</span>
									</div>
								</div>
							</div>

							<div className="mt-8 rounded-2xl border border-[#b4b4b4] p-6">
								<p className="text-xs font-semibold text-[#3878c2] uppercase mb-4">Route Map</p>
								<div className="min-h-64 rounded-xl border border-[#b4b4b4] bg-[#f9fbff] flex items-center justify-center text-[#b4b4b4] italic" aria-label="Map placeholder">
									Interactive Map Integration Coming Soon
								</div>
							</div>

							{activeTab === 'available' && (
								<div className="mt-8 flex gap-4">
									<button
										onClick={() => handleAccept(selectedBooking.dbId)}
										className="flex-1 rounded-xl bg-[#4bad40] py-4 text-lg font-bold text-white shadow-lg hover:opacity-90 transition"
									>
										Accept Assignment
									</button>
									<button
										onClick={() => handleDecline(selectedBooking.dbId)}
										className="rounded-xl border-2 border-[#e55353] px-8 py-4 text-lg font-bold text-[#e55353] hover:bg-[#e55353]/5 transition"
									>
										Decline
									</button>
								</div>
							)}
						</div>
					</div>
				</div>
			)}
		</div>
	)
}
