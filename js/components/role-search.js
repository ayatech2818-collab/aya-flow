/* RoleSearch — combobox that finds a role in any system and reveals it. */
(function () {
  "use strict";
  const { icon, esc } = window.OrgChart;

  /**
   * @param {HTMLElement} mount
   * @param {object} model
   * @param {(result:object)=>void} onPick
   * @param {(query:string)=>void} onQuery  live highlight in the open tree
   */
  function RoleSearch(mount, model, onPick, onQuery) {
    mount.classList.add("search");
    mount.innerHTML = `
      <label class="search__field">
        ${icon("search", 17)}
        <span class="sr-only">Search roles</span>
        <input type="search" placeholder="Search roles or duties…" autocomplete="off" spellcheck="false"
          role="combobox" aria-expanded="false" aria-controls="search-results" aria-autocomplete="list" />
        <kbd class="search__kbd" aria-hidden="true">/</kbd>
      </label>
      <ul class="search__results" id="search-results" role="listbox" hidden></ul>`;
    const input = mount.querySelector("input");
    const list = mount.querySelector(".search__results");
    let results = [];
    let active = -1;

    function highlight(text, q) {
      const i = text.toLowerCase().indexOf(q);
      if (i < 0 || !q) return esc(text);
      return esc(text.slice(0, i)) + "<mark>" + esc(text.slice(i, i + q.length)) + "</mark>" + esc(text.slice(i + q.length));
    }

    function render() {
      const q = input.value.trim().toLowerCase();
      results = model.search(q);
      active = results.length ? 0 : -1;
      if (!q) {
        list.hidden = true;
        input.setAttribute("aria-expanded", "false");
        return;
      }
      list.innerHTML = results.length
        ? results
            .map((r, i) => {
              const s = model.systemById[r.systemId];
              const duty = r.viaDuty
                ? (model.roles[r.roleId].responsibilities || []).find((d) => d.toLowerCase().includes(q))
                : null;
              return `<li role="option" id="sr-${i}" class="search__item${i === active ? " is-active" : ""}" data-i="${i}" aria-selected="${i === active}">
                <span class="search__badge theme-${s.theme}">${esc(s.name)}</span>
                <span class="search__text">
                  <span class="search__title">${highlight(r.title, q)}</span>
                  <span class="search__trail">${r.trail.slice(0, -1).map(esc).join(" › ") || "Top level"}${r.alsoCount ? ` · +${r.alsoCount} more ${r.alsoCount === 1 ? "position" : "positions"}` : ""}</span>
                  ${duty ? `<span class="search__duty">Duty: ${highlight(duty, q)}</span>` : ""}
                </span>
              </li>`;
            })
            .join("")
        : `<li class="search__none">No roles match “${esc(input.value.trim())}”.</li>`;
      list.hidden = false;
      input.setAttribute("aria-expanded", "true");
      input.setAttribute("aria-activedescendant", active >= 0 ? `sr-${active}` : "");
    }

    function setActive(i) {
      if (!results.length) return;
      active = (i + results.length) % results.length;
      list.querySelectorAll(".search__item").forEach((li, j) => {
        li.classList.toggle("is-active", j === active);
        li.setAttribute("aria-selected", String(j === active));
        if (j === active) li.scrollIntoView({ block: "nearest" });
      });
      input.setAttribute("aria-activedescendant", `sr-${active}`);
    }

    function pick(i) {
      const r = results[i];
      if (!r) return;
      list.hidden = true;
      input.setAttribute("aria-expanded", "false");
      input.blur();
      onPick(r);
    }

    input.addEventListener("input", () => {
      render();
      onQuery(input.value.trim().toLowerCase());
    });
    input.addEventListener("focus", () => input.value.trim() && render());
    input.addEventListener("keydown", (e) => {
      if (e.key === "ArrowDown") (e.preventDefault(), setActive(active + 1));
      else if (e.key === "ArrowUp") (e.preventDefault(), setActive(active - 1));
      else if (e.key === "Enter") (e.preventDefault(), pick(active));
      else if (e.key === "Escape") {
        if (input.value) {
          input.value = "";
          onQuery("");
        }
        list.hidden = true;
        input.setAttribute("aria-expanded", "false");
      }
    });
    list.addEventListener("pointerdown", (e) => e.preventDefault()); // keep focus
    list.addEventListener("click", (e) => {
      const li = e.target.closest(".search__item");
      if (li) pick(Number(li.dataset.i));
    });
    input.addEventListener("blur", () => setTimeout(() => (list.hidden = true), 120));
    document.addEventListener("keydown", (e) => {
      if (e.key === "/" && !/input|textarea/i.test(document.activeElement?.tagName || "")) {
        e.preventDefault();
        input.focus();
      }
    });

    return {
      get query() {
        return input.value.trim().toLowerCase();
      },
    };
  }

  window.OrgChart.RoleSearch = RoleSearch;
})();
