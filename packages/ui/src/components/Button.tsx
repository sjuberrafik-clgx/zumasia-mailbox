import type { ButtonHTMLAttributes, ReactNode } from 'react';

type ButtonProps = {
    variant?: 'default' | 'primary';
    children: ReactNode;
} & ButtonHTMLAttributes<HTMLButtonElement>;

export function Button({ variant = 'default', children, className, ...rest }: ButtonProps) {
    const cls = ['zm-button', variant === 'primary' ? 'zm-button--primary' : '', className]
        .filter(Boolean)
        .join(' ');
    return (
        <button className={cls} {...rest}>
            {children}
        </button>
    );
}
