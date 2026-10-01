// content/blog/angular-signals-zoneless.tsx
export default function AngularSignalsZonelessContent() {
    return (
        <>
            <p className="lead">
                I'd been writing Angular for years, confident I could handle any enterprise project —
                until a Big Tech interview question hit me where it hurt:{' '}
                <em>"How do Signals enable Zoneless Angular? Without Zone.js, how does the UI know when
                    to update?"</em>
            </p>

            <p>
                I froze. All those years, I assumed <code>this.data = newData</code> was enough. I
                failed that interview — but I walked away with a lesson I wish I had learned years
                earlier.
            </p>

            <h2>The Butler Nobody Talked About: Zone.js</h2>
            <p>
                Angular has always run smoothly because of <strong>Zone.js</strong>. Think of it as an
                over-eager butler who eavesdrops on every event in the house. The moment something
                sneezes — a click, a timeout, an HTTP response — the butler rings the fire alarm:
                <strong>"EVERYONE! Check every room in the house!"</strong>
            </p>
            <p>
                Angular then walks through <em>every</em> component, top-down, checking what changed.
                You flipped one light switch? Doesn't matter — it checks the bathroom too. That CPU
                overhead was something users paid for silently, and I never noticed.
            </p>

            <h2>The Hero: Signals — Surgical Updates</h2>
            <p>
                Heading into 2026, keeping Zone.js around feels like driving an electric car with a spare
                gas can in the trunk. With Angular 19, <strong>Signals</strong> give you GPS-precise
                updates:
            </p>
            <pre><code>{`total = computed(() => this.price() * this.quantity());`}</code></pre>
            <p>
                When <code>quantity</code> changes, the Signal fires exactly at the right place. Angular
                knows precisely which component needs re-rendering. No more <em>"check everything!"</em>.
            </p>
            <p>
                The result: <strong>INP (Interaction to Next Paint)</strong> stays green in Core Web
                Vitals, Google is happy, and the app feels silky smooth.
            </p>

            <h2>The Senior Touch: Signal Inputs</h2>
            <p>
                In the old days, we wrestled with passive <code>@Input</code>, clunky{' '}
                <code>ngOnChanges</code>, or setter gymnastics. Now:
            </p>
            <pre><code>{`discountCode = input<string>('');
total = computed(() => {
  const base = this.price() * this.quantity();
  return this.discountCode() === 'WAKE_UP' ? base * 0.5 : base;
});`}</code></pre>
            <p>
                Input from parent flows in like a reactive river. Parent data changes → <code>total</code>{' '}
                recalculates automatically. No bugs, no duplicated logic. This is how an{' '}
                <strong>architect</strong> works — not a code typist.
            </p>

            <img
                src="/blog/angular-signals-zoneless1.jpg"
            />

            <h2>The Bigger Lesson</h2>
            <p>
                Four years without understanding <em>why</em> the UI re-renders is still just being a
                code typist. Learning Signals is about firing the butler, making the app light as a
                feather, and hitting that 100 Lighthouse score.
            </p>
            <p>
                That interview slap didn't break me — it woke me up. It pushed me to understand Angular
                from the foundation up, instead of just painting the walls.
            </p>

            <p>
                <strong>Follow-up:</strong> If you want to see these ideas applied to game dev — where
                reactive state and zero-overhead rendering matter even more — check out my{' '}
                <a href="/games">playable demos</a>. Arrow Puzzle and Boid Swarm both use reactive
                patterns to keep the render loop clean.
            </p>
        </>
    );
}