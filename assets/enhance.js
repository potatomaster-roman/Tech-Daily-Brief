/* ============================================================
   Tech-Daily-Brief / A-Share Daily Brief 站点增强脚本
   功能：
   1. 把页头（topbar + 生成时间行）包成一个整体，配合 CSS 吸顶
   2. 在页头内加入“返回首页”与“☰ 目录”入口（文章页）
   3. 根据各 section.block 的 h2 自动生成目录（桌面侧栏 + 移动端抽屉）
   4. 滚动时高亮当前所在小节
   纯渐进增强：即便本脚本加载失败，enhance.css 里 .topbar 的
   position:sticky 兜底规则仍会让页头保持悬浮。
   ============================================================ */
(function(){
  function ready(fn){
    if(document.readyState !== 'loading'){ fn(); }
    else{ document.addEventListener('DOMContentLoaded', fn); }
  }

  ready(function(){
    var topbar = document.querySelector('.topbar');
    if(!topbar) return; // 不是早报/复盘类页面，不处理

    var wrapEl = document.querySelector('.wrap');

    // ---- 1. 把 topbar（以及紧邻的生成时间行，如果有）包进吸顶容器 ----
    var header = document.createElement('div');
    header.className = 'site-sticky-header';
    topbar.parentNode.insertBefore(header, topbar);
    header.appendChild(topbar);

    var sib = header.nextElementSibling;
    if(sib && sib !== wrapEl &&
       (sib.classList.contains('gentime') || sib.classList.contains('gen-time'))){
      header.appendChild(sib);
    }

    // ---- 2. 收集小节（用于目录 + 判断是否是“文章页”） ----
    var backlinkEl = document.querySelector('nav.backlink a');
    var sectionNodes = Array.prototype.slice.call(document.querySelectorAll('section.block'))
      .filter(function(s){ return s.querySelector(':scope > h2'); });

    // 首页：没有“返回首页”按钮、也没有编号小节，仅需吸顶页头，到此为止
    if(!backlinkEl && sectionNodes.length === 0){ return; }

    var entries = sectionNodes.map(function(sec, i){
      if(!sec.id){ sec.id = 'toc-section-' + (i + 1); }
      var h2 = sec.querySelector(':scope > h2');
      return { id: sec.id, label: h2.textContent.trim(), el: sec };
    });

    // ---- 3. 页头功能条：目录按钮 + 返回首页 ----
    var drawer = null;
    if(backlinkEl){
      var controls = document.createElement('div');
      controls.className = 'site-header-controls';

      if(entries.length){
        var tocBtn = document.createElement('button');
        tocBtn.type = 'button';
        tocBtn.className = 'toc-toggle';
        tocBtn.textContent = '☰ 目录';
        tocBtn.setAttribute('aria-label', '展开目录');
        controls.appendChild(tocBtn);
      } else {
        var spacer = document.createElement('span');
        controls.appendChild(spacer);
      }

      var homeLink = document.createElement('a');
      homeLink.className = 'home-link';
      homeLink.href = backlinkEl.getAttribute('href');
      homeLink.textContent = '← 返回首页';
      controls.appendChild(homeLink);

      header.appendChild(controls);

      var oldNav = backlinkEl.closest('nav.backlink');
      if(oldNav){ oldNav.style.display = 'none'; }

      if(entries.length){
        (function(){
          var btn = controls.querySelector('.toc-toggle');
          btn.addEventListener('click', function(){
            drawer.classList.toggle('open');
          });
        })();
      }
    }

    if(entries.length === 0) return;

    // ---- 4. 桌面侧栏 ----
    var sidebar = document.createElement('nav');
    sidebar.className = 'toc-sidebar';
    var title = document.createElement('div');
    title.className = 'toc-title';
    title.textContent = '目录';
    sidebar.appendChild(title);
    entries.forEach(function(e){
      var a = document.createElement('a');
      a.href = '#' + e.id;
      a.textContent = e.label;
      a.dataset.tocFor = e.id;
      sidebar.appendChild(a);
    });
    document.body.appendChild(sidebar);

    // ---- 5. 移动端抽屉 ----
    drawer = document.createElement('nav');
    drawer.className = 'toc-drawer';
    entries.forEach(function(e){
      var a = document.createElement('a');
      a.href = '#' + e.id;
      a.textContent = e.label;
      a.dataset.tocFor = e.id;
      a.addEventListener('click', function(){ drawer.classList.remove('open'); });
      drawer.appendChild(a);
    });
    document.body.appendChild(drawer);

    document.addEventListener('click', function(ev){
      if(!drawer.classList.contains('open')) return;
      if(drawer.contains(ev.target)) return;
      if(ev.target.closest && ev.target.closest('.toc-toggle')) return;
      drawer.classList.remove('open');
    });

    // ---- 6. 布局计算（页头高度、侧栏位置、抽屉位置） ----
    function layout(){
      var headerH = header.getBoundingClientRect().height;
      document.documentElement.style.setProperty('--toc-offset', (headerH + 14) + 'px');
      drawer.style.top = headerH + 'px';

      var sw = 206;
      if(window.innerWidth >= 1150 && wrapEl){
        var wr = wrapEl.getBoundingClientRect();
        var left = wr.left - sw - 26;
        if(left < 12){ left = 12; }
        sidebar.style.left = left + 'px';
        sidebar.style.top = (headerH + 22) + 'px';
      }
    }
    layout();
    window.addEventListener('resize', layout);

    // ---- 7. 滚动高亮当前小节 ----
    var allLinks = document.querySelectorAll('.toc-sidebar a, .toc-drawer a');
    function setActive(id){
      allLinks.forEach(function(a){
        a.classList.toggle('active', a.dataset.tocFor === id);
      });
    }
    if('IntersectionObserver' in window){
      var io = new IntersectionObserver(function(obsEntries){
        var visible = obsEntries
          .filter(function(o){ return o.isIntersecting; })
          .sort(function(a, b){ return a.boundingClientRect.top - b.boundingClientRect.top; });
        if(visible.length){ setActive(visible[0].target.id); }
      }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });
      entries.forEach(function(e){ io.observe(e.el); });
    }
    setActive(entries[0].id);
  });
})();
