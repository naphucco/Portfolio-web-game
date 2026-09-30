// app/about/page.tsx
import Image from 'next/image';
import Link from 'next/link';

export const metadata = {
  title: 'Giới thiệu — Nguyen An Phuc',
  description: 'Game Developer 10 năm kinh nghiệm: Unity, Cocos Creator, gameplay systems, tối ưu mobile.',
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
            <strong>10 năm</strong> lập trình phần mềm — trong đó <strong>5 năm chuyên sâu về game</strong>.
            Thế mạnh: Unity (C#), Cocos Creator, gameplay systems, custom shader và tối ưu hiệu năng mobile.
          </p>
          <div className="cta-row">
            <a
              className="btn btn-primary"
              href="/NguyenAnPhuc-CV.pdf"
              target="_blank"
              rel="noopener noreferrer"
            >
              📄 Tải CV (PDF)
            </a>
            <Link href="/games" className="btn btn-ghost">
              🎮 Xem demo
            </Link>
          </div>
        </div>
      </section>

      {/* ===== LIÊN HỆ NHANH ===== */}
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

      {/* ===== KỸ NĂNG ===== */}
      <section className="about-section">
        <h2 className="section-title">Kỹ năng chính</h2>

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
              {['Casual/Puzzle', 'Realtime Strategy', 'Card Game', 'AI / A* / NavMesh', 'DOTween', 'Mobile Optimization'].map((s) => (
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
            <h3>🛠 Tools khác</h3>
            <div className="skills">
              {['Git', 'Agile / Scrum', 'Angular', 'TypeScript', 'HTML5 / CSS3'].map((s) => (
                <span key={s} className="skill">{s}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== KINH NGHIỆM ===== */}
      <section className="about-section">
        <h2 className="section-title">Kinh nghiệm làm việc</h2>

        <div className="timeline">
          {/* Job 1 */}
          <article className="timeline-item">
            <div className="timeline-dot" />
            <div className="timeline-content">
              <div className="timeline-head">
                <h3>Remote Game Developer</h3>
                <span className="timeline-date">01/2026 — Hiện tại</span>
              </div>
              <p className="timeline-company">Client (Canada) · Online Realtime Card Game</p>
              <ul>
                <li>Phát triển game đánh bài multiplayer bằng Cocos Creator 2 + Pomelo framework.</li>
                <li>Xây dựng core game logic, card mechanics, đồng bộ state realtime client ↔ server.</li>
                <li>Tối ưu hiệu năng mobile và UI responsiveness cho gameplay online mượt mà.</li>
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
                <li>Phát triển nhiều game Casual/Puzzle: Restaurant Management, Cover Shooter, Wave Defense.</li>
                <li>Xây dựng gameplay loop, AI địch, reward system, UI flow bằng Unity (C#) + OOP.</li>
                <li>Dùng DOTween cho animation và A*/NavMesh cho di chuyển địch.</li>
                <li>Tích hợp Firebase Auth + Realtime DB để sync player data và save/load tiến trình.</li>
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
              <p className="timeline-company">SaaS &amp; Interactive 3D · Thị trường Na Uy</p>
              <ul>
                <li>Phát triển ứng dụng 3D tương tác trên mobile với UI phức tạp và môi trường 3D.</li>
                <li>Dẫn dắt frontend B2B platform bằng Angular, viết Unit Test đảm bảo độ tin cậy.</li>
                <li>Xây dựng thư viện component tái sử dụng, giảm 50% thời gian dev UI.</li>
                <li>Refactor dashboard: giảm load time từ 120s xuống dưới 3s.</li>
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
              <p className="timeline-company">FPT Software · Enterprise Solutions (Nhật Bản)</p>
              <ul>
                <li>Dẫn dắt migration hệ thống HR lớn từ Java JSP sang Angular 14, tăng 40% user engagement.</li>
                <li>Viết SQL procedures sinh dataset lớn để stress test production.</li>
                <li>Cấu hình cronjobs tự động hoá xử lý tác vụ.</li>
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
                <li>Thiết kế &amp; code game chiến thuật pixel art bằng Unity + C#.</li>
                <li>Dùng Odin Inspector mở rộng Unity Editor, tối ưu workflow cho level designer.</li>
                <li>
                  Viết core gameplay cho <strong>Monsters War</strong> — sau đó được publisher RedAntz mua lại
                  và đạt <strong>hàng triệu lượt tải</strong> trên Google Play.
                </li>
              </ul>
              <div className="timeline-links">
                <a
                  href="https://play.google.com/store/apps/details?id=com.redantz.game.monsterswar&hl=en"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="timeline-link"
                >
                  📱 Monsters War trên Google Play
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

      {/* ===== DỰ ÁN TIÊU BIỂU (có ảnh) ===== */}
      <section className="about-section">
        <h2 className="section-title">Dự án tiêu biểu</h2>

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
              <p>Mobile Strategy · Unity · Hàng triệu lượt tải trên Google Play</p>
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
              <p>Multiplayer · Cocos Creator 2 + Pomelo · Đồng bộ state realtime</p>
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
              <p>Unity3D · UI phức tạp · Tương tác 3D model mượt mà</p>
            </div>
          </article>
        </div>
      </section>

      {/* ===== HỌC VẤN ===== */}
      <section className="about-section">
        <h2 className="section-title">Học vấn &amp; Ngoại ngữ</h2>
        <div className="edu-grid">
          <div className="edu-card">
            <h3>🎓 Vocational Diploma in IT</h3>
            <p>University of Technology and Education — UDN (2013)</p>
          </div>
          <div className="edu-card">
            <h3>🌐 English</h3>
            <p>Professional working proficiency — đọc tài liệu kỹ thuật, giao tiếp hàng ngày, họp nhóm.</p>
          </div>
        </div>
      </section>

      {/* ===== LIÊN HỆ CUỐI ===== */}
      <section className="about-section about-cta">
        <h2 className="section-title">Cùng làm gì đó vui vẻ</h2>
        <p className="lead">
          Mình đang tìm cơ hội freelance hoặc vị trí Game Developer. Nếu bạn cần prototype,
          hoặc chỉ muốn trao đổi về game — cứ nhắn nhé.
        </p>
        <div className="cta-row">
          <a href="mailto:nguyenanphuc92@gmail.com" className="btn btn-primary">
            ✉️ Gửi email
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