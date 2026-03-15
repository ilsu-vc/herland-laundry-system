import React, { useState } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { LayoutProvider } from './LayoutContext'
import { PermissionsProvider } from '../shared/permissions/UsePermissions'
import { ToastProvider } from '../shared/components/Toast';
import { ConfirmationProvider } from '../shared/components/ConfirmationModal';

export default function Providers({ children }) {
	const [hideBottomNav, setHideBottomNav] = useState(false)

	return (
		<BrowserRouter>
			<ToastProvider>
				<ConfirmationProvider>
					<PermissionsProvider>
						<LayoutProvider value={{ hideBottomNav, setHideBottomNav }}>
							{children}
						</LayoutProvider>
					</PermissionsProvider>
				</ConfirmationProvider>
			</ToastProvider>
		</BrowserRouter>
	)
}
