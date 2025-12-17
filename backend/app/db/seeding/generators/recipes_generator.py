import json
import random
from pathlib import Path

from sqlalchemy.orm import Session

from app.core.custom_base_model import CustomBaseModel
from app.db.db_schema import (
    Nutritionist,
    PregnantWoman,
    Recipe,
    RecipeCategory,
    RecipeToCategoryAssociation,
    SavedRecipe,
)
from app.shared.s3_storage_interface import S3StorageInterface


class RecipeModel(CustomBaseModel):
    name: str
    description: str
    est_calories: str
    pregnancy_benefit: str
    serving: int
    instructions_markdown: str
    photo_url: str
    categories: list[str]


class RecipesGenerator:
    @staticmethod
    def generate_all_recipes(
        db: Session,
        all_mothers: list[PregnantWoman],
        all_nutritionists: list[Nutritionist],
        recipe_data_file: str,
    ) -> None:
        print("Generating Recipes....")
        recipes = RecipesGenerator.generate_fake_recipes(db, all_nutritionists, recipe_data_file)
        RecipesGenerator.generate_saved_recipes(db, all_mothers, recipes)

    @staticmethod
    def generate_fake_recipes(
        db: Session, all_nutritionists: list[Nutritionist], recipe_data_file: str
    ) -> list[Recipe]:
        # --------- Validating that the image files match the recipe data ---------
        recipes_path: Path = Path(recipe_data_file).parent
        try:
            with open(recipe_data_file, "r", encoding="utf-8") as f:
                raw_recipe_data = json.load(f)
        except FileNotFoundError:
            raise FileNotFoundError(f"Recipe data file not found: {recipe_data_file}")
        except json.JSONDecodeError:
            raise ValueError(f"Invalid JSON format in file: {recipe_data_file}")
        recipe_data: list[RecipeModel] = [RecipeModel(**recipe) for recipe in raw_recipe_data]

        missing_images: list[str] = []
        for new_recipe in recipe_data:
            photo_filename = new_recipe.photo_url
            if photo_filename:
                image_path = recipes_path / photo_filename
                if not image_path.is_file():
                    missing_images.append(photo_filename)

        if missing_images:
            missing_count = len(missing_images)
            raise FileNotFoundError(
                f"FATAL ERROR: Found {missing_count} missing image file(s) in directory '{recipes_path}'. "
                f"Missing files: {', '.join(missing_images[:5])}{'...' if missing_count > 5 else ''}"
            )

        # --- Continue with seeding logic here ---
        all_recipes: list[Recipe] = []
        all_recipe_categories: dict[str, RecipeCategory] = {}

        for recipe_json in recipe_data:
            new_recipe = Recipe(
                nutritionist=random.choice(all_nutritionists),
                name=recipe_json.name,
                description=recipe_json.description,
                est_calories=recipe_json.est_calories,
                pregnancy_benefit=recipe_json.pregnancy_benefit,
                img_key=recipe_json.photo_url,
                serving_count=recipe_json.serving,
                instructions_markdown=recipe_json.instructions_markdown,
            )
            recipe_cat_assocs_to_add: list[RecipeToCategoryAssociation] = []
            for category_name in recipe_json.categories:
                if category_name not in all_recipe_categories:
                    all_recipe_categories[category_name] = RecipeCategory(label=category_name)
                category_obj = all_recipe_categories[category_name]
                recipe_cat_assocs_to_add.append(RecipeToCategoryAssociation(recipe=new_recipe, category=category_obj))
            new_recipe.recipe_category_associations = recipe_cat_assocs_to_add

            db.add(new_recipe)
            db.flush()

            img_key = S3StorageInterface.put_recipe_img_from_filepath(
                new_recipe.id, recipes_path / recipe_json.photo_url
            )
            new_recipe.img_key = img_key
            if img_key is None:
                raise ValueError(f"Failed to upload image for recipe '{new_recipe.name}'")
            all_recipes.append(new_recipe)
        return all_recipes

    @staticmethod
    def generate_saved_recipes(db: Session, all_mothers: list[PregnantWoman], all_recipes: list[Recipe]) -> None:
        for recipe_to_save in all_recipes:
            sample_size: int = random.randint(0, len(all_mothers) // 5)
            mothers_sample: list[PregnantWoman] = random.sample(all_mothers, k=sample_size)
            for mother in mothers_sample:
                db.add(SavedRecipe(saver=mother, recipe=recipe_to_save))

    # @staticmethod
    # def generate_ingredients(db: Session) -> list[Ingredient]:
    #     print("Generating Ingredients...")
    #     all_ingredients: list[Ingredient] = [
    #         Ingredient(name="Water", protein_per_100g=0, carbs_per_100g=0, fats_per_100g=0),
    #         Ingredient(name="Salt", protein_per_100g=0, carbs_per_100g=0, fats_per_100g=0),
    #         Ingredient(name="Sugar (granulated)", protein_per_100g=0, carbs_per_100g=100, fats_per_100g=0),
    #         Ingredient(name="Honey", protein_per_100g=0, carbs_per_100g=82, fats_per_100g=0),
    #         Ingredient(name="All-purpose flour", protein_per_100g=10, carbs_per_100g=76, fats_per_100g=1),
    #         Ingredient(name="Whole wheat flour", protein_per_100g=13, carbs_per_100g=72, fats_per_100g=2),
    #         Ingredient(name="Rice (white, cooked)", protein_per_100g=2, carbs_per_100g=28, fats_per_100g=0),
    #         Ingredient(name="Rice (brown, cooked)", protein_per_100g=2, carbs_per_100g=23, fats_per_100g=1),
    #         Ingredient(name="Oats (rolled)", protein_per_100g=13, carbs_per_100g=67, fats_per_100g=7),
    #         Ingredient(name="Pasta (dry)", protein_per_100g=13, carbs_per_100g=75, fats_per_100g=1),
    #         Ingredient(name="Quinoa (cooked)", protein_per_100g=4, carbs_per_100g=21, fats_per_100g=2),
    #         Ingredient(name="Bread (white)", protein_per_100g=8, carbs_per_100g=49, fats_per_100g=3),
    #         Ingredient(name="Bread (whole wheat)", protein_per_100g=9, carbs_per_100g=43, fats_per_100g=4),
    #         Ingredient(name="Bagel", protein_per_100g=10, carbs_per_100g=56, fats_per_100g=2),
    #         Ingredient(name="Tortilla (corn)", protein_per_100g=6, carbs_per_100g=50, fats_per_100g=3),
    #         Ingredient(name="Cornmeal", protein_per_100g=7, carbs_per_100g=73, fats_per_100g=4),
    #         Ingredient(name="Polenta", protein_per_100g=3, carbs_per_100g=15, fats_per_100g=1),
    #         Ingredient(name="Barley (cooked)", protein_per_100g=2, carbs_per_100g=28, fats_per_100g=0),
    #         Ingredient(name="Millet (cooked)", protein_per_100g=3, carbs_per_100g=23, fats_per_100g=1),
    #         Ingredient(name="Buckwheat (cooked)", protein_per_100g=3, carbs_per_100g=20, fats_per_100g=1),
    #         Ingredient(name="Lentils (cooked)", protein_per_100g=9, carbs_per_100g=20, fats_per_100g=0),
    #         Ingredient(name="Chickpeas (cooked)", protein_per_100g=9, carbs_per_100g=27, fats_per_100g=3),
    #         Ingredient(name="Black beans (cooked)", protein_per_100g=9, carbs_per_100g=23, fats_per_100g=0),
    #         Ingredient(name="Kidney beans (cooked)", protein_per_100g=8, carbs_per_100g=22, fats_per_100g=0),
    #         Ingredient(name="Pinto beans (cooked)", protein_per_100g=9, carbs_per_100g=27, fats_per_100g=1),
    #         Ingredient(name="Green peas (cooked)", protein_per_100g=5, carbs_per_100g=14, fats_per_100g=0),
    #         Ingredient(name="Tofu (firm)", protein_per_100g=8, carbs_per_100g=2, fats_per_100g=5),
    #         Ingredient(name="Tempeh", protein_per_100g=19, carbs_per_100g=9, fats_per_100g=11),
    #         Ingredient(name="Seitan", protein_per_100g=25, carbs_per_100g=14, fats_per_100g=2),
    #         Ingredient(name="Almonds", protein_per_100g=21, carbs_per_100g=22, fats_per_100g=49),
    #         Ingredient(name="Walnuts", protein_per_100g=15, carbs_per_100g=14, fats_per_100g=65),
    #         Ingredient(name="Pistachios", protein_per_100g=20, carbs_per_100g=28, fats_per_100g=45),
    #         Ingredient(name="Cashews", protein_per_100g=18, carbs_per_100g=30, fats_per_100g=44),
    #         Ingredient(name="Peanuts", protein_per_100g=25, carbs_per_100g=16, fats_per_100g=49),
    #         Ingredient(name="Peanut butter", protein_per_100g=25, carbs_per_100g=20, fats_per_100g=50),
    #         Ingredient(name="Chia seeds", protein_per_100g=17, carbs_per_100g=42, fats_per_100g=31),
    #         Ingredient(name="Flaxseed", protein_per_100g=18, carbs_per_100g=29, fats_per_100g=42),
    #         Ingredient(name="Pumpkin seeds", protein_per_100g=19, carbs_per_100g=54, fats_per_100g=49),
    #         Ingredient(name="Sunflower seeds", protein_per_100g=21, carbs_per_100g=20, fats_per_100g=51),
    #         Ingredient(name="Milk (whole)", protein_per_100g=3, carbs_per_100g=5, fats_per_100g=3),
    #         Ingredient(name="Milk (skim)", protein_per_100g=3, carbs_per_100g=5, fats_per_100g=0),
    #         Ingredient(name="Yogurt (plain)", protein_per_100g=10, carbs_per_100g=4, fats_per_100g=0),
    #         Ingredient(name="Greek yogurt", protein_per_100g=10, carbs_per_100g=4, fats_per_100g=0),
    #         Ingredient(name="Cheddar cheese", protein_per_100g=25, carbs_per_100g=1, fats_per_100g=33),
    #         Ingredient(name="Mozzarella", protein_per_100g=22, carbs_per_100g=2, fats_per_100g=22),
    #         Ingredient(name="Cream cheese", protein_per_100g=7, carbs_per_100g=5, fats_per_100g=34),
    #         Ingredient(name="Butter", protein_per_100g=0, carbs_per_100g=1, fats_per_100g=81),
    #         Ingredient(name="Heavy cream", protein_per_100g=2, carbs_per_100g=3, fats_per_100g=37),
    #         Ingredient(name="Egg (whole)", protein_per_100g=13, carbs_per_100g=1, fats_per_100g=11),
    #         Ingredient(name="Egg white", protein_per_100g=11, carbs_per_100g=1, fats_per_100g=0),
    #         Ingredient(name="Chicken breast (cooked)", protein_per_100g=31, carbs_per_100g=0, fats_per_100g=3),
    #         Ingredient(name="Turkey (cooked)", protein_per_100g=29, carbs_per_100g=0, fats_per_100g=7),
    #         Ingredient(name="Beef (ground, cooked)", protein_per_100g=26, carbs_per_100g=0, fats_per_100g=20),
    #         Ingredient(name="Pork (cooked)", protein_per_100g=27, carbs_per_100g=0, fats_per_100g=14),
    #         Ingredient(name="Lamb (cooked)", protein_per_100g=25, carbs_per_100g=0, fats_per_100g=21),
    #         Ingredient(name="Salmon (cooked)", protein_per_100g=25, carbs_per_100g=0, fats_per_100g=13),
    #         Ingredient(name="Tuna (canned in water)", protein_per_100g=23, carbs_per_100g=0, fats_per_100g=1),
    #         Ingredient(name="Shrimp (cooked)", protein_per_100g=24, carbs_per_100g=0, fats_per_100g=1),
    #         Ingredient(name="Cod (cooked)", protein_per_100g=18, carbs_per_100g=0, fats_per_100g=1),
    #         Ingredient(name="Mackerel (cooked)", protein_per_100g=19, carbs_per_100g=0, fats_per_100g=15),
    #         Ingredient(name="Sardines (canned)", protein_per_100g=25, carbs_per_100g=0, fats_per_100g=11),
    #         Ingredient(name="Avocado", protein_per_100g=2, carbs_per_100g=9, fats_per_100g=15),
    #         Ingredient(name="Olive oil", protein_per_100g=0, carbs_per_100g=0, fats_per_100g=100),
    #         Ingredient(name="Canola oil", protein_per_100g=0, carbs_per_100g=0, fats_per_100g=100),
    #         Ingredient(name="Coconut oil", protein_per_100g=0, carbs_per_100g=0, fats_per_100g=100),
    #         Ingredient(name="Vegetable oil", protein_per_100g=0, carbs_per_100g=0, fats_per_100g=100),
    #         Ingredient(name="Potato (white, cooked)", protein_per_100g=2, carbs_per_100g=20, fats_per_100g=0),
    #         Ingredient(name="Sweet potato (cooked)", protein_per_100g=1, carbs_per_100g=20, fats_per_100g=0),
    #         Ingredient(name="Tomato", protein_per_100g=1, carbs_per_100g=4, fats_per_100g=0),
    #         Ingredient(name="Onion", protein_per_100g=1, carbs_per_100g=9, fats_per_100g=0),
    #         Ingredient(name="Garlic", protein_per_100g=6, carbs_per_100g=33, fats_per_100g=0),
    #         Ingredient(name="Carrot", protein_per_100g=1, carbs_per_100g=10, fats_per_100g=0),
    #         Ingredient(name="Broccoli (cooked)", protein_per_100g=3, carbs_per_100g=7, fats_per_100g=0),
    #         Ingredient(name="Spinach (cooked)", protein_per_100g=3, carbs_per_100g=4, fats_per_100g=0),
    #         Ingredient(name="Kale (cooked)", protein_per_100g=2, carbs_per_100g=7, fats_per_100g=0),
    #         Ingredient(name="Lettuce", protein_per_100g=1, carbs_per_100g=3, fats_per_100g=0),
    #         Ingredient(name="Cucumber", protein_per_100g=1, carbs_per_100g=4, fats_per_100g=0),
    #         Ingredient(name="Zucchini", protein_per_100g=1, carbs_per_100g=3, fats_per_100g=0),
    #         Ingredient(name="Eggplant", protein_per_100g=1, carbs_per_100g=6, fats_per_100g=0),
    #         Ingredient(name="Mushroom (white)", protein_per_100g=3, carbs_per_100g=3, fats_per_100g=0),
    #         Ingredient(name="Bell pepper (red)", protein_per_100g=1, carbs_per_100g=6, fats_per_100g=0),
    #         Ingredient(name="Corn (cooked)", protein_per_100g=3, carbs_per_100g=19, fats_per_100g=1),
    #         Ingredient(name="Banana", protein_per_100g=1, carbs_per_100g=23, fats_per_100g=0),
    #         Ingredient(name="Apple", protein_per_100g=0, carbs_per_100g=14, fats_per_100g=0),
    #         Ingredient(name="Orange", protein_per_100g=1, carbs_per_100g=12, fats_per_100g=0),
    #         Ingredient(name="Strawberries", protein_per_100g=1, carbs_per_100g=8, fats_per_100g=0),
    #         Ingredient(name="Blueberries", protein_per_100g=1, carbs_per_100g=14, fats_per_100g=0),
    #         Ingredient(name="Grapes", protein_per_100g=0, carbs_per_100g=18, fats_per_100g=0),
    #         Ingredient(name="Pineapple", protein_per_100g=0, carbs_per_100g=13, fats_per_100g=0),
    #         Ingredient(name="Mango", protein_per_100g=1, carbs_per_100g=15, fats_per_100g=0),
    #         Ingredient(name="Coconut (fresh)", protein_per_100g=3, carbs_per_100g=15, fats_per_100g=33),
    #         Ingredient(name="Dates", protein_per_100g=2, carbs_per_100g=75, fats_per_100g=0),
    #         Ingredient(name="Raisins", protein_per_100g=3, carbs_per_100g=79, fats_per_100g=0),
    #         Ingredient(name="Dark chocolate (70% cocoa)", protein_per_100g=7, carbs_per_100g=46, fats_per_100g=43),
    #         Ingredient(name="Cocoa powder", protein_per_100g=20, carbs_per_100g=50, fats_per_100g=22),
    #         Ingredient(name="Coffee (brewed)", protein_per_100g=0, carbs_per_100g=0, fats_per_100g=0),
    #         Ingredient(name="Tea (black)", protein_per_100g=0, carbs_per_100g=0, fats_per_100g=0),
    #         Ingredient(name="Soy sauce", protein_per_100g=8, carbs_per_100g=5, fats_per_100g=0),
    #         Ingredient(name="Miso", protein_per_100g=12, carbs_per_100g=24, fats_per_100g=7),
    #         Ingredient(name="Vinegar (white)", protein_per_100g=0, carbs_per_100g=0, fats_per_100g=0),
    #         Ingredient(name="Ketchup", protein_per_100g=1, carbs_per_100g=25, fats_per_100g=0),
    #         Ingredient(name="Mustard", protein_per_100g=5, carbs_per_100g=5, fats_per_100g=30),
    #         Ingredient(name="Mayonnaise", protein_per_100g=1, carbs_per_100g=0, fats_per_100g=75),
    #         Ingredient(name="Cinnamon (ground)", protein_per_100g=4, carbs_per_100g=81, fats_per_100g=1),
    #         Ingredient(name="Black pepper (ground)", protein_per_100g=10, carbs_per_100g=64, fats_per_100g=3),
    #         Ingredient(name="Ginger (fresh)", protein_per_100g=2, carbs_per_100g=18, fats_per_100g=0),
    #         Ingredient(name="Turmeric (ground)", protein_per_100g=8, carbs_per_100g=65, fats_per_100g=10),
    #         Ingredient(name="Basil (fresh)", protein_per_100g=3, carbs_per_100g=2, fats_per_100g=0),
    #         Ingredient(name="Parsley (fresh)", protein_per_100g=3, carbs_per_100g=6, fats_per_100g=1),
    #         Ingredient(name="Cilantro (fresh)", protein_per_100g=2, carbs_per_100g=3, fats_per_100g=0),
    #         Ingredient(name="Rosemary (fresh)", protein_per_100g=3, carbs_per_100g=5, fats_per_100g=8),
    #         Ingredient(name="Thyme (fresh)", protein_per_100g=5, carbs_per_100g=7, fats_per_100g=1),
    #         Ingredient(name="Nutmeg (ground)", protein_per_100g=6, carbs_per_100g=49, fats_per_100g=36),
    #         Ingredient(name="Salted butter", protein_per_100g=1, carbs_per_100g=1, fats_per_100g=81),
    #         Ingredient(name="Maple syrup", protein_per_100g=0, carbs_per_100g=67, fats_per_100g=0),
    #         Ingredient(name="Molasses", protein_per_100g=0, carbs_per_100g=75, fats_per_100g=0),
    #         Ingredient(name="Breadcrumbs", protein_per_100g=13, carbs_per_100g=72, fats_per_100g=3),
    #         Ingredient(name="Yeast (active dry)", protein_per_100g=40, carbs_per_100g=40, fats_per_100g=7),
    #     ]
    #     db.add_all(all_ingredients)
    #     return all_ingredients
