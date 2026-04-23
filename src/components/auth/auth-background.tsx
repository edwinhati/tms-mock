"use client";

export function AuthBackground(): React.ReactNode {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-accent/20 via-background to-background" />
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/10" />
      <div className="absolute top-1/4 -left-20 w-80 h-80 bg-primary/15 rounded-full blur-3xl animate-tide-pulse" />
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-accent/20 rounded-full blur-3xl animate-tide-pulse delay-700" />
      <div className="absolute top-1/2 left-1/3 w-60 h-60 bg-primary/10 rounded-full blur-2xl animate-tide-pulse delay-300" />
      <svg
        className="absolute inset-0 w-full h-full opacity-[0.03]"
        preserveAspectRatio="none"
        role="img"
        aria-label="Decorative wave pattern"
      >
        <defs>
          <pattern
            id="wave-pattern"
            x="0"
            y="0"
            width="100"
            height="40"
            patternUnits="userSpaceOnUse"
          >
            <title>Decorative wave pattern</title>
            <path
              d="M0 20 Q25 5, 50 20 T100 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              className="text-foreground"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#wave-pattern)" />
      </svg>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_100%,var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent" />
    </div>
  );
}
