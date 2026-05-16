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
    name: "Ember Clássico",
    description: "Hambúrguer smash, cheddar maturado, pão tostado, molho ember.",
    price: 28.9,
    category: "burgers",
    image: heroBurger,
    tag: "Assinatura",
    kcal: 720,
    prepMin: 8,
  },
  {
    id: "double-stack",
    name: "Double Stack",
    description: "Dois blends, cheddar duplo americano, bacon crocante.",
    price: 36.9,
    category: "burgers",
    image: productDouble,
    tag: "Mais vendido",
    kcal: 980,
    prepMin: 10,
  },
  {
    id: "crispy-bird",
    name: "Crispy Bird",
    description: "Frango empanado no buttermilk, pickles e molho da casa.",
    price: 29.9,
    category: "burgers",
    image: productChicken,
    kcal: 760,
    prepMin: 9,
  },
  {
    id: "chili-dog",
    name: "Chili Cheese Dog",
    description: "Salsicha bovina, chili apimentado, cheddar derretido e cebola crocante.",
    price: 22.9,
    category: "burgers",
    image: productHotdog,
    kcal: 640,
    prepMin: 6,
  },
  {
    id: "ember-fries",
    name: "Batata Ember",
    description: "Triple-cooked, flor de sal e páprica defumada.",
    price: 14.9,
    category: "sides",
    image: productFries,
    tag: "Popular",
    kcal: 420,
    prepMin: 4,
  },
  {
    id: "onion-rings",
    name: "Onion Rings",
    description: "Anéis de cebola empanados na cerveja, maionese sriracha.",
    price: 16.9,
    category: "sides",
    image: productRings,
    kcal: 480,
    prepMin: 5,
  },
  {
    id: "cola",
    name: "Cola Gelada",
    description: "Refrigerante de cola servido com gelo cristalino.",
    price: 8.9,
    category: "drinks",
    image: productCola,
    kcal: 180,
    prepMin: 1,
  },
  {
    id: "choco-shake",
    name: "Milkshake Chocolate Inferno",
    description: "Shake cremoso de cacau com chantilly e cacau em pó.",
    price: 17.9,
    category: "drinks",
    image: productShake,
    kcal: 540,
    prepMin: 3,
  },
];

export const categories = [
  { id: "burgers", label: "Burgers" },
  { id: "sides", label: "Acompanhamentos" },
  { id: "drinks", label: "Bebidas" },
] as const;
