import EventCard from "./EventCard";

function Feed({
  events,
  onEventClick,
  onConfirmationChange,
  onUserClick,
}) {
  return (
    <main className="feed">
      {events.map((event, index) => (
        <EventCard
          key={event.id}
          event={event}
          isFeatured={index === 0}
          onClick={() => onEventClick(event)}
          onConfirmationChange={onConfirmationChange}
          onUserClick={onUserClick}
        />
      ))}
    </main>
  );
}

export default Feed;