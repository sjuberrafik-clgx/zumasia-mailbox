import type { ButtonHTMLAttributes, ReactNode } from 'react';

type ButtonProps = {
  variant?: 'default' | 'primary' | 'ghost' | 'danger';
  children: ReactNode;
} & ButtonHTMLAttributes<HTMLButtonElement>;

export function Button({ variant = 'default', children, className, ...rest }: ButtonProps) {
  const variantClass = variant === 'default' ? '' : `zm-button--${variant}`;
  const cls = ['zm-button', variantClass, className]
    .filter(Boolean)
    .join(' ');
  return (
    <button className={cls} {...rest}>
      {children}
    </button>
  );
}
