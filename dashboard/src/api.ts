export type Guild = {
  id: string;
  name: string;
  icon: string | null;
  botPresent: boolean;
  canManage: boolean;
};

export type PromptKind = 'random' | 'fanfic' | 'otp' | 'oc' | 'other';

export const kindLabels: Record<PromptKind, string> = {
  random: 'Random prompt',
  fanfic: 'Fanfic prompt',
  otp: 'OTP prompt',
  oc: 'OC generator',
  other: 'Other',
};

export type SavedPrompt = {
  id: string;
  displayName: string;
  guildId: string | null;
  guildName: string | null;
  kind: PromptKind;
  content: string;
  createdAt: string;
};

async function checkResponse(response: Response): Promise<Response> {
  if (!response.ok) {
    const body = (await response.json()) as { error?: string };
    throw new Error(body.error ?? `Request failed (${response.status})`);
  }
  return response;
}

export async function getJson<T>(url: string): Promise<T> {
  const response = await checkResponse(
    await fetch(url, { credentials: 'same-origin' }),
  );
  return response.json();
}

export async function mutate(
  url: string,
  method: 'PUT' | 'POST' | 'DELETE',
  body?: unknown,
): Promise<Response> {
  return checkResponse(
    await fetch(url, {
      method,
      credentials: 'same-origin',
      ...(body === undefined
        ? {}
        : {
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          }),
    }),
  );
}

export function errorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : 'The request could not be completed.';
}
