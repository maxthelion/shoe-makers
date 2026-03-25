/**
 * Diverse concept corpus for creative analogical prompting.
 * Used as a fallback when Wikipedia is unreachable.
 */
export const FALLBACK_CONCEPTS: { title: string; summary: string }[] = [
  // Biology
  { title: "Mycelial Networks", summary: "Underground fungal networks connect trees in forests, allowing them to share nutrients, water, and chemical signals. These 'wood wide web' networks enable older trees to support younger ones and allow the forest to respond collectively to threats like disease or drought." },
  { title: "Quorum Sensing", summary: "Bacteria communicate through chemical signalling molecules to coordinate group behaviour. When enough bacteria are present (a quorum), they collectively switch on genes for bioluminescence, biofilm formation, or virulence — behaviours that only work at scale." },
  { title: "Stigmergy", summary: "A coordination mechanism where agents communicate indirectly by modifying the environment. Termites build complex mounds not through central planning but by each worker responding to pheromone-marked mud balls left by others. The structure emerges from simple local rules." },
  { title: "Apoptosis", summary: "Programmed cell death is essential for healthy organisms. Cells that are damaged, infected, or no longer needed activate a self-destruct sequence. This controlled demolition prevents cascading damage and allows the organism to recycle components efficiently." },
  { title: "Horizontal Gene Transfer", summary: "Unlike vertical inheritance from parent to offspring, bacteria can transfer genes directly between unrelated individuals. This allows rapid adaptation — a bacterium can acquire antibiotic resistance from a completely different species in a single event." },
  { title: "Metamorphosis", summary: "Some organisms undergo radical transformation between life stages. A caterpillar essentially dissolves itself inside a chrysalis, reorganising its cells into a completely different body plan. The butterfly retains memories from its caterpillar stage despite the physical reconstruction." },
  { title: "Coral Reef Symbiosis", summary: "Coral reefs are built on mutualism between coral animals and photosynthetic algae (zooxanthellae). The algae provide energy through photosynthesis while the coral provides shelter. When stressed, corals expel their algae (bleaching), demonstrating how tightly coupled the partnership is." },

  // Architecture & Design
  { title: "Desire Paths", summary: "Informal trails worn by pedestrians who ignore planned walkways in favour of more natural routes. Some architects deliberately wait to see where desire paths form before paving them, letting actual use patterns determine the final design rather than imposing a predetermined layout." },
  { title: "Christopher Alexander's Pattern Language", summary: "A structured collection of 253 proven solutions to recurring design problems, from city planning to room layouts. Each pattern describes a problem, its context, and a solution — and patterns reference each other, forming a generative network that produces coherent designs." },
  { title: "Wabi-Sabi", summary: "A Japanese aesthetic philosophy centred on finding beauty in imperfection, impermanence, and incompleteness. A cracked tea bowl repaired with gold (kintsugi) is more valued than a perfect one — the repair history becomes part of the object's identity and beauty." },
  { title: "Adaptive Reuse", summary: "Converting old buildings for new purposes rather than demolishing them. A warehouse becomes apartments, a church becomes a library. The constraints of the existing structure often produce more interesting designs than building from scratch, and the building's history enriches the new use." },

  // Game Design
  { title: "Fog of War", summary: "A game mechanic where parts of the map are hidden until a player's units explore them. This creates uncertainty, rewards scouting, and makes information itself a strategic resource. Players must make decisions with incomplete knowledge, mirroring real-world strategic situations." },
  { title: "Rubber-banding", summary: "A game mechanic where losing players receive subtle advantages (faster speed, better items) while leading players face increased difficulty. Named after the rubber-band effect in racing games, it keeps competitions close and prevents runaway leaders from making the game boring for others." },
  { title: "Procedural Generation", summary: "Algorithmic creation of game content — levels, terrain, items — using rules and randomness rather than manual design. Minecraft's infinite worlds are generated from a seed number. The technique trades hand-crafted quality for infinite variety and replayability." },
  { title: "Emergent Gameplay", summary: "Complex player behaviours that arise from simple game rules interacting in unexpected ways. The designers didn't plan for rocket-jumping in Quake, but the physics system made it possible. The best emergent gameplay comes from systems that are simple individually but rich in combination." },

  // Music Theory
  { title: "Counterpoint", summary: "The art of combining independent melodic lines that sound good together. Each voice has its own shape and direction, yet they harmonise at key moments. Bach's fugues layer up to four independent melodies that interweave, creating complex textures from simple rules about intervals and movement." },
  { title: "Call and Response", summary: "A musical pattern where a phrase played by one musician is answered by another. Found in African drumming, gospel, jazz, and blues. The response can echo, complement, or transform the call — creating a conversation between performers that builds energy and variation." },
  { title: "Ostinato", summary: "A repeating musical pattern that forms the foundation while other elements change above it. Ravel's Bolero builds for 15 minutes over the same two-bar rhythm. The constant repetition creates a hypnotic base that makes variations and additions more noticeable and dramatic." },
  { title: "Polyrhythm", summary: "Two or more conflicting rhythmic patterns played simultaneously. West African drumming layers patterns of 3 against 4, creating a complex texture that no single player controls. The composite rhythm is richer than any individual part, and different listeners perceive different patterns as primary." },

  // Economics & Game Theory
  { title: "Tragedy of the Commons", summary: "When individuals acting in self-interest deplete a shared resource, even though it's against everyone's long-term interest. Overfishing, overgrazing, and pollution all follow this pattern. Solutions include privatisation, regulation, or community self-governance as described by Elinor Ostrom." },
  { title: "Pareto Efficiency", summary: "A state where no one can be made better off without making someone else worse off. It doesn't mean everyone is happy — a distribution where one person has everything is Pareto efficient. The concept reveals that 'optimal' depends entirely on what you're optimising for." },
  { title: "Dutch Auction", summary: "An auction format where the price starts high and decreases until someone bids. Used for flowers in the Netherlands and for US Treasury bills. Unlike English auctions, the first bidder wins — creating pressure to bid early at a higher price rather than wait and risk losing." },
  { title: "Principal-Agent Problem", summary: "When one party (the agent) acts on behalf of another (the principal) but has different incentives. A manager may prioritise their own career over company value. Solutions include aligning incentives, monitoring, and reputation systems — but perfect alignment is theoretically impossible." },
  { title: "Comparative Advantage", summary: "Even if one party is better at everything, both benefit from specialising in what they're relatively best at and trading. A surgeon who types faster than their secretary still benefits from hiring one, because the surgeon's time is better spent on surgery." },

  // Systems Theory
  { title: "Feedback Loops", summary: "Circular chains of cause and effect. Positive feedback amplifies change (microphone squealing, bank runs, viral growth). Negative feedback dampens change (thermostats, population limits, market corrections). Most stable systems use negative feedback; most explosive changes involve positive feedback." },
  { title: "Emergent Behaviour", summary: "Complex patterns arising from simple rules. Flocking birds follow three rules: stay close, avoid collisions, match speed. No bird plans the flock's shape. Traffic jams, market prices, and consciousness may all be emergent — caused by interactions rather than central coordination." },
  { title: "Homeostasis", summary: "A system's ability to maintain internal stability despite external changes. The human body keeps temperature at 37°C through sweating and shivering. Key insight: homeostasis isn't passive equilibrium but active regulation — it requires energy and constant adjustment." },
  { title: "Antifragility", summary: "Some systems don't just resist shocks — they get stronger from them. Muscles grow from micro-damage, immune systems learn from infections, and forests need periodic fires. Antifragile systems benefit from volatility, randomness, and stressors up to a point." },
  { title: "Requisite Variety", summary: "Ashby's law: a controller must have at least as many states as the system it controls. A thermostat with only on/off has less variety than one with a dial. To manage complexity, you need matching complexity — or you need to reduce the system's variety through constraints." },

  // Mathematics & Computer Science
  { title: "Cellular Automata", summary: "Grids of cells that evolve according to simple rules based on their neighbours. Conway's Game of Life produces gliders, oscillators, and even Turing-complete computers from just four rules. Demonstrates how complex behaviour emerges from simple local interactions." },
  { title: "Monte Carlo Methods", summary: "Using randomness to solve deterministic problems. To estimate pi, randomly throw darts at a square containing a circle — the ratio of hits approximates pi/4. By sampling randomly and aggregating results, you can solve problems that are intractable through direct calculation." },
  { title: "Graph Colouring", summary: "Assigning colours to vertices of a graph so no two adjacent vertices share a colour. Used for scheduling (no conflicting events), map colouring (no adjacent regions same colour), and register allocation in compilers. The minimum colours needed reveals the graph's structural complexity." },
  { title: "Byzantine Fault Tolerance", summary: "How distributed systems reach consensus when some participants may be faulty or malicious. Named after the Byzantine generals problem: how can generals coordinate an attack when some may be traitors? Requires 2/3 honest participants, and the solutions underpin blockchain technology." },
  { title: "Simulated Annealing", summary: "An optimisation technique inspired by metalworking. Start with high 'temperature' (accept worse solutions randomly) and gradually cool (become pickier). This prevents getting stuck in local optima — early randomness explores the solution space, late precision refines the best region found." },

  // Philosophy & Cognitive Science
  { title: "Ship of Theseus", summary: "If every plank of a ship is gradually replaced, is it still the same ship? And if you reassemble the old planks into a ship, which is the original? The paradox reveals that identity isn't about physical components but about continuity, pattern, and the story we tell about an object." },
  { title: "Kaizen", summary: "The Japanese philosophy of continuous incremental improvement. Rather than revolutionary change, make everything slightly better every day. Toyota's production system is built on kaizen — any worker can stop the assembly line to fix a problem, preventing small issues from compounding." },
  { title: "Inversion Thinking", summary: "Instead of asking 'how do I succeed?', ask 'how would I guarantee failure?' then avoid those things. Charlie Munger's approach: 'All I want to know is where I'm going to die, so I'll never go there.' Often more productive than direct optimisation because failure modes are easier to identify." },
  { title: "The Map Is Not the Territory", summary: "Alfred Korzybski's warning that our models of reality are simplifications. A map omits details, freezes time, and imposes categories. Confusing the map with the territory leads to errors when reality diverges from the model — which it always eventually does." },
  { title: "Second-Order Effects", summary: "The consequences of consequences. A cobra bounty in colonial Delhi led people to breed cobras for the reward, increasing the cobra population. First-order thinking predicts the direct effect; second-order thinking considers how the system adapts to the intervention." },

  // Ecology & Environmental Science
  { title: "Keystone Species", summary: "An organism whose impact on its ecosystem is disproportionately large relative to its abundance. When sea otters were removed from Pacific kelp forests, sea urchin populations exploded and consumed the kelp, collapsing the entire ecosystem. Small components can hold complex systems together." },
  { title: "Ecological Succession", summary: "The predictable sequence of community changes after a disturbance. A cleared forest first grows grasses, then shrubs, then pioneer trees, then mature forest. Each stage modifies the environment to favour the next, creating conditions that eventually replace itself." },
  { title: "Edge Effects", summary: "Biodiversity is often highest at the boundary between two ecosystems (forest meeting meadow, river meeting land). These transition zones combine resources from both habitats and create unique niches. Innovation often happens at the edges between disciplines, not in the centre." },

  // Physics & Engineering
  { title: "Resonance", summary: "When a system is driven at its natural frequency, even small inputs produce large responses. A child on a swing needs only tiny pushes timed right. Resonance can be destructive (Tacoma Narrows bridge) or useful (radio tuning, MRI machines). The key is matching the driving frequency to the system's innate rhythm." },
  { title: "Phase Transitions", summary: "Abrupt qualitative changes in a system's behaviour at critical thresholds. Water doesn't gradually become ice — it snaps from liquid to solid at 0°C. Similarly, networks suddenly become connected at a critical density, and opinions can flip from minority to majority at tipping points." },
  { title: "Signal-to-Noise Ratio", summary: "The ratio of meaningful information to irrelevant background. In communications, engineering, and data analysis, improving SNR is often more valuable than increasing total signal. Techniques include filtering, averaging, and reducing sources of noise — applicable from radio engineering to decision-making." },

  // Social Science
  { title: "Dunbar's Number", summary: "Humans can maintain approximately 150 stable social relationships. Beyond this, groups need formal hierarchies, rules, and institutions to function. This limit shapes everything from military units to company departments and explains why small teams feel different from large organisations." },
  { title: "Broken Windows Theory", summary: "Visible signs of disorder encourage further disorder. An unrepaired broken window signals that no one cares, inviting more vandalism. Applied to software: small code quality issues left unfixed accumulate into large technical debt as developers match the prevailing standard of care." },
  { title: "Overton Window", summary: "The range of ideas considered politically acceptable at a given time. Ideas outside the window are dismissed as radical. The window can shift through persistent advocacy, making previously extreme ideas mainstream. What's 'reasonable' is socially constructed, not inherent." },
  { title: "Conway's Law", summary: "Organizations design systems that mirror their communication structures. A company with four teams will produce a four-component architecture. To change system design, you may need to change the organization first — or design the organization to produce the system you want." },
  { title: "Loose Coupling", summary: "A design principle where components interact through well-defined interfaces with minimal assumptions about each other. Loosely coupled systems are easier to modify, test, and replace. The trade-off: indirection adds complexity, and finding the right coupling level is an art, not a science." },
];

/**
 * Get a random concept from the local fallback corpus.
 */
export function getRandomFallbackConcept(): { title: string; summary: string } {
  return FALLBACK_CONCEPTS[Math.floor(Math.random() * FALLBACK_CONCEPTS.length)];
}

/**
 * Fetch a random Wikipedia article summary for analogical prompting.
 * Falls back to a local concept corpus when Wikipedia is unreachable.
 */
export async function fetchRandomArticle(): Promise<{
  title: string;
  summary: string;
} | null> {
  try {
    // Get a random article title
    const randomRes = await fetch(
      "https://en.wikipedia.org/w/api.php?action=query&list=random&rnnamespace=0&rnlimit=1&format=json",
      { signal: AbortSignal.timeout(10_000) }
    );
    if (!randomRes.ok) return getRandomFallbackConcept();
    const randomData = await randomRes.json();
    const title = randomData?.query?.random?.[0]?.title;
    if (!title) return getRandomFallbackConcept();

    // Get the article extract
    const extractRes = await fetch(
      `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=extracts&exintro=true&explaintext=true&format=json`,
      { signal: AbortSignal.timeout(10_000) }
    );
    if (!extractRes.ok) return getRandomFallbackConcept();
    const extractData = await extractRes.json();
    const pages = extractData?.query?.pages;
    if (!pages) return getRandomFallbackConcept();

    const page = Object.values(pages)[0] as { extract?: string };
    const summary = page?.extract?.trim();
    if (!summary || summary.length < 50) return getRandomFallbackConcept(); // skip stubs

    return { title, summary: summary.substring(0, 1000) };
  } catch {
    return getRandomFallbackConcept(); // network error — use local corpus
  }
}

/**
 * Decide whether this explore cycle should include a creative lens.
 * Uses the configured insightFrequency (default 0.3 = 30% of cycles).
 */
export function shouldIncludeLens(frequency: number = 0.3): boolean {
  return Math.random() < frequency;
}
