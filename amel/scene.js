/* Buffet Amel: 3D hero (sea through the window -> table with ćevapi) and the realistic grill band.
   three.js r128, loaded by the page. Everything procedural, no external textures. */
(function () {
  "use strict";
  var RM = window.matchMedia("(prefers-reduced-motion:reduce)").matches;
  function webgl() { try { var c = document.createElement("canvas"); return !!(c.getContext("webgl") || c.getContext("experimental-webgl")); } catch (e) { return false; } }
  var hero = document.getElementById("hero");
  if (RM || !webgl()) { if (hero) hero.classList.remove("hero--3d"); return; }

  function withThree(cb) {
    if (window.THREE) return cb(window.THREE);
    if (!document.querySelector('script[src*="three.min.js"]')) {
      var s = document.createElement("script");
      s.src = "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"; s.async = true;
      document.head.appendChild(s);
    }
    var n = 0, iv = setInterval(function () {
      if (window.THREE) { clearInterval(iv); cb(window.THREE); }
      else if (++n > 200) { clearInterval(iv); if (hero) hero.classList.remove("hero--3d"); }
    }, 80);
  }

  var mobile = window.matchMedia("(max-width:899px)").matches || window.matchMedia("(pointer:coarse)").matches;
  function R(a, b) { return a + Math.random() * (b - a); }
  function cnv(w, h) { var c = document.createElement("canvas"); c.width = w; c.height = h; return c; }
  function clamp(x, a, b) { return Math.max(a, Math.min(b, x)); }
  function ease(t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }

  withThree(function (THREE) {
    /* ---------- shared textures & meshes ---------- */
    function meatTex() {
      var W = 256, H = 512, c = cnv(W, H), x = c.getContext("2d");
      x.fillStyle = "#5c3420"; x.fillRect(0, 0, W, H);
      var pal = ["#43220f", "#7a4a2c", "#563019", "#8a5a3a", "#351a0b", "#94653f", "#664028", "#2c160a"];
      for (var i = 0; i < 5200; i++) { x.globalAlpha = R(.25, .7); x.fillStyle = pal[i % pal.length]; x.beginPath(); x.arc(R(0, W), R(0, H), R(.6, 3.4), 0, 6.283); x.fill(); }
      for (i = 0; i < 260; i++) { x.globalAlpha = R(.15, .35); x.fillStyle = "#e6b083"; x.beginPath(); x.arc(R(0, W), R(0, H), R(.5, 1.6), 0, 6.283); x.fill(); }
      // charred grill marks, soft edges
      x.globalAlpha = 1; x.lineCap = "round";
      for (var k = 0; k < 5; k++) {
        var y0 = (k + .4) * H / 5 + R(-12, 12);
        for (var sgm = 0; sgm < 26; sgm++) {
          var x0 = sgm * W / 26, x1 = x0 + W / 26 + 2, yy0 = y0 + x0 * .27 + R(-2, 2);
          for (var p = 0; p < 3; p++) {
            x.strokeStyle = ["rgba(45,18,6," + R(.12, .25) + ")", "rgba(30,12,4," + R(.25, .45) + ")", "rgba(18,7,2," + R(.35, .7) + ")"][p];
            x.lineWidth = [22, 13, R(4, 8)][p];
            x.beginPath(); x.moveTo(x0, yy0); x.lineTo(x1, yy0 + (x1 - x0) * .27); x.stroke();
          }
        }
      }
      // darker browned ends and crust variation
      var g = x.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, "rgba(40,16,5,.55)"); g.addColorStop(.12, "rgba(40,16,5,0)"); g.addColorStop(.88, "rgba(40,16,5,0)"); g.addColorStop(1, "rgba(40,16,5,.55)");
      x.fillStyle = g; x.fillRect(0, 0, W, H);
      var t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.encoding = THREE.sRGBEncoding; t.anisotropy = 4;
      return t;
    }
    function breadTex() {
      var W = 512, H = 256, c = cnv(W, H), x = c.getContext("2d");
      var g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, "#b8743a"); g.addColorStop(.45, "#d59a58"); g.addColorStop(1, "#e9c38c");
      x.fillStyle = g; x.fillRect(0, 0, W, H);
      for (var i = 0; i < 3000; i++) { x.globalAlpha = R(.1, .35); x.fillStyle = Math.random() < .6 ? "#f1d6a6" : "#9c5a26"; x.beginPath(); x.arc(R(0, W), R(0, H * .7), R(.5, 2.5), 0, 6.283); x.fill(); }
      for (i = 0; i < 40; i++) { x.globalAlpha = R(.15, .3); x.fillStyle = "#7a3f17"; x.beginPath(); x.ellipse(R(0, W), R(0, H * .5), R(4, 14), R(2, 5), 0, 0, 6.283); x.fill(); }
      var t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; return t;
    }
    function woodTex() {
      var W = 1024, H = 512, c = cnv(W, H), x = c.getContext("2d");
      x.fillStyle = "#5b3a20"; x.fillRect(0, 0, W, H);
      var planks = 5, ph = H / planks;
      for (var p = 0; p < planks; p++) {
        var base = ["#6a4426", "#5e3b1f", "#734b2a", "#634022", "#6d4626"][p];
        x.fillStyle = base; x.fillRect(0, p * ph, W, ph);
        for (var l = 0; l < 220; l++) {
          x.strokeStyle = Math.random() < .5 ? "rgba(40,22,10,.12)" : "rgba(160,110,70,.08)"; x.lineWidth = R(.3, 1);
          var yy = p * ph + R(2, ph - 2), a = R(1, 5), f = R(.002, .01), o = R(0, 6);
          x.beginPath(); for (var X = 0; X <= W; X += 16) x.lineTo(X, yy + Math.sin(X * f + o) * a); x.stroke();
        }
        x.fillStyle = "rgba(20,10,4,.35)"; x.fillRect(0, p * ph, W, 1.5);
      }
      var t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.encoding = THREE.sRGBEncoding; t.anisotropy = 4; return t;
    }
    function softTex(inner, outer) {
      var c = cnv(128, 128), x = c.getContext("2d"), g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
      g.addColorStop(0, inner); g.addColorStop(1, outer); x.fillStyle = g; x.fillRect(0, 0, 128, 128);
      return new THREE.CanvasTexture(c);
    }
    var MEAT = meatTex();
    function cevapGeo() {
      var r = .095, L = .44, pts = [], i, a;
      for (i = 0; i <= 8; i++) { a = -Math.PI / 2 + i / 8 * Math.PI / 2; pts.push(new THREE.Vector2(Math.max(.001, r * Math.cos(a)), -L + r * Math.sin(a))); }
      for (i = 1; i < 10; i++) pts.push(new THREE.Vector2(r * (1 + .03 * Math.sin(i * 1.7)), -L + 2 * L * i / 10));
      for (i = 0; i <= 8; i++) { a = i / 8 * Math.PI / 2; pts.push(new THREE.Vector2(Math.max(.001, r * Math.cos(a)), L + r * Math.sin(a))); }
      var g = new THREE.LatheGeometry(pts, 28), pos = g.attributes.position, v = new THREE.Vector3();
      var s1 = R(0, 9), s2 = R(0, 9);
      for (i = 0; i < pos.count; i++) {
        v.fromBufferAttribute(pos, i);
        var rr = Math.hypot(v.x, v.z); if (rr < .002) continue;
        var n = .012 * Math.sin(v.y * 31 + s1) * Math.cos(Math.atan2(v.z, v.x) * 3 + s2) + .006 * Math.sin(v.y * 77 + v.x * 40) + R(-.003, .003);
        var k = (rr + n) / rr; pos.setXYZ(i, v.x * k, v.y, v.z * k * .92);
      }
      g.rotateZ(Math.PI / 2); g.computeVertexNormals(); return g;
    }
    var meatMat = new THREE.MeshStandardMaterial({ map: MEAT, bumpMap: MEAT, bumpScale: .01, roughness: .42, metalness: 0, color: 0xffffff });
    function cevap() { var m = new THREE.Mesh(cevapGeo(), meatMat); m.castShadow = true; m.receiveShadow = true; m.rotation.x = R(0, 6.28); return m; }

    /* ======================= HERO ROOM ======================= */
    function initRoom() {
      var stage = hero.querySelector(".hero__stage"), canvas = document.getElementById("room3d");
      if (!stage || !canvas) return;
      var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: !mobile, powerPreference: "high-performance" });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 2));
      renderer.outputEncoding = THREE.sRGBEncoding; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
      renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      var scene = new THREE.Scene(); scene.background = new THREE.Color(0x1a120d);
      var cam = new THREE.PerspectiveCamera(42, 1, .05, 60);

      // outside: animated sky + Kvarner sea texture
      var SW = 1024, SH = 512, sc = cnv(SW, SH), sx = sc.getContext("2d");
      var m1 = [], m2 = [];
      for (var i = 0; i <= 64; i++) {
        var u = i / 64;
        m1.push(.08 * Math.exp(-Math.pow((u - .3) / .18, 2)) + .03 * Math.sin(u * 19) * .5 + .025 + .02 * Math.exp(-Math.pow((u - .8) / .1, 2)));
        m2.push(.035 + .015 * Math.sin(u * 31 + 1) + .02 * Math.exp(-Math.pow((u - .62) / .12, 2)));
      }
      var seaTex = new THREE.CanvasTexture(sc); seaTex.encoding = THREE.sRGBEncoding;
      function drawSea(t) {
        var hz = SH * .58, sunX = SW * .64;
        var g = sx.createLinearGradient(0, 0, 0, hz);
        g.addColorStop(0, "#2f4672"); g.addColorStop(.4, "#8b6f93"); g.addColorStop(.75, "#ec9a6e"); g.addColorStop(1, "#ffd39c");
        sx.fillStyle = g; sx.fillRect(0, 0, SW, hz);
        var sg = sx.createRadialGradient(sunX, hz - 26, 0, sunX, hz - 26, 260);
        sg.addColorStop(0, "rgba(255,244,214,1)"); sg.addColorStop(.08, "rgba(255,226,170,.9)"); sg.addColorStop(.35, "rgba(255,170,110,.35)"); sg.addColorStop(1, "rgba(255,150,100,0)");
        sx.fillStyle = sg; sx.fillRect(0, 0, SW, hz);
        sx.fillStyle = "rgba(255,190,160,.22)";
        for (var c = 0; c < 5; c++) { var cx = ((c * 260 + t * 6) % (SW + 300)) - 150; sx.beginPath(); sx.ellipse(cx, 60 + c * 34, 150, 12, 0, 0, 6.283); sx.fill(); }
        function ridge(arr, col, base) { sx.fillStyle = col; sx.beginPath(); sx.moveTo(0, hz); for (var j = 0; j < arr.length; j++) sx.lineTo(j / (arr.length - 1) * SW, hz - arr[j] * SH * base); sx.lineTo(SW, hz); sx.fill(); }
        ridge(m1, "rgba(118,96,130,.85)", 1.3); ridge(m2, "rgba(86,70,104,.95)", 1);
        var sea = sx.createLinearGradient(0, hz, 0, SH);
        sea.addColorStop(0, "#d9957a"); sea.addColorStop(.18, "#6f7290"); sea.addColorStop(.6, "#33506f"); sea.addColorStop(1, "#1b3149");
        sx.fillStyle = sea; sx.fillRect(0, hz, SW, SH - hz);
        for (var w = 0; w < 46; w++) {
          var yy = hz + Math.pow(w / 46, 1.7) * (SH - hz), a = .05 + .05 * (w / 46);
          sx.strokeStyle = "rgba(255,230,210," + a + ")"; sx.lineWidth = .6 + w / 30;
          sx.beginPath(); for (var X = 0; X <= SW; X += 24) sx.lineTo(X, yy + Math.sin(X * .02 + t * (.6 + w * .02) + w) * (1 + w * .08)); sx.stroke();
        }
        for (var k = 0; k < 260; k++) {
          var r = ((k * 0.6180339) % 1), y2 = hz + 3 + Math.pow(r, 1.6) * (SH - hz) * .9;
          var spread = 30 + (y2 - hz) * 1.1, x2 = sunX + Math.sin(k * 12.9898) * spread;
          var fl = .5 + .5 * Math.sin(t * 3.1 + k * 1.7);
          sx.fillStyle = "rgba(255,236,200," + (fl * .75 * (1 - r * .6)) + ")";
          sx.fillRect(x2, y2, 6 + 14 * r * fl, 1 + r * 1.5);
        }
        var fx = ((t * 7) % (SW + 240)) - 120, fy = hz + 4;
        sx.fillStyle = "rgba(40,36,52,.85)"; sx.fillRect(fx, fy - 5, 46, 6); sx.fillStyle = "rgba(235,225,220,.8)"; sx.fillRect(fx + 10, fy - 11, 22, 6); sx.fillRect(fx + 18, fy - 15, 6, 4);
        seaTex.needsUpdate = true;
      }
      drawSea(0);
      var outside = new THREE.Mesh(new THREE.PlaneGeometry(18, 9), new THREE.MeshBasicMaterial({ map: seaTex, toneMapped: false }));
      outside.position.set(0, 2.1, -8); scene.add(outside);

      // back wall with a window hole
      var WX = 2.1, WY0 = .92, WY1 = 2.95, wz = -2.6;
      var shape = new THREE.Shape(); shape.moveTo(-7, -1); shape.lineTo(7, -1); shape.lineTo(7, 5); shape.lineTo(-7, 5); shape.lineTo(-7, -1);
      var hole = new THREE.Path(); hole.moveTo(-WX, WY0); hole.lineTo(WX, WY0); hole.lineTo(WX, WY1); hole.lineTo(-WX, WY1); hole.lineTo(-WX, WY0); shape.holes.push(hole);
      var wall = new THREE.Mesh(new THREE.ShapeGeometry(shape), new THREE.MeshStandardMaterial({ color: 0x9a7a60, roughness: .95 }));
      wall.position.z = wz; wall.receiveShadow = true; scene.add(wall);
      var frameMat = new THREE.MeshStandardMaterial({ color: 0xf1e8dc, roughness: .6 });
      function box(w, h, d, x, y, z, mat) { var m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat || frameMat); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; scene.add(m); return m; }
      var ft = .07;
      box(2 * WX + 2 * ft, ft, .14, 0, WY1 + ft / 2, wz); box(ft, WY1 - WY0, .14, -WX - ft / 2, (WY0 + WY1) / 2, wz); box(ft, WY1 - WY0, .14, WX + ft / 2, (WY0 + WY1) / 2, wz);
      box(.045, WY1 - WY0, .08, 0, (WY0 + WY1) / 2, wz); box(2 * WX, .04, .08, 0, WY0 + (WY1 - WY0) * .72, wz);
      box(2 * WX + .3, .05, .32, 0, WY0 - .025, wz + .1, new THREE.MeshStandardMaterial({ color: 0xe6dccd, roughness: .5 }));
      // potted herb on the sill
      var pot = new THREE.Mesh(new THREE.CylinderGeometry(.09, .07, .14, 20), new THREE.MeshStandardMaterial({ color: 0xa4573a, roughness: .8 }));
      pot.position.set(-1.6, WY0 + .07, wz + .1); pot.castShadow = true; scene.add(pot);
      var leafMat = new THREE.MeshStandardMaterial({ color: 0x4f7a3a, roughness: .7 });
      for (i = 0; i < 26; i++) { var lf = new THREE.Mesh(new THREE.SphereGeometry(.035, 8, 6), leafMat); lf.scale.set(1, .45, .6); lf.position.set(-1.6 + R(-.09, .09), WY0 + .17 + R(0, .14), wz + .1 + R(-.06, .06)); lf.rotation.set(R(0, 3), R(0, 3), R(0, 3)); lf.castShadow = true; scene.add(lf); }
      var floor = new THREE.Mesh(new THREE.PlaneGeometry(20, 20), new THREE.MeshStandardMaterial({ color: 0x2a1d15, roughness: 1 }));
      floor.rotation.x = -Math.PI / 2; floor.position.y = -.01; scene.add(floor);

      // table
      var wt = woodTex(); wt.repeat.set(2.2, 1.3);
      var table = new THREE.Mesh(new THREE.BoxGeometry(2.6, .06, 1.5), new THREE.MeshStandardMaterial({ map: wt, roughness: .62, bumpMap: wt, bumpScale: .004 }));
      table.position.set(0, .72, .15); table.receiveShadow = true; table.castShadow = true; scene.add(table);
      var TOP = .75;

      // plate group (1 unit = 10 cm, scaled down)
      var plate = new THREE.Group(); plate.scale.setScalar(.1); plate.position.set(0, TOP, .3); scene.add(plate);
      var prof = [[0, .0], [.9, 0], [1.0, .025], [1.22, .1], [1.32, .13], [1.33, .145], [1.27, .14], [1.12, .085], [.95, .05], [0, .045]].map(function (p) { return new THREE.Vector2(p[0], p[1]); });
      var dish = new THREE.Mesh(new THREE.LatheGeometry(prof, 64), new THREE.MeshStandardMaterial({ color: 0xf6f2ea, roughness: .22, metalness: 0 }));
      dish.castShadow = true; dish.receiveShadow = true; plate.add(dish);
      var bread = new THREE.Mesh(new THREE.SphereGeometry(.72, 48, 24), new THREE.MeshStandardMaterial({ map: breadTex(), roughness: .85 }));
      bread.scale.set(1, .22, .9); bread.position.set(-.18, .2, -.05); bread.castShadow = true; bread.receiveShadow = true; plate.add(bread);
      for (i = 0; i < 10; i++) {
        var c1 = cevap(), zz, yy, xx = -.2 + R(-.05, .05);
        if (i < 5) { zz = -.4 + i * .2; yy = .45; }
        else if (i < 9) { zz = -.3 + (i - 5) * .2; yy = .6; xx += .04; }
        else { zz = .55; yy = .14; xx = .1; c1.rotation.z = .02; }
        c1.position.set(xx, yy, zz); c1.rotation.y = R(-.1, .1) + (i == 9 ? .5 : 0); plate.add(c1);
      }
      var onionMat = new THREE.MeshStandardMaterial({ color: 0xf2ecd9, roughness: .45 });
      var onionG = new THREE.BoxGeometry(.045, .035, .045);
      for (i = 0; i < 110; i++) { var o = new THREE.Mesh(onionG, onionMat); var rr = Math.sqrt(Math.random()) * .26, an = R(0, 6.28); o.position.set(.74 + Math.cos(an) * rr, .07 + (.26 - rr) * .45 + R(0, .03), .42 + Math.sin(an) * rr); o.rotation.set(R(0, 3), R(0, 3), R(0, 3)); o.castShadow = true; plate.add(o); }
      var ajG = new THREE.SphereGeometry(.26, 32, 16), ap = ajG.attributes.position, av = new THREE.Vector3();
      for (i = 0; i < ap.count; i++) { av.fromBufferAttribute(ap, i); var kk = 1 + .12 * Math.sin(av.x * 18) * Math.cos(av.z * 15) + R(-.03, .03); ap.setXYZ(i, av.x * kk, av.y, av.z * kk); }
      ajG.computeVertexNormals();
      var ajvar = new THREE.Mesh(ajG, new THREE.MeshStandardMaterial({ color: 0x8a1f0c, roughness: .6 }));
      ajvar.scale.set(1, .2, .8); ajvar.position.set(.8, .07, -.4); plate.add(ajvar);
      // steam
      var steamTex = softTex("rgba(255,255,255,.55)", "rgba(255,255,255,0)"), steam = [];
      for (i = 0; i < 9; i++) { var sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: steamTex, transparent: true, opacity: 0, depthWrite: false })); sp.userData = { o: R(0, 1), x: R(-.05, .05), z: R(-.04, .04) }; scene.add(sp); steam.push(sp); }

      // lights
      scene.add(new THREE.HemisphereLight(0xffd6b0, 0x2a1a10, .32));
      var sconce = new THREE.PointLight(0xffb070, .8, 3.5, 2); sconce.position.set(-2.8, 2.2, -2.2); scene.add(sconce);
      var sconce2 = sconce.clone(); sconce2.position.x = 2.8; scene.add(sconce2);
      var sun = new THREE.DirectionalLight(0xffb27a, 2.1); sun.position.set(1.4, 3.2, -6); sun.target = plate; sun.castShadow = true;
      sun.shadow.mapSize.set(mobile ? 1024 : 2048, mobile ? 1024 : 2048); sun.shadow.camera.left = -2; sun.shadow.camera.right = 2; sun.shadow.camera.top = 2; sun.shadow.camera.bottom = -2; sun.shadow.camera.near = 1; sun.shadow.camera.far = 14; sun.shadow.bias = -.0006; sun.shadow.radius = 3;
      scene.add(sun);
      var lamp = new THREE.PointLight(0xffc98a, .9, 4, 2); lamp.position.set(-.6, 1.9, 1.1); scene.add(lamp);
      var fill = new THREE.DirectionalLight(0xbcd2ff, .25); fill.position.set(-2, 2, 3); scene.add(fill);

      var W = 0, H = 0, portrait = false;
      function size() { W = stage.clientWidth; H = stage.clientHeight; portrait = W / H < 1; renderer.setSize(W, H, false); cam.aspect = W / H; cam.fov = portrait ? 64 : 42; cam.updateProjectionMatrix(); }
      size(); window.addEventListener("resize", size);

      var A = { p: new THREE.Vector3(), l: new THREE.Vector3() }, mx = 0, my = 0, tmx = 0, tmy = 0;
      stage.addEventListener("pointermove", function (e) { var r = stage.getBoundingClientRect(); tmx = (e.clientX - r.left) / r.width - .5; tmy = (e.clientY - r.top) / r.height - .5; });
      var on = true, clock = 0, last = 0, prog = 0;
      new IntersectionObserver(function (es) { on = es[0].isIntersecting; if (on) req(); }).observe(hero);
      function progress() { var r = hero.getBoundingClientRect(), span = hero.offsetHeight - window.innerHeight; return clamp(-r.top / Math.max(1, span), 0, 1); }
      var running = false;
      function req() { if (!running) { running = true; requestAnimationFrame(loop); } }
      function loop(ts) {
        running = false; if (!on || document.hidden) return;
        var dt = Math.min(.05, (ts - (last || ts)) / 1000); last = ts; clock += dt;
        var p = progress(); prog += (p - prog) * .12; var e = ease(clamp(prog / .85, 0, 1));
        hero.style.setProperty("--p", prog.toFixed(3));
        mx += (tmx - mx) * .05; my += (tmy - my) * .05;
        var p0 = portrait ? [0, 1.6, 2.9] : [0, 1.62, 2.35], l0 = [0, 1.85, -3];
        var p1 = portrait ? [0, 1.12, .92] : [.04, 1.06, .74], l1 = [0, .76, .3];
        A.p.set(p0[0] + (p1[0] - p0[0]) * e + mx * .25 * (1 - e * .6), p0[1] + (p1[1] - p0[1]) * e - my * .12, p0[2] + (p1[2] - p0[2]) * e);
        A.l.set(l0[0] + (l1[0] - l0[0]) * e, l0[1] + (l1[1] - l0[1]) * e, l0[2] + (l1[2] - l0[2]) * e);
        cam.position.copy(A.p); cam.lookAt(A.l);
        if ((clock * 30 | 0) % 2 === 0) drawSea(clock);
        for (var s = 0; s < steam.length; s++) {
          var st = steam[s], q = (clock * .22 + st.userData.o) % 1;
          st.position.set(st.userData.x + Math.sin(clock + s) * .02, TOP + .05 + q * .28, .3 + st.userData.z);
          st.scale.setScalar(.06 + q * .14); st.material.opacity = Math.sin(q * Math.PI) * .22 * (.3 + .7 * e);
        }
        lamp.intensity = .8 + .2 * e;
        renderer.render(scene, cam);
        req();
      }
      hero.classList.add("hero--on"); req();
      window.addEventListener("scroll", req, { passive: true });
    }

    /* ======================= GRILL BAND ======================= */
    function initGrill() {
      var band = document.getElementById("zar"), canvas = document.getElementById("grill3d");
      if (!band || !canvas) return;
      var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: !mobile, alpha: false, powerPreference: "high-performance" });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 2));
      renderer.outputEncoding = THREE.sRGBEncoding; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.15;
      var scene = new THREE.Scene(); scene.background = new THREE.Color(0x0c0907); scene.fog = new THREE.Fog(0x0c0907, 5, 11);
      var cam = new THREE.PerspectiveCamera(38, 1, .05, 40);

      // firebox
      var steel = new THREE.MeshStandardMaterial({ color: 0x1b1918, roughness: .55, metalness: .85 });
      function box(w, h, d, x, y, z, m) { var b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m || steel); b.position.set(x, y, z); scene.add(b); return b; }
      box(3.6, .06, 1.9, 0, -.62, 0); box(3.6, .6, .06, 0, -.33, .95); box(3.6, .6, .06, 0, -.33, -.95); box(.06, .6, 1.9, -1.8, -.33, 0); box(.06, .6, 1.9, 1.8, -.33, 0);
      // coals
      var coalG = new THREE.DodecahedronGeometry(.1, 0);
      var hotMat = new THREE.MeshStandardMaterial({ color: 0x1a1210, roughness: .9, emissive: 0xff4a10, emissiveIntensity: 1.4 });
      var ashMat = new THREE.MeshStandardMaterial({ color: 0x2b2522, roughness: 1, emissive: 0x5a1a06, emissiveIntensity: .35 });
      function coals(mat, n, yb) {
        var im = new THREE.InstancedMesh(coalG, mat, n), d = new THREE.Object3D();
        for (var i = 0; i < n; i++) { d.position.set(R(-1.7, 1.7), yb + R(0, .14), R(-.85, .85)); d.rotation.set(R(0, 3), R(0, 3), R(0, 3)); var s = R(.6, 1.35); d.scale.set(s, s * R(.6, 1), s); d.updateMatrix(); im.setMatrixAt(i, d.matrix); }
        scene.add(im); return im;
      }
      coals(ashMat, mobile ? 220 : 360, -.58); coals(hotMat, mobile ? 160 : 260, -.5);
      var glowTex = softTex("rgba(255,140,40,1)", "rgba(255,60,0,0)");
      var glow = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 2.4), new THREE.MeshBasicMaterial({ map: glowTex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: .8 }));
      glow.rotation.x = -Math.PI / 2; glow.position.y = -.32; scene.add(glow);
      // grate
      var bar = new THREE.CylinderGeometry(.016, .016, 3.5, 8);
      for (var i = 0; i < 24; i++) { var b2 = new THREE.Mesh(bar, steel); b2.rotation.z = Math.PI / 2; b2.position.set(0, 0, -.86 + i * .075); scene.add(b2); }
      // ćevapi on the grate
      var cev = [];
      for (var r = 0; r < 5; r++) for (var c = 0; c < 2; c++) {
        var m = cevap(); m.scale.set(R(1.05, 1.2), 1.1, 1.1); m.position.set((c ? .72 : -.72) + R(-.06, .06), .14, -.6 + r * .3 + R(-.02, .02)); m.rotation.y = R(-.08, .08); scene.add(m); cev.push(m);
      }
      // flames: fbm shader billboards
      var flameMat = function (seed) {
        return new THREE.ShaderMaterial({
          transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
          uniforms: { uT: { value: 0 }, uS: { value: seed }, uI: { value: 1 } },
          vertexShader: "varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}",
          fragmentShader: [
            "varying vec2 vUv;uniform float uT,uS,uI;",
            "float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}",
            "float n(vec2 p){vec2 i=floor(p),f=fract(p);vec2 u=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),u.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),u.x),u.y);}",
            "float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<5;i++){v+=a*n(p);p*=2.03;a*=.5;}return v;}",
            "void main(){vec2 uv=vUv;float t=uT*1.6+uS*10.;",
            " float f=fbm(vec2(uv.x*3.2+uS,uv.y*2.6-t));float f2=fbm(vec2(uv.x*6.+uS*3.,uv.y*5.-t*1.7));",
            " float x=uv.x-.5+(f-.5)*.42*uv.y+(f2-.5)*.08;",
            " float w=mix(.34,.02,pow(uv.y,.8));",
            " float body=1.-smoothstep(w*.15,w,abs(x));",
            " float fade=(1.-smoothstep(.25,1.,uv.y+f*.45))*smoothstep(.0,.06,uv.y);",
            " float k=body*fade*(.55+f*.9)*uI;",
            " vec3 c=mix(vec3(.55,.06,.0),vec3(1.,.36,.03),smoothstep(.12,.5,k));",
            " c=mix(c,vec3(1.,.78,.38),smoothstep(.55,.95,k));c=mix(c,vec3(1.,.95,.8),smoothstep(.95,1.3,k));",
            " gl_FragColor=vec4(c*k*2.3,clamp(k,0.,1.));}"
          ].join("\n")
        });
      };
      var flames = [], fg = new THREE.PlaneGeometry(1, 1);
      var nF = mobile ? 16 : 26;
      for (i = 0; i < nF; i++) {
        var fm = new THREE.Mesh(fg, flameMat(R(0, 10))); var sz = R(.6, 1.25);
        fm.scale.set(sz * .7, sz * 1.25, 1); fm.position.set(R(-1.6, 1.6), -.3 + sz * .55, -.75 + (i % 6) * .3 + R(-.05, .05)); fm.userData.b = fm.position.y; flames.push(fm); scene.add(fm);
      }
      // smoke
      var smokeTex = softTex("rgba(200,195,190,.6)", "rgba(200,195,190,0)"), smoke = [];
      for (i = 0; i < (mobile ? 10 : 18); i++) { var sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: smokeTex, transparent: true, depthWrite: false, opacity: 0 })); sp.userData = { o: R(0, 1), x: R(-1.4, 1.4), z: R(-.6, .6) }; scene.add(sp); smoke.push(sp); }

      // lights: fire from below, warm key, cool rim
      scene.add(new THREE.AmbientLight(0x3a2a20, .5));
      var fire = new THREE.PointLight(0xff6a1a, 3.2, 5, 2); fire.position.set(0, -.2, 0); scene.add(fire);
      var fire2 = new THREE.PointLight(0xffa040, 1.6, 4, 2); fire2.position.set(.9, .05, .3); scene.add(fire2);
      var key = new THREE.DirectionalLight(0xffd2a0, .9); key.position.set(-1.5, 3, 2.5); scene.add(key);
      var rim = new THREE.DirectionalLight(0x8fb0ff, .45); rim.position.set(1, 2, -3); scene.add(rim);

      var W = 0, H = 0;
      function size() { W = band.clientWidth; H = band.clientHeight; renderer.setSize(W, H, false); cam.aspect = W / H; cam.fov = W / H < 1 ? 58 : 38; cam.updateProjectionMatrix(); }
      size(); window.addEventListener("resize", size);
      var tmx = 0, tmy = 0, mx = 0, my = 0, burst = 0;
      band.addEventListener("pointermove", function (e) { var r = band.getBoundingClientRect(); tmx = (e.clientX - r.left) / r.width - .5; tmy = (e.clientY - r.top) / r.height - .5; });
      band.addEventListener("pointerdown", function () { burst = 1; });
      var on = false, clock = 0, last = 0, running = false;
      new IntersectionObserver(function (es) { on = es[0].isIntersecting; if (on) req(); }, { rootMargin: "100px" }).observe(band);
      function req() { if (!running) { running = true; requestAnimationFrame(loop); } }
      function loop(ts) {
        running = false; if (!on || document.hidden) return;
        var dt = Math.min(.05, (ts - (last || ts)) / 1000); last = ts; clock += dt;
        mx += (tmx - mx) * .04; my += (tmy - my) * .04; burst *= .96;
        var r = band.getBoundingClientRect(), vp = clamp(1 - (r.top + r.height) / (window.innerHeight + r.height), 0, 1);
        var portrait = W / H < 1;
        cam.position.set(Math.sin(clock * .12) * .25 + mx * .8, (portrait ? 3.1 : 2.45) - vp * .5 - my * .3, (portrait ? 3.9 : 3.5) - vp * .4);
        cam.lookAt(0, -.05, 0);
        var fl = .85 + .15 * Math.sin(clock * 13.1) * Math.sin(clock * 7.3) + .1 * Math.sin(clock * 23.7);
        fire.intensity = 3.2 * fl + burst * 3; fire2.intensity = 1.6 * (2 - fl) * .6 + burst; hotMat.emissiveIntensity = 1.2 + .35 * fl + burst;
        glow.material.opacity = .65 + .2 * fl + burst * .3;
        for (var i = 0; i < flames.length; i++) {
          var f = flames[i]; f.material.uniforms.uT.value = clock; f.material.uniforms.uI.value = .9 + .25 * Math.sin(clock * 3 + i) + burst * .8;
          f.quaternion.copy(cam.quaternion); f.scale.y = (f.scale.x / .7) * 1.25 * (1 + burst * .6);
        }
        for (i = 0; i < smoke.length; i++) {
          var s = smoke[i], q = (clock * .09 + s.userData.o) % 1;
          s.position.set(s.userData.x + Math.sin(clock * .7 + i) * .15 * q, .25 + q * 2.2, s.userData.z - q * .3);
          s.scale.setScalar(.35 + q * 1.4); s.material.opacity = Math.sin(q * Math.PI) * .1;
        }
        for (i = 0; i < cev.length; i++) cev[i].position.y = .14 + Math.sin(clock * 20 + i * 3) * .0015;
        renderer.render(scene, cam);
        req();
      }
      band.classList.add("g3"); req();
    }

    try { initRoom(); } catch (e) { if (hero) hero.classList.remove("hero--3d"); console && console.warn && console.warn(e); }
    try { initGrill(); } catch (e) { console && console.warn && console.warn(e); }
  });
})();
