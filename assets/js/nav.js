// nav.js — mobile drawer, collapsible rail groups, active nav link, right-rail TOC toggle
(function(){
  document.addEventListener('DOMContentLoaded', function(){
    var openBtn = document.querySelector('[data-open-nav]');
    var closeBtn = document.querySelector('[data-close-nav]');
    var rail = document.querySelector('.rail-left');
    var scrim = document.querySelector('.rail-scrim');

    function openDrawer(){
      if(!rail) return;
      rail.classList.add('is-open');
      if(scrim) scrim.classList.add('is-open');
      document.body.style.overflow = 'hidden';
      var first = rail.querySelector('a,button');
      if(first) first.focus();
    }
    function closeDrawer(){
      if(!rail) return;
      rail.classList.remove('is-open');
      if(scrim) scrim.classList.remove('is-open');
      document.body.style.overflow = '';
    }
    if(openBtn) openBtn.addEventListener('click', openDrawer);
    if(closeBtn) closeBtn.addEventListener('click', closeDrawer);
    if(scrim) scrim.addEventListener('click', closeDrawer);
    document.addEventListener('keydown', function(e){
      if(e.key === 'Escape') closeDrawer();
    });

    // Collapsible nav groups
    document.querySelectorAll('.nav-group-label').forEach(function(btn){
      btn.addEventListener('click', function(){
        var group = btn.closest('.nav-group');
        group.classList.toggle('is-collapsed');
        btn.setAttribute('aria-expanded', group.classList.contains('is-collapsed') ? 'false' : 'true');
      });
    });

    // Mark active nav link by pathname
    var path = window.location.pathname.replace(/\/$/, '') || '/';
    document.querySelectorAll('.nav-list a').forEach(function(a){
      var href = a.getAttribute('href').replace(/\/$/, '') || '/';
      if(href === path){
        a.setAttribute('aria-current', 'page');
        var group = a.closest('.nav-group');
        if(group) group.classList.remove('is-collapsed');
      }
    });

    // Right-rail "On this page" toggle (mobile)
    var tocToggle = document.querySelector('.toc-toggle');
    var tocPanel = document.querySelector('.toc-panel');
    if(tocToggle && tocPanel){
      tocToggle.addEventListener('click', function(){
        var open = tocPanel.classList.toggle('is-open');
        tocToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
        var icon = tocToggle.querySelector('i');
        if(icon){ icon.style.transform = open ? 'rotate(180deg)' : 'rotate(0deg)'; }
      });
    }

    // Scroll-spy for TOC links
    var tocLinks = Array.prototype.slice.call(document.querySelectorAll('.toc-list a'));
    if(tocLinks.length){
      var targets = tocLinks.map(function(l){
        return document.getElementById(l.getAttribute('href').slice(1));
      }).filter(Boolean);
      if('IntersectionObserver' in window && targets.length){
        var io = new IntersectionObserver(function(entries){
          entries.forEach(function(entry){
            var link = tocLinks.find(function(l){ return l.getAttribute('href') === '#' + entry.target.id; });
            if(!link) return;
            if(entry.isIntersecting){
              tocLinks.forEach(function(l){ l.classList.remove('is-active'); });
              link.classList.add('is-active');
            }
          });
        }, { rootMargin: '-15% 0px -70% 0px', threshold: 0 });
        targets.forEach(function(t){ io.observe(t); });
      }
    }
  });
})();
