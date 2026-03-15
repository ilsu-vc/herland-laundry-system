import React, { createContext, useContext, useState, useCallback } from 'react';

const ConfirmationContext = createContext(null);

export const useConfirm = () => {
    const context = useContext(ConfirmationContext);
    if (!context) {
        throw new Error('useConfirm must be used within a ConfirmationProvider');
    }
    return context.confirm;
};

export const ConfirmationProvider = ({ children }) => {
    const [config, setConfig] = useState(null);

    const confirm = useCallback((message, options = {}) => {
        return new Promise((resolve) => {
            setConfig({
                message,
                title: options.title || 'Are you sure?',
                confirmLabel: options.confirmLabel || 'Confirm',
                cancelLabel: options.cancelLabel || 'Cancel',
                variant: options.variant || 'danger', // danger, info, success
                resolve,
            });
        });
    }, []);

    const handleConfirm = () => {
        const resolve = config?.resolve;
        setConfig(null);
        if (resolve) resolve(true);
    };

    const handleCancel = () => {
        const resolve = config?.resolve;
        setConfig(null);
        if (resolve) resolve(false);
    };

    return (
        <ConfirmationContext.Provider value={{ confirm }}>
            {children}
            {config && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 transition-all animate-in fade-in duration-200">
                    <div className="w-full max-w-sm scale-110 transform rounded-2xl bg-white p-6 shadow-2xl transition-all animate-in zoom-in-95 duration-200">
                        <div className="mb-4">
                            <h3 className="text-xl font-bold text-[#3878c2]">{config.title}</h3>
                            <p className="mt-2 text-sm text-gray-600 leading-relaxed">{config.message}</p>
                        </div>
                        <div className="mt-6 flex items-center justify-end gap-3">
                            <button
                                onClick={handleCancel}
                                className="rounded-lg px-4 py-2 text-sm font-semibold text-gray-500 hover:bg-gray-100 transition-colors"
                            >
                                {config.cancelLabel}
                            </button>
                            <button
                                onClick={handleConfirm}
                                className={`rounded-lg px-6 py-2 text-sm font-semibold text-white shadow-sm transition-all active:scale-95 ${
                                    config.variant === 'danger' 
                                        ? 'bg-[#e55353] hover:bg-[#d44343]' 
                                        : 'bg-[#4bad40] hover:bg-[#3e8e35]'
                                }`}
                            >
                                {config.confirmLabel}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </ConfirmationContext.Provider>
    );
};
