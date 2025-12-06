// <!-- ====== Script Mobile Menu ====== -->
(() => {
    const btn = document.querySelector('.burger');
    const header = document.getElementById('myHeader');
    const menu = document.getElementById('mobileMenu');
    if (!btn || !header || !menu) return;

    // Tie button to menu for a11y
    btn.setAttribute('aria-controls', 'mobileMenu');

    function setHeaderVars() {
        const rect = header.getBoundingClientRect();
        document.documentElement.style.setProperty('--header-h', rect.height + 'px');
        document.documentElement.style.setProperty('--header-bottom', rect.bottom + 'px');
    }
    setHeaderVars();
    window.addEventListener('resize', setHeaderVars, { passive: true });
    window.addEventListener('scroll', setHeaderVars, { passive: true });

    // Open/close
    function render(open) {
        if (open) setHeaderVars();
        btn.classList.toggle('is-open', open);
        btn.setAttribute('aria-expanded', String(open));
        btn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');

        if (open) {
            menu.hidden = false;
            menu.classList.add('is-open');
            // Optional: put focus on first link for keyboard users
            const firstLink = menu.querySelector('a');
            firstLink && firstLink.focus({ preventScroll: true });
            document.addEventListener('keydown', onKeydown);
            document.addEventListener('click', onDocClick);
        } else {
            menu.classList.remove('is-open');
            // Delay applying hidden until transition ends (prevents jump)
            menu.addEventListener('transitionend', () => (menu.hidden = true), { once: true });
            document.removeEventListener('keydown', onKeydown);
            document.removeEventListener('click', onDocClick);
        }
    }

    function toggle() {
        const open = !btn.classList.contains('is-open');
        render(open);
    }

    function onKeydown(e) {
        if (e.key === 'Escape') render(false);
    }

    function onDocClick(e) {
        // Close if clicking outside the menu and not on the burger
        if (!menu.contains(e.target) && !btn.contains(e.target)) {
            render(false);
        }
    }

    // Click & keyboard on the burger
    btn.addEventListener('click', toggle);
    btn.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggle();
        }
    });

    // Close menu when a link is chosen
    menu.addEventListener('click', (e) => {
        const a = e.target.closest('a');
        if (a) render(false);
    });
})();