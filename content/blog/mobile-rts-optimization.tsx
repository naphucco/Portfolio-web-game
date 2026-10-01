// content/blog/mobile-rts-optimization.tsx
export default function MobileRtsOptimizationContent() {
  return (
    <>
      <p className="lead">
        Getting a mobile RTS to run at a stable framerate is a different beast than tuning a
        casual puzzle game. You have many units on screen, a large isometric map, and a mid-range
        device budget that forces you to make hard trade-offs. Here are the techniques that
        made the biggest difference in my latest project — taking it from "it works" to a steady{' '}
        <strong>90 FPS on a Galaxy A16 5G</strong>.
      </p>

      <img
        src="/blog/mobile-rts-optimization1.jpg"
        alt="Isometric RTS map with environment decor, units, and baked lighting"
      />
      <em>The final scene — decor, baked shadows, and rim-lit units in one view.</em>

      <p>
        None of these are exotic. They're all well-known in the industry. What matters is knowing{' '}
        <strong>when to apply them and why</strong> — which is what I want to share here.
      </p>

      <h2>🎨 1. Environment Decor — Cheap Details That Sell the Scene</h2>
      <p>
        An isometric map with only functional elements (bases, units, terrain) looks sterile.
        Adding <strong>sandbags, supply crates, and anti-tank barricades</strong> breaks up empty
        space and makes the battlefield feel lived-in.
      </p>
      <p>
        The key insight: these props are <strong>static, batched, and reused</strong>. I built them
        from a small set of modular meshes and let GPU instancing handle the repetition. Visually
        it looks like a hundred unique objects; behind the scenes it's a handful of draw calls.
      </p>
      <ul>
        <li>Keep a small modular kit (5–8 pieces) and re-arrange them into different layouts.</li>
        <li>
          <strong>Never</strong> give decorative props unique materials — reuse one atlas to keep
          batching intact.
        </li>
        <li>Bake lighting into the props themselves if they never move.</li>
      </ul>

      <h2>💡 2. Lighting — Bake What You Can, Fake What You Can't</h2>
      <p>
        Real-time lighting on mobile is expensive. Every shadow-casting light forces the GPU to
        render the scene an extra time into a shadow map. With even 3–4 lights, you've tripled
        your draw calls before you've drawn a single unit.
      </p>

      <img
        src="/blog/mobile-rts-optimization2.jpg"
        alt="Static objects with baked lightmaps, radar with real-time shadow, tanks with box shadows"
      />
      <em>
        Static props: baked lightmaps (zero runtime cost). Radar: real-time shadow (only 1 caster).
        Tanks: box-shaped shadows — visually convincing, and a fraction of the cost.
      </em>

      <p>
        The strategy that works:
      </p>
      <ul>
        <li>
          <strong>Bake lightmaps for everything static</strong> — terrain, buildings, rocks,
          barricades. Bake once at build time, ship the texture, and pay <em>zero</em> runtime
          cost. The shadows look photoreal because they're pre-computed.
        </li>
        <li>
          <strong>Use blob shadows for dynamic units</strong> — a simple dark ellipse projected
          under each soldier. It reads as a shadow at a glance, but costs nothing compared to a
          full shadow map pass.
        </li>
        <li>
          Reserve real-time shadows only for the hero unit or cinematic moments — never for the
          whole battlefield.
        </li>
      </ul>
      <p>
        Players rarely notice blob shadows. They <strong>definitely</strong> notice when the game
        runs at 45 FPS because you tried to give every unit a real shadow.
      </p>

      <h2>🛡️ 3. Rim Light — Making Units Pop Without Overdraw</h2>
      <p>
        In isometric RTS games, units have a nasty habit of blending into the terrain. Player
        squints at the screen trying to figure out where their soldiers are. Bad UX, and it makes
        the whole project feel amateur.
      </p>
      <p>
        The fix is a <strong>rim light (Fresnel) term</strong> in the unit shader — a subtle glow
        along the silhouette edge of each soldier.
      </p>
      <ul>
        <li>
          Add <code>pow(1.0 - dot(normal, viewDir), N)</code> to the fragment shader, tint it with
          a bright color, and multiply by a mask.
        </li>
        <li>
          Because it's in the shader, there's <strong>no extra geometry</strong>, no outline mesh,
          no post-processing pass — just a few extra ALU instructions per pixel.
        </li>
        <li>
          Tune the falloff so it's visible but not garish. A thin bright line reads better than a
          thick orange halo.
        </li>
      </ul>

      <h2>📊 The Result</h2>
      <p>
        Together, these changes dropped the frame time to the point where the game holds{' '}
        <strong>90 FPS on a Galaxy A16 5G</strong> — a mid-range phone with a Dimensity 6300. On
        higher-end devices it's uncapped.
      </p>
      <p>But the bigger lesson isn't the number. It's this:</p>
      <ul>
        <li>
          <strong>Most mobile performance wins come from what you <em>don't</em> do</strong> — no
          real-time lights, no per-frame C# updates, no unique materials.
        </li>
        <li>
          <strong>Shaders are almost always cheaper than CPU code</strong> for anything that runs
          per-vertex or per-pixel. Move work to the GPU when you can.
        </li>
        <li>
          <strong>Batching is sacred</strong>. Every decision that breaks batching — a unique
          material, a Rigidbody, a shadow-casting light — costs more than you think.
        </li>
      </ul>

      <h2>Final Thoughts</h2>
      <p>
        Mobile optimization isn't about squeezing the last 5% out of a scene. It's about{' '}
        <strong>setting up the pipeline so the 100% you ship with is already cheap</strong>.
        Bake early, batch aggressively, fake the expensive stuff, and save the real budget for
        the moments that matter.
      </p>
    </>
  );
}