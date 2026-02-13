import { createAdminClient } from '@/utils/supabase/admin';
import { NextResponse } from 'next/server';

export async function GET() {
    // Fetch tenant list from Supabase
    const supabase = createAdminClient();
    const { data: profiles } = await supabase
        .from('profiles')
        .select('id, company_name')
        .eq('role', 'tenant');

    const tenantButtons = (profiles || [])
        .map((p) => `<button class="tenant-btn" onclick="selectTenant('${p.id}', '${p.company_name.replace(/'/g, "\\'")}')">${p.company_name}</button>`)
        .join('\n          ');

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="default">
  <title>Culinary Block - Kiosk</title>
  <style>
    * { margin: 0; padding: 0; -webkit-box-sizing: border-box; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif;
      background-color: #f8fafc;
      color: #1e293b;
      -webkit-text-size-adjust: 100%;
      min-height: 100vh;
    }
    .screen {
      display: none;
      min-height: 100vh;
      padding: 24px;
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
      -webkit-box-pack: center;
      -webkit-justify-content: center;
      justify-content: center;
    }
    .brand-title {
      font-size: 28px;
      font-weight: 800;
      color: #0d9488;
      letter-spacing: 1px;
    }
    .brand-subtitle {
      font-size: 14px;
      color: #64748b;
      letter-spacing: 2px;
      text-transform: uppercase;
      margin-top: 4px;
    }
    .section-title {
      font-size: 20px;
      font-weight: 700;
      color: #1e293b;
      margin: 32px 0 20px;
      text-align: center;
    }
    .tenant-grid {
      display: -webkit-box;
      display: -webkit-flex;
      display: flex;
      -webkit-flex-wrap: wrap;
      flex-wrap: wrap;
      gap: 16px;
      max-width: 600px;
      width: 100%;
      -webkit-box-pack: center;
      -webkit-justify-content: center;
      justify-content: center;
    }
    .tenant-btn {
      -webkit-box-flex: 0;
      -webkit-flex: 0 0 calc(50% - 8px);
      flex: 0 0 calc(50% - 8px);
      padding: 28px 16px;
      background: #fff;
      border: 2px solid #e2e8f0;
      border-radius: 16px;
      cursor: pointer;
      font-size: 18px;
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
    .company-name {
      font-size: 28px;
      font-weight: 700;
      color: #0f172a;
    }
    .status-text {
      font-size: 16px;
      color: #64748b;
      margin-top: 4px;
    }
    .active-badge {
      display: -webkit-inline-box;
      display: -webkit-inline-flex;
      display: inline-flex;
      -webkit-box-align: center;
      -webkit-align-items: center;
      align-items: center;
      margin-top: 20px;
      background: #ffedd5;
      color: #c2410c;
      padding: 10px 20px;
      border-radius: 24px;
      font-size: 18px;
      font-family: monospace;
    }
    .pin-section {
      margin-top: 32px;
      width: 100%;
      max-width: 320px;
      text-align: center;
    }
    .pin-label {
      display: block;
      font-size: 14px;
      font-weight: 500;
      color: #64748b;
      margin-bottom: 8px;
    }
    .pin-input {
      width: 100%;
      text-align: center;
      font-size: 32px;
      letter-spacing: 0.5em;
      font-family: monospace;
      padding: 16px 0;
      border: 2px solid #cbd5e1;
      border-radius: 12px;
      outline: none;
      background: #fff;
      color: #0f172a;
      -webkit-appearance: none;
    }
    .pin-input:focus {
      border-color: #0d9488;
      -webkit-box-shadow: 0 0 0 3px rgba(13, 148, 136, 0.15);
      box-shadow: 0 0 0 3px rgba(13, 148, 136, 0.15);
    }
    .pin-input.error {
      border-color: #ef4444;
      background: #fef2f2;
    }
    .error-msg {
      font-size: 14px;
      color: #ef4444;
      margin-top: 8px;
    }
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
      max-width: 320px;
      padding: 20px 0;
      margin-top: 24px;
      font-size: 24px;
      font-weight: 700;
      color: #fff;
      border: none;
      border-radius: 16px;
      cursor: pointer;
      -webkit-appearance: none;
      outline: none;
    }
    .action-btn:disabled {
      background: #cbd5e1 !important;
      cursor: default;
    }
    .btn-clock-in { background: #059669; }
    .btn-clock-out { background: #dc2626; }
    .back-btn {
      margin-top: 24px;
      background: none;
      border: none;
      color: #94a3b8;
      font-size: 14px;
      cursor: pointer;
      -webkit-appearance: none;
      padding: 8px;
    }
    .icon-circle {
      width: 100px;
      height: 100px;
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
      margin-bottom: 24px;
    }
    .icon-circle.green { background: #d1fae5; }
    .icon-circle.blue { background: #dbeafe; }
    .success-text { font-size: 20px; font-weight: 600; margin-top: 8px; }
    .success-text.green { color: #059669; }
    .success-text.blue { color: #2563eb; }
    .detail-text { font-size: 16px; color: #64748b; margin-top: 4px; }
    .countdown-text { font-size: 14px; color: #94a3b8; margin-top: 32px; }
    .duration-box {
      margin-top: 20px;
      background: #f1f5f9;
      border-radius: 12px;
      padding: 16px 32px;
      text-align: center;
    }
    .duration-label { font-size: 14px; color: #64748b; }
    .duration-value { font-size: 28px; font-weight: 700; color: #0f172a; margin-top: 4px; }
    .empty-state {
      text-align: center;
      padding: 60px 20px;
      color: #94a3b8;
      border: 2px dashed #cbd5e1;
      border-radius: 16px;
      max-width: 600px;
      width: 100%;
    }
    @-webkit-keyframes shake {
      0%, 100% { -webkit-transform: translateX(0); transform: translateX(0); }
      10%, 30%, 50%, 70%, 90% { -webkit-transform: translateX(-8px); transform: translateX(-8px); }
      20%, 40%, 60%, 80% { -webkit-transform: translateX(8px); transform: translateX(8px); }
    }
    @keyframes shake {
      0%, 100% { -webkit-transform: translateX(0); transform: translateX(0); }
      10%, 30%, 50%, 70%, 90% { -webkit-transform: translateX(-8px); transform: translateX(-8px); }
      20%, 40%, 60%, 80% { -webkit-transform: translateX(8px); transform: translateX(8px); }
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
    <div style="text-align:center">
      <div class="brand-title">CULINARY BLOCK</div>
      <div class="brand-subtitle">Timesheet Kiosk</div>
    </div>
    <h2 class="section-title">Select Your Company</h2>
    <div class="tenant-grid">
      ${tenantButtons || '<div class="empty-state">No active tenants found.</div>'}
    </div>
  </div>

  <!-- SCREEN 2: PIN Entry / Clock In/Out -->
  <div id="screen-kiosk" class="screen">
    <div style="text-align:center; width:100%; max-width:400px">
      <div class="company-name" id="kiosk-company"></div>
      <div class="status-text" id="kiosk-status"></div>

      <div id="active-badge" class="active-badge" style="display:none">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:8px">
          <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
        </svg>
        <span id="active-time"></span>
      </div>

      <div class="pin-section">
        <label class="pin-label">Enter your 4-digit PIN</label>
        <div id="pin-wrapper">
          <input id="pin-input" class="pin-input" type="tel" inputmode="numeric" pattern="[0-9]*" maxlength="4" placeholder="••••" autocomplete="off" autofocus>
        </div>
        <div id="error-msg" class="error-msg" style="display:none"></div>
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
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
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
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
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
      processing: false
    };

    var countdownTimer = null;

    function showScreen(id) {
      var screens = document.querySelectorAll('.screen');
      for (var i = 0; i < screens.length; i++) {
        screens[i].className = 'screen';
      }
      document.getElementById('screen-' + id).className = 'screen active';
    }

    function selectTenant(id, name) {
      state.tenantId = id;
      state.tenantName = name;
      document.getElementById('kiosk-company').textContent = name;
      document.getElementById('pin-input').value = '';
      document.getElementById('error-msg').style.display = 'none';
      document.getElementById('pin-input').className = 'pin-input';

      showScreen('kiosk');
      document.getElementById('kiosk-status').textContent = 'Loading...';
      document.getElementById('action-btn').disabled = true;
      document.getElementById('active-badge').style.display = 'none';

      // Check for active session
      fetch('/api/kiosk/active-session?userId=' + encodeURIComponent(id))
        .then(function(res) { return res.json(); })
        .then(function(data) {
          state.activeSession = data.session || null;
          updateKioskUI();
          setTimeout(function() {
            document.getElementById('pin-input').focus();
          }, 100);
        })
        .catch(function() {
          state.activeSession = null;
          updateKioskUI();
        });
    }

    function updateKioskUI() {
      var pinInput = document.getElementById('pin-input');
      var actionBtn = document.getElementById('action-btn');
      var statusEl = document.getElementById('kiosk-status');
      var badgeEl = document.getElementById('active-badge');

      if (state.activeSession) {
        statusEl.textContent = 'Currently Working';
        badgeEl.style.display = '';
        var clockInTime = new Date(state.activeSession.clock_in);
        document.getElementById('active-time').textContent = 'Active since: ' + clockInTime.toLocaleTimeString();
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

    function updateButtonState() {
      var pin = document.getElementById('pin-input').value;
      document.getElementById('action-btn').disabled = state.processing || pin.length !== 4;
    }

    // PIN input handler
    document.getElementById('pin-input').addEventListener('input', function(e) {
      var val = e.target.value.replace(/[^0-9]/g, '');
      if (val.length > 4) val = val.slice(0, 4);
      e.target.value = val;
      document.getElementById('pin-input').className = 'pin-input';
      document.getElementById('error-msg').style.display = 'none';
      updateButtonState();
    });

    document.getElementById('pin-input').addEventListener('keydown', function(e) {
      if (e.key === 'Enter' && e.target.value.length === 4) {
        handleAction();
      }
    });

    function triggerError(msg) {
      var wrapper = document.getElementById('pin-wrapper');
      var input = document.getElementById('pin-input');
      var errorEl = document.getElementById('error-msg');

      input.className = 'pin-input error';
      errorEl.textContent = msg;
      errorEl.style.display = 'block';
      input.value = '';

      wrapper.className = 'shake';
      setTimeout(function() { wrapper.className = ''; }, 600);
      setTimeout(function() { input.focus(); }, 100);
      updateButtonState();
    }

    function handleAction() {
      if (state.processing) return;
      var pin = document.getElementById('pin-input').value;
      if (pin.length !== 4) return;

      state.processing = true;
      document.getElementById('action-btn').disabled = true;
      document.getElementById('action-label').textContent = 'Processing...';

      if (state.activeSession) {
        clockOut(pin);
      } else {
        clockIn(pin);
      }
    }

    function clockIn(pin) {
      fetch('/api/kiosk/clock-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: state.tenantId, pin: pin })
      })
      .then(function(res) { return res.json().then(function(d) { return { ok: res.ok, data: d }; }); })
      .then(function(result) {
        state.processing = false;
        if (!result.ok) {
          triggerError(result.data.error || 'Invalid PIN');
          updateKioskUI();
        } else {
          var now = new Date();
          document.getElementById('success-company').textContent = state.tenantName;
          document.getElementById('success-time').textContent = 'You are now clocked in at ' + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + '.';
          showScreen('clocked-in');
          startCountdown('countdown-in');
        }
      })
      .catch(function() {
        state.processing = false;
        triggerError('Network error. Please try again.');
        updateKioskUI();
      });
    }

    function clockOut(pin) {
      fetch('/api/kiosk/clock-out', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: state.activeSession.id, userId: state.tenantId, pin: pin })
      })
      .then(function(res) { return res.json().then(function(d) { return { ok: res.ok, data: d }; }); })
      .then(function(result) {
        state.processing = false;
        if (!result.ok) {
          triggerError(result.data.error || 'Invalid PIN');
          updateKioskUI();
        } else {
          var clockInTime = new Date(state.activeSession.clock_in).getTime();
          var duration = Date.now() - clockInTime;
          document.getElementById('summary-company').textContent = state.tenantName;
          document.getElementById('summary-duration').textContent = formatDuration(duration);
          showScreen('clocked-out');
          startCountdown('countdown-out');
        }
      })
      .catch(function() {
        state.processing = false;
        triggerError('Network error. Please try again.');
        updateKioskUI();
      });
    }

    function formatDuration(ms) {
      var totalMinutes = Math.floor(ms / 60000);
      var hours = Math.floor(totalMinutes / 60);
      var minutes = totalMinutes % 60;
      if (hours === 0) return minutes + ' minute' + (minutes !== 1 ? 's' : '');
      return hours + ' hour' + (hours !== 1 ? 's' : '') + ' ' + minutes + ' minute' + (minutes !== 1 ? 's' : '');
    }

    function startCountdown(elementId) {
      var seconds = 10;
      var el = document.getElementById(elementId);
      el.textContent = 'Returning to main screen in ' + seconds + ' seconds...';

      if (countdownTimer) clearInterval(countdownTimer);
      countdownTimer = setInterval(function() {
        seconds--;
        if (seconds <= 0) {
          clearInterval(countdownTimer);
          goBack();
        } else {
          el.textContent = 'Returning to main screen in ' + seconds + ' seconds...';
        }
      }, 1000);
    }

    function goBack() {
      if (countdownTimer) clearInterval(countdownTimer);
      state.tenantId = '';
      state.tenantName = '';
      state.activeSession = null;
      state.processing = false;
      document.getElementById('pin-input').value = '';
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
