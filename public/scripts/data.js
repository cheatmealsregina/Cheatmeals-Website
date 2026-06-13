// CheatMeals prototype seed data — every word is real brand copy or
// seed data from the design brief. No lorem ipsum.
(function () {
  const pick = { kind: "pick", label: "Chef's Pick" };
  const spicy1 = { kind: "spicy", level: 1, label: "Spicy" };
  const spicy2 = { kind: "spicy", level: 2, label: "Extra Spicy" };
  const jain = { kind: "diet", label: "Jain" };

  window.CM_DATA = {
    phone: "(306) 541-9198",
    tel: "tel:+13065419198",
    address: "4306 Dewdney Avenue",
    city: "Regina, SK",
    instagram: "@cheatmeals_yqr",
    instagramUrl: "https://instagram.com/cheatmeals_yqr",
    announcement: "Now slinging in Regina — 4306 Dewdney Avenue",

    categories: [
      "Aloo Burgers", "Paneer Burgers", "Frankies", "Sand-Witches", "Pavs",
      "Loaded Fries", "Seasoned Fries", "Add-Ons & Dips",
      "Eggless", "Jain", "Swaminarayan",
    ],

    menus: {
      "Aloo Burgers": {
        note: "We make our own patties. All burgers are served with a side of fries, chips, Doritos, or Cheetos.",
        sections: [
          {
            title: "DOUBLE", accent: "DOUBLE", script: "Patty",
            items: [
              { name: "The Red Hulk", price: 14.99, description: "Double aloo patty, double cheese, schezwan chutney and mayo, cilantro, onions and jalapenos", badges: [pick, spicy1] },
            ],
          },
          {
            title: "SPICY ALOO", accent: "ALOO", script: "Patty",
            items: [
              { name: "Aloo Anarkali", price: 12.99, badges: [pick, spicy1] },
              { name: "Aloo 420", price: 11.99, badges: [] },
              { name: "Amdavadi Chaska 2.0", price: 11.99, badges: [] },
              { name: "Masala Aloo Tikki", price: 10.99, badges: [spicy1] },
              { name: "Achari Aloo", price: 9.99, badges: [] },
            ],
          },
          {
            title: "ALOO", accent: "ALOO", script: "Patty",
            items: [
              { name: "Red Devil", price: 12.99, badges: [spicy2] },
              { name: "Veggie Delight", price: 11.99, description: "Please don't ask, it is what the name says", badges: [] },
              { name: "Schezwan Aloo Tikki", price: 10.99, badges: [pick, spicy1] },
              { name: "Aloo Makhni", price: 10.99, description: "Let's keep that a secret", badges: [] },
              { name: "Amdavadi Chaska", price: 10.99, badges: [pick] },
              { name: "Peri-Peri", price: 10.99, badges: [] },
              { name: "Aloo Tikki", price: 9.99, badges: [] },
            ],
          },
        ],
      },
      "Frankies": {
        note: "Honest advice: one's enough for most people",
        items: [
          { name: "Paneer Frankie", price: 11.99, badges: [spicy1] },
          { name: "Aloo Frankie", price: 9.99, badges: [] },
          { name: "Schezwan Paneer Frankie", price: 12.99, badges: [spicy2] },
        ],
      },
      "Jain": {
        tagline: "No root vegetables, no onion, no garlic",
        kicker: "A separate curated menu",
        items: [
          { name: "Jain Paneer Burger", price: 12.99, badges: [jain] },
          { name: "Jain Pav", price: 8.99, badges: [jain] },
          { name: "Jain Cheese Frankie", price: 10.99, badges: [jain] },
        ],
      },
    },

    // voice lines for category headers that are not populated in this prototype
    asides: {
      "Sand-Witches": "It's not actual witchcraft, but it will possess you",
      "Loaded Fries": "Matches your taste better than your ex",
    },

    extraFries: {
      name: "Extra Fries",
      price: "N/A",
      description: "Not an option — won't fit in the box",
      badges: [],
    },

    hours: [
      { day: "Monday", time: "11:00 AM – 9:00 PM" },
      { day: "Tuesday", time: "11:00 AM – 9:00 PM" },
      { day: "Wednesday", time: "11:00 AM – 9:00 PM" },
      { day: "Thursday", time: "11:00 AM – 9:00 PM" },
      { day: "Friday", time: "11:00 AM – 9:00 PM" },
      { day: "Saturday", time: "11:00 AM – 9:00 PM" },
      { day: "Sunday", time: "11:00 AM – 9:00 PM" },
    ],
    today: new Date().toLocaleDateString("en-US", { weekday: "long" }),

    team: [
      { name: "The Founder", bio: "Started this because Regina needed it." },
      { name: "Head of Patties", bio: "Hand-smashes every tikki." },
      { name: "Sauce Department", bio: "Knows the Malai Makhni secret. Won't tell." },
    ],

    about: {
      headline: ["OUR", "STORY"],
      copy: "CheatMeals started with one belief: Regina deserved the burgers we grew up craving. Hand-smashed aloo tikkis, real paneer, sauces we won't explain — now at 4306 Dewdney Avenue.",
    },
  };
})();
