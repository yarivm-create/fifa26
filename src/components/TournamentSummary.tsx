import React from 'react';
import { Match } from '../api/types';
import { getTournamentSummary, RoadMatch } from '../utils/tournamentSummary';
import { Flag } from '../utils/flags';
import { Trophy } from './Trophy';
import { formatLocalDate } from '../utils/localTime';
import { useI18n, TFunc } from '../i18n';

// Maps a knockout stage_name to its short i18n label for the champion's road.
const STAGE_TKEY: Record<string, string> = {
  'Round of 32': 'stage.r32',
  'Round of 16': 'stage.r16',
  'Quarter-final': 'stage.qf',
  'Semi-final': 'stage.sf',
  Final: 'stage.final',
};

// A short "(pens)"/"(AET)" note for results not settled in regulation. Plain
// wins return '' so only the noteworthy games carry a badge.
function resultNote(
  decidedBy: Match['decidedBy'],
  winnerPens: number | undefined,
  loserPens: number | undefined,
  t: TFunc
): string {
  if (decidedBy === 'penalties' && winnerPens != null && loserPens != null) {
    return t('summary.wonPens', { pw: winnerPens, pl: loserPens });
  }
  if (decidedBy === 'extra_time') return t('summary.wonAet');
  return '';
}

// A compact badge ("AET" / "pens 4–3") for the champion's road, where the row is
// tight on phones and a full sentence would crowd out the opponent's name.
function resultNoteShort(
  decidedBy: Match['decidedBy'],
  winnerPens: number | undefined,
  loserPens: number | undefined,
  t: TFunc
): string {
  if (decidedBy === 'penalties' && winnerPens != null && loserPens != null) {
    return t('summary.pensShort', { pw: winnerPens, pl: loserPens });
  }
  if (decidedBy === 'extra_time') return t('summary.aetShort');
  return '';
}

const RoadLeg: React.FC<{ leg: RoadMatch }> = ({ leg }) => {
  const { t } = useI18n();
  const note = resultNoteShort(leg.decidedBy, leg.championPens, leg.opponentPens, t);
  return (
    <li className="road-leg">
      <span className="road-stage">{t(STAGE_TKEY[leg.match.stage_name] ?? 'stage.final')}</span>
      <span className="road-opponent">
        <Flag code={leg.opponent.code} name={leg.opponent.name} className="road-flag" />
        <span className="road-opponent-name">{leg.opponent.name}</span>
      </span>
      <span className="road-result">
        <span className="road-score">
          {leg.championGoals}
          <span className="road-dash" aria-hidden="true">–</span>
          {leg.opponentGoals}
        </span>
        {note && <span className="road-note">{note}</span>}
      </span>
    </li>
  );
};

// The end-of-tournament recap that takes over the main tab once the Final is
// decided. Data-driven: it renders only when getTournamentSummary() resolves a
// champion, so during the tournament the Live tab is shown instead.
export const TournamentSummary: React.FC<{ matches: Match[] | null }> = ({ matches }) => {
  const { t } = useI18n();
  const summary = getTournamentSummary(matches);
  if (!summary) return null;

  const { champion, thirdPlace, playedMatches, totalGoals, avgGoalsPerMatch, teamsCount, road } =
    summary;

  const finalNote = resultNote(
    champion.decidedBy,
    champion.winnerPens,
    champion.loserPens,
    t
  );

  const stats: { value: string; label: string }[] = [
    { value: String(playedMatches), label: t('summary.matchesPlayed') },
    { value: String(totalGoals), label: t('summary.goalsScored') },
    { value: avgGoalsPerMatch.toFixed(2), label: t('summary.goalsPerMatch') },
    { value: String(teamsCount), label: t('summary.teams') },
  ];

  return (
    <section className="tournament-summary" aria-label={t('summary.aria')}>
      <header className="summary-hero">
        <div className="summary-hero-trophy" aria-hidden="true">
          <Trophy size={44} />
        </div>
        <h2 className="summary-title">{t('summary.title')}</h2>
        <p className="summary-subtitle">{t('summary.subtitle')}</p>
      </header>

      {/* Podium — rendered in rank order (gold, silver, bronze) so it reads
          correctly to assistive tech; CSS lifts gold to the centre for sighted
          users, and every step carries its medal + place label either way. */}
      <h3 className="summary-section-title">{t('summary.podium')}</h3>
      <ol className="summary-podium">
        <li className="podium-step podium-1">
          <span className="podium-medal" aria-hidden="true">🥇</span>
          <Flag code={champion.team.code} name={champion.team.name} className="podium-flag" />
          <span className="podium-team">{champion.team.name}</span>
          <span className="podium-place">{t('summary.champions')}</span>
        </li>
        <li className="podium-step podium-2">
          <span className="podium-medal" aria-hidden="true">🥈</span>
          <Flag
            code={champion.runnerUp.code}
            name={champion.runnerUp.name}
            className="podium-flag"
          />
          <span className="podium-team">{champion.runnerUp.name}</span>
          <span className="podium-place">{t('summary.runnersUp')}</span>
        </li>
        {thirdPlace && (
          <li className="podium-step podium-3">
            <span className="podium-medal" aria-hidden="true">🥉</span>
            <Flag code={thirdPlace.code} name={thirdPlace.name} className="podium-flag" />
            <span className="podium-team">{thirdPlace.name}</span>
            <span className="podium-place">{t('summary.thirdPlace')}</span>
          </li>
        )}
      </ol>

      {/* The Final */}
      <h3 className="summary-section-title">{t('summary.final')}</h3>
      <div className="summary-final">
        <div className="summary-final-side">
          <Flag code={champion.team.code} name={champion.team.name} className="summary-final-flag" />
          <span className="summary-final-name">{champion.team.name}</span>
        </div>
        <div className="summary-final-score">
          <span className="summary-final-goals summary-final-winner">{champion.winnerGoals}</span>
          <span className="summary-final-dash" aria-hidden="true">–</span>
          <span className="summary-final-goals">{champion.loserGoals}</span>
        </div>
        <div className="summary-final-side">
          <Flag
            code={champion.runnerUp.code}
            name={champion.runnerUp.name}
            className="summary-final-flag"
          />
          <span className="summary-final-name">{champion.runnerUp.name}</span>
        </div>
      </div>
      <p className="summary-final-meta">
        {finalNote && <span className="summary-final-note">{finalNote} · </span>}
        {champion.venue} ·{' '}
        {formatLocalDate(champion.datetime, {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })}
      </p>

      {/* By the numbers */}
      <h3 className="summary-section-title">{t('summary.numbers')}</h3>
      <div className="summary-numbers">
        {stats.map((s) => (
          <div className="summary-stat" key={s.label}>
            <span className="summary-stat-value">{s.value}</span>
            <span className="summary-stat-label">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Champion's road to glory */}
      {road.length > 0 && (
        <>
          <h3 className="summary-section-title">
            {t('summary.road', { team: champion.team.name })}
          </h3>
          <ol className="summary-road">
            {road.map((leg) => (
              <RoadLeg leg={leg} key={leg.match.id} />
            ))}
          </ol>
        </>
      )}
    </section>
  );
};
