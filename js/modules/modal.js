/**
 * modal.js
 * Fenêtre modale native <dialog>, centré sur l'écran,
 * avec piège de focus (trap focus), restauration du focus à la fermeture,
 * et gestion de la checklist par destination.
 */

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

let lastTrigger = null;

/**
 * Ouvre la modale et initialise la checklist selon la destination passée en paramètre.
 * @param {HTMLDialogElement} dialogEl - Élément <dialog>
 * @param {HTMLElement} [trigger] - Élément ayant déclenché la modale
 * @param {Object} [options] - Options supplémentaires (ex: destination, checklistData)
 */
export function openModal(dialogEl, trigger, options = {}) {
  lastTrigger = trigger || document.activeElement;

  // Injection/Gestion de la checklist si une destination ou des données sont fournies
  if (options.destination || options.checklistData) {
    renderDestinationChecklist(dialogEl, options.destination, options.checklistData);
  }

  if (typeof dialogEl.showModal === "function") {
    dialogEl.showModal();
  } else {
    // Repli pour navigateurs très anciens
    dialogEl.setAttribute("open", "");
  }

  // Centrage explicite si nécessaire
  dialogEl.style.margin = "auto";

  const focusables = dialogEl.querySelectorAll(FOCUSABLE_SELECTOR);
  focusables[0]?.focus();

  dialogEl.addEventListener("keydown", trapFocus);
  dialogEl.addEventListener("click", closeOnBackdropClick);
}

export function closeModal(dialogEl) {
  dialogEl.removeEventListener("keydown", trapFocus);
  dialogEl.removeEventListener("click", closeOnBackdropClick);
  if (dialogEl.open) dialogEl.close();
  lastTrigger?.focus();
}

/**
 * Génère et gère l'affichage de la checklist de destination dans le conteneur dédié de la modale.
 */
function renderDestinationChecklist(dialogEl, destination = "Destination", items = []) {
  let container = dialogEl.querySelector(".modal-checklist-container");

  // Si le conteneur n'existe pas dans la modale, on le crée
  if (!container) {
    container = document.createElement("div");
    container.className = "modal-checklist-container";
    const body = dialogEl.querySelector(".modal-body") || dialogEl;
    body.appendChild(container);
  }

  // Modèle d'affichage HTML de la checklist
  container.innerHTML = `
    <div class="destination-checklist">
      <h3 class="checklist-title">Checklist pour : <span class="text-gold">${destination}</span></h3>
      <ul class="checklist-items" id="checklist-list">
        ${items
          .map(
            (item, index) => `
          <li class="checklist-item">
            <label class="checklist-label">
              <input type="checkbox" data-index="${index}" ${item.completed ? "checked" : ""}>
              <span>${item.text}</span>
            </label>
          </li>
        `
          )
          .join("")}
      </ul>
      <form class="checklist-add-form" id="checklist-add-form">
        <input type="text" name="newItem" placeholder="Ajouter un élément..." required class="checklist-input">
        <button type="submit" class="btn btn--small">Ajouter</button>
      </form>
    </div>
  `;

  // Écouteur pour ajouter un nouvel élément à la liste
  const addForm = container.querySelector("#checklist-add-form");
  addForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    const input = addForm.querySelector("input[name='newItem']");
    const text = input.value.trim();
    if (!text) return;

    const ul = container.querySelector("#checklist-list");
    const li = document.createElement("li");
    li.className = "checklist-item";
    li.innerHTML = `
      <label class="checklist-label">
        <input type="checkbox">
        <span>${text}</span>
      </label>
    `;
    ul.appendChild(li);
    input.value = "";
  });
}

function trapFocus(event) {
  const dialogEl = event.currentTarget;
  if (event.key !== "Tab") return;

  const focusables = Array.from(dialogEl.querySelectorAll(FOCUSABLE_SELECTOR)).filter(
    (el) => el.offsetParent !== null
  );
  if (focusables.length === 0) return;

  const first = focusables[0];
  const last = focusables[focusables.length - 1];

  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

function closeOnBackdropClick(event) {
  const dialogEl = event.currentTarget;
  const rect = dialogEl.getBoundingClientRect();
  const clickedOutside =
    event.clientX < rect.left ||
    event.clientX > rect.right ||
    event.clientY < rect.top ||
    event.clientY > rect.bottom;
  if (clickedOutside) closeModal(dialogEl);
}