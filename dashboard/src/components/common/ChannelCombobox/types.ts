export type Channel = { id: string; name: string; category: string | null };
export type ChannelComboboxProps = {
  id: string;
  label: string;
  channels: Channel[];
  value: string;
  onChange: (value: string) => void;
  emptyLabel?: string;
  required?: boolean;
  disabled?: boolean;
};
