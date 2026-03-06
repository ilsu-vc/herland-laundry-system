import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TopNavbar from '../../shared/navigation/TopNavbar';
import BottomNavbar from '../../shared/navigation/BottomNavbar';
import { supabase } from '../../lib/supabase';

const API_BASE = 'http://localhost:5000/api/v1/admin';

const menuItems = [
	{ label: 'Manage Bookings', path: '/admin/manage-bookings' },
	{ label: 'Manage Employees', path: '/admin/manage-employees' },
	{ label: 'Manage Admins', path: '/admin/manage-admins' },
	{ label: 'Manage Services', path: '/admin/manage-services' },
	{ label: 'Manage Users', path: '/admin/manage-users' },
	{ label: 'Reports', path: '/admin/reports' },
];

export default function AdminDashboard() {
	const navigate = useNavigate();
	const [stats, setStats] = useState({ total_bookings: 0, completed_bookings: 0, estimated_revenue: 0, formatted_revenue: '₱0.00' });
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const fetchStats = async () => {
			try {
				const { data: { session } } = await supabase.auth.getSession();
				const token = session?.access_token;
				const response = await fetch(`${API_BASE}/dashboard-stats`, {
					headers: { Authorization: `Bearer ${token}` }
				});
				if (response.ok) {
					const data = await response.json();
					setStats(data);
				}
			} catch (err) {
				console.error('Error fetching admin stats:', err);
			} finally {
				setLoading(false);
			}
		};
		fetchStats();
	}, []);

	return (
		<div className="relative flex min-h-screen flex-col bg-white">
			<main className="relative flex flex-1 flex-col pb-24">
				<div className="relative h-64 w-full overflow-hidden md:h-80 lg:h-96">
					<img
						src="https://images.unsplash.com/photo-1545173168-9f1947eebb7f?w=800&q=80"
						alt="Laundry Shop"
						className="h-full w-full object-cover"
					/>
					<div className="absolute inset-0 flex flex-col items-center justify-center bg-herland-blue/50 p-4 text-center">
						<h1 className="mb-2 text-xl font-bold leading-tight text-white drop-shadow-lg md:text-3xl lg:text-4xl">
							This is the Admin Dashboard!
						</h1>
						<h2 className="text-lg font-bold leading-tight text-white drop-shadow-lg md:text-2xl lg:text-3xl">
							What do you want to do today?
						</h2>
					</div>
				</div>

				<div className="mx-auto w-full max-w-md px-6 py-8 md:max-w-3xl lg:max-w-5xl">
					{/* Stats Grid */}
					<div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
						<div className="rounded-2xl border border-[#3878c2]/20 bg-white p-4 text-center shadow-sm">
							<p className="text-xs font-semibold uppercase tracking-wider text-[#b4b4b4]">Revenue</p>
							<p className="mt-1 text-2xl font-black text-[#4bad40]">{loading ? '...' : stats.formatted_revenue}</p>
						</div>
						<div className="rounded-2xl border border-[#3878c2]/20 bg-white p-4 text-center shadow-sm">
							<p className="text-xs font-semibold uppercase tracking-wider text-[#b4b4b4]">Active Bookings</p>
							<p className="mt-1 text-2xl font-black text-[#3878c2]">{loading ? '...' : stats.total_bookings}</p>
						</div>
						<div className="rounded-2xl border border-[#3878c2]/20 bg-white p-4 text-center shadow-sm">
							<p className="text-xs font-semibold uppercase tracking-wider text-[#b4b4b4]">Completed</p>
							<p className="mt-1 text-2xl font-black text-herland-blue">{loading ? '...' : stats.completed_bookings}</p>
						</div>
					</div>

					<div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
						{menuItems.map((item) => (
							<button
								key={item.path}
								type="button"
								className="w-full rounded-full border-none bg-herland-green px-6 py-4 text-sm font-semibold text-white shadow-md outline-none transition-all hover:opacity-90 active:scale-95 md:text-base"
								onClick={() => navigate(item.path)}
							>
								{item.label}
							</button>
						))}
					</div>
				</div>
			</main>

			<BottomNavbar />
		</div>
	);
}
