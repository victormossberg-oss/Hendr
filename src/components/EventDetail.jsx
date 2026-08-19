import { ArrowLeft, Eye, ShieldCheck, MapPin } from "lucide-react";

function EventDetail({
  event,
  observations,
  onBack,
  onAddObservation
}) {
  return (
    <main className="event-detail">

      <button className="back-button" onClick={onBack}>
        <ArrowLeft />
        Tillbaka
      </button>

      <div className="detail-image">
        <img src={event.image} alt={event.title} />
      </div>

      <div className="detail-content">

        <div className="detail-header">
          <span
            className="event-category"
            style={{ color: event.color }}
          >
            {event.category}
          </span>

          <span className="event-time">
            {event.time}
          </span>
        </div>

        <h1>{event.title}</h1>

        <div className="detail-location">
          <MapPin />
          {event.location}
        </div>

        <p className="detail-description">
          {event.description}
        </p>

        <div className="detail-stats">

          <div>
            <Eye />
            <strong>{event.observations}</strong>
            <span>observationer</span>
          </div>

          <div>
            <ShieldCheck />
            <strong>{event.confirmations}</strong>
            <span>bekräftelser</span>
          </div>

        </div>

       <section className="timeline">

  <h2>Tidslinje</h2>

  {observations.length === 0 ? (
    <p className="empty-timeline">
      Inga observationer har rapporterats ännu.
    </p>
  ) : (
    observations.map((observation) => (
      <div
        className="timeline-item"
        key={observation.id}
      >
        <div className="timeline-dot"></div>

        <div className="timeline-content">
          <div className="timeline-meta">
            <strong>Användare</strong>
            <span>{observation.createdAt}</span>
          </div>

          <p>{observation.description}</p>
        </div>
      </div>
    ))
  )}

</section>

        <button
  className="observation-button"
  onClick={onAddObservation}
>
  + Lägg till observation
</button>

      </div>

    </main>
  );
}

export default EventDetail;