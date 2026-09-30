// content/blog/game-optimization.tsx
export default function GameOptimizationContent() {
  return (
    <>
      <p className="lead">
        Khi làm game mobile, ranh giới giữa <strong>"Hiệu ứng hình ảnh mãn nhãn (Juicy VFX)"</strong> và{' '}
        <strong>"Tối ưu FPS"</strong> luôn là bài toán hóc búa cho Technical Artist &amp; Game Developer.
      </p>

      <p>
        Một sai lầm phổ biến là cố gắng dựng các Model 3D phức tạp với số lượng Polygon cao chỉ để làm cây
        cối, khói lửa hay đường đạn. Rốt cuộc? <strong>Draw calls tăng vọt, GPU overload, và máy người chơi
        nóng như một lò nướng!</strong>
      </p>

      <p>
        Tuy nhiên, có những kỹ thuật vô cùng đơn giản nhưng mang lại hiệu quả tối ưu vượt trội:
      </p>

      <img
        src="/blog/game-optimization2.jpg"
        alt="Minh họa nhân vật sniper ngụy trang"
      />
      <em>Billboarding + Alpha Cutout — "đánh lừa thị giác" cực rẻ.</em>

      <h2>💡 1. Sprite Sheet / Flipbook Animation (Khói, Lửa, Explosion)</h2>
      <p>
        Thay vì dùng Mesh 3D phức tạp, bạn hoàn toàn có thể tái hiện các hiệu ứng khói lửa hoành tráng bằng
        cách render chuỗi Frame thành <strong>Sprite Sheet</strong>.
      </p>
      <ul>
        <li>Áp dụng Texture đó lên một <strong>Quad 2D duy nhất</strong> (chỉ đúng 2 Triangles / 4 Vertices!).</li>
        <li>
          Kết hợp với Particle System hoặc Shader lật Frame đơn giản, bạn đã có ngay hiệu ứng chân thực mà
          chi phí tính toán GPU gần như <strong>0</strong>.
        </li>
      </ul>

      <h2>💡 2. Billboarding &amp; Alpha Testing (Làm Cây Cối, Ngụy Trang)</h2>
      <p>Nhìn vào nhân vật Sniper ngụy trang trong bức ảnh minh họa:</p>
      <ul>
        <li>
          Thay vì phải render hàng nghìn chiếc lá 3D chi tiết, toàn bộ tán lá um tùm thực chất được cấu thành
          từ <strong>các mặt Quad phẳng ghép lại</strong> cùng Texture Alpha Clip / Cutout.
        </li>
        <li>
          <strong>Số lượng Polygon được hạn chế ở mức tối đa</strong>, trong khi thị giác của người chơi vẫn
          hoàn toàn bị thuyết phục bởi độ dày dặn của bụi cây.
        </li>
      </ul>

      <h2>💡 3. Particle System Instancing cho Vệt Đạn (Tracer / Bullets)</h2>
      <p>Thay vì tạo GameObject hay Mesh riêng cho từng viên đạn:</p>
      <ul>
        <li>
          Sử dụng <strong>Particle System</strong> kết hợp với <strong>Texture Sheet Animation / Stretched
          Billboards</strong> cho các vệt đạn (Bullet Tracers).
        </li>
        <li>
          Hàng trăm viên đạn xả ra cùng lúc nhưng chỉ tiêu tốn một vài Draw Calls nhờ cơ chế Batching tự động
          của Particle Renderer.
        </li>
      </ul>
      <img
        src="/blog/game-optimization3.jpg"
        alt="Minh họa nhân vật sniper ngụy trang"
      />

      <h2>Lời Kết</h2>
      <p>
        Làm game không phải là đắp thật nhiều Polygon hay hiệu ứng nặng nề vào Scene, mà là{' '}
        <strong>nghệ thuật "đánh lừa thị giác" người chơi một cách thông minh nhất.</strong>
      </p>
      <p>
        Sử dụng Quad 2D, Sprite Sheet và cắt giảm Polygon tối đa chính là chìa khóa để giữ game vừa{' '}
        <strong>đẹp mắt</strong>, vừa <strong>mượt mà 60 FPS</strong> trên mọi thiết bị!
      </p>
    </>
  );
}