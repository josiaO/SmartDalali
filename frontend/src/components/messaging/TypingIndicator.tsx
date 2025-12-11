import React from 'react';

export const TypingIndicator = () => {
    return (
        <div className="flex items-center space-x-1 p-2 bg-card/80 backdrop-blur-sm rounded-2xl rounded-bl-none shadow-sm border border-border w-fit mb-4 animate-slide-in-left dark:bg-slate-800/80">
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
        </div>
    );
};
