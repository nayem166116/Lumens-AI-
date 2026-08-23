// auth.js — Frontend-only auth experience. No backend, no DB, no email, no session/token.
// Every rule below runs for real (validation, countdown, OTP, attempt limits) per spec Section 2A.
(function(){
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;
  var COMMON_TYPOS = { 'gmial.com':'gmail.com','gnail.com':'gmail.com','gmai.com':'gmail.com','hotmial.com':'hotmail.com','yaho.com':'yahoo.com','outlok.com':'outlook.com' };

  function $(sel, ctx){ return (ctx||document).querySelector(sel); }
  function $all(sel, ctx){ return Array.prototype.slice.call((ctx||document).querySelectorAll(sel)); }

  function setError(field, msg){
    field.classList.add('has-error');
    var err = $('.error-msg', field);
    if(err) err.textContent = msg;
    var input = $('input,textarea', field);
    if(input){ input.setAttribute('aria-invalid','true'); }
  }
  function clearError(field){
    field.classList.remove('has-error');
    var input = $('input,textarea', field);
    if(input){ input.removeAttribute('aria-invalid'); }
  }

  function setBtnPending(btn, label){
    btn.dataset.originalHtml = btn.dataset.originalHtml || btn.innerHTML;
    btn.innerHTML = '<span><span class="spinner" aria-hidden="true"></span>' + label + '</span>';
    btn.disabled = true;
    btn.setAttribute('aria-busy','true');
  }
  function resetBtn(btn){
    if(btn.dataset.originalHtml) btn.innerHTML = btn.dataset.originalHtml;
    btn.disabled = false;
    btn.removeAttribute('aria-busy');
  }

  /* ---------------- Password strength ---------------- */
  function passwordChecks(pw){
    return { len: pw.length >= 8, upper: /[A-Z]/.test(pw), num: /[0-9]/.test(pw) };
  }
  function passwordStrength(pw){
    var c = passwordChecks(pw);
    var score = (c.len?1:0)+(c.upper?1:0)+(c.num?1:0);
    if(!pw) return 'none';
    if(score <= 1) return 'weak';
    if(score === 2) return 'fair';
    return 'strong';
  }

  /* ==================== REGISTER ==================== */
  var registerForm = document.getElementById('register-form');
  if(registerForm){
    var nameField = $('#field-name', registerForm);
    var emailField = $('#field-email', registerForm);
    var pwField = $('#field-password', registerForm);
    var pwConfirmField = $('#field-password-confirm', registerForm);
    var termsField = $('#field-terms', registerForm);
    var submitBtn = $('button[type=submit]', registerForm);
    var strengthMeter = $('.strength-meter', registerForm);
    var strengthLabel = $('.strength-label', registerForm);
    var checklist = $('.checklist', registerForm);

    function validateName(showError){
      var v = $('input', nameField).value.trim();
      var ok = v.length >= 2 && /[a-zA-Z]/.test(v);
      if(showError){ ok ? clearError(nameField) : setError(nameField, 'Enter your full name'); }
      return ok;
    }
    function validateEmail(showError){
      var input = $('input', emailField);
      var v = input.value.trim();
      var domain = v.split('@')[1];
      if(domain && COMMON_TYPOS[domain.toLowerCase()]){
        if(showError) setError(emailField, 'Did you mean ' + v.split('@')[0] + '@' + COMMON_TYPOS[domain.toLowerCase()] + '?');
        return false;
      }
      var ok = EMAIL_RE.test(v);
      if(showError){ ok ? clearError(emailField) : setError(emailField, 'Enter a valid email address'); }
      return ok;
    }
    function validatePassword(showError){
      var v = $('input', pwField).value;
      var c = passwordChecks(v);
      var ok = c.len && c.upper && c.num;
      if(checklist){
        $all('li', checklist).forEach(function(li){
          var key = li.getAttribute('data-check');
          li.classList.toggle('is-met', !!c[key]);
          var icon = $('span', li);
          if(icon) icon.innerHTML = c[key] ? '&#10003;' : '&#9675;';
        });
      }
      if(strengthMeter){
        var s = passwordStrength(v);
        strengthMeter.className = 'strength-meter' + (s !== 'none' ? ' ' + s : '');
        if(strengthLabel) strengthLabel.textContent = v ? ('Strength: ' + s.charAt(0).toUpperCase() + s.slice(1)) : '';
      }
      if(showError){ ok ? clearError(pwField) : setError(pwField, 'Password must be at least 8 characters, with one uppercase letter and one number'); }
      return ok;
    }
    function validateConfirm(showError){
      var ok = $('input', pwConfirmField).value === $('input', pwField).value && $('input', pwConfirmField).value.length > 0;
      if(showError){ ok ? clearError(pwConfirmField) : setError(pwConfirmField, "Passwords don't match"); }
      return ok;
    }
    function validateTerms(showError){
      var ok = $('input', termsField).checked;
      if(showError){ ok ? clearError(termsField) : setError(termsField, 'You must accept the Terms of Service to continue'); }
      return ok;
    }
    function updateSubmitState(){
      var ok = validateName(false) && validateEmail(false) && validatePassword(false) && validateConfirm(false) && validateTerms(false);
      submitBtn.disabled = !ok;
      submitBtn.setAttribute('aria-disabled', String(!ok));
    }

    [[nameField,validateName],[emailField,validateEmail],[pwField,validatePassword],[pwConfirmField,validateConfirm]].forEach(function(pair){
      var field = pair[0], fn = pair[1];
      var input = $('input', field);
      var touched = false;
      input.addEventListener('blur', function(){ touched = true; fn(true); updateSubmitState(); });
      input.addEventListener('input', function(){ if(touched) fn(true); else fn(false); updateSubmitState(); });
    });
    $('input', termsField).addEventListener('change', function(){ validateTerms(true); updateSubmitState(); });

    $all('.password-toggle button', registerForm).forEach(function(btn){
      btn.addEventListener('click', function(){
        var input = btn.parentElement.querySelector('input');
        var showing = input.type === 'text';
        input.type = showing ? 'password' : 'text';
        btn.textContent = showing ? 'Show' : 'Hide';
        btn.setAttribute('aria-label', showing ? 'Show password' : 'Hide password');
      });
    });

    updateSubmitState();

    registerForm.addEventListener('submit', function(e){
      e.preventDefault();
      var ok = validateName(true) & validateEmail(true) & validatePassword(true) & validateConfirm(true) & validateTerms(true);
      updateSubmitState();
      if(!ok) return;
      setBtnPending(submitBtn, 'Creating account\u2026');
      $all('input', registerForm).forEach(function(i){ i.disabled = true; });
      var email = $('input', emailField).value.trim();
      setTimeout(function(){
        try{ sessionStorage.setItem('lumens_pending_email', email); }catch(err){}
        window.location.href = '/verify';
      }, 900 + Math.random()*500);
    });
  }

  /* ==================== VERIFY (OTP) ==================== */
  var verifyForm = document.getElementById('verify-form');
  if(verifyForm){
    var emailTarget = document.getElementById('verify-email-target');
    var pendingEmail = 'your email';
    try{ pendingEmail = sessionStorage.getItem('lumens_pending_email') || pendingEmail; }catch(e){}
    if(emailTarget) emailTarget.textContent = pendingEmail;

    var otpInputs = $all('.otp-row input', verifyForm);
    var verifyBtn = $('button[type=submit]', verifyForm);
    var resendBtn = document.getElementById('resend-btn');
    var countdownEl = document.getElementById('countdown-text');
    var resendCount = 0;
    var waitTimes = [60,120,300];
    var remaining = waitTimes[0];
    var timer = null;
    var endsAt = Date.now() + remaining*1000;

    function formatTime(s){ var m = Math.floor(s/60), sec = s%60; return m + ':' + (sec<10?'0':'') + sec; }
    function tick(){
      var left = Math.max(0, Math.round((endsAt - Date.now())/1000));
      if(countdownEl){
        if(left > 0){
          countdownEl.innerHTML = 'Resend code in <strong>' + formatTime(left) + '</strong>';
          if(resendBtn){ resendBtn.disabled = true; resendBtn.setAttribute('aria-disabled','true'); }
        } else {
          clearInterval(timer);
          if(resendCount >= 3){
            countdownEl.textContent = "You've reached the maximum number of resend attempts. Please try again later.";
            if(resendBtn){ resendBtn.disabled = true; resendBtn.style.display = 'none'; }
          } else {
            countdownEl.innerHTML = "Didn't get the code? ";
            if(resendBtn){ resendBtn.disabled = false; resendBtn.removeAttribute('aria-disabled'); }
          }
        }
      }
      if(left <= 0) clearInterval(timer);
    }
    function startCountdown(seconds){
      endsAt = Date.now() + seconds*1000;
      clearInterval(timer);
      tick();
      timer = setInterval(tick, 1000);
    }
    startCountdown(waitTimes[0]);

    otpInputs.forEach(function(input, idx){
      input.addEventListener('input', function(){
        input.value = input.value.replace(/[^0-9]/g,'').slice(0,1);
        if(input.value && idx < otpInputs.length-1){ otpInputs[idx+1].focus(); }
        maybeAutoSubmit();
      });
      input.addEventListener('keydown', function(e){
        if(e.key === 'Backspace' && !input.value && idx > 0){ otpInputs[idx-1].focus(); }
        if(e.key === 'ArrowLeft' && idx > 0){ otpInputs[idx-1].focus(); }
        if(e.key === 'ArrowRight' && idx < otpInputs.length-1){ otpInputs[idx+1].focus(); }
      });
      input.addEventListener('paste', function(e){
        e.preventDefault();
        var text = (e.clipboardData || window.clipboardData).getData('text').replace(/[^0-9]/g,'');
        text.split('').slice(0, otpInputs.length).forEach(function(ch, i){ otpInputs[i].value = ch; });
        var last = Math.min(text.length, otpInputs.length) - 1;
        if(last >= 0) otpInputs[last].focus();
        maybeAutoSubmit();
      });
    });

    function otpValue(){ return otpInputs.map(function(i){ return i.value; }).join(''); }
    function maybeAutoSubmit(){
      if(otpValue().length === otpInputs.length){ submitOtp(); }
    }
    function submitOtp(){
      if(otpValue().length < otpInputs.length){ return; }
      otpInputs.forEach(function(i){ i.disabled = true; });
      setBtnPending(verifyBtn, 'Verifying\u2026');
      setTimeout(function(){ window.location.href = '/loading'; }, 800 + Math.random()*400);
    }
    verifyForm.addEventListener('submit', function(e){ e.preventDefault(); submitOtp(); });

    if(resendBtn){
      resendBtn.addEventListener('click', function(){
        if(resendBtn.disabled || resendCount >= 3) return;
        resendBtn.disabled = true;
        var original = resendBtn.textContent;
        resendBtn.textContent = 'Sending\u2026';
        setTimeout(function(){
          resendCount++;
          otpInputs.forEach(function(i){ i.value=''; });
          otpInputs[0].focus();
          resendBtn.textContent = original;
          var successEl = document.getElementById('resend-success');
          if(successEl){
            successEl.textContent = 'A new code has been sent to ' + pendingEmail;
            successEl.classList.add('is-visible');
            setTimeout(function(){ successEl.classList.remove('is-visible'); }, 4000);
          }
          startCountdown(waitTimes[Math.min(resendCount, waitTimes.length-1)]);
        }, 700);
      });
    }
  }

  /* ==================== LOGIN ==================== */
  var loginForm = document.getElementById('login-form');
  if(loginForm){
    var loginEmail = $('#field-login-email', loginForm);
    var loginPassword = $('#field-login-password', loginForm);
    var loginBtn = $('button[type=submit]', loginForm);
    var loginAlert = document.getElementById('login-alert');
    var attempts = 0;
    var lockTimer = null;

    function validateLoginEmail(showError){
      var v = $('input', loginEmail).value.trim();
      if(!v){ if(showError) setError(loginEmail,'Enter your email address'); return false; }
      var ok = EMAIL_RE.test(v);
      if(showError){ ok ? clearError(loginEmail) : setError(loginEmail,'Enter a valid email address'); }
      return ok;
    }
    function validateLoginPassword(showError){
      var v = $('input', loginPassword).value;
      if(!v){ if(showError) setError(loginPassword,'Enter your password'); return false; }
      var ok = v.length >= 6;
      if(showError){ ok ? clearError(loginPassword) : setError(loginPassword,'Password must be at least 6 characters'); }
      return ok;
    }

    loginForm.addEventListener('submit', function(e){
      e.preventDefault();
      if(loginBtn.disabled) return;
      var ok = validateLoginEmail(true) & validateLoginPassword(true);
      if(!ok) return;
      setBtnPending(loginBtn, 'Signing in\u2026');
      $all('input', loginForm).forEach(function(i){ i.disabled = true; });
      setTimeout(function(){
        $all('input', loginForm).forEach(function(i){ i.disabled = false; });
        resetBtn(loginBtn);
        attempts++;
        $('input', loginPassword).value = '';
        if(loginAlert){
          loginAlert.classList.add('is-visible');
          loginAlert.classList.remove('is-shaking');
          void loginAlert.offsetWidth;
          loginAlert.classList.add('is-shaking');
        }
        if(attempts >= 3){
          var seconds = 30;
          loginBtn.disabled = true;
          if(loginAlert){
            loginAlert.querySelector('strong').textContent = 'Too many failed attempts.';
            loginAlert.querySelector('p').textContent = 'Try again in ' + seconds + ' seconds.';
          }
          clearInterval(lockTimer);
          lockTimer = setInterval(function(){
            seconds--;
            if(loginAlert) loginAlert.querySelector('p').textContent = 'Try again in ' + seconds + ' seconds.';
            if(seconds <= 0){
              clearInterval(lockTimer);
              loginBtn.disabled = false;
              attempts = 0;
              if(loginAlert){
                loginAlert.querySelector('strong').textContent = "We couldn't find an account with that email address.";
                loginAlert.querySelector('p').innerHTML = 'Double-check your email, or <a href="/register">create a new account</a>.';
              }
            }
          }, 1000);
        }
      }, 1000 + Math.random()*500);
    });
  }

  /* ==================== FORGOT PASSWORD ==================== */
  var forgotForm = document.getElementById('forgot-form');
  if(forgotForm){
    forgotForm.addEventListener('submit', function(e){
      e.preventDefault();
      var field = document.getElementById('field-forgot-email');
      var input = $('input', field);
      var v = input.value.trim();
      if(!EMAIL_RE.test(v)){ setError(field, 'Enter a valid email address'); return; }
      clearError(field);
      var btn = $('button[type=submit]', forgotForm);
      setBtnPending(btn, 'Sending\u2026');
      setTimeout(function(){
        var confirmEl = document.getElementById('forgot-confirm');
        forgotForm.style.display = 'none';
        if(confirmEl){
          confirmEl.style.display = 'block';
          confirmEl.querySelector('[data-email]').textContent = v;
        }
      }, 800);
    });
  }
})();
