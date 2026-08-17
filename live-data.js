export const LIVE_DIMENSIONS = Object.freeze([
  'discovery',
  'routine',
  'community',
  'aesthetic',
  'comfort',
  'pace',
  'quiet',
  'rootedness',
  'access',
  'flexibility'
]);

export const LIVE_DIMENSION_COPY = Object.freeze({
  discovery: ['Familiar', 'Exploratory', 'Discovery appetite'],
  routine: ['Fluid', 'Anchored', 'Everyday structure'],
  community: ['Private', 'Neighborly', 'Community energy'],
  aesthetic: ['Functional', 'Designed', 'Space aesthetics'],
  comfort: ['Bare-bones', 'Comfort-led', 'Home comfort'],
  pace: ['Slow', 'Fast', 'Everyday pace'],
  quiet: ['Stimulating', 'Peaceful', 'Quiet preference'],
  rootedness: ['Anonymous', 'Rooted', 'Sense of place'],
  access: ['Self-contained', 'Connected', 'Access appetite'],
  flexibility: ['Settled', 'Flexible', 'Lifestyle flexibility']
});

export const LIVE_QUESTIONS = Object.freeze([
  {
    title: 'It is Saturday morning. What do you want just outside your door?',
    subtitle: 'Pick the version of ordinary life that sounds best, not the one that photographs best.',
    options: [
      ['☕', 'My regular place and a familiar route', 'I like having little rituals that make the area feel mine.', { discovery: -5, routine: 8, rootedness: 10, quiet: 5 }],
      ['🚇', 'A street already doing something', 'Coffee, people, transit and options make the day feel open.', { pace: 10, access: 8, community: 5, quiet: -4 }],
      ['🌳', 'A calm walk with some green around me', 'The environment should lower the volume before the day gets busy.', { quiet: 10, comfort: 6, pace: -5, access: 4 }],
      ['🛋️', 'Honestly, a home I do not want to leave yet', 'A good base can be an experience instead of just where I sleep.', { comfort: 10, aesthetic: 7, community: -3, routine: 3 }]
    ]
  },
  {
    title: 'You can guarantee one thing about your next home. Which wins?',
    subtitle: 'Assume the tradeoff is real. You only get one guaranteed feature.',
    options: [
      ['🪟', 'Light, proportions and a space that feels considered', 'The room itself should have a point of view.', { aesthetic: 12, comfort: 6, rootedness: 4 }],
      ['🌙', 'A genuinely quiet place to sleep and reset', 'Peace is a feature, not empty space between features.', { quiet: 12, comfort: 8, pace: -5 }],
      ['🚶', 'I can walk or transit to most of what I use', 'Convenience changes the shape of everyday life.', { access: 12, pace: 8, comfort: -4 }],
      ['🍝', 'Enough room to have people over comfortably', 'Home gets better when it can hold other people too.', { community: 12, rootedness: 7, aesthetic: 4 }]
    ]
  },
  {
    title: 'Which neighborhood tradeoff are you most willing to make?',
    subtitle: 'None are perfect. Choose the compromise you would resent least.',
    options: [
      ['🏙️', 'Less space for more access', 'Being close to things can be worth giving up some square footage.', { access: 10, pace: 8, discovery: 8, comfort: -4 }],
      ['🏡', 'Less access for more quiet and comfort', 'I would rather come home to calm and travel farther when I need something.', { comfort: 10, quiet: 8, access: -5, pace: -4 }],
      ['🥐', 'A little noise for a real neighborhood scene', 'I like when nearby places and people give the area a pulse.', { community: 10, access: 7, quiet: -3, rootedness: 3 }],
      ['🧱', 'Fewer new options for somewhere I know deeply', 'Familiarity can become its own kind of richness.', { rootedness: 10, routine: 8, flexibility: -5, discovery: -3 }]
    ]
  },
  {
    title: 'It is 6 p.m. on a normal weekday. What sounds best?',
    subtitle: 'The boring Tuesday answer is often more revealing than the dream-weekend answer.',
    options: [
      ['🕯️', 'My usual home reset', 'A repeatable evening can make the rest of life feel less noisy.', { routine: 11, comfort: 8, quiet: 5, pace: -3 }],
      ['👋', 'See someone nearby without making it an event', 'I like social life that can happen with very little logistics.', { community: 11, access: 7, pace: 5 }],
      ['🗺️', 'Try a place or part of town I have not gotten to yet', 'Ordinary weeks feel better when they still contain discovery.', { discovery: 12, access: 9, flexibility: 6, routine: -4 }],
      ['🪴', 'Work on my space, cook, read or make something at home', 'My environment is part of how I spend the evening, not just the backdrop.', { aesthetic: 11, comfort: 7, quiet: 4, community: -2 }]
    ]
  },
  {
    title: 'What makes a place start feeling like yours?',
    subtitle: 'The thing that turns an address into a real sense of home.',
    options: [
      ['🗓️', 'My routines become automatic there', 'Knowing how the week works gives a place emotional weight.', { rootedness: 12, routine: 9, discovery: -4 }],
      ['🤝', 'I know people and people know me', 'Recognition makes a neighborhood feel smaller in the best way.', { community: 12, rootedness: 6, pace: 4 }],
      ['🎨', 'I have shaped the space until it feels unmistakably mine', 'The physical environment becomes part of my identity.', { aesthetic: 12, comfort: 7, quiet: 3 }],
      ['🔑', 'I know I can still change course easily', 'Home feels better when it is a base, not a trap.', { access: 11, discovery: 8, flexibility: 6 }]
    ]
  },
  {
    title: 'Which inconvenience would you tolerate for the right place?',
    subtitle: 'Every environment charges rent in money, time, noise or flexibility. Pick the tax you would pay.',
    options: [
      ['🚦', 'More noise for amazing access', 'I can forgive some stimulation when everyday life gets dramatically easier.', { access: 10, pace: 8, quiet: -8, comfort: -3 }],
      ['🚗', 'Going farther for more comfort and quiet', 'Distance is easier to forgive than feeling crowded or overstimulated at home.', { comfort: 10, quiet: 8, access: -6, pace: -4 }],
      ['🪞', 'Less practicality for a space I love being in', 'A beautiful environment can pay me back every single day.', { aesthetic: 10, comfort: 6, flexibility: -3 }],
      ['🧳', 'Less permanence for the freedom to change', 'I value having an exit ramp when my life changes.', { flexibility: 12, discovery: 7, routine: -7, rootedness: -4 }]
    ]
  },
  {
    title: 'You move tomorrow. What are you most likely to miss?',
    subtitle: 'Not the objectively best thing. The absence you would actually feel.',
    options: [
      ['🛤️', 'My familiar routes and little rituals', 'A place lives in the repeated things I barely have to think about.', { rootedness: 12, routine: 8, community: 4 }],
      ['🫂', 'The people woven into ordinary life', 'Losing effortless proximity to people would change the texture of the week.', { community: 11, rootedness: 8, access: 3 }],
      ['🌃', 'The energy and options', 'I notice when a place stops offering me reasons to leave the house.', { pace: 11, access: 9, discovery: 6, quiet: -5 }],
      ['🛏️', 'The feeling of my own space', 'Comfort and familiarity at home are harder to replace than they sound.', { comfort: 11, quiet: 8, aesthetic: 5 }]
    ]
  },
  {
    title: 'If where you live can give you one feeling, keep…',
    subtitle: 'The emotional payoff you would miss most if the environment stopped providing it.',
    options: [
      ['🧑‍🤝‍🧑', 'Connected', 'I want everyday life to make other people easier to reach.', { community: 12, access: 6, rootedness: 5 }],
      ['✨', 'Inspired', 'The place around me should occasionally make me want to do, see or make something.', { aesthetic: 12, discovery: 7, access: 5 }],
      ['🌿', 'Restored', 'Home and neighborhood should give some energy back instead of taking all of it.', { quiet: 12, comfort: 8, pace: -6 }],
      ['🪽', 'Free', 'I want enough flexibility that the place fits my life without defining the limits of it.', { flexibility: 12, discovery: 8, routine: -6, rootedness: -4 }]
    ]
  }
]);

const vector = (values) => Object.freeze(Object.fromEntries(LIVE_DIMENSIONS.map((key, index) => [key, values[index]])));

export const LIVE_ARCHETYPES = Object.freeze([
  { name: 'Open-Map Local', copy: 'You like a home base that makes the wider world easier to reach. Discovery and flexibility matter, but you still want enough comfort and community for the place to feel livable rather than temporary.', vector: vector([75,46,65,63,66,59,61,58,80,70]) },
  { name: 'Designed Regular', copy: 'You want ordinary life to feel considered. A beautiful, comfortable base matters most when it also has familiar routines and enough rootedness to become yours.', vector: vector([55,64,64,82,78,52,64,73,64,50]) },
  { name: 'Quiet Explorer', copy: 'You are more curious than your ideal home atmosphere might suggest. You want access to things worth discovering, then somewhere calm and comfortable to come back to.', vector: vector([65,52,63,62,80,46,78,60,67,63]) },
  { name: 'Rooted Connector', copy: 'You like an everyday life with recognizable structure, nearby options and enough familiarity to build attachment over time. The neighborhood should work before it performs.', vector: vector([62,63,62,61,66,59,63,70,78,58]) },
  { name: 'Sanctuary Builder', copy: 'Home is not just where you recover from life; it is one of the main places life happens. Comfort, quiet and a space that feels right can outweigh being in the middle of everything.', vector: vector([55,59,59,75,93,42,84,62,55,53]) },
  { name: 'City Seeker', copy: 'You want the environment to keep handing you options. Access, pace and discovery make everyday life feel larger, even if that means accepting a little more noise or friction at home.', vector: vector([73,51,66,62,55,75,48,60,93,62]) },
  { name: 'Social Pulse', copy: 'The place works when people are easy to reach and there is some life outside the door. Community, access and momentum matter more than perfect stillness.', vector: vector([60,56,85,61,56,69,49,72,85,56]) },
  { name: 'Neighborhood Loyalist', copy: 'You appreciate the compounding value of familiarity. Quiet, comfort, routines and a strong sense of place can make one neighborhood richer than constantly chasing the next option.', vector: vector([50,70,67,62,79,45,76,78,58,52]) },
  { name: 'Community Homebase', copy: 'Your ideal environment has enough warmth and familiarity that daily life feels socially held. You want comfort, community and rootedness without needing the neighborhood to be sleepy.', vector: vector([58,53,83,65,71,54,65,70,69,57]) },
  { name: 'Design Scout', copy: 'You notice spaces. Comfort and aesthetics matter, but curiosity still pulls you beyond the front door. The best base gives you both a visual point of view and things nearby worth exploring.', vector: vector([65,52,58,82,82,55,67,57,69,58]) },
  { name: 'Cultural Urbanist', copy: 'You like a place with texture, access and visible energy. Design, discovery and connection to what is happening around you can make a little stimulation feel worthwhile.', vector: vector([64,56,66,79,67,67,53,64,81,53]) },
  { name: 'Community Anchor', copy: 'Belonging is a feature for you. Familiar rhythms and people you recognize can matter as much as convenience, especially when a place gives you enough access without feeling anonymous.', vector: vector([50,70,77,65,63,58,57,84,71,50]) }
]);

export const LIVE_MODES = Object.freeze([
  { icon: '🚶', name: 'Rooted Walkable', copy: 'A familiar, connected neighborhood where daily errands, regular places and people can overlap naturally.', anchors: ['walkable everyday essentials', 'repeatable neighborhood rituals', 'enough local activity to stay connected'], vector: vector([55,68,68,66,63,61,56,78,76,52]) },
  { icon: '🌃', name: 'City Discovery', copy: 'A high-access base with enough movement and new options that ordinary weeks still contain exploration.', anchors: ['strong access to multiple districts', 'new places within easy reach', 'some visible everyday energy'], vector: vector([74,49,63,65,62,67,55,58,86,65]) },
  { icon: '🌿', name: 'Familiar Calm', copy: 'A quieter environment where comfort, routine and a strong sense of place do more work than constant novelty.', anchors: ['low-friction home routine', 'quiet enough to restore', 'familiar places worth returning to'], vector: vector([51,69,67,67,77,47,72,78,60,51]) },
  { icon: '🧭', name: 'Green Flex', copy: 'A calmer base with enough access and flexibility to keep life from feeling closed in.', anchors: ['easy access to calm or green space', 'multiple ways to structure a day', 'room to change plans without losing the base'], vector: vector([68,51,62,64,76,51,71,59,71,65]) },
  { icon: '🛋️', name: 'Private Sanctuary', copy: 'Home comfort and quiet carry the most weight. The environment should feel good even when you are not taking advantage of everything around it.', anchors: ['quiet sleeping and recovery space', 'comfort worth staying home for', 'a home layout that reduces friction'], vector: vector([56,58,60,74,91,43,82,62,57,55]) },
  { icon: '🪞', name: 'Designed Everyday', copy: 'A well-considered home and neighborhood make routine life feel better. Beauty is useful when you encounter it constantly.', anchors: ['light and space you enjoy daily', 'a visually coherent home base', 'enough nearby access to keep design from becoming isolation'], vector: vector([61,57,62,83,77,58,61,64,71,53]) },
  { icon: '🎉', name: 'Social Pulse', copy: 'A lively, connected environment where people and places are close enough to make plans feel almost accidental.', anchors: ['people within easy reach', 'visible local activity', 'strong access without much coordination'], vector: vector([62,55,80,62,55,73,47,69,88,56]) },
  { icon: '🏘️', name: 'Neighborly Base', copy: 'Community matters, but it does not need to be chaotic. You want recognition, comfort and enough local life to feel part of somewhere.', anchors: ['repeat encounters with familiar people', 'comfortable everyday amenities', 'a neighborhood scale that feels legible'], vector: vector([58,55,84,64,69,56,63,72,71,57]) }
]);

export const LIVE_BADGES = Object.freeze([
  ['🗺️', 'Always Looking Around', 'discovery', 80],
  ['🗓️', 'Routine Builder', 'routine', 80],
  ['🤝', 'Neighbor Energy', 'community', 80],
  ['🪞', 'Space Matters', 'aesthetic', 80],
  ['🛋️', 'Home Comfort', 'comfort', 82],
  ['⚡', 'Likes a Pulse', 'pace', 80],
  ['🌙', 'Quiet Counts', 'quiet', 82],
  ['🧱', 'Sense of Place', 'rootedness', 82],
  ['🚇', 'Access Hungry', 'access', 82],
  ['🪽', 'Needs Flexibility', 'flexibility', 80]
]);
