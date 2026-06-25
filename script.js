// View Switching / Navigation Logic
const viewTriggers = document.querySelectorAll('.view-trigger');
const backButtons = document.querySelectorAll('.back-btn');
const panels = document.querySelectorAll('.view-panel');
const landingView = document.getElementById('landing-view');

// Transition to a full-screen sub-page view from landing
viewTriggers.forEach(trigger => {
    trigger.addEventListener('click', () => {
        const targetId = trigger.getAttribute('data-target');
        const targetView = document.getElementById(targetId);
        
        if (targetView) {
            landingView.classList.remove('active');
            targetView.classList.add('active');
            
            // If opening Members view, make sure list menu is reset to active and details are closed
            if (targetId === 'view-members') {
                resetMembersView();
            }
        }
    });
});

// Standard transition back to landing view (for purpose and archive views)
backButtons.forEach(btn => {
    if (btn.id !== 'members-back-btn') {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            panels.forEach(panel => {
                if (panel.id !== 'landing-view') {
                    panel.classList.remove('active');
                }
            });
            landingView.classList.add('active');
        });
    }
});

// Members Sub-Navigation Logic (Master-Detail V5)
const membersBackBtn = document.getElementById('members-back-btn');
const membersListMenu = document.getElementById('members-list-menu');
const profileDetails = document.querySelectorAll('.member-profile-detail');
const profileTriggers = document.querySelectorAll('.profile-trigger');

function resetMembersView() {
    membersListMenu.classList.add('active');
    profileDetails.forEach(detail => detail.classList.remove('active'));
    membersBackBtn.innerHTML = '&larr; [ back ]';
}

// Clicks on members names from list
profileTriggers.forEach(trigger => {
    trigger.addEventListener('click', () => {
        const targetProfileId = trigger.getAttribute('data-profile');
        const targetProfile = document.getElementById(targetProfileId);
        
        if (targetProfile) {
            // Hide list
            membersListMenu.classList.remove('active');
            // Show target profile
            profileDetails.forEach(detail => detail.classList.remove('active'));
            targetProfile.classList.add('active');
            // Change back button text
            membersBackBtn.innerHTML = '&larr; [ back to list ]';
        }
    });
});

// Members page specific back button
if (membersBackBtn) {
    membersBackBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        
        // Check if any profile detail is currently open
        let activeProfile = null;
        profileDetails.forEach(detail => {
            if (detail.classList.contains('active')) {
                activeProfile = detail;
            }
        });
        
        if (activeProfile) {
            // Return to list menu
            activeProfile.classList.remove('active');
            membersListMenu.classList.add('active');
            membersBackBtn.innerHTML = '&larr; [ back ]';
        } else {
            // Close members view completely, return to landing view
            document.getElementById('view-members').classList.remove('active');
            landingView.classList.add('active');
        }
    });
}

// 3D Parallax Mouse Movement Effect on Character Background Container
const parallaxBg = document.querySelector('.parallax-bg-container');
let mouseX = 0;
let mouseY = 0;

if (parallaxBg) {
    window.addEventListener('mousemove', (e) => {
        const normX = (e.clientX / window.innerWidth) - 0.5;
        const normY = (e.clientY / window.innerHeight) - 0.5;
        
        const moveX = -normX * 30;
        const moveY = -normY * 30;
        
        parallaxBg.style.transform = `translate3d(${moveX}px, ${moveY}px, 0)`;
    });
}

// Custom Cursor & Falling Snowflake Trail Logic
const cursorDot = document.getElementById('custom-cursor-dot');
const cursorRing = document.getElementById('custom-cursor-ring');

let cursorX = 0, cursorY = 0;

// Trail throttling variables
let lastSnowflakeTime = 0;
let lastX = 0;
let lastY = 0;
const activeSnowflakes = [];

window.addEventListener('mousemove', (e) => {
    cursorX = e.clientX;
    cursorY = e.clientY;
    
    // Position the plus cursor dot
    cursorDot.style.transform = `translate3d(${cursorX}px, ${cursorY}px, 0)`;
    
    // Spawn snowflake trail particles (User request: don't overdo it!)
    // We only spawn if the cursor has moved at least 25px AND 80ms has elapsed since last spawn
    const now = Date.now();
    const dist = Math.hypot(cursorX - lastX, cursorY - lastY);
    
    if (dist > 25 && (now - lastSnowflakeTime > 80)) {
        lastSnowflakeTime = now;
        lastX = cursorX;
        lastY = cursorY;
        createSnowflake(cursorX, cursorY);
    }
});

// Add active hover classes to cursor on interactive tags
document.addEventListener('mouseover', (e) => {
    if (e.target.closest('a, button, input, select, textarea, .menu-item, .back-btn')) {
        cursorDot.classList.add('cursor-active');
    }
});
document.addEventListener('mouseout', (e) => {
    if (e.target.closest('a, button, input, select, textarea, .menu-item, .back-btn')) {
        cursorDot.classList.remove('cursor-active');
    }
});

// Snowflake spawn helper
function createSnowflake(x, y) {
    const flake = document.createElement('div');
    flake.className = 'snowflake-particle';
    flake.textContent = '·'; // Clean tiny dot snowflake matching screenshot 3
    
    const size = Math.random() * 3 + 5; // 5px to 8px size range
    flake.style.fontSize = `${size}px`;
    
    document.body.appendChild(flake);
    
    const data = {
        el: flake,
        x: x,
        y: y + 2, // offset slightly from center of plus
        vx: Math.random() * 0.8 - 0.4, // very soft drift
        vy: Math.random() * 0.3 + 0.3, // slow downward gravity speed
        opacity: 0.8,
        scale: 1,
        life: 50
    };
    
    activeSnowflakes.push(data);
}

// Snowflake render updater loop
function updateSnowflakes() {
    for (let i = activeSnowflakes.length - 1; i >= 0; i--) {
        const flake = activeSnowflakes[i];
        flake.y += flake.vy;
        flake.vy += 0.03; // gravity pull
        flake.x += flake.vx;
        flake.opacity -= 0.015; // slow fade out
        flake.scale -= 0.008; // slow shrink size
        
        if (flake.opacity <= 0 || flake.scale <= 0 || flake.life <= 0) {
            flake.el.remove();
            activeSnowflakes.splice(i, 1);
        } else {
            flake.life--;
            flake.el.style.transform = `translate3d(${flake.x}px, ${flake.y}px, 0) scale(${flake.scale})`;
            flake.el.style.opacity = flake.opacity;
        }
    }
    requestAnimationFrame(updateSnowflakes);
}
updateSnowflakes();

// Background Music Control
const audio = document.getElementById('bg-music');
const musicToggleBtn = document.getElementById('music-toggle-btn');
const volumeSlider = document.getElementById('volume-slider');

audio.volume = 0.08;

musicToggleBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleMusic();
});

function toggleMusic() {
    if (audio.paused) {
        audio.play().then(() => {
            musicToggleBtn.classList.add('playing');
        }).catch(err => console.log("Audio play blocked:", err));
    } else {
        audio.pause();
        musicToggleBtn.classList.remove('playing');
    }
}

volumeSlider.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    audio.volume = val;
    audio.muted = val === 0;
});

// Gesture trigger for audio autoplay
function startMusicOnGesture() {
    audio.play().then(() => {
        musicToggleBtn.classList.add('playing');
        document.removeEventListener('click', startMusicOnGesture);
        document.removeEventListener('keydown', startMusicOnGesture);
    }).catch(err => {
        console.log("Audio play pending user interaction:", err);
    });
}
document.addEventListener('click', startMusicOnGesture);
document.addEventListener('keydown', startMusicOnGesture);

// Browser Tab Title Wave
const baseTitle = "Fatal.sh";
let titleCharIndex = 0;

function animateTabTitle() {
    let animatedTitle = "";
    for (let i = 0; i < baseTitle.length; i++) {
        if (i === titleCharIndex) {
            animatedTitle += baseTitle[i].toUpperCase();
        } else {
            animatedTitle += baseTitle[i].toLowerCase();
        }
    }
    document.title = animatedTitle;
    titleCharIndex = (titleCharIndex + 1) % baseTitle.length;
    setTimeout(animateTabTitle, 350);
}

// Master Initializer
document.addEventListener('DOMContentLoaded', () => {
    animateTabTitle();
});
