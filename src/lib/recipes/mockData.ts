import type { Recipe } from "./types";

/**
 * Mock recipe dataset. Designed to feel like 8 distinct results returned
 * from a search engine: varied sources, cuisines, times, difficulties.
 * The shape here matches `Recipe` directly because the parsing boundary
 * lives in `parser.ts`; this is the post-parse output.
 */
export const RECIPES: Recipe[] = [
  {
    id: "creamy-garlic-parmesan-pasta",
    slug: "creamy-garlic-parmesan-pasta",
    title: "Creamy Garlic Parmesan Pasta",
    source: "Bon Appétit",
    sourceUrl: "https://www.bonappetit.com/recipe/creamy-garlic-parmesan-pasta",
    thumbnail: "/recipes/pasta.svg",
    gradient: 0,
    totalMinutes: 25,
    difficulty: "Easy",
    tags: ["pasta", "vegetarian", "dinner", "quick"],
    summary:
      "A weeknight pasta with cream, garlic, and parmesan. Clean flavors, ten ingredients, half an hour from start to plate.",
    servings: 4,
    ingredients: [
      { id: "i1", amount: "200g", name: "spaghetti" },
      { id: "i2", amount: "2 tbsp", name: "olive oil" },
      { id: "i3", amount: "3 cloves", name: "garlic, minced" },
      { id: "i4", amount: "1 cup", name: "heavy cream" },
      { id: "i5", amount: "1/2 cup", name: "parmesan, grated" },
      { id: "i6", name: "salt to taste" },
      { id: "i7", name: "black pepper to taste" },
      { id: "i8", amount: "2 tbsp", name: "parsley, chopped", optional: true },
    ],
    steps: [
      {
        id: "s1",
        index: 1,
        title: "Cook the pasta",
        instruction:
          "Bring a large pot of salted water to a boil. Cook pasta until al dente. Drain and set aside, reserving a splash of pasta water.",
        durationSeconds: 540,
      },
      {
        id: "s2",
        index: 2,
        title: "Sauté garlic",
        instruction:
          "Heat olive oil in a pan over medium heat. Add garlic and sauté for one minute until fragrant; do not let it brown.",
        durationSeconds: 60,
      },
      {
        id: "s3",
        index: 3,
        title: "Add cream",
        instruction:
          "Pour in the heavy cream and simmer gently for two to three minutes, stirring occasionally.",
        durationSeconds: 150,
      },
      {
        id: "s4",
        index: 4,
        title: "Melt the parmesan",
        instruction:
          "Reduce heat to low and whisk in the parmesan a handful at a time until the sauce is glossy.",
        durationSeconds: 120,
      },
      {
        id: "s5",
        index: 5,
        title: "Season",
        instruction:
          "Season with salt and pepper. Taste first; the parmesan is salty, so go slow.",
      },
      {
        id: "s6",
        index: 6,
        title: "Combine",
        instruction:
          "Add the drained pasta to the sauce and toss to coat. Loosen with reserved pasta water if needed.",
      },
      {
        id: "s7",
        index: 7,
        title: "Finish with parsley",
        instruction:
          "Scatter chopped parsley over the top and give it one final toss.",
      },
      {
        id: "s8",
        index: 8,
        title: "Serve",
        instruction:
          "Plate immediately while hot. Top with extra parmesan if you like.",
      },
    ],
  },

  {
    id: "miso-ginger-soup",
    slug: "miso-ginger-soup",
    title: "Miso Ginger Soup with Soft Tofu",
    source: "NYT Cooking",
    sourceUrl: "https://cooking.nytimes.com/recipes/miso-ginger-soup",
    thumbnail: "/recipes/soup.svg",
    gradient: 3,
    totalMinutes: 20,
    difficulty: "Easy",
    tags: ["soup", "vegetarian", "quick", "asian"],
    summary:
      "A clean, restorative bowl of miso broth brightened with fresh ginger, scallions, and silky tofu.",
    servings: 2,
    ingredients: [
      { id: "i1", amount: "4 cups", name: "water" },
      { id: "i2", amount: "1 piece", name: "kombu (4-inch)" },
      { id: "i3", amount: "1 tbsp", name: "ginger, grated" },
      { id: "i4", amount: "3 tbsp", name: "white miso paste" },
      { id: "i5", amount: "200g", name: "silken tofu, cubed" },
      { id: "i6", amount: "2", name: "scallions, sliced" },
      { id: "i7", amount: "1 tsp", name: "soy sauce" },
    ],
    steps: [
      {
        id: "s1",
        index: 1,
        title: "Steep the kombu",
        instruction:
          "In a small pot, combine water and kombu. Bring almost to a simmer over medium heat; do not boil. Remove the kombu.",
        durationSeconds: 480,
      },
      {
        id: "s2",
        index: 2,
        title: "Add ginger",
        instruction: "Stir in grated ginger and let it infuse off-heat for two minutes.",
        durationSeconds: 120,
      },
      {
        id: "s3",
        index: 3,
        title: "Whisk in miso",
        instruction:
          "Spoon miso into a small bowl, ladle in some warm broth, and whisk smooth. Stir back into the pot.",
      },
      {
        id: "s4",
        index: 4,
        title: "Add tofu",
        instruction:
          "Gently slide cubed tofu into the broth and warm through; do not boil, or the miso will turn bitter.",
        durationSeconds: 120,
      },
      {
        id: "s5",
        index: 5,
        title: "Finish",
        instruction:
          "Stir in soy sauce. Ladle into bowls and top with scallions.",
      },
    ],
  },

  {
    id: "roasted-tomato-basil-soup",
    slug: "roasted-tomato-basil-soup",
    title: "Slow-Roasted Tomato & Basil Soup",
    source: "Smitten Kitchen",
    sourceUrl: "https://smittenkitchen.com/roasted-tomato-basil-soup",
    thumbnail: "/recipes/tomato.svg",
    gradient: 2,
    totalMinutes: 75,
    difficulty: "Easy",
    tags: ["soup", "vegetarian", "dinner"],
    summary:
      "Roasting concentrates the tomatoes into something almost jammy. Blended with basil and a little cream, it's the ideal quiet dinner.",
    servings: 4,
    ingredients: [
      { id: "i1", amount: "1.5kg", name: "ripe tomatoes, halved" },
      { id: "i2", amount: "1 head", name: "garlic, top sliced off" },
      { id: "i3", amount: "3 tbsp", name: "olive oil" },
      { id: "i4", amount: "1 tsp", name: "flaky salt" },
      { id: "i5", amount: "1 cup", name: "vegetable stock" },
      { id: "i6", amount: "1/4 cup", name: "fresh basil leaves" },
      { id: "i7", amount: "2 tbsp", name: "heavy cream", optional: true },
    ],
    steps: [
      {
        id: "s1",
        index: 1,
        title: "Heat the oven",
        instruction: "Heat the oven to 200°C / 400°F.",
      },
      {
        id: "s2",
        index: 2,
        title: "Prepare the tray",
        instruction:
          "Arrange tomatoes cut-side up on a sheet pan. Nestle the garlic in the middle. Drizzle with olive oil and sprinkle with salt.",
      },
      {
        id: "s3",
        index: 3,
        title: "Roast",
        instruction:
          "Roast for 45 minutes, until edges are caramelized and the tomatoes are slumped.",
        durationSeconds: 2700,
      },
      {
        id: "s4",
        index: 4,
        title: "Squeeze the garlic",
        instruction:
          "Squeeze roasted garlic cloves out of their skins into a blender. Add tomatoes and any pan juices.",
      },
      {
        id: "s5",
        index: 5,
        title: "Blend",
        instruction:
          "Add stock and basil and blend until smooth. Stir in cream if using.",
      },
      {
        id: "s6",
        index: 6,
        title: "Warm and serve",
        instruction:
          "Warm gently on the stove, taste for salt, and serve with crusty bread.",
      },
    ],
  },

  {
    id: "lemon-herb-roast-chicken",
    slug: "lemon-herb-roast-chicken",
    title: "Lemon Herb Roast Chicken",
    source: "Serious Eats",
    sourceUrl: "https://www.seriouseats.com/lemon-herb-roast-chicken",
    thumbnail: "/recipes/chicken.svg",
    gradient: 1,
    totalMinutes: 90,
    difficulty: "Medium",
    tags: ["chicken", "dinner", "weekend"],
    summary:
      "A simple roast chicken made memorable by a lemon, thyme and butter rub. The pan juices double as your sauce.",
    servings: 4,
    ingredients: [
      { id: "i1", amount: "1.6kg", name: "whole chicken" },
      { id: "i2", amount: "2", name: "lemons" },
      { id: "i3", amount: "3 tbsp", name: "soft butter" },
      { id: "i4", amount: "4 sprigs", name: "thyme" },
      { id: "i5", amount: "4 cloves", name: "garlic, smashed" },
      { id: "i6", amount: "1 tsp", name: "flaky salt" },
      { id: "i7", amount: "to taste", name: "black pepper" },
    ],
    steps: [
      {
        id: "s1",
        index: 1,
        title: "Preheat",
        instruction: "Heat the oven to 220°C / 425°F. Pat the chicken dry, inside and out.",
      },
      {
        id: "s2",
        index: 2,
        title: "Make the rub",
        instruction:
          "Mash butter with the zest of one lemon, half the thyme leaves, salt, and pepper.",
      },
      {
        id: "s3",
        index: 3,
        title: "Season",
        instruction:
          "Loosen the skin over the breast and rub the herb butter underneath and over the top.",
      },
      {
        id: "s4",
        index: 4,
        title: "Stuff the cavity",
        instruction:
          "Tuck the halved lemons, smashed garlic, and remaining thyme into the cavity.",
      },
      {
        id: "s5",
        index: 5,
        title: "Roast",
        instruction:
          "Place breast-up on a pan and roast for about 1 hour 10 minutes, until juices run clear at the thigh.",
        durationSeconds: 4200,
      },
      {
        id: "s6",
        index: 6,
        title: "Rest and carve",
        instruction:
          "Let it rest at least 15 minutes. Carve and serve with the pan juices.",
        durationSeconds: 900,
      },
    ],
  },

  {
    id: "shakshuka",
    slug: "shakshuka",
    title: "Smoky Shakshuka",
    source: "Ottolenghi",
    sourceUrl: "https://ottolenghi.co.uk/recipes/shakshuka",
    thumbnail: "/recipes/shakshuka.svg",
    gradient: 6,
    totalMinutes: 35,
    difficulty: "Easy",
    tags: ["vegetarian", "brunch", "dinner", "one-pan"],
    summary:
      "Eggs poached in a smoky red-pepper-and-tomato sauce. A one-pan supper that doubles beautifully as brunch.",
    servings: 2,
    ingredients: [
      { id: "i1", amount: "2 tbsp", name: "olive oil" },
      { id: "i2", amount: "1", name: "onion, diced" },
      { id: "i3", amount: "1", name: "red bell pepper, diced" },
      { id: "i4", amount: "3 cloves", name: "garlic, sliced" },
      { id: "i5", amount: "1 tsp", name: "smoked paprika" },
      { id: "i6", amount: "1 tsp", name: "ground cumin" },
      { id: "i7", amount: "400g", name: "chopped tomatoes" },
      { id: "i8", amount: "4", name: "eggs" },
      { id: "i9", amount: "2 tbsp", name: "feta, crumbled", optional: true },
      { id: "i10", amount: "to serve", name: "fresh parsley" },
    ],
    steps: [
      {
        id: "s1",
        index: 1,
        title: "Soften the aromatics",
        instruction:
          "Warm olive oil in a pan over medium heat. Add onion and pepper and cook 8 minutes until soft.",
        durationSeconds: 480,
      },
      {
        id: "s2",
        index: 2,
        title: "Add garlic and spices",
        instruction:
          "Stir in garlic, paprika and cumin. Cook one minute until fragrant.",
        durationSeconds: 60,
      },
      {
        id: "s3",
        index: 3,
        title: "Simmer the sauce",
        instruction:
          "Pour in tomatoes, season, and simmer 10 minutes until thickened.",
        durationSeconds: 600,
      },
      {
        id: "s4",
        index: 4,
        title: "Make wells",
        instruction:
          "Use a spoon to make four wells in the sauce. Crack one egg into each.",
      },
      {
        id: "s5",
        index: 5,
        title: "Poach the eggs",
        instruction:
          "Cover and cook 5–7 minutes, until whites are set but yolks still run.",
        durationSeconds: 360,
      },
      {
        id: "s6",
        index: 6,
        title: "Finish",
        instruction:
          "Scatter feta and parsley over the top. Serve straight from the pan with bread.",
      },
    ],
  },

  {
    id: "lentil-salad",
    slug: "lentil-salad",
    title: "Warm Lentil Salad with Lemon & Herbs",
    source: "Food52",
    sourceUrl: "https://food52.com/recipes/warm-lentil-salad",
    thumbnail: "/recipes/lentil.svg",
    gradient: 7,
    totalMinutes: 30,
    difficulty: "Easy",
    tags: ["vegetarian", "lunch", "quick", "salad"],
    summary:
      "Tender lentils tossed warm with lemon, olive oil, and a fistful of herbs. Better the next day, ideal for the week ahead.",
    servings: 3,
    ingredients: [
      { id: "i1", amount: "1 cup", name: "Puy lentils" },
      { id: "i2", amount: "1", name: "bay leaf" },
      { id: "i3", amount: "1", name: "shallot, finely diced" },
      { id: "i4", amount: "3 tbsp", name: "olive oil" },
      { id: "i5", amount: "1", name: "lemon (zest and juice)" },
      { id: "i6", amount: "1 tsp", name: "Dijon mustard" },
      { id: "i7", amount: "1/2 cup", name: "parsley, chopped" },
      { id: "i8", amount: "1/4 cup", name: "mint, chopped" },
      { id: "i9", amount: "to taste", name: "salt and pepper" },
    ],
    steps: [
      {
        id: "s1",
        index: 1,
        title: "Cook the lentils",
        instruction:
          "Simmer lentils with the bay leaf in plenty of water until tender but holding shape, 20–25 minutes. Drain.",
        durationSeconds: 1380,
      },
      {
        id: "s2",
        index: 2,
        title: "Whisk the dressing",
        instruction:
          "While lentils cook, whisk shallot, olive oil, lemon zest and juice, and mustard. Season.",
      },
      {
        id: "s3",
        index: 3,
        title: "Combine",
        instruction:
          "Tip warm lentils into the bowl with the dressing and toss. They drink it up best when warm.",
      },
      {
        id: "s4",
        index: 4,
        title: "Add herbs",
        instruction:
          "Fold through parsley and mint. Taste; it should taste bright. Adjust salt and lemon.",
      },
      {
        id: "s5",
        index: 5,
        title: "Serve",
        instruction:
          "Eat warm, room temp, or chilled. It only improves overnight.",
      },
    ],
  },

  {
    id: "chocolate-olive-oil-cake",
    slug: "chocolate-olive-oil-cake",
    title: "Chocolate Olive Oil Cake",
    source: "Nigella",
    sourceUrl: "https://www.nigella.com/recipes/chocolate-olive-oil-cake",
    thumbnail: "/recipes/cake.svg",
    gradient: 4,
    totalMinutes: 60,
    difficulty: "Medium",
    tags: ["dessert", "chocolate", "baking"],
    summary:
      "A dense, fudgy chocolate cake made with olive oil instead of butter; naturally dairy-free and almost more delicious for it.",
    servings: 8,
    ingredients: [
      { id: "i1", amount: "2/3 cup", name: "good olive oil" },
      { id: "i2", amount: "1/2 cup", name: "cocoa powder" },
      { id: "i3", amount: "3/4 cup", name: "boiling water" },
      { id: "i4", amount: "2 tsp", name: "vanilla extract" },
      { id: "i5", amount: "1 1/2 cups", name: "ground almonds" },
      { id: "i6", amount: "1/2 tsp", name: "baking soda" },
      { id: "i7", amount: "1 cup", name: "caster sugar" },
      { id: "i8", amount: "3", name: "eggs" },
      { id: "i9", amount: "pinch", name: "fine salt" },
    ],
    steps: [
      {
        id: "s1",
        index: 1,
        title: "Heat the oven",
        instruction:
          "Heat oven to 170°C / 325°F. Line a 9-inch springform pan.",
      },
      {
        id: "s2",
        index: 2,
        title: "Bloom the cocoa",
        instruction:
          "Whisk cocoa with boiling water and vanilla into a smooth paste. Let cool 2 minutes.",
        durationSeconds: 120,
      },
      {
        id: "s3",
        index: 3,
        title: "Combine the dry",
        instruction:
          "In a separate bowl, whisk almonds, baking soda, and salt.",
      },
      {
        id: "s4",
        index: 4,
        title: "Whip eggs and sugar",
        instruction:
          "Beat eggs with sugar and olive oil for 3 minutes until pale and thickened.",
        durationSeconds: 180,
      },
      {
        id: "s5",
        index: 5,
        title: "Fold together",
        instruction:
          "Fold in cocoa paste, then almond mixture. Pour into the pan.",
      },
      {
        id: "s6",
        index: 6,
        title: "Bake",
        instruction:
          "Bake 40–45 minutes, until a skewer comes out with moist crumbs.",
        durationSeconds: 2520,
      },
      {
        id: "s7",
        index: 7,
        title: "Cool",
        instruction: "Cool in the pan at least 20 minutes before unmoulding.",
        durationSeconds: 1200,
      },
    ],
  },

  {
    id: "green-shakshuka",
    slug: "green-shakshuka",
    title: "Green Shakshuka with Spinach & Feta",
    source: "Bon Appétit",
    sourceUrl: "https://www.bonappetit.com/recipe/green-shakshuka",
    thumbnail: "/recipes/green-shakshuka.svg",
    gradient: 5,
    totalMinutes: 30,
    difficulty: "Easy",
    tags: ["vegetarian", "brunch", "quick", "one-pan"],
    summary:
      "A bright, leafy variation on the classic: eggs poached in a green sauce of spinach, herbs, leek, and chili.",
    servings: 2,
    ingredients: [
      { id: "i1", amount: "2 tbsp", name: "olive oil" },
      { id: "i2", amount: "1", name: "leek, white parts sliced" },
      { id: "i3", amount: "2 cloves", name: "garlic, sliced" },
      { id: "i4", amount: "1", name: "green chili, sliced", optional: true },
      { id: "i5", amount: "200g", name: "baby spinach" },
      { id: "i6", amount: "1/2 cup", name: "parsley, chopped" },
      { id: "i7", amount: "4", name: "eggs" },
      { id: "i8", amount: "60g", name: "feta, crumbled" },
      { id: "i9", amount: "to taste", name: "salt and pepper" },
    ],
    steps: [
      {
        id: "s1",
        index: 1,
        title: "Soften the leek",
        instruction:
          "Warm olive oil in a wide pan, add leek and cook 5 minutes until soft.",
        durationSeconds: 300,
      },
      {
        id: "s2",
        index: 2,
        title: "Add garlic and chili",
        instruction:
          "Stir in garlic and chili and cook one minute until fragrant.",
        durationSeconds: 60,
      },
      {
        id: "s3",
        index: 3,
        title: "Wilt the spinach",
        instruction:
          "Add spinach in handfuls, letting each wilt before adding more.",
        durationSeconds: 180,
      },
      {
        id: "s4",
        index: 4,
        title: "Add herbs",
        instruction:
          "Stir in parsley and season with salt and pepper.",
      },
      {
        id: "s5",
        index: 5,
        title: "Poach the eggs",
        instruction:
          "Make four wells, crack in the eggs, cover and cook 5 minutes until whites are set.",
        durationSeconds: 300,
      },
      {
        id: "s6",
        index: 6,
        title: "Finish with feta",
        instruction:
          "Scatter feta over the top and serve straight from the pan.",
      },
    ],
  },
];
