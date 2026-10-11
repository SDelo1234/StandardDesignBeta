/**
 * Fence systems offered by the tool.
 *
 * capacity_kpa is the maximum peak velocity pressure qp the system is designed
 * for. The system design already includes the net pressure coefficient
 * cp,net, so qp is compared with it directly.
 */
const IMG1 = "https://i.ibb.co/LzMWRbqj/IMG1-fence-1.jpg";
const IMG2 = "https://i.ibb.co/Kc61kkHd/IMG2-fence-2.jpg";
const IMG3 = "https://i.ibb.co/VYkkBwWW/IMG3-fence-3.jpg";
const IMG4 = "https://i.ibb.co/pBCs5YHd/IMG4-fence-4.jpg";

export const PANEL_WIDTH_M = 3.5;

export const FENCE_SYSTEMS = [
  { id: "A", name: "2.0 m panels @ 3.5 m centres", capacity_kpa: 0.1, maxHeight_m: 2.0, img: IMG3, sketch: "panel" },
  { id: "B", name: "2.0 m panels + rear brace/ballast", capacity_kpa: 0.2, maxHeight_m: 2.0, img: IMG2, sketch: "brace" },
  { id: "C", name: "2.4 m hoarding with buttress @ 2.4 m", capacity_kpa: 0.3, maxHeight_m: 2.4, img: IMG1, sketch: "buttress" },
  { id: "D", name: "2.4 m mesh with rear braces @ 2.4 m", capacity_kpa: 0.3, maxHeight_m: 2.4, img: IMG2, sketch: "brace" },
  { id: "E", name: "2.4 m hoarding + heavy ballast", capacity_kpa: 0.4, maxHeight_m: 2.4, img: IMG1, sketch: "ballast" },
  { id: "F", name: "3.0 m hoarding with twin buttress", capacity_kpa: 0.5, maxHeight_m: 3.0, img: IMG4, sketch: "buttress" },
];
