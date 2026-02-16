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
  const baseStyles = "inline-flex items-center justify-center rounded-3xl font-black transition-all duration-300 focus:outline-none active:scale-90 disabled:opacity-50 select-none uppercase tracking-widest";
  
  const variants = {
    primary: "bg-theme-primary text-white hover:brightness-110 shadow-[0_10px_30px_rgba(var(--primary-rgb),0.4)] border-b-8 border-black/20",
    secondary: "bg-theme-light text-theme-primary hover:bg-theme-soft shadow-xl border-4 border-theme-soft",
    outline: "border-4 border-theme-primary text-theme-primary hover:bg-theme-primary hover:text-white shadow-lg bg-white",
    ghost: "text-gray-500 hover:bg-gray-100 hover:text-gray-800 font-bold"
  };

  const sizes = {
    sm: "px-6 py-3 text-[10px]",
    md: "px-8 py-4 text-xs",
    lg: "px-10 py-6 text-base"
  };

  // Helper para injetar a cor RGB na sombra (opcional, simplificando aqui para usar classes fixas)
  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`} 
      {...props}
    >
      {children}
    </button>
  );
};