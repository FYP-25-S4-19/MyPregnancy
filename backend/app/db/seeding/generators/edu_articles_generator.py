import json
import random
from dataclasses import dataclass
from math import floor

from sqlalchemy.orm import Session

from app.db.db_schema import (
    EduArticle,
    EduArticleCategory,
    PregnantWoman,
    SavedEduArticle,
    User,
)


@dataclass
class ArticleDataModel:
    title: str
    content: str


class EduArticlesGenerator:
    @staticmethod
    def generate_edu_article_categories(db: Session) -> list[EduArticleCategory]:
        print("Generating educational article categories.....")

        category_labels = [
            "NUTRITION",
            "BODY",
            "BABY",
            "FEEL_GOOD",
            "MEDICAL",
            "EXERCISE",
            "LABOUR",
            "LIFESTYLE",
            "RELATIONSHIPS",
        ]

        category_objs = [EduArticleCategory(label=label) for label in category_labels]
        db.add_all(category_objs)
        db.flush()
        return category_objs

    @staticmethod
    def generate_edu_articles(
        db: Session, articles_json_path: str, categories: list[EduArticleCategory], all_users: list[User]
    ) -> list[EduArticle]:
        print("Generating educational articles.....")

        all_edu_articles: list[EduArticle] = []
        with open(articles_json_path, "r") as file:
            raw_articles_data = json.load(file)
            articles_data: list[ArticleDataModel] = [ArticleDataModel(**article) for article in raw_articles_data]

            for article_data in articles_data:
                article = EduArticle(
                    author=random.choice(all_users),
                    category=random.choice(categories),
                    trimester=random.randint(1, 3),
                    title=article_data.title,
                    content_markdown=article_data.content,
                )
                all_edu_articles.append(article)
                db.add(article)

        return all_edu_articles

    @staticmethod
    def generate_saved_edu_articles(
        db: Session, all_articles: list[EduArticle], all_mothers: list[PregnantWoman]
    ) -> None:
        print("Generating 'saved edu article' entries.....")

        mothers_sample_size: int = random.randint(0, len(all_mothers))
        mothers_sample: list[PregnantWoman] = random.sample(population=all_mothers, k=mothers_sample_size)
        for mother in mothers_sample:
            articles_sample_size: int = random.randint(0, floor(len(all_articles) * 0.3))
            articles_sample: list[EduArticle] = random.sample(population=all_articles, k=articles_sample_size)
            for article in articles_sample:
                saved_article = SavedEduArticle(saver=mother, article=article)
                db.add(saved_article)
