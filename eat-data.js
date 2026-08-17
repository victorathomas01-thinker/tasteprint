export const EAT_DIMENSIONS = Object.freeze([
  'adventure',
  'ritual',
  'sharing',
  'presentation',
  'comfort',
  'intensity',
  'ease',
  'nostalgia',
  'curiosity',
  'spontaneity'
]);

export const EAT_DIMENSION_COPY = Object.freeze({
  adventure: ['Familiar', 'Adventurous', 'Food adventure'],
  ritual: ['Casual', 'Ritualized', 'Meal ritual'],
  sharing: ['Individual', 'Shared', 'Table energy'],
  presentation: ['Taste-first', 'Presentation-led', 'Visual appetite'],
  comfort: ['Challenge me', 'Comforting', 'Comfort pull'],
  intensity: ['Subtle', 'Bold', 'Flavor intensity'],
  ease: ['High-stimulation', 'Easygoing', 'Dining ease'],
  nostalgia: ['Present-tense', 'Nostalgic', 'Food memory'],
  curiosity: ['Known favorites', 'Curious', 'Food curiosity'],
  spontaneity: ['Planned', 'Spontaneous', 'Dining spontaneity']
});

export const EAT_QUESTIONS = Object.freeze([
  {
    title: 'You are starving and have one shot at dinner. What sounds safest in the good way?',
    subtitle: 'Pick what you would actually trust tonight, not the answer that sounds most adventurous.',
    options: [
      ['🍲', 'A favorite that always lands', 'Reliability can be part of the pleasure.', { adventure: -6, comfort: 10, nostalgia: 9, ease: 5 }],
      ['🌶️', 'Something I have never tried', 'A new flavor can be worth a little risk.', { adventure: 8, curiosity: 8, intensity: 5, spontaneity: 4 }],
      ['🍽️', 'A table full of things to share', 'The meal gets better when everyone is reaching across it.', { sharing: 10, comfort: 5, ritual: 5, ease: 3 }],
      ['✨', 'The place where every plate looks considered', 'Part of dinner is enjoying how the whole thing is put together.', { presentation: 10, ritual: 7, curiosity: 5, spontaneity: -3 }]
    ]
  },
  {
    title: 'What makes one bite instantly memorable?',
    subtitle: 'The thing that gets your attention before you have time to overthink it.',
    options: [
      ['🔥', 'A huge flavor hit', 'Heat, acid, smoke, spice or richness should announce itself.', { intensity: 12, adventure: 7, comfort: -4 }],
      ['🔍', 'A detail I did not expect', 'Texture, technique or one strange ingredient can make the whole dish click.', { curiosity: 11, presentation: 8, ritual: 5 }],
      ['🫶', 'It tastes like home', 'Recognition can land harder than novelty.', { comfort: 12, nostalgia: 8, ease: 6 }],
      ['🥂', 'Everyone at the table reacts', 'Food is more fun when the moment becomes shared immediately.', { sharing: 11, spontaneity: 8, ritual: -4 }]
    ]
  },
  {
    title: 'A menu has one thing you cannot picture at all. What do you do?',
    subtitle: 'Assume the restaurant is good and there are no allergy or dietary issues.',
    options: [
      ['🧭', 'Order it because I cannot picture it', 'Mystery is a feature when the kitchen has earned trust.', { adventure: 12, curiosity: 8, spontaneity: 6 }],
      ['📖', 'Ask enough questions to understand it first', 'I like novelty better when I can see the logic.', { ritual: 12, presentation: 7, spontaneity: -5 }],
      ['🍝', 'Stay with the thing I know I will love', 'Dinner does not need to become a gamble to count.', { comfort: 10, nostalgia: 10, adventure: -5 }],
      ['⚡', 'Choose the boldest-sounding option', 'If I am taking a chance, I want the payoff to have some volume.', { intensity: 10, presentation: 6, sharing: 5 }]
    ]
  },
  {
    title: 'What kind of dinner invitation is hardest to turn down?',
    subtitle: 'Imagine your schedule is clear and every option is within budget.',
    options: [
      ['👥', 'A loud table with people I like', 'The meal is partly an excuse to make a night out of being together.', { sharing: 12, ease: 5, comfort: 4 }],
      ['🕯️', 'A beautiful place with a whole point of view', 'Lighting, room, plating and pace can all become part of the meal.', { presentation: 11, curiosity: 8, ritual: 5 }],
      ['🚶', '“Meet me there, I found something weird”', 'A spontaneous discovery sounds better than a reservation I made two weeks ago.', { spontaneity: 12, adventure: 8, ritual: -5 }],
      ['🏠', 'Someone cooking the thing they grew up with', 'Food with a story behind it has an extra layer.', { nostalgia: 11, comfort: 8, adventure: -4 }]
    ]
  },
  {
    title: 'You can upgrade one part of a meal. Where does the money go?',
    subtitle: 'The part that most changes whether dinner feels worth it.',
    options: [
      ['🧪', 'An ingredient or dish I have never had', 'Discovery beats polish when the food itself opens a door.', { curiosity: 12, adventure: 8, intensity: 4 }],
      ['🛋️', 'A place I can actually relax in', 'The room should help me enjoy the food instead of competing with it.', { comfort: 11, ease: 8, nostalgia: 4 }],
      ['🎨', 'The chef-level execution and presentation', 'Details are part of the value.', { presentation: 12, ritual: 8, sharing: 3 }],
      ['🌶️', 'The most flavor-forward version', 'I would rather remember the taste than the chair.', { intensity: 12, adventure: 5, ease: -5 }]
    ]
  },
  {
    title: 'You discover a place you love. What happens next?',
    subtitle: 'Your instinct after the first great visit.',
    options: [
      ['🔁', 'I start ordering my thing there', 'A great regular order can become its own ritual.', { ritual: 11, comfort: 7, nostalgia: 5 }],
      ['🗺️', 'I bring someone back and order differently', 'A good find makes me want to keep exploring it with people.', { spontaneity: 11, adventure: 8, sharing: 4 }],
      ['🧠', 'I want to understand why it was so good', 'Technique, ingredients and context make the meal more interesting afterward.', { curiosity: 12, presentation: 7, intensity: 3 }],
      ['😌', 'I save it for nights when I do not want to think', 'A reliable place can become a kind of infrastructure.', { ease: 12, comfort: 8, ritual: -5 }]
    ]
  },
  {
    title: 'What ruins a meal fastest?',
    subtitle: 'The flaw that is hardest for the rest of dinner to recover from.',
    options: [
      ['📢', 'Everything is too aggressive', 'More flavor is not automatically better flavor.', { intensity: -11, comfort: 7, ease: 5 }],
      ['📸', 'It looks impressive but feels empty', 'Presentation cannot substitute for an interesting bite.', { presentation: -10, comfort: 5, curiosity: 6 }],
      ['⏰', 'The whole experience feels over-managed', 'Too much ceremony can make dinner feel like homework.', { ritual: -10, spontaneity: 8, adventure: 5 }],
      ['🗣️', 'I cannot actually enjoy the people I am with', 'A meal can have energy without turning into sensory combat.', { sharing: -10, ease: 7, comfort: 4 }]
    ]
  },
  {
    title: 'If food can only give you one kind of payoff, keep…',
    subtitle: 'The thing you would miss most if meals stopped doing it for you.',
    options: [
      ['💭', 'A memory', 'Food is one of the fastest ways to connect a moment to a person or place.', { nostalgia: 13, comfort: 5, ritual: 4 }],
      ['💡', 'A discovery', 'I want meals to keep teaching me what I can like.', { curiosity: 13, adventure: 6, presentation: 4 }],
      ['🤝', 'A shared moment', 'The table matters because of who is around it.', { sharing: 13, ease: 5, comfort: 3 }],
      ['⚡', 'A sensation', 'Sometimes the best meal is the one I can still taste in my head tomorrow.', { intensity: 13, adventure: 5, spontaneity: 4 }]
    ]
  }
]);

const vector = (values) => Object.freeze(Object.fromEntries(EAT_DIMENSIONS.map((key, index) => [key, values[index]])));

export const EAT_ARCHETYPES = Object.freeze([
  { name: 'Thoughtful Taster', copy: 'You like food to reward attention without turning dinner into a performance. Curiosity, comfort and a little personal meaning can all live on the same plate.', vector: vector([63,58,56,64,78,57,64,69,82,58]) },
  { name: 'Comfort With Kick', copy: 'You want food to feel welcoming, but not sleepy. Familiarity works best when there is enough flavor or personality to make the meal feel chosen rather than automatic.', vector: vector([61,58,58,57,77,72,61,71,62,59]) },
  { name: 'Flavor Chaser', copy: 'You notice when a meal has conviction. Bold flavor, enough craft to support it and a little discovery make dinner feel more alive.', vector: vector([69,61,57,69,63,77,57,58,71,59]) },
  { name: 'Curious Grazer', copy: 'You are pulled by the possibility that the next bite teaches you something. New ingredients, unexpected combinations and flexible plans keep your food world expanding.', vector: vector([78,55,59,66,63,62,57,56,88,67]) },
  { name: 'Communal Comfort', copy: 'The table matters as much as the plate. You like food that gives people something to gather around without making the whole night difficult or precious.', vector: vector([55,55,75,58,85,54,73,67,61,59]) },
  { name: 'Table Stylist', copy: 'You appreciate when dinner feels considered from more than one angle. Presentation, social energy and enough structure can make the meal feel like an occasion without becoming stiff.', vector: vector([60,66,73,72,70,56,63,58,68,58]) },
  { name: 'Ritual Foodie', copy: 'You enjoy a meal with a sense of occasion. Repetition, presentation and small traditions can make food more meaningful rather than less adventurous.', vector: vector([53,73,57,72,80,54,64,72,67,51]) },
  { name: 'Spontaneous Regular', copy: 'You like having places and flavors you trust, but you do not want dinner locked to a script. Familiar comfort and last-minute curiosity can coexist just fine.', vector: vector([71,47,60,55,79,59,66,69,68,72]) },
  { name: 'Social Explorer', copy: 'Food gets more interesting when discovery is shared. You like a table with energy, a little novelty and enough flexibility for the meal to turn into a story.', vector: vector([69,51,78,59,68,64,62,57,65,69]) },
  { name: 'Nostalgia Keeper', copy: 'Some meals are valuable because they already mean something. Familiar flavors, personal history and the feeling of returning can matter more than novelty for novelty’s sake.', vector: vector([51,57,56,56,94,55,71,84,62,56]) },
  { name: 'Craft Hunter', copy: 'You like noticing why the meal works. Technique, presentation, ingredients and intentional pacing turn eating into a form of curiosity without requiring spectacle.', vector: vector([63,71,55,82,64,59,58,58,85,53]) },
  { name: 'Sensory Scout', copy: 'You are willing to chase a meal that feels vivid. Novelty, bold flavor and spontaneity pull you toward food experiences that are easy to remember and hard to reduce to “pretty good.”', vector: vector([83,46,61,57,61,75,55,57,70,76]) }
]);

export const EAT_MODES = Object.freeze([
  { icon: '🍲', name: 'Cozy Favorite', copy: 'A familiar, low-friction meal with enough personal meaning to feel restorative instead of boring.', anchors: ['one thing you already trust', 'comfortable pacing and atmosphere', 'a flavor connected to memory'], vector: vector([52,58,60,58,91,55,71,79,61,56]) },
  { icon: '👥', name: 'Big Table', copy: 'Shared plates, easy conversation and food generous enough to keep the table moving.', anchors: ['shareable dishes', 'room for conversation', 'choices that let people participate differently'], vector: vector([61,60,78,65,73,57,66,59,65,61]) },
  { icon: '🚶', name: 'Street-Food Crawl', copy: 'Discovery through motion: multiple bites, lower commitment and enough spontaneity to follow whatever looks good next.', anchors: ['several smaller stops or dishes', 'visible local energy', 'permission to change the plan'], vector: vector([81,49,63,60,61,69,57,56,76,74]) },
  { icon: '🧭', name: 'Curious Comfort', copy: 'A meal with an easy entry point and one or two genuinely new ideas. Familiarity becomes the base camp, not the destination.', anchors: ['recognizable anchor dish', 'one unfamiliar ingredient or technique', 'comfortable room to linger'], vector: vector([66,56,55,61,78,58,64,69,80,61]) },
  { icon: '🔬', name: "Chef's Counter", copy: 'Craft is part of the entertainment. You want to notice technique, detail and why the sequence of the meal works.', anchors: ['visible technique or point of view', 'intentional progression', 'details worth asking about'], vector: vector([68,64,57,77,62,63,57,56,86,58]) },
  { icon: '🕯️', name: 'Beautiful Ritual', copy: 'Atmosphere, presentation and pacing turn eating into an occasion without needing the food to shout.', anchors: ['considered setting', 'strong visual presentation', 'a meal with an intentional rhythm'], vector: vector([55,73,58,75,76,55,63,68,71,52]) },
  { icon: '🌶️', name: 'Flavor Forward', copy: 'The bite should make a point. Strong seasoning, contrast and enough complexity to keep boldness from becoming noise.', anchors: ['clear flavor signature', 'contrast in heat, acid, smoke or richness', 'a dish you can describe from memory'], vector: vector([66,59,58,62,68,77,58,63,65,60]) },
  { icon: '🎲', name: 'Spontaneous Feast', copy: 'A flexible, social meal that can become more than you planned. The best part is leaving room for the night to choose the next bite.', anchors: ['minimal over-planning', 'food that works well shared', 'one easy detour or impulse order'], vector: vector([66,46,67,54,79,63,66,68,62,70]) }
]);

export const EAT_BADGES = Object.freeze([
  ['🧭', 'Food Explorer', 'adventure', 82],
  ['🕯️', 'Makes a Ritual of It', 'ritual', 80],
  ['👥', 'Table Person', 'sharing', 80],
  ['🎨', 'Eats With the Eyes', 'presentation', 80],
  ['🍲', 'Comfort Loyalist', 'comfort', 84],
  ['🌶️', 'Flavor Maximalist', 'intensity', 82],
  ['😌', 'Easygoing Diner', 'ease', 82],
  ['💭', 'Food Memory', 'nostalgia', 82],
  ['🔬', 'Wants the Why', 'curiosity', 84],
  ['🎲', 'Orders on Instinct', 'spontaneity', 82]
]);
