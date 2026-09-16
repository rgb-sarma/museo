"""Seed the demo database.

Run from the backend directory:  python -m app.seed
Existing rows are wiped first, so this is safe to re-run.
"""

from datetime import date, timedelta

from sqlmodel import Session, delete, select

from .auth import hash_password
from .database import engine, init_db
from .models import (
    Bookings,
    BookingStatus,
    Category,
    Exibitions,
    ExibitType,
    Museums,
    Reviews,
    User,
)

IMG = "https://images.unsplash.com/{}?auto=format&fit=crop&w=1200&q=70"

# (name, category, city, address, contact, lat, lng, photo_id, hours, fee, description)
MUSEUMS = [
    # ---------------------------------------------------------------- Belgrade
    ("National Museum of Serbia", Category.ART, "Belgrade", "Trg republike 1a",
     "+381 11 3306000", 44.8166, 20.4601, "photo-1554907984-15263bfd63bd",
     "Tue–Sun · 10:00–18:00", 5.0,
     "Serbia's oldest and largest museum, home to over 400,000 works spanning "
     "antiquity to modern Yugoslav painting."),
    ("Museum of Contemporary Art", Category.ART, "Belgrade", "Ušće 10, Novi Beograd",
     "+381 11 3115713", 44.8140, 20.4435, "photo-1518998053901-5348d3961a04",
     "Wed–Mon · 10:00–18:00", 4.0,
     "A landmark of modernist architecture overlooking the river, showing Yugoslav "
     "and regional contemporary art."),
    ("Nikola Tesla Museum", Category.SCIENCE, "Belgrade", "Krunska 51",
     "+381 11 2433886", 44.8060, 20.4720, "photo-1581092160562-40aa08e78837",
     "Tue–Sun · 10:00–18:00", 6.0,
     "Home to Tesla's personal effects and original instruments — including a working "
     "Tesla coil demonstrated hourly to visitors."),
    ("Museum of Yugoslavia", Category.HISTORY, "Belgrade", "Mihaila Mike Jankovića 6",
     "+381 11 3671485", 44.7883, 20.4510, "photo-1541961017774-22349e4a1262",
     "Tue–Sun · 10:00–18:00", 3.0,
     "The story of 20th-century Yugoslavia, including the House of Flowers and a vast "
     "archive of state gifts."),
    ("Natural History Museum", Category.NATURE, "Belgrade", "Njegoševa 51",
     "+381 11 3442147", 44.8047, 20.4711, "photo-1574068468668-a05a11f871da",
     "Daily · 10:00–17:00", 4.0,
     "Fossils, minerals and biodiversity from the Balkans, with rotating "
     "natural-science exhibitions."),
    ("Ethnographic Museum", Category.ETHNOGRAPHIC, "Belgrade", "Studentski trg 13",
     "+381 11 3281888", 44.8188, 20.4573, "photo-1526304640581-d334cdbbf45e",
     "Tue–Sun · 10:00–17:00", 3.0,
     "Folk costume, crafts and rural life across the Serbian regions, one of the "
     "oldest ethnographic collections in the Balkans."),

    # ---------------------------------------------------------------- Novi Sad
    ("Museum of Vojvodina", Category.HISTORY, "Novi Sad", "Dunavska 35",
     "+381 21 420566", 45.2557, 19.8565, "photo-1580537659466-0a9bfa916a54",
     "Tue–Sun · 09:00–19:00", 3.0,
     "Two centuries of Vojvodina's layered history, from Roman finds to the "
     "multi-ethnic present of the province."),
    ("Gallery of Matica Srpska", Category.ART, "Novi Sad", "Trg galerija 1",
     "+381 21 4899000", 45.2554, 19.8487, "photo-1577720580479-7d839d829c73",
     "Tue–Sun · 10:00–18:00", 4.0,
     "The definitive collection of Serbian painting from the 18th to the 20th century, "
     "set on the city's gallery square."),
    ("Petrovaradin Fortress Museum", Category.ARCHAEOLOGY, "Novi Sad", "Petrovaradinska tvrđava",
     "+381 21 6433145", 45.2520, 19.8618, "photo-1503152394-c571994fd383",
     "Daily · 09:00–17:00", 4.0,
     "Beneath the famous clock tower: military tunnels, Habsburg-era artefacts and the "
     "archaeology of the Danube bend."),
    ("Museum of Contemporary Art Vojvodina", Category.ART, "Novi Sad", "Dunavska 37",
     "+381 21 526634", 45.2560, 19.8570, "photo-1531243269054-5ebf6f34081e",
     "Tue–Sun · 10:00–18:00", 3.0,
     "Experimental and conceptual art from the Novi Sad neo-avant-garde onward."),
    ("Pavle Beljanski Memorial Collection", Category.ART, "Novi Sad", "Trg galerija 2",
     "+381 21 528185", 45.2553, 19.8490, "photo-1596548438137-d51ea5c83ca5",
     "Wed–Sun · 10:00–18:00", 3.0,
     "A diplomat's private collection of Serbian modernism, left to the city and shown "
     "in its original intimate arrangement."),

    # ---------------------------------------------------------------- Vienna
    ("Kunsthistorisches Museum", Category.ART, "Vienna", "Maria-Theresien-Platz",
     "+43 1 525240", 48.2038, 16.3616, "photo-1544967082-d9d25d867d66",
     "Tue–Sun · 10:00–18:00", 21.0,
     "The Habsburg imperial collection: Bruegel, Vermeer, Caravaggio and a Kunstkammer "
     "of astonishing density."),
    ("Naturhistorisches Museum", Category.NATURAL_HISTORY, "Vienna", "Burgring 7",
     "+43 1 521770", 48.2052, 16.3596, "photo-1570481662006-a3a1374699e8",
     "Wed–Mon · 09:00–18:30", 18.0,
     "Thirty-nine halls of meteorites, dinosaurs and the 29,500-year-old Venus of "
     "Willendorf."),
    ("Albertina", Category.ART, "Vienna", "Albertinaplatz 1",
     "+43 1 534830", 48.2043, 16.3682, "photo-1499426600726-a950358acf16",
     "Daily · 10:00–18:00", 19.0,
     "Dürer's hare, a world-class graphic collection and the Habsburg state rooms above "
     "the Ringstrasse."),
    ("Technisches Museum Wien", Category.SCIENCE, "Vienna", "Mariahilfer Straße 212",
     "+43 1 899980", 48.1897, 16.3178, "photo-1567443024551-f3e3cc2be870",
     "Tue–Sun · 09:00–18:00", 16.0,
     "Austria's museum of technology and industry, strong on hands-on physics and "
     "historic locomotives."),
    ("Weltmuseum Wien", Category.ETHNOGRAPHIC, "Vienna", "Heldenplatz",
     "+43 1 534300", 48.2058, 16.3651, "photo-1584551246679-0daf3d275d0f",
     "Tue–Sun · 10:00–18:00", 16.0,
     "Ethnographic collections from across the world, shown with unusually frank "
     "attention to how they were acquired."),
]

# museum name -> [(title, type, months_from_today_start, months_duration, description)]
EXHIBITIONS = {
    "National Museum of Serbia": [
        ("Masters of the Interwar", ExibitType.TEMPORARY, -1, 3,
         "Painting between the wars, when Belgrade's studios looked to Paris."),
        ("The Permanent Galleries", ExibitType.PERMANENT, -60, None,
         "Antiquity through the 20th century across three restored floors."),
    ],
    "Museum of Contemporary Art": [
        ("Forms of the New", ExibitType.TEMPORARY, 0, 2,
         "Sculpture and installation from the museum's post-1960 holdings."),
    ],
    "Nikola Tesla Museum": [
        ("Resonance: Tesla's Coils", ExibitType.TEMPORARY, -1, 2,
         "The coil demonstrations, with the original patents alongside."),
        ("The Inventor's Legacy", ExibitType.PERMANENT, -60, None,
         "Tesla's urn, personal effects and working reconstructions."),
    ],
    "Museum of Yugoslavia": [
        ("Relay of Youth", ExibitType.TEMPORARY, -2, 6,
         "The batons carried to Tito each year, and the ritual around them."),
    ],
    "Natural History Museum": [
        ("Ice Age Balkans", ExibitType.TEMPORARY, 0, 3,
         "Cave bears, mammoth finds and the peninsula's glacial refugia."),
    ],
    "Ethnographic Museum": [
        ("Threads of the Village", ExibitType.PERMANENT, -60, None,
         "Costume and textile from every Serbian region."),
    ],
    "Museum of Vojvodina": [
        ("Roman Danube", ExibitType.TEMPORARY, -1, 4,
         "Frontier archaeology from the limes along the river."),
    ],
    "Gallery of Matica Srpska": [
        ("Paja Jovanović Revisited", ExibitType.TEMPORARY, 0, 3,
         "The large historical canvases, newly conserved."),
        ("Serbian Painting 1750–1950", ExibitType.PERMANENT, -60, None,
         "The permanent chronological hang."),
    ],
    "Petrovaradin Fortress Museum": [
        ("Under the Clock", ExibitType.TEMPORARY, -2, 5,
         "Twenty kilometres of counter-mine tunnels, mapped and lit."),
    ],
    "Museum of Contemporary Art Vojvodina": [
        ("Neo-Avant-Garde Novi Sad", ExibitType.TEMPORARY, 0, 2,
         "Performance documentation and samizdat from the 1970s."),
    ],
    "Pavle Beljanski Memorial Collection": [
        ("The Collector's Eye", ExibitType.PERMANENT, -60, None,
         "Fifty works, hung as Beljanski left them."),
    ],
    "Kunsthistorisches Museum": [
        ("Bruegel in Detail", ExibitType.TEMPORARY, -1, 3,
         "Infrared and macro photography of the twelve panels."),
        ("The Picture Gallery", ExibitType.PERMANENT, -60, None,
         "Titian, Velázquez, Rubens and the Habsburg core."),
    ],
    "Naturhistorisches Museum": [
        ("Meteorites Reopened", ExibitType.TEMPORARY, 0, 4,
         "The world's oldest meteorite display, rebuilt."),
    ],
    "Albertina": [
        ("Dürer on Paper", ExibitType.TEMPORARY, -1, 2,
         "Watercolours and drawings shown in rotation for conservation."),
    ],
    "Technisches Museum Wien": [
        ("Power and Progress", ExibitType.PERMANENT, -60, None,
         "Heavy machinery from the imperial industrial age."),
    ],
    "Weltmuseum Wien": [
        ("Provenance in Question", ExibitType.TEMPORARY, 0, 5,
         "Twenty objects and the open research into how they arrived."),
    ],
}

# (full_name, email) — demo reviewers. The first is the account you log in as.
USERS = [
    ("Maja Jovanović", "maja@example.com"),
    ("Ana Petrović", "ana@example.com"),
    ("Marko Ilić", "marko@example.com"),
    ("Jelena Kostić", "jelena@example.com"),
    ("Stefan Nikolić", "stefan@example.com"),
]

# museum name -> [(reviewer index, rating, comment)]
REVIEWS = {
    "Nikola Tesla Museum": [
        (1, 5, "The live coil demonstration is unreal. Go right on the hour."),
        (2, 5, "Small but fascinating — loved seeing the original instruments."),
        (3, 5, "Worth it just for the demonstration. Book the English slot."),
        (4, 4, "Compact. An hour is genuinely enough, but a very good hour."),
    ],
    "National Museum of Serbia": [
        (3, 5, "Beautiful collection. Give yourself a full two hours."),
        (2, 5, "The interwar rooms upstairs are the best part and everyone misses them."),
        (4, 4, "Excellent, though the labelling is thin in the antiquity section."),
    ],
    "Museum of Contemporary Art": [
        (1, 5, "The building itself is the best exhibit. Go for the river light."),
        (4, 4, "Strong permanent collection, sparse when shows are changing over."),
    ],
    "Museum of Yugoslavia": [
        (2, 5, "The House of Flowers is genuinely moving. Context-heavy in a good way."),
        (3, 4, "Fascinating archive. Bring a translation app for some of the labels."),
        (1, 4, "Go with someone who remembers it. Changes the whole visit."),
    ],
    "Natural History Museum": [
        (4, 4, "Small for the price, but the mineral hall is lovely."),
        (2, 4, "Good rainy-afternoon museum. Kids liked the Ice Age room."),
    ],
    "Ethnographic Museum": [
        (3, 5, "The textile floor is extraordinary and almost always empty."),
        (1, 4, "Quietly one of the best in the city."),
    ],
    "Museum of Vojvodina": [
        (2, 4, "Thorough and well-arranged. The Roman section surprised me."),
    ],
    "Gallery of Matica Srpska": [
        (1, 5, "Serbia's best-hung gallery. Free guided tours are excellent."),
        (3, 5, "Immaculate. The Jovanović canvases are worth the trip alone."),
    ],
    "Petrovaradin Fortress Museum": [
        (4, 4, "Take the tunnel tour, skip the upper rooms if short on time."),
    ],
    "Kunsthistorisches Museum": [
        (1, 5, "One of the great museums of Europe. Budget a full day."),
        (2, 5, "The Kunstkammer is absurd in the best way."),
        (4, 5, "Go at opening. The Bruegel room fills by eleven."),
    ],
    "Naturhistorisches Museum": [
        (3, 5, "The Venus of Willendorf is tiny and completely arresting."),
        (1, 4, "Gorgeous old-fashioned display cases. Some halls feel dated."),
    ],
    "Albertina": [
        (2, 4, "The state rooms are the highlight. Graphic works rotate, so check first."),
    ],
    "Technisches Museum Wien": [
        (4, 4, "Best museum in Vienna if you're under twelve, and good above it."),
    ],
    "Weltmuseum Wien": [
        (3, 5, "Unusually honest about provenance. More museums should do this."),
    ],
}


def months(n: int) -> timedelta:
    return timedelta(days=int(n * 30.44))


def seed() -> None:
    init_db()
    today = date.today()

    with Session(engine) as session:
        # Wipe children first so the FKs stay satisfied.
        for model in (Reviews, Bookings, Exibitions, Museums, User):
            session.exec(delete(model))
        session.commit()

        users = [
            User(
                email=email,
                password=hash_password("museodemo"),
                full_name=name,
                is_verified=True,
            )
            for name, email in USERS
        ]
        session.add_all(users)
        session.commit()
        for u in users:
            session.refresh(u)

        museums: dict[str, Museums] = {}
        for (name, cat, city, addr, contact, lat, lng, photo, hours, fee, desc) in MUSEUMS:
            m = Museums(
                name=name,
                category=cat,
                description=desc,
                city=city,
                address=addr,
                contact=contact,
                latitude=lat,
                longitude=lng,
                image_url=IMG.format(photo),
                opening_hours=hours,
                admission_fee=fee,
            )
            session.add(m)
            museums[name] = m
        session.commit()
        for m in museums.values():
            session.refresh(m)

        for museum_name, shows in EXHIBITIONS.items():
            for title, kind, start_offset, duration, description in shows:
                start = today + months(start_offset)
                session.add(
                    Exibitions(
                        museum_id=museums[museum_name].id,
                        title=title,
                        description=description,
                        type=kind,
                        start_date=start,
                        end_date=None if duration is None else start + months(duration),
                        image_url=museums[museum_name].image_url,
                    )
                )

        for museum_name, entries in REVIEWS.items():
            for user_idx, rating, comment in entries:
                session.add(
                    Reviews(
                        museum_id=museums[museum_name].id,
                        user_id=users[user_idx].id,
                        rating=rating,
                        comment=comment,
                    )
                )

        # One past and one upcoming booking for Maja, so Bookings has both tabs populated.
        maja = users[0]
        tesla = museums["Nikola Tesla Museum"]
        national = museums["National Museum of Serbia"]
        session.add_all([
            Bookings(
                user_id=maja.id,
                museum_id=tesla.id,
                visit_date=today + timedelta(days=9),
                time_slot="11:00",
                num_tickets=2,
                total_price=tesla.admission_fee * 2,
                status=BookingStatus.CONFIRMED,
                reference="TSL9F3C21A4",
            ),
            Bookings(
                user_id=maja.id,
                museum_id=national.id,
                visit_date=today - timedelta(days=41),
                time_slot="14:00",
                num_tickets=1,
                total_price=national.admission_fee,
                status=BookingStatus.CONFIRMED,
                reference="NMS22A1B7E3",
            ),
        ])

        session.commit()

        counts = {
            "users": len(users),
            "museums": len(museums),
            "exhibitions": len(session.exec(select(Exibitions)).all()),
            "reviews": len(session.exec(select(Reviews)).all()),
            "bookings": len(session.exec(select(Bookings)).all()),
        }

    print("Seeded:", ", ".join(f"{v} {k}" for k, v in counts.items()))
    print("Demo login: maja@example.com / museodemo")


if __name__ == "__main__":
    seed()
