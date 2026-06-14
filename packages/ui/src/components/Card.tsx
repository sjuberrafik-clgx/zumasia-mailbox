import type { HTMLAttributes, ReactNode } from 'react';

type CardProps = {
    children: ReactNode;
} & HTMLAttributes<HTMLDivElement>;

export function Card({ children, className, ...rest }: CardProps) {
    const cls = ['zm-card', className].filter(Boolean).join(' ');
    return (
        <div className={cls} {...rest}>
            {children}
        </div>
    );
}
