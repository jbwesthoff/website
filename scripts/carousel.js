// <!-- ====== Script Carousel ====== -->
(() => {
    const wrap = document.querySelector('[data-carousel]');
    if (!wrap) return;

    const prevBtn = wrap.querySelector('[data-prev]');
    const nextBtn = wrap.querySelector('[data-next]');

    // Optional text targets (fall back to global [data-carousel-*] if not provided)
    const tagEl = document.querySelector(wrap.dataset.tagTarget || '[data-carousel-tag]');
    const titleEl = document.querySelector(wrap.dataset.titleTarget || '[data-carousel-title]');
    const textEl = document.querySelector(wrap.dataset.textTarget || '[data-carousel-text]');

    // Collect original images as the "real" slides
    const realImgs = Array.from(wrap.querySelectorAll('img[data-tag]'));
    const N = realImgs.length;
    if (N < 1) return;

    // Build a track and move images into it (so CSS .project-image .track rules apply)
    const track = document.createElement('div');
    track.className = 'track';
    wrap.insertBefore(track, wrap.firstChild); // track sits above buttons
    realImgs.forEach(img => {
        img.classList.add('slide');
        track.appendChild(img);
    });

    // Add head/tail clones for seamless wrap
    const headClone = realImgs[0].cloneNode(true);       // clone of first
    const tailClone = realImgs[N - 1].cloneNode(true);   // clone of last
    track.insertBefore(tailClone, track.firstChild);     // [tailClone, ...real...]
    track.appendChild(headClone);                        // [...real..., headClone]

    const REAL_START = 1;       // first real slide index inside track
    const REAL_END = N;       // last real slide index inside track
    let i = REAL_START;         // current index in track-space (includes clones)
    let isAnimating = false;

    function setX(index, animated = true) {
        if (!animated) {
            const prev = track.style.transition;
            track.style.transition = 'none';
            track.style.transform = `translateX(-${index * 100}%)`;
            // force reflow, then restore transition (CSS provides default timing)
            void track.offsetWidth;
            track.style.transition = prev || '';
        } else {
            track.style.transform = `translateX(-${index * 100}%)`;
        }
    }

    function toReal(trackIndex) {
        return (trackIndex - 1 + N) % N; // 0..N-1
    }

    function syncTextFrom(realIndex) {
        const srcEl = realImgs[realIndex]; // original (non-clone)
        if (!srcEl) return;
        if (tagEl) tagEl.textContent = srcEl.dataset.tag || '';
        if (titleEl) titleEl.textContent = srcEl.dataset.title || '';
        if (textEl) textEl.textContent = srcEl.dataset.text || '';
    }

    function moveBy(step) {
        if (isAnimating) return;
        isAnimating = true;

        // Figure out which REAL slide we’re heading to (0..N-1)
        const currentReal = toReal(i);
        const intendedReal = (currentReal + (step > 0 ? 1 : -1) + N) % N;

        // ✅ Update text BEFORE the visual move begins
        syncTextFrom(intendedReal);

        // Move one step in track-space (this includes the clones)
        const target = i + step;
        setX(target, true);

        const onEnd = () => {
            track.removeEventListener('transitionend', onEnd);
            isAnimating = false;

            // If we landed on a clone, snap to the matching real slide (no animation)
            if (target === 0) {
                i = REAL_END;
                setX(i, false);
            } else if (target === REAL_END + 1) {
                i = REAL_START;
                setX(i, false);
            } else {
                i = target;
            }

            // No text update here anymore — it already matches the incoming slide.
        };

        track.addEventListener('transitionend', onEnd, { once: true });
    }

    const next = () => moveBy(1);
    const prev = () => moveBy(-1);

    // ====== AUTOPLAY (showcase until user interacts) ======
    const AUTOPLAY_MS = 3000; // change to taste
    let autoplayTimeout = null;
    let hasInteracted = false;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // precise pause/resume bookkeeping
    let remainingMs = AUTOPLAY_MS;
    let lastStartTs = 0;
    let isPaused = false;

    function clearAutoplayTimeout() {
        if (autoplayTimeout) {
            clearTimeout(autoplayTimeout);
            autoplayTimeout = null;
        }
    }

    function scheduleNext(delay) {
        clearAutoplayTimeout();
        lastStartTs = Date.now();
        autoplayTimeout = setTimeout(() => {
            if (!document.hidden && !isAnimating) next();
            // after firing, reset the “remaining” window and schedule the next one
            remainingMs = AUTOPLAY_MS;
            scheduleNext(remainingMs);
        }, Math.max(0, delay));
    }

    function startAutoplay() {
        if (prefersReducedMotion || hasInteracted || N <= 1) return;
        isPaused = false;
        // kick once right away to match your original behavior
        requestAnimationFrame(() => { if (!document.hidden && !isAnimating) next(); });
        remainingMs = AUTOPLAY_MS;
        scheduleNext(remainingMs);
    }

    function pauseAutoplay() {
        if (hasInteracted || prefersReducedMotion) return;
        if (isPaused) return;
        isPaused = true;
        // compute remaining time in current cycle and hold it
        const elapsed = Date.now() - lastStartTs;
        remainingMs = Math.max(0, remainingMs - elapsed);
        clearAutoplayTimeout();
    }

    function resumeAutoplay() {
        if (hasInteracted || prefersReducedMotion) return;
        if (!isPaused) return;
        isPaused = false;
        scheduleNext(remainingMs || AUTOPLAY_MS);
    }

    function stopAutoplayPermanently() {
        hasInteracted = true;  // permanently disable after manual interaction
        clearAutoplayTimeout();
    }

    // pause on hover; resume on leave (true pause/unpause)
    wrap.addEventListener('mouseenter', pauseAutoplay);
    wrap.addEventListener('mouseleave', resumeAutoplay);

    // pause when tab is hidden; resume when visible (before interaction)
    document.addEventListener('visibilitychange', () => {
        document.hidden ? pauseAutoplay() : resumeAutoplay();
    });

    // stop autoplay on any manual navigation (permanent)
    nextBtn && nextBtn.addEventListener('click', stopAutoplayPermanently, { once: true });
    prevBtn && prevBtn.addEventListener('click', stopAutoplayPermanently, { once: true });
    wrap.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') stopAutoplayPermanently();
    }, { once: true });

    startAutoplay();


    // Wire controls
    nextBtn && nextBtn.addEventListener('click', next);
    prevBtn && prevBtn.addEventListener('click', prev);

    // Optional keyboard
    wrap.tabIndex = wrap.tabIndex || 0;
    wrap.addEventListener('keydown', e => {
        if (e.key === 'ArrowRight') next();
        if (e.key === 'ArrowLeft') prev();
    });

    // Initial position (avoid no-op transition lock)
    setX(i, false);
    syncTextFrom(0);
})();