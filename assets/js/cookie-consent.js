// cookie-consent.js — banner + preferences modal, stored in localStorage, no backend
(function(){
  var STORAGE_KEY = 'lumens_cookie_prefs_v1';

  function getPrefs(){
    try{ return JSON.parse(localStorage.getItem(STORAGE_KEY)); }catch(e){ return null; }
  }
  function setPrefs(prefs){
    try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs)); }catch(e){}
  }

  document.addEventListener('DOMContentLoaded', function(){
    var banner = document.getElementById('cookie-banner');
    var backdrop = document.getElementById('cookie-modal-backdrop');
    var analyticsToggle = document.getElementById('cookie-analytics');
    var marketingToggle = document.getElementById('cookie-marketing');
    if(!banner) return;

    var prefs = getPrefs();
    if(!prefs){
      setTimeout(function(){ banner.classList.add('is-visible'); }, 500);
    }

    function hideBanner(){ banner.classList.remove('is-visible'); }
    function openModal(){ if(backdrop){ backdrop.classList.add('is-open'); if(analyticsToggle) analyticsToggle.checked = prefs ? prefs.analytics : true; if(marketingToggle) marketingToggle.checked = prefs ? prefs.marketing : false; } }
    function closeModal(){ if(backdrop) backdrop.classList.remove('is-open'); }

    document.querySelectorAll('[data-cookie-accept]').forEach(function(btn){
      btn.addEventListener('click', function(){
        prefs = { essential:true, analytics:true, marketing:true, ts:Date.now() };
        setPrefs(prefs); hideBanner(); closeModal();
      });
    });
    document.querySelectorAll('[data-cookie-reject]').forEach(function(btn){
      btn.addEventListener('click', function(){
        prefs = { essential:true, analytics:false, marketing:false, ts:Date.now() };
        setPrefs(prefs); hideBanner(); closeModal();
      });
    });
    document.querySelectorAll('[data-cookie-manage]').forEach(function(btn){
      btn.addEventListener('click', openModal);
    });
    document.querySelectorAll('[data-cookie-save]').forEach(function(btn){
      btn.addEventListener('click', function(){
        prefs = { essential:true, analytics: !!(analyticsToggle && analyticsToggle.checked), marketing: !!(marketingToggle && marketingToggle.checked), ts:Date.now() };
        setPrefs(prefs); hideBanner(); closeModal();
      });
    });
    document.querySelectorAll('[data-cookie-close]').forEach(function(btn){
      btn.addEventListener('click', closeModal);
    });
    document.querySelectorAll('[data-cookie-settings]').forEach(function(btn){
      btn.addEventListener('click', function(e){ e.preventDefault(); openModal(); });
    });
  });
})();
