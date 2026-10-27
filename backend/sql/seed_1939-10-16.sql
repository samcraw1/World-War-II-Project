INSERT INTO timeline (title, story, date) VALUES (
    'The War Reaches British Skies',
    $story$Monday, 16 October 1939. Two days after U-47 slipped into Scapa Flow, the war comes to Britain from the air.

Nine German Luftwaffe aircraft raid the Firth of Forth, in eastern Scotland, where Royal Navy ships are anchored. The cruisers Southampton and Edinburgh and the destroyer Mohawk are damaged, and sixteen Royal Navy crewmen are killed.

The raiders do not get away unharmed. Spitfires of No. 603 Squadron arrive and shoot down three of the attackers, described as the first German aircraft to be downed over British territory in the war.

Far to the east, the occupation of Poland grinds on. The Nazi authorities order all Poles out of the port city of Gdynia, part of the German policy of clearing and resettling the territory they have seized.

In New York, far from the fighting, Broadway opens a new comedy, The Man Who Came to Dinner, at the Music Box Theatre. For Britain, though, the day's lesson is plain: the sea war has been joined by an air war.$story$,
    '1939-10-16'
) ON CONFLICT (date) DO UPDATE SET title = EXCLUDED.title, story = EXCLUDED.story;
