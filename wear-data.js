export const WEAR_DIMENSIONS = Object.freeze([
  'experimentation',
  'coordination',
  'visibility',
  'styling',
  'ease',
  'edge',
  'calm',
  'nostalgia',
  'detail',
  'impulse'
]);

export const WEAR_DIMENSION_COPY = Object.freeze({
  experimentation: ['Familiar', 'Experimental', 'Experimentation'],
  coordination: ['Improvised', 'Coordinated', 'Coordination'],
  visibility: ['Understated', 'Visible', 'Visibility'],
  styling: ['Functional', 'Styled', 'Styling intent'],
  ease: ['Sacrifice comfort', 'Comfort-first', 'Ease'],
  edge: ['Soft', 'Edgy', 'Edge'],
  calm: ['Stimulating', 'Calm', 'Visual calm'],
  nostalgia: ['Current', 'Nostalgic', 'Nostalgia'],
  detail: ['Broad strokes', 'Detail-led', 'Detail sensitivity'],
  impulse: ['Considered', 'Impulsive', 'Impulse']
});

export const WEAR_QUESTIONS = Object.freeze([
  {
    title: 'You have 30 seconds to get dressed. What are you reaching for?',
    subtitle: 'No idealized version of you. Pick the thing you would actually grab.',
    options: [
      ['◻️', 'Clean matching basics', 'You want the pieces to already make sense together.', { coordination: 10, styling: 8, ease: 4, impulse: -6 }],
      ['☁️', 'Relaxed and oversized', 'Comfort first, with enough shape to look intentional.', { ease: 12, calm: 8, coordination: -5, visibility: -4 }],
      ['⚡', 'One obvious statement piece', 'Give the outfit a point of view and build around it.', { visibility: 12, edge: 10, experimentation: 8, ease: -4 }],
      ['🧶', 'The familiar favorite', 'The piece already feels like part of your identity.', { nostalgia: 10, ease: 6, styling: 4, experimentation: -3 }]
    ]
  },
  {
    title: 'A jacket is almost perfect. What makes you actually buy it?',
    subtitle: 'The deciding factor, not the thing you also appreciate.',
    options: [
      ['📐', 'The silhouette', 'The proportions change the whole outfit.', { styling: 12, coordination: 6, ease: -3 }],
      ['🫧', 'It feels amazing on', 'If wearing it becomes a chore, it is not worth owning.', { ease: 14, calm: 8, edge: -5 }],
      ['🔍', 'A weird little detail', 'The cut, closure, texture or construction makes it interesting.', { detail: 12, experimentation: 10, edge: 6 }],
      ['🧩', 'It works with everything', 'You can already see five outfits without trying.', { coordination: 10, ease: 8, experimentation: -5 }]
    ]
  },
  {
    title: 'Which compliment would hit hardest?',
    subtitle: 'They are all good. Which one feels most like a win?',
    options: [
      ['✨', '“You always look put together.”', 'Consistency and polish are part of the appeal.', { coordination: 12, styling: 9, visibility: 4 }],
      ['🪩', '“I could never pull that off.”', 'You like knowing the look has some nerve.', { visibility: 14, edge: 12, experimentation: 7 }],
      ['🫶', '“That looks so you.”', 'The clothes feel connected to the person wearing them.', { nostalgia: 12, styling: 8, visibility: 3 }],
      ['👀', '“Where did you find that?”', 'Discovery and specificity matter more than obvious status.', { detail: 14, experimentation: 5, nostalgia: 4 }]
    ]
  },
  {
    title: 'Your closet gets cut in half. Which category survives?',
    subtitle: 'Assume everything fits and is in good condition.',
    options: [
      ['🧥', 'Structured layers', 'Jackets, overshirts and pieces that finish an outfit.', { styling: 10, coordination: 9, detail: 4 }],
      ['👕', 'Perfect everyday basics', 'The pieces you can wear repeatedly without thinking.', { ease: 10, calm: 7, impulse: 5 }],
      ['🕰️', 'Vintage or sentimental pieces', 'History and character are hard to replace.', { nostalgia: 12, detail: 10, experimentation: 6 }],
      ['👟', 'Shoes with personality', 'The bottom half can carry more attitude than people admit.', { edge: 10, visibility: 8, ease: 5 }]
    ]
  },
  {
    title: 'The invite says “smart casual.” What do you do?',
    subtitle: 'Your instinct before you start overthinking the dress code.',
    options: [
      ['🪡', 'Go crisp and exact', 'Better slightly overdressed than visually unfinished.', { coordination: 13, styling: 8, impulse: -7 }],
      ['🌫️', 'Soften it', 'Good fabric, relaxed proportions, nothing too stiff.', { ease: 9, styling: 5, calm: 6, coordination: -4 }],
      ['🎭', 'Bend the rule', 'Keep the formality, change the shape or styling.', { experimentation: 11, edge: 9, visibility: 7, impulse: 6 }],
      ['🎲', 'Figure it out when you get there', 'You would rather adapt than plan a uniform in advance.', { impulse: 12, edge: 6, coordination: -10, visibility: 5 }]
    ]
  },
  {
    title: 'A new trend is suddenly everywhere. Your first reaction?',
    subtitle: 'Not whether the trend is good. How you deal with trends in general.',
    options: [
      ['🚀', 'Try it while it is fresh', 'Part of the fun is catching the energy early.', { experimentation: 14, impulse: 10, visibility: 5 }],
      ['🧠', 'Translate it into your style', 'You want the idea, not the costume.', { experimentation: 6, coordination: 7, detail: 8, impulse: -4 }],
      ['🧱', 'Only if it solves a wardrobe need', 'Utility earns space faster than hype does.', { ease: 8, coordination: 6, experimentation: -8, calm: 5 }],
      ['🗄️', 'Wait it out', 'You trust your own references more than the cycle.', { experimentation: -12, nostalgia: 8, coordination: 4, calm: 5 }]
    ]
  },
  {
    title: 'What ruins an outfit fastest?',
    subtitle: 'The flaw you notice even when everybody else says it looks fine.',
    options: [
      ['🪨', 'It is uncomfortable', 'Looking good stops being fun if you hate wearing it.', { ease: -14, styling: 5, edge: 4 }],
      ['🥱', 'It is boring', 'There needs to be at least one decision worth noticing.', { experimentation: 10, visibility: 8, detail: 5 }],
      ['🌀', 'It feels overthought', 'Too much coordination can drain the life out of it.', { coordination: -10, impulse: 9, ease: 5 }],
      ['📎', 'It looks sloppy', 'Ease is fine. Unfinished is different.', { coordination: 10, styling: 8, edge: -5 }]
    ]
  },
  {
    title: 'Your clothes should make you feel…',
    subtitle: 'Pick the feeling you would keep if you could only keep one.',
    options: [
      ['🪞', 'Composed', 'Like you understood the assignment before anyone said it out loud.', { coordination: 12, styling: 8, calm: 5 }],
      ['🧨', 'Interesting', 'Like there is something worth looking at twice.', { experimentation: 10, visibility: 9, edge: 8 }],
      ['🛋️', 'Effortless', 'Like getting dressed did not become a second job.', { ease: 13, calm: 9, coordination: -4 }],
      ['📼', 'Recognizable', 'Like the outfit belongs to your personal history, not just the moment.', { nostalgia: 12, detail: 9, styling: 6 }]
    ]
  }
]);

const vector = (values) => Object.freeze(Object.fromEntries(WEAR_DIMENSIONS.map((key, index) => [key, values[index]])));

export const WEAR_ARCHETYPES = Object.freeze([
  { name: 'Polished Chameleon', copy: 'You like a wardrobe that can change contexts without losing control. The throughline is polish, not one fixed aesthetic.', vector: vector([54, 91, 62, 88, 61, 57, 60, 63, 62, 46]) },
  { name: 'Relaxed Minimalist', copy: 'You want clothes to lower friction. Clean enough to feel intentional, easy enough that getting dressed never becomes a performance.', vector: vector([53, 52, 61, 66, 89, 58, 74, 64, 60, 62]) },
  { name: 'Street Curator', copy: 'You collect attitude more than rules. Comfort matters, but so do discovery, edge and the feeling that the pieces were chosen rather than issued.', vector: vector([74, 47, 76, 61, 78, 71, 66, 59, 62, 67]) },
  { name: 'Quiet Luxury', copy: 'You notice cut, fabric and finish before logos or spectacle. Your version of “expensive-looking” is restraint that survives close inspection.', vector: vector([48, 79, 58, 79, 82, 52, 70, 61, 59, 51]) },
  { name: 'Statement Tailor', copy: 'You like precision with teeth. Strong silhouettes, deliberate coordination and enough risk that polished never turns anonymous.', vector: vector([74, 79, 76, 79, 53, 71, 57, 59, 63, 53]) },
  { name: 'Modern Traditionalist', copy: 'You trust recognizable wardrobe logic, then make it personal through proportion, texture and detail instead of chasing every new thing.', vector: vector([70, 76, 61, 78, 60, 59, 58, 70, 78, 48]) },
  { name: 'Creative Layerer', copy: 'You enjoy the construction of an outfit. References, textures and unusual combinations are part of the point, even when the result looks accidental.', vector: vector([83, 58, 73, 68, 55, 70, 56, 70, 78, 60]) },
  { name: 'Vintage Romantic', copy: 'Clothes are better when they feel like they have a past. You respond to character, memory and pieces that look more discovered than manufactured.', vector: vector([49, 67, 59, 79, 67, 56, 63, 79, 66, 55]) },
  { name: 'Eclectic Scout', copy: 'You are a finder. Interesting details, older references and unexpected pieces pull you in, but you still want enough ease to actually wear them.', vector: vector([68, 51, 60, 66, 74, 59, 65, 73, 77, 61]) },
  { name: 'Experimental Editor', copy: 'You are willing to let clothes be visible. Novel shapes and sharper ideas excite you, but editing still matters more than random maximalism.', vector: vector([86, 58, 88, 63, 58, 82, 57, 57, 64, 62]) },
  { name: 'Sport Utility', copy: 'You like clothes that move, layer and survive real life, but “functional” does not mean invisible. Performance and attitude can share the same outfit.', vector: vector([68, 71, 71, 71, 76, 63, 66, 57, 61, 55]) },
  { name: 'Soft Statement', copy: 'You want presence without armor. The look can be noticeable and a little edgy while still feeling personal, warm and wearable.', vector: vector([56, 62, 73, 73, 60, 72, 61, 67, 60, 60]) }
]);

export const WEAR_MODES = Object.freeze([
  { icon: '📐', name: 'Tailored Clean', copy: 'Structure, clean lines and repeatable combinations do most of the work.', anchors: ['structured outer layer', 'clean trouser or dark denim', 'simple intentional shoe'], vector: vector([51, 87, 59, 85, 69, 54, 64, 64, 62, 47]) },
  { icon: '🧩', name: 'Polished Casual', copy: 'You want range: comfortable pieces that still look chosen when the context changes.', anchors: ['elevated basic', 'versatile layer', 'one personality piece'], vector: vector([65, 71, 74, 72, 72, 68, 64, 57, 59, 56]) },
  { icon: '☁️', name: 'Relaxed Minimal', copy: 'Ease and visual calm matter more than proving how much styling happened.', anchors: ['soft neutral top', 'relaxed straight-leg bottom', 'comfortable low-noise shoe'], vector: vector([52, 60, 59, 70, 87, 54, 73, 65, 62, 57]) },
  { icon: '🧨', name: 'Editorial Bold', copy: 'You are most alive when the outfit has a visible idea and a little risk.', anchors: ['strong silhouette', 'unusual texture or color', 'clean supporting pieces'], vector: vector([84, 59, 84, 65, 57, 79, 57, 60, 67, 62]) },
  { icon: '✂️', name: 'Sharp Statement', copy: 'Precision is the base layer; experimentation is what keeps it from feeling corporate.', anchors: ['tailored hero piece', 'controlled proportion', 'one disruptive detail'], vector: vector([70, 82, 69, 82, 53, 66, 57, 63, 68, 49]) },
  { icon: '🪡', name: 'Eclectic Detail', copy: 'Your eye goes to construction, references and the small decisions that make a piece specific.', anchors: ['textured layer', 'found-feeling accessory', 'simple base for contrast'], vector: vector([76, 60, 64, 69, 64, 62, 60, 71, 81, 56]) },
  { icon: '👟', name: 'Street Layered', copy: 'Comfort gives you room to play with volume, sneakers, outerwear and looser combinations.', anchors: ['roomy top layer', 'comfortable statement shoe', 'practical bag or accessory'], vector: vector([69, 46, 71, 61, 80, 67, 68, 62, 63, 67]) },
  { icon: '📼', name: 'Vintage Romantic', copy: 'The wardrobe works best when it feels collected over time rather than purchased all at once.', anchors: ['older-reference outerwear', 'characterful knit or shirt', 'worn-in leather or textured accessory'], vector: vector([52, 62, 63, 77, 62, 62, 62, 77, 66, 58]) }
]);

export const WEAR_BADGES = Object.freeze([
  ['🪡', 'Silhouette First', 'styling', 78],
  ['🫧', 'Comfort Loyalist', 'ease', 78],
  ['🧨', 'Visible on Purpose', 'visibility', 78],
  ['🧪', 'Experiment Friendly', 'experimentation', 78],
  ['📼', 'Reference Heavy', 'nostalgia', 76],
  ['🔍', 'Detail Hunter', 'detail', 78],
  ['🎲', 'Gets Dressed by Feel', 'impulse', 75],
  ['📐', 'Coordination Brain', 'coordination', 80],
  ['🌫️', 'Visual Calm', 'calm', 78],
  ['⚡', 'Needs Some Edge', 'edge', 78]
]);
