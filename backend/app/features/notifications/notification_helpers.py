import random
from typing import Optional

from app.core.custom_base_model import CustomBaseModel


class NotificationPreset(CustomBaseModel):
    title: str
    body: str


class ThreadLikeNotificationPreset(NotificationPreset):
    thread_title: Optional[str] = None


class ThreadCommentNotificationPreset(NotificationPreset):
    sender_name: Optional[str] = None
    thread_title: Optional[str] = None
    comment_excerpt: Optional[str] = None


class CommentLikeNotificationPreset(NotificationPreset):
    liker_name: Optional[str] = None
    thread_title: Optional[str] = None


class CommentReplyNotificationPreset(NotificationPreset):
    sender_name: Optional[str] = None
    thread_title: Optional[str] = None
    reply_excerpt: Optional[str] = None


class NewArticleNotificationPreset(NotificationPreset):
    article_title: Optional[str] = None


class AppointmentReminderNotificationPreset(NotificationPreset):
    appointment_time: Optional[str] = None
    appointment_date: Optional[str] = None
    provider_name: Optional[str] = None
    appointment_location: Optional[str] = None


class AppointmentRequestNotificationPreset(NotificationPreset):
    sender_name: Optional[str] = None
    requested_date: Optional[str] = None


class PrivateMessageNotificationPreset(NotificationPreset):
    sender_name: Optional[str] = None
    message_excerpt: Optional[str] = None


def get_rand_thread_like_notif(thread_title: str) -> ThreadLikeNotificationPreset:
    presets = [
        ThreadLikeNotificationPreset(
            title="Your thread got a like!",
            body='Someone liked your thread "{thread_title}". Tap to see who.',
        ),
        ThreadLikeNotificationPreset(
            title="Nice! A new like",
            body='A user showed appreciation for your post: "{thread_title}".',
        ),
        ThreadLikeNotificationPreset(
            title="Thread appreciated",
            body="Your thread is getting attention — someone liked it.",
        ),
        ThreadLikeNotificationPreset(
            title="People are reading your thread",
            body='Someone liked "{thread_title}". Keep the conversation going!',
        ),
        ThreadLikeNotificationPreset(
            title="You've been liked",
            body="Someone tapped the like button on your thread. View it now.",
        ),
    ]
    preset = random.choice(presets)
    formatted_title = preset.title.format(thread_title=thread_title)
    formatted_body = preset.body.format(thread_title=thread_title)
    return ThreadLikeNotificationPreset(
        title=formatted_title,
        body=formatted_body,
        thread_title=thread_title,
    )


def get_rand_thread_comment_notif(
    sender_name: str, thread_title: str, comment_excerpt: str
) -> ThreadCommentNotificationPreset:
    presets = [
        ThreadCommentNotificationPreset(
            title="New comment on your thread",
            body='{sender_name} commented on "{thread_title}": "{comment_excerpt}"',
        ),
        ThreadCommentNotificationPreset(
            title="Someone joined the conversation",
            body='A new comment was added to your thread "{thread_title}".',
        ),
        ThreadCommentNotificationPreset(
            title="Comment received",
            body='Your thread "{thread_title}" got a new comment. See what they said.',
        ),
        ThreadCommentNotificationPreset(
            title="Keep the discussion going!",
            body='There\'s a fresh comment on your thread "{thread_title}".',
        ),
        ThreadCommentNotificationPreset(
            title="You have a new thread comment",
            body='Check the latest reply on "{thread_title}".',
        ),
    ]
    preset = random.choice(presets)
    formatted_title = preset.title.format(
        sender_name=sender_name, thread_title=thread_title, comment_excerpt=comment_excerpt
    )
    formatted_body = preset.body.format(
        sender_name=sender_name, thread_title=thread_title, comment_excerpt=comment_excerpt
    )
    return ThreadCommentNotificationPreset(
        title=formatted_title,
        body=formatted_body,
        sender_name=sender_name,
        thread_title=thread_title,
        comment_excerpt=comment_excerpt,
    )


def get_rand_comment_like_notif(liker_name: str, thread_title: str) -> CommentLikeNotificationPreset:
    presets = [
        CommentLikeNotificationPreset(
            title="Someone liked your comment",
            body="A user liked one of your comments. Tap to view it in context.",
        ),
        CommentLikeNotificationPreset(
            title="Comment appreciation",
            body="People liked what you said — your comment received a new like.",
        ),
        CommentLikeNotificationPreset(
            title="Nice reaction!",
            body='{liker_name} liked your comment on "{thread_title}".',
        ),
        CommentLikeNotificationPreset(
            title="Your comment got a like",
            body="Someone liked your reply. Open the thread to read more.",
        ),
        CommentLikeNotificationPreset(
            title="Your voice is being heard",
            body="A like was added to your comment. Nice contribution!",
        ),
    ]
    preset = random.choice(presets)
    formatted_title = preset.title.format(liker_name=liker_name, thread_title=thread_title)
    formatted_body = preset.body.format(liker_name=liker_name, thread_title=thread_title)
    return CommentLikeNotificationPreset(
        title=formatted_title,
        body=formatted_body,
        liker_name=liker_name,
        thread_title=thread_title,
    )


def get_rand_comment_reply_notif(
    sender_name: str, thread_title: str, reply_excerpt: str
) -> CommentReplyNotificationPreset:
    presets = [
        CommentReplyNotificationPreset(
            title="You've got a reply",
            body='{sender_name} replied to your comment: "{reply_excerpt}"',
        ),
        CommentReplyNotificationPreset(
            title="New reply to your comment",
            body='Someone replied to your comment in "{thread_title}". Check it out.',
        ),
        CommentReplyNotificationPreset(
            title="Someone replied",
            body="A user has responded to your comment — open the thread to continue.",
        ),
        CommentReplyNotificationPreset(
            title="Conversation continued",
            body='You have a new reply on "{thread_title}". Join the discussion!',
        ),
        CommentReplyNotificationPreset(
            title="See the reply to your comment",
            body="A reply was posted to your comment. Tap to view the conversation.",
        ),
    ]
    preset = random.choice(presets)
    formatted_title = preset.title.format(
        sender_name=sender_name, thread_title=thread_title, reply_excerpt=reply_excerpt
    )
    formatted_body = preset.body.format(sender_name=sender_name, thread_title=thread_title, reply_excerpt=reply_excerpt)
    return CommentReplyNotificationPreset(
        title=formatted_title,
        body=formatted_body,
        sender_name=sender_name,
        thread_title=thread_title,
        reply_excerpt=reply_excerpt,
    )


def get_rand_new_article_notif(article_title: str) -> NewArticleNotificationPreset:
    presets = [
        NewArticleNotificationPreset(
            title="New article just published",
            body='"{article_title}" is now available. Read for helpful tips and guidance.',
        ),
        NewArticleNotificationPreset(
            title="Fresh read for you",
            body='A new article matching your interests: "{article_title}".',
        ),
        NewArticleNotificationPreset(
            title="Recommended article",
            body='Check out "{article_title}" — we thought you might like this.',
        ),
        NewArticleNotificationPreset(
            title="New content alert",
            body='A new article was posted: "{article_title}". Tap to read it now.',
        ),
        NewArticleNotificationPreset(
            title="Article published",
            body='Our latest article "{article_title}" is live. Learn something new today.',
        ),
    ]
    preset = random.choice(presets)
    formatted_title = preset.title.format(article_title=article_title)
    formatted_body = preset.body.format(article_title=article_title)
    return NewArticleNotificationPreset(
        title=formatted_title,
        body=formatted_body,
        article_title=article_title,
    )


def get_rand_appointment_reminder_notif(
    appointment_time: str, appointment_date: str, provider_name: str, appointment_location: str
) -> AppointmentReminderNotificationPreset:
    presets = [
        AppointmentReminderNotificationPreset(
            title="Appointment reminder",
            body="You have an appointment at {appointment_time}. Tap for details.",
        ),
        AppointmentReminderNotificationPreset(
            title="Upcoming appointment",
            body="Reminder: your appointment on {appointment_date} at {appointment_time}.",
        ),
        AppointmentReminderNotificationPreset(
            title="Don't forget your appointment",
            body="It's almost time for your appointment at {appointment_time}. Confirm or reschedule.",
        ),
        AppointmentReminderNotificationPreset(
            title="Appointment coming up",
            body="Your appointment with {provider_name} is scheduled for {appointment_time}.",
        ),
        AppointmentReminderNotificationPreset(
            title="Appointment reminder — check details",
            body="Appointment at {appointment_time} ({appointment_location}). Tap for directions.",
        ),
    ]
    preset = random.choice(presets)
    formatted_title = preset.title.format(
        appointment_time=appointment_time,
        appointment_date=appointment_date,
        provider_name=provider_name,
        appointment_location=appointment_location,
    )
    formatted_body = preset.body.format(
        appointment_time=appointment_time,
        appointment_date=appointment_date,
        provider_name=provider_name,
        appointment_location=appointment_location,
    )
    return AppointmentReminderNotificationPreset(
        title=formatted_title,
        body=formatted_body,
        appointment_time=appointment_time,
        appointment_date=appointment_date,
        provider_name=provider_name,
        appointment_location=appointment_location,
    )


def get_rand_appointment_request_notif(sender_name: str, requested_date: str) -> AppointmentRequestNotificationPreset:
    presets = [
        AppointmentRequestNotificationPreset(
            title="Appointment request received",
            body="{sender_name} requested an appointment for {requested_date}. Open to respond.",
        ),
        AppointmentRequestNotificationPreset(
            title="New appointment request",
            body="You have a new appointment request. Review and accept or reject.",
        ),
        AppointmentRequestNotificationPreset(
            title="Someone wants to meet",
            body="{sender_name} sent an appointment request. Check availability.",
        ),
        AppointmentRequestNotificationPreset(
            title="Appointment booking request",
            body="A request to book an appointment was submitted. Tap to manage.",
        ),
        AppointmentRequestNotificationPreset(
            title="Action required: appointment request",
            body="New appointment request for {requested_date} — approve or decline.",
        ),
    ]
    preset = random.choice(presets)
    formatted_title = preset.title.format(sender_name=sender_name, requested_date=requested_date)
    formatted_body = preset.body.format(sender_name=sender_name, requested_date=requested_date)
    return AppointmentRequestNotificationPreset(
        title=formatted_title,
        body=formatted_body,
        sender_name=sender_name,
        requested_date=requested_date,
    )


def get_rand_private_message_notif(sender_name: str, message_excerpt: str) -> PrivateMessageNotificationPreset:
    presets = [
        PrivateMessageNotificationPreset(
            title="New message",
            body='You received a message from {sender_name}: "{message_excerpt}"',
        ),
        PrivateMessageNotificationPreset(
            title="New chat message",
            body="{sender_name} sent you a message. Open the chat to reply.",
        ),
        PrivateMessageNotificationPreset(
            title="You have an unread message",
            body="A message from {sender_name} is waiting for you — tap to read.",
        ),
        PrivateMessageNotificationPreset(
            title="Message received",
            body="Someone sent you a private message. Reply when you're ready.",
        ),
        PrivateMessageNotificationPreset(
            title="New direct message",
            body='New DM from {sender_name}: "{message_excerpt}". See the conversation.',
        ),
    ]
    preset = random.choice(presets)
    formatted_title = preset.title.format(sender_name=sender_name, message_excerpt=message_excerpt)
    formatted_body = preset.body.format(sender_name=sender_name, message_excerpt=message_excerpt)
    return PrivateMessageNotificationPreset(
        title=formatted_title,
        body=formatted_body,
        sender_name=sender_name,
        message_excerpt=message_excerpt,
    )
