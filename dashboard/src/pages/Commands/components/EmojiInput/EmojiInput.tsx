import { useState } from 'react';
import './EmojiInput.css';

export type Emoji = {
  name: string;
  value: string;
  imageUrl: string | null;
  source: string;
};

export default function EmojiInput({
  index,
  value,
  emojis,
  onChange,
}: {
  index: number;
  value: string;
  emojis: Emoji[];
  onChange: (value: string) => void;
}) {
  const [query, setQuery] = useState('');
  const matching = emojis.filter(
    (emoji) =>
      emoji.name.toLowerCase().includes(query.toLowerCase()) ||
      emoji.value.includes(query),
  );
  const selected = emojis.find(
    (emoji) => emoji.value === value || `:${emoji.name}:` === value,
  );
  return (
    <div className="emoji-control">
      <input
        className="text-input"
        aria-label={`Emoji ${index + 1}`}
        placeholder="Emoji or :name:"
        value={value}
        maxLength={100}
        required
        onChange={(event) => onChange(event.target.value)}
      />
      {selected && (
        <span className="emoji-preview">
          {selected.imageUrl ? (
            <img src={selected.imageUrl} alt={`:${selected.name}:`} />
          ) : (
            selected.value
          )}
        </span>
      )}
      <details className="emoji-picker">
        <summary>Choose emoji {index + 1}</summary>
        <input
          className="text-input"
          aria-label={`Search emojis ${index + 1}`}
          placeholder="Search emojis"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        {['default', 'server'].map((source) => (
          <div key={source}>
            <p className="field-label">
              {source === 'default' ? 'Default emojis' : 'Server emojis'}
            </p>
            <div className="emoji-grid">
              {matching
                .filter((emoji) => emoji.source === source)
                .map((emoji) => (
                  <button
                    type="button"
                    className="emoji-choice"
                    key={emoji.value}
                    title={`:${emoji.name}:`}
                    aria-label={`Use ${source} emoji ${emoji.name} for pair ${index + 1}`}
                    onClick={() => onChange(emoji.value)}
                  >
                    {emoji.imageUrl ? (
                      <img src={emoji.imageUrl} alt="" />
                    ) : (
                      emoji.value
                    )}
                  </button>
                ))}
            </div>
          </div>
        ))}
        {matching.length === 0 && (
          <p className="field-help">No emojis found.</p>
        )}
      </details>
    </div>
  );
}
