import subprocess
import os
from PIL import Image

CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
BASE_DIR = os.path.abspath(os.path.dirname(__file__))
ICON_PATH = os.path.abspath(os.path.join(BASE_DIR, '../icons/icon128.png'))

def render_html_to_png(html_content, output_png, width, height):
    temp_html = os.path.join(BASE_DIR, 'temp_render.html')
    with open(temp_html, 'w', encoding='utf-8') as f:
        f.write(html_content)
    
    cmd = [
        CHROME,
        '--headless',
        '--disable-gpu',
        '--default-background-color=00000000',
        f'--window-size={width},{height}',
        f'--screenshot={output_png}',
        f'file://{temp_html}'
    ]
    subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    if os.path.exists(temp_html):
        os.remove(temp_html)
    
    # Ensure RGB mode (no alpha) as required by Chrome Web Store
    im = Image.open(output_png)
    if im.mode != 'RGB':
        im = im.convert('RGB')
        im.save(output_png)
    print(f"Generated: {os.path.basename(output_png)} -> size={im.size}, mode={im.mode}")

# ==============================================================================
# 1. SMALL PROMO TILE (440 x 280)
# ==============================================================================
small_promo_html = f'''<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * {{ margin: 0; padding: 0; box-sizing: border-box; }}
  body {{
    width: 440px;
    height: 280px;
    background: #090a0f;
    font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif;
    color: #ffffff;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    position: relative;
    overflow: hidden;
    -webkit-font-smoothing: antialiased;
  }}
  .glow-cyan {{
    position: absolute;
    width: 280px;
    height: 280px;
    background: radial-gradient(circle, rgba(0, 210, 255, 0.28) 0%, rgba(0, 122, 255, 0.12) 50%, transparent 70%);
    top: -60px;
    left: 50%;
    transform: translateX(-50%);
    filter: blur(30px);
    pointer-events: none;
  }}
  .glow-bottom {{
    position: absolute;
    width: 320px;
    height: 120px;
    background: radial-gradient(circle, rgba(79, 70, 229, 0.25) 0%, transparent 70%);
    bottom: -40px;
    left: 50%;
    transform: translateX(-50%);
    filter: blur(25px);
    pointer-events: none;
  }}
  .card {{
    z-index: 2;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
  }}
  .logo-box {{
    width: 82px;
    height: 82px;
    margin-bottom: 14px;
    position: relative;
  }}
  .logo-box img {{
    width: 100%;
    height: 100%;
    filter: drop-shadow(0 12px 28px rgba(0, 122, 255, 0.5));
  }}
  h1 {{
    font-size: 32px;
    font-weight: 750;
    letter-spacing: -0.6px;
    margin-bottom: 4px;
    background: linear-gradient(180deg, #ffffff 30%, #dbeafe 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }}
  .tagline {{
    font-size: 11.5px;
    font-weight: 650;
    letter-spacing: 1.6px;
    text-transform: uppercase;
    color: #38bdf8;
    margin-bottom: 16px;
  }}
  .badges {{
    display: flex;
    gap: 8px;
  }}
  .pill {{
    font-size: 10.5px;
    font-weight: 550;
    color: rgba(255, 255, 255, 0.85);
    background: rgba(255, 255, 255, 0.08);
    backdrop-filter: blur(16px);
    border: 1px solid rgba(255, 255, 255, 0.16);
    padding: 4px 10px;
    border-radius: 12px;
  }}
  .border-overlay {{
    position: absolute;
    inset: 0;
    border: 1px solid rgba(255, 255, 255, 0.12);
    pointer-events: none;
  }}
</style>
</head>
<body>
  <div class="glow-cyan"></div>
  <div class="glow-bottom"></div>
  <div class="border-overlay"></div>
  <div class="card">
    <div class="logo-box">
      <img src="file://{ICON_PATH}" />
    </div>
    <h1>AirTab</h1>
    <div class="tagline">Floating Mini Browser</div>
    <div class="badges">
      <div class="pill">⚡ Look Up</div>
      <div class="pill">📱 Mobile Mode</div>
      <div class="pill">📺 Video PiP</div>
      <div class="pill">🛡️ AdBlock</div>
    </div>
  </div>
</body>
</html>'''

# ==============================================================================
# 2. MARQUEE PROMO TILE (1400 x 560)
# ==============================================================================
marquee_promo_html = f'''<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * {{ margin: 0; padding: 0; box-sizing: border-box; }}
  body {{
    width: 1400px;
    height: 560px;
    background: #08090d;
    font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif;
    color: #ffffff;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 84px;
    position: relative;
    overflow: hidden;
    -webkit-font-smoothing: antialiased;
  }}
  .bg-glow-1 {{
    position: absolute;
    width: 650px;
    height: 650px;
    background: radial-gradient(circle, rgba(0, 210, 255, 0.22) 0%, rgba(0, 122, 255, 0.08) 50%, transparent 70%);
    top: -120px;
    right: 120px;
    filter: blur(50px);
    pointer-events: none;
  }}
  .bg-glow-2 {{
    position: absolute;
    width: 500px;
    height: 500px;
    background: radial-gradient(circle, rgba(79, 70, 229, 0.18) 0%, transparent 70%);
    bottom: -150px;
    left: 80px;
    filter: blur(40px);
    pointer-events: none;
  }}
  .left-col {{
    width: 580px;
    z-index: 2;
  }}
  .brand-badge {{
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 1.4px;
    text-transform: uppercase;
    color: #38bdf8;
    background: rgba(0, 210, 255, 0.12);
    border: 1px solid rgba(0, 210, 255, 0.28);
    padding: 6px 14px;
    border-radius: 20px;
    margin-bottom: 20px;
  }}
  h1 {{
    font-size: 54px;
    font-weight: 780;
    line-height: 1.12;
    letter-spacing: -1.2px;
    margin-bottom: 18px;
    background: linear-gradient(180deg, #ffffff 40%, #cbd5e1 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }}
  .desc {{
    font-size: 18px;
    line-height: 1.55;
    color: #94a3b8;
    margin-bottom: 28px;
  }}
  .features-row {{
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }}
  .feat-pill {{
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    font-weight: 600;
    color: #e2e8f0;
    background: rgba(255, 255, 255, 0.06);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.14);
    padding: 7px 14px;
    border-radius: 12px;
  }}
  .right-col {{
    z-index: 2;
    width: 580px;
    height: 410px;
    position: relative;
    perspective: 1200px;
  }}
  .window-mockup {{
    width: 100%;
    height: 100%;
    background: rgba(22, 23, 29, 0.88);
    backdrop-filter: blur(40px) saturate(200%);
    border: 1px solid rgba(255, 255, 255, 0.22);
    border-radius: 20px;
    box-shadow: 0 35px 80px rgba(0, 0, 0, 0.75), 0 0 40px rgba(0, 122, 255, 0.25);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    transform: rotateY(-6deg) rotateX(4deg);
    transition: transform 0.3s ease;
  }}
  .win-header {{
    height: 44px;
    background: rgba(255, 255, 255, 0.04);
    border-bottom: 1px solid rgba(255, 255, 255, 0.12);
    display: flex;
    align-items: center;
    padding: 0 14px;
    justify-content: space-between;
  }}
  .traffic-dots {{
    display: flex;
    gap: 7px;
  }}
  .dot {{ width: 11px; height: 11px; border-radius: 50%; }}
  .dot-r {{ background: #ff5f56; }}
  .dot-y {{ background: #ffbd2e; }}
  .dot-g {{ background: #27c93f; }}
  .mock-tabs {{
    display: flex;
    gap: 6px;
    flex: 1;
    margin: 0 16px;
  }}
  .m-tab {{
    display: flex;
    align-items: center;
    gap: 6px;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.18);
    padding: 4px 12px;
    border-radius: 8px;
    font-size: 11.5px;
    font-weight: 550;
    color: #fff;
  }}
  .win-nav {{
    height: 38px;
    background: rgba(0, 0, 0, 0.18);
    border-bottom: 1px solid rgba(255, 255, 255, 0.10);
    display: flex;
    align-items: center;
    padding: 0 14px;
    gap: 10px;
  }}
  .nav-omni {{
    flex: 1;
    height: 26px;
    background: rgba(0, 0, 0, 0.35);
    border: 1px solid rgba(255, 255, 255, 0.14);
    border-radius: 7px;
    display: flex;
    align-items: center;
    padding: 0 10px;
    font-size: 11.5px;
    color: #94a3b8;
    gap: 6px;
  }}
  .win-content {{
    flex: 1;
    padding: 22px;
    background: #141419;
    display: flex;
    flex-direction: column;
    gap: 14px;
  }}
  .content-title {{
    font-size: 18px;
    font-weight: 700;
    color: #ffffff;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }}
  .content-snippet {{
    font-size: 13px;
    line-height: 1.55;
    color: #cbd5e1;
  }}
  .quick-links {{
    display: flex;
    gap: 8px;
    margin-top: 6px;
  }}
  .q-link {{
    font-size: 11px;
    color: #38bdf8;
    background: rgba(56, 189, 248, 0.12);
    border: 1px solid rgba(56, 189, 248, 0.25);
    padding: 4px 10px;
    border-radius: 6px;
  }}
</style>
</head>
<body>
  <div class="bg-glow-1"></div>
  <div class="bg-glow-2"></div>

  <div class="left-col">
    <div class="brand-badge">⚡ macOS Safari Look Up & Arc Peek</div>
    <h1>Browse without leaving your tab.</h1>
    <div class="desc">
      AirTab gives you a weightless, floating mini browser right inside any webpage.
      Instant look-ups, Picture-in-Picture video, multi-tabs, and distraction-free reading.
    </div>
    <div class="features-row">
      <div class="feat-pill">⚡ Option Key Look Up</div>
      <div class="feat-pill">📱 Mobile Mode (375px)</div>
      <div class="feat-pill">📺 Video PiP</div>
      <div class="feat-pill">🛡️ AdBlocker</div>
      <div class="feat-pill">🔒 100% Private</div>
    </div>
  </div>

  <div class="right-col">
    <div class="window-mockup">
      <div class="win-header">
        <div class="traffic-dots">
          <div class="dot dot-r"></div>
          <div class="dot dot-y"></div>
          <div class="dot dot-g"></div>
        </div>
        <div class="mock-tabs">
          <div class="m-tab">
            <span>⚡</span>
            <span>Quantum Computing</span>
          </div>
          <div class="m-tab" style="opacity:0.6;">
            <span>Wikipedia</span>
          </div>
        </div>
        <div style="font-size:12px; color:#94a3b8; font-weight:600;">+</div>
      </div>
      <div class="win-nav">
        <span style="font-size:12px; color:#94a3b8;">‹ › ⟳</span>
        <div class="nav-omni">
          <span style="color:#38bdf8;">🔒</span>
          <span style="color:#e2e8f0;">https://google.com/search?q=quantum+computing</span>
        </div>
        <span style="font-size:11px; color:#38ef7d; font-weight:600;">🛡️ Active</span>
      </div>
      <div class="win-content">
        <div class="content-title">
          <span>Quantum Computing</span>
          <span style="font-size:11px; background:#0284c7; color:#fff; padding:2px 8px; border-radius:4px;">Look Up</span>
        </div>
        <div class="content-snippet">
          Quantum computing is a multidisciplinary field comprising aspects of computer science, physics, and mathematics that utilizes quantum mechanics to solve complex problems faster than on classical computers.
        </div>
        <div class="quick-links">
          <div class="q-link">Qubits & Superposition</div>
          <div class="q-link">Quantum Supremacy</div>
          <div class="q-link">Applications in Cryptography</div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>'''

# ==============================================================================
# 3. SCREENSHOT 1: INSTANT LOOK UP (1280 x 800)
# ==============================================================================
screenshot_1_html = f'''<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * {{ margin: 0; padding: 0; box-sizing: border-box; }}
  body {{
    width: 1280px;
    height: 800px;
    background: #0f1015;
    font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", sans-serif;
    color: #ffffff;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    -webkit-font-smoothing: antialiased;
  }}
  /* Header Presentation Banner */
  .pres-header {{
    height: 110px;
    background: #090a0e;
    border-bottom: 1px solid rgba(255, 255, 255, 0.10);
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 0 48px;
    position: relative;
    z-index: 10;
  }}
  .feat-tag {{
    font-size: 11.5px;
    font-weight: 700;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    color: #38bdf8;
    margin-bottom: 4px;
    display: flex;
    align-items: center;
    gap: 6px;
  }}
  .pres-title {{
    font-size: 26px;
    font-weight: 750;
    color: #ffffff;
    letter-spacing: -0.4px;
  }}
  .pres-sub {{
    font-size: 13.5px;
    color: #94a3b8;
    margin-top: 2px;
  }}
  /* Host Browser Canvas */
  .browser-canvas {{
    flex: 1;
    background: #181920;
    position: relative;
    padding: 36px 64px;
    overflow: hidden;
  }}
  .article-container {{
    max-width: 720px;
    background: #1e1f28;
    border: 1px solid rgba(255, 255, 255, 0.10);
    border-radius: 12px;
    padding: 32px 36px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.4);
  }}
  .article-h1 {{
    font-size: 24px;
    font-weight: 700;
    margin-bottom: 16px;
    color: #f1f5f9;
  }}
  .article-p {{
    font-size: 15px;
    line-height: 1.65;
    color: #94a3b8;
    margin-bottom: 16px;
  }}
  .highlight-word {{
    background: rgba(0, 210, 255, 0.28);
    color: #ffffff;
    padding: 2px 6px;
    border-radius: 4px;
    border-bottom: 2px solid #00d2ff;
    font-weight: 600;
    position: relative;
  }}
  /* Floating AirTab Popover */
  .airtab-popover {{
    position: absolute;
    top: 140px;
    left: 480px;
    width: 530px;
    height: 480px;
    background: rgba(22, 23, 29, 0.90);
    backdrop-filter: blur(48px) saturate(220%);
    border: 1px solid rgba(255, 255, 255, 0.24);
    border-radius: 18px;
    box-shadow: 0 35px 90px rgba(0, 0, 0, 0.8), 0 0 30px rgba(0, 122, 255, 0.35);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    z-index: 50;
  }}
  /* Pointer Arrow */
  .callout-arrow {{
    position: absolute;
    top: -9px;
    left: 48px;
    width: 18px;
    height: 9px;
  }}
  .pop-header {{
    height: 40px;
    background: rgba(255, 255, 255, 0.04);
    border-bottom: 1px solid rgba(255, 255, 255, 0.12);
    display: flex;
    align-items: center;
    padding: 0 14px;
    justify-content: space-between;
  }}
  .pop-nav {{
    height: 38px;
    background: rgba(0, 0, 0, 0.16);
    border-bottom: 1px solid rgba(255, 255, 255, 0.10);
    display: flex;
    align-items: center;
    padding: 0 12px;
    gap: 8px;
  }}
  .pop-omni {{
    flex: 1;
    height: 26px;
    background: rgba(0, 0, 0, 0.35);
    border: 1px solid rgba(255, 255, 255, 0.14);
    border-radius: 6px;
    display: flex;
    align-items: center;
    padding: 0 10px;
    font-size: 11.5px;
    color: #e2e8f0;
    gap: 6px;
  }}
  .pop-body {{
    flex: 1;
    background: #141419;
    padding: 24px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }}
  .result-card {{
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 10px;
    padding: 16px;
  }}
  .card-h {{
    font-size: 16px;
    font-weight: 700;
    color: #38bdf8;
    margin-bottom: 6px;
  }}
  .card-p {{
    font-size: 13px;
    line-height: 1.55;
    color: #cbd5e1;
  }}
  .key-shortcut-badge {{
    position: absolute;
    bottom: 24px;
    right: 48px;
    background: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.18);
    padding: 10px 18px;
    border-radius: 12px;
    font-size: 13px;
    font-weight: 600;
    color: #fff;
    display: flex;
    align-items: center;
    gap: 8px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.5);
  }}
  kbd {{
    background: rgba(255, 255, 255, 0.18);
    border: 1px solid rgba(255, 255, 255, 0.3);
    padding: 3px 8px;
    border-radius: 6px;
    font-family: inherit;
    font-size: 12px;
    color: #38bdf8;
  }}
</style>
</head>
<body>
  <div class="pres-header">
    <div class="feat-tag">⚡ FEATURE 01 • INSTANT LOOK UP & ARC PEEK</div>
    <div class="pres-title">Hover Any Word or Link & Press Option (Alt)</div>
    <div class="pres-sub">Peek search results, definitions, and web pages without ever leaving your active tab.</div>
  </div>

  <div class="browser-canvas">
    <div class="article-container">
      <div class="article-h1">The Evolution of Artificial Intelligence</div>
      <div class="article-p">
        Modern computing has entered a transformative era driven by large-scale 
        <span class="highlight-word">neural networks</span> and foundation models that comprehend 
        multimodal data at superhuman speeds.
      </div>
      <div class="article-p">
        Researchers around the world are applying deep learning architectures to protein folding, 
        autonomous robotics, and next-generation browser workflows.
      </div>
    </div>

    <!-- Floating AirTab -->
    <div class="airtab-popover">
      <svg class="callout-arrow" viewBox="0 0 18 9">
        <path d="M 0 9 L 9 0 L 18 9" fill="rgba(22, 23, 29, 0.95)" stroke="rgba(255, 255, 255, 0.24)" stroke-width="1" />
      </svg>
      <div class="pop-header">
        <div style="display:flex; align-items:center; gap:8px;">
          <img src="file://{ICON_PATH}" style="width:18px; height:18px;" />
          <span style="font-size:12px; font-weight:650; color:#fff;">AirTab Look Up</span>
        </div>
        <div style="display:flex; gap:6px; font-size:12px; color:#94a3b8;">
          <span>📌</span>
          <span>⛶</span>
          <span>✕</span>
        </div>
      </div>
      <div class="pop-nav">
        <div class="pop-omni">
          <span style="color:#38bdf8;">🔍</span>
          <span>neural networks - Google Search</span>
        </div>
        <span style="font-size:11px; background:rgba(48,209,88,0.18); color:#38ef7d; padding:2px 7px; border-radius:4px; font-weight:600;">🛡️ AdBlock</span>
      </div>
      <div class="pop-body">
        <div class="result-card">
          <div class="card-h">Neural Network (Definition)</div>
          <div class="card-p">
            A neural network is an artificial intelligence model inspired by the human brain, composed of interconnected nodes (neurons) that process inputs in layered representations.
          </div>
        </div>
        <div class="result-card">
          <div class="card-h">Key Architectures</div>
          <div class="card-p">
            • Transformers (Self-Attention)<br>
            • Convolutional Neural Networks (CNNs for Vision)<br>
            • Recurrent & LSTM Networks (Sequential data)
          </div>
        </div>
      </div>
    </div>

    <div class="key-shortcut-badge">
      <span>💡 Pro Tip: Hover cursor and press</span>
      <kbd>⌥ Option</kbd>
      <span>to Peek / Dismiss</span>
    </div>
  </div>
</body>
</html>'''

# ==============================================================================
# 4. SCREENSHOT 2: ADAPTIVE MOBILE VIEW (1280 x 800)
# ==============================================================================
screenshot_2_html = f'''<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * {{ margin: 0; padding: 0; box-sizing: border-box; }}
  body {{
    width: 1280px;
    height: 800px;
    background: #0f1015;
    font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", sans-serif;
    color: #ffffff;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    -webkit-font-smoothing: antialiased;
  }}
  .pres-header {{
    height: 110px;
    background: #090a0e;
    border-bottom: 1px solid rgba(255, 255, 255, 0.10);
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 0 48px;
    position: relative;
    z-index: 10;
  }}
  .feat-tag {{
    font-size: 11.5px;
    font-weight: 700;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    color: #38bdf8;
    margin-bottom: 4px;
    display: flex;
    align-items: center;
    gap: 6px;
  }}
  .pres-title {{
    font-size: 26px;
    font-weight: 750;
    color: #ffffff;
    letter-spacing: -0.4px;
  }}
  .pres-sub {{
    font-size: 13.5px;
    color: #94a3b8;
    margin-top: 2px;
  }}
  .browser-canvas {{
    flex: 1;
    background: #181920;
    position: relative;
    padding: 36px 64px;
    display: flex;
    gap: 40px;
    align-items: center;
  }}
  .info-panel {{
    width: 480px;
  }}
  .info-panel h2 {{
    font-size: 32px;
    font-weight: 750;
    line-height: 1.25;
    margin-bottom: 16px;
    color: #f8fafc;
  }}
  .info-panel p {{
    font-size: 15px;
    line-height: 1.6;
    color: #94a3b8;
    margin-bottom: 20px;
  }}
  .feature-box {{
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 12px;
    padding: 16px 20px;
    margin-bottom: 12px;
  }}
  .fb-title {{
    font-size: 14px;
    font-weight: 700;
    color: #38bdf8;
    margin-bottom: 4px;
  }}
  .fb-desc {{
    font-size: 12.5px;
    color: #cbd5e1;
  }}
  /* Mobile View Mockup */
  .mobile-mockup {{
    width: 375px;
    height: 580px;
    background: rgba(22, 23, 29, 0.94);
    backdrop-filter: blur(48px);
    border: 1px solid rgba(255, 255, 255, 0.25);
    border-radius: 28px;
    box-shadow: 0 35px 90px rgba(0, 0, 0, 0.8), 0 0 40px rgba(0, 210, 255, 0.3);
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }}
  .mob-header {{
    height: 44px;
    background: rgba(255, 255, 255, 0.04);
    border-bottom: 1px solid rgba(255, 255, 255, 0.12);
    display: flex;
    align-items: center;
    padding: 0 16px;
    justify-content: space-between;
  }}
  .mob-badge {{
    font-size: 10px;
    font-weight: 700;
    color: #00f0ff;
    background: rgba(0, 240, 255, 0.14);
    border: 1px solid rgba(0, 240, 255, 0.35);
    padding: 2px 8px;
    border-radius: 10px;
  }}
  .mob-nav {{
    height: 38px;
    background: rgba(0, 0, 0, 0.2);
    border-bottom: 1px solid rgba(255, 255, 255, 0.10);
    display: flex;
    align-items: center;
    padding: 0 12px;
    gap: 8px;
  }}
  .mob-omni {{
    flex: 1;
    height: 26px;
    background: rgba(0, 0, 0, 0.4);
    border: 1px solid rgba(255, 255, 255, 0.14);
    border-radius: 6px;
    display: flex;
    align-items: center;
    padding: 0 10px;
    font-size: 11px;
    color: #e2e8f0;
  }}
  .mob-content {{
    flex: 1;
    background: #141419;
    padding: 18px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }}
  .mob-search-card {{
    background: #1e1f26;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 10px;
    padding: 14px;
  }}
  .msc-title {{
    font-size: 14px;
    font-weight: 700;
    color: #38bdf8;
    margin-bottom: 4px;
  }}
  .msc-sub {{
    font-size: 12px;
    line-height: 1.45;
    color: #94a3b8;
  }}
</style>
</head>
<body>
  <div class="pres-header">
    <div class="feat-tag">📱 FEATURE 02 • SMARTPHONE MOBILE MODE</div>
    <div class="pres-title">Adaptive iPhone Viewport (< 420px Width)</div>
    <div class="pres-sub">Drag AirTab narrow to instantly trigger native 375px mobile responsiveness with zero horizontal scrollbars.</div>
  </div>

  <div class="browser-canvas">
    <div class="info-panel">
      <h2>Drag Narrow for True Mobile Experience</h2>
      <p>
        Need a mobile screen layout for responsive testing, reading mobile articles, or tucking a slim window to the side of your monitor? AirTab automatically transforms into a smartphone viewport.
      </p>
      <div class="feature-box">
        <div class="fb-title">📱 375px Real Mobile Emulation</div>
        <div class="fb-desc">Websites automatically render their native mobile menus, hamburger buttons, and single-column cards.</div>
      </div>
      <div class="feature-box">
        <div class="fb-title">↔ Zero Horizontal Scrollbars</div>
        <div class="fb-desc">Proportional viewport scaling ensures every page fits edge-to-edge perfectly.</div>
      </div>
      <div class="feature-box">
        <div class="fb-title">🔍 Decluttered Focused Nav Bar</div>
        <div class="fb-desc">Secondary desktop controls collapse automatically, keeping the omnibox roomy and clean.</div>
      </div>
    </div>

    <!-- Mobile View Window -->
    <div class="mobile-mockup">
      <div class="mob-header">
        <div style="display:flex; align-items:center; gap:8px;">
          <img src="file://{ICON_PATH}" style="width:16px; height:16px;" />
          <span style="font-size:11.5px; font-weight:650; color:#fff;">AirTab</span>
        </div>
        <div class="mob-badge">📱 Mobile 375px</div>
        <span style="font-size:12px; color:#94a3b8;">✕</span>
      </div>
      <div class="mob-nav">
        <span style="font-size:12px; color:#94a3b8;">‹ ›</span>
        <div class="mob-omni">google.com/search?q=linear+app</div>
      </div>
      <div class="mob-content">
        <div class="mob-search-card">
          <div class="msc-title">Linear: A better way to build</div>
          <div class="msc-sub">Linear streamlines issue tracking, sprint cycles, and product roadmaps with purpose-built speed.</div>
        </div>
        <div class="mob-search-card">
          <div class="msc-title">Mobile Features & Gestures</div>
          <div class="msc-sub">Full touch responsiveness, keyboard shortcuts, and offline-first issue creation.</div>
        </div>
        <div class="mob-search-card">
          <div class="msc-title">Integrations & API</div>
          <div class="msc-sub">Sync with GitHub, GitLab, Slack, and Figma seamlessly.</div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>'''

# ==============================================================================
# 5. SCREENSHOT 3: PICTURE-IN-PICTURE (1280 x 800)
# ==============================================================================
screenshot_3_html = f'''<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * {{ margin: 0; padding: 0; box-sizing: border-box; }}
  body {{
    width: 1280px;
    height: 800px;
    background: #0f1015;
    font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", sans-serif;
    color: #ffffff;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    -webkit-font-smoothing: antialiased;
  }}
  .pres-header {{
    height: 110px;
    background: #090a0e;
    border-bottom: 1px solid rgba(255, 255, 255, 0.10);
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 0 48px;
    position: relative;
    z-index: 10;
  }}
  .feat-tag {{
    font-size: 11.5px;
    font-weight: 700;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    color: #38bdf8;
    margin-bottom: 4px;
    display: flex;
    align-items: center;
    gap: 6px;
  }}
  .pres-title {{
    font-size: 26px;
    font-weight: 750;
    color: #ffffff;
    letter-spacing: -0.4px;
  }}
  .pres-sub {{
    font-size: 13.5px;
    color: #94a3b8;
    margin-top: 2px;
  }}
  .browser-canvas {{
    flex: 1;
    background: #14161f;
    position: relative;
    padding: 36px 64px;
    display: flex;
    justify-content: space-between;
  }}
  /* Code Editor Background Mockup */
  .code-editor {{
    width: 720px;
    height: 580px;
    background: #181922;
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 16px;
    padding: 24px 28px;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 13px;
    line-height: 1.65;
    color: #94a3b8;
    box-shadow: 0 20px 50px rgba(0,0,0,0.5);
  }}
  .code-k {{ color: #f43f5e; }}
  .code-f {{ color: #38bdf8; }}
  .code-s {{ color: #4ade80; }}
  .code-c {{ color: #64748b; }}

  /* Floating PiP Mini Player */
  .pip-window {{
    position: absolute;
    bottom: 40px;
    right: 64px;
    width: 440px;
    height: 270px;
    background: #000000;
    border: 1px solid rgba(255, 255, 255, 0.28);
    border-radius: 16px;
    box-shadow: 0 30px 80px rgba(0, 0, 0, 0.85), 0 0 30px rgba(0, 122, 255, 0.4);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    z-index: 50;
  }}
  .pip-bar {{
    height: 32px;
    background: rgba(22, 23, 29, 0.90);
    backdrop-filter: blur(20px);
    border-bottom: 1px solid rgba(255, 255, 255, 0.12);
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 12px;
    font-size: 11px;
    color: #e2e8f0;
    font-weight: 600;
  }}
  .pip-video-mock {{
    flex: 1;
    background: linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    position: relative;
  }}
  .play-btn {{
    width: 54px;
    height: 54px;
    background: rgba(0, 210, 255, 0.85);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 0 25px rgba(0, 210, 255, 0.6);
  }}
  .vid-title {{
    position: absolute;
    bottom: 12px;
    left: 14px;
    font-size: 12px;
    font-weight: 600;
    color: #ffffff;
    text-shadow: 0 2px 4px rgba(0,0,0,0.8);
  }}
</style>
</head>
<body>
  <div class="pres-header">
    <div class="feat-tag">📺 FEATURE 03 • FLOATING PICTURE-IN-PICTURE (PIP)</div>
    <div class="pres-title">Watch Video Tutorials While You Work & Code</div>
    <div class="pres-sub">1-Click PiP floating player (P) docks at screen corner, stays sticky on top while browsing or coding.</div>
  </div>

  <div class="browser-canvas">
    <div class="code-editor">
      <div style="display:flex; gap:6px; margin-bottom:16px;">
        <span style="width:10px; height:10px; background:#ff5f56; border-radius:50%;"></span>
        <span style="width:10px; height:10px; background:#ffbd2e; border-radius:50%;"></span>
        <span style="width:10px; height:10px; background:#27c93f; border-radius:50%;"></span>
      </div>
      <div><span class="code-k">import</span> React, {{ useState, useEffect }} <span class="code-k">from</span> <span class="code-s">'react'</span>;</div>
      <br>
      <div><span class="code-c">// Real-world in-browser multitasking</span></div>
      <div><span class="code-k">export function</span> <span class="code-f">App</span>() {{</div>
      <div>&nbsp;&nbsp;<span class="code-k">const</span> [state, setState] = <span class="code-f">useState</span>(<span class="code-s">'AirTab Multitask'</span>);</div>
      <div>&nbsp;&nbsp;</div>
      <div>&nbsp;&nbsp;<span class="code-f">useEffect</span>(() =&gt; {{</div>
      <div>&nbsp;&nbsp;&nbsp;&nbsp;console.<span class="code-f">log</span>(<span class="code-s">'Zero context-switching: Code while video plays in corner!'</span>);</div>
      <div>&nbsp;&nbsp;}}, []);</div>
      <div>&nbsp;&nbsp;</div>
      <div>&nbsp;&nbsp;<span class="code-k">return</span> &lt;<span class="code-f">div</span> className=<span class="code-s">"workspace"</span>&gt;{{state}}&lt;/<span class="code-f">div</span>&gt;;</div>
      <div>}}</div>
    </div>

    <!-- Floating PiP Video -->
    <div class="pip-window">
      <div class="pip-bar">
        <span>📺 YouTube Tutorial • React 19 Architecture</span>
        <span style="color:#38bdf8; cursor:pointer;">Exit PiP (P) ✕</span>
      </div>
      <div class="pip-video-mock">
        <div class="play-btn">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="#000">
            <polygon points="5 3 19 12 5 21 5 3"></polygon>
          </svg>
        </div>
        <div class="vid-title">Next.js & Server Components Deep Dive (4K)</div>
      </div>
    </div>
  </div>
</body>
</html>'''

# ==============================================================================
# 6. SCREENSHOT 4: DISTRACTION-FREE READER & ADBLOCK (1280 x 800)
# ==============================================================================
screenshot_4_html = f'''<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * {{ margin: 0; padding: 0; box-sizing: border-box; }}
  body {{
    width: 1280px;
    height: 800px;
    background: #0f1015;
    font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", sans-serif;
    color: #ffffff;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    -webkit-font-smoothing: antialiased;
  }}
  .pres-header {{
    height: 110px;
    background: #090a0e;
    border-bottom: 1px solid rgba(255, 255, 255, 0.10);
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 0 48px;
    position: relative;
    z-index: 10;
  }}
  .feat-tag {{
    font-size: 11.5px;
    font-weight: 700;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    color: #38bdf8;
    margin-bottom: 4px;
    display: flex;
    align-items: center;
    gap: 6px;
  }}
  .pres-title {{
    font-size: 26px;
    font-weight: 750;
    color: #ffffff;
    letter-spacing: -0.4px;
  }}
  .pres-sub {{
    font-size: 13.5px;
    color: #94a3b8;
    margin-top: 2px;
  }}
  .browser-canvas {{
    flex: 1;
    background: #181920;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
  }}
  .reader-card {{
    width: 680px;
    height: 590px;
    background: rgba(20, 21, 26, 0.94);
    backdrop-filter: blur(48px);
    border: 1px solid rgba(255, 255, 255, 0.22);
    border-radius: 20px;
    box-shadow: 0 35px 90px rgba(0, 0, 0, 0.8), 0 0 35px rgba(0, 122, 255, 0.25);
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }}
  .reader-head {{
    height: 44px;
    background: rgba(255, 255, 255, 0.04);
    border-bottom: 1px solid rgba(255, 255, 255, 0.10);
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 18px;
  }}
  .r-pill {{
    font-size: 11px;
    font-weight: 650;
    color: #38ef7d;
    background: rgba(56, 239, 125, 0.14);
    border: 1px solid rgba(56, 239, 125, 0.3);
    padding: 2px 8px;
    border-radius: 6px;
  }}
  .reader-body {{
    flex: 1;
    padding: 36px 48px;
    background: #141418;
    overflow: hidden;
  }}
  .article-badge {{
    font-size: 11px;
    font-weight: 700;
    color: #38bdf8;
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 8px;
  }}
  .art-h1 {{
    font-size: 26px;
    font-weight: 750;
    line-height: 1.25;
    color: #f8fafc;
    margin-bottom: 18px;
  }}
  .art-meta {{
    font-size: 12.5px;
    color: #64748b;
    margin-bottom: 24px;
    padding-bottom: 16px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  }}
  .art-p {{
    font-size: 15px;
    line-height: 1.7;
    color: #cbd5e1;
    margin-bottom: 16px;
  }}
</style>
</head>
<body>
  <div class="pres-header">
    <div class="feat-tag">📖 FEATURE 04 • DISTRACTION-FREE READER & AIRSHIELD</div>
    <div class="pres-title">Strip Intrusive Ads, Sidebars & Clutter in 1 Click</div>
    <div class="pres-sub">Built-in reader mode and offline declarative AdBlock shield for clean, focused typography.</div>
  </div>

  <div class="browser-canvas">
    <div class="reader-card">
      <div class="reader-head">
        <div style="display:flex; align-items:center; gap:8px;">
          <span style="font-size:14px;">📖</span>
          <span style="font-size:12.5px; font-weight:650; color:#fff;">AirTab Reader View</span>
        </div>
        <div style="display:flex; gap:8px;">
          <div class="r-pill">🛡️ 14 Ads Blocked</div>
          <div style="font-size:12px; color:#94a3b8;">✕</div>
        </div>
      </div>
      <div class="reader-body">
        <div class="article-badge">Clean Typography Mode</div>
        <div class="art-h1">The Architecture of Weightless Interfaces</div>
        <div class="art-meta">By Design Systems Engineering • 4 min read • Distraction-free view</div>
        <div class="art-p">
          Modern application interfaces are increasingly shifting from cluttered, multi-window desktop paradigms to focused, in-context overlays. By eliminating visual noise and context switches, users maintain continuous deep work.
        </div>
        <div class="art-p">
          AirTab removes third-party popups, tracking pixels, and video prerolls, providing pure readability with customized contrast.
        </div>
      </div>
    </div>
  </div>
</body>
</html>'''

# ==============================================================================
# 7. SCREENSHOT 5: SIDE-DOCK PILL & GESTURES (1280 x 800)
# ==============================================================================
screenshot_5_html = f'''<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * {{ margin: 0; padding: 0; box-sizing: border-box; }}
  body {{
    width: 1280px;
    height: 800px;
    background: #0f1015;
    font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", sans-serif;
    color: #ffffff;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    -webkit-font-smoothing: antialiased;
  }}
  .pres-header {{
    height: 110px;
    background: #090a0e;
    border-bottom: 1px solid rgba(255, 255, 255, 0.10);
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 0 48px;
    position: relative;
    z-index: 10;
  }}
  .feat-tag {{
    font-size: 11.5px;
    font-weight: 700;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    color: #38bdf8;
    margin-bottom: 4px;
    display: flex;
    align-items: center;
    gap: 6px;
  }}
  .pres-title {{
    font-size: 26px;
    font-weight: 750;
    color: #ffffff;
    letter-spacing: -0.4px;
  }}
  .pres-sub {{
    font-size: 13.5px;
    color: #94a3b8;
    margin-top: 2px;
  }}
  .browser-canvas {{
    flex: 1;
    background: #181920;
    position: relative;
    padding: 36px 64px;
  }}
  .page-content {{
    max-width: 800px;
    background: #1e1f28;
    border: 1px solid rgba(255, 255, 255, 0.10);
    border-radius: 14px;
    padding: 32px 36px;
  }}
  .page-h {{ font-size: 24px; font-weight: 700; color: #fff; margin-bottom: 14px; }}
  .page-p {{ font-size: 15px; line-height: 1.6; color: #94a3b8; margin-bottom: 14px; }}
  
  /* Side Pill Docked to Right Edge */
  .side-pill {{
    position: absolute;
    top: 240px;
    right: 28px;
    display: inline-flex;
    align-items: center;
    gap: 10px;
    height: 44px;
    padding: 0 16px 0 18px;
    background: rgba(18, 18, 24, 0.75);
    backdrop-filter: blur(32px) saturate(200%);
    border: 1px solid rgba(255, 255, 255, 0.32);
    border-radius: 22px;
    box-shadow: 0 14px 44px rgba(0, 0, 0, 0.6), 0 0 25px rgba(0, 240, 255, 0.35);
    color: #ffffff;
    font-weight: 600;
    font-size: 14px;
    z-index: 100;
  }}
  .gesture-hud {{
    position: absolute;
    bottom: 40px;
    left: 64px;
    background: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.16);
    border-radius: 14px;
    padding: 16px 24px;
    display: flex;
    align-items: center;
    gap: 16px;
    font-size: 13.5px;
    color: #e2e8f0;
  }}
</style>
</head>
<body>
  <div class="pres-header">
    <div class="feat-tag">🗂️ FEATURE 05 • FLOATING SIDE-DOCK & TRACKPAD GESTURES</div>
    <div class="pres-title">Outside Click Tucks into Edge Pill • 2-Finger Swipe to Navigate</div>
    <div class="pres-sub">Never lose your research. Single-click on the edge pill brings AirTab back with all tabs intact.</div>
  </div>

  <div class="browser-canvas">
    <div class="page-content">
      <div class="page-h">Research & Multitask Seamlessly</div>
      <div class="page-p">
        When AirTab is open and you click anywhere outside onto the main page, it doesn't vanish—it smoothly morphs into an elegant floating edge pill on the right side of the screen.
      </div>
      <div class="page-p">
        Use two fingers on your macOS trackpad to swipe right for Back and left for Forward inside any tab!
      </div>
    </div>

    <!-- Docked Side Pill -->
    <div class="side-pill">
      <img src="file://{ICON_PATH}" style="width:20px; height:20px;" />
      <span>AirTab</span>
      <span style="font-size:12px; opacity:0.6; margin-left:4px;">✕</span>
    </div>

    <div class="gesture-hud">
      <span style="font-size:22px;">👆</span>
      <div>
        <strong>macOS Trackpad Two-Finger Swipe</strong><br>
        <span style="color:#94a3b8; font-size:12.5px;">Swipe right for Back, swipe left for Forward inside any AirTab preview.</span>
      </div>
    </div>
  </div>
</body>
</html>'''

# Render all
render_html_to_png(small_promo_html, os.path.join(BASE_DIR, 'small_promo_tile_440x280.png'), 440, 280)
render_html_to_png(marquee_promo_html, os.path.join(BASE_DIR, 'marquee_promo_tile_1400x560.png'), 1400, 560)
render_html_to_png(screenshot_1_html, os.path.join(BASE_DIR, '1_instant_look_up_1280x800.png'), 1280, 800)
render_html_to_png(screenshot_2_html, os.path.join(BASE_DIR, '2_adaptive_mobile_view_1280x800.png'), 1280, 800)
render_html_to_png(screenshot_3_html, os.path.join(BASE_DIR, '3_pip_video_multitask_1280x800.png'), 1280, 800)
render_html_to_png(screenshot_4_html, os.path.join(BASE_DIR, '4_reader_mode_adblock_1280x800.png'), 1280, 800)
render_html_to_png(screenshot_5_html, os.path.join(BASE_DIR, '5_side_dock_gestures_1280x800.png'), 1280, 800)

print("All 7 assets generated successfully!")
