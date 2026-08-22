"""
Verification for the Dayflow Login ID generator.

Run from the backend/ directory:

    python tests/test_login_id.py

Or with pytest:

    pytest tests/test_login_id.py -v

Every expectation below is taken from the design board: a Login ID is
CC + NNNN + YYYY + SSSS, where CC is the initial of each of the first two
words of the company name ("Odoo India" -> OI).
"""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.utils.generators import (  # noqa: E402
    build_company_prefix,
    build_name_code,
    company_counter_key,
    generate_login_id,
    generate_random_password,
)

# (company, employee, year, serial, expected)
LOGIN_ID_CASES = [
    # The case from the design board
    ("Odoo India", "Infamous Wolverine", 2022, 1, "OIINWO20220001"),
    # The worked example in the spec
    ("Odoo India", "John Doe", 2022, 1, "OIJODO20220001"),
    # Single-word company falls back to first two letters
    ("Microsoft", "Satya Nadella", 2024, 1, "MISANA20240001"),
    # Single-letter first word still yields two characters
    ("A Solutions", "Li Wang", 2024, 1, "ASLIWA20240001"),
    # Middle names are ignored; first + last only
    ("Tech Corp", "John Michael Doe", 2024, 1, "TCJODO20240001"),
    # Employee with only one name -> first four letters
    ("Tech Corp", "Arjun", 2024, 5, "TCARJU20240005"),
    # Short parts are padded with X
    ("A", "A B", 2024, 1, "AXAXBX20240001"),
    # Only the first two words of a longer company name count
    ("Tata Consultancy Services", "Rahul Kumar", 2024, 42, "TCRAKU20240042"),
    # Serial padding at the top of the range
    ("Odoo India", "Priya Sharma", 2024, 9999, "OIPRSH20249999"),
]


def test_login_ids():
    for company, employee, year, serial, expected in LOGIN_ID_CASES:
        actual = generate_login_id(company, employee, year, serial)
        assert actual == expected, (
            f"{company!r} + {employee!r} ({year}, {serial}): "
            f"expected {expected}, got {actual}"
        )
        assert len(actual) == 14, f"{actual} should be 14 characters"


def test_company_prefix_uses_initials_not_first_two_letters():
    """The original bug: "Odoo India" produced "OD" instead of "OI"."""
    assert build_company_prefix("Odoo India") == "OI"
    assert build_company_prefix("Tech Corp") == "TC"
    assert build_company_prefix("odoo  india") == "OI"  # whitespace tolerant
    assert build_company_prefix("Odoo-India") == "OI"  # punctuation tolerant
    assert build_company_prefix("") == "XX"


def test_name_code():
    assert build_name_code("Infamous Wolverine") == "INWO"
    assert build_name_code("Priya Sharma") == "PRSH"
    assert build_name_code("Raj Singh") == "RASI"
    assert build_name_code("Arvind Krishna") == "ARKR"
    assert build_name_code("") == "XXXX"


def test_counter_keys_are_scoped_per_company_and_year():
    a = company_counter_key("Odoo India", 2024)
    b = company_counter_key("Tech Corp", 2024)
    c = company_counter_key("Odoo India", 2025)
    assert a != b, "different companies must not share a serial sequence"
    assert a != c, "different years must not share a serial sequence"
    # Same company written differently must share one sequence
    assert company_counter_key("odoo  india", 2024) == a


def test_out_of_range_inputs_are_rejected():
    for bad_serial in (0, -1, 10000):
        try:
            generate_login_id("Odoo India", "John Doe", 2024, bad_serial)
        except ValueError:
            pass
        else:
            raise AssertionError(f"serial {bad_serial} should have been rejected")


def test_temp_password_strength():
    for _ in range(200):
        pw = generate_random_password(12)
        assert len(pw) == 12
        assert any(c.isupper() for c in pw)
        assert any(c.islower() for c in pw)
        assert any(c.isdigit() for c in pw)
        assert any(c in "!@#$%^&*" for c in pw)


if __name__ == "__main__":
    print("Login ID generation")
    print("-" * 72)
    for company, employee, year, serial, expected in LOGIN_ID_CASES:
        actual = generate_login_id(company, employee, year, serial)
        flag = "ok  " if actual == expected else "FAIL"
        print(f"{flag} {company:26} {employee:20} {year} {serial:>4}  ->  {actual}")
    print("-" * 72)

    failures = 0
    for name, fn in sorted(globals().items()):
        if name.startswith("test_") and callable(fn):
            try:
                fn()
                print(f"PASS  {name}")
            except AssertionError as exc:
                failures += 1
                print(f"FAIL  {name}: {exc}")

    print("-" * 72)
    print("All checks passed." if not failures else f"{failures} check(s) failed.")
    sys.exit(1 if failures else 0)
