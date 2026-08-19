import { useState } from "react";
import { ArrowLeft, Image } from "lucide-react";
import LocationPicker from "./LocationPicker";

function NewEventForm({ onBack, onCreateEvent }) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Evenemang");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState(null);
  const [image, setImage] = useState(null);

  function handleImageChange(e) {
  const file = e.target.files[0];

  if (!file) {
    return;
  }

  const imageUrl = URL.createObjectURL(file);

  setImage(imageUrl);
}

  function handleSubmit(e) {
    e.preventDefault();

    const newEvent = {
      id: Date.now(),
      title: title,
      category: category,
      description: description,
      latitude: location?.latitude ?? null,
      longitude: location?.longitude ?? null,
      time: "Just nu",
      observations: 1,
      confirmations: 0,
      image: image,
      color: "#6c4ce8"
    };

    onCreateEvent(newEvent);
  }

  return (
    <main className="observation-page">

      <button className="back-button" onClick={onBack}>
        <ArrowLeft />
        Tillbaka
      </button>

      <div className="observation-content">

        <span className="event-category">
          Ny händelse
        </span>

        <h1>Vad händer?</h1>

        <p className="observation-intro">
          Skapa en ny händelse som andra kan upptäcka.
        </p>

        <form onSubmit={handleSubmit}>

          <label htmlFor="title">
            Rubrik
          </label>

          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex. Livemusik på Almedalen"
            required
          />

          <label htmlFor="category">
            Kategori
          </label>

          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="Evenemang">Evenemang</option>
            <option value="Nöje">Nöje</option>
            <option value="Sport">Sport</option>
            <option value="Trafik">Trafik</option>
            <option value="Natur">Natur</option>
            <option value="Mat & dryck">Mat & dryck</option>
            <option value="Övrigt">Övrigt</option>
          </select>

          <label htmlFor="description">
            Beskrivning
          </label>

          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Berätta vad som händer..."
            rows="6"
            required
          />

          <label className="image-upload">
  {image ? (
    <img
      src={image}
      alt="Förhandsvisning"
    />
  ) : (
    <>
      <Image />
      <span>Lägg till bild</span>
    </>
  )}

  <input
    type="file"
    accept="image/*"
    onChange={handleImageChange}
  />
</label>

          <label>
  Plats
</label>

<LocationPicker
  onLocationChange={(newLocation) => {
    setLocation(newLocation);
  }}
/>

          <button
            type="submit"
            className="submit-observation"
          >
            Skapa händelse
          </button>

        </form>

      </div>

    </main>
  );
}

export default NewEventForm;