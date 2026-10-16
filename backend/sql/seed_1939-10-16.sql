INSERT INTO timeline (title, story, date) VALUES (
    'The Raid on the Forth',
    $story$Monday, 16 October 1939. Barely a day after the loss of HMS Royal Oak, the war comes to the British mainland from the air. For the first time, the Luftwaffe attacks Britain, and the RAF fights back over British soil.

The morning brings a warning. At 09:20 the Chain Home radar at Drone Hill picks up two intruders over the North Sea, and Spitfires of 602 Squadron are scrambled. They are too late and too far away to stop a lone Heinkel 111 scouting the Firth of Forth, which gets home safely.

The real attack comes after lunch. Twelve Junkers Ju 88 bombers of I./KG 30 cross the North Sea hunting the battlecruiser HMS Hood, which they believe is at Rosyth. They have orders not to bomb targets on land, so the crews go after ships at anchor or under way. Around 14:30 the bombers dive on the cruisers Southampton and Edinburgh. One bomb falls beside the destroyer HMS Mohawk, killing thirteen ratings and two officers; her captain is mortally wounded. In all sixteen British sailors die and 44 are wounded. No ship is sunk.

The defenders are weekend flyers. 603 Squadron (City of Edinburgh) and 602 Squadron (City of Glasgow) belong to the Auxiliary Air Force, part-time airmen who have trained in their spare time for years. About 14:45 Flight Lieutenant Pat Gifford of 603 finishes off the Ju 88 of Oberleutnant Hans Storp, which crashes into the Forth off Prestonpans. Minutes later Flight Lieutenant George Pinkerton of 602 chases down the aircraft of Hauptmann Helmuth Pohle, which ditches off Crail. Pohle is the only survivor of his crew. A third bomber, badly damaged, limps as far as the Netherlands and crashes with the loss of its crew.

Gifford and Pinkerton will each receive the Distinguished Flying Cross. The fishermen who pull German airmen from the water treat them with courtesy, and the dead are later buried with full military honours.

The raid does little damage. Its meaning lies elsewhere. The Auxiliaries have shown they are as good as the regulars, the radar and control chain has worked, and Britain now knows what an air attack on the home front looks like.$story$,
    '1939-10-16'
) ON CONFLICT (date) DO UPDATE SET title = EXCLUDED.title, story = EXCLUDED.story;
