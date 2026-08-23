import EventCard from "./EventCard";

function Feed({
  events,
  onEventClick,
  onConfirmationChange
}) {
  return (
    <main className="feed">

      {events.map((event) => (

        <EventCard
          key={event.id}

          event={event}

          onClick={() =>
            onEventClick(event)
          }

          onConfirmationChange={
            onConfirmationChange
          }
        />

      ))}

    </main>
  );
}

export default Feed;