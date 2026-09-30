// app/about/page.tsx
import Image from 'next/image';
import Link from 'next/link';

export const metadata = {
  title: 'About — Nguyen An Phuc',
  description: 'Game Developer with 10 years of experience: Unity, Cocos Creator, gameplay systems, mobile optimization.',
};

export default function AboutPage() {
  return (
    <main className="page-container">
      {/* ===== HERO ===== */}
      <section className="about-hero">
        <div className="about-avatar">
          <Image
            src="/about/avatar.png"
            alt="Nguyen An Phuc"
            width={220}
            height={220}
            priority
          />
        </div>
        <div className="about-intro">
          <p className="eyebrow">Game Developer</p>
          <h1>Nguyen An Phuc</h1>
          <p className="lead">
            <strong>10 years</strong> in software engineering — including <strong>5 years specializing in game development</strong>.
            Strong in Unity (C#), Cocos Creator, gameplay systems, custom shaders, and mobile performance optimization.
            Also comfortable with <strong>HTML/CSS</strong> and a bit of <strong>realtime backend &amp; databases</strong> (Firebase, Pomelo, SQL).
          </p>
          <div className="cta-row">
            <a
              className="btn btn-primary"
              href="/NguyenAnPhuc-CV.pdf"
              target="_blank"
              rel="noopener noreferrer"
            >
              📄 Download CV (PDF)
            </a>
            <Link href="/games" className="btn btn-ghost">
              🎮 View demos
            </Link>
          </div>
        </div>
      </section>

      {/* ===== QUICK CONTACT ===== */}
      <section className="about-contact">
        <a href="mailto:nguyenanphuc92@gmail.com" className="contact-link">
          <span className="k">EMAIL</span> nguyenanphuc92@gmail.com
        </a>
        <a href="tel:+84335789544" className="contact-link">
          <span className="k">PHONE</span> (+84) 335 789 544
        </a>
        <a
          href="https://linkedin.com/in/anphucnguyen"
          target="_blank"
          rel="noopener noreferrer"
          className="contact-link"
        >
          <span className="k">LINKEDIN</span> anphucnguyen
        </a>
        <a
          href="https://www.facebook.com/naphuccostudio/"
          target="_blank"
          rel="noopener noreferrer"
          className="contact-link"
        >
          <span className="k">STUDIO</span> An Phuc Co Studio
        </a>
      </section>

      {/* ===== SKILLS ===== */}
      <section className="about-section">
        <h2 className="section-title">Core Skills</h2>

        <div className="skills-group">
          <div className="skill-block">
            <h3>🎮 Game Engines</h3>
            <div className="skills">
              {['Unity3D (C#)', 'Cocos Creator 2', 'GameMaker Studio', 'Three.js'].map((s) => (
                <span key={s} className="skill">{s}</span>
              ))}
            </div>
          </div>

          <div className="skill-block">
            <h3>🎨 Graphics &amp; Shaders</h3>
            <div className="skills">
              {['Custom Shader (Glow, Toon, Wind)', 'Sprite Sheet', 'Photoshop', 'Blender 3D'].map((s) => (
                <span key={s} className="skill">{s}</span>
              ))}
            </div>
          </div>

          <div className="skill-block">
            <h3>⚙️ Gameplay &amp; Systems</h3>
            <div className="skills">
              {['Casual / Puzzle', 'Realtime Strategy', 'Card Game', 'AI / A* / NavMesh', 'DOTween', 'Mobile Optimization'].map((s) => (
                <span key={s} className="skill">{s}</span>
              ))}
            </div>
          </div>

          <div className="skill-block">
            <h3>🌐 Networking &amp; Backend</h3>
            <div className="skills">
              {['Pomelo (Realtime)', 'Firebase (Auth, RTDB)', 'SQL Stored Procedures', 'RESTful APIs', 'Unit Testing'].map((s) => (
                <span key={s} className="skill">{s}</span>
              ))}
            </div>
          </div>

          <div className="skill-block">
            <h3>🛠 Other Tools</h3>
            <div className="skills">
              {['Git', 'Agile / Scrum', 'Angular', 'TypeScript', 'HTML5 / CSS3'].map((s) => (
                <span key={s} className="skill">{s}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== EXPERIENCE ===== */}
      <section className="about-section">
        <h2 className="section-title">Work Experience</h2>

        <div className="timeline">
          {/* Job 1 */}
          <article className="timeline-item">
            <div className="timeline-dot" />
            <div className="timeline-content">
              <div className="timeline-head">
                <h3>Remote Game Developer</h3>
                <span className="timeline-date">01/2026 — Present</span>
              </div>
              <p className="timeline-company">Client (Canada) · Online Realtime Card Game</p>
              <ul>
                <li>Built an online multiplayer card game using Cocos Creator 2 + Pomelo framework.</li>
                <li>Implemented core game logic, card mechanics, and realtime state sync between client and server.</li>
                <li>Optimized mobile performance and UI responsiveness for smooth online gameplay.</li>
              </ul>
            </div>
          </article>

          {/* Job 2 */}
          <article className="timeline-item">
            <div className="timeline-dot" />
            <div className="timeline-content">
              <div className="timeline-head">
                <h3>Casual Game Developer</h3>
                <span className="timeline-date">02/2025 — 12/2025</span>
              </div>
              <p className="timeline-company">New Studio · Mobile Casual &amp; Puzzle</p>
              <ul>
                <li>Developed multiple Casual/Puzzle games: Restaurant Management, Cover Shooter, Wave Defense.</li>
                <li>Built gameplay loops, enemy AI, reward systems, and UI flow with Unity (C#) and OOP principles.</li>
                <li>Used DOTween for animation and A*/NavMesh for enemy movement and unit pathing.</li>
                <li>Integrated Firebase Auth + Realtime DB for player data sync and save/load progression.</li>
              </ul>
            </div>
          </article>

          {/* Job 3 */}
          <article className="timeline-item">
            <div className="timeline-dot" />
            <div className="timeline-content">
              <div className="timeline-head">
                <h3>Unity3D Developer &amp; Frontend</h3>
                <span className="timeline-date">2023 — 2024</span>
              </div>
              <p className="timeline-company">SaaS &amp; Interactive 3D · Norwegian Market</p>
              <ul>
                <li>Developed an interactive 3D mobile application with complex UI systems and 3D environments.</li>
                <li>Led frontend architecture of a B2B platform using Angular; wrote unit tests for reliability.</li>
                <li>Built reusable component libraries, reducing UI development time by 50%.</li>
                <li>Refactored core dashboard, cutting load time from 120s down to under 3s.</li>
              </ul>
              <a
                href="https://www.ekonect.no/"
                target="_blank"
                rel="noopener noreferrer"
                className="timeline-link"
              >
                🔗 ekonect.no
              </a>
            </div>
          </article>

          {/* Job 4 */}
          <article className="timeline-item">
            <div className="timeline-dot" />
            <div className="timeline-content">
              <div className="timeline-head">
                <h3>Frontend Developer</h3>
                <span className="timeline-date">07/2020 — 01/2023</span>
              </div>
              <p className="timeline-company">FPT Software · Enterprise Solutions (Japan)</p>
              <ul>
                <li>Led migration of a large-scale HR system from legacy Java JSP to Angular 14, boosting user engagement by 40%.</li>
                <li>Wrote complex SQL procedures to generate bulk datasets for production stress testing.</li>
                <li>Configured cronjobs for automated task processing.</li>
              </ul>
            </div>
          </article>

          {/* Job 5 */}
          <article className="timeline-item">
            <div className="timeline-dot" />
            <div className="timeline-content">
              <div className="timeline-head">
                <h3>Unity3D Developer</h3>
                <span className="timeline-date">2014 — 06/2020</span>
              </div>
              <p className="timeline-company">Supermassy Game · Mobile Strategy</p>
              <ul>
                <li>Designed and coded pixel-art strategy games in Unity + C#.</li>
                <li>Extended Unity Editor tools with Odin Inspector, streamlining workflow for level designers.</li>
                <li>
                  Wrote core gameplay for <strong>Monsters War</strong> — later acquired by publisher RedAntz
                  and reached <strong>millions of downloads</strong> on Google Play.
                </li>
              </ul>
              <div className="timeline-links">
                <a
                  href="https://play.google.com/store/apps/details?id=com.redantz.game.monsterswar&hl=en"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="timeline-link"
                >
                  📱 Monsters War on Google Play
                </a>
                <a
                  href="https://www.facebook.com/supermassygame"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="timeline-link"
                >
                  🔗 Supermassy Studio
                </a>
              </div>
            </div>
          </article>
        </div>
      </section>

      {/* ===== FEATURED PROJECTS ===== */}
      <section className="about-section">
        <h2 className="section-title">Featured Projects</h2>

        <div className="projects-grid">
          <article className="project-card">
            <div className="project-cover">
              <Image
                src="/about/project-monsters-war.gif"
                alt="Monsters War"
                width={600}
                height={340}
              />
            </div>
            <div className="project-info">
              <h3>Monsters War</h3>
              <p>Mobile Strategy · Unity · Millions of downloads on Google Play</p>
            </div>
          </article>

          <article className="project-card">
            <div className="project-cover">
              <Image
                src="/about/project-card-game.png"
                alt="Online Realtime Card Game"
                width={600}
                height={340}
              />
            </div>
            <div className="project-info">
              <h3>Online Realtime Card Game</h3>
              <p>Multiplayer · Cocos Creator 2 + Pomelo · Realtime state sync</p>
            </div>
          </article>

          <article className="project-card">
            <div className="project-cover">
              <Image
                src="/about/project-3d-app.jpg"
                alt="Interactive 3D App"
                width={600}
                height={340}
              />
            </div>
            <div className="project-info">
              <h3>Interactive 3D Mobile App</h3>
              <p>Unity3D · Complex UI · Smooth 3D model interaction</p>
            </div>
          </article>
        </div>
      </section>

      {/* ===== EDUCATION ===== */}
      <section className="about-section">
        <h2 className="section-title">Education &amp; Languages</h2>
        <div className="edu-grid">
          <div className="edu-card">
            <h3>🎓 Vocational Diploma in IT</h3>
            <p>University of Technology and Education — UDN (2013)</p>
          </div>
          <div className="edu-card">
            <h3>🌐 English</h3>
            <p>Professional working proficiency — technical documentation, daily communication, team meetings.</p>
          </div>
        </div>
      </section>

      {/* ===== CONTACT CTA ===== */}
      <section className="about-section about-cta">
        <h2 className="section-title">Let's build something fun</h2>
        <p className="lead">
          I'm open to freelance opportunities and Game Developer roles. If you need a prototype,
          or just want to talk games — drop me a message.
        </p>
        <div className="cta-row">
          <a href="mailto:nguyenanphuc92@gmail.com" className="btn btn-primary">
            ✉️ Send email
          </a>
          <a
            href="https://linkedin.com/in/anphucnguyen"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-ghost"
          >
            💼 LinkedIn
          </a>
        </div>
      </section>
    </main>
  );
}