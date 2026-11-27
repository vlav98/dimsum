import ContentCard from '../../../../components/common/ContentCard/ContentCard';
import Feedback from '../../../../components/common/Feedback/Feedback';
import LoadState from '../../../../components/common/LoadState/LoadState';
import { useArtChallenges } from '../../hooks/useArtChallenges';
import ChallengeRow from './ChallengeRow';
import ArtHistory from './ArtHistory';

export default function ArtChallenges({ guildId }: { guildId: string }) {
  const model = useArtChallenges(guildId);
  const [page, setPage] = useState(0);
  const pageSize = 5;
  const pages = Math.ceil((model.challenges?.length ?? 0) / pageSize);
  const currentPage = Math.min(page, Math.max(0, pages - 1));
  return (
    <ContentCard className="feature-card">
      <h2>Drawing challenges</h2>
      <p className="form-description">
        Start challenges with /draw-this-in-palette in Discord. Ending early
        announces the deadline; it does not lock the thread. Saved images cannot
        be recalled.
      </p>
      <Feedback error={model.error} notice={model.notice} />
      {!model.challenges ? (
        <LoadState
          error={model.error}
          label="Loading challenges…"
          onRetry={model.refresh}
        />
      ) : model.challenges.length === 0 ? (
        <p>No active drawing challenges.</p>
      ) : (
        <ul className="art-challenge-list">
          {model.challenges
            .slice(currentPage * pageSize, (currentPage + 1) * pageSize)
            .map((challenge) => (
              <ChallengeRow
                key={challenge.threadId}
                guildId={guildId}
                challenge={challenge}
                busy={model.busy}
                onAction={model.act}
                onEdit={model.edit}
              />
            ))}
        </ul>
      )}
      {pages > 1 && (
        <div className="art-challenge-actions" aria-label="Challenge pages">
          <button
            type="button"
            disabled={currentPage === 0}
            onClick={() => setPage(currentPage - 1)}
          >
            Previous
          </button>
          <span>
            Page {currentPage + 1} of {pages}
          </span>
          <button
            type="button"
            disabled={currentPage + 1 === pages}
            onClick={() => setPage(currentPage + 1)}
          >
            Next
          </button>
        </div>
      )}
      <button
        type="button"
        className="secondary-button"
        disabled={model.busy}
        onClick={model.refresh}
      >
        Refresh challenges
      </button>
      <ArtHistory
        key={`${guildId}-${model.historyVersion}`}
        guildId={guildId}
      />
    </ContentCard>
  );
}
import { useState } from 'react';
