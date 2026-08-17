export const WATCH_DIMENSIONS = Object.freeze([
  'surprise',
  'coherence',
  'ensemble',
  'visuality',
  'accessibility',
  'momentum',
  'gentleness',
  'emotion',
  'complexity',
  'discovery'
]);

export const WATCH_DIMENSION_COPY = Object.freeze({
  surprise: ['Familiar', 'Surprising', 'Surprise appetite'],
  coherence: ['Loose', 'Tightly built', 'Narrative structure'],
  ensemble: ['Singular', 'Ensemble-led', 'Character breadth'],
  visuality: ['Story-first', 'Image-first', 'Visual sensitivity'],
  accessibility: ['Demanding', 'Easy-entry', 'Accessibility'],
  momentum: ['Patient', 'Propulsive', 'Momentum'],
  gentleness: ['Harsh', 'Gentle', 'Emotional softness'],
  emotion: ['Detached', 'Emotional', 'Emotional investment'],
  complexity: ['Simple', 'Layered', 'Complexity appetite'],
  discovery: ['Curated', 'Exploratory', 'Discovery instinct']
});

export const WATCH_QUESTIONS = Object.freeze([
  {
    title: 'You have one free night and no patience for a bad pick. What wins?',
    subtitle: 'Pick what sounds safest in the good way, not what sounds most impressive.',
    options: [
      ['🛋️', 'A favorite I already know works', 'Comfort can beat novelty when the night itself needs to be easy.', { surprise: -6, accessibility: 10, gentleness: 9, emotion: 5 }],
      ['🧩', 'A prestige mystery everyone says rewards attention', 'I want the pleasure of realizing the story was built on purpose.', { complexity: 10, coherence: 7, surprise: 5, momentum: -3 }],
      ['🍿', 'Something fast and ridiculously watchable', 'If I look at my phone, the movie lost.', { momentum: 12, accessibility: 6, surprise: 5, complexity: -4 }],
      ['🌌', 'The strangest-looking thing on the page', 'A strong image or premise can earn my trust before I know what it is.', { visuality: 11, surprise: 8, discovery: 6, accessibility: -3 }]
    ]
  },
  {
    title: 'What makes a “slow” story worth staying with?',
    subtitle: 'The thing that buys the story more patience from you.',
    options: [
      ['🫶', 'I care about the people', 'If the relationships feel alive, very little has to explode.', { emotion: 12, ensemble: 8, accessibility: 5 }],
      ['🧠', 'I can feel the machinery underneath', 'Setup, implication and payoff make slowness feel deliberate.', { complexity: 12, coherence: 9, momentum: -4 }],
      ['🎞️', 'The atmosphere is doing real work', 'Composition, sound and mood can be part of the plot.', { visuality: 12, gentleness: 5, momentum: -3 }],
      ['⏳', 'Eventually it absolutely pays off', 'Patience is easier when I can feel the fuse burning.', { momentum: 12, surprise: 7, accessibility: 5 }]
    ]
  },
  {
    title: 'A show ends. Which reaction feels best?',
    subtitle: 'Not necessarily your favorite ending ever. The kind of satisfaction you chase.',
    options: [
      ['✅', '“Oh, that was all intentional.”', 'Threads snap together and the construction becomes visible.', { coherence: 13, complexity: 8, discovery: -4 }],
      ['😵', '“What the hell did I just watch?”', 'I like leaving with a new mental object I cannot immediately file away.', { surprise: 12, discovery: 10, visuality: 5 }],
      ['😭', '“I am going to think about those characters all week.”', 'Emotional residue matters more than solving everything.', { emotion: 12, ensemble: 8, complexity: 4 }],
      ['🚀', '“That moved.”', 'Pacing can be its own kind of craft.', { momentum: 10, accessibility: 8, complexity: -5 }]
    ]
  },
  {
    title: 'Which cast setup pulls you in fastest?',
    subtitle: 'Assume all four versions are well acted.',
    options: [
      ['👥', 'A messy group with chemistry', 'I want alliances, friction and people bouncing off each other.', { ensemble: 12, emotion: 8, accessibility: 4 }],
      ['🕵️', 'One obsessive person I can study', 'A singular perspective can make a whole world feel sharper.', { complexity: 12, coherence: 8, ensemble: -4 }],
      ['🧚', 'People who feel slightly unreal', 'The cast can belong to the tone as much as the plot.', { visuality: 12, surprise: 8, gentleness: 3 }],
      ['🏃', 'Whoever keeps the story moving', 'Character is great. Forward motion is also character.', { momentum: 12, surprise: 5, gentleness: -6 }]
    ]
  },
  {
    title: 'What kind of “easy watch” do you actually mean?',
    subtitle: 'Easy does not have to mean shallow.',
    options: [
      ['☕', 'Warm and familiar', 'I want the story to lower the temperature of the room.', { gentleness: 12, accessibility: 12, surprise: -6 }],
      ['🎢', 'Pure momentum', 'Give me clean stakes and something happening every few minutes.', { momentum: 12, surprise: 6, complexity: -5 }],
      ['🔎', 'A mystery with rules', 'I can relax if there is a clear problem to keep turning over.', { complexity: 11, coherence: 8, gentleness: -4 }],
      ['💞', 'Emotionally direct', 'I do not need irony between me and the feeling.', { emotion: 11, visuality: 7, ensemble: 5 }]
    ]
  },
  {
    title: 'Your algorithm recommends something outside your usual lane. What gets the click?',
    subtitle: 'The hook that can override your normal taste.',
    options: [
      ['📼', '“People who love your favorite also love this.”', 'A trusted connection makes unfamiliar things easier to try.', { surprise: -12, accessibility: 10, emotion: 7, gentleness: 6 }],
      ['🧪', '“There is genuinely nothing else like it.”', 'Specificity is a better pitch than broad approval.', { discovery: 12, surprise: 10, complexity: 5 }],
      ['🏆', '“The writing is insanely tight.”', 'Craft is the invitation.', { coherence: 10, complexity: 9, discovery: -4 }],
      ['🖼️', 'One frame looks incredible', 'Sometimes the image is enough reason to enter the world.', { visuality: 10, emotion: 7, gentleness: 6 }]
    ]
  },
  {
    title: 'What loses you fastest?',
    subtitle: 'The flaw that can poison a story even if other people love it.',
    options: [
      ['🧵', 'It feels random instead of surprising', 'I can enjoy weird. I still want choices to have a reason.', { coherence: -10, complexity: -8, surprise: 5, discovery: 6 }],
      ['🧊', 'I do not care about anyone', 'A clever machine without emotional stakes can leave me cold.', { emotion: -10, accessibility: -5, complexity: 8 }],
      ['🐌', 'Nothing seems to move', 'Stillness has to earn itself.', { momentum: -12, accessibility: -4, complexity: 6, visuality: 4 }],
      ['📺', 'It looks visually dead', 'A story can be simple and still need a point of view.', { visuality: -10, gentleness: -4, coherence: 5 }]
    ]
  },
  {
    title: 'If a story can only leave you with one thing, keep…',
    subtitle: 'The residue you want after the credits.',
    options: [
      ['❤️', 'A feeling', 'I want to have cared, not just understood.', { emotion: 13, gentleness: 6, ensemble: 5 }],
      ['🧠', 'A question', 'The best stories keep unfolding after they stop.', { complexity: 13, coherence: 8, surprise: 5 }],
      ['⚡', 'A rush', 'Energy is a legitimate artistic outcome.', { momentum: 13, surprise: 7, accessibility: 4 }],
      ['🌠', 'An image I cannot forget', 'One unforgettable visual can hold the whole experience together in memory.', { visuality: 11, surprise: 9, discovery: 8 }]
    ]
  }
]);

const vector = (values) => Object.freeze(Object.fromEntries(WATCH_DIMENSIONS.map((key, index) => [key, values[index]])));

export const WATCH_ARCHETYPES = Object.freeze([
  { name: 'Emotional Worldbuilder', copy: 'You want a world big enough to disappear into and people human enough to make that world matter. Lore only really lands when it carries feeling.', vector: vector([72,72,68,78,60,58,58,88,76,62]) },
  { name: 'Prestige Puzzlebox', copy: 'You enjoy realizing the story knew more than you did. Structure, implication and delayed payoff are part of the entertainment, not homework around it.', vector: vector([74,88,48,65,52,50,42,56,94,58]) },
  { name: 'Comfort Rewatcher', copy: 'You value the rare story that becomes a place. Familiarity is not a failure of taste for you; sometimes knowing exactly how something feels is the point.', vector: vector([36,68,64,55,94,48,86,78,50,42]) },
  { name: 'Kinetic Escapist', copy: 'You like stories that know they are competing for your attention and win anyway. Momentum, clarity and spectacle are not guilty pleasures when they are done well.', vector: vector([78,58,62,67,78,94,42,62,48,66]) },
  { name: 'Character Devotee', copy: 'Plot gets your attention, people keep it. Chemistry, attachment and emotional consequence matter enough that you will follow characters into quieter stories.', vector: vector([58,70,88,55,74,56,68,94,62,50]) },
  { name: 'Visual Dreamer', copy: 'You remember stories in images. Atmosphere, composition and strange visual logic can pull you somewhere before the narrative explains why you should care.', vector: vector([82,56,52,96,56,48,74,72,64,80]) },
  { name: 'Dark Curiosity', copy: 'You do not need a story to comfort you. You want to inspect motives, systems and unsettling questions closely enough that “pleasant” can become beside the point.', vector: vector([76,72,50,62,48,54,36,48,92,72]) },
  { name: 'Clever Crowd-Pleaser', copy: 'You appreciate entertainment that is generous with the audience without becoming empty. Big momentum, strong ensembles and clean craft can all coexist.', vector: vector([68,76,82,62,88,82,56,72,56,54]) },
  { name: 'Slow-Burn Observer', copy: 'You can sit with a story when the stillness is precise. Performance, implication and accumulated detail matter more than a constant stream of events.', vector: vector([52,82,54,76,56,34,72,74,86,46]) },
  { name: 'Chaos Tourist', copy: 'You are willing to follow a story somewhere unstable if the ride feels singular. Surprise, velocity and a little formal recklessness can be the whole appeal.', vector: vector([96,42,64,80,60,86,38,58,56,92]) },
  { name: 'Lore Archivist', copy: 'You like stories that reward remembering. Rules, history, callbacks and buried connections turn watching into a satisfying act of reconstruction.', vector: vector([66,94,56,72,52,48,48,70,96,42]) },
  { name: 'Heart-on-Sleeve Adventurer', copy: 'You want the ride and the feeling. Big worlds, visible emotion and forward motion work best when nobody is embarrassed to care.', vector: vector([82,62,74,72,72,84,54,92,58,72]) }
]);

export const WATCH_MODES = Object.freeze([
  { icon: '🌌', name: 'Epic Immersion', copy: 'Big worlds, emotional stakes and enough lore to make the story feel larger than the episode in front of you.', anchors: ['world with rules worth learning', 'emotionally legible core relationship', 'visual identity that rewards immersion'], vector: vector([73,78,66,79,61,66,56,83,82,58]) },
  { icon: '🫶', name: 'Character Intimacy', copy: 'Relationships and emotional consequence lead; plot can slow down if the people keep getting more specific.', anchors: ['strong central relationship', 'performance-led storytelling', 'room for quiet consequences'], vector: vector([55,70,86,58,72,48,74,93,66,45]) },
  { icon: '🧩', name: 'Puzzlebox Prestige', copy: 'A tightly constructed mystery or system is the pleasure. The story should reward attention without confusing opacity for depth.', anchors: ['clear underlying rules', 'delayed but real payoff', 'details that change meaning later'], vector: vector([74,91,48,66,50,50,42,56,94,54]) },
  { icon: '🍿', name: 'Adrenaline Popcorn', copy: 'Clean stakes, visible momentum and enough spectacle to make two hours disappear.', anchors: ['fast premise', 'strong set-piece rhythm', 'characters readable at speed'], vector: vector([76,60,66,69,86,95,42,62,45,62]) },
  { icon: '☕', name: 'Cozy Familiar', copy: 'Warmth, readability and emotional safety matter more than novelty for novelty’s sake.', anchors: ['characters you enjoy returning to', 'low-friction tone', 'predictability used as comfort'], vector: vector([38,70,72,57,94,45,88,82,48,38]) },
  { icon: '🪩', name: 'Stylish Weird', copy: 'You want a visible point of view: strange images, unusual structure or a tone that could not have come from a committee.', anchors: ['singular visual language', 'permission to get strange', 'enough coherence to make the weirdness land'], vector: vector([90,55,55,94,52,62,56,66,64,88]) },
  { icon: '🔦', name: 'Dark Investigative', copy: 'Ambiguity, motive and uncomfortable questions are the draw. You are willing to trade softness for something worth examining.', anchors: ['psychological or systemic question', 'controlled withholding', 'details worth reinterpreting'], vector: vector([72,79,48,64,46,50,34,52,92,68]) },
  { icon: '🎉', name: 'Social Crowd-Pleaser', copy: 'The best pick is the one that is easy to enter, fun to react to and good enough that everyone has something to say afterward.', anchors: ['immediate hook', 'ensemble chemistry', 'big moments without homework'], vector: vector([64,69,86,63,91,82,55,72,50,58]) }
]);

export const WATCH_BADGES = Object.freeze([
  ['🧠', 'Needs Layers', 'complexity', 80],
  ['⚡', 'Momentum Matters', 'momentum', 80],
  ['🎞️', 'Visual Memory', 'visuality', 80],
  ['❤️', 'Feels It Fully', 'emotion', 82],
  ['🧪', 'Weirdness Welcome', 'surprise', 82],
  ['🧵', 'Craft Tracker', 'coherence', 82],
  ['👥', 'Ensemble Brain', 'ensemble', 80],
  ['☕', 'Comfort Watcher', 'accessibility', 82],
  ['🌙', 'Softness Counts', 'gentleness', 80],
  ['🔭', 'Discovery Mode', 'discovery', 80]
]);
