type MetricTone = "blue" | "green" | "yellow" | "neutral";

type MetricCardProps = {
  label: string;
  value: string;
  description: string;
  detail?: string;
  progress?: number;
  tone?: MetricTone;
};

export default function MetricCard({
  label,
  value,
  description,
  detail,
  progress,
  tone = "neutral",
}: MetricCardProps) {
  const normalizedProgress =
    typeof progress === "number"
      ? Math.min(100, Math.max(0, progress))
      : undefined;

  return (
    <article className={`metric-card metric-card-${tone}`}>
      <div className="metric-card-header">
        <span
          className="metric-card-marker"
          aria-hidden="true"
        />

        <span className="metric-card-label">
          {label}
        </span>
      </div>

      <strong className="metric-card-value">
        {value}
      </strong>

      <p className="metric-card-description">
        {description}
      </p>

      {typeof normalizedProgress === "number" && (
        <div
          className="metric-card-progress"
          role="progressbar"
          aria-label={`Progresso de ${label}`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(normalizedProgress)}
        >
          <span
            className="metric-card-progress-fill"
            style={{
              width: `${normalizedProgress}%`,
            }}
          />
        </div>
      )}

      {detail && (
        <span className="metric-card-detail">
          {detail}
        </span>
      )}
    </article>
  );
}