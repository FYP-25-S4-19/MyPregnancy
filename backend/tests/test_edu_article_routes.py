import uuid

import pytest
from fastapi import status
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.db_schema import Admin, EduArticle, EduArticleCategory, Nutritionist, PregnantWoman, VolunteerDoctor


async def _create_category(db_session: AsyncSession, label: str) -> EduArticleCategory:
    category = EduArticleCategory(label=label)
    db_session.add(category)
    await db_session.flush()
    return category


# =========================================================================
# ========================== GET ARTICLES =================================
# =========================================================================
@pytest.mark.asyncio
async def test_get_articles_by_category_success(client: AsyncClient, db_session: AsyncSession) -> None:
    cat_nutrition = await _create_category(db_session, "Nutrition")
    cat_body = await _create_category(db_session, "Body")

    db_session.add_all(
        [
            EduArticle(
                author_id=None,
                category_id=cat_nutrition.id,
                title=str(uuid.uuid4()),
                content_markdown="",
                trimester=1,
            ),
            EduArticle(
                author_id=None,
                category_id=cat_body.id,
                title=str(uuid.uuid4()),
                content_markdown="",
                trimester=2,
            ),
        ]
    )
    await db_session.commit()

    for label in ("Nutrition", "Body"):
        response = await client.get(f"/articles/?category={label}")
        assert response.status_code == status.HTTP_200_OK

        all_articles = response.json()
        assert isinstance(all_articles, list)
        assert len(all_articles) >= 1

        article = all_articles[0]
        assert isinstance(article["id"], int)
        assert isinstance(article["title"], str)
        assert article["category"] == label
        assert isinstance(article["excerpt"], str)
        assert isinstance(article["trimester"], int)


@pytest.mark.asyncio
async def test_get_articles_by_nonexistent_category_failure(client: AsyncClient) -> None:
    response = await client.get("/articles/?category=THERES_NO_WAY_THIS_CATEGORY_EXISTS_KEYBOARD_MASHING_ALFIJLEAIJFL")
    assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.asyncio
async def test_get_article_detailed_success(
    authenticated_doctor_client: tuple[AsyncClient, VolunteerDoctor], db_session: AsyncSession
) -> None:
    client, doctor = authenticated_doctor_client

    cat = await _create_category(db_session, "Nutrition")

    article_title: str = "5 dishes that will blow your (pregnancy) socks off"
    article_content: str = "Fish, fish, a rice cake, fish and a rice cake, and fish"

    article = EduArticle(
        author_id=doctor.id,
        category_id=cat.id,
        title=article_title,
        content_markdown=article_content,
        trimester=2,
    )
    db_session.add(article)
    await db_session.commit()

    response = await client.get(f"/articles/{article.id}")
    assert response.status_code == status.HTTP_200_OK

    data = response.json()
    assert str(data["id"]) == str(article.id)
    assert str(data["author_id"]) == str(doctor.id)
    assert data["category"] == "Nutrition"
    assert data["title"] == article_title
    assert data["content_markdown"] == article_content


@pytest.mark.asyncio
async def test_get_article_detailed_invalid_id(client: AsyncClient) -> None:
    response = await client.get("/articles/1337")
    assert response.status_code == status.HTTP_404_NOT_FOUND


# ==========================================================================
# ========================== CREATE ARTICLES ===============================
# ==========================================================================
@pytest.mark.asyncio
async def test_create_article_success(
    authenticated_doctor_client: tuple[AsyncClient, VolunteerDoctor],
    db_session: AsyncSession,
) -> None:
    client, doctor = authenticated_doctor_client

    cat = await _create_category(db_session, "Baby")
    await db_session.commit()

    response = await client.post(
        "/articles/",
        data={
            "category_id": cat.id,
            "title": "1st Trimester Guide",
            "content_markdown": "Le random content",
            "trimester": 1,
        },
    )
    assert response.status_code == status.HTTP_201_CREATED

    result = await db_session.execute(select(EduArticle).where(EduArticle.title == "1st Trimester Guide"))
    article = result.scalars().one_or_none()

    assert article is not None, "Article should be created in database"
    assert article.author_id == doctor.id
    assert article.category_id == cat.id
    assert article.content_markdown == "Le random content"
    assert article.trimester == 1


@pytest.mark.asyncio
async def test_unregistered_create_article_fail(
    client: AsyncClient,
) -> None:
    response = await client.post(
        "/articles/",
        data={
            "category_id": 1,
            "title": "1st Trimester Guide",
            "content_markdown": "Le random content",
            "trimester": 1,
        },
    )
    assert response.status_code == status.HTTP_401_UNAUTHORIZED, (
        "Unauthenticated user should NOT have permissions to create article"
    )


@pytest.mark.asyncio
async def test_create_article_fail_due_to_duplicate(
    authenticated_doctor_client: tuple[AsyncClient, VolunteerDoctor],
    db_session: AsyncSession,
) -> None:
    client, doctor = authenticated_doctor_client

    cat = await _create_category(db_session, "Nutrition")

    article_title: str = "1st Trimester Guide"
    article_content: str = "Le random content"

    article = EduArticle(
        author_id=doctor.id,
        category_id=cat.id,
        title=article_title,
        content_markdown=article_content,
        trimester=1,
    )
    db_session.add(article)
    await db_session.commit()

    response = await client.post(
        "/articles/",
        data={
            "title": article_title,
            "category_id": cat.id,
            "content_markdown": article_content,
            "trimester": 1,
        },
    )
    assert response.status_code == status.HTTP_409_CONFLICT, "Article already exists, there should be a conflict"


@pytest.mark.asyncio
async def test_admin_create_article_fail(
    authenticated_admin_client: tuple[AsyncClient, Admin],
) -> None:
    client, _ = authenticated_admin_client
    response = await client.post(
        "/articles/",
        data={
            "title": "1st Trimester Guide",
            "category_id": 1,
            "content_markdown": "Le random content",
            "trimester": 1,
        },
    )
    assert response.status_code == status.HTTP_403_FORBIDDEN, "Admin user should NOT have permissions to create article"


@pytest.mark.asyncio
async def test_pregnant_woman_create_article_fail(
    authenticated_pregnant_woman_client: tuple[AsyncClient, PregnantWoman],
) -> None:
    client, _ = authenticated_pregnant_woman_client
    response = await client.post(
        "/articles/",
        data={
            "title": "1st Trimester Guide",
            "category_id": 1,
            "content_markdown": "Le random content",
            "trimester": 1,
        },
    )
    assert response.status_code == status.HTTP_403_FORBIDDEN, (
        "Pregnant women should NOT have permissions to create article"
    )


@pytest.mark.asyncio
async def test_nutritionist_create_article_success(
    authenticated_nutritionist_client: tuple[AsyncClient, Nutritionist],
    db_session: AsyncSession,
) -> None:
    client, _ = authenticated_nutritionist_client

    cat = await _create_category(db_session, "Nutrition")
    await db_session.commit()

    response = await client.post(
        "/articles/",
        data={
            "title": "1st Trimester Guide",
            "category_id": cat.id,
            "content_markdown": "Le random content",
            "trimester": 1,
        },
    )
    assert response.status_code == status.HTTP_201_CREATED


# ==========================================================================
# ========================= DELETE ARTICLES ================================
# ==========================================================================
@pytest.mark.asyncio
async def test_unregistered_delete_article_fail(client: AsyncClient, db_session: AsyncSession) -> None:
    cat = await _create_category(db_session, "Body")
    article = EduArticle(
        author_id=None,
        category_id=cat.id,
        title="Exercises that will make you strong enough to lift a small car",
        content_markdown="Bodyweight push-ups, pilates",
        trimester=1,
    )
    db_session.add(article)
    await db_session.commit()
    article_id = article.id

    response = await client.delete(f"/articles/{article_id}")
    assert response.status_code == status.HTTP_401_UNAUTHORIZED

    edu_article = await db_session.get(EduArticle, article_id)
    assert edu_article is not None, "Article should be still exist"


@pytest.mark.asyncio
async def test_delete_article_success(
    authenticated_doctor_client: tuple[AsyncClient, VolunteerDoctor], db_session: AsyncSession
) -> None:
    client, doctor = authenticated_doctor_client
    cat = await _create_category(db_session, "Body")
    article = EduArticle(
        author_id=doctor.id,
        category_id=cat.id,
        title="Exercises that will make you strong enough to lift a small car",
        content_markdown="Bodyweight push-ups, pilates",
        trimester=1,
    )
    db_session.add(article)
    await db_session.commit()
    article_id = article.id

    response = await client.delete(f"/articles/{article_id}")
    assert response.status_code == status.HTTP_204_NO_CONTENT, "Article should be deleted successfully"

    edu_article = await db_session.get(EduArticle, article_id)
    assert edu_article is None, "Article should be 'None'"


@pytest.mark.asyncio
async def test_delete_article_not_authorized(
    authenticated_doctor_client: tuple[AsyncClient, VolunteerDoctor], db_session: AsyncSession
) -> None:
    client, _ = authenticated_doctor_client

    cat = await _create_category(db_session, "Body")

    # The article is created by some "random" UUID
    # So when you try to delete it using the authenticated "client" above - it should rightfully fail
    article = EduArticle(
        author_id=None,
        category_id=cat.id,
        title="Exercises that will make you strong enough to lift a small car",
        content_markdown="Bodyweight push-ups, pilates",
        trimester=1,
    )
    db_session.add(article)
    await db_session.commit()
    article_id = article.id

    response = await client.delete(f"/articles/{article_id}")
    assert response.status_code == status.HTTP_403_FORBIDDEN

    edu_article = await db_session.get(EduArticle, article_id)
    assert edu_article is not None, "Article should be still exist"


@pytest.mark.asyncio
async def test_delete_nonexistent_article(
    authenticated_doctor_client: tuple[AsyncClient, VolunteerDoctor],
) -> None:
    client, _ = authenticated_doctor_client

    response = await client.delete("/articles/3275")
    assert response.status_code == status.HTTP_404_NOT_FOUND, "Article should not exist"
