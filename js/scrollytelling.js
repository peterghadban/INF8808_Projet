const sections = document.querySelectorAll('.stop');
const navLinks = document.querySelectorAll('#sidebar nav a');

function updateProgressMarker(activeSection) {
  const all = Array.from(sections);
  const index = all.indexOf(activeSection);
  const pct = index / Math.max(all.length - 1, 1);
  const track = document.getElementById('progress-track');
  const marker = document.getElementById('progress-marker');
  if (track && marker) {
    const trackHeight = track.offsetHeight;
    marker.style.top = `${pct * trackHeight}px`;
  }
}

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      navLinks.forEach(l => l.classList.remove('active'));
      sections.forEach(s => s.classList.remove('is-active'));
      const active = document.querySelector(`#sidebar nav a[href="#${entry.target.id}"]`);
      if (active) active.classList.add('active');
      entry.target.classList.add('is-active');
      updateProgressMarker(entry.target);
    }
  });
}, { threshold: 0.4 });

sections.forEach(s => observer.observe(s));

