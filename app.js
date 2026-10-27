(function () {
  "use strict";

  var app = document.getElementById("app");
  var PLACEHOLDER = "images/placeholder.svg";
  var risers = [];

  function el(tag, opts, children) {
    var node = document.createElement(tag);
    opts = opts || {};
    if (opts.cls) node.className = opts.cls;
    if (opts.text != null) node.textContent = opts.text;
    if (opts.href) node.setAttribute("href", opts.href);
    if (opts.attrs) {
      Object.keys(opts.attrs).forEach(function (k) { node.setAttribute(k, opts.attrs[k]); });
    }
    (children || []).forEach(function (c) { if (c) node.appendChild(c); });
    return node;
  }

  function uniq(list) {
    return Array.from(new Set(list.filter(Boolean))).sort();
  }

  function lengthText(r) {
    return r.length_in && r.length_in.length ? r.length_in.join(", ") + "\"" : "—";
  }

  function imgFor(r, i) {
    var src = (r.images && r.images[i || 0]) || PLACEHOLDER;
    var img = el("img", { attrs: { src: src, alt: r.brand + " " + r.model + " riser", loading: "lazy" } });
    img.onerror = function () { img.onerror = null; img.src = PLACEHOLDER; };
    return img;
  }

  /* ---------- List view ---------- */
  function renderList() {
    app.textContent = "";
    app.appendChild(el("h1", { text: "Risers" }));
    app.appendChild(el("p", { cls: "sub", text: "Browse risers by brand, material and length." }));

    var search = el("input", { attrs: { type: "search", placeholder: "Search brand or model…", "aria-label": "Search" } });
    var brand = el("select", { attrs: { "aria-label": "Brand" } });
    var material = el("select", { attrs: { "aria-label": "Material" } });
    var sort = el("select", { attrs: { "aria-label": "Sort" } });
    var type = el("select", { attrs: { "aria-label": "Bow type" } });

    function fill(sel, label, values) {
      sel.appendChild(el("option", { text: label, attrs: { value: "" } }));
      values.forEach(function (v) { sel.appendChild(el("option", { text: v, attrs: { value: v } })); });
    }
    fill(brand, "All brands", uniq(risers.map(function (r) { return r.brand; })));
    fill(material, "All materials", uniq(risers.map(function (r) { return r.material; })));
    fill(type, "All bow types", uniq(risers.map(function (r) { return r.bow_type; })));
    sort.appendChild(el("option", { text: "Sort: Brand", attrs: { value: "brand" } }));
    sort.appendChild(el("option", { text: "Sort: Model", attrs: { value: "model" } }));

    app.appendChild(el("div", { cls: "filters" }, [search, type, brand, material, sort]));
    var count = el("div", { cls: "count" });
    var grid = el("div", { cls: "grid" });
    app.appendChild(count);
    app.appendChild(grid);
    

    function update() {
      var q = search.value.trim().toLowerCase();
      var out = risers.filter(function (r) {
        if (brand.value && r.brand !== brand.value) return false;
        if (material.value && r.material !== material.value) return false;
        if (q && (r.brand + " " + r.model).toLowerCase().indexOf(q) === -1) return false;
        if (type.value && r.bow_type !== type.value) return false;
        return true;
      });
      out.sort(function (a, b) {
        var k = sort.value;
        return (a[k] + a.model).localeCompare(b[k] + b.model);
      });
      grid.textContent = "";
      count.textContent = out.length + " riser" + (out.length === 1 ? "" : "s");
      if (!out.length) {
        grid.appendChild(el("p", { cls: "empty", text: "No risers match your filters." }));
        return;
      }
      out.forEach(function (r) {
        var body = el("div", { cls: "body" }, [
          el("div", { cls: "brand", text: r.brand }),
          el("div", { cls: "model", text: r.model }),
          el("div", { cls: "meta", text: [r.years, r.material, lengthText(r)].filter(function (x) { return x && x !== "—"; }).join(" · ") }),
          badgesFor(r)
        ]);
        grid.appendChild(el("a", { cls: "card", href: "#/riser/" + encodeURIComponent(r.id) }, [imgFor(r), body]));
      });
    }
    [search, type, brand, material, sort].forEach(function (c) {
      c.addEventListener("input", update);
      c.addEventListener("change", update);
      
    });
    update();
  }

  /* ---------- Detail view ---------- */
  function row(label, valueNode) {
    return el("tr", {}, [el("th", { text: label }), el("td", {}, [valueNode])]);
  }
  function textNode(t) { return el("span", { text: t || "—" }); }

  function renderDetail(id) {
    var r = risers.filter(function (x) { return x.id === id; })[0];
    app.textContent = "";
    if (!r) {
      app.appendChild(el("a", { cls: "back", href: "#/", text: "← All risers" }));
      app.appendChild(el("p", { cls: "empty", text: "Riser not found." }));
      return;
    }
    document.title = r.brand + " " + r.model + " – Riser Index";

    var main = imgFor(r, 0);
    var gallery = el("div", { cls: "gallery" }, [main]);
    if (r.images && r.images.length > 1) {
      var thumbs = el("div", { cls: "thumbs" });
      r.images.forEach(function (_, i) {
        var t = imgFor(r, i);
        t.addEventListener("click", function () { main.src = t.src; });
        thumbs.appendChild(t);
      });
      gallery.appendChild(thumbs);
    }

    var colours = r.colours && r.colours.length
      ? el("div", { cls: "chips" }, r.colours.map(function (c) { return el("span", { cls: "chip", text: c }); }))
      : textNode("");

    var info = el("div", {}, [
      el("div", { cls: "brand", text: r.brand }),
      el("h1", { text: r.model }),
      badgesFor(r),
      el("table", { cls: "specs" }, [
        row("Brand", textNode(r.brand)),
        row("Model", textNode(r.model)),
        row("Years", textNode(r.years)),
        row("Colours", colours),
        row("Length", textNode(lengthText(r))),
        row("Material", textNode(r.material)),
        row("Limb fitting", textNode(r.fitting)),
        row("Notes", textNode(r.notes))
      ])
    ]);

    app.appendChild(el("a", { cls: "back", href: "#/", text: "← All risers" }));
    app.appendChild(el("div", { cls: "detail" }, [gallery, info]));
  }

  /* ---------- Routing ---------- */
  function route() {
    var m = location.hash.match(/^#\/riser\/(.+)$/);
    document.title = "Riser Index – Risers Index Database";
    if (m) renderDetail(decodeURIComponent(m[1]));
    else renderList();
    window.scrollTo(0, 0);
  }

  fetch("data/risers.json")
    .then(function (res) {
      if (!res.ok) throw new Error("HTTP " + res.status);
      return res.json();
    })
    .then(function (data) {
      risers = data;
      window.addEventListener("hashchange", route);
      route();
    })
    .catch(function (err) {
      app.textContent = "";
      app.appendChild(el("p", {
        cls: "empty",
        text: "Could not load data/risers.json (" + err.message + "). If you opened index.html directly, serve the folder with a local web server instead (see README)."
      }));
    });

  function badgesFor(r) {
    var wrap = el("div", { cls: "badges" });
    wrap.appendChild(el("span", { cls: "badge tag", text: r.bow_type }));
    (r.tags || []).forEach(function (t) {
      wrap.appendChild(el("span", { cls: "badge tag", text: t }));
    });
    /* if (!r.verified) wrap.appendChild(el("span", { cls: "badge", text: "Unverified" })); */
    return wrap;
  }

})();


