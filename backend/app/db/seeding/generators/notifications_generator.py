import json

from faker import Faker
from sqlalchemy.orm import Session

from app.db.db_schema import CommentLike, Notification, NotificationType
from app.features.notifications.notification_helpers import get_rand_comment_like_notif
from app.shared.utils import format_user_fullname


class NotificationsGenerator:
    @staticmethod
    def generate_comment_likes_notifs(db: Session, faker: Faker, all_comment_likes: list[CommentLike]):
        notifs_to_add: list[Notification] = []
        for comment_like in all_comment_likes:
            liker_name = format_user_fullname(comment_like.liker)
            notif_data = get_rand_comment_like_notif(liker_name, comment_like.comment.thread.title)

            notifs_to_add.append(
                Notification(
                    recipient_id=comment_like.comment.thread.creator_id,
                    content=notif_data.body,
                    sent_at=faker.date_time_this_year(),
                    is_seen=True if faker.boolean(chance_of_getting_true=33) else False,
                    type=NotificationType.THREAD_LIKE,
                    data=json.dumps({"thread_id": comment_like.comment.thread_id}),
                )
            )
        db.add_all(notifs_to_add)
