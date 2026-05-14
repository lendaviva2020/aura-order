import heroBurger from "@/assets/hero-burger.jpg";
import productDouble from "@/assets/product-double.jpg";
import productFries from "@/assets/product-fries.jpg";
import productChicken from "@/assets/product-chicken.jpg";
import productCola from "@/assets/product-cola.jpg";
import productShake from "@/assets/product-shake.jpg";
import productHotdog from "@/assets/product-hotdog.jpg";
import productRings from "@/assets/product-rings.jpg";

export type MenuItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  category: "burgers" | "sides" | "drinks";
  image: string;
  tag?: string;
  kcal: number;
  prepMin: number;
};

export const menu: MenuItem[] = [
  {
    id: "ember-classic",
    name: "Ember Classic",
    description: "Smashed beef patty, aged cheddar, charred bun, ember sauce.",
    price: 12.5,
    category: "burgers",
    image: heroBurger,
    tag: "Signature",
    kcal: 720,
    prepMin: 8,
  },
  {
    id: "double-stack",
    name: "Double Stack",
    description: "Two patties, double American cheese, crispy bacon strips.",
    price: 15.9,
    category: "burgers",
    image: productDouble,
    tag: "Bestseller",
    kcal: 980,
    prepMin: 10,
  },
  {
    id: "crispy-bird",
    name: "Crispy Bird",
    description: "Buttermilk fried chicken, pickles, house hot sauce.",
    price: 13.0,
    category: "burgers",
    image: productChicken,
    kcal: 760,
    prepMin: 9,
  },
  {
    id: "chili-dog",
    name: "Chili Cheese Dog",
    description: "All-beef frank, slow-cooked chili, melted cheddar, crispy onion.",
    price: 9.5,
    category: "burgers",
    image: productHotdog,
    kcal: 640,
    prepMin: 6,
  },
  {
    id: "ember-fries",
    name: "Ember Fries",
    description: "Triple-cooked, sea salt, smoked paprika dust.",
    price: 5.5,
    category: "sides",
    image: productFries,
    tag: "Popular",
    kcal: 420,
    prepMin: 4,
  },
  {
    id: "onion-rings",
    name: "Charred Onion Rings",
    description: "Beer-battered, hand-stacked, sweet sriracha mayo.",
    price: 6.5,
    category: "sides",
    image: productRings,
    kcal: 480,
    prepMin: 5,
  },
  {
    id: "cola",
    name: "Iced Cola",
    description: "Fountain cola over crystal-clear cubed ice.",
    price: 3.5,
    category: "drinks",
    image: productCola,
    kcal: 180,
    prepMin: 1,
  },
  {
    id: "choco-shake",
    name: "Chocolate Inferno Shake",
    description: "Hand-spun cocoa shake, whipped cream, dark cocoa dust.",
    price: 6.9,
    category: "drinks",
    image: productShake,
    kcal: 540,
    prepMin: 3,
  },
];

export const categories = [
  { id: "burgers", label: "Burgers" },
  { id: "sides", label: "Sides" },
  { id: "drinks", label: "Drinks" },
] as const;
