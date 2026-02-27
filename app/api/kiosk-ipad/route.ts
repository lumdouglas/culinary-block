import { createAdminClient } from '@/utils/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const COOKIE_NAME = 'kiosk_auth';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365 * 10; // 10 years

function blockedPage(message: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Access Restricted</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif;
      background: #f1f5f9;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      text-align: center;
      padding: 32px;
    }
    .card {
      background: white;
      border-radius: 24px;
      padding: 48px 40px;
      max-width: 420px;
      box-shadow: 0 4px 24px rgba(0,0,0,0.08);
    }
    .icon { font-size: 64px; margin-bottom: 16px; }
    h1 { font-size: 24px; font-weight: 800; color: #0f172a; margin-bottom: 12px; }
    p { font-size: 16px; color: #64748b; line-height: 1.6; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">🔒</div>
    <h1>Device Not Authorised</h1>
    <p>${message}</p>
  </div>
</body>
</html>`;
}

export async function GET(request: NextRequest) {
  const secret = process.env.KIOSK_SECRET;

  // Fail secure — if the env var is not set, block all access
  if (!secret) {
    return new NextResponse(
      blockedPage('KIOSK_SECRET is not configured. Contact your administrator.'),
      { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    );
  }

  // ── One-time device setup ──────────────────────────────────────────
  // Admin visits /api/kiosk-ipad?setup=<KIOSK_SECRET> once on the iPad.
  // This sets a long-lived cookie and redirects to the clean kiosk URL.
  const setupParam = request.nextUrl.searchParams.get('setup');
  if (setupParam !== null) {
    if (setupParam === secret) {
      const response = NextResponse.redirect(new URL('/api/kiosk-ipad', request.url));
      response.cookies.set(COOKIE_NAME, secret, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: COOKIE_MAX_AGE,
      });
      return response;
    }
    // Wrong token — show 403 without hinting what the correct value is
    return new NextResponse(
      blockedPage('Invalid setup token. Please check the URL and try again.'),
      { status: 403, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    );
  }

  // ── Cookie check ──────────────────────────────────────────────────
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (token !== secret) {
    return new NextResponse(
      blockedPage('This device is not authorised to use the kiosk. Ask an administrator to set it up.'),
      { status: 403, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    );
  }

  // ── Authorised — serve kiosk ──────────────────────────────────────
  const supabase = createAdminClient();
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, company_name')
    .eq('role', 'tenant')
    .eq('is_active', true);

  const tenantButtons = (profiles || [])
    .map((p) => `<button class="tenant-btn" onclick="selectTenant('${p.id}', '${p.company_name.replace(/'/g, "\\'")}')">${p.company_name}</button>`)
    .join('\n          ');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="refresh" content="3600">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="default">
  <title>Culinary Block - Kiosk</title>
  <style>
    * { margin: 0; padding: 0; -webkit-box-sizing: border-box; box-sizing: border-box; }
    html, body {
      height: 100%;
      overflow: hidden;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif;
      background-color: #f1f5f9;
      color: #1e293b;
      -webkit-text-size-adjust: 100%;
    }

    /* Screens */
    .screen {
      display: none;
      height: 100vh;
      height: -webkit-fill-available;
      padding: 32px;
    }
    .screen.active {
      display: -webkit-box;
      display: -webkit-flex;
      display: flex;
      -webkit-box-orient: vertical;
      -webkit-flex-direction: column;
      flex-direction: column;
      -webkit-box-align: center;
      -webkit-align-items: center;
      align-items: center;
      padding-top: 60px;
    }

    /* ─── SCREEN 1: Tenant Select ─── */
    .brand-title {
      font-size: 42px;
      font-weight: 800;
      color: #0d9488;
      letter-spacing: 2px;
    }
    .brand-subtitle {
      font-size: 18px;
      color: #64748b;
      letter-spacing: 3px;
      text-transform: uppercase;
      margin-top: 6px;
    }
    .section-title {
      font-size: 28px;
      font-weight: 700;
      color: #1e293b;
      margin: 40px 0 24px;
      text-align: center;
      flex-shrink: 0;
    }
    .tenant-grid-container {
      width: 100%;
      height: 100%;
      overflow-y: auto;
      -webkit-overflow-scrolling: touch;
      display: flex;
      justify-content: center;
      padding-bottom: 40px;
    }
    .tenant-grid {
      display: -webkit-box;
      display: -webkit-flex;
      display: flex;
      -webkit-flex-wrap: wrap;
      flex-wrap: wrap;
      max-width: 700px;
      width: 100%;
      -webkit-box-pack: center;
      -webkit-justify-content: center;
      justify-content: center;
      margin: -10px;
      align-content: flex-start;
    }
    .tenant-btn {
      -webkit-box-flex: 0;
      -webkit-flex: 0 0 calc(50% - 20px);
      flex: 0 0 calc(50% - 20px);
      margin: 10px;
      padding: 36px 20px;
      background: #fff;
      border: 2px solid #e2e8f0;
      border-radius: 20px;
      cursor: pointer;
      font-size: 24px;
      font-weight: 700;
      color: #334155;
      text-align: center;
      -webkit-appearance: none;
      outline: none;
      -webkit-transition: all 0.15s;
      transition: all 0.15s;
    }
    .tenant-btn:active {
      background: #ecfdf5;
      border-color: #059669;
      color: #047857;
    }

    /* ─── SCREEN 2: Kiosk PIN ─── */
    .kiosk-container {
      text-align: center;
      width: 100%;
      max-width: 500px;
    }
    .company-name {
      font-size: 36px;
      font-weight: 800;
      color: #0f172a;
    }
    .status-text {
      font-size: 20px;
      color: #64748b;
      margin-top: 6px;
    }
    .active-badge {
      display: -webkit-inline-box;
      display: -webkit-inline-flex;
      display: inline-flex;
      -webkit-box-align: center;
      -webkit-align-items: center;
      align-items: center;
      margin-top: 16px;
      background: #ffedd5;
      color: #c2410c;
      padding: 12px 24px;
      border-radius: 28px;
      font-size: 20px;
      font-family: monospace;
    }

    /* PIN display */
    .pin-display {
      margin-top: 28px;
      display: -webkit-box;
      display: -webkit-flex;
      display: flex;
      -webkit-box-pack: center;
      -webkit-justify-content: center;
      justify-content: center;
    }
    .pin-dot {
      margin: 0 8px;
      width: 56px;
      height: 56px;
      border-radius: 14px;
      border: 3px solid #cbd5e1;
      background: #fff;
      display: -webkit-box;
      display: -webkit-flex;
      display: flex;
      -webkit-box-align: center;
      -webkit-align-items: center;
      align-items: center;
      -webkit-box-pack: center;
      -webkit-justify-content: center;
      justify-content: center;
      font-size: 28px;
      font-weight: 800;
      color: #0f172a;
    }
    .pin-dot.filled {
      border-color: #0d9488;
      background: #f0fdfa;
    }
    .pin-dot.error {
      border-color: #ef4444;
      background: #fef2f2;
    }
    .error-msg {
      font-size: 18px;
      color: #ef4444;
      margin-top: 12px;
      font-weight: 600;
    }

    /* Numpad */
    .numpad {
      margin-top: 24px;
      display: -webkit-box;
      display: -webkit-flex;
      display: flex;
      -webkit-flex-wrap: wrap;
      flex-wrap: wrap;
      -webkit-box-pack: center;
      -webkit-justify-content: center;
      justify-content: center;
      max-width: 352px;
      margin-left: auto;
      margin-right: auto;
    }
    .num-btn {
      -webkit-box-flex: 0;
      -webkit-flex: 0 0 calc(33.333% - 12px);
      flex: 0 0 calc(33.333% - 12px);
      margin: 6px;
      height: 72px;
      border-radius: 16px;
      border: 2px solid #e2e8f0;
      background: #fff;
      font-size: 32px;
      font-weight: 700;
      color: #1e293b;
      cursor: pointer;
      -webkit-appearance: none;
      outline: none;
      -webkit-transition: background 0.1s;
      transition: background 0.1s;
    }
    .num-btn:active {
      background: #e2e8f0;
    }
    .num-btn.clear {
      font-size: 18px;
      font-weight: 600;
      color: #94a3b8;
      border-color: #f1f5f9;
      background: #f1f5f9;
    }
    .num-btn.clear:active {
      background: #e2e8f0;
    }
    .num-btn.backspace {
      font-size: 24px;
      color: #64748b;
      border-color: #f1f5f9;
      background: #f1f5f9;
    }
    .num-btn.backspace:active {
      background: #e2e8f0;
    }

    /* Action button */
    .action-btn {
      display: -webkit-box;
      display: -webkit-flex;
      display: flex;
      -webkit-box-align: center;
      -webkit-align-items: center;
      align-items: center;
      -webkit-box-pack: center;
      -webkit-justify-content: center;
      justify-content: center;
      width: 100%;
      max-width: 340px;
      padding: 22px 0;
      margin: 20px auto 0;
      font-size: 28px;
      font-weight: 800;
      color: #fff;
      border: none;
      border-radius: 18px;
      cursor: pointer;
      -webkit-appearance: none;
      outline: none;
      letter-spacing: 1px;
      text-align: center;
    }
    .action-btn:disabled {
      background: #cbd5e1 !important;
      cursor: default;
    }
    .btn-clock-in { background: #059669; }
    .btn-clock-in:active:not(:disabled) { background: #047857; }
    .btn-clock-out { background: #dc2626; }
    .btn-clock-out:active:not(:disabled) { background: #b91c1c; }

    .back-btn {
      margin-top: 20px;
      background: none;
      border: none;
      color: #94a3b8;
      font-size: 18px;
      cursor: pointer;
      -webkit-appearance: none;
      padding: 12px;
    }

    /* ─── SCREEN 3 & 4: Success / Summary ─── */
    .icon-circle {
      width: 120px;
      height: 120px;
      border-radius: 50%;
      display: -webkit-box;
      display: -webkit-flex;
      display: flex;
      -webkit-box-align: center;
      -webkit-align-items: center;
      align-items: center;
      -webkit-box-pack: center;
      -webkit-justify-content: center;
      justify-content: center;
      margin-bottom: 28px;
    }
    .icon-circle.green { background: #d1fae5; }
    .icon-circle.blue { background: #dbeafe; }
    .success-text { font-size: 28px; font-weight: 700; margin-top: 10px; }
    .success-text.green { color: #059669; }
    .success-text.blue { color: #2563eb; }
    .detail-text { font-size: 22px; color: #64748b; margin-top: 6px; }
    .countdown-text { font-size: 18px; color: #94a3b8; margin-top: 36px; }
    .duration-box {
      margin-top: 24px;
      background: #f1f5f9;
      border-radius: 16px;
      padding: 20px 40px;
      text-align: center;
    }
    .duration-label { font-size: 18px; color: #64748b; }
    .duration-value { font-size: 36px; font-weight: 800; color: #0f172a; margin-top: 6px; }

    .empty-state {
      text-align: center;
      padding: 60px 20px;
      color: #94a3b8;
      border: 2px dashed #cbd5e1;
      border-radius: 16px;
      max-width: 700px;
      width: 100%;
      font-size: 22px;
    }

    @-webkit-keyframes shake {
      0%, 100% { -webkit-transform: translateX(0); transform: translateX(0); }
      10%, 30%, 50%, 70%, 90% { -webkit-transform: translateX(-10px); transform: translateX(-10px); }
      20%, 40%, 60%, 80% { -webkit-transform: translateX(10px); transform: translateX(10px); }
    }
    @keyframes shake {
      0%, 100% { -webkit-transform: translateX(0); transform: translateX(0); }
      10%, 30%, 50%, 70%, 90% { -webkit-transform: translateX(-10px); transform: translateX(-10px); }
      20%, 40%, 60%, 80% { -webkit-transform: translateX(10px); transform: translateX(10px); }
    }
    .shake {
      -webkit-animation: shake 0.5s ease-in-out;
      animation: shake 0.5s ease-in-out;
    }
  </style>
</head>
<body>

  <!-- SCREEN 1: Tenant Selection -->
  <div id="screen-select" class="screen active">
    <div style="text-align:center; flex-shrink: 0;">
      <div class="brand-title">CULINARY BLOCK</div>
      <div class="brand-subtitle">Timesheet Kiosk</div>
    </div>
    <h2 class="section-title">Select Your Company</h2>
    <div class="tenant-grid-container">
      <div class="tenant-grid">
        ${tenantButtons || '<div class="empty-state">No active tenants found.</div>'}
      </div>
    </div>
  </div>

  <!-- SCREEN 2: PIN Entry / Clock In/Out -->
  <div id="screen-kiosk" class="screen">
    <div class="kiosk-container">
      <div class="company-name" id="kiosk-company"></div>
      <div class="status-text" id="kiosk-status"></div>

      <div id="active-badge" class="active-badge" style="display:none">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:8px">
          <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
        </svg>
        <span id="active-time"></span>
      </div>

      <!-- PIN dots display -->
      <div class="pin-display" id="pin-display">
        <div class="pin-dot" id="dot-0"></div>
        <div class="pin-dot" id="dot-1"></div>
        <div class="pin-dot" id="dot-2"></div>
        <div class="pin-dot" id="dot-3"></div>
      </div>
      <div id="error-msg" class="error-msg" style="display:none"></div>

      <!-- Hidden input to store PIN value -->
      <input type="hidden" id="pin-value" value="">

      <!-- Numpad -->
      <div class="numpad">
        <button class="num-btn" onclick="pressNum('1')">1</button>
        <button class="num-btn" onclick="pressNum('2')">2</button>
        <button class="num-btn" onclick="pressNum('3')">3</button>
        <button class="num-btn" onclick="pressNum('4')">4</button>
        <button class="num-btn" onclick="pressNum('5')">5</button>
        <button class="num-btn" onclick="pressNum('6')">6</button>
        <button class="num-btn" onclick="pressNum('7')">7</button>
        <button class="num-btn" onclick="pressNum('8')">8</button>
        <button class="num-btn" onclick="pressNum('9')">9</button>
        <button class="num-btn clear" onclick="pressClear()">CLEAR</button>
        <button class="num-btn" onclick="pressNum('0')">0</button>
        <button class="num-btn backspace" onclick="pressBackspace()">&#9003;</button>
      </div>

      <button id="action-btn" class="action-btn" disabled onclick="handleAction()">
        <span id="action-label"></span>
      </button>

      <button class="back-btn" onclick="goBack()">&#8592; Back to company selection</button>
    </div>
  </div>

  <!-- SCREEN 3: Success (Clocked In) -->
  <div id="screen-clocked-in" class="screen">
    <div class="icon-circle green">
      <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
      </svg>
    </div>
    <div class="company-name" id="success-company"></div>
    <div class="success-text green">Shift Started!</div>
    <div class="detail-text" id="success-time"></div>
    <div class="countdown-text" id="countdown-in"></div>
  </div>

  <!-- SCREEN 4: Summary (Clocked Out) -->
  <div id="screen-clocked-out" class="screen">
    <div class="icon-circle blue">
      <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
      </svg>
    </div>
    <div class="company-name" id="summary-company"></div>
    <div class="success-text blue">Shift Completed!</div>
    <div class="duration-box">
      <div class="duration-label">Session Duration</div>
      <div class="duration-value" id="summary-duration"></div>
    </div>
    <div class="countdown-text" id="countdown-out"></div>
  </div>

  <script>
    var state = {
      tenantId: '',
      tenantName: '',
      activeSession: null,
      processing: false,
      pin: ''
    };

    var countdownTimer = null;

    // ─── XHR helpers (Safari 9 has no fetch) ───

    function httpGet(url, callback) {
      var xhr = new XMLHttpRequest();
      xhr.open('GET', url, true);
      xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
          try {
            var data = JSON.parse(xhr.responseText);
            callback(xhr.status >= 400, data);
          } catch(e) {
            callback(true, null);
          }
        }
      };
      xhr.send();
    }

    function httpPost(url, body, callback) {
      var xhr = new XMLHttpRequest();
      xhr.open('POST', url, true);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
          try {
            var data = JSON.parse(xhr.responseText);
            callback(xhr.status >= 400, data);
          } catch(e) {
            callback(true, null);
          }
        }
      };
      xhr.send(JSON.stringify(body));
    }

    function formatTime(date) {
      var h = date.getHours();
      var m = date.getMinutes();
      var ampm = h >= 12 ? 'PM' : 'AM';
      h = h % 12;
      if (h === 0) h = 12;
      return h + ':' + (m < 10 ? '0' : '') + m + ' ' + ampm;
    }

    function showScreen(id) {
      var screens = document.querySelectorAll('.screen');
      for (var i = 0; i < screens.length; i++) {
        screens[i].className = 'screen';
      }
      document.getElementById('screen-' + id).className = 'screen active';
    }

    // ─── Numpad functions ───

    function pressNum(digit) {
      if (state.pin.length >= 4) return;
      state.pin = state.pin + digit;
      updatePinDots();
      clearError();
      updateButtonState();
    }

    function pressBackspace() {
      if (state.pin.length === 0) return;
      state.pin = state.pin.slice(0, -1);
      updatePinDots();
      clearError();
      updateButtonState();
    }

    function pressClear() {
      state.pin = '';
      updatePinDots();
      clearError();
      updateButtonState();
    }

    function updatePinDots() {
      for (var i = 0; i < 4; i++) {
        var dot = document.getElementById('dot-' + i);
        if (i < state.pin.length) {
          dot.textContent = '\\u2022';
          dot.className = 'pin-dot filled';
        } else {
          dot.textContent = '';
          dot.className = 'pin-dot';
        }
      }
    }

    function clearError() {
      document.getElementById('error-msg').style.display = 'none';
      for (var i = 0; i < 4; i++) {
        var dot = document.getElementById('dot-' + i);
        if (dot.className.indexOf('error') !== -1) {
          dot.className = i < state.pin.length ? 'pin-dot filled' : 'pin-dot';
        }
      }
    }

    function updateButtonState() {
      document.getElementById('action-btn').disabled = state.processing || state.pin.length !== 4;
    }

    // ─── Screen transitions ───

    function selectTenant(id, name) {
      state.tenantId = id;
      state.tenantName = name;
      state.pin = '';
      updatePinDots();

      document.getElementById('kiosk-company').textContent = name;
      document.getElementById('error-msg').style.display = 'none';

      showScreen('kiosk');
      document.getElementById('kiosk-status').textContent = 'Loading...';
      document.getElementById('action-btn').disabled = true;
      document.getElementById('active-badge').style.display = 'none';

      httpGet('/api/kiosk/active-session?userId=' + encodeURIComponent(id), function(err, data) {
        if (err || !data) {
          state.activeSession = null;
        } else {
          state.activeSession = data.session || null;
        }
        updateKioskUI();
      });
    }

    function updateKioskUI() {
      var actionBtn = document.getElementById('action-btn');
      var statusEl = document.getElementById('kiosk-status');
      var badgeEl = document.getElementById('active-badge');

      if (state.activeSession) {
        statusEl.textContent = 'Currently Working';
        badgeEl.style.display = '';
        var clockInTime = new Date(state.activeSession.clock_in);
        document.getElementById('active-time').textContent = 'Since ' + formatTime(clockInTime);
        actionBtn.className = 'action-btn btn-clock-out';
        document.getElementById('action-label').textContent = 'CLOCK OUT';
      } else {
        statusEl.textContent = 'Ready to start shift';
        badgeEl.style.display = 'none';
        actionBtn.className = 'action-btn btn-clock-in';
        document.getElementById('action-label').textContent = 'CLOCK IN';
      }

      updateButtonState();
    }

    // ─── Error handling ───

    function triggerError(msg) {
      var display = document.getElementById('pin-display');
      var errorEl = document.getElementById('error-msg');

      for (var i = 0; i < 4; i++) {
        document.getElementById('dot-' + i).className = 'pin-dot error';
      }
      errorEl.textContent = msg;
      errorEl.style.display = 'block';
      state.pin = '';

      display.className = 'pin-display shake';
      setTimeout(function() {
        display.className = 'pin-display';
        updatePinDots();
      }, 600);
      updateButtonState();
    }

    // ─── Actions ───

    function handleAction() {
      if (state.processing || state.pin.length !== 4) return;

      state.processing = true;
      document.getElementById('action-btn').disabled = true;
      document.getElementById('action-label').textContent = 'Processing...';

      if (state.activeSession) {
        clockOut(state.pin);
      } else {
        clockIn(state.pin);
      }
    }

    function clockIn(pin) {
      httpPost('/api/kiosk/clock-in', { userId: state.tenantId, pin: pin }, function(err, data) {
        state.processing = false;
        if (err) {
          triggerError((data && data.error) || 'Invalid PIN');
          updateKioskUI();
        } else {
          var now = new Date();
          document.getElementById('success-company').textContent = state.tenantName;
          document.getElementById('success-time').textContent = 'Clocked in at ' + formatTime(now);
          showScreen('clocked-in');
          startCountdown('countdown-in');
        }
      });
    }

    function clockOut(pin) {
      httpPost('/api/kiosk/clock-out', { sessionId: state.activeSession.id, userId: state.tenantId, pin: pin }, function(err, data) {
        state.processing = false;
        if (err) {
          triggerError((data && data.error) || 'Invalid PIN');
          updateKioskUI();
        } else {
          var clockInTime = new Date(state.activeSession.clock_in).getTime();
          var duration = Date.now() - clockInTime;
          document.getElementById('summary-company').textContent = state.tenantName;
          document.getElementById('summary-duration').textContent = formatDuration(duration);
          showScreen('clocked-out');
          startCountdown('countdown-out');
        }
      });
    }

    function formatDuration(ms) {
      var totalMinutes = Math.floor(ms / 60000);
      var hours = Math.floor(totalMinutes / 60);
      var minutes = totalMinutes % 60;
      if (hours === 0) return minutes + ' min';
      return hours + 'h ' + minutes + 'min';
    }

    function startCountdown(elementId) {
      var seconds = 10;
      var el = document.getElementById(elementId);
      el.textContent = 'Returning in ' + seconds + 's...';

      if (countdownTimer) clearInterval(countdownTimer);
      countdownTimer = setInterval(function() {
        seconds--;
        if (seconds <= 0) {
          clearInterval(countdownTimer);
          goBack();
        } else {
          el.textContent = 'Returning in ' + seconds + 's...';
        }
      }, 1000);
    }

    function goBack() {
      if (countdownTimer) clearInterval(countdownTimer);
      state.tenantId = '';
      state.tenantName = '';
      state.activeSession = null;
      state.processing = false;
      state.pin = '';
      showScreen('select');
    }
  </script>
</body>
</html>`;

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}
