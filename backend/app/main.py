from fastapi import Depends, FastAPI, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.docs import get_redoc_html, get_swagger_ui_html
from fastapi.openapi.utils import get_openapi
from fastapi.responses import HTMLResponse, UJSONResponse
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from sqlalchemy.exc import IntegrityError
from starlette.middleware.sessions import SessionMiddleware
from starlette.responses import JSONResponse

from app.core.settings import settings
from app.core.users_manager import auth_backend, fastapi_users
from app.features.accounts.account_router import account_router
from app.features.appointments.appointment_router import appointments_router
from app.features.community_threads.thread_router import community_threads_router
from app.features.educational_articles.edu_article_router import edu_articles_router
from app.features.recipes.recipe_router import recipe_router
from app.features.getstream.stream_router import stream_router
from app.features.journal.journal_router import journal_router
from app.features.miscellaneous.misc_routes import misc_router
from app.schemas import UserCreate, UserRead, UserUpdate

if not settings.APP_ENV:
    raise ValueError("APP_ENV is not set in environment variables")

APP_TITLE: str = "MyPregnancy API"
app = (
    FastAPI(title=APP_TITLE, docs_url=None, redoc_url=None, openapi_url=None, default_response_class=UJSONResponse)
    if (
        (settings.DOCS_USERNAME and len(settings.DOCS_USERNAME) > 1)
        and (settings.DOCS_PASSWORD and len(settings.DOCS_PASSWORD) > 1)
        and settings.APP_ENV != "dev"  # Unless explicitly set to dev....will protect the docs
    )
    else FastAPI(title=APP_TITLE)
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(
    fastapi_users.get_auth_router(auth_backend),
    prefix="/auth/jwt",
    tags=["Auth"],
)
app.include_router(
    fastapi_users.get_register_router(UserRead, UserCreate),
    prefix="/auth",
    tags=["Auth"],
)
app.include_router(
    fastapi_users.get_users_router(UserRead, UserUpdate),
    prefix="/users",
    tags=["Users"],
)
app.include_router(edu_articles_router)
app.include_router(appointments_router)
app.include_router(journal_router)
app.include_router(account_router)
app.include_router(stream_router)
app.include_router(recipe_router)
app.include_router(community_threads_router)
app.include_router(misc_router)
app.add_middleware(SessionMiddleware, secret_key=settings.SECRET_KEY)


# ============================================================================
# ======================= GLOBAL EXCEPTION HANDLERS ==========================
# ============================================================================
@app.exception_handler(IntegrityError)
async def integrity_error_handler(_: Request, e: IntegrityError):
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": f"Integrity error: {e}"},
    )


@app.exception_handler(Exception)
async def general_exception_handler(_: Request, e: Exception):
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": f"An unexpected error has occurred, {e}"},
    )


# ===========================================================================
# ==================== PASSWORD-PROTECT API ENDPOINTS =======================
# ===========================================================================
security = HTTPBasic()


def require_basic_auth(credentials: HTTPBasicCredentials = Depends(security)):
    username_is_correct: bool = credentials.username == settings.DOCS_USERNAME
    password_is_correct: bool = credentials.password == settings.DOCS_PASSWORD
    if not (username_is_correct and password_is_correct):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Basic"},
        )


@app.get("/docs", response_class=HTMLResponse, include_in_schema=False, dependencies=[Depends(require_basic_auth)])
async def protected_docs():
    return get_swagger_ui_html(openapi_url="/openapi.json", title="docs")


@app.get(
    "/openapi.json", response_class=JSONResponse, include_in_schema=False, dependencies=[Depends(require_basic_auth)]
)
async def protected_openapi_json():
    return JSONResponse(get_openapi(title=app.title, version=app.version, routes=app.routes))


@app.get("/redoc", response_class=HTMLResponse, include_in_schema=False, dependencies=[Depends(require_basic_auth)])
async def protected_redocs():
    return get_redoc_html(openapi_url="/openapi.json", title="docs")
