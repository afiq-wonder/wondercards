"use client";

import { useCallback, useRef, useState } from "react";

import AdventureCreator from "@/components/create/AdventureCreator";
import AdventurePreparing from "@/components/create/AdventurePreparing";
import WonderFlow from "@/components/flow/WonderFlow";
import {
  createWonderAdventure,
  WonderAdventureClientError,
} from "@/lib/wonderAdventureClient";
import type { WonderAdventureRequest } from "@/types/adventureGeneration";
import type { WonderCard } from "@/types/wonderCard";

type AppState = "create" | "preparing" | "adventure";

export default function WonderApp() {
  const [state, setState] = useState<AppState>("create");
  const [card, setCard] = useState<WonderCard | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const activeRequest = useRef<AbortController | null>(null);

  const handleCreate = useCallback(async (input: WonderAdventureRequest) => {
    activeRequest.current?.abort();

    const controller = new AbortController();
    activeRequest.current = controller;
    setErrorMessage(null);
    setState("preparing");

    try {
      const startedAt = Date.now();
      const result = await createWonderAdventure(input, {
        signal: controller.signal,
      });

      // Preserve the emotional pacing even when local generation is instant.
      const minimumWait = 1_250;
      const remainingWait = minimumWait - (Date.now() - startedAt);

      if (remainingWait > 0) {
        await delay(remainingWait, controller.signal);
      }

      setCard(result.card);
      setState("adventure");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }

      const message =
        error instanceof WonderAdventureClientError
          ? error.message
          : "Something interrupted the adventure. Please try again.";

      setErrorMessage(message);
      setState("create");
    } finally {
      if (activeRequest.current === controller) {
        activeRequest.current = null;
      }
    }
  }, []);

  const handleCancel = useCallback(() => {
    activeRequest.current?.abort();
    activeRequest.current = null;
    setState("create");
  }, []);

  if (state === "preparing") {
    return <AdventurePreparing onCancel={handleCancel} />;
  }

  if (state === "adventure" && card) {
    return <WonderFlow card={card} />;
  }

  return (
    <AdventureCreator
      isCreating={false}
      errorMessage={errorMessage}
      onCreate={handleCreate}
    />
  );
}

function delay(milliseconds: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const timeout = window.setTimeout(resolve, milliseconds);

    signal.addEventListener(
      "abort",
      () => {
        window.clearTimeout(timeout);
        reject(new DOMException("Request aborted.", "AbortError"));
      },
      { once: true }
    );
  });
}
