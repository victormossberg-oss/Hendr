import EventCard from "./EventCard";

function Feed({
  events,
  onEventClick,
  onConfirmationChange,
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
        />
      ))}
    </main>
  );
}

export default Feed;