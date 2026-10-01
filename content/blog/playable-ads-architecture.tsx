// content/blog/playable-ads-architecture.tsx
export default function PlayableAdsArchitectureContent() {
    return (
        <>
            <p className="lead">
                Playable Ads are a strange beast. You have to fit a complete, fun, playable
                experience into a few megabytes, load it in under three seconds on a mid-range
                phone, and make someone want to install a game after 30 seconds of play. It's
                closer to game jam constraints than to full production — but the engineering
                discipline required is arguably <em>higher</em>.
            </p>

            <p>
                A while back I built one from scratch: a rhythm-based WebGL game where two cats
                catch falling candies in sync with music. It had to support multi-touch, dual
                orientation, and stay under <strong>12 MB uncompressed</strong>. Here's the
                architecture and the optimization decisions that made it work.
            </p>

            <h2>1. Single-Scene, State-Machine Architecture</h2>
            <p>
                Playable Ads have no patience for loading screens. Every scene transition is a
                potential bounce, and every bounce is a lost install. So the whole game lives in{' '}
                <strong>one scene</strong>, with states toggled by Canvas Groups:
            </p>
            <ul>
                <li><code>Tutorial</code> — first 10 seconds, teaches the drag mechanic</li>
                <li><code>Playing</code> — the actual gameplay loop</li>
                <li><code>Win</code> / <code>Lose</code> — outcome screens with a CTA</li>
                <li><code>PickNextSong</code> — optional retry flow</li>
            </ul>
            <p>
                No <code>SceneManager.LoadScene()</code>. No async loading. Just a switch between
                groups of GameObjects. Total transition time: <strong>0 ms</strong>.
            </p>

            <h2>2. Three-Layer Event Flow — Domain, State, Presentation</h2>
            <p>
                One thing I've learned the hard way: in tiny projects, it's tempting to let
                everything talk to everything. That works for a demo. It falls apart the moment
                you need to add a feature or debug a subtle timing bug.
            </p>
            <p>
                So I enforced a strict one-way dependency chain:
            </p>

            <figure>
                <img
                    src="/blog/playable-ads-architecture1.jpg"
                    alt="Three-layer event flow diagram: RhythmController → GameManager → Presentation"
                />
                <figcaption>
                    Dependencies only flow downward. Each layer knows nothing about the layers above it.
                </figcaption>
            </figure>

            <p>
                The result: <code>RhythmController</code> has <strong>zero knowledge</strong> of
                GameManager. It's fully reusable. If I ever ported this to a different game, I
                could drop the same rhythm engine in without touching a line.
            </p>
            <p>
                It also makes semantic binding clean. <code>AudioManager</code> listens to{' '}
                <code>OnSongStart</code> / <code>OnSongStop</code> — it has no idea GameManager
                exists. <code>CandyMover</code> listens to <code>OnSongStop</code> to clear
                active candies on both win <em>and</em> lose. No reverse dependencies anywhere.
            </p>

            <h2>3. Hit Detection Without Physics Colliders</h2>
            <p>
                This is the decision that surprised people the most when I explained it. The game
                has falling candies. The obvious solution is 2D physics colliders,{' '}
                <code>OnTriggerEnter2D</code>, Rigidbody2D. Done.
            </p>
            <p>
                <strong>I didn't do that.</strong> Here's why:
            </p>
            <ul>
                <li>
                    Unity 2D physics has real overhead — even for simple triggers, it runs a
                    physics step every frame.
                </li>
                <li>
                    At high fall speeds (necessary for rhythm sync), physics colliders can{' '}
                    <em>tunnel</em> — the candy passes through the cat's collider between two
                    frames and no hit is registered.
                </li>
                <li>
                    Hit registration jitter breaks rhythm games. Notes must resolve at{' '}
                    <strong>exact timestamps</strong>, not "whenever the physics step catches up."
                </li>
            </ul>
            <p>
                So instead: <strong>pure logic-based resolution</strong>. Every candy carries a{' '}
                <code>targetArrivalTime</code>. When that timestamp is reached, the candy queries
                a static registry:
            </p>
            <pre><code>{`if (CatMoveController.IsLaneCaught(laneIndex)) {
    RegisterHit();
} else {
    RegisterMiss();
}`}</code></pre>
            <p>
                No colliders. No physics step. Frame-rate independent. Mathematically precise.
                And it costs <strong>nothing</strong> compared to a physics-based approach.
            </p>

            <h2>4. Multi-Touch, Mouse, and Keyboard — All at Once</h2>
            <p>
                The game is controlled by dragging cats between lanes. On mobile, each cat has
                its own <code>fingerId</code> — you can drag both simultaneously, one thumb per
                side. On desktop, mouse drag mimics the same split-screen logic. And for players
                who prefer keys, <code>A/D</code> moves the left cat and <code>←/→</code> moves
                the right one.
            </p>
            <p>
                The implementation is a single controller with three input handlers, but they all
                feed into the same lane-snapping logic. No duplicated movement code, no
                branch-per-input-per-frame.
            </p>

            <h2>5. Resolution Independence — Because Ad Containers Are Weird</h2>
            <p>
                Playable Ad containers come in every aspect ratio imaginable. Some are 9:16,
                some are 16:9, some are closer to 3:4. Hardcoding world positions is suicide.
            </p>
            <p>
                The fix: a <code>LaneManager</code> that computes everything from{' '}
                <strong>viewport percentages</strong>. The cats' vertical position, the judgment
                line, the lane slices — all derived from <code>Camera.ViewportToWorldPoint</code>{' '}
                at startup. Result: on any container, the cats always land exactly on the wooden
                bench art, and the hit line stays glued to the visual beat marker.
            </p>
            <p>
                Same principle applies to orientation. Instead of maintaining two UI hierarchies,
                one Canvas with <code>ResponsiveRectOffset</code> components repositions
                everything based on startup orientation. <strong>Zero duplicated layouts.</strong>
            </p>

            <h2>6. Optimization — Every Kilobyte Counts</h2>
            <p>
                This is where Playable Ads get interesting. On the web, you don't have the luxury
                of a 50 MB download. Meta and Google both cap playable ads around{' '}
                <strong>10–15 MB</strong>. You have to fit everything — art, audio, code, engine
                runtime — inside that budget.
            </p>

            <figure>
                <img
                    src="/blog/playable-ads-architecture2.jpg"
                    alt="Optimization overview: asset compression, audio compression, and code stripping"
                />
                <figcaption>
                    The three optimization pillars — assets, audio, and code. Each one fought for its own kilobytes.
                </figcaption>
            </figure>

            <p>
                Every decision below was measured, not guessed. Here's what worked, what broke, and
                what I'd do differently.
            </p>

            <h3>Asset compression</h3>
            <ul>
                <li>
                    <strong>Sprite Atlas V2</strong> for texture packing — fewer draw calls, less
                    memory overhead.
                </li>
                <li>
                    <strong>ASTC 12×12</strong> block compression. I chose ASTC over ETC2 because
                    ETC2 isn't hardware-supported on desktop Chrome/Firefox or iOS Safari — meaning
                    a significant fraction of ad viewers would see <em>black textures</em>. ASTC
                    works everywhere that matters.
                </li>
                <li>
                    Background textures capped at <strong>1024×1024</strong>, UI sprites at{' '}
                    <strong>512×512</strong> or lower.
                </li>
            </ul>

            <h3>Audio compression</h3>
            <ul>
                <li>
                    All clips forced to <strong>mono</strong> — halves channel count for free.
                </li>
                <li>
                    <strong>Vorbis</strong> compression at quality 50–60. Sounds fine for short SFX
                    and music loops.
                </li>
                <li>
                    Short SFX loaded as <strong>Compressed In Memory</strong> — no full decompression
                    into RAM.
                </li>
            </ul>

            <h3>Code stripping</h3>
            <ul>
                <li>
                    Managed Stripping Level: <strong>High</strong>.
                </li>
                <li>
                    Strip Engine Code: <strong>Enabled</strong> — removes unused Unity modules.
                </li>
                <li>
                    IL2CPP Code Generation: <strong>Optimize for size</strong>.
                </li>
                <li>
                    Shader stripping — I removed every HDRP variant and kept only URP.
                </li>
            </ul>

            <h3>What I <em>didn't</em> strip</h3>
            <ul>
                <li>
                    <strong>DOTween</strong> — kept. Replacing it with manual <code>Mathf.Lerp</code>{' '}
                    would have saved ~0.3–0.5 MB, but at the cost of development time and animation
                    jitter risk. Not worth it for a shipping build.
                </li>
                <li>
                    <strong>Spine</strong> — kept. The cat animations depend on it.
                </li>
            </ul>

            <h2>7. Final Build Metrics</h2>
            <ul>
                <li>
                    <strong>Total deployed size:</strong> ~11.3 MB
                </li>
                <li>
                    <strong>Build.data</strong> (assets, audio, textures): ~5.2 MB
                </li>
                <li>
                    <strong>Build.wasm</strong> (IL2CPP compiled code): ~6.1 MB
                </li>
            </ul>
            <p>
                That fits comfortably inside Meta's, Google's, and Unity Ads' caps, and loads in
                a few seconds even on 3G.
            </p>

            <h2>8. Trade-offs I'd Revisit</h2>
            <p>
                No shipped build is perfect. Here's what I'd change with more time:
            </p>
            <ul>
                <li>
                    <strong>ASTC 6×6 or 4×4</strong> — would improve visual quality noticeably, at
                    the cost of +1–2 MB.
                </li>
                <li>
                    <strong><code>wasm-opt</code> (Binaryen)</strong> — could shave another
                    0.2–0.5 MB off the WASM binary. I skipped it due to time, but it's the first
                    thing I'd try next.
                </li>
                <li>
                    <strong>Custom <code>link.xml</code></strong> — manual code stripping. High
                    risk: IL2CPP aggressively strips reflection-based code and can produce{' '}
                    <code>NullReferenceException</code> at runtime. For a shipping Playable Ad,
                    stability matters more than 0.3 MB.
                </li>
                <li>
                    <strong>Replacing DOTween</strong> with custom coroutines. Possible, but every
                    animation would need rewiring and re-testing. Only worth it if size becomes
                    the blocker again.
                </li>
            </ul>

            <h2>9. What Playable Ads Taught Me</h2>
            <p>
                Building this was a masterclass in constraints. Every decision — architecture,
                input, asset format, code stripping — had to justify itself against a{' '}
                <strong>10–15 MB budget</strong> and a <strong>3-second load target</strong>.
            </p>
            <p>
                Three lessons that carried back into bigger projects:
            </p>
            <ul>
                <li>
                    <strong>Decouple first.</strong> A 3-layer event flow costs you 20 extra minutes
                    upfront and saves you 20 hours of debugging later.
                </li>
                <li>
                    <strong>Question the obvious solution.</strong> Physics colliders for hit
                    detection felt "correct" — but pure logic was cheaper, more precise, and
                    eliminated an entire class of bugs.
                </li>
                <li>
                    <strong>Profile, don't guess.</strong> Every optimization in this post was
                    measured. The ones I <em>assumed</em> would help (Brotli compression, extra
                    shader stripping) actually broke things. The ones I measured (ASTC vs ETC2,
                    audio mono, sprite atlas) were the wins.
                </li>
            </ul>

            <h2>Final Thoughts</h2>
            <p>
                Playable Ads are one of the most underrated engineering exercises in game
                development. They force you to be honest about what actually matters — and
                what was never worth shipping in the first place.
            </p>
            <p>
                If you ever get the chance to build one, take it. You'll come out a sharper
                developer than you went in.
            </p>
        </>
    );
}