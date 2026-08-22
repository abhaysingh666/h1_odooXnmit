from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.errors import DuplicateKeyError, OperationFailure

from .config import settings

# MongoDB client
client: AsyncIOMotorClient = None


def get_database():
    """Get database instance"""
    return client[settings.DB_NAME]


async def connect_to_mongo():
    """Create database connection"""
    global client
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    print("✅ Connected to MongoDB")


async def create_indexes():
    """
    Create the indexes the application relies on.

    The unique indexes on `login_id` and `email_id` are the safety net behind
    Login ID generation: even if two requests race, MongoDB rejects the second
    insert instead of silently creating two users with the same credentials.

    If the collection already contains duplicates, index creation fails. We log
    that instead of crashing so an existing dev database can still boot — but
    the duplicates must be cleaned up before the constraint takes effect.
    """
    db = get_database()

    indexes = [
        # --- Users ---------------------------------------------------------
        ("users", "login_id", {"unique": True, "name": "uniq_login_id"}),
        ("users", "email_id", {"unique": True, "name": "uniq_email_id"}),
        ("users", "company_name", {"name": "idx_company_name"}),
        ("users", "registration_token", {"sparse": True, "name": "idx_registration_token"}),
        ("users", [("company_name", 1), ("job.department", 1)], {"name": "idx_company_department"}),
        # --- Attendance ----------------------------------------------------
        # One record per employee per day; the unique index is what makes
        # check-in idempotent even if the button is double-clicked.
        (
            "attendance",
            [("user_id", 1), ("day", 1)],
            {"unique": True, "name": "uniq_attendance_user_day"},
        ),
        ("attendance", [("company_name", 1), ("day", -1)], {"name": "idx_attendance_company_day"}),
        # --- Leaves --------------------------------------------------------
        ("leaves", [("user_id", 1), ("start_date", -1)], {"name": "idx_leaves_user_start"}),
        ("leaves", [("company_name", 1), ("status", 1)], {"name": "idx_leaves_company_status"}),
        (
            "leaves",
            [("company_name", 1), ("start_date", 1), ("end_date", 1)],
            {"name": "idx_leaves_company_range"},
        ),
        # --- Payroll -------------------------------------------------------
        ("payroll", "user_id", {"unique": True, "name": "uniq_payroll_user"}),
        ("payroll", "company_name", {"name": "idx_payroll_company"}),
    ]

    for collection, keys, options in indexes:
        try:
            await db[collection].create_index(keys, **options)
        except (DuplicateKeyError, OperationFailure) as exc:
            print(
                f"⚠️  Could not create index {options['name']} on "
                f"{collection}: {exc}"
            )

    print("✅ Indexes ensured")


async def close_mongo_connection():
    """Close database connection"""
    global client
    if client:
        client.close()
        print("❌ Closed MongoDB connection")
