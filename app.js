const dots = Array.from(document.querySelectorAll(".testimonial-dots__dot"));
const track = document.querySelector("#testimonial-track");

function updateDots(activeIndex) {
  dots.forEach((dot, index) => {
    dot.classList.toggle("is-active", index === activeIndex);
  });
}

if (dots.length && track) {
  dots.forEach((dot, index) => {
    dot.addEventListener("click", () => {
      const left = index === 0 ? 0 : track.scrollWidth - track.clientWidth;
      track.scrollTo({ left, behavior: "smooth" });
      updateDots(index);
    });
  });
}
