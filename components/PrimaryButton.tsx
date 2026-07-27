type PrimaryButtonProps = {
    label: string;
  };
  
  export default function PrimaryButton({
    label,
  }: PrimaryButtonProps) {
    return (
      <button className="w-full rounded-2xl bg-sky-600 py-4 text-lg font-semibold text-white hover:bg-sky-700 transition">
        {label}
      </button>
    );
  }