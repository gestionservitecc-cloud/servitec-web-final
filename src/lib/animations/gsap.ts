import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// Shared range for the logo and its ambient light. No global killAll/config.
export const pageScrollRange = () => ({
  start: 0,
  end: () => Math.max(1, ScrollTrigger.maxScroll(window)),
});

export { gsap, ScrollTrigger };
