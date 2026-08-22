import { apiUrl } from "../api/url";

export const CHAT_CHANNEL_CAP = 100;
export const CHAT_CHANNEL_COUNT = 6;

export type ChatTab = "world" | "friends" | "guild";

export type ChatMsgDto = {
  id: number;
  uid?: string;
  nick: string;
  text: string;
  at: number;
  self?: boolean;
};

export type ChatChannelDto = {
  id: number;
  users: number;
  full?: boolean;
};

export type ChatFriendDto = {
  uid: string;
  nick: string;
  level: number;
  guildName: string | null;
  online?: boolean;
  lastSeen?: number;
  seen?: { kind: "online" | "hours" | "days" | "months" | "long"; n?: number };
  status?: string;
};

export type ChatSnapshot = {
  ok: true;
  tab: ChatTab;
  channelId: number;
  peerUid: string | null;
  selfUid: string;
  reset: boolean;
  after: number;
  channels: ChatChannelDto[];
  friends: ChatFriendDto[];
  messages: ChatMsgDto[];
};

export type ChatJoinBody = {
  tab: ChatTab;
  channel?: number;
  peer?: string | null;
  profile?: { level?: number; guildName?: string | null };
};

export type ChatApiOk<T> = { ok: true; data: T };
export type ChatApiErr = {
  ok: false;
  error: string;
  status: number;
  suggested?: number;
  channels?: ChatChannelDto[];
};
export type ChatApiResult<T> = ChatApiOk<T> | ChatApiErr;

type ChatErrorBody = {
  error?: string;
  suggested?: number;
  channels?: ChatChannelDto[];
};

async function chatFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<ChatApiResult<T>> {
  try {
    const res = await fetch(apiUrl(path), {
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
      ...init,
    });
    const body = (await res.json().catch(() => ({}))) as ChatErrorBody & T;
    if (!res.ok) {
      return {
        ok: false,
        error: String(body.error ?? "server_error"),
        status: res.status,
        suggested: body.suggested,
        channels: body.channels,
      };
    }
    return { ok: true, data: body as T };
  } catch {
    return { ok: false, error: "unavailable", status: 0 };
  }
}

export function chatJoin(body: ChatJoinBody): Promise<ChatApiResult<ChatSnapshot>> {
  return chatFetch<ChatSnapshot>("/api/chat/join", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function chatPoll(
  after: number,
  opts: { tab: ChatTab; peer?: string | null },
): Promise<ChatApiResult<ChatSnapshot>> {
  const q = new URLSearchParams();
  q.set("after", String(after));
  q.set("tab", opts.tab);
  if (opts.peer) q.set("peer", opts.peer);
  return chatFetch<ChatSnapshot>(`/api/chat?${q.toString()}`);
}

export function chatSend(
  text: string,
): Promise<ChatApiResult<ChatSnapshot & { message: ChatMsgDto }>> {
  return chatFetch("/api/chat/send", {
    method: "POST",
    body: JSON.stringify({ text }),
  });
}

export function chatLeave(): Promise<ChatApiResult<{ ok: boolean }>> {
  return chatFetch("/api/chat/leave", {
    method: "POST",
    body: "{}",
    keepalive: true,
  });
}

export type SocialState = {
  ok: true;
  friends: ChatFriendDto[];
  incoming: ChatFriendDto[];
  outgoing: ChatFriendDto[];
  gifts: { id: string; from: string; energy: number }[];
};

export type SocialProfile = {
  ok: true;
  uid: string;
  nick: string;
  level: number;
  guildName: string | null;
  status: string;
  friends: boolean;
  online?: boolean;
  lastSeen?: number;
  seen?: { kind: "online" | "hours" | "days" | "months" | "long"; n?: number };
};

export function socialFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<ChatApiResult<T>> {
  return chatFetch<T>(path, init);
}

export function socialLoad(): Promise<ChatApiResult<SocialState>> {
  return chatFetch("/api/social");
}

export function socialProfile(uid: string): Promise<ChatApiResult<SocialProfile>> {
  return chatFetch(`/api/social/profile?uid=${encodeURIComponent(uid)}`);
}

export function socialRequest(body: {
  uid?: string;
  nick?: string;
}): Promise<ChatApiResult<SocialState & { status?: string }>> {
  return chatFetch("/api/social/request", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function socialAccept(uid: string): Promise<ChatApiResult<SocialState>> {
  return chatFetch("/api/social/accept", {
    method: "POST",
    body: JSON.stringify({ uid }),
  });
}

export function socialReject(uid: string): Promise<ChatApiResult<SocialState>> {
  return chatFetch("/api/social/reject", {
    method: "POST",
    body: JSON.stringify({ uid }),
  });
}

export function socialRemove(uid: string): Promise<ChatApiResult<SocialState>> {
  return chatFetch("/api/social/remove", {
    method: "POST",
    body: JSON.stringify({ uid }),
  });
}

export function socialSendEnergy(
  uid: string,
): Promise<ChatApiResult<SocialState & { friendship?: number }>> {
  return chatFetch("/api/social/energy", {
    method: "POST",
    body: JSON.stringify({ uid }),
  });
}
