import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TopNavbar from '../../shared/navigation/TopNavbar';
import BottomNavbar from '../../shared/navigation/BottomNavbar';
import { supabase } from '../../lib/supabase';

const API_BASE = `${import.meta.env.VITE_API_URL}/api/v1/admin`;

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

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {menuItems.map((item) => (
                            <div 
                                key={item.path}
                                className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5 hover:shadow-md hover:-translate-y-1 transition-all duration-300 cursor-pointer flex items-center gap-4 group" 
                                onClick={() => navigate(item.path)}
                            >
                                <div className={`flex h-12 w-12 items-center justify-center shrink-0 rounded-xl transition-colors ${item.label.includes('Bookings') ? 'bg-[#4bad40]/10 text-[#4bad40] group-hover:bg-[#4bad40]/20' : 'bg-[#3878c2]/10 text-[#3878c2] group-hover:bg-[#3878c2]/20'}`}>
                                    {item.label.includes('Bookings') ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25Z" /></svg>
                                    ) : item.label.includes('Users') || item.label.includes('Employees') || item.label.includes('Admins') ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" /></svg>
                                    ) : item.label.includes('Reports') ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" /></svg>
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.99l1.005.828c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg>
                                    )}
                                </div>
                                <div>
                                    <h3 className={`font-semibold text-gray-900 transition-colors ${item.label.includes('Bookings') ? 'group-hover:text-[#4bad40]' : 'group-hover:text-[#3878c2]'}`}>{item.label}</h3>
                                </div>
                            </div>
                        ))}
                    </div>
				</div>
			</main>

			<BottomNavbar />
		</div>
	);
}
