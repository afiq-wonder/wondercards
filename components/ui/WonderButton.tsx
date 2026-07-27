type WonderButtonProps = {
    title: string;
    onClick: () => void;
  };
  
  export default function WonderButton({
    title,
    onClick,
  }: WonderButtonProps) {
    return (
      <button
        onClick={onClick}
        className="
        w-full
        rounded-full
        bg-gradient-to-r
        from-sky-500
        to-cyan-500
        py-5
        text-xl
        font-bold
        text-white
        shadow-xl
        transition
        duration-300
        hover:-translate-y-1
        hover:scale-105
        active:scale-95
        "
      >
        {title}
      </button>
    );
  }