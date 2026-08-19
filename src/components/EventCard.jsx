import {
  Eye,
  ShieldCheck
} from "lucide-react";

function EventCard({ event, onClick }) {
  return (
    <article className="event-card" onClick={onClick}>
      <div
  className="event-icon"
  style={{
    backgroundColor: `${event.color}20`,
    color: event.color
  }}
>
  ●
</div>

      <div className="event-content">
        <div className="event-header">
          <span className="event-category">{event.category}</span>
          <span className="event-time">{event.time}</span>
        </div>

        <h2>{event.title}</h2>

        <div className="event-location">
          📍 {event.location}
        </div>

        <p>{event.description}</p>

        <div className="event-stats">
  <span>
    <Eye />
    {event.observations}
  </span>

  <span>
    <ShieldCheck />
    {event.confirmations}
  </span>
</div>
      </div>

      <div className="event-image">
        <img src={event.image} alt={event.title} />
      </div>
    </article>
  );
}

export default EventCard;