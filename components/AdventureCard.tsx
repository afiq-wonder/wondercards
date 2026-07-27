type AdventureCardProps = {
    emoji: string;
    title: string;
    description: string;
    duration: string;
    category: string;
    activityType: string;
    memoryMoment: string;
  };
  
  export default function AdventureCard({
    emoji,
    title,
    description,
    duration,
    category,
    activityType,
    memoryMoment,
  }: AdventureCardProps) {
    return (
      <div className="rounded-3xl bg-white p-6 shadow-lg text-left">
  
        <p className="text-sm text-slate-500">
          Today's Adventure
        </p>
  
        <h2 className="mt-2 text-2xl font-bold text-slate-900">
          {emoji} {title}
        </h2>
  
        <p className="mt-3 text-slate-600">
          {description}
        </p>
  
        <div className="mt-6 flex flex-wrap gap-4 text-sm text-slate-500">
          <span>⏱ {duration}</span>
          <span>👨‍👩‍👧 {category}</span>
          <span>🌳 {activityType}</span>
        </div>
  
        <div className="mt-6 rounded-2xl bg-sky-50 p-4">
          <p className="text-xs uppercase tracking-wide text-sky-700 font-semibold">
            Wonder Memory
          </p>
  
          <p className="mt-2 text-slate-700">
            💛 {memoryMoment}
          </p>
        </div>
  
      </div>
    );
  }