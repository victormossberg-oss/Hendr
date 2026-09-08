import EventCard from "./EventCard";

function Feed({
  events,
  onEventClick,
  onConfirmationChange,
  onUserClick
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

          onUserClick={
            onUserClick
          }
        />

      ))}

    </main>
  );
}

export default Feed;