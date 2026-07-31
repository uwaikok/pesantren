/**
 * confirmDialog - pengganti window.confirm() yang berfungsi di Android WebView (Capacitor)
 * window.confirm() diblokir di Capacitor Android, jadi kita gunakan Promise-based modal
 */
export const confirmDialog = (message) => {
  return new Promise((resolve) => {
    // Buat overlay
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed; inset: 0; z-index: 99999;
      background: rgba(0,0,0,0.6); backdrop-filter: blur(4px);
      display: flex; align-items: center; justify-content: center;
      padding: 16px;
    `;

    overlay.innerHTML = `
      <style>
        @keyframes slideUpConfirm { from { transform:translateY(20px); opacity:0 } to { transform:translateY(0); opacity:1 } }
        .confirm-box {
          background: white; border-radius: 16px; padding: 24px;
          max-width: 340px; width: 100%; box-shadow: 0 20px 60px rgba(0,0,0,0.3);
          animation: slideUpConfirm 0.2s ease; font-family: 'Inter', sans-serif;
        }
        .confirm-icon { text-align:center; font-size: 36px; margin-bottom: 12px; }
        .confirm-title { font-size: 14px; font-weight: 700; color: #1A1A1A; text-align: center; margin-bottom: 8px; }
        .confirm-msg { font-size: 13px; color: #6B7280; text-align: center; line-height: 1.6; margin-bottom: 20px; }
        .confirm-btns { display: flex; gap: 10px; }
        .btn-cancel {
          flex: 1; padding: 11px; border: 1.5px solid #E5E7EB;
          border-radius: 10px; background: white; color: #374151;
          font-size: 13px; font-weight: 600; cursor: pointer;
        }
        .btn-ok {
          flex: 1; padding: 11px; border: none;
          border-radius: 10px; background: #DC2626; color: white;
          font-size: 13px; font-weight: 700; cursor: pointer;
        }
      </style>
      <div class="confirm-box">
        <div class="confirm-icon">⚠️</div>
        <div class="confirm-title">Konfirmasi Tindakan</div>
        <div class="confirm-msg">${message.replace(/\n/g, '<br>').replace(/"/g, '&quot;')}</div>
        <div class="confirm-btns">
          <button class="btn-cancel" id="confirm-cancel-btn">Batal</button>
          <button class="btn-ok" id="confirm-ok-btn">Ya, Lanjutkan</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    const cleanup = (result) => {
      if (document.body.contains(overlay)) {
        document.body.removeChild(overlay);
      }
      resolve(result);
    };

    document.getElementById('confirm-ok-btn').onclick = () => cleanup(true);
    document.getElementById('confirm-cancel-btn').onclick = () => cleanup(false);
    overlay.onclick = (e) => { if (e.target === overlay) cleanup(false); };
  });
};

/**
 * alertDialog - pengganti window.alert() yang berfungsi di Android WebView
 */
export const alertDialog = (message, title = 'Informasi') => {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed; inset: 0; z-index: 99999;
      background: rgba(0,0,0,0.6); backdrop-filter: blur(4px);
      display: flex; align-items: center; justify-content: center;
      padding: 16px;
    `;

    overlay.innerHTML = `
      <div style="background:white; border-radius:16px; padding:24px; max-width:340px; width:100%; box-shadow: 0 20px 60px rgba(0,0,0,0.3); font-family:'Inter',sans-serif;">
        <div style="font-size:14px; font-weight:700; color:#1A1A1A; text-align:center; margin-bottom:8px;">${title}</div>
        <div style="font-size:13px; color:#6B7280; text-align:center; line-height:1.6; margin-bottom:20px;">${message.replace(/\n/g, '<br>')}</div>
        <button id="alert-ok-btn" style="width:100%; padding:11px; border:none; border-radius:10px; background:#0B4A3F; color:white; font-size:13px; font-weight:700; cursor:pointer;">OK</button>
      </div>
    `;

    document.body.appendChild(overlay);
    const cleanup = () => {
      if (document.body.contains(overlay)) document.body.removeChild(overlay);
      resolve();
    };
    document.getElementById('alert-ok-btn').onclick = cleanup;
  });
};
