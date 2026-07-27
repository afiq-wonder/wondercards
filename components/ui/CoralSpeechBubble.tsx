type CoralSpeechBubbleProps = {
    text: string;
  };
  
  export default function CoralSpeechBubble({
    text,
  }: CoralSpeechBubbleProps) {
    return (
      <div
        className="
          relative
          mt-6
          max-w-md
          rounded-[34px]
          border
          border-sky-100
          bg-white
          px-8
          py-7
          shadow-xl
          transition
          duration-300
          hover:scale-[1.02]
        "
      >
        {/* Bubble Tail */}
        <div className="absolute -bottom-3 left-12 h-6 w-6 rotate-45 border-r border-b border-sky-100 bg-white" />
  
        <p
          className="
            text-lg
            leading-8
            font-medium
            text-slate-700
          "
        >
          {text}
        </p>
      </div>
    );
  }