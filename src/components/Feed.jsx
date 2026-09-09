import EventCard from "./EventCard";

function Feed({
  events,
  loading,
  onEventClick,
  onConfirmationChange,
  onUserClick
}) {
  if (loading) {
    return (
      <main className="feed">
        <div className="event-card event-card-skeleton">
          <div className="event-card-media skeleton-block" />

          <div className="event-card-body">
            <div className="skeleton-line skeleton-title" />
            <div className="skeleton-line skeleton-location" />
            <div className="skeleton-line skeleton-description" />
            <div className="skeleton-line skeleton-description short" />

            <div className="skeleton-stats">
              <div className="skeleton-line skeleton-stat" />
              <div className="skeleton-line skeleton-stat" />
            </div>
          </div>
        </div>

        <div className="event-card event-card-skeleton">
          <div className="event-card-media skeleton-block" />

          <div className="event-card-body">
            <div className="skeleton-line skeleton-title" />
            <div className="skeleton-line skeleton-location" />
            <div className="skeleton-line skeleton-description" />
            <div className="skeleton-line skeleton-description short" />

            <div className="skeleton-stats">
              <div className="skeleton-line skeleton-stat" />
              <div className="skeleton-line skeleton-stat" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="feed">
      {events.map((event) => (
        <EventCard
          key={event.id}
          event={event}
          onClick={() => onEventClick(event)}
          onConfirmationChange={onConfirmationChange}
          onUserClick={onUserClick}
        />
      ))}
    </main>
  );
}

export default Feed;