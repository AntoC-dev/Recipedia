import { ingredientType, recipeTableElement } from '@customTypes/DatabaseElementTypes';

export const frenchRecipes: recipeTableElement[] = [
  {
    image_Source: 'spaghetti_bolognaise.png',
    title: 'Spaghetti Bolognaise',
    description:
      'Un grand classique de la cuisine italienne avec une sauce à la viande savoureuse.',
    tags: [{ name: 'Italien' }, { name: 'Dîner' }],
    persons: 4,
    ingredients: [
      {
        name: 'Spaghetti',
        quantity: '400',
        unit: 'g',
        type: ingredientType.cereal,
        season: ['*'],
      },
      {
        name: 'Steak haché',
        quantity: '500',
        unit: 'g',
        type: ingredientType.meat,
        season: ['*'],
      },
      {
        name: 'Tomate',
        quantity: '6',
        unit: '',
        type: ingredientType.vegetable,
        season: ['5', '6', '7', '8', '9'],
      },
      {
        name: 'Oignon jaune',
        quantity: '1',
        unit: '',
        type: ingredientType.condiment,
        season: ['*'],
      },
      {
        name: 'Ail',
        quantity: '2',
        unit: '',
        type: ingredientType.condiment,
        season: ['*'],
      },
      {
        name: "Huile d'olive",
        quantity: '30',
        unit: 'mL',
        type: ingredientType.oilAndFat,
        season: ['*'],
      },
      {
        name: 'Sel',
        quantity: '1',
        unit: 'pincée',
        type: ingredientType.spice,
        season: ['*'],
      },
      {
        name: 'Poivre',
        quantity: '1',
        unit: 'pincée',
        type: ingredientType.spice,
        season: ['*'],
      },
    ],
    season: ['5', '6', '7', '8', '9'],
    preparation: [
      {
        title: 'Préparer la sauce',
        description:
          "Émincer l'oignon et l'ail. Dans une grande poêle, faire chauffer l'huile d'olive et faire revenir l'oignon jusqu'à ce qu'il soit translucide.",
      },
      {
        title: 'Cuire la viande',
        description:
          "Ajouter le steak haché et le faire dorer en l'émiettant avec une cuillère en bois. Ajouter l'ail émincé et cuire 1 minute.",
      },
      {
        title: 'Ajouter les tomates',
        description:
          'Couper les tomates en dés et les ajouter à la viande. Saler, poivrer et laisser mijoter 20 minutes à feu doux.',
      },
      {
        title: 'Cuire les pâtes',
        description:
          "Pendant ce temps, cuire les spaghetti dans une grande casserole d'eau bouillante salée selon les instructions du paquet.",
      },
      {
        title: 'Servir',
        description:
          'Égoutter les pâtes et les mélanger avec la sauce bolognaise. Servir chaud avec du parmesan râpé.',
      },
    ],
    time: 30,
    nutrition: {
      energyKcal: 385,
      energyKj: 1612,
      fat: 12.5,
      saturatedFat: 3.8,
      carbohydrates: 48.2,
      sugars: 5.6,
      fiber: 3.8,
      protein: 22.4,
      salt: 0.8,
      portionWeight: 350,
    },
  },
  {
    image_Source: 'soupe_legumes_hiver.png',
    title: "Soupe de Légumes d'Hiver",
    description:
      'Une soupe réconfortante aux légumes de saison, parfaite pour les journées froides.',
    tags: [{ name: 'Français' }, { name: 'Soupe' }, { name: 'Santé' }, { name: 'Végétarien' }],
    persons: 4,
    ingredients: [
      {
        name: 'Carotte',
        quantity: '3',
        unit: '',
        type: ingredientType.vegetable,
        season: ['*'],
      },
      {
        name: 'Poireau',
        quantity: '2',
        unit: '',
        type: ingredientType.vegetable,
        season: ['1', '2', '3', '4', '5', '10', '11', '12'],
      },
      {
        name: 'Pomme de terre',
        quantity: '400',
        unit: 'g',
        type: ingredientType.vegetable,
        season: ['*'],
      },
      {
        name: 'Céleri rave',
        quantity: '200',
        unit: 'g',
        type: ingredientType.vegetable,
        season: ['1', '2', '3', '10', '11', '12'],
      },
      {
        name: 'Navet',
        quantity: '200',
        unit: 'g',
        type: ingredientType.vegetable,
        season: ['1', '2', '3', '4', '5', '10', '11', '12'],
      },
      {
        name: 'Bouillon de légume',
        quantity: '1.5',
        unit: '',
        type: ingredientType.condiment,
        season: ['*'],
      },
      {
        name: 'Sel',
        quantity: '1',
        unit: 'pincée',
        type: ingredientType.spice,
        season: ['*'],
      },
      {
        name: 'Poivre',
        quantity: '1',
        unit: 'pincée',
        type: ingredientType.spice,
        season: ['*'],
      },
    ],
    season: ['1', '2', '3', '10', '11', '12'],
    preparation: [
      {
        title: 'Préparer les légumes',
        description: 'Éplucher et couper tous les légumes en cubes de taille moyenne.',
      },
      {
        title: 'Cuire les légumes',
        description:
          "Dans une grande casserole, mettre tous les légumes et couvrir avec 1.5L d'eau. Ajouter le bouillon de légume, saler et poivrer.",
      },
      {
        title: 'Mijoter',
        description:
          "Porter à ébullition puis laisser mijoter 30-35 minutes à feu moyen, jusqu'à ce que les légumes soient tendres.",
      },
      {
        title: 'Mixer (optionnel)',
        description:
          "Pour une soupe lisse, mixer la moitié de la soupe et la mélanger avec le reste. Ajuster l'assaisonnement.",
      },
    ],
    time: 45,
    nutrition: {
      energyKcal: 98,
      energyKj: 410,
      fat: 0.8,
      saturatedFat: 0.2,
      carbohydrates: 18.5,
      sugars: 6.2,
      fiber: 4.5,
      protein: 3.2,
      salt: 1.2,
      portionWeight: 400,
    },
  },
  {
    image_Source: 'curry_lentilles_corail.png',
    title: 'Curry de Lentilles Corail',
    description: 'Un plat végétarien savoureux et épicé aux lentilles corail et lait de coco.',
    tags: [{ name: 'Indien' }, { name: 'Végétarien' }, { name: 'Rapide' }, { name: 'Santé' }],
    persons: 4,
    ingredients: [
      {
        name: 'Lentilles corail',
        quantity: '300',
        unit: 'g',
        type: ingredientType.legumes,
        season: ['*'],
      },
      {
        name: 'Lait de coco',
        quantity: '400',
        unit: 'mL',
        type: ingredientType.dairy,
        season: ['*'],
      },
      {
        name: 'Curry jaune',
        quantity: '3',
        unit: 'pincée',
        type: ingredientType.spice,
        season: ['*'],
      },
      {
        name: 'Tomate',
        quantity: '3',
        unit: '',
        type: ingredientType.vegetable,
        season: ['5', '6', '7', '8', '9'],
      },
      {
        name: 'Épinards',
        quantity: '200',
        unit: 'g',
        type: ingredientType.vegetable,
        season: ['1', '2', '3', '4', '5', '6', '10', '11', '12'],
      },
      {
        name: 'Oignon jaune',
        quantity: '1',
        unit: '',
        type: ingredientType.condiment,
        season: ['*'],
      },
      {
        name: 'Ail',
        quantity: '2',
        unit: '',
        type: ingredientType.condiment,
        season: ['*'],
      },
      {
        name: 'Gingembre',
        quantity: '1',
        unit: '',
        type: ingredientType.condiment,
        season: ['9', '10', '11', '12', '1', '2'],
      },
      {
        name: "Huile d'olive",
        quantity: '20',
        unit: 'mL',
        type: ingredientType.oilAndFat,
        season: ['*'],
      },
      {
        name: 'Sel',
        quantity: '1',
        unit: 'pincée',
        type: ingredientType.spice,
        season: ['*'],
      },
    ],
    season: ['*'],
    preparation: [
      {
        title: 'Préparer les aromates',
        description: "Émincer l'oignon, l'ail et râper le gingembre frais.",
      },
      {
        title: 'Faire revenir',
        description:
          "Dans une casserole, faire chauffer l'huile et faire revenir l'oignon, l'ail et le gingembre 3 minutes. Ajouter le curry et cuire 1 minute.",
      },
      {
        title: 'Cuire les lentilles',
        description:
          "Rincer les lentilles corail. Ajouter les tomates coupées en dés, les lentilles et 500mL d'eau. Porter à ébullition et cuire 15 minutes.",
      },
      {
        title: 'Terminer',
        description:
          'Ajouter le lait de coco et les épinards. Cuire 5 minutes supplémentaires. Saler et servir avec du riz basmati.',
      },
    ],
    time: 25,
    nutrition: {
      energyKcal: 245,
      energyKj: 1026,
      fat: 11.2,
      saturatedFat: 8.5,
      carbohydrates: 25.8,
      sugars: 4.2,
      fiber: 6.8,
      protein: 11.5,
      salt: 0.6,
      portionWeight: 320,
    },
  },
  {
    image_Source: 'salade_cesar_poulet.png',
    title: 'Salade César au Poulet',
    description: 'Une salade fraîche et croquante avec du poulet grillé et du parmesan.',
    tags: [{ name: 'Salade' }, { name: 'Déjeuner' }, { name: 'Rapide' }],
    persons: 2,
    ingredients: [
      {
        name: 'Sucrine',
        quantity: '2',
        unit: '',
        type: ingredientType.vegetable,
        season: ['7', '8', '9', '10'],
      },
      {
        name: 'Filets de poulet',
        quantity: '2',
        unit: '',
        type: ingredientType.poultry,
        season: ['*'],
      },
      {
        name: 'Parmesan',
        quantity: '50',
        unit: 'g',
        type: ingredientType.cheese,
        season: ['*'],
      },
      {
        name: 'Citron jaune',
        quantity: '1',
        unit: '',
        type: ingredientType.fruit,
        season: ['*'],
      },
      {
        name: "Huile d'olive",
        quantity: '60',
        unit: 'mL',
        type: ingredientType.oilAndFat,
        season: ['*'],
      },
      {
        name: 'Ail',
        quantity: '1',
        unit: '',
        type: ingredientType.condiment,
        season: ['*'],
      },
      {
        name: 'Sel',
        quantity: '1',
        unit: 'pincée',
        type: ingredientType.spice,
        season: ['*'],
      },
      {
        name: 'Poivre',
        quantity: '1',
        unit: 'pincée',
        type: ingredientType.spice,
        season: ['*'],
      },
    ],
    season: ['7', '8', '9', '10'],
    preparation: [
      {
        title: 'Cuire le poulet',
        description:
          "Assaisonner les filets de poulet avec du sel et du poivre. Les cuire dans une poêle avec un filet d'huile d'olive pendant 6-7 minutes de chaque côté.",
      },
      {
        title: 'Préparer la sauce',
        description:
          "Mélanger l'huile d'olive restante avec le jus de citron, l'ail écrasé, du sel et du poivre pour faire la vinaigrette.",
      },
      {
        title: 'Assembler la salade',
        description:
          'Laver et couper la sucrine. Couper le poulet en tranches. Disposer la salade dans des assiettes.',
      },
      {
        title: 'Servir',
        description:
          'Ajouter le poulet coupé en tranches, arroser de vinaigrette et parsemer de copeaux de parmesan.',
      },
    ],
    time: 20,
    nutrition: {
      energyKcal: 368,
      energyKj: 1540,
      fat: 26.5,
      saturatedFat: 6.2,
      carbohydrates: 3.8,
      sugars: 2.1,
      fiber: 2.5,
      protein: 32.5,
      salt: 1.1,
      portionWeight: 280,
    },
  },
  {
    image_Source: 'risotto_champignons.png',
    title: 'Risotto aux Champignons',
    description: 'Un risotto crémeux aux champignons de Paris et au parmesan.',
    tags: [{ name: 'Italien' }, { name: 'Végétarien' }, { name: 'Dîner' }],
    persons: 4,
    ingredients: [
      {
        name: 'Riz arborio',
        quantity: '320',
        unit: 'g',
        type: ingredientType.cereal,
        season: ['*'],
      },
      {
        name: 'Champignons de paris',
        quantity: '400',
        unit: 'g',
        type: ingredientType.vegetable,
        season: ['*'],
      },
      {
        name: 'Parmesan',
        quantity: '80',
        unit: 'g',
        type: ingredientType.cheese,
        season: ['*'],
      },
      {
        name: 'Vin blanc',
        quantity: '100',
        unit: 'mL',
        type: ingredientType.sauce,
        season: ['*'],
      },
      {
        name: 'Bouillon de légume',
        quantity: '2',
        unit: '',
        type: ingredientType.condiment,
        season: ['*'],
      },
      {
        name: 'Échalottes',
        quantity: '2',
        unit: '',
        type: ingredientType.condiment,
        season: ['*'],
      },
      {
        name: "Huile d'olive",
        quantity: '30',
        unit: 'mL',
        type: ingredientType.oilAndFat,
        season: ['*'],
      },
      {
        name: 'Sel',
        quantity: '1',
        unit: 'pincée',
        type: ingredientType.spice,
        season: ['*'],
      },
      {
        name: 'Poivre',
        quantity: '1',
        unit: 'pincée',
        type: ingredientType.spice,
        season: ['*'],
      },
    ],
    season: ['*'],
    preparation: [
      {
        title: 'Préparer les ingrédients',
        description:
          'Émincer les échalotes et couper les champignons en lamelles. Préparer 1L de bouillon de légume chaud.',
      },
      {
        title: 'Nacrer le riz',
        description:
          "Dans une casserole, faire chauffer l'huile d'olive et faire revenir les échalotes. Ajouter le riz et le nacrer 2 minutes en remuant.",
      },
      {
        title: 'Cuire le risotto',
        description:
          "Déglacer avec le vin blanc. Ajouter une louche de bouillon chaud et remuer jusqu'à absorption. Répéter l'opération pendant 18-20 minutes.",
      },
      {
        title: 'Ajouter les champignons',
        description:
          'À mi-cuisson, faire sauter les champignons dans une poêle à part puis les incorporer au risotto.',
      },
      {
        title: 'Terminer',
        description:
          'Retirer du feu, incorporer le parmesan râpé, saler, poivrer et servir immédiatement.',
      },
    ],
    time: 35,
    nutrition: {
      energyKcal: 342,
      energyKj: 1432,
      fat: 10.8,
      saturatedFat: 4.2,
      carbohydrates: 48.5,
      sugars: 2.8,
      fiber: 2.2,
      protein: 12.8,
      salt: 1.4,
      portionWeight: 320,
    },
  },
  {
    image_Source: 'tacos_poulet.png',
    title: 'Tacos au Poulet',
    description: 'Des tacos colorés et savoureux avec du poulet mariné et des légumes croquants.',
    tags: [{ name: 'Mexicain' }, { name: 'Rapide' }, { name: 'Dîner' }],
    persons: 4,
    ingredients: [
      {
        name: 'Filets de poulet',
        quantity: '500',
        unit: '',
        type: ingredientType.poultry,
        season: ['*'],
      },
      {
        name: 'Poivron rouge',
        quantity: '1',
        unit: '',
        type: ingredientType.vegetable,
        season: ['6', '7', '8', '9'],
      },
      {
        name: 'Poivron jaune',
        quantity: '1',
        unit: '',
        type: ingredientType.vegetable,
        season: ['6', '7', '8', '9'],
      },
      {
        name: 'Tomate',
        quantity: '2',
        unit: '',
        type: ingredientType.vegetable,
        season: ['5', '6', '7', '8', '9'],
      },
      {
        name: 'Avocat',
        quantity: '2',
        unit: '',
        type: ingredientType.vegetable,
        season: ['*'],
      },
      {
        name: 'Citron vert',
        quantity: '1',
        unit: '',
        type: ingredientType.fruit,
        season: ['*'],
      },
      {
        name: 'Paprika',
        quantity: '2',
        unit: 'pincée',
        type: ingredientType.spice,
        season: ['*'],
      },
      {
        name: 'Cumin',
        quantity: '1',
        unit: 'pincée',
        type: ingredientType.spice,
        season: ['*'],
      },
      {
        name: "Huile d'olive",
        quantity: '30',
        unit: 'mL',
        type: ingredientType.oilAndFat,
        season: ['*'],
      },
      {
        name: 'Sel',
        quantity: '1',
        unit: 'pincée',
        type: ingredientType.spice,
        season: ['*'],
      },
      {
        name: 'Tortilla de blé',
        quantity: '8',
        unit: '',
        type: ingredientType.bread,
        season: ['*'],
      },
    ],
    season: ['6', '7', '8', '9'],
    preparation: [
      {
        title: 'Mariner le poulet',
        description:
          "Couper le poulet en lanières. Mélanger avec l'huile d'olive, le paprika, le cumin, du sel et laisser mariner 10 minutes.",
      },
      {
        title: 'Cuire le poulet',
        description:
          "Faire cuire le poulet mariné dans une poêle chaude pendant 8-10 minutes jusqu'à ce qu'il soit bien doré.",
      },
      {
        title: 'Préparer les légumes',
        description:
          "Émincer les poivrons et les faire sauter rapidement. Couper les tomates en dés et écraser l'avocat avec le jus de citron vert.",
      },
      {
        title: 'Assembler',
        description:
          "Garnir les tortillas avec le poulet, les poivrons, les tomates et le guacamole d'avocat. Servir immédiatement.",
      },
    ],
    time: 25,
    nutrition: {
      energyKcal: 285,
      energyKj: 1193,
      fat: 14.5,
      saturatedFat: 2.8,
      carbohydrates: 12.8,
      sugars: 5.2,
      fiber: 5.8,
      protein: 28.5,
      salt: 0.7,
      portionWeight: 280,
    },
  },
  {
    image_Source: 'quiche_lorraine.png',
    title: 'Quiche Lorraine',
    description: 'La quiche lorraine traditionnelle avec des lardons et de la crème.',
    tags: [{ name: 'Français' }, { name: 'Déjeuner' }, { name: 'Apéritif' }],
    persons: 6,
    ingredients: [
      {
        name: 'Oeuf',
        quantity: '4',
        unit: '',
        type: ingredientType.dairy,
        season: ['*'],
      },
      {
        name: 'Lait entier',
        quantity: '200',
        unit: 'mL',
        type: ingredientType.dairy,
        season: ['*'],
      },
      {
        name: 'Emmental rapé',
        quantity: '100',
        unit: 'g',
        type: ingredientType.cheese,
        season: ['*'],
      },
      {
        name: 'Poitrine de porc',
        quantity: '200',
        unit: 'g',
        type: ingredientType.meat,
        season: ['*'],
      },
      {
        name: 'Oignon jaune',
        quantity: '1',
        unit: '',
        type: ingredientType.condiment,
        season: ['*'],
      },
      {
        name: 'Muscade',
        quantity: '1',
        unit: 'pincée',
        type: ingredientType.spice,
        season: ['*'],
      },
      {
        name: 'Sel',
        quantity: '1',
        unit: 'pincée',
        type: ingredientType.spice,
        season: ['*'],
      },
      {
        name: 'Poivre',
        quantity: '1',
        unit: 'pincée',
        type: ingredientType.spice,
        season: ['*'],
      },
    ],
    season: ['*'],
    preparation: [
      {
        title: 'Préparer la garniture',
        description:
          "Couper la poitrine de porc en lardons et l'oignon en petits dés. Faire revenir les lardons dans une poêle, ajouter l'oignon et cuire 5 minutes.",
      },
      {
        title: "Préparer l'appareil",
        description:
          "Dans un saladier, battre les œufs avec le lait. Ajouter la muscade, du sel et du poivre. Incorporer l'emmental râpé.",
      },
      {
        title: 'Assembler',
        description:
          "Étaler une pâte brisée dans un moule à tarte. Répartir les lardons et l'oignon. Verser l'appareil à œufs dessus.",
      },
      {
        title: 'Cuire',
        description:
          "Enfourner à 180°C pendant 35-40 minutes jusqu'à ce que la quiche soit dorée et ferme. Laisser tiédir avant de servir.",
      },
    ],
    time: 50,
    nutrition: {
      energyKcal: 298,
      energyKj: 1248,
      fat: 18.5,
      saturatedFat: 8.2,
      carbohydrates: 18.2,
      sugars: 2.8,
      fiber: 0.8,
      protein: 15.8,
      salt: 1.5,
      portionWeight: 180,
    },
  },
  {
    image_Source: 'poelee_legumes_mediterraneens.png',
    title: 'Poêlée de Légumes Méditerranéens',
    description:
      'Un mélange coloré de légumes du soleil, parfait en accompagnement ou plat principal.',
    tags: [{ name: 'Méditerranéen' }, { name: 'Végétarien' }, { name: 'Santé' }, { name: 'Vegan' }],
    persons: 4,
    ingredients: [
      {
        name: 'Aubergine',
        quantity: '2',
        unit: '',
        type: ingredientType.vegetable,
        season: ['6', '7', '8', '9'],
      },
      {
        name: 'Courgette',
        quantity: '2',
        unit: '',
        type: ingredientType.vegetable,
        season: ['5', '6', '7', '8', '9'],
      },
      {
        name: 'Poivron rouge',
        quantity: '2',
        unit: '',
        type: ingredientType.vegetable,
        season: ['6', '7', '8', '9'],
      },
      {
        name: 'Tomate',
        quantity: '4',
        unit: '',
        type: ingredientType.vegetable,
        season: ['5', '6', '7', '8', '9'],
      },
      {
        name: 'Ail',
        quantity: '3',
        unit: '',
        type: ingredientType.condiment,
        season: ['*'],
      },
      {
        name: "Huile d'olive",
        quantity: '50',
        unit: 'mL',
        type: ingredientType.oilAndFat,
        season: ['*'],
      },
      {
        name: 'Herbe de provence',
        quantity: '2',
        unit: 'pincée',
        type: ingredientType.spice,
        season: ['*'],
      },
      {
        name: 'Sel',
        quantity: '1',
        unit: 'pincée',
        type: ingredientType.spice,
        season: ['*'],
      },
      {
        name: 'Poivre',
        quantity: '1',
        unit: 'pincée',
        type: ingredientType.spice,
        season: ['*'],
      },
    ],
    season: ['6', '7', '8', '9'],
    preparation: [
      {
        title: 'Préparer les légumes',
        description:
          'Laver tous les légumes. Couper les aubergines et courgettes en rondelles, les poivrons en lanières et les tomates en quartiers.',
      },
      {
        title: 'Cuire les aubergines',
        description:
          "Dans une grande poêle, faire chauffer la moitié de l'huile d'olive et faire revenir les aubergines 5 minutes. Réserver.",
      },
      {
        title: 'Cuire le reste des légumes',
        description:
          "Dans la même poêle, ajouter le reste d'huile et faire revenir les courgettes et poivrons pendant 5 minutes.",
      },
      {
        title: 'Mélanger et terminer',
        description:
          "Remettre les aubergines, ajouter les tomates, l'ail émincé et les herbes de Provence. Cuire 10 minutes à feu doux. Saler, poivrer et servir.",
      },
    ],
    time: 30,
    nutrition: {
      energyKcal: 152,
      energyKj: 636,
      fat: 10.8,
      saturatedFat: 1.5,
      carbohydrates: 12.5,
      sugars: 8.2,
      fiber: 5.8,
      protein: 2.8,
      salt: 0.4,
      portionWeight: 300,
    },
  },
  {
    image_Source: 'saumon_grille_brocoli.png',
    title: 'Saumon Grillé et Brocoli',
    description: 'Un plat sain et équilibré avec du saumon grillé et du brocoli vapeur.',
    tags: [{ name: 'Santé' }, { name: 'Rapide' }, { name: 'Dîner' }],
    persons: 2,
    ingredients: [
      {
        name: 'Saumon',
        quantity: '2',
        unit: '',
        type: ingredientType.fish,
        season: ['*'],
      },
      {
        name: 'Brocoli',
        quantity: '1',
        unit: '',
        type: ingredientType.vegetable,
        season: ['6', '7', '8', '9', '10', '11'],
      },
      {
        name: 'Citron jaune',
        quantity: '1',
        unit: '',
        type: ingredientType.fruit,
        season: ['*'],
      },
      {
        name: "Huile d'olive",
        quantity: '30',
        unit: 'mL',
        type: ingredientType.oilAndFat,
        season: ['*'],
      },
      {
        name: 'Ail',
        quantity: '1',
        unit: '',
        type: ingredientType.condiment,
        season: ['*'],
      },
      {
        name: 'Sel',
        quantity: '1',
        unit: 'pincée',
        type: ingredientType.spice,
        season: ['*'],
      },
      {
        name: 'Poivre',
        quantity: '1',
        unit: 'pincée',
        type: ingredientType.spice,
        season: ['*'],
      },
      {
        name: 'Sésame doré',
        quantity: '1',
        unit: 'c. à soupe',
        type: ingredientType.topping,
        season: ['*'],
      },
    ],
    season: ['6', '7', '8', '9', '10', '11'],
    preparation: [
      {
        title: 'Préparer le brocoli',
        description:
          "Couper le brocoli en bouquets. Les faire cuire à la vapeur pendant 8-10 minutes jusqu'à ce qu'ils soient tendres mais encore croquants.",
      },
      {
        title: 'Cuire le saumon',
        description:
          "Badigeonner les pavés de saumon avec de l'huile d'olive, saler et poivrer. Les cuire dans une poêle chaude 4-5 minutes de chaque côté.",
      },
      {
        title: "Préparer l'assaisonnement",
        description:
          "Mélanger le jus de citron avec de l'huile d'olive et l'ail écrasé pour faire une vinaigrette.",
      },
      {
        title: 'Servir',
        description:
          'Disposer le saumon et le brocoli dans les assiettes. Arroser de vinaigrette citron-ail et servir immédiatement.',
      },
    ],
    time: 20,
    nutrition: {
      energyKcal: 358,
      energyKj: 1498,
      fat: 24.5,
      saturatedFat: 4.2,
      carbohydrates: 5.2,
      sugars: 2.8,
      fiber: 3.5,
      protein: 32.8,
      salt: 0.8,
      portionWeight: 280,
    },
  },
  {
    image_Source: 'butternut_rotie.png',
    title: 'Butternut Rôtie au Four',
    description: 'Une courge butternut rôtie au four avec des herbes aromatiques.',
    tags: [{ name: 'Végétarien' }, { name: 'Santé' }, { name: 'Vegan' }],
    persons: 4,
    ingredients: [
      {
        name: 'Butternut',
        quantity: '1000',
        unit: 'g',
        type: ingredientType.vegetable,
        season: ['1', '9', '10', '11', '12'],
      },
      {
        name: "Huile d'olive",
        quantity: '40',
        unit: 'mL',
        type: ingredientType.oilAndFat,
        season: ['*'],
      },
      {
        name: 'Romarin',
        quantity: '2',
        unit: 'pincée',
        type: ingredientType.spice,
        season: ['*'],
      },
      {
        name: 'Ail',
        quantity: '3',
        unit: '',
        type: ingredientType.condiment,
        season: ['*'],
      },
      {
        name: 'Paprika',
        quantity: '1',
        unit: 'pincée',
        type: ingredientType.spice,
        season: ['*'],
      },
      {
        name: 'Sel',
        quantity: '1',
        unit: 'pincée',
        type: ingredientType.spice,
        season: ['*'],
      },
      {
        name: 'Poivre',
        quantity: '1',
        unit: 'pincée',
        type: ingredientType.spice,
        season: ['*'],
      },
    ],
    season: ['1', '9', '10', '11', '12'],
    preparation: [
      {
        title: 'Préparer la butternut',
        description:
          'Préchauffer le four à 200°C. Éplucher la butternut, retirer les graines et la couper en cubes de 3cm.',
      },
      {
        title: 'Assaisonner',
        description:
          "Dans un saladier, mélanger les cubes de butternut avec l'huile d'olive, le romarin, l'ail écrasé, le paprika, du sel et du poivre.",
      },
      {
        title: 'Rôtir au four',
        description:
          'Étaler les cubes de butternut sur une plaque de cuisson. Enfourner pendant 35-40 minutes en retournant à mi-cuisson.',
      },
      {
        title: 'Servir',
        description:
          'La butternut est prête quand elle est bien dorée et tendre. Servir chaud en accompagnement ou avec une salade verte.',
      },
    ],
    time: 40,
    nutrition: {
      energyKcal: 125,
      energyKj: 523,
      fat: 8.5,
      saturatedFat: 1.2,
      carbohydrates: 12.8,
      sugars: 3.5,
      fiber: 2.8,
      protein: 1.5,
      salt: 0.5,
      portionWeight: 250,
    },
  },
];
