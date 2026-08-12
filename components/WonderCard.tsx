import type { WonderCard } from "@/types/wondercard";

interface WonderCardProps {
  card: WonderCard;
}

export default function WonderCard({
  card,
}: WonderCardProps) {

  return (

    <div className="w-full max-w-xl rounded-3xl bg-white shadow-2xl p-8">

      <div className="text-center space-y-4">

        <div className="text-7xl">

          🐠

        </div>

        <p className="text-sky-600 font-semibold tracking-wide">

          Hey Explorer!

        </p>

        <h1 className="text-4xl font-bold">

          {card.friend}

        </h1>

        <p className="text-slate-500">

          {card.world}

        </p>

        <p className="text-lg text-slate-700">

          How wonderful are you today?

        </p>

      </div>

      <div className="mt-10 space-y-5">

        <h2 className="text-2xl font-bold">

          {card.story.title}

        </h2>

        <p>

          {card.story.intro}

        </p>

        <p>

          {card.story.problem}

        </p>

        <p className="font-semibold">

          {card.story.goal}

        </p>

      </div>

      <div className="mt-10 rounded-2xl bg-sky-50 p-6">

        <h3 className="text-xl font-bold mb-3">

          🎯 Today's Wonder Mission

        </h3>

        <p>

          {card.mission.objective}

        </p>

        <p className="mt-3">

          {card.mission.activity}

        </p>

      </div>

      <div className="mt-8 grid grid-cols-3 gap-4 text-center">

        <div>

          <p className="text-xs uppercase tracking-wide text-slate-400">

            Wonder Value

          </p>

          <p className="font-semibold">

            {card.value}

          </p>

        </div>

        <div>

          <p className="text-xs uppercase tracking-wide text-slate-400">

            Duration

          </p>

          <p className="font-semibold">

            {card.duration} min

          </p>

        </div>

        <div>

          <p className="text-xs uppercase tracking-wide text-slate-400">

            Wonder Score

          </p>

          <p className="font-semibold">

            {card.wonderScore}

          </p>

        </div>

      </div>

      <button
        className="mt-10 w-full rounded-2xl bg-sky-500 py-4 text-white font-bold text-lg transition hover:bg-sky-600"
      >

        ✨ Start Wonder Adventure

      </button>

    </div>

  );

}
