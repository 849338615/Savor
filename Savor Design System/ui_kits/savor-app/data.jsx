/* global React */
const { useState: useStateShared } = React;

// Stylized food card "photos" using sage/sand gradients (no real imagery available)
const FOOD_GRADIENTS = [
  "radial-gradient(circle at 30% 35%, #B5C9A8, #7BA489 60%, #5C8770)",
  "radial-gradient(circle at 65% 40%, #E7D9C2, #C7B898 70%, #92A37D)",
  "radial-gradient(circle at 40% 60%, #D9C7A8, #B8A07A 65%, #6E6B66)",
  "radial-gradient(circle at 55% 35%, #C9D8C6, #92A37D 55%, #4A6552)",
  "radial-gradient(circle at 35% 50%, #EFE7DA, #C9B89A 60%, #92A37D)",
  "radial-gradient(circle at 60% 55%, #DDE7D4, #92A37D 60%, #1F4D3A)",
  "radial-gradient(circle at 45% 40%, #F0DFC2, #D6B88B 55%, #8B7355)",
  "radial-gradient(circle at 50% 45%, #C9D8C6, #7BA489 50%, #1F4D3A)"
];

const RECIPES = [
  { id: 1, title: "Creamy Garlic Pasta", time: 25, level: "Easy", servings: 4, gradient: 0,
    ingredients: [
      { label: "Spaghetti", qty: "200 g" },
      { label: "Olive oil", qty: "3 tbsp" },
      { label: "Garlic, minced", qty: "3 cloves" },
      { label: "Heavy cream", qty: "1 cup" },
      { label: "Parmesan, grated", qty: "½ cup" },
      { label: "Salt", qty: "to taste" },
      { label: "Black pepper", qty: "to taste" }
    ],
    steps: [
      { text: "Cook the pasta. Bring a large pot of salted water to a boil. Cook spaghetti until al dente, then drain and set aside.", timer: "10:00" },
      { text: "Sauté garlic. Heat olive oil in a pan over medium heat. Add garlic and sauté until fragrant." },
      { text: "Add cream. Pour in the heavy cream and simmer gently for 2–3 minutes.", timer: "02:30" },
      { text: "Stir in parmesan. Lower the heat and whisk in the parmesan until smooth." },
      { text: "Combine. Add the cooked pasta to the sauce and toss to coat every strand." },
      { text: "Season. Add salt and pepper to taste." },
      { text: "Plate. Twirl pasta into shallow bowls." },
      { text: "Serve. Finish with extra parmesan and fresh black pepper." }
    ]
  },
  { id: 2, title: "Lemon Herb Salmon", time: 20, level: "Easy", servings: 2, gradient: 1 },
  { id: 3, title: "Roasted Tomato Soup", time: 35, level: "Medium", servings: 4, gradient: 2 },
  { id: 4, title: "Spring Pea Risotto", time: 30, level: "Medium", servings: 3, gradient: 3 },
  { id: 5, title: "Charred Broccolini", time: 15, level: "Easy", servings: 2, gradient: 5 },
  { id: 6, title: "Honey-Glazed Carrots", time: 18, level: "Easy", servings: 4, gradient: 4 },
  { id: 7, title: "Wild Mushroom Toast", time: 12, level: "Easy", servings: 2, gradient: 6 },
  { id: 8, title: "Herbed Lentil Salad", time: 22, level: "Easy", servings: 3, gradient: 7 }
];

window.FOOD_GRADIENTS = FOOD_GRADIENTS;
window.RECIPES = RECIPES;
