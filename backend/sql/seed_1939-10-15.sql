INSERT INTO timeline (title, story, date) VALUES (
    'Scapa Flow Counts Its Dead',
    $story$Sunday, 15 October 1939. In Orkney, the day after the loss of HMS Royal Oak is spent counting the living and the dead. The battleship went down in the Royal Navy's home anchorage, Scapa Flow, which was supposed to be the safest harbour in Britain.

It happened in the small hours of Saturday. German submarine U-47, under Günther Prien, slipped in through Kirk Sound on the night of 13 to 14 October. The raid had been timed for high tides and a moonless night. Prien was inside the harbour at 00:27, and at 00:58 he fired a first salvo of three torpedoes. One hit the bow at 01:04 with little visible damage, and many aboard went back to their hammocks.

At 01:16 a second salvo of three struck amidships in quick succession. The ship listed to 15 degrees, then about 45, and sank at 01:29, thirteen minutes after the second strike. Of a complement of 1,234, 835 men and boys died that night or later of their wounds. One hundred and thirty-four of them were boy seamen under 18, the largest such loss in a single Royal Navy action. Rear-Admiral Henry Blagrove, commanding the Second Battle Squadron, was among the dead.

The living owe much to the small tender Daisy 2, whose skipper John Gatt pulled 386 men from the water, among them the ship's captain, William Benn. Gatt would later be awarded the Distinguished Service Cross. Today the work is grim: families waiting for word, survivors being accounted for, and an Admiralty asking how a submarine could pass through the fleet's own defences.

Elsewhere, the world carries on in a war that has not yet found its shape. Germany and Estonia sign an agreement to resettle Baltic Germans. In New York, tens of thousands turn out to see the city's new municipal airport, later renamed LaGuardia, formally dedicated, with almost 60 military aircraft overhead. For Britain, the lesson of the day is that the sea war has arrived at home.$story$,
    '1939-10-15'
) ON CONFLICT (date) DO UPDATE SET title = EXCLUDED.title, story = EXCLUDED.story;
