// tool.js — Free public tool: Call Opening Grader. The ONLY place with a realistic mock result (per spec R4).
(function(){
  var form = document.getElementById('tool-form');
  if(!form) return;
  var textarea = document.getElementById('tool-input');
  var resultBox = document.getElementById('tool-result');
  var submitBtn = form.querySelector('button[type=submit]');

  var SAMPLE = "Hi, this is Alex calling from Northbridge Insurance. I'm following up on the claim you filed last week \u2014 do you have two minutes to go over the next steps?";

  var fillBtn = document.getElementById('tool-fill-sample');
  if(fillBtn){ fillBtn.addEventListener('click', function(){ textarea.value = SAMPLE; textarea.focus(); }); }

  function scoreScript(text){
    var words = text.trim().split(/\s+/).filter(Boolean);
    var wc = words.length;
    var hasGreeting = /\b(hi|hello|good (morning|afternoon|evening))\b/i.test(text);
    var hasIdentity = /\b(this is|my name is|calling from)\b/i.test(text);
    var hasReason = /\b(calling (about|regarding|to)|following up|regarding)\b/i.test(text);
    var hasConsent = /\b(do you have (a )?(minute|moment|two minutes)|is now a good time|is this a good time)\b/i.test(text);
    var hasDisclosure = /\b(recorded|recording|quality (and training|purposes))\b/i.test(text);
    var fillerCount = (text.match(/\b(um|uh|like|you know|basically)\b/ig) || []).length;

    var clarity = 55;
    if(hasGreeting) clarity += 10;
    if(hasIdentity) clarity += 10;
    if(hasReason) clarity += 10;
    if(hasConsent) clarity += 8;
    if(wc >= 12 && wc <= 45) clarity += 7;
    clarity -= Math.min(20, fillerCount * 6);
    clarity = Math.max(28, Math.min(97, Math.round(clarity)));

    var flags = [
      { ok: hasGreeting, label: 'Opens with a clear greeting' },
      { ok: hasIdentity, label: 'States caller name and organization' },
      { ok: hasReason, label: 'States the reason for the call' },
      { ok: hasConsent, label: 'Asks for permission to continue' },
      { ok: hasDisclosure, label: 'Includes a call-recording disclosure', warnLabel: 'Missing recording disclosure \u2014 required in many jurisdictions' }
    ];

    var sentiment = fillerCount > 2 ? 'Hesitant' : (hasConsent && hasIdentity ? 'Confident & courteous' : 'Neutral');

    var rewrite = 'Hi, this is {Agent Name} calling from {Company}\u2014this call may be recorded for quality and training. '
      + (hasReason ? words.slice(0,0).join('') : "I'm reaching out about ") + (hasReason ? 'I\u2019m calling about your recent request. ' : '')
      + 'Do you have two minutes to go over the next steps?';

    return { clarity: clarity, flags: flags, sentiment: sentiment, wc: wc, fillerCount: fillerCount, rewrite: rewrite };
  }

  form.addEventListener('submit', function(e){
    e.preventDefault();
    var text = textarea.value.trim();
    if(text.length < 8){
      resultBox.innerHTML = '<p class="placeholder">Enter at least one full sentence \u2014 a real call opening works best.</p>';
      return;
    }
    submitBtn.disabled = true;
    submitBtn.querySelector('span').textContent = 'Analyzing\u2026';
    resultBox.innerHTML = '<div class="shimmer" style="width:40%"></div><div class="shimmer" style="width:90%"></div><div class="shimmer" style="width:75%"></div><div class="shimmer" style="width:60%"></div>';

    setTimeout(function(){
      var r = scoreScript(text);
      var flagsHtml = r.flags.map(function(f){
        return '<div class="flag-row ' + (f.ok ? 'ok' : 'warn') + '"><i class="fa-solid ' + (f.ok ? 'fa-circle-check' : 'fa-triangle-exclamation') + '"></i><span>' + (f.ok ? f.label : (f.warnLabel || f.label)) + '</span></div>';
      }).join('');
      resultBox.innerHTML =
        '<div class="score-row"><span class="score">' + r.clarity + '</span><span>/100 clarity score</span></div>'
        + flagsHtml
        + '<p style="margin-top:16px;"><strong>Tone:</strong> ' + r.sentiment + ' \u00b7 ' + r.wc + ' words \u00b7 ' + r.fillerCount + ' filler word(s)</p>'
        + '<div class="callout callout-accent" style="margin-top:16px;"><p class="kicker">Suggested opening</p><p>' + r.rewrite + '</p></div>';
      submitBtn.disabled = false;
      submitBtn.querySelector('span').textContent = 'Analyze opening';
    }, 900 + Math.random()*500);
  });
})();
