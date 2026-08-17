export const MOVE_DIMENSIONS = Object.freeze([
  'variety',
  'structure',
  'social',
  'craft',
  'recovery',
  'intensity',
  'calm',
  'identity',
  'learning',
  'flexibility'
]);

export const MOVE_DIMENSION_COPY = Object.freeze({
  variety: ['Repeatable', 'Varied', 'Variety appetite'],
  structure: ['Flexible', 'Programmed', 'Training structure'],
  social: ['Solo', 'Social', 'Social energy'],
  craft: ['Outcome-first', 'Technique-led', 'Movement craft'],
  recovery: ['Push through', 'Recovery-aware', 'Recovery priority'],
  intensity: ['Measured', 'Intense', 'Intensity appetite'],
  calm: ['Stimulating', 'Grounded', 'Training calm'],
  identity: ['Just exercise', 'Identity-linked', 'Training identity'],
  learning: ['Do it', 'Understand it', 'Learning appetite'],
  flexibility: ['Fixed plan', 'Adaptable', 'Session flexibility']
});

export const MOVE_QUESTIONS = Object.freeze([
  {
    title: 'You walk into the gym with exactly one hour. What sounds best?',
    subtitle: 'Pick the session you would actually look forward to today.',
    options: [
      ['📋', 'A familiar plan with numbers to beat', 'I like knowing what the session is for before I touch a weight.', { structure: 10, craft: 8, flexibility: -6, intensity: 3 }],
      ['🌿', 'A lighter session that leaves me better than I arrived', 'Not every good workout has to feel like a fight.', { recovery: 10, calm: 9, intensity: -4, structure: -3 }],
      ['🔥', 'Something hard enough to feel like an event', 'I want a visible challenge, not background activity.', { intensity: 12, variety: 7, social: 4, recovery: -4 }],
      ['🎲', 'Whatever feels interesting once I get there', 'I would rather react to the day than force the day into the plan.', { variety: 10, learning: 8, flexibility: 7, structure: -4 }]
    ]
  },
  {
    title: 'What makes progress feel most satisfying?',
    subtitle: 'The signal you trust most when deciding whether training is working for you.',
    options: [
      ['📈', 'The logbook moved', 'A clear number changing over time makes the effort feel real.', { structure: 12, learning: 8, flexibility: -5 }],
      ['🎯', 'The movement looked and felt cleaner', 'Better control can be as satisfying as heavier weight.', { craft: 12, learning: 10, intensity: 4 }],
      ['🔋', 'I can train consistently without feeling cooked', 'Sustainability is part of progress, not an afterthought.', { recovery: 13, calm: 7, intensity: -5 }],
      ['🤝', 'Someone else noticed I leveled up', 'Shared effort and a little outside energy make progress hit harder.', { social: 11, intensity: 7, identity: 5 }]
    ]
  },
  {
    title: 'Which kind of challenge sounds fun instead of annoying?',
    subtitle: 'Assume all four are safe and appropriate for you.',
    options: [
      ['⏱️', 'A hard benchmark', 'Give me a target, a clock or a number and let me chase it.', { intensity: 12, structure: 6, recovery: -5 }],
      ['🧠', 'A technical skill I cannot fake', 'I like when getting better requires attention, not just effort.', { craft: 11, calm: 6, learning: 8 }],
      ['🏟️', 'A group challenge', 'Other people make the room more alive.', { social: 12, identity: 8, flexibility: 5 }],
      ['🧭', 'A completely different training style', 'Novelty itself can make me want to show up.', { variety: 11, flexibility: 9, structure: -7 }]
    ]
  },
  {
    title: 'Your week gets chaotic. What survives?',
    subtitle: 'The part of training you protect when the ideal schedule falls apart.',
    options: [
      ['🗓️', 'The core program', 'The main progression stays even if the accessories disappear.', { structure: 13, learning: 6, flexibility: -7 }],
      ['🧪', 'At least one session that feels fresh', 'I need some novelty or training starts feeling like another chore.', { variety: 12, learning: 8, structure: -5 }],
      ['🫧', 'Enough recovery to want to come back', 'Missing a little work is better than turning training into dread.', { recovery: 10, calm: 8, intensity: -6 }],
      ['🪞', 'The habit itself', 'Training is part of how I recognize my week, even when the details change.', { identity: 12, craft: 7, social: 3 }]
    ]
  },
  {
    title: 'What kind of environment gets the best session out of you?',
    subtitle: 'Not where you can train. Where you naturally switch on.',
    options: [
      ['📣', 'People around me pushing', 'A room with energy makes me find another gear.', { social: 12, intensity: 7, identity: 6 }],
      ['🎧', 'My own quiet bubble', 'I want enough space to notice what I am doing.', { calm: 12, craft: 7, social: -5 }],
      ['📊', 'A setup where everything is measurable', 'Clear inputs and outputs make the session satisfying.', { structure: 10, learning: 9, variety: -4 }],
      ['🛠️', 'A place where I can improvise', 'Options matter more than perfect predictability.', { flexibility: 12, variety: 7, structure: -8 }]
    ]
  },
  {
    title: 'You suddenly get an extra 20 minutes. Where does it go?',
    subtitle: 'The bonus work you choose when nothing is forcing you.',
    options: [
      ['🔬', 'Technique practice', 'I would rather sharpen something than just add more fatigue.', { craft: 12, learning: 9, calm: 5 }],
      ['🧨', 'One more hard finisher', 'If I still have gas, I want to use it.', { intensity: 12, identity: 8, recovery: -4 }],
      ['🧘', 'Mobility, cooldown or easy movement', 'Leaving the session feeling put back together is valuable.', { recovery: 12, calm: 10, structure: 4 }],
      ['🧩', 'Try something I normally skip', 'Extra time is permission to explore.', { variety: 12, flexibility: 8, learning: 5 }]
    ]
  },
  {
    title: 'What ruins a training phase fastest?',
    subtitle: 'The problem that makes you stop buying into the plan.',
    options: [
      ['🥵', 'I feel wrecked all the time', 'Hard work stops being impressive when it makes every session worse.', { intensity: -12, recovery: 8, calm: 5 }],
      ['🧱', 'The plan feels too rigid', 'Life changes. I need the training to bend without breaking.', { structure: -10, flexibility: 8, variety: 5 }],
      ['👥', 'Too much group energy', 'I like focusing without turning every session into a social event.', { social: -11, identity: 4, calm: 5 }],
      ['🤷', 'I do not understand what I am trying to improve', 'Effort is easier to trust when I can see the skill or logic underneath it.', { craft: -10, learning: 7, intensity: 4 }]
    ]
  },
  {
    title: 'If training can only give you one feeling, keep…',
    subtitle: 'The emotional payoff you would miss most if it disappeared.',
    options: [
      ['🏗️', 'Capable', 'I like the feeling that I am deliberately building something in myself.', { identity: 13, craft: 6, structure: 5 }],
      ['💡', 'Curious', 'Learning how my body and training respond keeps me interested.', { learning: 13, variety: 5, craft: 5 }],
      ['⚡', 'Powerful', 'I want at least some sessions where the effort feels undeniable.', { intensity: 13, social: 4, recovery: -4 }],
      ['🌱', 'Reset', 'Movement can be one of the ways the rest of the day gets quieter.', { calm: 12, recovery: 8, flexibility: 6 }]
    ]
  }
]);

const vector = (values) => Object.freeze(Object.fromEntries(MOVE_DIMENSIONS.map((key, index) => [key, values[index]])));

export const MOVE_ARCHETYPES = Object.freeze([
  { name: 'Freeform Balancer', copy: 'You like movement to fit the day instead of fighting it. Variety, adaptability and a calmer relationship with recovery matter more than obeying a perfect spreadsheet.', vector: vector([75,41,57,58,72,51,75,60,66,72]) },
  { name: 'Technique Tinkerer', copy: 'You can enjoy training without turning every session into a test. Craft, learning and the satisfaction of making a movement cleaner keep you engaged.', vector: vector([68,50,50,76,66,50,77,59,80,61]) },
  { name: 'Sustainable Grinder', copy: 'You still like effort, but you want effort you can repeat. Consistency, enough intensity to feel real, and enough recovery to keep coming back are all part of the same system.', vector: vector([61,60,57,56,67,66,76,61,66,56]) },
  { name: 'Program Purist', copy: 'You trust a plan that has a point. Clear progression, measurable work and knowing why the session exists make training easier to commit to.', vector: vector([56,78,55,64,51,72,63,64,77,45]) },
  { name: 'Social Spark', copy: 'Training gets better when the room has some life in it. You respond to novelty, shared energy and challenges that feel more like events than appointments.', vector: vector([76,43,66,59,52,74,61,68,68,68]) },
  { name: 'Recovery Strategist', copy: 'You value the ability to return fresh enough to care. Calm, recovery and long-run consistency are not the opposite of ambition in your training taste.', vector: vector([59,55,54,63,83,44,88,60,65,59]) },
  { name: 'Variety Explorer', copy: 'Repetition needs a reason or it starts losing you. New methods, new skills and enough flexibility to follow curiosity make movement feel alive.', vector: vector([85,39,55,65,55,59,62,59,81,74]) },
  { name: 'Craft Athlete', copy: 'You like effort most when it has technique inside it. Control, execution and learning how to do something well make intensity feel more satisfying.', vector: vector([64,55,53,79,51,68,67,68,76,56]) },
  { name: 'Methodical Builder', copy: 'You are patient with repetition when it is clearly building somewhere. Structure, technique and understanding the process make consistency feel purposeful.', vector: vector([55,73,50,73,66,52,76,61,77,47]) },
  { name: 'Team Motivator', copy: 'Training is easier to care about when it connects to people and identity. Shared effort, encouragement and a little accountability bring out your best energy.', vector: vector([60,56,69,66,64,59,69,77,64,59]) },
  { name: 'Curious Programmer', copy: 'You like a framework, but you also want to understand and experiment inside it. The best plan gives you enough structure to learn from variation instead of fearing it.', vector: vector([73,62,56,60,55,62,62,59,85,59]) },
  { name: 'Competitive Crew', copy: 'You come alive when effort is visible and other people are in the room. Challenge, identity and social energy can turn a normal session into something worth chasing.', vector: vector([63,59,68,58,47,84,59,71,68,54]) }
]);

export const MOVE_MODES = Object.freeze([
  { icon: '📈', name: 'Progressive Strength', copy: 'A repeatable core, visible progression and enough technical attention to make the numbers mean something.', anchors: ['one clear progress marker', 'repeatable main movements', 'small room for accessory variation'], vector: vector([54,86,48,76,58,72,62,68,74,40]) },
  { icon: '🧭', name: 'Athletic Variety', copy: 'Different challenges keep motivation alive, especially when the variation still develops recognizable skills.', anchors: ['rotating movement challenges', 'one skill to carry forward', 'multiple ways to measure a good day'], vector: vector([90,46,58,68,56,72,60,62,76,80]) },
  { icon: '🎯', name: 'Skill Practice', copy: 'Precision, learning and repeatable reps are the reward. The session feels good when you can tell your execution changed.', anchors: ['a movement worth practicing', 'clear technical cue', 'enough quiet to notice improvement'], vector: vector([62,64,46,94,66,50,82,61,92,56]) },
  { icon: '🤝', name: 'Group Energy', copy: 'Other people create momentum. Shared sessions, classes or training partners make effort feel more immediate and memorable.', anchors: ['visible group energy', 'shared challenge or accountability', 'room for individual scaling'], vector: vector([68,54,94,60,54,76,56,82,62,64]) },
  { icon: '🌿', name: 'Recovery Reset', copy: 'Movement works best when it lowers friction rather than adding more. You value consistency, restoration and leaving some energy for life after the session.', anchors: ['manageable effort', 'recovery-friendly pacing', 'a clear stopping point'], vector: vector([52,56,42,66,94,36,96,62,64,66]) },
  { icon: '🎲', name: 'Flexible Generalist', copy: 'You want enough options to fit training around real life. A good session can change shape without losing its purpose.', anchors: ['modular session choices', 'minimum viable version of the plan', 'permission to follow energy'], vector: vector([76,38,54,60,76,52,76,60,70,94]) },
  { icon: '🔥', name: 'High-Intensity Challenge', copy: 'A workout becomes compelling when the target feels real. You like effort you can point at, chase and remember.', anchors: ['clear challenge', 'visible finish line', 'enough recovery between hard efforts'], vector: vector([68,62,66,58,42,94,50,78,66,54]) },
  { icon: '🧘', name: 'Mindful Movement', copy: 'Attention is part of the session. Control, breathing room and feeling more grounded can matter as much as the final number.', anchors: ['technical or body-awareness cue', 'low-distraction environment', 'finish feeling more organized'], vector: vector([56,58,40,84,84,46,94,68,82,62]) }
]);

export const MOVE_BADGES = Object.freeze([
  ['📈', 'Progress Tracker', 'structure', 80],
  ['🔥', 'Likes to Push', 'intensity', 82],
  ['🎯', 'Form Nerd', 'craft', 80],
  ['🧪', 'Exercise Explorer', 'variety', 82],
  ['🤝', 'Better Together', 'social', 80],
  ['🫧', 'Recovery Counts', 'recovery', 82],
  ['🌿', 'Calm Mover', 'calm', 82],
  ['🏗️', 'Training Identity', 'identity', 80],
  ['📚', 'Learns the Why', 'learning', 82],
  ['🎲', 'Flexible Session', 'flexibility', 80]
]);
