import { useEffect, useState, type FormEvent } from 'react';
import { errorMessage, getJson, mutate } from '../../../lib/api';
import type { Mapping, RoleMessage } from '../types';
import type { CommandSettings } from './useCommandSettings';

export function useReactionRoleEditor({
  base,
  details,
  setDetails,
  setError,
}: CommandSettings) {
  const [channelQuery, setChannelQuery] = useState('');
  const [channelId, setChannelId] = useState('');
  const [content, setContent] = useState('');
  const [mappings, setMappings] = useState<Mapping[]>([
    { emoji: '', roleId: '' },
  ]);
  const [editing, setEditing] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    setChannelId(details?.channels[0]?.id ?? '');
  }, [details?.channels]);

  function clearEditor() {
    setEditing('');
    setContent('');
    setMappings([{ emoji: '', roleId: '' }]);
    setChannelQuery('');
    setChannelId(details?.channels[0]?.id ?? '');
  }
  function editMessage(message: RoleMessage) {
    setEditing(message.messageId);
    setChannelId(message.channelId);
    setChannelQuery('');
    setContent(message.content);
    setMappings(message.mappings.map((mapping) => ({ ...mapping })));
    setError('');
  }
  async function saveMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await mutate(
        `${base}/reaction-roles${editing ? `/${editing}` : ''}`,
        editing ? 'PUT' : 'POST',
        { channelId, content, mappings },
      );
      const messages = await getJson<RoleMessage[]>(`${base}/reaction-roles`);
      setDetails((current) => (current ? { ...current, messages } : current));
      clearEditor();
    } catch (saveError) {
      setError(errorMessage(saveError));
    } finally {
      setBusy(false);
    }
  }
  async function deleteMessage(messageId: string) {
    if (!window.confirm('Delete this reaction-role message from Discord?'))
      return;
    setBusy(true);
    setError('');
    try {
      await mutate(`${base}/reaction-roles/${messageId}`, 'DELETE');
      setDetails((current) =>
        current
          ? {
              ...current,
              messages: current.messages.filter(
                (message) => message.messageId !== messageId,
              ),
            }
          : current,
      );
      if (editing === messageId) clearEditor();
    } catch (deleteError) {
      setError(errorMessage(deleteError));
    } finally {
      setBusy(false);
    }
  }
  function updateMapping(index: number, patch: Partial<Mapping>) {
    setMappings((current) =>
      current.map((mapping, itemIndex) =>
        itemIndex === index ? { ...mapping, ...patch } : mapping,
      ),
    );
  }
  const addMapping = () =>
    setMappings((current) => [...current, { emoji: '', roleId: '' }]);
  const removeMapping = (index: number) =>
    setMappings((current) =>
      current.filter((_, itemIndex) => itemIndex !== index),
    );
  return {
    channelQuery,
    setChannelQuery,
    channelId,
    setChannelId,
    content,
    setContent,
    mappings,
    editing,
    busy,
    clearEditor,
    editMessage,
    saveMessage,
    deleteMessage,
    updateMapping,
    addMapping,
    removeMapping,
  };
}
export type ReactionRoleEditor = ReturnType<typeof useReactionRoleEditor>;
