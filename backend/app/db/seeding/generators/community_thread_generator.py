import random
from datetime import datetime

from faker import Faker
from sqlalchemy.orm import Session

from app.db.db_schema import (
    CommentLike,
    CommunityThread,
    PregnantWoman,
    ThreadCategory,
    ThreadCategoryAssociation,
    ThreadComment,
    User,
)


class CommunityThreadGenerator:
    @staticmethod
    def generate_thread_categories(db: Session) -> list[ThreadCategory]:
        print("Generating thread categories....")
        category_names: list[str] = [
            "Pregnancy Tips",
            "Nutrition",
            "Exercise",
            "Mental Health",
            "Labor and Delivery",
            "Postpartum Care",
            "Sleep",
            "Lifestyle",
            "Parenting",
            "Support",
            "Self Care",
        ]
        thread_categories: list[ThreadCategory] = [ThreadCategory(label=cat_name) for cat_name in category_names]
        db.add_all(thread_categories)
        return thread_categories

    @staticmethod
    def generate_threads(
        db: Session, faker: Faker, all_users: list[User], all_thread_categories: list[ThreadCategory], count: int
    ) -> list[CommunityThread]:
        print("Generating community threads....")

        all_community_threads: list[CommunityThread] = []
        for _ in range(count):
            random_user: User = random.choice(all_users)
            new_thread = CommunityThread(
                creator=random_user,
                title=faker.sentence(nb_words=random.randint(3, 9)),
                content=faker.paragraph(nb_sentences=random.randint(3, 10)),
                posted_at=faker.date_time_between(start_date=random_user.created_at, end_date=datetime.now()),
            )

            categories_sample: list[ThreadCategory] = random.sample(
                population=all_thread_categories, k=random.randint(1, len(all_thread_categories) // 3)
            )
            for category_from_sample in categories_sample:
                assoc_obj = ThreadCategoryAssociation(
                    thread=new_thread,
                    category=category_from_sample,
                )
                new_thread.thread_category_associations.append(assoc_obj)

            all_community_threads.append(new_thread)
            db.add(new_thread)
        return all_community_threads

    @staticmethod
    def generate_thread_comments(
        db: Session,
        faker: Faker,
        all_users: list[User],
        all_community_threads: list[CommunityThread],
        max_comments_per_thread: int,
    ) -> list[ThreadComment]:
        print("Generating thread comments....")

        all_thread_comments: list[ThreadComment] = []
        for community_thread in all_community_threads:
            random_user: User = random.choice(all_users)
            num_comments = random.randint(0, max_comments_per_thread)
            for _ in range(num_comments):
                comment = ThreadComment(
                    thread=community_thread,
                    commenter=random_user,
                    commented_at=faker.date_time_between(start_date="-2y", end_date=datetime.now()),
                    content=faker.paragraph(nb_sentences=random.randint(2, 12)),
                )
                all_thread_comments.append(comment)

        db.add_all(all_thread_comments)
        return all_thread_comments

    @staticmethod
    def generate_comment_likes(
        db: Session, all_mothers: list[PregnantWoman], all_thread_comments: list[ThreadComment]
    ) -> None:
        print("Generating comment likes.....")

        for comment in all_thread_comments:
            num_likes: int = random.randint(0, len(all_mothers))
            random_likers: list[PregnantWoman] = random.sample(all_mothers, num_likes)
            for mother in random_likers:
                comment.comment_likes.append(CommentLike(comment=comment, liker=mother))
                db.add(comment)
