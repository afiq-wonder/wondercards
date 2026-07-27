type HeroProps = {
    title: string;
    subtitle: string;
  };
  
  export default function Hero({
    title,
    subtitle,
  }: HeroProps) {
    return (
      <div>
        <p className="text-sky-600 uppercase tracking-[0.3em] text-sm font-semibold">
          WonderLabs
        </p>
  
        <h1 className="mt-4 text-4xl md:text-5xl font-bold text-slate-900">
          {title}
        </h1>
  
        <p className="mt-3 text-base md:text-lg text-slate-600">
          {subtitle}
        </p>
      </div>
    );
  }