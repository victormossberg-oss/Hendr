import EventCard from "./EventCard";

function Feed({ events, onEventClick }) {
  return (
    <main className="feed">
      {events.map((event) => (
        <EventCard
  key={event.id}
  event={event}
  onClick={() => onEventClick(event)}
/>
      ))}
    </main>
  );
}

export default Feed;