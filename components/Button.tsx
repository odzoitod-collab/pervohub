import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  isLoading, 
  className = '', 
  ...props 
}) => {
  const baseStyles = "inline-flex items-center justify-center rounded-xl font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none active:scale-95 touch-manipulation";
  
  const variants = {
    primary: "bg-[#0095f6] text-white hover:bg-[#0084e0] focus:ring-[#0095f6]/50 dark:bg-[#0095f6] dark:hover:bg-[#0084e0]",
    secondary: "bg-[#efefef] dark:bg-[#262626] text-[#262626] dark:text-[#fafafa] hover:bg-[#e5e5e5] dark:hover:bg-[#404040] focus:ring-[#0095f6]/30",
    ghost: "bg-transparent text-[#8e8e8e] dark:text-[#a3a3a3] hover:bg-[#f5f5f5] dark:hover:bg-[#262626] hover:text-[#262626] dark:hover:text-[#fafafa]",
    danger: "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 focus:ring-red-500"
  };

  /* Золоте правило: мін. висота 44px (h-11) для основних кнопок */
  const sizes = {
    sm: "min-h-9 h-9 px-3 text-xs",
    md: "min-h-11 h-11 px-4 text-sm",
    lg: "min-h-12 h-12 px-6 text-base"
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center gap-2">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Завантаження...
        </span>
      ) : children}
    </button>
  );
};