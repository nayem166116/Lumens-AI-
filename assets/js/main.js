// main.js — top progress bar + app-like page transitions (real MPA, progressive enhancement only)
(function(){
  var bar = document.getElementById('top-progress');

  function startProgress(){
    if(!bar) return;
    bar.style.opacity = '1';
    bar.style.width = '0%';
    requestAnimationFrame(function(){ bar.style.width = '70%'; });
  }
  function finishProgress(){
    if(!bar) return;
    bar.style.width = '100%';
    setTimeout(function(){ bar.style.opacity = '0'; }, 200);
  }

  window.addEventListener('DOMContentLoaded', function(){
    document.body.classList.add('page-enter');
    finishProgress();
  });

  document.addEventListener('click', function(e){
    var a = e.target.closest('a');
    if(!a) return;
    var href = a.getAttribute('href');
    if(!href || href.charAt(0) === '#') return;
    if(a.target === '_blank' || a.hasAttribute('download')) return;
    if(href.indexOf('http') === 0 && href.indexOf(window.location.origin) !== 0) return;
    if(e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;

    e.preventDefault();
    startProgress();
    document.body.classList.add('is-navigating');
    setTimeout(function(){ window.location.href = href; }, 170);
  });
})();
