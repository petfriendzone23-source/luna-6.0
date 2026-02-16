import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className = '', 
  ...props 
}) => {
  const baseStyles = "inline-flex items-center justify-center rounded-2xl font-bold transition-all duration-300 focus:outline-none active:scale-95 disabled:opacity-50 select-none";
  
  const variants = {
    primary: "bg-theme-primary text-white hover:brightness-110 shadow-lg shadow-theme-primary/30 border-b-4 border-black/10",
    secondary: "bg-theme-light text-theme-primary hover:bg-theme-soft shadow-sm border border-theme-soft",
    outline: "border-2 border-theme-primary text-theme-primary hover:bg-theme-primary hover:text-white shadow-sm",
    ghost: "text-gray-500 hover:bg-gray-100 hover:text-gray-800"
  };

  const sizes = {
    sm: "px-4 py-2 text-xs",
    md: "px-6 py-3 text-sm",
    lg: "px-8 py-5 text-base"
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`} 
      {...props}
    >
      {children}
    </button>
  );
};