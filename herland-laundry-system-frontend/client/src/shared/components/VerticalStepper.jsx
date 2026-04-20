import { getStatusMeta } from "./StatusMeta";

export default function VerticalStepper({ steps = [] }) {
	return (
		<ul className="relative ml-5 overflow-visible" style={{ borderLeft: "2px solid #b4b4b4" }}>
			{steps.map((step, index) => {
				const dateObj = step.timestamp ? new Date(step.timestamp) : null;

				const formattedDate = dateObj
					? dateObj.toLocaleDateString("en-GB", { day: "2-digit", month: "short" })
					: null;

				const formattedTime = dateObj
					? dateObj.toLocaleTimeString("en-GB", {
							hour: "2-digit",
							minute: "2-digit",
							hour12: false,
						})
					: null;

				const isReached = !!step.timestamp;
				const circleColor = isReached ? getStatusMeta(step.status).color : "#d1d5db";

				return (
					<li 
						key={`${step.status}-${index}`} 
						className="mb-8 ml-10 transition-all duration-300"
						style={{ 
							filter: isReached ? "none" : "blur(1px) grayscale(100%)",
							opacity: isReached ? 1 : 0.5
						}}
					>
						<span
							className="absolute -left-3 flex items-center justify-center w-6 h-6 rounded-full shadow-sm"
							style={{ backgroundColor: circleColor }}
						></span>

						<p className="text-sm font-semibold" style={{ color: "#3878c2" }}>
							{step.status}
						</p>

						{step.timestamp && (
							<p className="text-xs mt-1" style={{ color: "#374151" }}>
								{formattedDate} • {formattedTime}
							</p>
						)}
					</li>
				);
			})}
		</ul>
	);
}
