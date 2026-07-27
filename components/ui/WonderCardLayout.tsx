type WonderCardLayoutProps = {
    children: React.ReactNode;
  };
  
  export default function WonderCardLayout({
    children,
  }: WonderCardLayoutProps) {
    return (
      <div
        className="
        relative
        overflow-hidden
        rounded-[42px]
        bg-gradient-to-b
        from-sky-100
        via-white
        to-cyan-50
        p-10
        shadow-2xl
        "
      >
        {/* Ocean Glow */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#ffffff80,transparent_70%)]" />
  
        {/* Floating bubbles */}
        <div className="absolute left-6 top-10 h-5 w-5 animate-pulse rounded-full bg-sky-300/40" />
  
        <div className="absolute right-8 top-24 h-10 w-10 animate-pulse rounded-full bg-cyan-200/30" />
  
        <div className="absolute bottom-20 left-10 h-6 w-6 animate-pulse rounded-full bg-sky-200/40" />
  
        <div className="absolute bottom-36 right-12 h-4 w-4 animate-pulse rounded-full bg-blue-300/40" />
  
        {/* Ocean floor */}
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-sky-200/30 to-transparent" />
  
        <div className="relative z-10">
          {children}
        </div>
      </div>
    );
  }