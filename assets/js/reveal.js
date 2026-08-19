// reveal.js — IntersectionObserver-based reveal: masked headline + staggered section reveal
(function(){
  document.addEventListener('DOMContentLoaded', function(){
    var mask = document.querySelector('.mask-reveal');
    if(mask){ requestAnimationFrame(function(){ setTimeout(function(){ mask.classList.add('is-revealed'); }, 60); }); }

    var items = Array.prototype.slice.call(document.querySelectorAll('.reveal, .rule-draw'));
    if(!items.length) return;

    if(!('IntersectionObserver' in window)){
      items.forEach(function(el){ el.classList.add('is-revealed'); });
      return;
    }

    var io = new IntersectionObserver(function(entries, obs){
      entries.forEach(function(entry){
        if(entry.isIntersecting){
          var el = entry.target;
          var delay = Number(el.getAttribute('data-delay') || 0);
          setTimeout(function(){ el.classList.add('is-revealed'); }, delay);
          obs.unobserve(el);
        }
      });
    }, { threshold: 0.15 });

    items.forEach(function(el, i){
      el.setAttribute('data-delay', String((i % 4) * 90));
      io.observe(el);
    });

    // Fail-safe: never leave content permanently hidden (slow scroll, print,
    // crawlers, or full-page capture tools that don't scroll incrementally).
    setTimeout(function(){
      items.forEach(function(el){
        if(!el.classList.contains('is-revealed')){
          el.classList.add('is-revealed');
          io.unobserve(el);
        }
      });
    }, 1800);
  });
})();
