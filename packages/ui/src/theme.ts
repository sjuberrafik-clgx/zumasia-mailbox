export const theme = {
    colors: {
        bg: '#0b0d10',
        bgSubtle: '#121519',
        surface: '#1a1f25',
        border: '#2a3038',
        text: '#e8edf2',
        textMuted: '#9aa5b1',
        accent: '#6ee7b7',
        accentDark: '#10b981',
        danger: '#ef4444',
        warning: '#f59e0b',
    },
    font: {
        sans: 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        mono: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
    },
    radius: {
        sm: '4px',
        md: '8px',
        lg: '12px',
    },
    space: {
        xs: '4px',
        sm: '8px',
        md: '16px',
        lg: '24px',
        xl: '40px',
    },
} as const;

export type Theme = typeof theme;
