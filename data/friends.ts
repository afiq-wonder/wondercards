import type { WonderFriend } from "@/types/wonderFriend";

export const DEFAULT_WONDER_FRIEND_ID = "coral";

export const wonderFriends: WonderFriend[] = [
  {
    id: "coral",
    name: "Coral",
    emoji: "🐠",
  },
  {
    id: "luna",
    name: "Luna",
    emoji: "🌙",
  },
  {
    id: "pico",
    name: "Pico",
    emoji: "🐧",
  },
  {
    id: "finn",
    name: "Finn",
    emoji: "🐬",
  },
  {
    id: "nova",
    name: "Nova",
    emoji: "⭐",
  },
];

export function getDefaultWonderFriend(): WonderFriend {
  const friend = wonderFriends.find(
    (item) => item.id === DEFAULT_WONDER_FRIEND_ID
  );

  if (!friend) {
    throw new Error(
      `Default Wonder Friend "${DEFAULT_WONDER_FRIEND_ID}" was not found.`
    );
  }

  return friend;
}

export function getWonderFriendById(
  id: string
): WonderFriend {
  const normalisedId = normaliseValue(id);

  return (
    wonderFriends.find(
      (friend) =>
        normaliseValue(friend.id) === normalisedId
    ) ?? getDefaultWonderFriend()
  );
}

export function getWonderFriendByName(
  name: string
): WonderFriend {
  const normalisedName = normaliseValue(name);

  return (
    wonderFriends.find(
      (friend) =>
        normaliseValue(friend.name) ===
        normalisedName
    ) ?? getDefaultWonderFriend()
  );
}

export function getAllWonderFriends(): WonderFriend[] {
  return [...wonderFriends];
}

export function isWonderFriendId(
  id: string
): boolean {
  const normalisedId = normaliseValue(id);

  return wonderFriends.some(
    (friend) =>
      normaliseValue(friend.id) === normalisedId
  );
}

function normaliseValue(value: string): string {
  return value.trim().toLowerCase();
}

export default wonderFriends;