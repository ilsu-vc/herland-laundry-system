import { useNavigate } from 'react-router-dom';
import TopNavbar from '../../shared/navigation/TopNavbar';
import BottomNavbar from '../../shared/navigation/BottomNavbar';

export default function RiderDashboard() {
	const navigate = useNavigate();

	return (
		<div className="relative flex min-h-screen flex-col bg-slate-50">
			<main className="relative flex flex-1 flex-col pb-24">
				{/* Modern Header Banner */}
				<div className="relative h-64 w-full overflow-hidden md:h-80 lg:h-96">
					<img
						src="https://images.unsplash.com/photo-1545173168-9f1947eebb7f?w=800&q=80"
						alt="Delivery Fleet"
						className="h-full w-full object-cover"
					/>
					<div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 to-[#1a232e]/60" />
					<div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
						<h1 className="mb-2 text-2xl font-black leading-tight text-white drop-shadow-md sm:text-3xl md:text-5xl">
							Welcome to the Rider Portal
						</h1>
						<p className="max-w-xl text-sm font-medium leading-tight text-gray-200 drop-shadow-md sm:text-base md:text-xl">
							Pickup and delivery tasks waiting to be managed.
						</p>
					</div>
				</div>

				<div className="mx-auto mt-[-3rem] w-full max-w-md px-6 md:max-w-3xl lg:max-w-5xl relative z-10">
					{/* Primary Action Button for Tasks */}
					<div 
                        className="mb-6 overflow-hidden rounded-2xl bg-white shadow-lg ring-1 ring-black/5 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group cursor-pointer" 
                        onClick={() => navigate('/rider/manage-tasks')}
                    >
					    <div className="p-6 md:p-8 flex items-center justify-between">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 group-hover:text-[#4bad40] transition-colors md:text-2xl">Manage Tasks</h3>
                                <p className="mt-2 leading-relaxed text-sm text-gray-500 max-w-[85%]">
                                    View assigned pickups & deliveries, launch maps, and accept task requests from staff.
                                </p>
                            </div>
                            <div className="flex h-14 w-14 shrink-0 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-[#4bad40]/10 text-[#4bad40] group-hover:scale-110 group-hover:bg-[#4bad40]/20 transition-all">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" className="w-8 h-8 sm:w-10 sm:h-10">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                </svg>
                            </div>
                        </div>
                    </div>

					{/* Quick Links Grid */}
					<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5 hover:shadow-md transition-all cursor-pointer flex items-center gap-4 group" onClick={() => navigate('/rider/notifications')}>
                            <div className="flex h-12 w-12 items-center justify-center shrink-0 rounded-xl bg-[#3878c2]/10 text-[#3878c2]">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" /></svg>
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900 group-hover:text-[#3878c2] transition-colors">Notifications</h3>
                                <p className="text-xs text-gray-500 mt-1">Check alerts and updates</p>
                            </div>
                        </div>

                        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5 hover:shadow-md transition-all cursor-pointer flex items-center gap-4 group" onClick={() => navigate('/profile')}>
                            <div className="flex h-12 w-12 items-center justify-center shrink-0 rounded-xl bg-gray-100 text-gray-600">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" /></svg>
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900 group-hover:text-gray-700 transition-colors">My Profile</h3>
                                <p className="text-xs text-gray-500 mt-1">Manage rider account details</p>
                            </div>
                        </div>
                    </div>
				</div>
			</main>
			<BottomNavbar />
		</div>
	);
}
