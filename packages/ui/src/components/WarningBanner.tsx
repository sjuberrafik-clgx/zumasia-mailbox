type WarningBannerProps = {
  title?: string;
  children: React.ReactNode;
};

export function WarningBanner({ title = 'Public service', children }: WarningBannerProps) {
  return (
    <div className="zm-warning" role="status">
      <strong>{title}</strong> — {children}
    </div>
  );
}
