import { applyCampaignQuestions } from './campaign-config.js';

export const DIMENSIONS=['romance','novelty','comfort','structure','social','activity','culture','serenity','aesthetic','spontaneity'];

const BASE_QUESTIONS=[
{title:'You open the curtains on your first morning. What do you want outside?',subtitle:'Ignore price and logistics.',options:[
['🌊','A quiet coast','Warm light, water, nowhere urgent to be',{romance:14,serenity:16,comfort:5,social:-6,aesthetic:10}],
['🌃','A city already moving','Coffee downstairs, people everywhere, options all day',{novelty:10,social:14,culture:10,serenity:-10,spontaneity:6}],
['🏔️','Mountains and cold air','Big scenery, long walks, disappearing for a while',{activity:14,serenity:10,novelty:5,comfort:-4}],
['🌴','A resort that looks unreal','Pool, service, beautiful everything',{comfort:16,serenity:8,romance:7,culture:-5,aesthetic:8}]]},
{title:'You can only pack three extras.',subtitle:'Your basics are already covered.',multi:3,options:[
['📷','Camera','I want to remember how it looked',{culture:5,romance:5,aesthetic:5}],['👞','One really good outfit','There will be a moment for it',{comfort:8,romance:4,aesthetic:8}],['🥾','Hiking shoes','I am going somewhere',{activity:10,novelty:4}],['📚','A book','Give me one quiet afternoon',{serenity:9,social:-3}],['🩱','Swimwear','Put me near water immediately',{serenity:4,romance:3,activity:2}],['🔊','Portable speaker','The trip needs a soundtrack',{social:8,novelty:2,spontaneity:5}]]},
{title:'It’s 9:15 PM. Where did you end up?',subtitle:'Nothing important tomorrow morning.',options:[
['🕯️','A candlelit dinner','Long meal, good conversation, nowhere to rush',{romance:16,comfort:5,social:4,aesthetic:5}],['🪩','Somewhere loud','Crowd, music, unpredictable night',{social:18,novelty:7,serenity:-12,structure:-8,spontaneity:10}],['🚶','Walking with no plan','Just keep turning down interesting streets',{novelty:14,culture:9,structure:-12,romance:3,spontaneity:12}],['🛎️','Back at the hotel','Room service, shower, giant bed',{serenity:14,comfort:8,social:-9}]]},
{title:'You accidentally get one completely free day.',subtitle:'No reservations. No sunk costs.',options:[
['☁️','Keep it completely open','I’ll know what I want when I wake up',{structure:-18,novelty:8,serenity:4,spontaneity:14}],['🏛️','Museum + historic district','I want to understand where I am',{culture:18,structure:6,novelty:5}],['⛵','Book an excursion','Boat, trail, wildlife, something memorable',{activity:16,novelty:10,structure:4}],['🧖','Pool, spa, beach','I am not turning this into work',{serenity:18,comfort:10,activity:-5}]]},
{title:'You can upgrade exactly one part of the trip.',subtitle:'Everything else stays perfectly decent.',options:[
['🏨','The hotel','Where I stay changes the whole feeling',{comfort:18,serenity:7,aesthetic:5}],['🍽️','The food','I want meals I remember years later',{culture:10,comfort:8,romance:5}],['🎟️','The experiences','Give me the thing I couldn’t do at home',{novelty:16,activity:8,comfort:-3}],['🗓️','Make it longer','More time beats nicer stuff',{serenity:8,comfort:-10,culture:5}]]},
{title:'Who makes the trip better?',subtitle:'Not who you love most. Who fits this version of you?',options:[
['❤️','One person I’m close to','The trip is partly about us',{romance:18,social:2,serenity:4}],['👯','A small friend group','Energy without logistics hell',{social:14,novelty:4}],['🎉','A whole crew','If we’re going, we’re GOING',{social:20,structure:-6,serenity:-10,spontaneity:8}],['🧍','Honestly? Me.','I want the freedom to do exactly what I want',{social:-15,novelty:7,structure:-4,serenity:7}]]},
{title:'Which frustration ruins a trip fastest?',subtitle:'Annoyances reveal preferences surprisingly well.',options:[
['⏰','Every minute being scheduled','I need room for the trip to breathe',{structure:-18,serenity:8,spontaneity:12}],['❓','Nobody knowing the plan','I do not want to spend vacation negotiating',{structure:18,serenity:-2,spontaneity:-10}],['💸','Paying a lot for mediocre things','If it costs more, it should feel better',{comfort:12,culture:4,aesthetic:4}],['🥱','Feeling like I could’ve stayed home','Give me novelty or give me my money back',{novelty:20,activity:5,serenity:-5}]]},
{title:'Come home with exactly two of these.',subtitle:'Last one. Pick the payoff you actually care about.',multi:2,options:[
['😌','Actually rested','I want the trip to give something back',{serenity:12,comfort:6}],['✨','Inspired','I want to see normal life differently afterward',{culture:8,aesthetic:7,novelty:4}],['❤️','Closer to someone','The relationship is part of the destination',{romance:12,social:4}],['😂','A ridiculous story','I need at least one “you had to be there” moment',{novelty:10,social:6,spontaneity:8}],['🏔️','Proud of what I did','I want to earn at least one memory',{activity:10,novelty:4}],['✅','Glad everything worked','Smooth logistics are deeply underrated',{structure:8,comfort:5}]]}
];

export const QUESTIONS=applyCampaignQuestions(BASE_QUESTIONS);

const archetypes=[
['Golden Hour Romantic',[85,69,86,62,48,61,65,92,72,51],'You travel for atmosphere and emotional memory. A beautiful place, somebody you care about, a long meal and enough quiet to notice the moment can beat a packed itinerary.'],
['Beautiful Chaos',[67,92,61,22,86,69,70,59,62,88],'Your best trips develop a plot. You want people, novelty, movement and enough looseness for the night to become something nobody planned.'],
['Poolside Socialite',[80,72,91,44,67,60,62,87,72,65],'You like your fun with a soft landing. Good people, good surroundings and a comfortable base matter almost as much as what you do.'],
['Polished Nomad',[72,82,85,40,85,63,66,64,69,74],'You want energy without sloppiness. New places and social momentum work best when the experience still feels considered.'],
['Quiet Explorer',[77,80,84,34,40,64,64,95,71,68],'You want novelty without noise. Give you freedom, scenery and enough solitude to absorb a place without performing being on vacation.'],
['Romantic Planner',[83,76,74,65,73,66,72,69,68,55],'You like emotional trips, but you also like knowing the important pieces are handled. Thoughtful planning with room for chemistry is the sweet spot.'],
['Soft Adventurer',[73,89,70,57,47,81,64,86,65,55],'You want to do something memorable, then come back to peace. Adventure works best when it feels expansive rather than exhausting.'],
['Active Nomad',[71,94,62,50,73,86,64,65,62,65],'A vacation should change your scenery and your pulse. Movement and novelty are part of what makes it count.'],
['Social Explorer',[69,93,64,51,91,70,79,44,63,71],'People are part of how you experience a place. Culture and novelty hit harder when there is a group chat full of witnesses.'],
['Free-Range Adventurer',[70,92,61,27,53,77,66,86,62,76],'You want adventure without feeling managed. A loose plan, lots of options and permission to change your mind is basically your ideal itinerary.'],
['Culture Collector',[75,90,69,46,61,65,83,71,67,68],'You want a destination with layers. Food, neighborhoods, history, design and local texture are the point.'],
['Slow-Life Escapist',[81,80,74,21,68,62,64,85,68,83],'You want time to loosen. Romance, spontaneity and calm matter more than checking boxes.']
];
export const ARCHETYPES=archetypes.map(([name,v,copy])=>({name,copy,vector:Object.fromEntries(DIMENSIONS.map((k,i)=>[k,v[i]]))}));

const modes=[
['Coastal Romantic','🌅',[90,70,82,45,55,55,70,90,85,60],'Beautiful surroundings, slower pacing and enough emotional atmosphere for the trip to feel like a memory while it is happening.',[['Amalfi Coast','Full visual-romantic payoff.'],['Greek Islands','More breathing room with the same sun-and-water fantasy.'],['Mallorca','A flexible mix of coast, food and exploration.']]],
['Culture City','🏛️',[70,90,65,50,70,60,95,55,80,65],'Dense neighborhoods, food, history and enough local texture that wandering still feels productive.',[['Istanbul','Layered history and incredible food.'],['Rome','A ridiculous amount of context packed into ordinary walks.'],['Oaxaca','Culture and food without generic big-city energy.']]],
['Nightlife City','🪩',[65,95,65,30,95,65,75,35,75,90],'Your trip needs momentum after dark, lots of options and enough unpredictability to generate stories.',[['Barcelona','Nightlife plus beach and architecture.'],['Mexico City','Food, neighborhoods and endless energy.'],['Buenos Aires','Late dinners and a city that rewards staying out.']]],
['Nature Active','🥾',[60,90,55,45,45,95,55,80,80,65],'You want the destination to physically pull you into it. Scenery is better when there is something to climb, swim, hike or explore.',[['Costa Rica','Wildlife, water and movement.'],['Madeira','Huge scenery without constant crowds.'],['New Zealand','A nearly unfair concentration of active options.']]],
['Resort Luxury','🛎️',[80,65,95,60,60,40,45,95,85,45],'The trip works when friction disappears. Comfort, service and a beautiful base are part of why you left home.',[['Maldives-style resort','The environment does most of the work.'],['Palm Springs','Design, pools and low-friction indulgence.'],['St. Barts','Polish, water and deliberately easy living.']]],
['Slow Countryside','🌿',[80,70,70,30,40,55,65,95,80,80],'You want time to loosen up. Good scenery, quiet rituals and a little wandering beat an itinerary trying to prove something.',[['Tuscany','Food, countryside and very little urgency.'],['Provence','Pretty villages and a trip built around atmosphere.'],['Scottish Highlands','A cooler, moodier version of disappearing for a while.']]],
['Structured Megacity','🌃',[60,95,80,75,75,60,90,45,90,40],'You want extreme novelty without logistical chaos. Dense cities work when the systems underneath them let you explore confidently.',[['Tokyo','Novelty with structure and absurd variety.'],['Singapore','Comfort, food and precision.'],['Seoul','Fast, stylish and easy to keep moving through.']]],
['City + Coast','🌊',[75,85,75,45,70,65,80,70,80,70],'You resist choosing one vacation personality. You want culture, water, food, energy and recovery all available.',[['Lisbon + Cascais','City texture with an easy coastal release valve.'],['Barcelona','The obvious multitasker.'],['San Sebastián','Food, coast and a manageable city scale.']]]
];
export const TRAVEL_MODES=modes.map(([name,icon,v,copy,places])=>({name,icon,copy,places,vector:Object.fromEntries(DIMENSIONS.map((k,i)=>[k,v[i]]))}));

export const BADGES=[['❤️','Hopeless Romantic','romance',76],['🎲','Low-Key Spontaneous','spontaneity',72],['🛎️','Soft Luxury','comfort',78],['🏛️','Culture First','culture',76],['🥾','Motion First','activity',76],['🌿','Low-Noise','serenity',82],['🪩','Social Battery','social',78],['✨','Aesthetic Led','aesthetic',76],['🌍','Novelty Hungry','novelty',86],['📅','Needs a Plan','structure',68]];
export const CONTINUUMS=[['social','Quiet','Social'],['structure','Flexible','Structured'],['activity','Restful','Active'],['novelty','Familiar','Novel'],['comfort','Simple','Indulgent'],['aesthetic','Practical','Aesthetic']];
