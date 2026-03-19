/**
 * PixelLift — app.js WITH RAZORPAY PAYMENT
 * Replace your existing frontend/app.js with this file
 */

document.addEventListener('DOMContentLoaded', function () {

  var API_BASE     = 'http://localhost:3001';
  var MAX_FREE     = 3;
  var currentFile  = null;
  var processedBlob= null;
  var userEmail    = null;
  var isSliding    = false;
  var isPro        = false;

  // Elements
  var loginGate      = document.getElementById('loginGate');
  var loginBtn       = document.getElementById('loginBtn');
  var emailInput     = document.getElementById('emailInput');
  var loginError     = document.getElementById('loginError');
  var toolUI         = document.getElementById('toolUI');
  var uploadZone     = document.getElementById('uploadZone');
  var uploadContent  = document.getElementById('uploadContent');
  var fileInput      = document.getElementById('fileInput');
  var actionRow      = document.getElementById('actionRow');
  var btnEnhance     = document.getElementById('btnEnhance');
  var btnRemove      = document.getElementById('btnRemove');
  var loadingOverlay = document.getElementById('loadingOverlay');
  var loadingText    = document.getElementById('loadingText');
  var compareSection = document.getElementById('compareSection');
  var compareWrapper = document.getElementById('compareWrapper');
  var imgBefore      = document.getElementById('imgBefore');
  var imgAfter       = document.getElementById('imgAfter');
  var compareSlider  = document.getElementById('compareSlider');
  var compareBefore  = document.querySelector('.compare-before');
  var btnDownload    = document.getElementById('btnDownload');
  var btnReset       = document.getElementById('btnReset');
  var usageLabel     = document.getElementById('usageLabel');
  var usageFill      = document.getElementById('usageFill');
  var hamburger      = document.getElementById('hamburger');
  var mobileMenu     = document.getElementById('mobileMenu');

  // ── USAGE ────────────────────────────────────────────────
  function getUsage() {
    var today = new Date().toDateString();
    try {
      var s = JSON.parse(localStorage.getItem('pl_usage') || '{}');
      return s.date === today ? s : { date: today, count: 0 };
    } catch(e) { return { date: today, count: 0 }; }
  }
  function getRemainingUses() {
    if (isPro) return 999; // unlimited for Pro
    return Math.max(0, MAX_FREE - getUsage().count);
  }
  function incrementUsage() {
    if (isPro) return; // Pro users don't consume free uses
    var u = getUsage(); u.count++;
    localStorage.setItem('pl_usage', JSON.stringify(u));
    updateUsageUI();
  }
  function updateUsageUI() {
    var r = getRemainingUses();
    if (isPro) {
      usageLabel.textContent = '✦ Pro — Unlimited uses';
      usageFill.style.width  = '100%';
      usageFill.style.background = '#4ade80';
    } else {
      usageLabel.textContent = r + ' / ' + MAX_FREE + ' uses remaining today';
      usageFill.style.width  = (r / MAX_FREE * 100) + '%';
      usageFill.style.background = r === 0 ? '#e55' : 'var(--amber)';
    }
    btnEnhance.disabled = r === 0;
    btnRemove.disabled  = r === 0;
  }

  // ── CHECK PRO STATUS ─────────────────────────────────────
  function checkProStatus(email) {
    fetch(API_BASE + '/api/payment/status/' + encodeURIComponent(email))
      .then(function(res) { return res.json(); })
      .then(function(data) {
        isPro = data.isPro || false;
        if (isPro) {
          localStorage.setItem('pl_pro', JSON.stringify({ isPro: true, expiresAt: data.expiresAt, plan: data.plan }));
          updateUsageUI();
          updateProBadge(data);
        }
      })
      .catch(function() {
        // If backend not reachable, check localStorage cache
        var cached = localStorage.getItem('pl_pro');
        if (cached) {
          var proData = JSON.parse(cached);
          if (proData.isPro && new Date(proData.expiresAt) > new Date()) {
            isPro = true;
            updateUsageUI();
          }
        }
      });
  }

  function updateProBadge(data) {
    var badge = document.querySelector('.hero-badge');
    if (badge) {
      badge.textContent = '✦ Pro Member — ' + (data.plan === 'yearly' ? 'Yearly' : 'Monthly');
      badge.style.background = 'rgba(74,222,128,0.15)';
      badge.style.color      = '#4ade80';
      badge.style.borderColor= 'rgba(74,222,128,0.3)';
    }
    // Update pricing buttons
    var upgradeBtns = document.querySelectorAll('.plan-btn');
    upgradeBtns.forEach(function(btn) {
      if (btn.textContent.includes('Upgrade')) {
        btn.textContent = '✓ Current Plan';
        btn.style.opacity = '0.6';
        btn.style.cursor  = 'default';
      }
    });
  }

  // ── LOGIN ────────────────────────────────────────────────
  function showTool() {
    loginGate.classList.add('hidden');
    toolUI.classList.remove('hidden');
    updateUsageUI();
    checkProStatus(userEmail);
  }

  var saved = localStorage.getItem('pl_email');
  if (saved) { userEmail = saved; showTool(); }

  loginBtn.addEventListener('click', function() {
    var email = emailInput.value.trim();
    var valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!valid) { loginError.textContent = 'Valid email daalo!'; return; }
    userEmail = email;
    localStorage.setItem('pl_email', email);
    loginError.textContent = '';
    showTool();
  });
  emailInput.addEventListener('keydown', function(e) { if(e.key==='Enter') loginBtn.click(); });
  if (hamburger) hamburger.addEventListener('click', function() { mobileMenu.classList.toggle('open'); });

  // ── UPLOAD ───────────────────────────────────────────────
  fileInput.parentNode.removeChild(fileInput);
  document.body.appendChild(fileInput);

  uploadZone.addEventListener('click', function() { fileInput.click(); });
  fileInput.addEventListener('change', function() {
    if (fileInput.files && fileInput.files[0]) handleFile(fileInput.files[0]);
  });
  uploadZone.addEventListener('dragover',  function(e) { e.preventDefault(); uploadZone.classList.add('dragover'); });
  uploadZone.addEventListener('dragleave', function(e) { if(!uploadZone.contains(e.relatedTarget)) uploadZone.classList.remove('dragover'); });
  uploadZone.addEventListener('drop', function(e) {
    e.preventDefault(); uploadZone.classList.remove('dragover');
    if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
  });

  function handleFile(file) {
    if (['image/jpeg','image/png','image/jpg'].indexOf(file.type) === -1) { alert('Sirf JPG ya PNG!'); return; }
    if (file.size > 10*1024*1024) { alert('Max 10MB!'); return; }
    currentFile = file; processedBlob = null;
    var reader = new FileReader();
    reader.onload = function(ev) {
      uploadContent.innerHTML =
        '<img class="upload-preview" src="' + ev.target.result + '" style="max-height:280px;width:auto;margin:0 auto;border-radius:10px"/>' +
        '<p style="margin-top:12px;font-size:0.85rem;color:var(--muted)">' + file.name +
        ' &middot; ' + (file.size/1024).toFixed(0) + ' KB &nbsp;' +
        '<span id="changeFile" style="color:var(--amber);cursor:pointer;text-decoration:underline">Change</span></p>';
      document.getElementById('changeFile').addEventListener('click', function(e) {
        e.stopPropagation(); fileInput.value=''; fileInput.click();
      });
    };
    reader.readAsDataURL(file);
    actionRow.classList.remove('hidden');
    compareSection.classList.add('hidden');
    loadingOverlay.classList.add('hidden');
  }

  // ── PROCESS IMAGE ────────────────────────────────────────
  function processImage(mode) {
    if (!currentFile) { alert('Pehle image upload karo!'); return; }
    if (getRemainingUses() <= 0) {
      if (confirm('Free uses khatam! Pro upgrade karo?\n\nOK dabao to payment page pe jao.')) {
        document.getElementById('pricing').scrollIntoView({ behavior:'smooth' });
      }
      return;
    }
    actionRow.classList.add('hidden');
    compareSection.classList.add('hidden');
    loadingOverlay.classList.remove('hidden');
    loadingText.textContent = mode==='enhance' ? 'Image enhance ho rahi hai…' : 'Background remove ho raha hai…';

    var fd = new FormData();
    fd.append('image', currentFile);
    fd.append('email', userEmail || 'guest');

    fetch(API_BASE + (mode==='enhance' ? '/api/enhance' : '/api/remove-bg'), { method:'POST', body:fd })
      .then(function(res) {
        if (!res.ok) return res.json().catch(function(){return{};}).then(function(e){ throw new Error(e.message||'Error '+res.status); });
        return res.blob();
      })
      .then(function(blob) {
        processedBlob = blob;
        showComparison();
        incrementUsage();
      })
      .catch(function(err) {
        alert('Error: ' + err.message);
        actionRow.classList.remove('hidden');
      })
      .finally(function() { loadingOverlay.classList.add('hidden'); });
  }

  btnEnhance.addEventListener('click', function() { processImage('enhance'); });
  btnRemove.addEventListener('click',  function() { processImage('remove-bg'); });

  // ── COMPARISON ───────────────────────────────────────────
  function showComparison() {
    imgBefore.src = URL.createObjectURL(currentFile);
    imgAfter.src  = URL.createObjectURL(processedBlob);
    compareSection.classList.remove('hidden');
    actionRow.classList.remove('hidden');
    compareSection.scrollIntoView({ behavior:'smooth', block:'nearest' });
    setSliderPosition(50);
  }
  function setSliderPosition(pct) {
    pct = Math.max(2, Math.min(98, pct));
    compareSlider.style.left = pct+'%';
    compareBefore.style.clipPath = 'inset(0 '+(100-pct)+'% 0 0)';
  }
  compareWrapper.addEventListener('mousedown',  function(e){isSliding=true;moveSlider(e);});
  compareWrapper.addEventListener('touchstart', function(e){isSliding=true;moveSlider(e.touches[0]);},{passive:true});
  document.addEventListener('mousemove',  function(e){if(isSliding)moveSlider(e);});
  document.addEventListener('touchmove',  function(e){if(isSliding)moveSlider(e.touches[0]);},{passive:true});
  document.addEventListener('mouseup',  function(){isSliding=false;});
  document.addEventListener('touchend', function(){isSliding=false;});
  function moveSlider(e) {
    var r = compareWrapper.getBoundingClientRect();
    setSliderPosition(((e.clientX-r.left)/r.width)*100);
  }

  // ── DOWNLOAD ─────────────────────────────────────────────
  btnDownload.addEventListener('click', function() {
    if (!processedBlob) return;
    var url = URL.createObjectURL(processedBlob);
    var a = document.createElement('a');
    a.href=url; a.download='pixellift-'+Date.now()+'.png';
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
  });

  // ── RESET ────────────────────────────────────────────────
  btnReset.addEventListener('click', function() {
    currentFile=null; processedBlob=null; fileInput.value='';
    uploadContent.innerHTML =
      '<div class="upload-icon">⬆</div>' +
      '<p class="upload-title">Drag & drop your image here</p>' +
      '<p class="upload-sub">or <span class="upload-link">browse files</span></p>' +
      '<p class="upload-hint">JPG or PNG · Max 10MB</p>';
    actionRow.classList.add('hidden');
    compareSection.classList.add('hidden');
    loadingOverlay.classList.add('hidden');
    uploadZone.scrollIntoView({behavior:'smooth'});
  });

  // ══════════════════════════════════════════════════════════
  // RAZORPAY PAYMENT INTEGRATION
  // ══════════════════════════════════════════════════════════

  // Attach click to ALL upgrade/pricing buttons
  document.querySelectorAll('.plan-btn').forEach(function(btn) {
    if (btn.textContent.trim() === 'Get Started') {
      btn.addEventListener('click', function(e) {
        e.preventDefault();
        document.getElementById('tool').scrollIntoView({ behavior:'smooth' });
      });
    }
    if (btn.textContent.includes('Upgrade to Pro')) {
      btn.addEventListener('click', function(e) {
        e.preventDefault();
        // Figure out which plan (monthly or yearly) from parent card
        var card = btn.closest('.pricing-card');
        var price = card ? card.querySelector('.plan-price') : null;
        var plan  = (price && price.textContent.includes('9')) ? 'monthly' : 'yearly';
        openPayment(plan);
      });
    }
  });

  function openPayment(plan) {
    if (!userEmail) {
      alert('Pehle login karo!');
      document.getElementById('tool').scrollIntoView({ behavior:'smooth' });
      return;
    }

    // Show loading state
    var btn = document.querySelector('.pricing-card.featured .plan-btn');
    var originalText = btn ? btn.textContent : '';
    if (btn) { btn.textContent = 'Loading…'; btn.disabled = true; }

    // Step 1: Create order on backend
    fetch(API_BASE + '/api/payment/create-order', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ email: userEmail, plan: plan }),
    })
    .then(function(res) {
      if (!res.ok) return res.json().then(function(e){ throw new Error(e.message); });
      return res.json();
    })
    .then(function(orderData) {
      if (btn) { btn.textContent = originalText; btn.disabled = false; }

      // Step 2: Open Razorpay checkout popup
      var options = {
        key:         orderData.key_id,
        amount:      orderData.amount,
        currency:    orderData.currency,
        name:        'PixelLift',
        description: orderData.description,
        order_id:    orderData.order_id,
        prefill: {
          email: userEmail,
        },
        theme: {
          color: '#f5a623',
        },
        modal: {
          ondismiss: function() {
            console.log('Payment cancelled by user');
          }
        },
        // Step 3: On success, verify with backend
        handler: function(response) {
          verifyPayment(response, plan);
        },
      };

      var rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function(response) {
        alert('Payment failed: ' + response.error.description);
      });
      rzp.open();
    })
    .catch(function(err) {
      if (btn) { btn.textContent = originalText; btn.disabled = false; }
      alert('Payment error: ' + err.message + '\n\nRazorpay keys .env mein add kiye?');
    });
  }

  function verifyPayment(response, plan) {
    // Show verifying state
    showPaymentLoading(true);

    fetch(API_BASE + '/api/payment/verify', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        razorpay_order_id:   response.razorpay_order_id,
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_signature:  response.razorpay_signature,
        email: userEmail,
        plan:  plan,
      }),
    })
    .then(function(res) { return res.json(); })
    .then(function(data) {
      showPaymentLoading(false);
      if (data.success) {
        isPro = true;
        localStorage.setItem('pl_pro', JSON.stringify({
          isPro: true,
          expiresAt: data.expiresAt,
          plan: data.plan,
        }));
        updateUsageUI();
        showSuccessModal(data);
      } else {
        alert('Payment verify nahi hua: ' + data.message);
      }
    })
    .catch(function(err) {
      showPaymentLoading(false);
      alert('Verification error: ' + err.message);
    });
  }

  function showPaymentLoading(show) {
    var existing = document.getElementById('paymentLoadingOverlay');
    if (show && !existing) {
      var overlay = document.createElement('div');
      overlay.id = 'paymentLoadingOverlay';
      overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.8);z-index:9999;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px';
      overlay.innerHTML =
        '<div style="width:56px;height:56px;border:3px solid rgba(255,255,255,0.1);border-top-color:#f5a623;border-radius:50%;animation:spin 0.8s linear infinite"></div>' +
        '<p style="font-family:Syne,sans-serif;font-size:1.1rem;font-weight:700;color:white">Payment verify ho raha hai…</p>';
      document.body.appendChild(overlay);
    } else if (!show && existing) {
      existing.remove();
    }
  }

  function showSuccessModal(data) {
    var modal = document.createElement('div');
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.85);z-index:9999;display:flex;align-items:center;justify-content:center;padding:24px';
    modal.innerHTML =
      '<div style="background:#141416;border:1px solid rgba(74,222,128,0.3);border-radius:22px;padding:48px 40px;max-width:440px;width:100%;text-align:center;box-shadow:0 0 80px rgba(74,222,128,0.1)">' +
        '<div style="font-size:3rem;margin-bottom:20px">🎉</div>' +
        '<h2 style="font-family:Syne,sans-serif;font-size:1.8rem;font-weight:800;margin-bottom:12px;color:white">Welcome to Pro!</h2>' +
        '<p style="color:#4ade80;font-size:1rem;margin-bottom:8px;font-weight:600">✦ ' + (data.plan==='yearly'?'Yearly':'Monthly') + ' Plan Activated</p>' +
        '<p style="color:#888;font-size:0.88rem;margin-bottom:32px">Valid until ' + new Date(data.expiresAt).toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'}) + '</p>' +
        '<ul style="list-style:none;margin-bottom:32px;display:flex;flex-direction:column;gap:10px;text-align:left">' +
          '<li style="color:#eee;font-size:0.92rem">✅ Unlimited image processing</li>' +
          '<li style="color:#eee;font-size:0.92rem">✅ No watermark on downloads</li>' +
          '<li style="color:#eee;font-size:0.92rem">✅ Priority processing queue</li>' +
          '<li style="color:#eee;font-size:0.92rem">✅ Batch processing (up to 50)</li>' +
        '</ul>' +
        '<button id="closeSuccessModal" style="background:#f5a623;color:#000;font-family:Syne,sans-serif;font-weight:700;font-size:1rem;padding:14px 36px;border-radius:100px;border:none;cursor:pointer;width:100%">Start Using Pro ✦</button>' +
      '</div>';
    document.body.appendChild(modal);
    document.getElementById('closeSuccessModal').addEventListener('click', function() {
      modal.remove();
      document.getElementById('tool').scrollIntoView({ behavior:'smooth' });
    });
  }

}); // end DOMContentLoaded
