import { createContext, useContext, ReactNode } from 'react';
import { toast as sonnerToast } from 'sonner';
import { TOAST_MESSAGES } from '@/lib/constants';

interface UIContextType {
    showComingSoon: () => void;
    showMessagingDisabled: () => void;
    showPaymentsDisabled: () => void;
    showSuccess: (message: string) => void;
    showError: (message: string) => void;
    showInfo: (message: string) => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export function UIProvider({ children }: { children: ReactNode }) {
    const showComingSoon = () => {
        sonnerToast.info(TOAST_MESSAGES.COMING_SOON.title, {
            description: TOAST_MESSAGES.COMING_SOON.description,
        });
    };

    const showMessagingDisabled = () => {
        sonnerToast.info(TOAST_MESSAGES.MESSAGING_DISABLED.title, {
            description: TOAST_MESSAGES.MESSAGING_DISABLED.description,
        });
    };

    const showPaymentsDisabled = () => {
        sonnerToast.info(TOAST_MESSAGES.PAYMENTS_DISABLED.title, {
            description: TOAST_MESSAGES.PAYMENTS_DISABLED.description,
        });
    };

    const showSuccess = (message: string) => {
        sonnerToast.success(message);
    };

    const showError = (message: string) => {
        sonnerToast.error(message);
    };

    const showInfo = (message: string) => {
        sonnerToast.info(message);
    };

    return (
        <UIContext.Provider
            value={{
                showComingSoon,
                showMessagingDisabled,
                showPaymentsDisabled,
                showSuccess,
                showError,
                showInfo,
            }}
        >
            {children}
        </UIContext.Provider>
    );
}

export function useUI() {
    const context = useContext(UIContext);
    if (context === undefined) {
        throw new Error('useUI must be used within a UIProvider');
    }
    return context;
}
