"""
Login ID and credential generation for Dayflow HRMS.

Login ID format (14 characters): CCNNNNYYYYSSSS

    CC   -> company code   (initial of each of the first two words)
    NNNN -> employee code  (first 2 letters of first name + first 2 of last name)
    YYYY -> year of joining
    SSSS -> joining serial for that company in that year

    "Odoo India" + "Infamous Wolverine" + 2022 + 1  ->  OIINWO20220001
    "Odoo India" + "John Doe"           + 2022 + 1  ->  OIJODO20220001
"""

import re
import secrets
import string

from pymongo import ReturnDocument

# Serial is a 4-digit field, so 9999 employees per company per year.
MAX_SERIAL = 9999


def build_company_prefix(company_name: str) -> str:
    """
    Two-character company code: the initial of each of the first two words.

        "Odoo India"        -> "OI"
        "Tech Corp"         -> "TC"
        "Tata Consultancy Services" -> "TC"   (only the first two words count)

    Single-word company names fall back to their first two letters, and
    anything still shorter than two characters is padded with "X".

        "Microsoft"         -> "MI"
        "A"                 -> "AX"
    """
    words = re.findall(r"[A-Za-z0-9]+", company_name or "")

    if not words:
        return "XX"

    if len(words) == 1:
        prefix = words[0][:2]
    else:
        prefix = words[0][0] + words[1][0]

    return prefix.upper().ljust(2, "X")


def build_name_code(employee_name: str) -> str:
    """
    Four-character employee code: first two letters of the first name
    followed by the first two letters of the last name.

        "Infamous Wolverine" -> "INWO"
        "John Doe"           -> "JODO"
        "John Michael Doe"   -> "JODO"   (middle names are ignored)
        "Arjun"              -> "ARJU"   (single name -> first four letters)
        "A B"                -> "AXBX"   (short parts padded with "X")
    """
    parts = re.findall(r"[A-Za-z]+", employee_name or "")

    if not parts:
        return "XXXX"

    if len(parts) == 1:
        return parts[0][:4].upper().ljust(4, "X")

    first_letters = parts[0][:2].upper().ljust(2, "X")
    last_letters = parts[-1][:2].upper().ljust(2, "X")

    return first_letters + last_letters


def generate_login_id(
    company_name: str,
    employee_name: str,
    year: int,
    serial_number: int,
) -> str:
    """
    Build the 14-character Login ID described in the module docstring.

    Args:
        company_name: Employer name, e.g. "Odoo India".
        employee_name: Employee's full name, e.g. "Infamous Wolverine".
        year: Four-digit year of joining.
        serial_number: Joining serial for that company/year (1..9999).

    Returns:
        The generated Login ID, e.g. "OIINWO20220001".

    Raises:
        ValueError: If the year or serial number is out of range.
    """
    if not 1000 <= year <= 9999:
        raise ValueError(f"Year of joining must be a 4-digit year, got {year!r}")

    if not 1 <= serial_number <= MAX_SERIAL:
        raise ValueError(
            f"Serial number must be between 1 and {MAX_SERIAL}, got {serial_number!r}"
        )

    company_code = build_company_prefix(company_name)
    name_code = build_name_code(employee_name)

    return f"{company_code}{name_code}{year:04d}{serial_number:04d}"


def generate_random_password(length: int = 12) -> str:
    """
    Generate a cryptographically secure temporary password containing at
    least one uppercase letter, one lowercase letter, one digit and one
    special character.

    Args:
        length: Desired password length (minimum 8).

    Returns:
        The generated password.
    """
    if length < 8:
        raise ValueError("Temporary passwords must be at least 8 characters long")

    uppercase = string.ascii_uppercase
    lowercase = string.ascii_lowercase
    digits = string.digits
    special = "!@#$%^&*"

    # Guarantee one character from each class.
    password = [
        secrets.choice(uppercase),
        secrets.choice(lowercase),
        secrets.choice(digits),
        secrets.choice(special),
    ]

    all_chars = uppercase + lowercase + digits + special
    password += [secrets.choice(all_chars) for _ in range(length - len(password))]

    secrets.SystemRandom().shuffle(password)

    return "".join(password)


def company_counter_key(company_name: str, year: int) -> str:
    """
    Build the `counters` document _id for a company's joining serial in a
    given year. Company names are slugified so that "Odoo India",
    "odoo  india" and "Odoo-India" all share one sequence.
    """
    slug = re.sub(r"[^a-z0-9]+", "-", (company_name or "").strip().lower()).strip("-")
    return f"login_serial:{slug or 'unknown'}:{year}"


async def get_next_serial_number(db, company_name: str, year: int) -> int:
    """
    Atomically reserve the next joining serial for a company in a given year.

    This uses a single `find_one_and_update` with `$inc` on a dedicated
    `counters` collection, so two admins onboarding employees at the same
    moment can never receive the same serial. Counters are scoped per
    company, so each employer gets its own 0001..9999 sequence per year.

    Note that serials are reserved, not recycled: deleting an employee does
    not free their number. That is deliberate — reusing a serial would let
    two people share a historical Login ID.

    Args:
        db: Motor database instance.
        company_name: Employer name, used to scope the sequence.
        year: Year of joining.

    Returns:
        The reserved serial number.

    Raises:
        ValueError: If the company has exhausted 9999 serials for that year.
    """
    counter = await db.counters.find_one_and_update(
        {"_id": company_counter_key(company_name, year)},
        {"$inc": {"seq": 1}},
        upsert=True,
        return_document=ReturnDocument.AFTER,
    )

    serial = int(counter["seq"])

    if serial > MAX_SERIAL:
        raise ValueError(
            f"Serial number limit reached for {company_name!r} in {year}. "
            f"Maximum {MAX_SERIAL} employees per company per year."
        )

    return serial
