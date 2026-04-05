let currentOnClose = null;

const getModalRoot = () => document.querySelector('#modal-root');

const onEscape = (event) => {
  if (event.key === 'Escape') {
    closeModal();
  }
};

export const closeModal = () => {
  const modalRoot = getModalRoot();

  if (!modalRoot) {
    return;
  }

  if (typeof currentOnClose === 'function') {
    currentOnClose();
  }

  currentOnClose = null;
  modalRoot.innerHTML = '';
  document.body.classList.remove('is-modal-open');
  document.removeEventListener('keydown', onEscape);
};

export const openModal = ({ title, description = '', body = '', footer = '', size = 'medium', onMount }) => {
  const modalRoot = getModalRoot();

  if (!modalRoot) {
    return;
  }

  closeModal();

  modalRoot.innerHTML = `
    <div class="modal-overlay" data-modal-overlay>
      <div class="modal-card modal-${size}" role="dialog" aria-modal="true" aria-label="${title}">
        <div class="modal-header">
          <div>
            <p class="eyebrow">${description}</p>
            <h3>${title}</h3>
          </div>
          <button type="button" class="icon-button" data-modal-close aria-label="Close modal">
            <span></span>
          </button>
        </div>
        <div class="modal-body">${body}</div>
        <div class="modal-footer">${footer}</div>
      </div>
    </div>
  `;

  document.body.classList.add('is-modal-open');
  document.addEventListener('keydown', onEscape);

  modalRoot.querySelectorAll('[data-modal-close]').forEach((button) => {
    button.addEventListener('click', closeModal);
  });

  const overlay = modalRoot.querySelector('[data-modal-overlay]');

  overlay?.addEventListener('click', (event) => {
    if (event.target === overlay) {
      closeModal();
    }
  });

  if (typeof onMount === 'function') {
    currentOnClose = onMount({
      modalRoot,
      closeModal,
      modalBody: modalRoot.querySelector('.modal-body'),
    });
  }
};

export const confirmAction = ({
  title,
  description = 'Please confirm this action',
  message,
  confirmText = 'Confirm',
  confirmVariant = 'danger',
}) =>
  new Promise((resolve) => {
    let resolved = false;

    openModal({
      title,
      description,
      body: `<p class="modal-message">${message}</p>`,
      footer: `
        <button type="button" class="button button-ghost" data-cancel-action>Cancel</button>
        <button type="button" class="button button-${confirmVariant}" data-confirm-action>${confirmText}</button>
      `,
      size: 'small',
      onMount: ({ modalRoot }) => {
        modalRoot.querySelector('[data-cancel-action]')?.addEventListener('click', () => {
          resolved = true;
          closeModal();
          resolve(false);
        });

        modalRoot.querySelector('[data-confirm-action]')?.addEventListener('click', () => {
          resolved = true;
          closeModal();
          resolve(true);
        });

        return () => {
          if (!resolved) {
            resolve(false);
          }
        };
      },
    });
  });
