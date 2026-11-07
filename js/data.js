// La Parisienne — site data.
// Branch phone numbers come from the restaurant's own Facebook cover.
// ⚠ Menu items and prices below are PLACEHOLDERS — confirm with La Parisienne before going live.

export const CURRENCY = "D"; // Gambian dalasi
export const money = (n) => `${CURRENCY}${Math.round(n).toLocaleString("en-US")}`;

export const BRANCHES = [
  {
    id: "kairaba",
    name: "Kairaba",
    area: "Kairaba Avenue, Fajara",
    phone: "7660676",
    whatsapp: "2207660676",
    map: "https://www.google.com/maps/search/?api=1&query=La+Parisienne+Kairaba+Avenue+Gambia",
  },
  {
    id: "brusubi",
    name: "Brusubi",
    area: "Brusubi",
    phone: "2030133",
    whatsapp: "2202030133",
    map: "https://www.google.com/maps/search/?api=1&query=La+Parisienne+Brusubi+Gambia",
  },
  {
    id: "brikama",
    name: "Brikama",
    area: "Brikama",
    phone: "2030300",
    whatsapp: "2202030300",
    map: "https://www.google.com/maps/search/?api=1&query=La+Parisienne+Brikama+Gambia",
  },
];

export const FACEBOOK = "https://www.facebook.com/laparisiennepastry/";

// Reservation / pickup time slots (confirm real opening hours).
export const OPEN_FROM = 8;   // 08:00
export const OPEN_UNTIL = 22; // 22:00

// Showcase — real photos from La Parisienne's page.
export const SHOWCASE = [
  { name: "Red Velvet Dôme", note: "Velvet crumb, whipped cream, dark chocolate fans", img: "assets/redvelvet.jpg", item: "Red Velvet Dôme", zoom: 1.75, origin: "64% 80%" },
  { name: "Coconut Gâteau", note: "Toasted coconut, light sponge, cream rosettes", img: "assets/coconut.jpg", item: "Coconut Gâteau", zoom: 1.6, origin: "40% 76%" },
  { name: "Moka", note: "Coffee buttercream layers under a mirror glaze", img: "assets/photo-a.jpg", item: "Moka", zoom: 1.45, origin: "72% 72%" },
  { name: "Chocolate Drip Cake", note: "Whole cake, made to order for your table", img: "assets/photo-c.jpg", item: "Chocolate Drip Cake", zoom: 1.3, origin: "50% 62%" },
  { name: "Gelato Coupe", note: "Mango & chocolate scoops, served cold", img: "assets/icecream.jpg", item: "Gelato Coupe" },
  { name: "Celebration Cake", note: "Your colours, your message, your day", img: "assets/photo-b.jpg", item: "Celebration Cream Cake" },
];

// [name, price | [prices by size], description]
export const MENU = [
  {
    id: "pastry", name: "Pâtisserie", tag: "By the slice",
    items: [
      ["Red Velvet Dôme", 200, "Velvet sponge, whipped cream, chocolate fans"],
      ["Coconut Gâteau", 180, "Toasted coconut, vanilla sponge, cream"],
      ["Moka", 180, "Coffee buttercream, chocolate glaze"],
      ["Opéra Vanille", 190, "Layered vanilla sponge, chocolate crown"],
      ["Chocolate Ganache Slice", 200, "Dark chocolate cream, cocoa sponge"],
      ["Roulé Crème", 160, "Soft rolled sponge, cream and caramel"],
      ["Éclair au Chocolat", 120, "Choux pastry, chocolate crème pâtissière"],
      ["Tarte aux Fruits", 170, "Butter pastry, vanilla cream, fresh fruit"],
    ],
  },
  {
    id: "viennoiserie", name: "Viennoiserie", tag: "Morning bakes",
    items: [
      ["Croissant", 75, "Butter croissant"],
      ["Pain au Chocolat", 90, "Two bars of dark chocolate"],
      ["Pain aux Raisins", 90, "Custard and raisin swirl"],
      ["Baguette", 40, "Classic French loaf"],
      ["Macarons · box of 6", 300, "Assorted flavours"],
    ],
  },
  {
    id: "cakes", name: "Whole Cakes", tag: "Pre-order", sizes: ['6" · 6–8 people', '8" · 10–12 people', '10" · 16–20 people'],
    items: [
      ["Chocolate Drip Cake", [1800, 2500, 3400], "Chocolate cream, ganache drip"],
      ["Red Velvet Cake", [2000, 2800, 3700], "Cream cheese frosting"],
      ["Coconut Cake", [1700, 2400, 3200], "Toasted coconut all over"],
      ["Celebration Cream Cake", [1600, 2300, 3100], "Pick your colour & message"],
    ],
  },
  {
    id: "glace", name: "Glaces", tag: "Ice cream",
    items: [
      ["Gelato Coupe", 250, "Three scoops, sauce, wafer"],
      ["Single Scoop", 100, "Ask for today's flavours"],
      ["Double Scoop", 180, "Two flavours of your choice"],
      ["Milkshake", 200, "Vanilla, chocolate, strawberry or caramel"],
    ],
  },
  {
    id: "kitchen", name: "La Cuisine", tag: "From the kitchen",
    items: [
      ["Grilled Chicken & Frites", 450, "Quarter chicken, fries, salad, sauce"],
      ["Chicken Shawarma", 350, "Wrapped, with garlic sauce and fries"],
      ["Benachin au Poulet", 400, "Gambian jollof rice with chicken"],
      ["Grilled Fish & Salad", 550, "Catch of the day, lemon butter"],
      ["Steak Frites", 650, "Beef steak, pepper sauce, fries"],
      ["Croque Monsieur", 300, "Ham, béchamel, gratinated cheese"],
      ["Omelette & Baguette", 250, "Three eggs, herbs, cheese, toast"],
      ["Club Sandwich", 380, "Chicken, egg, salad, fries"],
    ],
  },
  {
    id: "drinks", name: "Boissons", tag: "Hot & cold",
    items: [
      ["Espresso", 90, ""],
      ["Cappuccino", 150, ""],
      ["Café Latte", 160, ""],
      ["Chocolat Chaud", 160, "Rich hot chocolate"],
      ["Bissap", 100, "Hibiscus, mint"],
      ["Baobab (Bouye)", 120, "Creamy baobab juice"],
      ["Ginger", 100, "Fresh ginger, lime"],
      ["Soft Drink", 70, ""],
    ],
  },
];
