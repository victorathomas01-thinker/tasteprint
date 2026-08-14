# Tasteprint

An interactive personality-and-preference profiling app that turns a user's choices into a reusable **Tasteprint**: a structured profile of what they are likely to enjoy, value, choose, or avoid across different parts of life.

## Overview

Tasteprint is designed to feel more like an entertaining, shareable personality experience than a traditional survey. Instead of producing one generic label, the app builds a multidimensional preference profile that can be reused for recommendations and comparisons.

The broader idea is to help users better understand what they want in the future while making the result fun enough to share with friends.

Examples of areas the profile can inform include:

- Travel and vacations
- Entertainment
- Fashion and aesthetic preferences
- Fitness and gym preferences
- Lifestyle choices
- Future recommendation categories

## Core Product Concept

The app collects preference signals through interactive questions and controls, then converts them into a profile made up of traits, archetypes, sliders, badges, and comparative outputs.

Rather than relying only on a single archetype, later recommendation systems can compare the user's full Tasteprint against structured profiles for destinations, experiences, or other options.

## Current Features

- **12 personality / preference archetypes**
- Visual trait sliders with clearly visible rails and filled segments
- Shareable badges and profile language
- Percentile-style trait framing for especially high or low dimensions
- Friend comparison
- Pair archetypes for comparing two people
- Shareable result language designed to encourage discussion and tagging

## Destination Matching

Destination recommendations are based on the user's full preference profile rather than simply mapping one archetype to one place.

Each destination has its own preference vector, and the app compares that vector against the user's Tasteprint.

The result includes:

- Top three destination matches
- A **curveball** recommendation
- One destination that is **probably not your thing**
- Specific explanations for why each recommendation fits
- Avoid-this logic for mismatched experiences

## Decision Fingerprint

The app generates a short **decision fingerprint** that explains the pattern behind the user's choices rather than merely listing scores.

This is meant to make the output feel interpretable and personal instead of looking like raw survey data.

## Psychological Tensions

Tasteprint can surface two strong traits that pull in different directions.

These tensions help explain why a user might want apparently contradictory things, such as structure and spontaneity, familiarity and novelty, or social energy and privacy.

## Trip Mode

Travel results can include a named **trip mode** describing the user's natural travel style, with examples such as:

- The Curated Escape
- The Open-Ended Roam

## Extreme Traits

The result highlights an especially high or low scoring dimension so users can immediately see one of the strongest signals in their profile.

This can also support percentile-style shareable statements, such as an unusually high score on a particular preference dimension.

## Archetype Validation

To avoid a system where only a few archetypes appear regularly, the archetype logic was tested by simulating **50,000 response combinations**.

All 12 archetypes appeared in the simulation, with observed frequencies ranging from approximately **7.3% to 9.5%**.

## Design Goals

Tasteprint is being designed around a few principles:

1. **Fun before formality** — it should feel entertaining rather than like filling out a questionnaire.
2. **Reusable identity** — a Tasteprint should become useful in future recommendation categories.
3. **Shareability** — results should contain recognizable labels, strong one-liners, and comparison hooks.
4. **Specificity** — recommendations should explain *why* they fit instead of only returning a score.
5. **Variety** — different response patterns should genuinely lead to meaningfully different outcomes.
6. **Low friction** — interaction should remain intuitive rather than becoming an overly complicated psychometric tool.

## Project Status

**Interactive prototype / active development.**

The public repository is being prepared for portfolio use. Source files and screenshots will be added as the current prototype is cleaned up for public release.

## Planned Directions

- Additional recommendation categories using the same Tasteprint profile
- More percentile-based outputs once enough real user data exists
- Expanded friend and pair comparisons
- More recommendation vectors and richer explanation logic
- Further testing of archetype and recommendation distribution
- Additional shareable result formats

## Privacy Note

The project is intended to infer entertainment and lifestyle preferences from user-provided responses. Any future data-storage or account features should be designed to make profile collection and retention transparent to users.
