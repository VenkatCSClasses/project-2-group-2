from fastapi import APIRouter

# Import all of the routers from the different route files
from .account_routes import router as account_router
from .auth_routes import router as auth_router
from .comments_routes import router as comments_router
from .global_routes import router as global_router
from .items_routes import router as items_router
from .posts_routes import router as post_router
from .vote_routes import router as vote_router

router = APIRouter()

# Mount the routers for different route groups
router.include_router(global_router, tags=["global"]) # Mount global routes at "/"
router.include_router(account_router, prefix="/accounts", tags=["accounts"])
router.include_router(auth_router, prefix="/auth", tags=["auth"])
router.include_router(items_router, prefix="/items", tags=["items"])
router.include_router(post_router, prefix="/posts", tags=["posts"])
router.include_router(comments_router, prefix="/posts", tags=["comments"])
router.include_router(vote_router, prefix="/posts", tags=["votes"])
