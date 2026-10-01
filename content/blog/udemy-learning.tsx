// content/blog/udemy-learning.tsx
export default function UdemyLearningContent() {
  return (
    <>
      <p className="lead">
        When people think about learning to code, they usually picture thick, dry textbooks.
        Maybe a soft-skills book like <em>How to Win Friends and Influence People</em>, or{' '}
        <em>Clean Code</em> if they're feeling ambitious. A more entertaining option is YouTube
        series from passionate developers — though after the third Indian tutorial where you
        can only understand every fourth word, motivation starts to slip.
      </p>

      <p>
        Like many others, I used to hang out on Stack Overflow and Unity Answers for fun. Once
        I had a solid foundation, I'd pull source code from GitHub and reverse-engineer it. All
        valid paths. But in this post, I want to talk about an approach I only recently
        discovered — and it made a huge difference for me: <strong>Udemy</strong>.
      </p>

      <figure>
        <img src="/blog/udemy-learning2.png" alt="Learning paths comparison" />
        <figcaption>
          Different learning paths — each has a place, but not all are equally efficient.
        </figcaption>
      </figure>

      <h2>My Old Philosophy (and Why It Cost Me Time)</h2>
      <p>
        I used to believe that YouTube alone was enough. You watch a tutorial, then hit real
        problems during your project, and the knowledge sort of upgrades itself along the way.
        There's nothing <em>wrong</em> with this. But after enough times banging my head against
        a problem that already had a well-known solution — I started to notice the pattern.
      </p>
      <p>
        It looked something like this: I'd use my own CSS and HTML knowledge to build a
        responsive website. Fine. It worked. But after building three of them, I finally
        googled my way to the existence of <strong>Bootstrap</strong> — a framework that
        handles 90% of what I was doing manually. Nothing wrong with my solution, but I'd
        spent dozens of hours rebuilding something that already existed.
      </p>
      <p>
        I did that <em>a lot</em>.
      </p>

      <h2>Why Free Tutorials Aren't Always Cheap</h2>
      <p>
        Free content is great. But free content is also usually <strong>incomplete</strong>.
        A YouTube series covers the "what" but skips the "why." To actually learn a subject,
        you end up hopping between five different channels, three blog posts, and a Stack
        Overflow thread from 2014.
      </p>
      <p>
        Udemy courses, on the other hand, are structured end-to-end. They're built by someone
        who committed to teaching the entire subject — not just their favorite 20 minutes of it.
      </p>

      <h2>The Real Math</h2>
      <p>
        On sale, a Udemy course averages around <strong>$11</strong>. That's less than a movie
        ticket. For that price you get:
      </p>
      <ul>
        <li>The full course — start to finish, one voice, one structure.</li>
        <li>Source code for every section.</li>
        <li>Q&amp;A support from the instructor, usually within hours.</li>
        <li>Lifetime access — rewatch whenever you need a refresher.</li>
      </ul>
      <p>
        Compare that to a $30–$50 programming book on Amazon that ships with a CD from 2018
        and goes out of date before you finish chapter 4. The book isn't <em>bad</em> — it's
        just slower and more fragile.
      </p>

      <h2>The Hidden Bonus: English</h2>
      <p>
        Most quality Udemy courses are in English. If you're not fully confident yet, pick
        courses with subtitles and follow along. After a few courses, you'll notice your
        listening comprehension improving alongside your coding. Two skills, one price.
      </p>

      <h2>Final Thoughts</h2>
      <p>
        I'm not saying Udemy replaces real projects — nothing does. But it's a fantastic{' '}
        <strong>shortcut through the fog</strong> of "I don't know what I don't know." For a
        few dollars, you get someone who's already walked the path handing you a map.
      </p>
      <p>
        If you've been trying to learn purely from free content and keep hitting walls, it
        might be time to spend the price of a coffee and save yourself a month of guessing.
      </p>

      <p>
        <strong>Postscript (2026):</strong> Six years later, this principle still holds —
        though the medium has shifted. My current <a href="/blog">blog posts</a> and{' '}
        <a href="/games">playable demos</a> are built on the same idea: learn systematically,
        then <em>ship something</em> to prove it.
      </p>
    </>
  );
}